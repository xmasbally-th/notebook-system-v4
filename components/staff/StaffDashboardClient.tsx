'use client'

import { useState } from 'react'
import {
    ClipboardList, Clock, CheckCircle, AlertTriangle,
    RotateCcw, ArrowRight, Laptop, Search, ChevronRight, CheckCircle2,
    XCircle, Info, Filter, X, Camera, Sparkles, Loader2, User,
    Phone, Mail, Calendar, CalendarCheck, ExternalLink, QrCode,
    Check, AlertCircle, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
    StaffDashboardStats,
    RecentActivityItem,
    EquipmentInventorySummary,
    EquipmentInventoryItem,
    StaffActionQueues,
    PendingLoanQueueItem,
    TodayReservationQueueItem,
    OverdueLoanQueueItem
} from '@/lib/data/staff-dashboard'
import { formatThaiDate } from '@/lib/formatThaiDate'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { approveLoan, rejectLoan } from '@/app/staff/loans/actions'
import { convertReservationToLoanAction } from '@/app/staff/reservations/actions'
import { lookupEquipmentByCode } from '@/app/staff/counter/actions'
import { returnLoan } from '@/app/staff/returns/actions'
import QrScannerModal from '@/components/scanner/QrScannerModal'
import FastCounterBorrowModal from '@/components/staff/FastCounterBorrowModal'

interface StaffDashboardClientProps {
    stats: StaffDashboardStats
    recentActivity: RecentActivityItem[]
    inventorySummary?: EquipmentInventorySummary
    actionQueues: StaffActionQueues
}

type ScanAction = 'borrow' | 'return' | null

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending':
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300">รออนุมัติ</span>
        case 'approved':
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300">อนุมัติแล้ว</span>
        case 'ready':
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">พร้อมรับ</span>
        case 'rejected':
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">ปฏิเสธ</span>
        case 'returned':
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">คืนแล้ว</span>
        default:
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">{status}</span>
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

