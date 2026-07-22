'use client'

import { useState } from 'react'
import {
    ClipboardList, Clock, CheckCircle, AlertTriangle,
    RotateCcw, ArrowRight, Laptop, Search, ChevronRight, CheckCircle2, XCircle, Info, Filter, X
} from 'lucide-react'
import Link from 'next/link'
import type { StaffDashboardStats, RecentActivityItem, EquipmentInventorySummary, EquipmentInventoryItem } from '@/lib/data/staff-dashboard'
import { formatThaiDate } from '@/lib/formatThaiDate'

interface StaffDashboardClientProps {
    stats: StaffDashboardStats
    recentActivity: RecentActivityItem[]
    inventorySummary?: EquipmentInventorySummary
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

function getEquipmentItemBadge(status: string) {
    switch (status) {
        case 'borrowed':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">กำลังถูกยืม</span>
        case 'maintenance':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">ซ่อมบำรุง</span>
        case 'retired':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">ปลดระวาง</span>
        default:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">ว่าง (พร้อมยืม)</span>
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

export default function StaffDashboardClient({ stats, recentActivity, inventorySummary }: StaffDashboardClientProps) {
    const [searchInventory, setSearchInventory] = useState('')
    const [inventoryFilter, setInventoryFilter] = useState<'all' | 'borrowed' | 'available' | 'maintenance'>('all')
    const [showInventoryModal, setShowInventoryModal] = useState(false)

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

    const filteredItems = (inventorySummary?.items || []).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchInventory.toLowerCase()) ||
            item.equipment_number.toLowerCase().includes(searchInventory.toLowerCase()) ||
            (item.current_borrower?.name || '').toLowerCase().includes(searchInventory.toLowerCase())

        if (inventoryFilter === 'borrowed') return matchesSearch && item.status === 'borrowed'
        if (inventoryFilter === 'available') return matchesSearch && (item.status === 'ready' || item.status === 'active' || item.status === 'available')
        if (inventoryFilter === 'maintenance') return matchesSearch && (item.status === 'maintenance' || item.status === 'retired')
        return matchesSearch
    })

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

            {/* Equipment Inventory Breakdown Card */}
            {inventorySummary && (
                <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-2xl p-6 shadow-md mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-700/60 pb-5 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                <Laptop className="w-6 h-6 text-teal-200" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">สถานะอุปกรณ์และการยืม-คงเหลือ</h2>
                                <p className="text-xs text-teal-200">ตรวจสอบจำนวนอุปกรณ์ที่ถูกยืม คงเหลือ และดูรายละเอียดรายเครื่อง</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowInventoryModal(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-teal-900 hover:bg-teal-50 rounded-xl text-xs font-bold shadow transition-colors"
                        >
                            <span>ดูรายชื่อเครื่องทั้งหมด ({inventorySummary.total} เครื่อง)</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <span className="text-xs text-teal-200 font-medium">อุปกรณ์ทั้งหมด</span>
                            <div className="text-2xl font-black mt-1">{inventorySummary.total} <span className="text-xs font-normal text-teal-200">เครื่อง</span></div>
                        </div>

                        <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-4 border border-blue-400/30">
                            <span className="text-xs text-blue-200 font-medium">ยืมอยู่ทั้งหมด</span>
                            <div className="text-2xl font-black text-blue-200 mt-1">{inventorySummary.borrowedCount} <span className="text-xs font-normal opacity-80">เครื่อง</span></div>
                        </div>

                        <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl p-4 border border-emerald-400/30">
                            <span className="text-xs text-emerald-200 font-medium">คงเหลือพร้อมยืม</span>
                            <div className="text-2xl font-black text-emerald-200 mt-1">{inventorySummary.availableCount} <span className="text-xs font-normal opacity-80">เครื่อง</span></div>
                        </div>

                        <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-4 border border-amber-400/30">
                            <span className="text-xs text-amber-200 font-medium">ซ่อมบำรุง/ปลดระวาง</span>
                            <div className="text-2xl font-black text-amber-200 mt-1">{inventorySummary.maintenanceCount} <span className="text-xs font-normal opacity-80">เครื่อง</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">กิจกรรมล่าสุด</h2>
                    <span className="text-xs text-gray-500">แสดงหมายเลขครุภัณฑ์อุปกรณ์</span>
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
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                            {activity.profiles?.first_name} {activity.profiles?.last_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                                            <span>ยืม: <strong className="text-gray-900 dark:text-slate-200">{activity.equipment?.name || '-'}</strong></span>
                                            {activity.equipment?.equipment_number && (
                                                <span className="px-2 py-0.5 text-xs font-mono bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                                                    #{activity.equipment.equipment_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
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

            {/* Inventory Modal / Drawer */}
            {showInventoryModal && inventorySummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-xl">
                                    <Laptop className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">รายชื่ออุปกรณ์และการถูกยืม (เครื่องไหนบ้าง)</h3>
                                    <p className="text-xs text-gray-500">รวมทั้งหมด {inventorySummary.total} เครื่อง (ยืมอยู่ {inventorySummary.borrowedCount} เครื่อง | ว่าง {inventorySummary.availableCount} เครื่อง)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search & Filter bar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาด้วยชื่ออุปกรณ์, หมายเลขครุภัณฑ์ หรือชื่อผู้ยืม..."
                                    value={searchInventory}
                                    onChange={(e) => setSearchInventory(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                                <button
                                    onClick={() => setInventoryFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${inventoryFilter === 'all' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm' : 'text-gray-500'}`}
                                >
                                    ทั้งหมด ({inventorySummary.total})
                                </button>
                                <button
                                    onClick={() => setInventoryFilter('borrowed')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${inventoryFilter === 'borrowed' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500'}`}
                                >
                                    กำลังยืม ({inventorySummary.borrowedCount})
                                </button>
                                <button
                                    onClick={() => setInventoryFilter('available')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${inventoryFilter === 'available' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-300 shadow-sm' : 'text-gray-500'}`}
                                >
                                    ว่าง ({inventorySummary.availableCount})
                                </button>
                            </div>
                        </div>

                        {/* List Table */}
                        <div className="overflow-y-auto flex-1 border border-gray-200 dark:border-slate-800 rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                                <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">หมายเลขครุภัณฑ์</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ชื่ออุปกรณ์</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ประเภท</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ผู้ยืมปัจจุบัน / กำหนดคืน</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไข
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                                                    #{item.equipment_number}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.category_name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getEquipmentItemBadge(item.status)}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {item.current_borrower ? (
                                                        <div>
                                                            <div className="font-semibold text-blue-700 dark:text-blue-300">
                                                                👤 {item.current_borrower.name}
                                                            </div>
                                                            <div className="text-gray-400 text-[11px]">
                                                                คืนวันที่: {formatThaiDate(item.current_borrower.end_date)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-2 text-right border-t border-gray-100 dark:border-slate-800">
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
