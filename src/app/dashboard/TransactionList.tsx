'use client'

import { useState, useTransition } from 'react'
import { deleteTransaction } from './actions'
import { categorizeTransaction, categorizeAllUncategorized } from './ai-actions'

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
  const [categorizingId, setCategorizingId] = useState<string | null>(null)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)

  const uncategorizedCount = transactions.filter((t) => t.category === 'Other').length

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteTransaction(id)
      setDeletingId(null)
    })
  }

  async function handleCategorize(id: string) {
    setCategorizingId(id)
    setAiMessage(null)
    const result = await categorizeTransaction(id)
    setCategorizingId(null)
    if (result?.error) {
      setAiMessage(result.error)
    }
  }

  async function handleBulkCategorize() {
    setBulkRunning(true)
    setAiMessage(null)
    const result = await categorizeAllUncategorized()
    setBulkRunning(false)
    if (result?.error) {
      setAiMessage(result.error)
    } else {
      setAiMessage(
        result?.count
          ? `AI categorized ${result.count} transaction(s).`
          : 'No transactions needed categorizing.'
      )
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
        No transactions yet. Add your first one above.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {uncategorizedCount > 0 && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-indigo-50/50 px-4 py-3">
          <span className="text-sm text-indigo-900">
            {uncategorizedCount} transaction(s) marked &quot;Other&quot;
          </span>
          <button
            onClick={handleBulkCategorize}
            disabled={bulkRunning}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {bulkRunning ? 'Categorizing...' : '✨ Categorize all with AI'}
          </button>
        </div>
      )}
      {aiMessage && (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          {aiMessage}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-slate-50 last:border-0">
              <td className="px-4 py-3 text-slate-500">
                {new Date(t.transaction_date).toLocaleDateString('en-NG', {
                  day: '2-digit',
                  month: 'short',
                })}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {t.category}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{t.description ?? '—'}</td>
              <td
                className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                  t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatNaira(t.amount)}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {t.category === 'Other' && (
                  <button
                    onClick={() => handleCategorize(t.id)}
                    disabled={categorizingId === t.id}
                    className="mr-3 text-xs font-medium text-indigo-500 hover:text-indigo-700 disabled:opacity-50"
                  >
                    {categorizingId === t.id ? '✨...' : '✨ AI categorize'}
                  </button>
                )}
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
