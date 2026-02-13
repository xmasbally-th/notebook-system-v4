'use client'

import { useAllReservations } from '@/hooks/useReservations'
import {
    approveReservation,
    rejectReservation,
    markReservationReady,
    ReservationStatus,
    Reservation
} from '@/lib/reservations'
import { convertReservationToLoanAction } from '@/app/reservations/actions'
import { useState, useMemo } from 'react'
import StaffLayout from '@/components/staff/StaffLayout'
import { formatThaiDate } from '@/lib/formatThaiDate'
import { useToast } from '@/components/ui/toast'
import { useQueryClient } from '@tanstack/react-query'
import {
    Clock, CheckCircle, XCircle, Package, User,
    Calendar, ArrowRight, Loader2, AlertTriangle,
    Search, CalendarPlus, Bell, ArrowRightCircle,
    MessageSquare, Timer, Ban
} from 'lucide-react'

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; icon: any }> = {
    pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    ready: { label: 'พร้อมรับ', color: 'bg-blue-100 text-blue-700', icon: Bell },
    completed: { label: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-500', icon: Ban },
    expired: { label: 'หมดเวลา', color: 'bg-orange-100 text-orange-700', icon: Timer },
}

export default function StaffReservationsPage() {
    const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('pending')
    const { data: reservations, isLoading, error } = useAllReservations(statusFilter)
    const [searchTerm, setSearchTerm] = useState('')
    const [processing, setProcessing] = useState<string | null>(null)
    const [rejectModal, setRejectModal] = useState<{ id: string; userId: string } | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    const toast = useToast()
    const queryClient = useQueryClient()

    // Filter by search
    const filteredReservations = useMemo(() => {
        if (!reservations) return []
        if (!searchTerm) return reservations

        const search = searchTerm.toLowerCase()
        return reservations.filter((r: any) =>
            r.profiles?.first_name?.toLowerCase().includes(search) ||
            r.profiles?.last_name?.toLowerCase().includes(search) ||
            r.profiles?.email?.toLowerCase().includes(search) ||
            r.equipment?.name?.toLowerCase().includes(search) ||
            r.equipment?.equipment_number?.toLowerCase().includes(search)
        )
    }, [reservations, searchTerm])

    // Stats
    const stats = useMemo(() => {
        if (!reservations) return { pending: 0, approved: 0, ready: 0 }
        return {
            pending: reservations.filter((r: any) => r.status === 'pending').length,
            approved: reservations.filter((r: any) => r.status === 'approved').length,
            ready: reservations.filter((r: any) => r.status === 'ready').length,
        }
    }, [reservations])

    const handleApprove = async (id: string, userId: string) => {
        setProcessing(id)
        const result = await approveReservation(id, userId)
        setProcessing(null)

        if (result.success) {
            toast.success('อนุมัติการจองเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาด')
        }
    }

    const handleRejectConfirm = async () => {
        if (!rejectModal || !rejectReason.trim()) {
            toast.error('กรุณาระบุเหตุผล')
            return
        }

        setProcessing(rejectModal.id)
        const result = await rejectReservation(rejectModal.id, rejectReason, rejectModal.userId)
        setProcessing(null)
        setRejectModal(null)
        setRejectReason('')

        if (result.success) {
            toast.success('ปฏิเสธการจองเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาด')
        }
    }

    const handleMarkReady = async (id: string, userId: string) => {
        setProcessing(id)
        const result = await markReservationReady(id, userId)
        setProcessing(null)

        if (result.success) {
            toast.success('เปลี่ยนสถานะเป็น "พร้อมรับ" แล้ว')
            queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาด')
        }
    }

    const handleConvertToLoan = async (reservation: any) => {
        if (!confirm('ยืนยันการแปลงการจองเป็นคำขอยืม?')) return

        setProcessing(reservation.id)
        const result = await convertReservationToLoanAction(reservation.id)
        setProcessing(null)

        if (result.success) {
            toast.success('แปลงเป็นคำขอยืมเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
            queryClient.invalidateQueries({ queryKey: ['staff-loan-requests'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาด')
        }
    }

    return (
        <StaffLayout title="จัดการการจอง" subtitle="อนุมัติ ปฏิเสธ และจัดการการจองล่วงหน้า">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            <p className="text-xs text-gray-500">รออนุมัติ</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            <p className="text-xs text-gray-500">รอรับ</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{stats.ready}</p>
                            <p className="text-xs text-gray-500">พร้อมรับ</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อผู้จอง, อุปกรณ์..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm min-w-[140px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="pending">รออนุมัติ</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="ready">พร้อมรับ</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="rejected">ปฏิเสธ</option>
                            <option value="cancelled">ยกเลิก</option>
                            <option value="expired">หมดเวลา</option>
                        </select>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-300 mb-3" />
                        <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="p-12 text-center">
                        <CalendarPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่มีรายการจอง</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredReservations.map((reservation: any) => {
                            const status = reservation.status as ReservationStatus
                            const statusConfig = STATUS_CONFIG[status]
                            const StatusIcon = statusConfig.icon
                            const isProcessing = processing === reservation.id

                            return (
                                <div key={reservation.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* User & Equipment Info */}
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {reservation.equipment?.images?.[0] ? (
                                                    <img src={reservation.equipment.images[0]} alt="" className="w-12 h-12 object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">
                                                        {reservation.profiles?.first_name} {reservation.profiles?.last_name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{reservation.equipment?.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatThaiDate(reservation.start_date)}</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span>{formatThaiDate(reservation.end_date)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${statusConfig.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusConfig.label}
                                            </span>

                                            {/* Action Buttons */}
                                            {status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(reservation.id, reservation.user_id)}
                                                        disabled={isProcessing}
                                                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"
                                                        title="อนุมัติ"
                                                    >
                                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ id: reservation.id, userId: reservation.user_id })}
                                                        disabled={isProcessing}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                                                        title="ปฏิเสธ"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {status === 'approved' && (
                                                <button
                                                    onClick={() => handleMarkReady(reservation.id, reservation.user_id)}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                                                    พร้อมรับ
                                                </button>
                                            )}

                                            {status === 'ready' && (
                                                <button
                                                    onClick={() => handleConvertToLoan(reservation)}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
                                                    แปลงเป็นยืม
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rejection reason */}
                                    {status === 'rejected' && reservation.rejection_reason && (
                                        <div className="mt-3 ml-16 flex items-start gap-2 text-sm text-red-600">
                                            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{reservation.rejection_reason}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">ปฏิเสธการจอง</h3>
                        <p className="text-sm text-gray-500 mb-4">กรุณาระบุเหตุผลในการปฏิเสธ</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="เหตุผล..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setRejectModal(null)
                                    setRejectReason('')
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={processing === rejectModal.id}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processing === rejectModal.id ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StaffLayout>
    )
}
