'use client'

import { useCallback, useState } from 'react'
import {
  connectBankAccount,
  syncBankTransactions,
  disconnectBankAccount,
} from './mono-actions'

type BankAccount = {
  id: string
  institution_name: string | null
  account_number: string | null
  last_synced_at: string | null
}

export default function BankAccountsPanel({
  bankAccounts,
  monoPublicKey,
}: {
  bankAccounts: BankAccount[]
  monoPublicKey: string
}) {
  const [connecting, setConnecting] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openMonoWidget = useCallback(async () => {
    setError(null)
    setMessage(null)

    if (!monoPublicKey) {
      setError('Mono public key is not configured yet.')
      return
    }

    setConnecting(true)

    const MonoConnect = (await import('@mono.co/connect.js')).default

    const monoInstance = new MonoConnect({
      key: monoPublicKey,
      onClose: () => setConnecting(false),
      onLoad: () => {},
      onSuccess: async ({ code }: { code: string }) => {
        const result = await connectBankAccount(code)
        setConnecting(false)
        if (result?.error) {
          setError(result.error)
        } else {
          setMessage('Bank account connected! Click "Sync" to pull in transactions.')
        }
      },
    })

    monoInstance.setup()
    monoInstance.open()
  }, [monoPublicKey])

  async function handleSync(id: string) {
    setSyncingId(id)
    setError(null)
    setMessage(null)

    const result = await syncBankTransactions(id)
    setSyncingId(null)

    if (result?.error) {
      setError(result.error)
    } else {
      setMessage(`Synced ${result?.count ?? 0} transaction(s).`)
    }
  }

  async function handleDisconnect(id: string) {
    setError(null)
    setMessage(null)
    const result = await disconnectBankAccount(id)
    if (result?.error) {
      setError(result.error)
    } else {
      setMessage('Bank account disconnected.')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Bank accounts</h2>
        <button
          onClick={openMonoWidget}
          disabled={connecting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : '+ Connect bank'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
      )}

      {bankAccounts.length === 0 ? (
        <p className="text-sm text-slate-400">
          No bank accounts connected yet. In sandbox mode, use Mono&apos;s test
          bank credentials — no real bank account required.
        </p>
      ) : (
        <ul className="space-y-3">
          {bankAccounts.map((acc) => (
            <li
              key={acc.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {acc.institution_name ?? 'Connected bank'}
                </p>
                <p className="text-xs text-slate-400">
                  {acc.account_number ? `••••${acc.account_number.slice(-4)}` : ''}
                  {acc.last_synced_at
                    ? ` · Last synced ${new Date(acc.last_synced_at).toLocaleString('en-NG')}`
                    : ' · Never synced'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSync(acc.id)}
                  disabled={syncingId === acc.id}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  {syncingId === acc.id ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={() => handleDisconnect(acc.id)}
                  className="text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  Disconnect
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
