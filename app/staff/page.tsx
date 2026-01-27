'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import StaffLayout from '@/components/staff/StaffLayout'
import {
    ClipboardList, Clock, CheckCircle, AlertTriangle,
    RotateCcw, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'

export default function StaffDashboard() {
    // Enable Realtime Updates
    useRealtimeInvalidator(['loanRequests'], [['staff-dashboard-stats'], ['staff-recent-activity']])
    // Fetch dashboard stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['staff-dashboard-stats'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return null

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            // Fetch loan requests count by status
            const response = await fetch(
                `${url}/rest/v1/loanRequests?select=id,status,created_at`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )

            if (!response.ok) return null
            const loans = await response.json()

            // Calculate stats
            const pending = loans.filter((l: any) => l.status === 'pending').length
            const approved = loans.filter((l: any) => l.status === 'approved').length
            const today = new Date()

            // For overdue, we need to check approved loans past end_date
            // This is a simplified version - we'll enhance later
            const overdueResponse = await fetch(
                `${url}/rest/v1/loanRequests?status=eq.approved&select=id,end_date`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )

            let overdue = 0
            if (overdueResponse.ok) {
                const activeLoans = await overdueResponse.json()
                overdue = activeLoans.filter((l: any) => new Date(l.end_date) < today).length
            }

            return {
                pending,
                approved,
                overdue,
                total: loans.length
            }
        }
    })

    // Fetch recent activity
    const { data: recentActivity } = useQuery({
        queryKey: ['staff-recent-activity'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            const response = await fetch(
                `${url}/rest/v1/loanRequests?select=*,profiles(first_name,last_name),equipment(name)&order=updated_at.desc&limit=10`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )

            if (!response.ok) return []
            return response.json()
        }
    })

    const statCards = [
        {
            title: 'รออนุมัติ',
            value: stats?.pending || 0,
            icon: Clock,
            color: 'bg-yellow-50 text-yellow-600',
            iconBg: 'bg-yellow-100',
            href: '/staff/loans?status=pending'
        },
        {
            title: 'กำลังยืม',
            value: stats?.approved || 0,
            icon: CheckCircle,
            color: 'bg-green-50 text-green-600',
            iconBg: 'bg-green-100',
            href: '/staff/returns'
        },
        {
            title: 'ค้างคืน',
            value: stats?.overdue || 0,
            icon: AlertTriangle,
            color: 'bg-red-50 text-red-600',
            iconBg: 'bg-red-100',
            href: '/staff/overdue'
        },
        {
            title: 'คำขอทั้งหมด',
            value: stats?.total || 0,
            icon: ClipboardList,
            color: 'bg-blue-50 text-blue-600',
            iconBg: 'bg-blue-100',
            href: '/staff/loans'
        }
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">รออนุมัติ</span>
            case 'approved':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">อนุมัติแล้ว</span>
            case 'rejected':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">ปฏิเสธ</span>
            case 'returned':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">คืนแล้ว</span>
            default:
                return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <StaffLayout title="Dashboard" subtitle="ภาพรวมการยืม-คืนอุปกรณ์">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Link
                            key={card.title}
                            href={card.href}
                            className={`${card.color} rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${card.iconBg} rounded-lg`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{isLoading ? '-' : card.value}</p>
                                    <p className="text-xs opacity-80">{card.title}</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link
                    href="/staff/loans"
                    className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 hover:border-teal-300 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">จัดการคำขอยืม</p>
                            <p className="text-sm text-gray-500">อนุมัติหรือปฏิเสธคำขอ</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                </Link>
                <Link
                    href="/staff/returns"
                    className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 hover:border-teal-300 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <RotateCcw className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">รับคืนอุปกรณ์</p>
                            <p className="text-sm text-gray-500">ตรวจสอบและรับคืน</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                </Link>
                <Link
                    href="/staff/overdue"
                    className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 hover:border-red-300 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">รายการค้างคืน</p>
                            <p className="text-sm text-gray-500">ติดตามและแจ้งเตือน</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentActivity?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p>ยังไม่มีกิจกรรม</p>
                        </div>
                    ) : (
                        recentActivity?.map((activity: any) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.profiles?.first_name} {activity.profiles?.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            ยืม: {activity.equipment?.name || '-'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(activity.status)}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(activity.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </StaffLayout>
    )
}
