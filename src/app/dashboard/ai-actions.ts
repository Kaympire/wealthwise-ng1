'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { ALL_CATEGORIES } from './categories'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

type TransactionForAI = {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string | null
}

async function classifyBatch(
  transactions: TransactionForAI[]
): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const prompt = `You are categorizing Nigerian personal finance transactions.
For each transaction below, pick the single best-fit category from this exact list:
${ALL_CATEGORIES.join(', ')}

Transactions:
${transactions
  .map(
    (t, i) =>
      `${i + 1}. id=${t.id} | type=${t.type} | amount=₦${t.amount} | description="${
        t.description ?? '(no description)'
      }"`
  )
  .join('\n')}

Respond with ONLY a JSON object mapping each transaction id to its chosen category, nothing else, no markdown fences. Example format:
{"abc-123": "Food", "def-456": "Transport"}`

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
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${body}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? '{}'
  const cleaned = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error('Could not parse AI categorization response.')
  }
}

export async function categorizeTransaction(transactionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, amount, description')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !transaction) {
    return { error: 'Transaction not found.' }
  }

  try {
    const result = await classifyBatch([transaction])
    const category = result[transaction.id]

    if (!category || !ALL_CATEGORIES.includes(category)) {
      return { error: 'AI could not determine a confident category.' }
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ category })
      .eq('id', transactionId)
      .eq('user_id', user.id)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath('/dashboard')
    return { success: true, category }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Categorization failed.' }
  }
}

export async function categorizeAllUncategorized() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { data: transactions, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, amount, description')
    .eq('user_id', user.id)
    .eq('category', 'Other')
    .limit(20)

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!transactions || transactions.length === 0) {
    return { success: true, count: 0 }
  }

  try {
    const result = await classifyBatch(transactions)

    let updated = 0
    for (const t of transactions) {
      const category = result[t.id]
      if (category && ALL_CATEGORIES.includes(category) && category !== 'Other') {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category })
          .eq('id', t.id)
          .eq('user_id', user.id)

        if (!updateError) updated++
      }
    }

    revalidatePath('/dashboard')
    return { success: true, count: updated }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Categorization failed.' }
  }
}
