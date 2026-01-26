'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient, getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle2, XCircle, Package, CalendarDays, Loader2, Bookmark, Send, AlertTriangle, Timer, Star } from 'lucide-react'
import Header from '@/components/layout/Header'
import Pagination from '@/components/ui/Pagination'
import EvaluationModal from '@/components/evaluations/EvaluationModal'

type LoanStatus = 'pending' | 'approved' | 'rejected' | 'returned'
type ReservationStatus = 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'
type FilterTab = 'all' | 'loans' | 'reservations'

const loanStatusConfig: Record<LoanStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" /> },
    returned: { label: 'คืนแล้ว', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Package className="w-4 h-4" /> },
}

const reservationStatusConfig: Record<ReservationStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'จองสำเร็จ', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle2 className="w-4 h-4" /> },
    ready: { label: 'พร้อมรับ', color: 'bg-green-100 text-green-800 border-green-200', icon: <Timer className="w-4 h-4" /> },
    completed: { label: 'รับแล้ว', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Package className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" /> },
    cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <XCircle className="w-4 h-4" /> },
    expired: { label: 'หมดอายุ', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <AlertTriangle className="w-4 h-4" /> },
}

interface HistoryItem {
    id: string
    type: 'loan' | 'reservation'
    status: string
    start_date: string
    end_date: string
    created_at: string
    rejection_reason?: string | null
    equipment: {
        id: string
        name: string
        equipment_number: string
        images: string[]
    }
    evaluations?: {
        id: string
        rating: number
    }[]
}

export default function MyLoansPage() {
    const queryClient = useQueryClient()
    const [userId, setUserId] = useState<string | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterTab>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Evaluation state
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)
    const [selectedLoan, setSelectedLoan] = useState<any>(null)

    useEffect(() => {
        const client = getSupabaseBrowserClient()
        if (client) {
            client.auth.getSession().then(({ data: { session } }) => {
                setUserId(session?.user?.id || null)
                setAccessToken(session?.access_token || null)
            })
        }
    }, [])

    // Fetch loans with user access_token
    const { data: loans, isLoading: loansLoading } = useQuery({
        queryKey: ['my-loans', userId],
        enabled: !!userId && !!accessToken,
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key || !userId || !accessToken) return []

            // Added evaluations to select
            const response = await fetch(
                `${url}/rest/v1/loanRequests?user_id=eq.${userId}&select=*,equipment(id,name,equipment_number,images),evaluations(id,rating)&order=created_at.desc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        },
    })

    // Fetch reservations with user access_token
    const { data: reservations, isLoading: reservationsLoading } = useQuery({
        queryKey: ['my-reservations', userId],
        enabled: !!userId && !!accessToken,
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key || !userId || !accessToken) return []

            const response = await fetch(
                `${url}/rest/v1/reservations?user_id=eq.${userId}&select=*,equipment(id,name,equipment_number,images)&order=created_at.desc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        },
    })

    const isLoading = loansLoading || reservationsLoading

    // Combine and sort by created_at
    const allItems: HistoryItem[] = [
        ...(loans || []).map((loan: any) => ({
            ...loan,
            type: 'loan' as const,
        })),
        ...(reservations || []).map((reservation: any) => ({
            ...reservation,
            type: 'reservation' as const,
        })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Filter items
    const filteredItems = filter === 'all'
        ? allItems
        : allItems.filter(item =>
            filter === 'loans' ? item.type === 'loan' : item.type === 'reservation'
        )

    const loanCount = (loans || []).length
    const reservationCount = (reservations || []).length

    // Pagination
    const totalItems = filteredItems.length
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    // Reset page when filter changes
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
    }

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">ประวัติการยืมและจอง</h1>
                        <p className="mt-2 text-gray-500">ดูสถานะคำขอยืมและจองอุปกรณ์ทั้งหมดของคุณ</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${filter === 'all'
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <span className="truncate">ทั้งหมด</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${filter === 'all' ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {allItems.length}
                            </span>
                        </button>
                        <button
                            onClick={() => handleFilterChange('loans')}
                            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${filter === 'loans'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="truncate">ยืม</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${filter === 'loans' ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {loanCount}
                            </span>
                        </button>
                        <button
                            onClick={() => handleFilterChange('reservations')}
                            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${filter === 'reservations'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="truncate">จอง</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${filter === 'reservations' ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {reservationCount}
                            </span>
                        </button>
                    </div>

                    {/* Items List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filter === 'all'
                                    ? 'ยังไม่มีประวัติการยืมหรือจอง'
                                    : filter === 'loans'
                                        ? 'ยังไม่มีประวัติการยืม'
                                        : 'ยังไม่มีประวัติการจอง'
                                }
                            </h3>
                            <p className="text-gray-500 mb-6">เริ่มยืมหรือจองอุปกรณ์ได้โดยเลือกจากรายการอุปกรณ์</p>
                            <Link
                                href="/equipment"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                ดูรายการอุปกรณ์
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {paginatedItems.map((item) => {
                                    const isLoan = item.type === 'loan'
                                    const status = item.status as (LoanStatus | ReservationStatus)
                                    const config = isLoan
                                        ? loanStatusConfig[status as LoanStatus] || loanStatusConfig.pending
                                        : reservationStatusConfig[status as ReservationStatus] || reservationStatusConfig.pending
                                    const equipment = item.equipment
                                    const images = Array.isArray(equipment?.images) ? equipment.images : []
                                    const imageUrl = images.length > 0 ? images[0] : 'https://placehold.co/100x100?text=No+Image'

                                    // Evaluation logic for loans
                                    const isReturned = isLoan && item.status === 'returned'
                                    const evaluations = item.evaluations || []
                                    const isEvaluated = evaluations.length > 0
                                    const rating = isEvaluated ? evaluations[0].rating : 0

                                    return (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow relative"
                                        >
                                            <div className="flex flex-row gap-3 sm:gap-4">
                                                {/* Equipment Image */}
                                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={imageUrl}
                                                        alt={equipment?.name || 'Equipment'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Type Badge */}
                                                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isLoan
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-purple-600 text-white'
                                                        }`}>
                                                        {isLoan ? 'ยืม' : 'จอง'}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-gray-900 truncate">
                                                                    {equipment?.name || 'ไม่ระบุอุปกรณ์'}
                                                                </h3>
                                                                {/* Pending Evaluation Badge */}
                                                                {isReturned && !isEvaluated && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                                                                        รอการประเมิน
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 font-mono">
                                                                #{equipment?.equipment_number}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                                                {config.icon}
                                                                {config.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <CalendarDays className="w-4 h-4" />
                                                                <span>
                                                                    {new Date(item.start_date).toLocaleDateString('th-TH')} - {new Date(item.end_date).toLocaleDateString('th-TH')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <Clock className="w-4 h-4" />
                                                                <span>
                                                                    {new Date(item.created_at).toLocaleDateString('th-TH', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Evaluation Action */}
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
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                                                                    >
                                                                        <Star className="w-3 h-3" />
                                                                        ประเมินความพึงพอใจ
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Rejection Reason */}
                                                    {item.status === 'rejected' && item.rejection_reason && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                            <p className="text-sm text-red-700">
                                                                <span className="font-medium">เหตุผลที่ปฏิเสธ:</span> {item.rejection_reason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination */}
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
        </>
    )
}
