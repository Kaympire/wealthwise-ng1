'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { exchangeToken, getAccountDetails, getTransactions } from '@/utils/mono/client'

export async function connectBankAccount(monoCode: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  try {
    const accountId = await exchangeToken(monoCode)
    const details = await getAccountDetails(accountId)

    const { error } = await supabase.from('bank_accounts').insert({
      user_id: user.id,
      mono_account_id: accountId,
      institution_name: details?.institution?.name ?? 'Connected bank',
      account_number: details?.accountNumber ?? null,
      account_type: details?.type ?? null,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to connect bank account.' }
  }
}

export async function syncBankTransactions(bankAccountId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { data: bankAccount, error: fetchError } = await supabase
    .from('bank_accounts')
    .select('id, mono_account_id, user_id')
    .eq('id', bankAccountId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !bankAccount) {
    return { error: 'Bank account not found.' }
  }

  try {
    const transactions = await getTransactions(bankAccount.mono_account_id)

    const rows = transactions.map((t) => ({
      user_id: user.id,
      type: t.type === 'credit' ? 'income' : 'expense',
      amount: t.amount / 100,
      category: mapMonoCategory(t.category),
      description: t.narration,
      transaction_date: t.date.split('T')[0],
      source: 'mono' as const,
      external_id: t.id,
      bank_account_id: bankAccount.id,
    }))

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('transactions')
        .upsert(rows, { onConflict: 'external_id', ignoreDuplicates: true })

      if (insertError) {
        return { error: insertError.message }
      }
    }

    await supabase
      .from('bank_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', bankAccount.id)

    revalidatePath('/dashboard')
    return { success: true, count: rows.length }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to sync transactions.' }
  }
}

export async function disconnectBankAccount(bankAccountId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', bankAccountId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

function mapMonoCategory(category: string): string {
  const map: Record<string, string> = {
    transfer: 'Transfer',
    bank_charges: 'Bank Charges',
    bills_and_utilities: 'Utilities',
    entertainment: 'Entertainment',
    food_and_drink: 'Food',
    transportation: 'Transport',
    shopping: 'Shopping',
    salary: 'Salary',
    unknown: 'Other',
  }
  return map[category] ?? 'Other'
}
