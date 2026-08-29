const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(n)

export default function SummaryCards({
  totalIncome,
  totalExpenses,
}: {
  totalIncome: number
  totalExpenses: number
}) {
  const balance = totalIncome - totalExpenses

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Total Income</p>
        <p className="mt-1 text-2xl font-semibold text-green-700">
          {formatNaira(totalIncome)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Total Expenses</p>
        <p className="mt-1 text-2xl font-semibold text-red-700">
          {formatNaira(totalExpenses)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Balance</p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            balance >= 0 ? 'text-slate-900' : 'text-red-700'
          }`}
        >
          {formatNaira(balance)}
        </p>
      </div>
    </div>
  )
}
