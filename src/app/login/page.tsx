
'use client'

import { useActionState } from 'react'
import { login } from './action'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">AutoNews Login</h1>
        
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              name="username" 
              type="text" 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {state?.error && (
            <div className="text-red-500 text-sm text-center">
              {state.error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
