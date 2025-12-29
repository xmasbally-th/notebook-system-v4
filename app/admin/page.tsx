'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminNotificationBell from '@/components/admin/AdminNotificationBell'
import { useProfile } from '@/hooks/useProfile'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
    // Get current user session
    const [userId, setUserId] = useState<string | undefined>(undefined)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id || undefined)
        })
    }, [])

    // Fetch user profile to check admin status
    const { data: profile } = useProfile(userId)
    const isAdmin = profile?.role === 'admin'

    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [
                { count: equipmentCount },
                { count: pendingUsersCount },
                { count: pendingLoansCount }
            ] = await Promise.all([
                (supabase as any).from('equipment').select('*', { count: 'exact', head: true }),
                (supabase as any).from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                (supabase as any).from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ])

            return {
                equipment: equipmentCount || 0,
                pendingUsers: pendingUsersCount || 0,
                pendingLoans: pendingLoansCount || 0
            }
        }
    })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <AdminNotificationBell isAdmin={isAdmin} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Total Equipment</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.equipment ?? '-'}</p>
                    <Link href="/admin/equipment" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">Manage Equipment &rarr;</Link>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Pending Users</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingUsers ?? '-'}</p>
                    <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">Review Users &rarr;</Link>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Pending Loans</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingLoans ?? '-'}</p>
                    <Link href="/admin/loans" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">Process Requests &rarr;</Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Add Equipment
                    </button>
                    <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Export Reports
                    </button>
                    {/* More actions */}
                </div>
            </div>
        </div>
    )
}
