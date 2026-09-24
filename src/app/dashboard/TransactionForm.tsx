'use client'

import { useState, useTransition } from 'react'
import { addTransaction } from './actions'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './categories'

export default function TransactionForm() {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('Food')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addTransaction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        const form = document.getElementById('transaction-form') as HTMLFormElement
        form?.reset()
      }
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Add transaction</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <form id="transaction-form" action={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType('expense')
              setCategory('Food')
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income')
              setCategory('Salary')
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Income
          </button>
        </div>
        <input type="hidden" name="type" value={type} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Amount (₦)</label>
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
            <input
              name="transactionDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {category === 'Other' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Custom category</label>
            <input
              name="customCategory"
              type="text"
              placeholder="e.g. Data subscription"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Description (optional)
          </label>
          <input
            name="description"
            type="text"
            placeholder="e.g. Lunch with colleagues"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add transaction'}
        </button>
      </form>
    </div>
  )
}
