
'use client'

import { useActionState } from 'react'
import { changePassword } from './actions'

export function ChangePasswordForm() {
    const [state, action, isPending] = useActionState(changePassword, null)

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form action={action} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input 
                        type="password" 
                        name="currentPassword" 
                        className="w-full border p-2 rounded" 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input 
                        type="password" 
                        name="newPassword" 
                        className="w-full border p-2 rounded" 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input 
                        type="password" 
                        name="confirmPassword" 
                        className="w-full border p-2 rounded" 
                        required 
                    />
                </div>

                {state?.error && (
                    <div className="text-red-500 text-sm">{state.error}</div>
                )}
                {state?.success && (
                    <div className="text-green-500 text-sm">{state.success}</div>
                )}

                <button 
                    type="submit" 
                    disabled={isPending}
                    className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 disabled:opacity-50"
                >
                    {isPending ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </div>
    )
}
