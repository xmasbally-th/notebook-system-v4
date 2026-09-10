'use client'

import React, { useState } from 'react'
import {
    Clock, CheckCircle, XCircle, Package, User,
    Calendar, ArrowRight, Bell, ArrowRightCircle,
    MessageSquare, Timer, Ban, Trash2, Pencil, Phone, Mail, Building
} from 'lucide-react'
import { formatThaiDate } from '@/lib/formatThaiDate'
import type { ReservationItemData } from '@/app/admin/reservations/actions'

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    ready: { label: 'พร้อมรับ', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Bell },
    completed: { label: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Ban },
    expired: { label: 'หมดเวลา', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Timer },
}

interface ReservationItemProps {
    reservation: ReservationItemData
    isAdmin?: boolean
    processingId: string | null
    onApprove: (id: string) => void
    onReject: (reservation: ReservationItemData) => void
    onMarkReady: (id: string) => void
    onConvertToLoan: (reservation: ReservationItemData) => void
    onEdit?: (reservation: ReservationItemData) => void
    onForceCancel?: (reservation: ReservationItemData) => void
    onDelete?: (reservation: ReservationItemData) => void
}

export default function ReservationItem({
    reservation,
    isAdmin = false,
    processingId,
    onApprove,
    onReject,
    onMarkReady,
    onConvertToLoan,
    onEdit,
    onForceCancel,
    onDelete
}: ReservationItemProps) {
    const [imgError, setImgError] = useState(false)
    const isProcessing = processingId === reservation.id

    const status = reservation.status
    const statusConfig = STATUS_CONFIG[status] || {
        label: status,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: Clock
    }
    const StatusIcon = statusConfig.icon

    const profile = reservation.profiles
    const borrowerName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'ไม่ระบุชื่อ'
    const departmentName = Array.isArray(profile?.departments) ? profile.departments[0]?.name : profile?.departments?.name || '-'
    const canCancel = ['pending', 'approved', 'ready'].includes(status)

    const firstImage = reservation.equipment?.images?.[0]

    return (
        <div className="p-4 hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* User & Equipment Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Thumbnail Image */}
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 shadow-xs">
                        {firstImage && !imgError ? (
                            <img
                                src={firstImage}
                                alt={reservation.equipment?.name || 'Equipment'}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                        )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                        {/* Reserver Profile */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span>{borrowerName}</span>
                            </div>
                            {departmentName !== '-' && (
                                <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                    <Building className="w-3 h-3 text-slate-400" />
                                    {departmentName}
                                </span>
                            )}
                        </div>

                        {/* Contact details */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-1.5">
                            {profile?.email && (
                                <span className="inline-flex items-center gap-1 text-gray-500">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    {profile.email}
                                </span>
                            )}
                            {profile?.phone_number && (
                                <a
                                    href={`tel:${profile.phone_number}`}
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                    <Phone className="w-3 h-3 text-blue-500" />
                                    {profile.phone_number}
                                </a>
                            )}
                        </div>

                        {/* Equipment Name & Number */}
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                            <span>{reservation.equipment?.name || 'อุปกรณ์ไม่ระบุชื่อ'}</span>
                            {reservation.equipment?.equipment_number && (
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm">
                                    #{reservation.equipment.equipment_number}
                                </span>
                            )}
                        </div>

                        {/* Booking Dates & Times */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1 text-gray-700">
                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                <span>{formatThaiDate(reservation.start_date)}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span>{formatThaiDate(reservation.end_date)}</span>
                            </div>

                            {reservation.pickup_time && (
                                <div className="flex items-center gap-1 text-gray-500 border-l border-gray-200 pl-2">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span>รับ: {reservation.pickup_time.slice(0, 5)} น.</span>
                                    {reservation.return_time && (
                                        <span>| คืน: {reservation.return_time.slice(0, 5)} น.</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Badge & Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border shadow-2xs ${statusConfig.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                    </span>

                    {/* Operational Action Buttons */}
                    {status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onApprove(reservation.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                                title="อนุมัติการจอง"
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                            </button>
                            <button
                                onClick={() => onReject(reservation)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors border border-red-200 disabled:opacity-50 cursor-pointer"
                                title="ปฏิเสธการจอง"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>ปฏิเสธ</span>
                            </button>
                        </div>
                    )}

                    {status === 'approved' && (
                        <button
                            onClick={() => onMarkReady(reservation.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                            title="เปลี่ยนสถานะเป็นพร้อมรับอุปกรณ์"
                        >
                            <Bell className="w-3.5 h-3.5" />
                            <span>พร้อมรับ</span>
                        </button>
                    )}

                    {status === 'ready' && (
                        <button
                            onClick={() => onConvertToLoan(reservation)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                            title="แปลงการจองเป็นการยืมใช้งาน"
                        >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                            <span>แปลงเป็นยืม</span>
                        </button>
                    )}

                    {/* Admin Superuser Actions */}
                    {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(reservation)}
                                    disabled={isProcessing}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                    title="แก้ไขข้อมูลการจอง (Admin)"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}

                            {onForceCancel && canCancel && (
                                <button
                                    onClick={() => onForceCancel(reservation)}
                                    disabled={isProcessing}
                                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                    title="บังคับยกเลิกการจอง (Admin)"
                                >
                                    <Ban className="w-4 h-4" />
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    onClick={() => onDelete(reservation)}
                                    disabled={isProcessing}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                    title="ลบการจองออกจากระบบ (Admin)"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection reason display */}
            {status === 'rejected' && reservation.rejection_reason && (
                <div className="mt-2.5 ml-0 sm:ml-18 p-2.5 bg-red-50/70 border border-red-100 rounded-lg flex items-start gap-2 text-xs text-red-700">
                    <MessageSquare className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-semibold">เหตุผลที่ปฏิเสธ: </span>
                        <span>{reservation.rejection_reason}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
