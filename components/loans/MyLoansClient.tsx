'use client'

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import {
    Star, CalendarDays, Clock, Package,
    CheckCircle, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Send, Bookmark, Timer, Loader2
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Pagination from '@/components/ui/Pagination'
import EvaluationModal from '@/components/evaluations/EvaluationModal'
import type { MyHistoryItem, MyLoanItem } from '@/lib/data/my-loans'

type FilterTab = 'all' | 'loans' | 'reservations'

const loanStatusConfig = {
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" /> },
    returned: { label: 'คืนแล้ว', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Package className="w-4 h-4" /> },
}

const reservationStatusConfig = {
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'จองสำเร็จ', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle2 className="w-4 h-4" /> },
    ready: { label: 'พร้อมรับ', color: 'bg-green-100 text-green-800 border-green-200', icon: <Timer className="w-4 h-4" /> },
    completed: { label: 'รับแล้ว', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Package className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" /> },
    cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <XCircle className="w-4 h-4" /> },
    expired: { label: 'หมดอายุ', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <AlertTriangle className="w-4 h-4" /> },
}

interface MyLoansClientProps {
    loans: MyLoanItem[]
    reservations: MyHistoryItem[]
    evaluationCutoffDate: string
}

export default function MyLoansClient({ loans, reservations, evaluationCutoffDate }: MyLoansClientProps) {
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<FilterTab>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)
    const [selectedLoan, setSelectedLoan] = useState<any>(null)
    const [showThankYou, setShowThankYou] = useState(false)

    // Combine and sort by created_at
    const allItems: MyHistoryItem[] = useMemo(() => [
        ...loans,
        ...reservations,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [loans, reservations])

    const filteredItems = filter === 'all'
        ? allItems
        : allItems.filter(item => filter === 'loans' ? item.type === 'loan' : item.type === 'reservation')

    const totalItems = filteredItems.length
    const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleFilterChange = (newFilter: FilterTab) => {
        setFilter(newFilter)
        setCurrentPage(1)
    }

    const handleEvaluate = (loan: any) => {
        setSelectedLoan(loan)
        setIsEvaluationModalOpen(true)
    }

    const handleEvaluationSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['my-loans'] })
        setShowThankYou(true)
        setTimeout(() => setShowThankYou(false), 3000)
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">ประวัติการยืมและจอง</h1>
                        <p className="mt-2 text-gray-500">ดูสถานะคำขอยืมและจองอุปกรณ์ทั้งหมดของคุณ</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1 mb-6">
                        {([
                            { key: 'all', label: 'ทั้งหมด', count: allItems.length, activeClass: 'bg-gray-900 text-white' },
                            { key: 'loans', label: 'ยืม', count: loans.length, activeClass: 'bg-blue-600 text-white', icon: <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                            { key: 'reservations', label: 'จอง', count: reservations.length, activeClass: 'bg-purple-600 text-white', icon: <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                        ] as const).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleFilterChange(tab.key as FilterTab)}
                                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${filter === tab.key ? tab.activeClass : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                {'icon' in tab && tab.icon}
                                <span className="truncate">{tab.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Items List */}
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filter === 'all' ? 'ยังไม่มีประวัติการยืมหรือจอง' : filter === 'loans' ? 'ยังไม่มีประวัติการยืม' : 'ยังไม่มีประวัติการจอง'}
                            </h3>
                            <p className="text-gray-500 mb-6">เริ่มยืมหรือจองอุปกรณ์ได้โดยเลือกจากรายการอุปกรณ์</p>
                            <Link href="/equipment" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                ดูรายการอุปกรณ์
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {paginatedItems.map((item) => {
                                    const isLoan = item.type === 'loan'
                                    const config = isLoan
                                        ? loanStatusConfig[item.status as keyof typeof loanStatusConfig] || loanStatusConfig.pending
                                        : reservationStatusConfig[item.status as keyof typeof reservationStatusConfig] || reservationStatusConfig.pending
                                    const equipment = item.equipment
                                    const images = Array.isArray(equipment?.images) ? equipment.images : []
                                    const imageUrl = images.length > 0 ? images[0] : null

                                    const isReturned = isLoan && item.status === 'returned'
                                    const evaluations = (item as MyLoanItem).evaluations || []
                                    const isEvaluated = evaluations.length > 0
                                    const rating = isEvaluated ? evaluations[0].rating : 0
                                    const returnedDate = (item as any).updated_at?.split('T')[0] || ''
                                    const isMandatoryEval = returnedDate >= evaluationCutoffDate

                                    return (
                                        <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                                            <div className="flex flex-row gap-3 sm:gap-4">
                                                {/* Equipment Image — fixed dimensions prevent CLS */}
                                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {imageUrl ? (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={equipment?.name || 'Equipment'}
                                                            fill
                                                            sizes="(max-width: 640px) 80px, 96px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isLoan ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                                        {isLoan ? 'ยืม' : 'จอง'}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-gray-900 truncate">{equipment?.name || 'ไม่ระบุอุปกรณ์'}</h3>
                                                                {isReturned && !isEvaluated && (
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isMandatoryEval ? 'bg-orange-100 text-orange-800 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {isMandatoryEval ? 'รอการประเมิน' : 'ประเมินได้'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 font-mono">#{equipment?.equipment_number}</p>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                                            {config.icon}
                                                            {config.label}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <CalendarDays className="w-4 h-4" />
                                                                <span>
                                                                    {new Date(item.start_date).toLocaleDateString('th-TH')} - {new Date(item.end_date).toLocaleDateString('th-TH')}
                                                                    {(item as any).return_time && ` ${(item as any).return_time.slice(0, 5)} น.`}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>

                                                        {isReturned && (
                                                            <div className="mt-2 sm:mt-0">
                                                                {isEvaluated ? (
                                                                    <div className="flex items-center gap-1 text-yellow-500 font-medium text-sm">
                                                                        <Star className="w-4 h-4 fill-current" />
                                                                        <span>{rating}/5</span>
                                                                        <span className="text-gray-400 text-xs ml-1">(ประเมินแล้ว)</span>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleEvaluate(item)}
                                                                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${isMandatoryEval ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'}`}
                                                                    >
                                                                        <Star className="w-3 h-3" />
                                                                        {isMandatoryEval ? 'ประเมินความพึงพอใจ' : 'ประเมินย้อนหลัง'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {item.status === 'rejected' && item.rejection_reason && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                            <p className="text-sm text-red-700"><span className="font-medium">เหตุผลที่ปฏิเสธ:</span> {item.rejection_reason}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {totalItems > 0 && (
                                <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalItems={totalItems}
                                        pageSize={pageSize}
                                        onPageChange={setCurrentPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <EvaluationModal
                isOpen={isEvaluationModalOpen}
                onClose={() => setIsEvaluationModalOpen(false)}
                loan={selectedLoan}
                onSuccess={handleEvaluationSuccess}
            />

            {showThankYou && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">ขอบคุณที่ช่วยพัฒนาระบบ! 🙏</span>
                    </div>
                </div>
            )}
        </>
    )
}
