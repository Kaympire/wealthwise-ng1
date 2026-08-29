import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '../login/actions'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import SummaryCards from './SummaryCards'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, type, amount, category, description, transaction_date')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  const safeTransactions = transactions ?? []

  const totalIncome = safeTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = safeTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome, {user.user_metadata?.full_name ?? user.email}
            </h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <form action={signout}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </form>
        </div>

        <SummaryCards totalIncome={totalIncome} totalExpenses={totalExpenses} />

        {error && (
          <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            Could not load transactions: {error.message}. Make sure the
            transactions table has been created in Supabase (see
            supabase/migrations/001_transactions.sql).
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TransactionForm />
          </div>
          <div className="lg:col-span-2">
            <TransactionList transactions={safeTransactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
