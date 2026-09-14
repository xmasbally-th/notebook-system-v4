'use client'

import React, { useTransition, useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    RotateCcw,
    AlertTriangle,
    User,
    Package,
    Calendar,
    Search,
    ClipboardCheck,
    QrCode,
    Phone,
    Clock,
    CheckCircle2
} from 'lucide-react'
import { processReturn } from '@/app/admin/loans/actions'
import { useToast } from '@/components/ui/toast'
import ReturnModal from './ReturnModal'
import QrScannerModal from '@/components/scanner/QrScannerModal'
import { supabase } from '@/lib/supabase/client'

interface ActiveLoan {
    id: string
    end_date: string
    return_time?: string | null
    profiles?: {
        first_name?: string
        last_name?: string
        email?: string
        phone_number?: string
        avatar_url?: string
    } | null
    equipment?: {
        id?: string
        name?: string
        equipment_number?: string
        images?: string[]
    } | null
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

const isOverdue = (loan: ActiveLoan) => {
    const endDate = new Date(loan.end_date)
    const now = new Date()
    if (loan.return_time) {
        const [h, m] = loan.return_time.split(':').map(Number)
        endDate.setHours(h, m, 0, 0)
        return endDate < now
    }
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const loanEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    return loanEnd < today
}

interface Props {
    initialData: ActiveLoan[]
}

export default function ActiveLoansSection({ initialData }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [loans, setLoans] = useState<ActiveLoan[]>(initialData)
    const [isPending, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState('')
    const [overdueOnly, setOverdueOnly] = useState(false)
    const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)
    const [showScanner, setShowScanner] = useState(false)

    // Sync loans when initialData updates from server
    useEffect(() => {
        setLoans(initialData)
    }, [initialData])

    // Realtime update
    useEffect(() => {
        const channel = supabase
            .channel('admin-active-loans-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'loanRequests' },
                () => {
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

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
        const stripped = cleanCode.replace(/^#/, '').toLowerCase()

        const matchedLoan = loans.find((loan: any) => {
            const eqId = loan.equipment?.id || ''
            const eqNum = (loan.equipment?.equipment_number || '').replace(/^#/, '').toLowerCase()
            return eqId === cleanCode || eqNum === stripped
        })

        // Auto-close scanner and open return modal after 400ms so admin sees the success confirmation briefly
        setTimeout(() => {
            setShowScanner(false)
            if (matchedLoan) {
                handleReturn(matchedLoan)
                toast.success(`พบอุปกรณ์ ${matchedLoan.equipment?.name || ''} (${matchedLoan.equipment?.equipment_number || ''})`)
            } else {
                toast.error(`ไม่พบรายการยืมที่กำลังใช้งานของอุปกรณ์ "${cleanCode}"`)
            }
        }, 400)
    }

    const overdueCount = useMemo(() => {
        return loans.filter(isOverdue).length
    }, [loans])

    const filteredLoans = useMemo(() => {
        let list = loans
        if (overdueOnly) {
            list = list.filter(isOverdue)
        }
        if (!searchTerm.trim()) return list

        const s = searchTerm.toLowerCase().trim()
        return list.filter(loan =>
            (loan.profiles?.first_name || '').toLowerCase().includes(s) ||
            (loan.profiles?.last_name || '').toLowerCase().includes(s) ||
            (loan.equipment?.name || '').toLowerCase().includes(s) ||
            (loan.equipment?.equipment_number || '').toLowerCase().includes(s)
        )
    }, [loans, searchTerm, overdueOnly])

    const handleReturn = (loan: ActiveLoan) => {
        setSelectedLoan(loan)
    }

    const handleReturnConfirm = (condition: 'good' | 'damaged' | 'missing_parts', notes: string) => {
        if (!selectedLoan?.equipment?.id) return
        const currentLoanId = selectedLoan.id
        startTransition(async () => {
            const result = await processReturn(
                currentLoanId,
                selectedLoan.equipment!.id!,
                condition,
                notes
            )
            if (result.error) {
                toast.error(result.error)
            } else {
                setLoans(prev => prev.filter(l => l.id !== currentLoanId))
                setSelectedLoan(null)
                router.refresh()
                if (result.condition === 'good') {
                    toast.success('บันทึกการคืนเรียบร้อยแล้ว — อุปกรณ์พร้อมให้ยืมใหม่')
                } else {
                    toast.warning('บันทึกการคืนแล้ว — อุปกรณ์ถูกส่งเข้าสถานะซ่อมบำรุง')
                }
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{initialData.length}</p>
                        <p className="text-xs text-gray-500">กำลังยืมอยู่ทั้งหมด</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-rose-600">{overdueCount}</p>
                            <p className="text-xs text-gray-500">เกินกำหนดคืน</p>
                        </div>
                    </div>
                    {overdueCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setOverdueOnly(prev => !prev)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                overdueOnly
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                        >
                            {overdueOnly ? 'แสดงทั้งหมด' : 'กรองเฉพาะเกินกำหนด'}
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">รับคืนด่วนที่เคาน์เตอร์</p>
                            <p className="text-sm font-bold text-gray-900">สแกน QR บนตัวเครื่อง</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all shrink-0"
                    >
                        เปิดกล้อง
                    </button>
                </div>
            </div>

            {/* Search and Scan Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อผู้ยืม, หมายเลขโทรศัพท์, อุปกรณ์..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm shadow-2xs transition-all"
                        value={searchTerm}
                        onChange={e => startTransition(() => setSearchTerm(e.target.value))}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {overdueOnly && (
                        <button
                            type="button"
                            onClick={() => setOverdueOnly(false)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline"
                        >
                            ล้างตัวกรองเกินกำหนด
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all whitespace-nowrap cursor-pointer"
                    >
                        <QrCode className="w-4 h-4" />
                        <span>สแกน QR รับคืน</span>
                    </button>
                </div>
            </div>

            {/* List Table Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            รายการที่กำลังยืมใช้งาน ({filteredLoans.length})
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            ตรวจสอบความเรียบร้อยของอุปกรณ์ก่อนกดบันทึกการรับคืน
                        </p>
                    </div>
                </div>

                {filteredLoans.length === 0 ? (
                    <div className="p-12 text-center">
                        <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm font-medium">ไม่พบรายการที่กำลังยืม</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLoans.map((loan, index) => {
                            const overdue = isOverdue(loan)
                            return (
                                <div
                                    key={loan.id}
                                    className={`p-4 sm:p-5 hover:bg-gray-50/70 transition-colors ${
                                        overdue ? 'bg-rose-50/40' : ''
                                    }`}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                {loan.equipment?.images?.[0] ? (
                                                    <Image src={loan.equipment.images[0]} alt="" width={56} height={56} className="object-cover" priority={index < 4} />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{loan.equipment?.name}</h3>
                                                    <span className="text-xs text-blue-600 font-mono font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                                        #{loan.equipment?.equipment_number}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{loan.profiles?.first_name} {loan.profiles?.last_name}</span>
                                                    </div>
                                                    {loan.profiles?.phone_number && (
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{loan.profiles.phone_number}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs pt-0.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className={overdue ? 'text-rose-600 font-bold' : 'text-gray-600'}>
                                                        กำหนดคืน: {formatDate(loan.end_date)}
                                                        {loan.return_time && ` เวลา ${loan.return_time.slice(0, 5)} น.`}
                                                        {overdue && ' (เกินกำหนดส่งคืนแล้ว)'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                                            {overdue && (
                                                <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-rose-200">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    เกินกำหนด
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleReturn(loan)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
                                            >
                                                <ClipboardCheck className="w-4 h-4" />
                                                <span>รับคืนอุปกรณ์</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Return Modal */}
            {selectedLoan && (
                <ReturnModal
                    loan={selectedLoan}
                    isPending={isPending}
                    onConfirm={handleReturnConfirm}
                    onClose={() => setSelectedLoan(null)}
                />
            )}

            {/* QR Scanner Modal for Instant Return */}
            {showScanner && (
                <QrScannerModal
                    isOpen={showScanner}
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScanCode}
                    autoCloseDelayMs={400}
                    title="สแกน QR เพื่อรับคืนอุปกรณ์"
                    subtitle="ส่องกล้องไปที่ QR Code บนตัวเครื่องอุปกรณ์เพื่อค้นหาและทำรายการรับคืนด่วน"
                />
            )}
        </div>
    )
}
