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

  const cards = [
    { label: 'Total Income', value: totalIncome, color: 'text-emerald-600' },
    { label: 'Total Expenses', value: totalExpenses, color: 'text-red-600' },
    {
      label: 'Balance',
      value: balance,
      color: balance >= 0 ? 'text-slate-900' : 'text-red-600',
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{formatNaira(c.value)}</p>
        </div>
      ))}
    </div>
  )
}
