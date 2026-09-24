import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '../login/actions'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import SummaryCards from './SummaryCards'
import BankAccountsPanel from './BankAccountsPanel'
import BudgetsPanel from './BudgetsPanel'
import CategoryBreakdownChart from './CategoryBreakdownChart'
import MonthlyTrendChart from './MonthlyTrendChart'
import FinancialAssistant from './FinancialAssistant'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, type, amount, category, description, transaction_date')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  const safeTransactions = transactions ?? []

  const { data: bankAccounts } = await supabase
    .from('bank_accounts')
    .select('id, institution_name, account_number, last_synced_at')
    .order('created_at', { ascending: false })

  const totalIncome = safeTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = safeTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const { data: budgets } = await supabase
    .from('budgets')
    .select('id, category, monthly_limit')
    .order('category', { ascending: true })

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const spendingByCategory: Record<string, number> = {}
  for (const t of safeTransactions) {
    if (t.type !== 'expense') continue
    const monthKey = t.transaction_date.slice(0, 7)
    if (monthKey !== currentMonthKey) continue
    spendingByCategory[t.category] = (spendingByCategory[t.category] ?? 0) + Number(t.amount)
  }

  const monthBuckets: { key: string; month: string; income: number; expenses: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthBuckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleDateString('en-NG', { month: 'short' }),
      income: 0,
      expenses: 0,
    })
  }
  const bucketByKey = Object.fromEntries(monthBuckets.map((b) => [b.key, b]))
  for (const t of safeTransactions) {
    const monthKey = t.transaction_date.slice(0, 7)
    const bucket = bucketByKey[monthKey]
    if (!bucket) continue
    if (t.type === 'income') bucket.income += Number(t.amount)
    else bucket.expenses += Number(t.amount)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
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

        <div className="mb-6">
          <FinancialAssistant />
        </div>

        <div className="mb-6">
          <BankAccountsPanel
            bankAccounts={bankAccounts ?? []}
            monoPublicKey={process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY ?? ''}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoryBreakdownChart spendingByCategory={spendingByCategory} />
          <MonthlyTrendChart data={monthBuckets} />
        </div>

        <div className="mb-6">
          <BudgetsPanel budgets={budgets ?? []} spendingByCategory={spendingByCategory} />
        </div>

        <div className="mb-6">
          <TransactionForm />
        </div>

        <TransactionList transactions={safeTransactions} />
      </div>
    </div>
  )
}