export default function StaffDashboardClient({
    stats,
    recentActivity,
    inventorySummary,
    actionQueues
}: StaffDashboardClientProps) {
    const router = useRouter()

    // ─── Realtime Synchronization ──────────────────────────────────────
    useRealtimeInvalidator(
        ['loanRequests', 'reservations', 'equipment', 'profiles'],
        [['staff-dashboard']]
    )

    // ─── Action Queues State ───────────────────────────────────────────
    const [activeQueueTab, setActiveQueueTab] = useState<'loans' | 'reservations' | 'overdue'>('loans')
    const [processingActionId, setProcessingActionId] = useState<string | null>(null)

    // Reject Modal State
    const [rejectLoanItem, setRejectLoanItem] = useState<PendingLoanQueueItem | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [isSubmittingReject, setIsSubmittingReject] = useState(false)

    // ─── Counter Station State ─────────────────────────────────────────
    const [scannerAction, setScannerAction] = useState<ScanAction>(null)
    const [manualCode, setManualCode] = useState('')
    const [isLookingUp, setIsLookingUp] = useState(false)
    const [lookupError, setLookupError] = useState<string | null>(null)

    // Fast Borrow Modal
    const [borrowModalEquipment, setBorrowModalEquipment] = useState<any | null>(null)

    // Fast Return Modal
    const [returnModalData, setReturnModalData] = useState<{
        equipment: any
        activeLoan: any
    } | null>(null)
    const [returnCondition, setReturnCondition] = useState<'good' | 'damaged' | 'missing_parts'>('good')
    const [returnNotes, setReturnNotes] = useState('')
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

    // Operation Feedback Banner
    const [recentOperation, setRecentOperation] = useState<{
        type: 'borrow' | 'return' | 'approve' | 'convert'
        title: string
        details: string
    } | null>(null)

    // ─── Inventory Modal State ─────────────────────────────────────────
    const [searchInventory, setSearchInventory] = useState('')
    const [inventoryFilter, setInventoryFilter] = useState<'all' | 'borrowed' | 'available' | 'maintenance'>('all')
    const [showInventoryModal, setShowInventoryModal] = useState(false)

    // ─── Code Lookup Handler ───────────────────────────────────────────
    const handleCodeDetected = async (code: string, explicitAction?: ScanAction) => {
        setLookupError(null)
        setIsLookingUp(true)

        try {
            const res = await lookupEquipmentByCode(code)
            if (res.error || !res.equipment) {
                setLookupError(res.error || 'ไม่พบข้อมูลอุปกรณ์')
                return
            }

            const { equipment, activeLoan } = res
            const preferredAction = explicitAction || scannerAction

            if (preferredAction === 'return') {
                if (!activeLoan) {
                    setLookupError(`อุปกรณ์ #${equipment.equipment_number} (${equipment.name}) มีสถานะ "${equipment.status}" ไม่พบรายการยืมที่กำลังใช้งาน`)
                    return
                }
                setReturnModalData({ equipment, activeLoan })
            } else {
                if (equipment.status === 'borrowed' || activeLoan) {
                    const borrowerName = activeLoan?.profiles
                        ? `${activeLoan.profiles.first_name || ''} ${activeLoan.profiles.last_name || ''}`.trim()
                        : 'ผู้ใช้อื่น'
                    setLookupError(`อุปกรณ์ #${equipment.equipment_number} กำลังถูกยืมโดยคุณ ${borrowerName} (หากต้องการรับคืน กรุณากดสแกนรับคืน)`)
                    return
                }

                if (equipment.status !== 'ready' && equipment.status !== 'active') {
                    setLookupError(`อุปกรณ์ #${equipment.equipment_number} ไม่พร้อมให้ยืม (สถานะ: ${equipment.status})`)
                    return
                }

                setBorrowModalEquipment(equipment)
            }
        } catch (err: any) {
            setLookupError(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบอุปกรณ์')
        } finally {
            setIsLookingUp(false)
            setScannerAction(null)
        }
    }

    // ─── Return Confirm Handler ────────────────────────────────────────
    const handleConfirmReturn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!returnModalData) return

        setIsSubmittingReturn(true)
        try {
            const res = await returnLoan({
                loanId: returnModalData.activeLoan.id,
                equipmentId: returnModalData.equipment.id,
                condition: returnCondition,
                notes: returnNotes || undefined
            })

            if (res.success) {
                setRecentOperation({
                    type: 'return',
                    title: `รับคืนอุปกรณ์ #${returnModalData.equipment.equipment_number} สำเร็จ`,
                    details: `สภาพ: ${returnCondition === 'good' ? 'สภาพดี' : returnCondition === 'damaged' ? 'ชำรุด (ส่งซ่อม)' : 'ขาดชิ้นส่วน'} • บันทึกเข้าคลังพร้อมใช้งานทันที`
                })
                setReturnModalData(null)
                setReturnNotes('')
                setReturnCondition('good')
                router.refresh()
            } else {
                alert(res.error || 'เกิดข้อผิดพลาดในการบันทึกการรับคืน')
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsSubmittingReturn(false)
        }
    }

    // ─── 1-Click Approve Loan Handler ──────────────────────────────────
    const handleQuickApproveLoan = async (loanId: string, equipmentNumber: string, borrowerName: string) => {
        setProcessingActionId(loanId)
        try {
            const res = await approveLoan(loanId)
            if (res.success) {
                setRecentOperation({
                    type: 'approve',
                    title: `อนุมัติคำขอยืม #${equipmentNumber} เรียบร้อยแล้ว`,
                    details: `ผู้ยืม: ${borrowerName} • ส่งการแจ้งเตือนสำเร็จ`
                })
                router.refresh()
            } else {
                alert(res.error || 'เกิดข้อผิดพลาดในการอนุมัติคำขอ')
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setProcessingActionId(null)
        }
    }

    // ─── Reject Loan Handler ───────────────────────────────────────────
    const handleConfirmRejectLoan = async () => {
        if (!rejectLoanItem) return
        if (!rejectReason.trim()) {
            alert('กรุณาระบุเหตุผลในการปฏิเสธ')
            return
        }

        setIsSubmittingReject(true)
        try {
            const res = await rejectLoan(rejectLoanItem.id, rejectReason.trim())
            if (res.success) {
                setRecentOperation({
                    type: 'approve',
                    title: `ปฏิเสธคำขอยืมเรียบร้อยแล้ว`,
                    details: `เหตุผล: ${rejectReason.trim()}`
                })
                setRejectLoanItem(null)
                setRejectReason('')
                router.refresh()
            } else {
                alert(res.error || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ')
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsSubmittingReject(false)
        }
    }

    // ─── Convert Reservation To Loan Handler ───────────────────────────
    const handleConvertToLoan = async (reservationId: string, equipmentNumber: string, borrowerName: string) => {
        setProcessingActionId(reservationId)
        try {
            const res = await convertReservationToLoanAction(reservationId)
            if (res.success) {
                setRecentOperation({
                    type: 'convert',
                    title: `ส่งมอบเครื่อง #${equipmentNumber} และบันทึกการยืมสำเร็จ`,
                    details: `ผู้รับ: ${borrowerName} • ดำเนินการส่งมอบเรียบร้อย`
                })
                router.refresh()
            } else {
                alert(res.error || 'เกิดข้อผิดพลาดในการส่งมอบเครื่อง')
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setProcessingActionId(null)
        }
    }

    const filteredItems = (inventorySummary?.items || []).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchInventory.toLowerCase()) ||
            item.equipment_number.toLowerCase().includes(searchInventory.toLowerCase()) ||
            (item.current_borrower?.name || '').toLowerCase().includes(searchInventory.toLowerCase())

        if (inventoryFilter === 'borrowed') return matchesSearch && item.status === 'borrowed'
        if (inventoryFilter === 'available') return matchesSearch && (item.status === 'ready' || item.status === 'active' || item.status === 'available')
        if (inventoryFilter === 'maintenance') return matchesSearch && (item.status === 'maintenance' || item.status === 'retired')
        return matchesSearch
    })

    const pendingTotal = stats.pending + (stats.pendingReservations || 0)

    return (
        <div className="space-y-6">
            {/* ─── Recent Operation Feedback Banner ─── */}
            {recentOperation && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start justify-between gap-3 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">{recentOperation.title}</h4>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{recentOperation.details}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRecentOperation(null)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium px-2 py-1"
                    >
                        ✕ ปิด
                    </button>
                </div>
            )}

            {/* ─── Error Alert Banner ─── */}
            {lookupError && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start justify-between gap-3 animate-fade-in shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">แจ้งเตือนสถานะอุปกรณ์</h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{lookupError}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setLookupError(null)}
                        className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 font-medium px-2 py-1"
                    >
                        รับทราบ
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 1. HERO: Fast Counter Station (สถานีบริการเคาน์เตอร์ด่วน)        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/2 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-teal-200 border border-white/10">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>จุดบริการด่วนหน้าเคาน์เตอร์ (Fast Counter Hub)</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            ส่งมอบเครื่องและรับคืนใน 5 วินาที
                        </h2>
                        <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl leading-relaxed">
                            สแกน QR บนตัวเครื่องเพื่อออกใบยืมให้นักศึกษา/วิทยากรภายนอกทันที หรือสแกนรับคืนเครื่องพร้อมตรวจสภาพเสร็จในคลิกเดียว
                        </p>
                    </div>

                    {/* Primary QR Action Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setScannerAction('borrow')}
                            disabled={isLookingUp}
                            className="flex-1 sm:flex-none px-5 py-3.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-teal-950 font-bold text-sm rounded-2xl shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2.5 active:scale-95"
                        >
                            {isLookingUp && scannerAction === 'borrow' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-teal-950" />
                            ) : (
                                <Camera className="w-4 h-4 text-teal-950" />
                            )}
                            <span>สแกน QR ยืมด่วน</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setScannerAction('return')}
                            disabled={isLookingUp}
                            className="flex-1 sm:flex-none px-5 py-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-sm rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2.5 active:scale-95"
                        >
                            {isLookingUp && scannerAction === 'return' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <RotateCcw className="w-4 h-4 text-emerald-300" />
                            )}
                            <span>สแกน QR รับคืน</span>
                        </button>
                    </div>
                </div>

                {/* Quick Manual Code / Barcode Input Bar */}
                <div className="relative z-10 pt-5">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (manualCode.trim()) handleCodeDetected(manualCode.trim(), 'borrow')
                        }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-300" />
                            <input
                                type="text"
                                placeholder="พิมพ์หรือยิง Barcode หมายเลขครุภัณฑ์ (เช่น NB-001, 150)..."
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/30 border border-white/15 rounded-xl text-white placeholder-teal-200/50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-black/50 transition-all font-mono"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (manualCode.trim()) handleCodeDetected(manualCode.trim(), 'borrow')
                                }}
                                disabled={!manualCode.trim() || isLookingUp}
                                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40"
                            >
                                ขอยืม
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (manualCode.trim()) handleCodeDetected(manualCode.trim(), 'return')
                                }}
                                disabled={!manualCode.trim() || isLookingUp}
                                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40"
                            >
                                รับคืน
                            </button>
                            <Link
                                href="/staff/counter"
                                className="px-3 py-2.5 bg-white/10 hover:bg-white/15 text-teal-200 font-medium text-xs rounded-xl transition-all inline-flex items-center gap-1 shrink-0"
                                title="เปิดหน้าจอเคาน์เตอร์เต็มรูปแบบ"
                            >
                                <span>เต็มจอ</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 2. STATS & OPERATIONAL METRICS                                  */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. รออนุมัติ */}
                <button
                    type="button"
                    onClick={() => setActiveQueueTab('loans')}
                    className={`text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all shadow-sm hover:shadow-md ${
                        pendingTotal > 0
                            ? 'border-yellow-300 dark:border-yellow-800 ring-2 ring-yellow-400/20'
                            : 'border-gray-200 dark:border-slate-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">รออนุมัติ / รอส่งมอบ</span>
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 rounded-xl">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">
                            {pendingTotal}
                        </span>
                        {pendingTotal > 0 && (
                            <span className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400">
                                ด่วน
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 truncate">
                        คำขอยืม {stats.pending} • จอง {stats.pendingReservations || 0} รายการ
                    </p>
                </button>

                {/* 2. กำลังยืม */}
                <Link
                    href="/staff/returns"
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-all shadow-sm hover:shadow-md block"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">กำลังถูกยืมใช้งาน</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">
                            {stats.approved}
                        </span>
                        <span className="text-xs text-gray-400">เครื่อง</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 truncate">
                        ยืมออกวันนี้ {stats.todayBorrowed || 0} รายการ
                    </p>
                </Link>

                {/* 3. สรุปความเคลื่อนไหววันนี้ */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">กำหนดส่งคืนวันนี้</span>
                        <div className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl">
                            <CalendarCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-400">
                            {stats.todayDue || 0}
                        </span>
                        <span className="text-xs text-gray-400">รายการ</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 truncate">
                        รับคืนแล้ว {stats.todayReturned || 0} รายการ
                    </p>
                </div>

                {/* 4. ค้างคืนเกินกำหนด */}
                <button
                    type="button"
                    onClick={() => setActiveQueueTab('overdue')}
                    className={`text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all shadow-sm hover:shadow-md ${
                        stats.overdue > 0
                            ? 'border-red-300 dark:border-red-800 ring-2 ring-red-400/20'
                            : 'border-gray-200 dark:border-slate-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">ค้างส่งคืน</span>
                        <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className={`text-2xl sm:text-3xl font-black ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'}`}>
                            {stats.overdue}
                        </span>
                        {stats.overdue > 0 && (
                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                                เกินกำหนด
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 truncate">
                        {stats.overdue > 0 ? 'จำเป็นต้องติดตามทวงถาม' : 'ไม่มีรายการค้างคืน'}
                    </p>
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 3. STAFF ACTION QUEUES COCKPIT (คิวงานที่ต้องจัดการทันที)         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden" id="action-queues">
                {/* Header & Tabs */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-xl">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">
                                คิวงานที่ต้องจัดการ (Action Queues)
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                ดำเนินการอนุมัติ ส่งมอบ หรือติดตามรายการด่วนได้ในคลิกเดียว
                            </p>
                        </div>
                    </div>

                    {/* Tab Selection */}
                    <div className="flex bg-gray-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveQueueTab('loans')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                activeQueueTab === 'loans'
                                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                            }`}
                        >
                            <span>คำขอยืมรออนุมัติ</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                actionQueues.pendingLoans.length > 0
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 font-bold'
                                    : 'bg-gray-100 text-gray-500 dark:bg-slate-800'
                            }`}>
                                {actionQueues.pendingLoans.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveQueueTab('reservations')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                activeQueueTab === 'reservations'
                                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                            }`}
                        >
                            <span>นัดรับ/คำขอจอง</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                actionQueues.todayReservations.length > 0
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 font-bold'
                                    : 'bg-gray-100 text-gray-500 dark:bg-slate-800'
                            }`}>
                                {actionQueues.todayReservations.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveQueueTab('overdue')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                activeQueueTab === 'overdue'
                                    ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                            }`}
                        >
                            <span>รายการค้างส่งคืน</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                actionQueues.overdueLoans.length > 0
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 font-bold'
                                    : 'bg-gray-100 text-gray-500 dark:bg-slate-800'
                            }`}>
                                {actionQueues.overdueLoans.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Tab 1: Pending Loans Queue */}
                {activeQueueTab === 'loans' && (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {actionQueues.pendingLoans.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 dark:text-slate-500">
                                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                                <p className="font-medium text-sm text-gray-700 dark:text-slate-300">ไม่มีคำขอยืมที่รอการอนุมัติในขณะนี้</p>
                                <p className="text-xs text-gray-400 mt-1">คำขอใหม่จะปรากฏขึ้นที่นี่โดยอัตโนมัติเมื่อมีผู้ใช้ยื่นคำขอ</p>
                            </div>
                        ) : (
                            actionQueues.pendingLoans.map((loan) => {
                                const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'
                                const eqNumber = loan.equipment?.equipment_number || '-'
                                const isProcessing = processingActionId === loan.id

                                return (
                                    <div key={loan.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                                    {borrowerName}
                                                </span>
                                                {loan.profiles?.user_type && (
                                                    <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-md">
                                                        {loan.profiles.user_type === 'student' ? 'นักศึกษา' : loan.profiles.user_type === 'lecturer' ? 'อาจารย์' : 'บุคลากร'}
                                                    </span>
                                                )}
                                                {loan.profiles?.phone_number && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {loan.profiles.phone_number}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 flex-wrap">
                                                <span>ขออุปกรณ์: <strong className="text-gray-900 dark:text-slate-200">{loan.equipment?.name || '-'}</strong></span>
                                                <span className="px-1.5 py-0.5 font-mono text-[11px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                                                    #{eqNumber}
                                                </span>
                                                <span>• กำหนดส่ง: {formatThaiDate(loan.end_date)}</span>
                                            </div>

                                            {loan.reason && (
                                                <p className="text-xs text-gray-500 dark:text-slate-400 italic bg-gray-50 dark:bg-slate-800/60 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                                                    💬 &quot;{loan.reason}&quot;
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleQuickApproveLoan(loan.id, eqNumber, borrowerName)}
                                                disabled={isProcessing}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="w-3.5 h-3.5" />
                                                )}
                                                <span>อนุมัติทันที</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setRejectLoanItem(loan)}
                                                disabled={isProcessing}
                                                className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                                            >
                                                ปฏิเสธ
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div className="p-3 bg-gray-50/70 dark:bg-slate-800/30 text-right">
                            <Link
                                href="/staff/loans"
                                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                            >
                                <span>ดูคำขอยืมทั้งหมดในระบบ</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Tab 2: Reservations / Pickups Queue */}
                {activeQueueTab === 'reservations' && (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {actionQueues.todayReservations.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 dark:text-slate-500">
                                <CalendarCheck className="w-10 h-10 mx-auto text-purple-400 mb-2 opacity-80" />
                                <p className="font-medium text-sm text-gray-700 dark:text-slate-300">ไม่มีคิวจองที่รอการส่งมอบในขณะนี้</p>
                                <p className="text-xs text-gray-400 mt-1">รายการจองล่วงหน้าจะแสดงให้เตรียมเครื่องที่นี่</p>
                            </div>
                        ) : (
                            actionQueues.todayReservations.map((res) => {
                                const borrowerName = `${res.profiles?.first_name || ''} ${res.profiles?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'
                                const eqNumber = res.equipment?.equipment_number || '-'
                                const isProcessing = processingActionId === res.id

                                return (
                                    <div key={res.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                                    {borrowerName}
                                                </span>
                                                {res.profiles?.departments?.name && (
                                                    <span className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-md">
                                                        {res.profiles.departments.name}
                                                    </span>
                                                )}
                                                {getStatusBadge(res.status)}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 flex-wrap">
                                                <span>อุปกรณ์: <strong className="text-gray-900 dark:text-slate-200">{res.equipment?.name || '-'}</strong></span>
                                                <span className="px-1.5 py-0.5 font-mono text-[11px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                                                    #{eqNumber}
                                                </span>
                                                <span>• นัดรับ: {formatThaiDate(res.start_date)} {res.pickup_time ? `(${res.pickup_time.slice(0, 5)} น.)` : ''}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleConvertToLoan(res.id, eqNumber, borrowerName)}
                                                disabled={isProcessing}
                                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                                <span>ส่งมอบเครื่อง (แปลงเป็นการยืม)</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div className="p-3 bg-gray-50/70 dark:bg-slate-800/30 text-right">
                            <Link
                                href="/staff/reservations"
                                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                            >
                                <span>ดูรายการจองทั้งหมด</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Tab 3: Overdue Loans Queue */}
                {activeQueueTab === 'overdue' && (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {actionQueues.overdueLoans.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 dark:text-slate-500">
                                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                                <p className="font-medium text-sm text-gray-700 dark:text-slate-300">ไม่มีรายการค้างคืนเกินกำหนด</p>
                                <p className="text-xs text-gray-400 mt-1">ผู้ใช้ทุกคนส่งคืนเครื่องตรงตามกำหนดเวลา</p>
                            </div>
                        ) : (
                            actionQueues.overdueLoans.map((loan) => {
                                const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'
                                const eqNumber = loan.equipment?.equipment_number || '-'

                                return (
                                    <div key={loan.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                                    {borrowerName}
                                                </span>
                                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                                                    ⚠️ เกินกำหนด {loan.days_overdue} วัน
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 flex-wrap">
                                                <span>อุปกรณ์: <strong className="text-gray-900 dark:text-slate-200">{loan.equipment?.name || '-'}</strong></span>
                                                <span className="px-1.5 py-0.5 font-mono text-[11px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
                                                    #{eqNumber}
                                                </span>
                                                <span>• กำหนดคืนเดิม: {formatThaiDate(loan.end_date)}</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                {loan.profiles?.phone_number && (
                                                    <a
                                                        href={`tel:${loan.profiles.phone_number}`}
                                                        className="inline-flex items-center gap-1 text-teal-600 hover:underline"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        <span>{loan.profiles.phone_number}</span>
                                                    </a>
                                                )}
                                                {loan.profiles?.email && (
                                                    <span className="inline-flex items-center gap-1 text-gray-400 truncate">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{loan.profiles.email}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                href="/staff/overdue"
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5 active:scale-95"
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span>ติดตาม/ส่งแจ้งเตือน</span>
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div className="p-3 bg-gray-50/70 dark:bg-slate-800/30 text-right">
                            <Link
                                href="/staff/overdue"
                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                            >
                                <span>เปิดหน้ารายการค้างคืนทั้งหมด</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                )}
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

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 6. MODALS SECTION                                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* 1. Scanner Modal */}
            <QrScannerModal
                isOpen={scannerAction !== null}
                onClose={() => setScannerAction(null)}
                onScanSuccess={(code) => handleCodeDetected(code)}
                autoCloseDelayMs={400}
                title={scannerAction === 'return' ? 'สแกน QR เพื่อรับคืนอุปกรณ์' : 'สแกน QR เพื่อบันทึกการยืมด่วน'}
                subtitle="ส่องกล้องสมาร์ทโฟนไปที่สติกเกอร์บนตัวเครื่องโน้ตบุ๊ค"
            />

            {/* 2. Fast Counter Borrow Modal */}
            {borrowModalEquipment && (
                <FastCounterBorrowModal
                    isOpen={borrowModalEquipment !== null}
                    onClose={() => setBorrowModalEquipment(null)}
                    equipment={borrowModalEquipment}
                    onSuccess={(res) => {
                        setRecentOperation({
                            type: 'borrow',
                            title: `บันทึกการยืม #${res.equipmentNumber} สำเร็จ`,
                            details: `ผู้ยืม: ${res.borrowerName} • ส่งมอบเครื่องเรียบร้อยแล้ว`
                        })
                        router.refresh()
                    }}
                />
            )}

            {/* 3. Fast Return Modal */}
            {returnModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/40">
                            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold">
                                <RotateCcw className="w-5 h-5 text-emerald-600" />
                                <span>บันทึกการรับคืนอุปกรณ์</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReturnModalData(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReturn} className="p-5 space-y-4 text-xs sm:text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                                <p className="font-bold text-gray-900 dark:text-slate-100">
                                    #{returnModalData.equipment.equipment_number} — {returnModalData.equipment.name}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    👤 ผู้ยืม:{' '}
                                    {returnModalData.activeLoan.profiles
                                        ? `${returnModalData.activeLoan.profiles.first_name || ''} ${returnModalData.activeLoan.profiles.last_name || ''}`.trim()
                                        : returnModalData.activeLoan.reason?.includes('[วิทยากรภายนอก')
                                        ? returnModalData.activeLoan.reason.split(']')[0].replace('[', '')
                                        : 'ไม่ทราบชื่อ'}
                                </p>
                                <p className="text-gray-400 text-[11px]">
                                    📅 กำหนดส่งคืนเดิม: {formatThaiDate(returnModalData.activeLoan.end_date)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                                    ผลการตรวจรับสภาพอุปกรณ์
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setReturnCondition('good')}
                                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                                            returnCondition === 'good'
                                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                        }`}
                                    >
                                        ✅ สภาพดี
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReturnCondition('damaged')}
                                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                                            returnCondition === 'damaged'
                                                ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                        }`}
                                    >
                                        ⚠️ ชำรุด (ส่งซ่อม)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReturnCondition('missing_parts')}
                                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                                            returnCondition === 'missing_parts'
                                                ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 font-bold'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                        }`}
                                    >
                                        📦 ขาดชิ้นส่วน
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    บันทึกเพิ่มเติม (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    placeholder="เช่น ตรวจสอบพบรอยขีดข่วน หรืออุปกรณ์ครบถ้วน"
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingReturn}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmittingReturn ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>ยืนยันการรับคืนทันที</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Reject Loan Modal */}
            {rejectLoanItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-red-50/70 dark:bg-red-950/40">
                            <div className="flex items-center gap-2 text-red-900 dark:text-red-100 font-bold">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span>ปฏิเสธคำขอยืม</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectLoanItem(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs sm:text-sm">
                            <p className="text-gray-600 dark:text-slate-300">
                                ปฏิเสธคำขอของ: <strong>{rejectLoanItem.profiles?.first_name} {rejectLoanItem.profiles?.last_name}</strong>
                                <br />
                                อุปกรณ์: #{rejectLoanItem.equipment?.equipment_number} ({rejectLoanItem.equipment?.name})
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    เหตุผลในการปฏิเสธ (จำเป็น)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="เช่น อุปกรณ์ติดภารกิจจัดสอบ หรือระยะเวลายืมไม่เป็นไปตามระเบียบ..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectLoanItem(null)}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmRejectLoan}
                                    disabled={isSubmittingReject || !rejectReason.trim()}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                                >
                                    {isSubmittingReject ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
