'use client'

import { useState, useTransition } from 'react'
import { deleteTransaction } from './actions'

type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  transaction_date: string
}

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(n)

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[]
}) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteTransaction(id)
      setDeletingId(null)
    })
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
        No transactions yet — add your first one on the left.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                {new Date(t.transaction_date).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.type === 'income'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {t.category}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {t.description || '—'}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                  t.type === 'income' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatNaira(t.amount)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={isPending && deletingId === t.id}
                  className="text-xs font-medium text-slate-400 hover:text-red-600 disabled:opacity-50"
                >
                  {isPending && deletingId === t.id ? '...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
