const MONO_BASE_URL = 'https://api.withmono.com'

function getSecretKey() {
  const key = process.env.MONO_SECRET_KEY
  if (!key) {
    throw new Error('MONO_SECRET_KEY is not set')
  }
  return key
}

async function monoRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${MONO_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'mono-sec-key': getSecretKey(),
      ...options.headers,
    },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message = body?.message || `Mono request failed (${res.status})`
    throw new Error(message)
  }

  return body
}

// Exchange the temporary widget code for a permanent account ID
export async function exchangeToken(code: string): Promise<string> {
  const body = await monoRequest('/v2/accounts/auth', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  return body.data.id as string
}

// Fetch account details (institution name, account number, etc.)
export async function getAccountDetails(accountId: string) {
  const body = await monoRequest(`/v2/accounts/${accountId}`)
  return body.data
}

// Fetch transactions for a linked account. Amounts come back in kobo.
export async function getTransactions(accountId: string) {
  const body = await monoRequest(
    `/v2/accounts/${accountId}/transactions?paginate=false`
  )
  return body.data as Array<{
    id: string
    narration: string
    amount: number // in kobo
    type: 'debit' | 'credit'
    date: string
    category: string
  }>
}
