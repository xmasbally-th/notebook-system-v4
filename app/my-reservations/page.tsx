'use client'

import { useUserReservations } from '@/hooks/useReservations'
import { cancelReservation, ReservationStatus } from '@/lib/reservations'
import { useState } from 'react'
import Link from 'next/link'
import { formatThaiDate } from '@/lib/formatThaiDate'
import { useToast } from '@/components/ui/toast'
import { useQueryClient } from '@tanstack/react-query'
import AuthGuard from '@/components/auth/AuthGuard'
import {
    Clock, CheckCircle, XCircle, CalendarPlus, Package,
    Calendar, ArrowRight, Loader2, AlertTriangle, Ban
} from 'lucide-react'

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; icon: any }> = {
    pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    ready: { label: 'พร้อมรับ', color: 'bg-blue-100 text-blue-700', icon: Package },
    completed: { label: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-500', icon: Ban },
    expired: { label: 'หมดเวลา', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
}

export default function MyReservationsPage() {
    const { data: reservations, isLoading, error } = useUserReservations()
    const [cancelling, setCancelling] = useState<string | null>(null)
    const toast = useToast()
    const queryClient = useQueryClient()

    const handleCancel = async (id: string) => {
        if (!confirm('ต้องการยกเลิกการจองนี้หรือไม่?')) return

        setCancelling(id)
        const result = await cancelReservation(id)
        setCancelling(null)

        if (result.success) {
            toast.success('ยกเลิกการจองเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['user-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาด')
        }
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">การจองของฉัน</h1>
                            <p className="text-sm text-gray-500">รายการจองอุปกรณ์ล่วงหน้าของคุณ</p>
                        </div>
                        <Link
                            href="/equipment"
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            จองเพิ่ม
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                            <AlertTriangle className="w-12 h-12 mx-auto text-red-300 mb-3" />
                            <p className="text-red-700">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                        </div>
                    ) : !reservations || reservations.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <CalendarPlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีการจอง</h3>
                            <p className="text-gray-500 mb-4">คุณยังไม่มีการจองอุปกรณ์ล่วงหน้า</p>
                            <Link
                                href="/equipment"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                <CalendarPlus className="w-4 h-4" />
                                จองอุปกรณ์
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reservations.map((reservation: any) => {
                                const status = reservation.status as ReservationStatus
                                const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending
                                const StatusIcon = statusConfig.icon
                                const canCancel = ['pending', 'approved'].includes(status)

                                return (
                                    <div
                                        key={reservation.id}
                                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                                    >
                                        <div className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {/* Equipment Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {reservation.equipment?.images?.[0] ? (
                                                            <img
                                                                src={reservation.equipment.images[0]}
                                                                alt=""
                                                                className="w-16 h-16 object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="w-8 h-8 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {reservation.equipment?.name || 'ไม่ทราบชื่อ'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 font-mono">
                                                            {reservation.equipment?.equipment_number}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${statusConfig.color}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            {/* Dates */}
                                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{formatThaiDate(reservation.start_date)}</span>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                                <span>{formatThaiDate(reservation.end_date)}</span>
                                            </div>

                                            {/* Ready countdown */}
                                            {status === 'ready' && reservation.ready_at && (
                                                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="text-sm text-blue-700">
                                                        ⏰ กรุณามารับอุปกรณ์ภายใน 5 นาที!
                                                    </p>
                                                </div>
                                            )}

                                            {/* Rejection reason */}
                                            {status === 'rejected' && reservation.rejection_reason && (
                                                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <p className="text-sm text-red-700">
                                                        เหตุผล: {reservation.rejection_reason}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Cancel Button */}
                                            {canCancel && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleCancel(reservation.id)}
                                                        disabled={cancelling === reservation.id}
                                                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                                                    >
                                                        {cancelling === reservation.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                        ยกเลิกการจอง
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    )
}
