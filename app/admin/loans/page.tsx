'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoanRequestsPage() {
    const queryClient = useQueryClient()
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Fetch pending loans
    const { data: requests, isLoading } = useQuery({
        queryKey: ['loan-requests'],
        queryFn: async () => {
            // Assuming 'loanRequests' table exists or reusing 'loans'
            // For now, implementing as if it exists
            const { data } = await supabase
                .from('loanRequests' as any)
                .select('*, profiles(first_name, last_name, email), equipment(name, equipment_number)')
                .eq('status', 'pending')
            return data || []
        }
    })

    // Bulk Action Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ ids, status }: { ids: string[], status: 'approved' | 'rejected' }) => {
            const { error } = await supabase
                .from('loanRequests' as any)
                .update({ status })
                .in('id', ids)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
            setSelectedIds([])
        }
    })

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleBulkAction = (status: 'approved' | 'rejected') => {
        if (confirm(`Are you sure you want to ${status} ${selectedIds.length} requests?`)) {
            updateStatusMutation.mutate({ ids: selectedIds, status })
        }
    }

    if (isLoading) return <div className="p-8">Loading...</div>

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Loan Requests</h1>
                <div className="flex gap-3">
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={() => handleBulkAction('approved')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-green-700"
                    >
                        Approve Selected ({selectedIds.length})
                    </button>
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={() => handleBulkAction('rejected')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-red-700"
                    >
                        Reject Selected ({selectedIds.length})
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(requests?.map((r: any) => r.id) || [])
                                        else setSelectedIds([])
                                    }}
                                    checked={requests?.length > 0 && selectedIds.length === requests?.length}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests?.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No pending requests</td></tr>
                        ) : requests?.map((request: any) => (
                            <tr key={request.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(request.id)}
                                        onChange={() => toggleSelect(request.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {request.profiles?.first_name} {request.profiles?.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">{request.profiles?.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{request.equipment?.name}</div>
                                    <div className="text-sm text-gray-500">{request.equipment?.equipment_number}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{request.reason}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
