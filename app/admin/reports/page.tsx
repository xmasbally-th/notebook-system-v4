'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import ReportDateRangePicker from '@/components/admin/reports/ReportDateRangePicker'
import ReportPDFExport from '@/components/admin/reports/ReportPDFExport'
import { useReportData, DateRange } from '@/hooks/useReportData'
import {
    OverviewTab,
    LoansTab,
    EquipmentTab,
    ReservationsTab,
    UsersTab,
    ActivityTab,
    MonthlyTab
} from '@/components/admin/reports/tabs'
import {
    ClipboardList,
    Package,
    Users,
    Calendar,
    BarChart3,
    Activity,
    FileText
} from 'lucide-react'

type TabType = 'overview' | 'loans' | 'equipment' | 'reservations' | 'users' | 'activity' | 'monthly'

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

    const { data, isLoading, error } = useReportData(dateRange)

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
        <AdminLayout title="รายงาน" subtitle="รายงานและสถิติการใช้งานระบบ">
            {/* Header with Date Range and Export */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <ReportPDFExport data={data} dateRange={dateRange} isLoading={isLoading} />
                </div>
                <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
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
                    {activeTab === 'monthly' && <MonthlyTab data={data} isLoading={isLoading} />}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    <p className="text-sm mt-1">{(error as Error).message}</p>
                </div>
            )}
        </AdminLayout>
    )
}
