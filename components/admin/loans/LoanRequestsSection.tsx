'use client'

import React, { useTransition, useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    ClipboardList,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    AlertTriangle,
    User,
    Package,
    Calendar,
    ArrowUpRight,
    QrCode,
    Smartphone,
    ShieldCheck,
    Check,
    X,
    Loader2,
    Sparkles,
    Radio
} from 'lucide-react'
import { approveLoanRequests, rejectLoanRequests } from '@/app/admin/loans/actions'
import { useToast } from '@/components/ui/toast'
import QrScannerModal from '@/components/scanner/QrScannerModal'
import { supabase } from '@/lib/supabase/client'

type LoanStatus = 'pending' | 'approved' | 'rejected' | 'returned'

interface LoanRequest {
    id: string
    status: LoanStatus
    start_date: string
    end_date: string
    return_time?: string | null
    reason?: string | null
    profiles?: {
        first_name?: string
        last_name?: string
        email?: string
        avatar_url?: string
    } | null
    equipment?: {
        id?: string
        name?: string
        equipment_number?: string
        images?: string[]
    } | null
}

const STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'รออนุมัติ', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle },
    returned: { label: 'คืนแล้ว', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

interface Props {
    initialData: LoanRequest[]
}

export default function LoanRequestsSection({ initialData }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'counter' | 'online'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showScanner, setShowScanner] = useState(false)

    // Reject Modal state
    const [rejectModalItem, setRejectModalItem] = useState<LoanRequest | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    // Real-time listener for incoming requests
    useEffect(() => {
        const channel = supabase
            .channel('admin-loan-requests-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'loanRequests' },
                (payload) => {
                    toast.info('🔔 มีคำขอยืมใหม่เข้ามา')
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'loanRequests' },
                () => {
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, toast])

    // Scan QR to find equipment requests
    const handleScanCode = (code: string) => {
        let cleanCode = code.trim()
        const urlMatch = cleanCode.match(/\/(?:equipment|eq)\/([0-9a-fA-F-]{36})/)
        if (urlMatch && urlMatch[1]) {
            cleanCode = urlMatch[1]
        } else {
            const pathMatch = cleanCode.match(/\/(?:equipment|eq)\/([^\/\?#]+)/)
            if (pathMatch && pathMatch[1]) {
                cleanCode = decodeURIComponent(pathMatch[1])
            }
        }
        const stripped = cleanCode.replace(/^#/, '')

        const matched = initialData.find((item: any) => {
            const eqId = item.equipment?.id || item.equipment_id || ''
            const eqNum = (item.equipment?.equipment_number || '').replace(/^#/, '').toLowerCase()
            return eqId === cleanCode || eqNum === stripped.toLowerCase()
        })

        startTransition(() => {
            setSearchTerm(matched?.equipment?.equipment_number || stripped)
            setCurrentPage(1)
        })

        setTimeout(() => {
            setShowScanner(false)
        }, 400)

        if (matched) {
            toast.success(`กรองคำขอตามอุปกรณ์: ${matched.equipment?.name || ''} (${matched.equipment?.equipment_number || ''})`)
        } else {
            toast.info(`ค้นหาคำขอยืมด้วยรหัส "${stripped}"`)
        }
    }

    // Helper: Check if request is on-site counter verified
    const isCounterVerified = (req: LoanRequest) => {
        const r = req.reason || ''
        return r.includes('สแกน QR') || r.includes('เคาน์เตอร์') || r.includes('On-site')
    }

    // Stats
    const stats = useMemo(() => {
        const pendingItems = initialData.filter(r => r.status === 'pending')
        return {
            total: initialData.length,
            pending: pendingItems.length,
            pendingCounter: pendingItems.filter(isCounterVerified).length,
            approved: initialData.filter(r => r.status === 'approved').length,
            rejected: initialData.filter(r => r.status === 'rejected').length,
        }
    }, [initialData])

    // Filter Items
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

            const isCounter = isCounterVerified(item)
            const matchesVerification =
                verificationFilter === 'all' ||
                (verificationFilter === 'counter' && isCounter) ||
                (verificationFilter === 'online' && !isCounter)

            return matchesSearch && matchesStatus && matchesVerification
        })
    }, [initialData, searchTerm, statusFilter, verificationFilter])

    const totalPages = Math.ceil(filteredItems.length / pageSize) || 1
    const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    // Selection
    const toggleSelect = (id: string) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    // Single item quick action: Approve
    const handleSingleApprove = (req: LoanRequest) => {
        const borrowerName = `${req.profiles?.first_name || ''} ${req.profiles?.last_name || ''}`.trim()
        const eqName = req.equipment?.name || 'อุปกรณ์'
        const verifiedText = isCounterVerified(req) ? ' (ผู้ใช้อยู่หน้าเคาน์เตอร์)' : ''

        if (!confirm(`ยืนยันการอนุมัติและส่งมอบ "${eqName}" ให้คุณ ${borrowerName}${verifiedText}?`)) return

        setProcessingId(req.id)
        startTransition(async () => {
            try {
                const result = await approveLoanRequests([req.id])
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success(`อนุมัติและส่งมอบ ${eqName} สำเร็จ`)
                    setSelectedIds(prev => prev.filter(x => x !== req.id))
                }
            } catch (err: any) {
                toast.error(err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ')
            } finally {
                setProcessingId(null)
            }
        })
    }

    // Single item quick action: Reject prompt
    const handleOpenRejectModal = (req: LoanRequest) => {
        setRejectModalItem(req)
        setRejectReason('')
    }

    const handleConfirmReject = () => {
        if (!rejectModalItem) return
        const id = rejectModalItem.id

        setProcessingId(id)
        startTransition(async () => {
            try {
                const result = await rejectLoanRequests([id])
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('ปฏิเสธคำขอยืมเรียบร้อยแล้ว')
                    setSelectedIds(prev => prev.filter(x => x !== id))
                    setRejectModalItem(null)
                }
            } catch (err: any) {
                toast.error(err?.message || 'เกิดข้อผิดพลาดในการปฏิเสธ')
            } finally {
                setProcessingId(null)
            }
        })
    }

    // Bulk Action
    const handleBulkAction = (action: 'approved' | 'rejected') => {
        if (!confirm(`ยืนยันการ${action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ${selectedIds.length} คำขอที่เลือก?`)) return

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
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500">คำขอทั้งหมด</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                            <p className="text-xs text-gray-500">รออนุมัติ</p>
                        </div>
                    </div>
                    {stats.pendingCounter > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            สแกนตัวเครื่อง {stats.pendingCounter}
                        </span>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                        <p className="text-xs text-gray-500">อนุมัติแล้ว</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                        <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
                        <p className="text-xs text-gray-500">ปฏิเสธ</p>
                    </div>
                </div>
            </div>

            {/* Main Content Table Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
                {/* Header & Bulk Actions */}
                <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span>รายการคำขอยืมอุปกรณ์</span>
                                {selectedIds.length > 0 && (
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                        เลือก {selectedIds.length} รายการ
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                ตรวจสอบตัวตนผู้ยืมและส่งมอบอุปกรณ์ ณ จุดบริการ
                            </p>
                        </div>

                        {/* Bulk Action Controls */}
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in duration-150">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleBulkAction('approved')}
                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>อนุมัติ ({selectedIds.length})</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleBulkAction('rejected')}
                                    className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>ปฏิเสธ ({selectedIds.length})</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-2 flex-1">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อผู้ยืม, อุปกรณ์, รหัสครุภัณฑ์..."
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all"
                                    value={searchTerm}
                                    onChange={e => startTransition(() => { setSearchTerm(e.target.value); setCurrentPage(1) })}
                                />
                            </div>

                            {/* Scan QR Button */}
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium transition-all bg-white shrink-0 shadow-2xs"
                                title="สแกน QR Code บนตัวเครื่องเพื่อค้นหาคำขอ"
                            >
                                <QrCode className="w-4 h-4 text-gray-500" />
                                <span>สแกนค้นหา</span>
                            </button>
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex items-center gap-2">
                            {/* Verification Filter */}
                            <select
                                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={verificationFilter}
                                onChange={e => startTransition(() => { setVerificationFilter(e.target.value as any); setCurrentPage(1) })}
                            >
                                <option value="all">ช่องทางทั้งหมด</option>
                                <option value="counter">📱 เฉพาะสแกน QR ตัวเครื่อง</option>
                                <option value="online">🌐 ช่องทางออนไลน์</option>
                            </select>

                            {/* Status Filter */}
                            <select
                                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={statusFilter}
                                onChange={e => startTransition(() => { setStatusFilter(e.target.value); setCurrentPage(1) })}
                            >
                                <option value="all">ทุกสถานะ</option>
                                <option value="pending">รออนุมัติ ({stats.pending})</option>
                                <option value="approved">อนุมัติแล้ว</option>
                                <option value="rejected">ปฏิเสธ</option>
                                <option value="returned">คืนแล้ว</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Body */}
                {paginatedItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm font-medium">ไม่พบคำขอยืมที่ตรงกับเงื่อนไข</p>
                        {(searchTerm || statusFilter !== 'all' || verificationFilter !== 'all') && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setVerificationFilter('all') }}
                                className="text-blue-600 hover:underline text-xs font-semibold mt-2"
                            >
                                ล้างตัวกรองทั้งหมด
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ยืม</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ระยะเวลายืม</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">จุดสแกน / การยืนยัน</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                                    {paginatedItems.map((request, index) => {
                                        const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending
                                        const Icon = cfg.icon
                                        const isPendingStatus = request.status === 'pending'
                                        const isCounter = isCounterVerified(request)
                                        const isBusy = processingId === request.id

                                        return (
                                            <tr
                                                key={request.id}
                                                className={`hover:bg-blue-50/30 transition-colors ${
                                                    selectedIds.includes(request.id) ? 'bg-blue-50/60' : ''
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <td className="px-4 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                        disabled={!isPendingStatus}
                                                    />
                                                </td>

                                                {/* Borrower */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                            {request.profiles?.avatar_url ? (
                                                                <Image src={request.profiles.avatar_url} alt="" width={32} height={32} className="object-cover" priority={index < 4} />
                                                            ) : (
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-gray-900 truncate">
                                                                {request.profiles?.first_name} {request.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">{request.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Equipment */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                                                            {request.equipment?.images?.[0] ? (
                                                                <Image src={request.equipment.images[0]} alt="" width={36} height={36} className="object-cover" priority={index < 4} />
                                                            ) : (
                                                                <Package className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{request.equipment?.name || '-'}</div>
                                                            <div className="text-xs text-blue-600 font-mono font-medium">#{request.equipment?.equipment_number}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Loan Dates */}
                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs text-gray-700 space-y-0.5">
                                                        <div className="flex items-center gap-1 font-medium">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                                                        </div>
                                                        {request.return_time && (
                                                            <div className="text-[11px] text-gray-500 flex items-center gap-1 pl-4.5">
                                                                <Clock className="w-3 h-3" />
                                                                <span>คืน {request.return_time.slice(0, 5)} น.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Counter Verification Badge */}
                                                <td className="px-4 py-3.5">
                                                    {isCounter ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                            <span>สแกน QR ตัวเครื่อง</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium">
                                                            <span>ผ่านออนไลน์</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${cfg.color}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                        <span>{cfg.label}</span>
                                                    </span>
                                                </td>

                                                {/* Quick Action Buttons */}
                                                <td className="px-4 py-3.5 text-right">
                                                    {isPendingStatus ? (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={isBusy || isPending}
                                                                onClick={() => handleSingleApprove(request)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
                                                                title="อนุมัติและส่งมอบเครื่องทันที"
                                                            >
                                                                {isBusy ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-3.5 h-3.5" />
                                                                )}
                                                                <span>อนุมัติส่งมอบ</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={isBusy || isPending}
                                                                onClick={() => handleOpenRejectModal(request)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                                title="ปฏิเสธคำขอ"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden p-4 space-y-3">
                            {paginatedItems.map((request, index) => {
                                const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending
                                const Icon = cfg.icon
                                const isPendingStatus = request.status === 'pending'
                                const isCounter = isCounterVerified(request)
                                const isBusy = processingId === request.id

                                return (
                                    <div
                                        key={request.id}
                                        className={`bg-white rounded-2xl p-4 border transition-all ${
                                            selectedIds.includes(request.id) ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-400/30' : 'border-gray-200/80 shadow-2xs'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {isPendingStatus && (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                    />
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {request.profiles?.avatar_url ? (
                                                        <Image src={request.profiles.avatar_url} alt="" width={32} height={32} className="object-cover" priority={index < 4} />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">
                                                        {request.profiles?.first_name} {request.profiles?.last_name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 truncate">{request.profiles?.email}</p>
                                                </div>
                                            </div>

                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border shrink-0 ${cfg.color}`}>
                                                <Icon className="w-3 h-3" />
                                                <span>{cfg.label}</span>
                                            </span>
                                        </div>

                                        {/* Equipment Info */}
                                        <div className="flex items-center gap-3 bg-gray-50/80 p-2.5 rounded-xl mb-3 border border-gray-100">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                                                {request.equipment?.images?.[0] ? (
                                                    <Image src={request.equipment.images[0]} alt="" width={40} height={40} className="object-cover" priority={index < 4} />
                                                ) : (
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-900 truncate">{request.equipment?.name || '-'}</p>
                                                <p className="text-[11px] text-blue-600 font-mono font-medium">#{request.equipment?.equipment_number}</p>
                                            </div>
                                            {isCounter && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md shrink-0">
                                                    📱 สแกนตัวเครื่อง
                                                </span>
                                            )}
                                        </div>

                                        {/* Loan Period */}
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                                            </div>
                                            {request.return_time && (
                                                <span className="text-[11px] text-gray-500">คืน {request.return_time.slice(0, 5)} น.</span>
                                            )}
                                        </div>

                                        {/* Mobile Action Buttons */}
                                        {isPendingStatus && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                <button
                                                    type="button"
                                                    disabled={isBusy || isPending}
                                                    onClick={() => handleSingleApprove(request)}
                                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                                                >
                                                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>อนุมัติส่งมอบเครื่อง</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isBusy || isPending}
                                                    onClick={() => handleOpenRejectModal(request)}
                                                    className="px-3 py-2 border border-gray-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
                                                >
                                                    ปฏิเสธ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {filteredItems.length > 0 && (
                    <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <span>แสดง</span>
                            <select
                                value={pageSize}
                                onChange={e => startTransition(() => { setPageSize(Number(e.target.value)); setCurrentPage(1) })}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                            >
                                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span>รายการ | {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} จาก {filteredItems.length}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => startTransition(() => setCurrentPage(p => Math.max(1, p - 1)))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-medium transition-all"
                            >
                                ก่อนหน้า
                            </button>
                            <span className="px-2 font-medium text-gray-700">หน้า {currentPage}/{totalPages}</span>
                            <button
                                type="button"
                                onClick={() => startTransition(() => setCurrentPage(p => Math.min(totalPages, p + 1)))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-medium transition-all"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QrScannerModal
                    isOpen={showScanner}
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScanCode}
                    autoCloseDelayMs={400}
                    title="สแกน QR ค้นหาคำขอยืม"
                    subtitle="ส่องกล้องไปที่ QR Code บนตัวเครื่องอุปกรณ์เพื่อค้นหารายการคำขอยืม"
                />
            )}

            {/* Reject Confirmation Modal */}
            {rejectModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-rose-600" />
                                <span>ปฏิเสธคำขอยืมอุปกรณ์</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRejectModalItem(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                            <p className="text-gray-500">ผู้ยืม: <span className="font-semibold text-gray-900">{rejectModalItem.profiles?.first_name} {rejectModalItem.profiles?.last_name}</span></p>
                            <p className="text-gray-500">อุปกรณ์: <span className="font-semibold text-gray-900">{rejectModalItem.equipment?.name}</span> (#{rejectModalItem.equipment?.equipment_number})</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                ระบุเหตุผลในการปฏิเสธ (แจ้งให้ผู้ยืมทราบ)
                            </label>
                            <textarea
                                rows={3}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="เช่น อุปกรณ์ต้องส่งซ่อมบำรุง, ผู้ยืมไม่มารับตามเวลาที่กำหนด..."
                                className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setRejectModalItem(null)}
                                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleConfirmReject}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                            >
                                ยืนยันปฏิเสธคำขอ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
