'use client'

import { Calendar, Download, Search } from 'lucide-react'
import type { DateRange, TabType, RatingFilter, PendingFilter } from '../types'

interface EvaluationFilterBarProps {
    activeTab: TabType
    dateRange: DateRange
    setDateRange: React.Dispatch<React.SetStateAction<DateRange>>
    handleSetDateRangePreset: (preset: '7days' | '30days' | 'thisMonth' | 'allTime') => void
    handleExportCSV: () => void
    hasCompletedEvaluations: boolean
    searchTerm: string
    setSearchTerm: (term: string) => void
    ratingFilter: RatingFilter
    setRatingFilter: (filter: RatingFilter) => void
    pendingFilter: PendingFilter
    setPendingFilter: (filter: PendingFilter) => void
    mandatoryCount: number
    totalPendingCount: number
    pageSize: number
    setPageSize: (size: number) => void
}

export default function EvaluationFilterBar({
    activeTab,
    dateRange,
    setDateRange,
    handleSetDateRangePreset,
    handleExportCSV,
    hasCompletedEvaluations,
    searchTerm,
    setSearchTerm,
    ratingFilter,
    setRatingFilter,
    pendingFilter,
    setPendingFilter,
    mandatoryCount,
    totalPendingCount,
    pageSize,
    setPageSize
}: EvaluationFilterBarProps) {
    return (
        <div className="space-y-4">
            {/* Top Bar: Date presets & CSV Export */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold">ช่วงเวลาผลลัพธ์:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            aria-label="วันที่เริ่มต้น"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                        <span className="text-gray-400 text-sm">ถึง</span>
                        <input
                            type="date"
                            aria-label="วันที่สิ้นสุด"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            { label: '7 วัน', value: '7days' },
                            { label: '30 วัน', value: '30days' },
                            { label: 'เดือนนี้', value: 'thisMonth' },
                            { label: 'ทั้งหมด', value: 'allTime' }
                        ].map((btn) => (
                            <button
                                key={btn.value}
                                onClick={() => handleSetDateRangePreset(btn.value as any)}
                                className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-medium text-gray-600 bg-white"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={!hasCompletedEvaluations}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow"
                >
                    <Download className="w-4 h-4" />
                    ส่งออกผลการประเมิน (CSV)
                </button>
            </div>

            {/* Bottom Bar: Search & Specific Filters */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-gray-50/50 rounded-t-2xl">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        aria-label="ค้นหาผู้ใช้ อีเมล หรือชื่ออุปกรณ์"
                        placeholder="ค้นหาผู้ใช้, อีเมล, ชื่ออุปกรณ์, รหัสครุภัณฑ์..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {activeTab === 'completed' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">ตัวกรองคะแนน:</span>
                            <select
                                value={ratingFilter}
                                aria-label="ตัวกรองคะแนนประเมิน"
                                onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
                                className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                            >
                                <option value="all">คะแนนทั้งหมด</option>
                                <option value="high">ดีเยี่ยม (4-5 ดาว)</option>
                                <option value="medium">ปานกลาง (3 ดาว)</option>
                                <option value="low">ปรับปรุง (1-2 ดาว)</option>
                            </select>
                        </div>
                    )}

                    {activeTab === 'pending' && (
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
                            <button
                                onClick={() => setPendingFilter('mandatory')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    pendingFilter === 'mandatory'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                บังคับ ({mandatoryCount})
                            </button>
                            <button
                                onClick={() => setPendingFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    pendingFilter === 'all'
                                        ? 'bg-gray-100 text-gray-700'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                ทั้งหมด ({totalPendingCount})
                            </button>
                        </div>
                    )}

                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">แสดงหน้าละ:</span>
                        <select
                            value={pageSize}
                            aria-label="แสดงหน้าละ"
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="px-2 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                        >
                            <option value={10}>10 รายการ</option>
                            <option value={25}>25 รายการ</option>
                            <option value={50}>50 รายการ</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}
