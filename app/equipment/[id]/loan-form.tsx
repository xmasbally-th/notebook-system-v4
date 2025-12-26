'use client'

import { useActionState } from 'react'
import { submitLoanRequest } from './actions'
import { Loader2 } from 'lucide-react'

// Shim for React 18 if useActionState is not available, use fallback or just normal form
// Since we are likely on Next.js 15/14 (from "use server"), let's use a simpler approach if useActionState is tricky with types
// We will use standard form submission with a transition or simple handler

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoanRequestForm({ equipmentId }: { equipmentId: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    async function clientAction(formData: FormData) {
        setLoading(true)
        setError(null)

        try {
            const result = await submitLoanRequest(null, formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(true)
                // Optionally redirect or show success
            }
        } catch (e: any) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center">
                <p className="font-medium">Request Submitted!</p>
                <p className="text-sm mt-1">Please wait for admin approval.</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-3 text-sm underline hover:text-green-900"
                >
                    Back to Home
                </button>
            </div>
        )
    }

    return (
        <form action={clientAction} className="space-y-4">
            <input type="hidden" name="equipmentId" value={equipmentId} />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input
                        type="date"
                        name="startDate"
                        required
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                        type="date"
                        name="endDate"
                        required
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for borrowing</label>
                <textarea
                    name="reason"
                    required
                    rows={3}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                    placeholder="e.g. For Senior Project presentation..."
                />
            </div>

            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Submitting...' : 'Submit Request'}
            </button>
        </form>
    )
}
