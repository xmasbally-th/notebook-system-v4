'use client'

import { useTransition, useOptimistic, useState, useMemo } from 'react'
import {
    ClipboardList, CheckCircle, XCircle, Clock,
    Search, AlertTriangle, User, Package,
    Calendar, ArrowUpRight
} from 'lucide-react'
import Image from 'next/image'
import { approveLoanRequests, rejectLoanRequests } from '@/app/admin/loans/actions'
import { useToast } from '@/components/ui/toast'

type LoanStatus = 'pending' | 'approved' | 'rejected' | 'returned'

interface LoanRequest {
    id: string
    status: LoanStatus
    start_date: string
    end_date: string
    return_time?: string | null
    reason?: string | null
    profiles?: { first_name?: string; last_name?: string; email?: string; avatar_url?: string } | null
    equipment?: { name?: string; equipment_number?: string; images?: string[] } | null
}

const STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700', icon: XCircle },
    returned: { label: 'คืนแล้ว', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

interface Props {
    initialData: LoanRequest[]
}

export default function LoanRequestsSection({ initialData }: Props) {
    const toast = useToast()
    const [isPending, startTransition] = useTransition()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // ─── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        return {
            total: initialData.length,
            pending: initialData.filter(r => r.status === 'pending').length,
            approved: initialData.filter(r => r.status === 'approved').length,
            rejected: initialData.filter(r => r.status === 'rejected').length,
        }
    }, [initialData])

    // ─── Filter ───────────────────────────────────────────────────────────────
    const filteredItems = useMemo(() => {
        return initialData.filter(item => {
            const s = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                (item.profiles?.first_name || '').toLowerCase().includes(s) ||
                (item.profiles?.last_name || '').toLowerCase().includes(s) ||
                (item.profiles?.email || '').toLowerCase().includes(s) ||
                (item.equipment?.name || '').toLowerCase().includes(s) ||
                (item.equipment?.equipment_number || '').toLowerCase().includes(s)
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [initialData, searchTerm, statusFilter])

    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    // ─── Actions ───────────────────────────────────────────────────────────────
    const toggleSelect = (id: string) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const handleBulkAction = (action: 'approved' | 'rejected') => {
        if (!confirm(`ยืนยันการ${action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ${selectedIds.length} คำขอ?`)) return
        startTransition(async () => {
            const fn = action === 'approved' ? approveLoanRequests : rejectLoanRequests
            const result = await fn(selectedIds)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`${action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ${result.count} รายการสำเร็จ`)
                setSelectedIds([])
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'คำขอทั้งหมด', value: stats.total, color: 'text-gray-900', bg: 'bg-blue-50', icon: ClipboardList, iconColor: 'text-blue-600' },
                    { label: 'รออนุมัติ', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, iconColor: 'text-yellow-600' },
                    { label: 'อนุมัติแล้ว', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, iconColor: 'text-green-600' },
                    { label: 'ปฏิเสธ', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, iconColor: 'text-red-600' },
                ].map(({ label, value, color, bg, icon: Icon, iconColor }) => (
                    <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 ${bg} rounded-lg`}>
                                <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">รายการคำขอยืม</h2>
                        <div className="flex gap-2">
                            <button
                                disabled={selectedIds.length === 0 || isPending}
                                onClick={() => handleBulkAction('approved')}
                                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 hover:bg-green-700 text-sm font-medium"
                            >
                                <CheckCircle className="w-4 h-4" />
                                อนุมัติ ({selectedIds.length})
                            </button>
                            <button
                                disabled={selectedIds.length === 0 || isPending}
                                onClick={() => handleBulkAction('rejected')}
                                className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 hover:bg-red-700 text-sm font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                ปฏิเสธ ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อผู้ยืม, อุปกรณ์..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                            />
                        </div>
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="pending">รออนุมัติ</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="rejected">ปฏิเสธ</option>
                            <option value="returned">คืนแล้ว</option>
                        </select>
                    </div>
                </div>

                {/* Body */}
                {paginatedItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่พบคำขอยืม</p>
                        {(searchTerm || statusFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all') }}
                                className="text-blue-600 hover:underline text-sm mt-2"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(paginatedItems.filter(r => r.status === 'pending').map(r => r.id))
                                                    } else {
                                                        setSelectedIds([])
                                                    }
                                                }}
                                                checked={
                                                    paginatedItems.filter(r => r.status === 'pending').length > 0 &&
                                                    selectedIds.length === paginatedItems.filter(r => r.status === 'pending').length
                                                }
                                            />
                                        </th>
                                        {['ผู้ยืม', 'อุปกรณ์', 'วันที่ยืม-คืน', 'สถานะ', 'เหตุผล'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedItems.map(request => {
                                        const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending
                                        const Icon = cfg.icon
                                        const canSelect = request.status === 'pending'
                                        return (
                                            <tr key={request.id} className={`hover:bg-gray-50 ${selectedIds.includes(request.id) ? 'bg-blue-50' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                        disabled={!canSelect}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                            {request.profiles?.avatar_url ? (
                                                                <Image src={request.profiles.avatar_url} alt="" width={32} height={32} className="object-cover" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.profiles?.first_name} {request.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{request.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                            {request.equipment?.images?.[0] ? (
                                                                <Image src={request.equipment.images[0]} alt="" width={40} height={40} className="object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{request.equipment?.name || '-'}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{request.equipment?.equipment_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(request.start_date)}</span>
                                                        <ArrowUpRight className="w-3 h-3 text-gray-400" />
                                                        <span>
                                                            {formatDate(request.end_date)}
                                                            {request.return_time && <span className="text-gray-500 ml-1">{request.return_time.slice(0, 5)} น.</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                                                        <Icon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-gray-600 truncate max-w-[200px]" title={request.reason ?? ''}>
                                                        {request.reason || '-'}
                                                    </p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden p-4 space-y-3">
                            {paginatedItems.map(request => {
                                const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending
                                const Icon = cfg.icon
                                const canSelect = request.status === 'pending'
                                return (
                                    <div
                                        key={request.id}
                                        className={`bg-gray-50 rounded-xl p-4 border ${selectedIds.includes(request.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {canSelect && (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                    />
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {request.profiles?.avatar_url ? (
                                                        <Image src={request.profiles.avatar_url} alt="" width={32} height={32} className="object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {request.profiles?.first_name} {request.profiles?.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{request.profiles?.email}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.color}`}>
                                                <Icon className="w-3 h-3" />
                                                <span className="hidden sm:inline">{cfg.label}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3 bg-white rounded-lg p-2">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {request.equipment?.images?.[0] ? (
                                                    <Image src={request.equipment.images[0]} alt="" width={48} height={48} className="object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{request.equipment?.name || '-'}</p>
                                                <p className="text-xs text-gray-500 font-mono">{request.equipment?.equipment_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                                {request.return_time && ` ${request.return_time.slice(0, 5)} น.`}
                                            </span>
                                        </div>
                                        {request.reason && (
                                            <p className="text-gray-500 text-xs line-clamp-2 mt-2">{request.reason}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {filteredItems.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>แสดง</span>
                            <select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                            >
                                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span>รายการ | {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} จาก {filteredItems.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                ก่อนหน้า
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
