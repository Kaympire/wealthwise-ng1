'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string)
  const categoryPreset = formData.get('category') as string
  const customCategory = (formData.get('customCategory') as string) ?? ''
  const description = (formData.get('description') as string) ?? ''
  const transaction_date = formData.get('transaction_date') as string

  const category =
    categoryPreset === 'Other' && customCategory.trim()
      ? customCategory.trim()
      : categoryPreset

  if (!type || !['income', 'expense'].includes(type)) {
    return { error: 'Invalid transaction type.' }
  }
  if (!amount || amount <= 0) {
    return { error: 'Amount must be greater than 0.' }
  }
  if (!category) {
    return { error: 'Category is required.' }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type,
    amount,
    category,
    description,
    transaction_date: transaction_date || new Date().toISOString().split('T')[0],
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
