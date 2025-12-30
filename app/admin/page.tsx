'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    Package,
    Users,
    ClipboardList,
    TrendingUp,
    ArrowRight,
    Plus,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react'

export default function AdminDashboard() {
    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [
                { count: equipmentCount },
                { count: pendingUsersCount },
                { count: pendingLoansCount },
                { count: activeLoansCount },
                { count: totalUsersCount }
            ] = await Promise.all([
                (supabase as any).from('equipment').select('*', { count: 'exact', head: true }),
                (supabase as any).from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                (supabase as any).from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                (supabase as any).from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                (supabase as any).from('profiles').select('*', { count: 'exact', head: true })
            ])

            return {
                equipment: equipmentCount || 0,
                pendingUsers: pendingUsersCount || 0,
                pendingLoans: pendingLoansCount || 0,
                activeLoans: activeLoansCount || 0,
                totalUsers: totalUsersCount || 0
            }
        }
    })

    const statCards = [
        {
            label: 'อุปกรณ์ทั้งหมด',
            value: stats?.equipment ?? '-',
            icon: Package,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            href: '/admin/equipment'
        },
        {
            label: 'ผู้ใช้รออนุมัติ',
            value: stats?.pendingUsers ?? '-',
            icon: Users,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            href: '/admin/users',
            urgent: (stats?.pendingUsers ?? 0) > 0
        },
        {
            label: 'คำขอยืมรอดำเนินการ',
            value: stats?.pendingLoans ?? '-',
            icon: ClipboardList,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            href: '/admin/loans',
            urgent: (stats?.pendingLoans ?? 0) > 0
        },
        {
            label: 'การยืมที่กำลังดำเนินการ',
            value: stats?.activeLoans ?? '-',
            icon: TrendingUp,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            href: '/admin/loans'
        }
    ]

    const quickActions = [
        { label: 'เพิ่มอุปกรณ์', icon: Plus, href: '/admin/equipment', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
        { label: 'ดูคำขอยืม', icon: ClipboardList, href: '/admin/loans', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
        { label: 'จัดการผู้ใช้', icon: Users, href: '/admin/users', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
        { label: 'รายงาน', icon: FileText, href: '/admin/reports', color: 'bg-gray-600 hover:bg-gray-700 text-white' }
    ]

    return (
        <AdminLayout title="Dashboard" subtitle="ภาพรวมระบบยืม-คืนอุปกรณ์">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className={`
                                relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-gray-100
                                hover:shadow-md hover:border-gray-200 transition-all group
                                ${stat.urgent ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
                            `}
                        >
                            {stat.urgent && (
                                <span className="absolute top-3 right-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                    </span>
                                </span>
                            )}
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${stat.textColor}`}>
                                        {isLoading ? (
                                            <span className="inline-block w-12 h-8 bg-gray-100 rounded animate-pulse"></span>
                                        ) : stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                                <span>ดูรายละเอียด</span>
                                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Quick Actions & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">ดำเนินการด่วน</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon
                            return (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className={`
                                        flex flex-col items-center justify-center p-4 rounded-xl
                                        ${action.color} transition-all hover:shadow-lg hover:-translate-y-0.5
                                    `}
                                >
                                    <Icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium text-center">{action.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานะระบบ</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-800">ระบบยืม-คืน</span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                เปิดใช้งาน
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">เวลาทำการ</span>
                            </div>
                            <span className="text-xs font-medium text-blue-700">
                                08:30 - 16:30
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-800">ผู้ใช้ทั้งหมด</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                                {stats?.totalUsers ?? '-'} คน
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
