'use client'

import { useState, useRef } from 'react'
import { addTransaction } from './actions'

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Utilities',
  'Airtime/Data',
  'Shopping',
  'Health',
  'Education',
  'Entertainment',
  'Other',
]

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Gift', 'Other']

export default function TransactionForm() {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)
    const result = await addTransaction(formData)
    setSubmitting(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    formRef.current?.reset()
    setCategory('')
    setType('expense')
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Add transaction
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setType('expense')
            setCategory('')
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            type === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income')
            setCategory('')
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            type === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Income
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Amount (₦)
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            name="transaction_date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {category === 'Other' && (
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Custom category
            </label>
            <input
              name="customCategory"
              type="text"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="e.g. Data subscription"
            />
          </div>
        )}

        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <input
            name="description"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="e.g. Lunch with client"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? 'Adding...' : 'Add transaction'}
      </button>
    </form>
  )
}
