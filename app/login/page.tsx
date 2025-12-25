'use client'

import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error) {
            alert('Error logging in!')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Sign in to Notebook System
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Use your institutional account
                    </p>
                </div>
                <div className="mt-8">
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Redirecting...' : 'Sign in with Google'}
                    </button>
                </div>
            </div>
        </div>
    )
}
