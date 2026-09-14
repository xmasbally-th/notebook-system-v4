'use client'

import { useState } from 'react'
import {
    Star, MessageSquare, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon
} from 'lucide-react'
import type { EvaluationItem, ViewMode } from '../types'

interface CompletedEvaluationsTabProps {
    evaluations: EvaluationItem[]
    isLoading: boolean
    currentPage: number
    pageSize: number
    setCurrentPage: (page: number | ((prev: number) => number)) => void
    expandedRows: string[]
    toggleExpand: (id: string) => void
    formatDate: (date: string) => string
}

export default function CompletedEvaluationsTab({
    evaluations,
    isLoading,
    currentPage,
    pageSize,
    setCurrentPage,
    expandedRows,
    toggleExpand,
    formatDate
}: CompletedEvaluationsTabProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('cards')

    // Pagination calculations
    const totalPages = Math.ceil(evaluations.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedItems = evaluations.slice(startIndex, startIndex + pageSize)

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                                </div>
                                <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="h-12 bg-gray-50 rounded-xl"></div>
                            <div className="flex justify-between items-center pt-2">
                                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (evaluations.length === 0) {
        return (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm max-w-lg mx-auto my-8 w-full">
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="absolute inset-0 bg-blue-50 rounded-full"></div>
                    <div className="absolute inset-2 bg-blue-100/40 rounded-full"></div>
                    <MessageSquare className="w-9 h-9 text-blue-600 relative z-10 drop-shadow-sm" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">ไม่พบประวัติผลการประเมิน</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    ยังไม่มีข้อมูลหรือผลการประเมินความพึงพอใจในช่วงเวลาหรือตัวกรองที่เลือกในขณะนี้
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-4 md:p-6 bg-gray-50/30">
            {/* View Mode Toggle Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500">
                    พบทั้งหมด <strong className="text-gray-900">{evaluations.length}</strong> รายการประเมิน
                </p>
                <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
                    <button
                        onClick={() => setViewMode('cards')}
                        aria-label="มุมมองการ์ดรีวิว"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            viewMode === 'cards'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        การ์ดรีวิว
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        aria-label="มุมมองตารางกะทัดรัด"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            viewMode === 'table'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <TableIcon className="w-3.5 h-3.5" />
                        ตารางสรุป
                    </button>
                </div>
            </div>

            {/* View Mode 1: Review Cards Grid */}
            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {paginatedItems.map((item) => {
                        const ratingBg = item.rating >= 4
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : item.rating >= 3
                                ? 'bg-amber-50 border-amber-100 text-amber-800'
                                : 'bg-rose-50 border-rose-100 text-rose-800'
                        const isExpanded = expandedRows.includes(item.id)

                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
                                    isExpanded ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/5' : 'border-gray-200'
                                }`}
                            >
                                {/* Card Top: User Info & Date */}
                                <div className="p-5 pb-3 flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                            {item.profiles?.first_name?.[0] || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">
                                                {item.profiles?.first_name} {item.profiles?.last_name}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.profiles?.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 whitespace-nowrap">
                                        {formatDate(item.created_at)}
                                    </span>
                                </div>

                                {/* Card Middle: Equipment Info & Rating */}
                                <div className="px-5 pb-3">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">อุปกรณ์ที่ยืม</p>
                                            <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{item.loanRequests?.equipment?.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{item.loanRequests?.equipment?.equipment_number}</p>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-extrabold flex-shrink-0 ${ratingBg}`}>
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            <span>{item.rating}.0</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Suggestions */}
                                {item.suggestions && (
                                    <div className="px-5 pb-4">
                                        <div className="bg-slate-50/50 border border-slate-200/40 rounded-xl p-3">
                                            <p className="text-[10px] font-semibold text-slate-400">ข้อเสนอแนะ:</p>
                                            <p className="text-xs text-slate-600 italic mt-1 leading-relaxed">
                                                "{item.suggestions}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Card Bottom: Toggle details & details view */}
                                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex flex-col gap-3">
                                    <button
                                        onClick={() => toggleExpand(item.id)}
                                        aria-expanded={isExpanded}
                                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <span>{isExpanded ? 'ซ่อนคะแนนประเมินรายข้อ' : 'แสดงคะแนนประเมินรายข้อ'}</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {[
                                                    { category: 'system', title: 'ระบบ (System)' },
                                                    { category: 'service', title: 'บริการ (Service)' },
                                                    { category: 'equipment', title: 'อุปกรณ์ (Equip)' },
                                                    { category: 'overall', title: 'ภาพรวม (Overall)' }
                                                ].map((section) => {
                                                    let categoryAvg = 0
                                                    const details = item.details || {}

                                                    if (details.system_overall !== undefined) {
                                                        if (section.category === 'system') {
                                                            categoryAvg = details.system_overall || 0
                                                        } else if (section.category === 'service') {
                                                            const scores = [details.service_speed, details.service_staff].filter(s => typeof s === 'number' && s > 0) as number[]
                                                            categoryAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
                                                        } else if (section.category === 'equipment') {
                                                            categoryAvg = details.equipment_quality || 0
                                                        } else if (section.category === 'overall') {
                                                            categoryAvg = details.overall_satisfaction || item.rating || 0
                                                        }
                                                    } else {
                                                        if (section.category === 'overall') {
                                                            categoryAvg = item.rating || 0
                                                        } else {
                                                            const scores = details[section.category] || {}
                                                            const values = Object.values(scores).filter((s: any) => typeof s === 'number' && s > 0) as number[]
                                                            const categorySum = values.reduce((acc: number, cur: number) => acc + cur, 0)
                                                            const categoryCount = values.length || 1
                                                            categoryAvg = categorySum / categoryCount
                                                        }
                                                    }

                                                    return (
                                                        <div key={section.category} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm space-y-1.5 text-center">
                                                            <span className="text-[10px] font-bold text-gray-500 block truncate">{section.title}</span>
                                                            <div className="flex items-center justify-center gap-1 font-extrabold text-xs text-gray-800 bg-gray-50 py-0.5 rounded-lg border border-gray-100">
                                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                                {categoryAvg ? categoryAvg.toFixed(1) : '-'}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* View Mode 2: Compact Table */
                <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ผู้ประเมิน</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">อุปกรณ์</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">คะแนนรวม</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">ระบบ</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">บริการ</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">อุปกรณ์</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">ภาพรวม</th>
                                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ข้อเสนอแนะ</th>
                                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">วันที่</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-xs">
                            {paginatedItems.map((item) => {
                                const d = item.details || {}
                                const sys = d.system_overall ?? '-'
                                const speed = d.service_speed ?? 0
                                const staff = d.service_staff ?? 0
                                const serviceAvg = (speed > 0 || staff > 0) ? ((speed + staff) / 2).toFixed(1) : '-'
                                const equip = d.equipment_quality ?? '-'
                                const overall = d.overall_satisfaction ?? item.rating

                                return (
                                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                    {item.profiles?.first_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{item.profiles?.first_name} {item.profiles?.last_name}</div>
                                                    <div className="text-[11px] text-gray-400">{item.profiles?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="font-semibold text-gray-800">{item.loanRequests?.equipment?.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">#{item.loanRequests?.equipment?.equipment_number}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-lg border text-xs ${
                                                item.rating >= 4 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                                item.rating >= 3 ? 'bg-amber-50 text-amber-800 border-amber-100' :
                                                'bg-rose-50 text-rose-800 border-rose-100'
                                            }`}>
                                                <Star className="w-3 h-3 fill-current" />
                                                {item.rating}.0
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-gray-600">{sys}</td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-gray-600">{serviceAvg}</td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-gray-600">{equip}</td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-gray-600">{overall}</td>
                                        <td className="px-5 py-3 max-w-xs">
                                            {item.suggestions ? (
                                                <span className="text-gray-600 italic truncate block" title={item.suggestions}>
                                                    "{item.suggestions}"
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-right whitespace-nowrap text-gray-400 font-mono text-[11px]">
                                            {formatDate(item.created_at)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-white px-6 py-4 flex items-center justify-between border border-gray-200 rounded-2xl shadow-sm mt-4">
                    <div className="text-xs font-semibold text-gray-500">
                        แสดง {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, evaluations.length)} จาก {evaluations.length} รายการ
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            aria-label="หน้าก่อนหน้า"
                            className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx + 1)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    currentPage === idx + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            aria-label="หน้าถัดไป"
                            className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
