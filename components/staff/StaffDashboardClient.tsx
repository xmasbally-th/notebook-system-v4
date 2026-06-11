'use client'

import {
    ClipboardList, Clock, CheckCircle, AlertTriangle,
    RotateCcw, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import type { StaffDashboardStats, RecentActivityItem } from '@/lib/data/staff-dashboard'

interface StaffDashboardClientProps {
    stats: StaffDashboardStats
    recentActivity: RecentActivityItem[]
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending':
            return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300">รออนุมัติ</span>
        case 'approved':
            return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300">อนุมัติแล้ว</span>
        case 'rejected':
            return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">ปฏิเสธ</span>
        case 'returned':
            return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">คืนแล้ว</span>
        default:
            return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">{status}</span>
    }
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function StaffDashboardClient({ stats, recentActivity }: StaffDashboardClientProps) {
    const statCards = [
        {
            title: 'รออนุมัติ',
            value: stats.pending,
            icon: Clock,
            color: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            href: '/staff/loans?status=pending',
        },
        {
            title: 'กำลังยืม',
            value: stats.approved,
            icon: CheckCircle,
            color: 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            href: '/staff/returns',
        },
        {
            title: 'ค้างคืน',
            value: stats.overdue,
            icon: AlertTriangle,
            color: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            href: '/staff/overdue',
        },
        {
            title: 'คำขอทั้งหมด',
            value: stats.total,
            icon: ClipboardList,
            color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            href: '/staff/loans',
        },
    ]

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Link
                            key={card.title}
                            href={card.href}
                            className={`${card.color} rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${card.iconBg} rounded-lg`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{card.value}</p>
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
                    className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-slate-100">จัดการคำขอยืม</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">อนุมัติหรือปฏิเสธคำขอ</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                </Link>
                <Link
                    href="/staff/returns"
                    className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                            <RotateCcw className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-slate-100">รับคืนอุปกรณ์</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">ตรวจสอบและรับคืน</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                </Link>
                <Link
                    href="/staff/overdue"
                    className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-slate-100">รายการค้างคืน</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">ติดตามและแจ้งเตือน</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">กิจกรรมล่าสุด</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                            <p>ยังไม่มีกิจกรรม</p>
                        </div>
                    ) : (
                        recentActivity.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                            {activity.profiles?.first_name} {activity.profiles?.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            ยืม: {activity.equipment?.name || '-'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(activity.status)}
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                            {formatDate(activity.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
