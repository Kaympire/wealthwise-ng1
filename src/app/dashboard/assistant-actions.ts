'use server'

import { createClient } from '@/utils/supabase/server'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function askFinancialAssistant(conversation: ChatMessage[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { error: 'AI assistant is not configured yet.' }
  }

  // Pull the user's real financial data to ground the assistant's answers
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, category, description, transaction_date, source')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .limit(150)

  const { data: budgets } = await supabase
    .from('budgets')
    .select('category, monthly_limit')
    .eq('user_id', user.id)

  const safeTransactions = transactions ?? []
  const safeBudgets = budgets ?? []

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const currentMonthKey = today.slice(0, 7)

  const totalIncome = safeTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = safeTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const spendingByCategoryThisMonth: Record<string, number> = {}
  for (const t of safeTransactions) {
    if (t.type !== 'expense') continue
    if (t.transaction_date.slice(0, 7) !== currentMonthKey) continue
    spendingByCategoryThisMonth[t.category] =
      (spendingByCategoryThisMonth[t.category] ?? 0) + Number(t.amount)
  }

  const transactionLines = safeTransactions
    .map(
      (t) =>
        `${t.transaction_date} | ${t.type} | ${t.category} | ₦${Number(t.amount).toFixed(2)} | ${
          t.description ?? 'no description'
        } | source: ${t.source}`
    )
    .join('\n')

  const budgetLines =
    safeBudgets.length > 0
      ? safeBudgets
          .map((b) => {
            const spent = spendingByCategoryThisMonth[b.category] ?? 0
            return `${b.category}: limit ₦${Number(b.monthly_limit).toFixed(
              2
            )}, spent this month ₦${spent.toFixed(2)}`
          })
          .join('\n')
      : 'No budgets have been set yet.'

  const systemPrompt = `You are the financial assistant inside WealthWise NG, a personal finance app for a user in Nigeria. Answer questions about the user's finances using ONLY the data provided below — never invent numbers. Amounts are in Naira (₦). Today's date is ${today}.

SUMMARY (across the last ${safeTransactions.length} recorded transactions):
- Total income: ₦${totalIncome.toFixed(2)}
- Total expenses: ₦${totalExpenses.toFixed(2)}
- Balance: ₦${(totalIncome - totalExpenses).toFixed(2)}

BUDGETS AND CURRENT-MONTH SPEND:
${budgetLines}

RECENT TRANSACTIONS (most recent first):
${transactionLines || 'No transactions recorded yet.'}

Guidelines:
- Be concise and direct. Lead with the number or answer, then a brief explanation if useful.
- If the data doesn't contain enough information to answer precisely, say so honestly rather than guessing.
- You may give light budgeting suggestions if asked, but do not give formal financial, tax, or investment advice — this is a personal finance tracking tool, not a licensed advisor.
- Format currency as ₦X,XXX.XX.`

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversation.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Anthropic API error (${res.status}): ${body}`)
    }

    const data = await res.json()
    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a response."

    return { success: true, reply }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'The assistant is temporarily unavailable.',
    }
  }
}
