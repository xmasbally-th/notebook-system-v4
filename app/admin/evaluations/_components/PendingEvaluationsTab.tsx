'use client'

import { useState } from 'react'
import {
    Clock, AlertTriangle, Archive, CheckCircle, Bell, Loader2,
    ChevronLeft, ChevronRight, Download
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { PendingLoan, PendingFilter } from '../types'
import { sendEvaluationReminder } from '../actions'

interface PendingEvaluationsTabProps {
    pendingLoans: PendingLoan[]
    isLoading: boolean
    pendingFilter: PendingFilter
    cutoffDate: string
    currentPage: number
    pageSize: number
    setCurrentPage: (page: number | ((prev: number) => number)) => void
    formatDateShort: (date: string) => string
}

export default function PendingEvaluationsTab({
    pendingLoans,
    isLoading,
    pendingFilter,
    cutoffDate,
    currentPage,
    pageSize,
    setCurrentPage,
    formatDateShort
}: PendingEvaluationsTabProps) {
    const [sendingId, setSendingId] = useState<string | null>(null)
    const [reminderStatus, setReminderStatus] = useState<Record<string, string>>({})

    const handleSendReminder = async (loanId: string, userName: string) => {
        setSendingId(loanId)
        try {
            const res = await sendEvaluationReminder(loanId)
            if (res.success) {
                setReminderStatus(prev => ({ ...prev, [loanId]: 'แจ้งเตือนแล้ว ✅' }))
            } else {
                alert(res.error || 'เกิดข้อผิดพลาดในการส่งแจ้งเตือน')
            }
        } catch (err: any) {
            alert(err.message || 'ส่งแจ้งเตือนไม่สำเร็จ')
        } finally {
            setSendingId(null)
        }
    }

    const handleExportPendingCSV = () => {
        if (!pendingLoans.length) return

        const headers = ['ชื่อผู้ยืม', 'อีเมล', 'อุปกรณ์', 'รหัสครุภัณฑ์', 'วันที่ยืม', 'วันที่คืน', 'จำนวนวันนับจากคืน', 'สถานะข้อกำหนด']
        const csvContent = [
            headers.join(','),
            ...pendingLoans.map((loan) => {
                const days = Math.floor((Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24))
                const returnedDate = loan.updated_at?.split('T')[0] || ''
                const isMandatory = returnedDate >= cutoffDate

                return [
                    `"${(loan.profiles?.first_name || '')} ${(loan.profiles?.last_name || '')}"`.replace(/"/g, '""'),
                    `"${loan.profiles?.email || ''}"`,
                    `"${loan.equipment?.name || ''}"`,
                    `"${loan.equipment?.equipment_number || ''}"`,
                    formatDateShort(loan.start_date),
                    formatDateShort(loan.updated_at),
                    days,
                    isMandatory ? 'บังคับก่อนทำรายการใหม่' : 'ข้อมูลย้อนหลัง'
                ].join(',')
            })
        ].join('\n')

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `pending_evaluations_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Pagination calculations
    const totalPages = Math.ceil(pendingLoans.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedPending = pendingLoans.slice(startIndex, startIndex + pageSize)

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 space-y-3">
                <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-orange-50/50">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">ผู้ยืม</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">อุปกรณ์</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">วันที่ยืม</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">วันที่คืน</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3.5 text-center text-xs font-bold text-orange-800 uppercase tracking-wider">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...Array(4)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                            <div className="space-y-1.5 flex-1">
                                                <div className="h-4 w-28 bg-gray-200 rounded"></div>
                                                <div className="h-3 w-36 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-200 rounded-lg mx-auto"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (pendingLoans.length === 0) {
        return (
            <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/60 shadow-sm max-w-lg mx-auto my-8">
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="absolute inset-0 bg-emerald-50 rounded-full"></div>
                    <div className="absolute inset-2 bg-emerald-100/40 rounded-full"></div>
                    <CheckCircle className="w-9 h-9 text-emerald-600 relative z-10 drop-shadow-sm" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {pendingFilter === 'mandatory'
                        ? 'ไม่มีรายการบังคับประเมินคงค้างแล้ว 🎉'
                        : 'การประเมินเสร็จสมบูรณ์ครบถ้วน 🎉'
                    }
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {pendingFilter === 'mandatory'
                        ? 'ผู้ใช้งานที่คืนเครื่องหลังวันเริ่มบังคับได้ส่งแบบประเมินครบถ้วนแล้ว'
                        : 'ธุรกรรมการยืม-คืนอุปกรณ์ทั้งหมดได้รับการประเมินความพึงพอใจแล้ว'
                    }
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-4 md:p-6">
            {/* Header with Export Action */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs font-semibold text-gray-500">
                    พบทั้งหมด <strong className="text-orange-600">{pendingLoans.length}</strong> รายการที่ยังไม่ได้รับการประเมิน
                </p>
                <button
                    onClick={handleExportPendingCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    ส่งออกรายชื่อผู้ค้างประเมิน (CSV)
                </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-50/50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">ผู้ยืม</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">อุปกรณ์</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">วันที่ยืม</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">วันที่คืน</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">เกินกำหนด</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">สถานะข้อกำหนด</th>
                            <th className="px-6 py-3.5 text-center text-xs font-bold text-orange-800 uppercase tracking-wider">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPending.map((loan) => {
                            const daysSinceReturn = Math.floor(
                                (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                            )
                            const returnedDate = loan.updated_at?.split('T')[0] || ''
                            const isMandatory = returnedDate >= cutoffDate
                            const isOverdue = isMandatory && daysSinceReturn > 3
                            const isSending = sendingId === loan.id
                            const status = reminderStatus[loan.id]

                            return (
                                <tr key={loan.id} className={`hover:bg-orange-50/10 transition-colors ${isOverdue ? 'bg-rose-50/30' : !isMandatory ? 'bg-gray-50/20' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm mr-3 ${isMandatory ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {loan.profiles?.first_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 leading-4">
                                                    {loan.profiles?.first_name} {loan.profiles?.last_name}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">{loan.profiles?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-800">{loan.equipment?.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-1">#{loan.equipment?.equipment_number}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                        {formatDateShort(loan.start_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                        {formatDateShort(loan.updated_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isOverdue
                                            ? 'bg-rose-100 text-rose-700 border border-rose-200/50'
                                            : daysSinceReturn >= 1
                                                ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                                : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                            }`}>
                                            <Clock className="w-3.5 h-3.5" />
                                            {daysSinceReturn === 0 ? 'วันนี้' : `${daysSinceReturn} วัน`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isMandatory ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200/40">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                บังคับก่อนทำรายการใหม่
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/40">
                                                <Archive className="w-3.5 h-3.5" />
                                                ข้อมูลย้อนหลัง (ไม่บังคับ)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {status ? (
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                {status}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSendReminder(loan.id, loan.profiles?.first_name || '')}
                                                disabled={isSending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                                            >
                                                {isSending ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        กำลังส่ง...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bell className="w-3.5 h-3.5" />
                                                        ส่งแจ้งเตือน
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards List */}
            <div className="md:hidden space-y-3">
                {paginatedPending.map((loan) => {
                    const daysSinceReturn = Math.floor(
                        (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                    )
                    const returnedDate = loan.updated_at?.split('T')[0] || ''
                    const isMandatory = returnedDate >= cutoffDate
                    const isOverdue = isMandatory && daysSinceReturn > 3
                    const isSending = sendingId === loan.id
                    const status = reminderStatus[loan.id]

                    return (
                        <div
                            key={loan.id}
                            className={`bg-white rounded-2xl p-4 border shadow-sm space-y-3 transition-colors ${
                                isOverdue ? 'border-red-200 bg-rose-50/20' : !isMandatory ? 'border-gray-150 bg-gray-50/20' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm mr-3 flex-shrink-0 ${
                                        isMandatory ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {loan.profiles?.first_name?.[0] || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                            {loan.profiles?.first_name} {loan.profiles?.last_name}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate mt-0.5">{loan.profiles?.email}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">อุปกรณ์ที่คืน</div>
                                <div className="text-sm font-semibold text-gray-800 truncate mt-0.5">{loan.equipment?.name}</div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">#{loan.equipment?.equipment_number}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">วันที่ยืม</span>
                                    <span>{formatDateShort(loan.start_date)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">วันที่คืน</span>
                                    <span>{formatDateShort(loan.updated_at)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                    isOverdue
                                        ? 'bg-rose-100 text-rose-700 border border-rose-200/50'
                                        : daysSinceReturn >= 1
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {daysSinceReturn === 0 ? 'วันนี้' : `${daysSinceReturn} วัน`}
                                </span>

                                {status ? (
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                                        {status}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleSendReminder(loan.id, loan.profiles?.first_name || '')}
                                        disabled={isSending}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Bell className="w-3 h-3" />
                                        )}
                                        ส่งแจ้งเตือน
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-white px-6 py-4 flex items-center justify-between border border-gray-200 rounded-2xl shadow-sm mt-4">
                    <div className="text-xs font-semibold text-gray-500">
                        แสดง {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, pendingLoans.length)} จาก {pendingLoans.length} รายการ
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
