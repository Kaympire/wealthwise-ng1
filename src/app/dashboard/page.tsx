import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '../login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
          Expense & income tracking coming next (Step 2) 🚧
        </div>
      </div>
    </div>
  )
}
