'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ReportData } from '@/hooks/useReportData'
import { exportToCSV, getStatusLabel, getStatusColor } from '@/lib/reports'
import {
    Calendar,
    FileDown,
    Search,
    Award,
    Tag,
    Building2,
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    HelpCircle
} from 'lucide-react'

// Dynamic import for chart
const MonthlyTrendChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.MonthlyTrendChart })), { ssr: false })

interface MonthlyTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function MonthlyTab({ data, isLoading }: MonthlyTabProps) {
    const [selectedMonthKey, setSelectedMonthKey] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Auto-select latest month when data loads
    useEffect(() => {
        if (data?.monthlyStats && data.monthlyStats.length > 0 && !selectedMonthKey) {
            setSelectedMonthKey(data.monthlyStats[data.monthlyStats.length - 1].monthKey)
        }
    }, [data?.monthlyStats, selectedMonthKey])

    // Find current selected month stats
    const selectedMonthData = useMemo(() => {
        if (!data?.monthlyStats || data.monthlyStats.length === 0) return undefined
        return data.monthlyStats.find(s => s.monthKey === selectedMonthKey) || data.monthlyStats[data.monthlyStats.length - 1]
    }, [data?.monthlyStats, selectedMonthKey])

    // Filter details based on search query
    const filteredDetails = useMemo(() => {
        if (!selectedMonthData?.details) return []
        const query = searchQuery.trim().toLowerCase()
        if (!query) return selectedMonthData.details
        return selectedMonthData.details.filter(item => 
            item.user_name.toLowerCase().includes(query) ||
            item.department.toLowerCase().includes(query) ||
            item.equipment_name.toLowerCase().includes(query) ||
            item.equipment_number.toLowerCase().includes(query) ||
            (item.type === 'loan' ? 'ยืม คืน' : 'จอง').includes(query)
        )
    }, [selectedMonthData?.details, searchQuery])

