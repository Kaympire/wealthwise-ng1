'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function setBudget(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const category = formData.get('category') as string
  const monthlyLimit = Number(formData.get('monthlyLimit'))

  if (!category || !monthlyLimit || monthlyLimit <= 0) {
    return { error: 'Please provide a category and a valid amount.' }
  }

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      category,
      monthly_limit: monthlyLimit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,category' }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBudget(budgetId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
