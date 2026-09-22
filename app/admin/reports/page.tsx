'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ReportDateRangePicker from '@/components/admin/reports/ReportDateRangePicker'
import { useReportData, DateRange } from '@/hooks/useReportData'
import OverviewTab from '@/components/admin/reports/tabs/OverviewTab'
import {
    ClipboardList,
    Package,
    Users,
    Calendar,
    BarChart3,
    Activity,
    FileText
} from 'lucide-react'

// Tab Loading Skeleton Fallback
function TabSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
                ))}
            </div>
            <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
    )
}

// Dynamic Imports for Code Splitting Non-Default Tabs & Heavy PDF Export
const LoansTab = dynamic(() => import('@/components/admin/reports/tabs/LoansTab'), {
    loading: () => <TabSkeleton />
})
const EquipmentTab = dynamic(() => import('@/components/admin/reports/tabs/EquipmentTab'), {
    loading: () => <TabSkeleton />
})
const ReservationsTab = dynamic(() => import('@/components/admin/reports/tabs/ReservationsTab'), {
    loading: () => <TabSkeleton />
})
const UsersTab = dynamic(() => import('@/components/admin/reports/tabs/UsersTab'), {
    loading: () => <TabSkeleton />
})
const ActivityTab = dynamic(() => import('@/components/admin/reports/tabs/ActivityTab'), {
    loading: () => <TabSkeleton />
})
const MonthlyTab = dynamic(() => import('@/components/admin/reports/tabs/MonthlyTab'), {
    loading: () => <TabSkeleton />
})
const ReportPDFExport = dynamic(() => import('@/components/admin/reports/ReportPDFExport'), {
    ssr: false,
    loading: () => <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
})

type TabType = 'overview' | 'loans' | 'equipment' | 'reservations' | 'users' | 'activity' | 'monthly'

const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const parseLocalDateString = (dateStr: string, isEnd = false): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (isEnd) {
        date.setHours(23, 59, 59, 999)
    } else {
        date.setHours(0, 0, 0, 0)
    }
    return date
}

export default function AdminReportsPage() {
    // Default to last 30 days
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const to = new Date()
        to.setHours(23, 59, 59, 999)
        const from = new Date()
        from.setDate(from.getDate() - 29)
        from.setHours(0, 0, 0, 0)
        return { from, to }
    })

    const [activeTab, setActiveTab] = useState<TabType>('overview')

    const { data, isLoading, error } = useReportData(dateRange, activeTab)

    const tabs = [
        { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
        { id: 'loans', label: 'การยืม-คืน', icon: ClipboardList },
        { id: 'equipment', label: 'อุปกรณ์', icon: Package },
        { id: 'reservations', label: 'การจอง', icon: Calendar },
        { id: 'users', label: 'ผู้ใช้', icon: Users },
        { id: 'activity', label: 'กิจกรรม', icon: Activity },
        { id: 'monthly', label: 'สรุปเดือน', icon: FileText }
    ]

    return (
        <>
            <AdminPageHeader title="รายงาน" subtitle="รายงานและสถิติการใช้งานระบบ"/>
            {/* Header with Date Range and Export */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <ReportPDFExport data={data} dateRange={dateRange} isLoading={isLoading} activeTab={activeTab} />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-semibold text-gray-500 text-xs">ตั้งแต่วันที่:</span>
                        <input
                            type="date"
                            value={toLocalDateString(dateRange.from)}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const fromDate = parseLocalDateString(e.target.value, false)
                                    if (!isNaN(fromDate.getTime())) {
                                        setDateRange({ from: fromDate, to: dateRange.to })
                                    }
                                }
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-700"
                        />
                        <span className="text-gray-400">ถึง</span>
                        <input
                            type="date"
                            value={toLocalDateString(dateRange.to)}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const toDate = parseLocalDateString(e.target.value, true)
                                    if (!isNaN(toDate.getTime())) {
                                        setDateRange({ from: dateRange.from, to: toDate })
                                    }
                                }
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-700"
                        />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && <OverviewTab data={data} isLoading={isLoading} />}
                    {activeTab === 'loans' && <LoansTab data={data} isLoading={isLoading} />}
                    {activeTab === 'equipment' && <EquipmentTab data={data} isLoading={isLoading} dateRange={dateRange} />}
                    {activeTab === 'reservations' && <ReservationsTab data={data} isLoading={isLoading} />}
                    {activeTab === 'users' && <UsersTab data={data} isLoading={isLoading} />}
                    {activeTab === 'activity' && <ActivityTab data={data} isLoading={isLoading} />}
                    {activeTab === 'monthly' && <MonthlyTab data={data} isLoading={isLoading} dateRange={dateRange} />}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    <p className="text-sm mt-1">{(error as Error).message}</p>
                </div>
            )}
        </>
    )
}