    // Reset page when month or search query changes
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedMonthKey, searchQuery])

    const exportMonthlyCSV = () => {
        if (!data?.monthlyStats) return
        exportToCSV({
            filename: 'รายงานสรุปรายเดือน_รวม',
            headers: ['เดือน', 'การยืม (ครั้ง)', 'การจอง (ครั้ง)', 'คืนแล้ว (ครั้ง)', 'เกินกำหนด/คืนสาย (ครั้ง)'],
            rows: data.monthlyStats.map(stat => [
                stat.month,
                stat.loans,
                stat.reservations,
                stat.returned,
                stat.overdue
            ])
        })
    }

    const exportMonthDetailsCSV = () => {
        if (!selectedMonthData) return
        exportToCSV({
            filename: `รายงานการใช้งานประจำเดือน_${selectedMonthData.month.replace(' ', '_')}`,
            headers: ['ลำดับ', 'วันที่-เวลา', 'ประเภท', 'ผู้ใช้งาน', 'หน่วยงาน/สาขาวิชา', 'อุปกรณ์', 'รหัสอุปกรณ์', 'สถานะ'],
            rows: selectedMonthData.details.map((d, index) => [
                index + 1,
                new Date(d.date).toLocaleString('th-TH'),
                d.type === 'loan' ? 'ยืม-คืน' : 'การจอง',
                d.user_name,
                d.department,
                d.equipment_name,
                d.equipment_number,
                getStatusLabel(d.status)
            ])
        })
    }

    // Format transaction date helper
    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' น.'
    }

    // Paginated items
    const paginatedDetails = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredDetails.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredDetails, currentPage])

    const totalPages = Math.ceil(filteredDetails.length / ITEMS_PER_PAGE)

    return (
        <div className="space-y-8">
            {/* Monthly Trend Chart */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">แนวโน้มการยืม-จองรายเดือน</h3>
                        <p className="text-xs text-gray-500 mt-0.5">กราฟแสดงการเปรียบเทียบธุรกรรมย้อนหลัง</p>
                    </div>
                    <button
                        onClick={exportMonthlyCSV}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        Export สรุปรวมรายเดือน (.CSV)
                    </button>
                </div>
                <div className="h-[300px]">
                    <MonthlyTrendChart data={data?.monthlyStats ?? []} />
                </div>
            </div>

            {/* Monthly Detailed Dashboard */}
            <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                {/* Header Selector */}
                <div className="p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">รายงานการใช้งานรายเดือนเชิงลึก</h3>
                            <p className="text-xs text-gray-500 mt-0.5">เลือกเดือนเพื่อดูสถิติการใช้งานโดยละเอียด</p>
                        </div>
                    </div>

                    {/* Month selector dropdown */}
                    <div className="flex items-center gap-3">
                        {selectedMonthData && (
                            <button
                                onClick={exportMonthDetailsCSV}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-100"
                            >
                                <FileDown className="w-3.5 h-3.5" />
                                Export ข้อมูลประจำเดือน (.CSV)
                            </button>
                        )}
                        <select
                            value={selectedMonthKey}
                            onChange={(e) => setSelectedMonthKey(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer"
                        >
                            {!data?.monthlyStats || data.monthlyStats.length === 0 ? (
                                <option value="">ไม่มีข้อมูล</option>
                            ) : (
                                data.monthlyStats.map(stat => (
                                    <option key={stat.monthKey} value={stat.monthKey}>
                                        {stat.month}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500 font-medium animate-pulse">กำลังประมวลผลสถิติรายเดือน...</p>
                    </div>
                ) : !selectedMonthData ? (
                    <div className="p-12 text-center text-gray-400">
                        ไม่มีข้อมูลสรุปรายเดือนในช่วงเวลานี้
                    </div>
                ) : (
                    <div className="p-6 space-y-8">
                        {/* Month Stats Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl border border-gray-100 bg-blue-50/20 flex items-center gap-3.5 shadow-sm">
                                <div className="p-3 bg-blue-500 text-white rounded-xl">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">ยอดการยืม</p>
                                    <p className="text-xl font-bold text-gray-900 mt-0.5">{selectedMonthData.loans} <span className="text-xs font-medium text-gray-500">ครั้ง</span></p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-100 bg-purple-50/20 flex items-center gap-3.5 shadow-sm">
                                <div className="p-3 bg-purple-500 text-white rounded-xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">ยอดการจอง</p>
                                    <p className="text-xl font-bold text-gray-900 mt-0.5">{selectedMonthData.reservations} <span className="text-xs font-medium text-gray-500">ครั้ง</span></p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-100 bg-green-50/20 flex items-center gap-3.5 shadow-sm">
                                <div className="p-3 bg-green-500 text-white rounded-xl">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">คืนแล้ว</p>
                                    <p className="text-xl font-bold text-gray-900 mt-0.5">{selectedMonthData.returned} <span className="text-xs font-medium text-gray-500">ครั้ง</span></p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-100 bg-red-50/20 flex items-center gap-3.5 shadow-sm">
                                <div className="p-3 bg-red-500 text-white rounded-xl">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">เกินกำหนด/คืนสาย</p>
                                    <p className="text-xl font-bold text-gray-900 mt-0.5">{selectedMonthData.overdue} <span className="text-xs font-medium text-gray-500">ครั้ง</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Popular Equipment */}
                            <div className="border border-gray-100 rounded-xl p-5 shadow-sm bg-white">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                                    <Award className="w-4 h-4 text-yellow-500" />
                                    <h4 className="font-bold text-gray-800 text-sm">5 อันดับอุปกรณ์ยอดนิยม</h4>
                                </div>
                                <div className="space-y-4">
                                    {selectedMonthData.popularEquipment.length === 0 ? (
                                        <p className="text-center py-6 text-xs text-gray-400">ไม่มีข้อมูลการยืม/จองในเดือนนี้</p>
                                    ) : (
                                        selectedMonthData.popularEquipment.map((item, index) => {
                                            const max = selectedMonthData.popularEquipment[0]?.count || 1
                                            const pct = (item.count / max) * 100
                                            return (
                                                <div key={item.id} className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-medium text-gray-700 truncate pr-2" title={item.name}>
                                                            {index + 1}. {item.name} <span className="text-gray-400 text-[10px]">({item.equipment_number})</span>
                                                        </span>
                                                        <span className="font-bold text-blue-600 whitespace-nowrap">{item.count} ครั้ง</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Equipment Type Usage */}
                            <div className="border border-gray-100 rounded-xl p-5 shadow-sm bg-white">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                                    <Tag className="w-4 h-4 text-blue-500" />
                                    <h4 className="font-bold text-gray-800 text-sm">การใช้งานแยกตามประเภทอุปกรณ์</h4>
                                </div>
                                <div className="space-y-4">
                                    {selectedMonthData.equipmentTypeUsage.length === 0 ? (
                                        <p className="text-center py-6 text-xs text-gray-400">ไม่มีข้อมูลการใช้งานในเดือนนี้</p>
                                    ) : (
                                        selectedMonthData.equipmentTypeUsage.map(item => {
                                            const max = selectedMonthData.equipmentTypeUsage[0]?.count || 1
                                            const pct = (item.count / max) * 100
                                            return (
                                                <div key={item.name} className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                                            <span>{item.icon}</span>
                                                            <span className="truncate">{item.name}</span>
                                                        </span>
                                                        <span className="font-bold text-purple-600">{item.count} ครั้ง</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Department Usage */}
                            <div className="border border-gray-100 rounded-xl p-5 shadow-sm bg-white">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                                    <Building2 className="w-4 h-4 text-purple-500" />
                                    <h4 className="font-bold text-gray-800 text-sm">การใช้งานแยกตามสาขาวิชา/หน่วยงาน</h4>
                                </div>
                                <div className="space-y-4">
                                    {selectedMonthData.departmentUsage.length === 0 ? (
                                        <p className="text-center py-6 text-xs text-gray-400">ไม่มีข้อมูลหน่วยงานในเดือนนี้</p>
                                    ) : (
                                        selectedMonthData.departmentUsage.map(item => {
                                            const max = selectedMonthData.departmentUsage[0]?.count || 1
                                            const pct = (item.count / max) * 100
                                            return (
                                                <div key={item.department} className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-medium text-gray-700 truncate pr-2" title={item.department}>
                                                            {item.department}
                                                        </span>
                                                        <span className="font-bold text-green-600">{item.count} ครั้ง</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Month Details Transaction Table */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
                                <h4 className="font-bold text-gray-800 text-sm">
                                    ประวัติธุรกรรมประจำเดือน {selectedMonthData.month}
                                    <span className="ml-2 font-normal text-xs text-gray-500">({filteredDetails.length} รายการ)</span>
                                </h4>

                                {/* Search details */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ, สาขาวิชา, อุปกรณ์..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 w-full bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">วันที่-เวลา</th>
                                            <th className="px-5 py-3 text-center font-bold text-gray-600 uppercase tracking-wider w-20">ประเภท</th>
                                            <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">ผู้ใช้</th>
                                            <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">สาขาวิชา/หน่วยงาน</th>
                                            <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">อุปกรณ์</th>
                                            <th className="px-5 py-3 text-center font-bold text-gray-600 uppercase tracking-wider w-24">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedDetails.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                                                    ไม่พบรายการธุรกรรมตามเงื่อนไขที่ค้นหา
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedDetails.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                                                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                                                        {formatDateTime(item.date)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                                            item.type === 'loan' 
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                                : 'bg-purple-50 text-purple-700 border border-purple-100'
                                                        }`}>
                                                            {item.type === 'loan' ? 'ยืม-คืน' : 'จอง'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                                                        {item.user_name}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-600 font-medium">
                                                        {item.department}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-gray-800">{item.equipment_name}</div>
                                                        <div className="font-mono text-[9px] text-gray-400 mt-0.5">#{item.equipment_number}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(item.status)}`}>
                                                            {getStatusLabel(item.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-5 py-4 border-t border-gray-50 bg-white flex items-center justify-between">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ก่อนหน้า
                                    </button>
                                    <span className="text-xs text-gray-500 font-semibold">
                                        หน้า {currentPage} จากทั้งหมด {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ถัดไป
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
