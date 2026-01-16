'use client'

import { useState, useMemo } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import ReportStatsCard from '@/components/admin/reports/ReportStatsCard'
import ReportDateRangePicker from '@/components/admin/reports/ReportDateRangePicker'
import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { useReportData, DateRange, UserStats } from '@/hooks/useReportData'
import { exportOverdueReportCSV, exportPopularEquipmentCSV, exportToCSV, calculatePercentage } from '@/lib/reports'
import { formatThaiDate } from '@/lib/formatThaiDate'
import {
    ClipboardList,
    Package,
    AlertTriangle,
    TrendingUp,
    Users,
    Calendar,
    BarChart3,
    Clock
} from 'lucide-react'

type TabType = 'overview' | 'loans' | 'equipment' | 'reservations' | 'users'
type UserSortKey = 'name' | 'department' | 'loan_count' | 'total_activity' | 'overdue_count'

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
    const [userDeptFilter, setUserDeptFilter] = useState<string>('all')
    const [userSortKey, setUserSortKey] = useState<UserSortKey>('loan_count')
    const [userSortAsc, setUserSortAsc] = useState<boolean>(false)

    const { data, isLoading, error } = useReportData(dateRange)

    const tabs = [
        { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
        { id: 'loans', label: 'การยืม-คืน', icon: ClipboardList },
        { id: 'equipment', label: 'อุปกรณ์', icon: Package },
        { id: 'reservations', label: 'การจอง', icon: Calendar },
        { id: 'users', label: 'ผู้ใช้', icon: Users }
    ]

    // Stats cards for overview
    const statsCards = [
        {
            label: 'การยืมวันนี้',
            value: data?.todayLoans ?? 0,
            icon: ClipboardList,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            label: 'รอดำเนินการ',
            value: data?.loanStats.pending ?? 0,
            icon: Clock,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600'
        },
        {
            label: 'เกินกำหนด',
            value: data?.loanStats.overdue ?? 0,
            icon: AlertTriangle,
            color: 'bg-red-500',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600'
        },
        {
            label: 'อุปกรณ์ถูกยืม',
            value: data?.equipmentStats.borrowed ?? 0,
            subValue: `จากทั้งหมด ${data?.equipmentStats.total ?? 0} ชิ้น`,
            icon: Package,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        }
    ]

    // Column definitions for tables
    const overdueColumns = [
        { key: 'user_name', label: 'ผู้ยืม' },
        { key: 'user_email', label: 'อีเมล' },
        { key: 'equipment_name', label: 'อุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'end_date', label: 'วันครบกำหนด', render: columnRenderers.date },
        { key: 'days_overdue', label: 'เกินกำหนด', render: columnRenderers.daysOverdue }
    ]

    const popularEquipmentColumns = [
        { key: 'rank', label: 'อันดับ' },
        { key: 'name', label: 'ชื่ออุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'loan_count', label: 'จำนวนครั้งที่ยืม', render: columnRenderers.number },
        { key: 'total_usage', label: 'รวมการใช้งาน', render: columnRenderers.number }
    ]

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        let users = data?.userStats ?? []

        // Filter by department
        if (userDeptFilter !== 'all') {
            users = users.filter(u => u.department === userDeptFilter)
        }

        // Sort
        return [...users].sort((a, b) => {
            let aVal: string | number = ''
            let bVal: string | number = ''

            switch (userSortKey) {
                case 'name':
                    aVal = `${a.first_name} ${a.last_name}`
                    bVal = `${b.first_name} ${b.last_name}`
                    break
                case 'department':
                    aVal = a.department
                    bVal = b.department
                    break
                case 'loan_count':
                    aVal = a.loan_count
                    bVal = b.loan_count
                    break
                case 'total_activity':
                    aVal = a.total_activity
                    bVal = b.total_activity
                    break
                case 'overdue_count':
                    aVal = a.overdue_count
                    bVal = b.overdue_count
                    break
            }

            if (typeof aVal === 'string') {
                return userSortAsc
                    ? aVal.localeCompare(bVal as string, 'th')
                    : (bVal as string).localeCompare(aVal, 'th')
            }
            return userSortAsc ? aVal - (bVal as number) : (bVal as number) - aVal
        })
    }, [data?.userStats, userDeptFilter, userSortKey, userSortAsc])

    // Export user stats to CSV
    const exportUserStatsCSV = () => {
        if (!filteredUsers.length) return
        exportToCSV({
            filename: 'รายงานผู้ใช้',
            headers: ['ลำดับ', 'ชื่อ-สกุล', 'อีเมล', 'สาขาวิชา', 'จำนวนครั้งที่ยืม', 'จำนวนครั้งที่จอง', 'รวมกิจกรรม', 'เกินกำหนด'],
            rows: filteredUsers.map((user, index) => [
                index + 1,
                `${user.first_name} ${user.last_name}`.trim() || '-',
                user.email,
                user.department,
                user.loan_count,
                user.reservation_count,
                user.total_activity,
                user.overdue_count
            ])
        })
    }

    return (
        <AdminLayout title="รายงาน" subtitle="รายงานและสถิติการใช้งานระบบ">
            {/* Date Range Picker */}
            <div className="flex justify-end mb-6">
                <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
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
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {statsCards.map((stat) => (
                                    <ReportStatsCard
                                        key={stat.label}
                                        {...stat}
                                        loading={isLoading}
                                    />
                                ))}
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Loan Summary */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการยืม-คืน</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">ทั้งหมด</span>
                                            <span className="font-semibold">{data?.loanStats.total ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">อนุมัติแล้ว</span>
                                            <span className="font-semibold text-blue-600">{data?.loanStats.approved ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">คืนแล้ว</span>
                                            <span className="font-semibold text-green-600">{data?.loanStats.returned ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">ปฏิเสธ</span>
                                            <span className="font-semibold text-red-600">{data?.loanStats.rejected ?? 0}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">อัตราการอนุมัติ</span>
                                                <span className="font-semibold text-blue-600">
                                                    {calculatePercentage(
                                                        (data?.loanStats.approved ?? 0) + (data?.loanStats.returned ?? 0),
                                                        data?.loanStats.total ?? 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reservation Summary */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการจอง</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">ทั้งหมด</span>
                                            <span className="font-semibold">{data?.reservationStats.total ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">อนุมัติแล้ว</span>
                                            <span className="font-semibold text-blue-600">{data?.reservationStats.approved ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">เสร็จสิ้น</span>
                                            <span className="font-semibold text-green-600">{data?.reservationStats.completed ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">ยกเลิก</span>
                                            <span className="font-semibold text-gray-500">{data?.reservationStats.cancelled ?? 0}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">อัตราการยกเลิก</span>
                                                <span className="font-semibold text-orange-600">
                                                    {calculatePercentage(
                                                        data?.reservationStats.cancelled ?? 0,
                                                        data?.reservationStats.total ?? 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loans Tab */}
                    {activeTab === 'loans' && (
                        <div className="space-y-6">
                            {/* Loan Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{data?.loanStats.total ?? 0}</p>
                                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{data?.loanStats.pending ?? 0}</p>
                                    <p className="text-sm text-yellow-700">รอดำเนินการ</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{data?.loanStats.returned ?? 0}</p>
                                    <p className="text-sm text-green-700">คืนแล้ว</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-red-600">{data?.loanStats.overdue ?? 0}</p>
                                    <p className="text-sm text-red-700">เกินกำหนด</p>
                                </div>
                            </div>

                            {/* Overdue Table */}
                            <ReportTable
                                title="รายการเกินกำหนดคืน"
                                columns={overdueColumns}
                                data={data?.overdueItems ?? []}
                                loading={isLoading}
                                emptyMessage="ไม่มีรายการเกินกำหนด"
                                onExport={() => data?.overdueItems && exportOverdueReportCSV(data.overdueItems)}
                            />
                        </div>
                    )}

                    {/* Equipment Tab */}
                    {activeTab === 'equipment' && (
                        <div className="space-y-6">
                            {/* Equipment Status */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{data?.equipmentStats.total ?? 0}</p>
                                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{data?.equipmentStats.ready ?? 0}</p>
                                    <p className="text-sm text-green-700">พร้อมใช้งาน</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{data?.equipmentStats.borrowed ?? 0}</p>
                                    <p className="text-sm text-purple-700">ถูกยืม</p>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-orange-600">{data?.equipmentStats.maintenance ?? 0}</p>
                                    <p className="text-sm text-orange-700">ซ่อมบำรุง</p>
                                </div>
                            </div>

                            {/* Usage Rate */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">อัตราการใช้งาน</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${data?.equipmentStats.total ? Math.round((data.equipmentStats.borrowed / data.equipmentStats.total) * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">
                                        {calculatePercentage(data?.equipmentStats.borrowed ?? 0, data?.equipmentStats.total ?? 0)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {data?.equipmentStats.borrowed ?? 0} จาก {data?.equipmentStats.total ?? 0} ชิ้นกำลังถูกใช้งาน
                                </p>
                            </div>

                            {/* Popular Equipment */}
                            <ReportTable
                                title="อุปกรณ์ยอดนิยม"
                                columns={popularEquipmentColumns}
                                data={(data?.popularEquipment ?? []).map((item, index) => ({ ...item, rank: index + 1 }))}
                                loading={isLoading}
                                emptyMessage="ไม่มีข้อมูลการใช้งาน"
                                onExport={() => data?.popularEquipment && exportPopularEquipmentCSV(data.popularEquipment)}
                            />
                        </div>
                    )}

                    {/* Reservations Tab */}
                    {activeTab === 'reservations' && (
                        <div className="space-y-6">
                            {/* Reservation Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{data?.reservationStats.total ?? 0}</p>
                                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{data?.reservationStats.pending ?? 0}</p>
                                    <p className="text-sm text-yellow-700">รอดำเนินการ</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{data?.reservationStats.approved ?? 0}</p>
                                    <p className="text-sm text-purple-700">อนุมัติแล้ว</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{data?.reservationStats.completed ?? 0}</p>
                                    <p className="text-sm text-green-700">เสร็จสิ้น</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                                    <p className="text-2xl font-bold text-gray-600">{data?.reservationStats.cancelled ?? 0}</p>
                                    <p className="text-sm text-gray-700">ยกเลิก</p>
                                </div>
                            </div>

                            {/* Conversion Rate */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">อัตราความสำเร็จ</h3>
                                    <p className="text-4xl font-bold text-green-600">
                                        {calculatePercentage(data?.reservationStats.completed ?? 0, data?.reservationStats.total ?? 0)}
                                    </p>
                                    <p className="text-sm text-green-700 mt-2">
                                        การจองที่แปลงเป็นการยืมสำเร็จ
                                    </p>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-orange-900 mb-2">อัตราการยกเลิก</h3>
                                    <p className="text-4xl font-bold text-orange-600">
                                        {calculatePercentage(data?.reservationStats.cancelled ?? 0, data?.reservationStats.total ?? 0)}
                                    </p>
                                    <p className="text-sm text-orange-700 mt-2">
                                        การจองที่ถูกยกเลิก
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Department Filter */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">สาขาวิชา:</label>
                                    <select
                                        value={userDeptFilter}
                                        onChange={(e) => setUserDeptFilter(e.target.value)}
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        {(data?.departments ?? []).map((dept) => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">เรียงตาม:</label>
                                    <select
                                        value={userSortKey}
                                        onChange={(e) => setUserSortKey(e.target.value as UserSortKey)}
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="loan_count">จำนวนครั้งที่ยืม</option>
                                        <option value="total_activity">รวมกิจกรรม</option>
                                        <option value="overdue_count">เกินกำหนด</option>
                                        <option value="name">ชื่อ</option>
                                        <option value="department">สาขาวิชา</option>
                                    </select>
                                    <button
                                        onClick={() => setUserSortAsc(!userSortAsc)}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        {userSortAsc ? '↑ น้อย-มาก' : '↓ มาก-น้อย'}
                                    </button>
                                </div>
                            </div>

                            {/* Summary by Department */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
                                    <p className="text-sm text-blue-700">ผู้ใช้ทั้งหมด</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {filteredUsers.reduce((sum, u) => sum + u.loan_count, 0)}
                                    </p>
                                    <p className="text-sm text-green-700">ยืมทั้งหมด</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {filteredUsers.reduce((sum, u) => sum + u.reservation_count, 0)}
                                    </p>
                                    <p className="text-sm text-purple-700">จองทั้งหมด</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {filteredUsers.filter(u => u.overdue_count > 0).length}
                                    </p>
                                    <p className="text-sm text-red-700">คืนล่าช้า</p>
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        รายชื่อผู้ใช้ ({filteredUsers.length} คน)
                                    </h3>
                                    <button
                                        onClick={exportUserStatsCSV}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลำดับ</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อ-สกุล</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">อีเมล</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สาขาวิชา</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">ยืม</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">จอง</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">เกินกำหนด</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {isLoading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i}>
                                                        {[...Array(7)].map((_, j) => (
                                                            <td key={j} className="px-6 py-4">
                                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                        ไม่มีข้อมูลผู้ใช้
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((user, index) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                            {`${user.first_name} ${user.last_name}`.trim() || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {user.department}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="font-semibold text-green-600">{user.loan_count}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="font-semibold text-purple-600">{user.reservation_count}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {user.overdue_count > 0 ? (
                                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    {user.overdue_count} ครั้ง
                                                                </span>
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
                            </div>
                        </div>
                    )}
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
