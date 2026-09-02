'use client'

import { useState, useTransition } from 'react'
import { setBudget, deleteBudget } from './budget-actions'
import { EXPENSE_CATEGORIES } from './categories'

type Budget = {
  id: string
  category: string
  monthly_limit: number
}

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(n)

export default function BudgetsPanel({
  budgets,
  spendingByCategory,
}: {
  budgets: Budget[]
  spendingByCategory: Record<string, number>
}) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const budgetedCategories = new Set(budgets.map((b) => b.category))
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !budgetedCategories.has(c)
  )

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await setBudget(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setShowForm(false)
      }
    })
  }
  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBudget(id)
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Monthly budgets
        </h2>
        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {showForm ? 'Cancel' : '+ Set a budget'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <form
          action={handleSubmit}
          className="mb-5 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Category
            </label>
            <select
              name="category"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Monthly limit (₦)
            </label>
            <input
              name="monthlyLimit"
              type="number"
              min="1"
              step="1"
              required
              placeholder="50000"
              className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save budget'}
          </button>
        </form>
      )}

      {budgets.length === 0 ? (
        <p className="text-sm text-slate-400">
          No budgets set yet. Set a monthly limit per category to track your
          spending against it.
        </p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const spent = spendingByCategory[b.category] ?? 0
            const percent = Math.min(
              100,
              Math.round((spent / b.monthly_limit) * 100)
            )
            const over = spent > b.monthly_limit
            const barColor = over
              ? 'bg-red-500'
              : percent > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'

            return (
              <div key={b.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-900">
                    {b.category}
                  </span>
                  <span
                    className={
                      over ? 'font-medium text-red-600' : 'text-slate-500'
                    }
                  >
                    {formatNaira(spent)} / {formatNaira(b.monthly_limit)}
                    {over && ' — over budget'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${barColor} transition-all`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="mt-1 text-xs text-slate-300 hover:text-red-500"
                >
                  Remove budget
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
