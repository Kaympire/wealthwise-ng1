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
  const amount = Number(formData.get('amount'))
  let category = formData.get('category') as string
  const customCategory = formData.get('customCategory') as string
  const description = formData.get('description') as string
  const transactionDate = formData.get('transactionDate') as string

  if (category === 'Other' && customCategory?.trim()) {
    category = customCategory.trim()
  }

  if (!type || !amount || amount <= 0 || !category) {
    return { error: 'Please fill in all required fields with valid values.' }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type,
    amount,
    category,
    description: description || null,
    transaction_date: transactionDate || new Date().toISOString().slice(0, 10),
    source: 'manual',
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
