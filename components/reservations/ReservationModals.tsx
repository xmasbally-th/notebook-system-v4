'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, Pencil, X, Save, AlertCircle, Phone, Mail, Building, Calendar, Clock, Loader2, Copy, Check, ShieldCheck, UserCheck } from 'lucide-react'
import type { ReservationItemData } from '@/app/admin/reservations/actions'
import type { BookingConflictInfo } from '@/lib/domain'
import { formatThaiDate } from '@/lib/formatThaiDate'

// ==========================================
// 1. Reject Modal
// ==========================================
interface RejectModalProps {
    isOpen: boolean
    reservation: ReservationItemData | null
    isProcessing: boolean
    onClose: () => void
    onConfirm: (id: string, reason: string) => void
}

export function RejectModal({ isOpen, reservation, isProcessing, onClose, onConfirm }: RejectModalProps) {
    const [reason, setReason] = useState('')

    useEffect(() => {
        if (isOpen) setReason('')
    }, [isOpen])

    if (!isOpen || !reservation) return null

    const borrowerName = reservation.profiles
        ? `${reservation.profiles.first_name || ''} ${reservation.profiles.last_name || ''}`.trim()
        : 'ผู้ใช้'

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">ปฏิเสธการจอง</h3>
                            <p className="text-xs text-gray-500">{borrowerName} · {reservation.equipment?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-gray-600 mb-3">กรุณาระบุเหตุผลในการปฏิเสธคำขอจอง เพื่อให้ผู้ใช้ทราบและดำเนินการต่อไป:</p>

                <textarea
                    rows={3}
                    placeholder="เช่น อุปกรณ์ต้องนำเข้าซ่อมบำรุง, ช่วงเวลาที่ขอไม่ตรงกับเงื่อนไขการใช้งาน..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 resize-none"
                    autoFocus
                />

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!reason.trim()) return
                            onConfirm(reservation.id, reason.trim())
                        }}
                        disabled={isProcessing || !reason.trim()}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>ยืนยันปฏิเสธ</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==========================================
// 2. Edit Modal (Admin Only)
// ==========================================
interface EditModalProps {
    isOpen: boolean
    reservation: ReservationItemData | null
    isProcessing: boolean
    onClose: () => void
    onSave: (data: {
        reservationId: string
        startDate: string
        endDate: string
        pickupTime: string | null
        returnTime: string | null
        status: any
        rejectionReason: string | null
    }) => void
}

export function EditModal({ isOpen, reservation, isProcessing, onClose, onSave }: EditModalProps) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [pickupTime, setPickupTime] = useState('')
    const [returnTime, setReturnTime] = useState('')
    const [status, setStatus] = useState<any>('pending')
    const [rejectionReason, setRejectionReason] = useState('')

    useEffect(() => {
        if (reservation) {
            setStartDate(reservation.start_date ? reservation.start_date.substring(0, 10) : '')
            setEndDate(reservation.end_date ? reservation.end_date.substring(0, 10) : '')
            setPickupTime(reservation.pickup_time ? reservation.pickup_time.substring(0, 5) : '')
            setReturnTime(reservation.return_time ? reservation.return_time.substring(0, 5) : '')
            setStatus(reservation.status)
            setRejectionReason(reservation.rejection_reason || '')
        }
    }, [reservation])

    if (!isOpen || !reservation) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            reservationId: reservation.id,
            startDate,
            endDate,
            pickupTime: pickupTime || null,
            returnTime: returnTime || null,
            status,
            rejectionReason: status === 'rejected' ? rejectionReason : null
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                            <Pencil className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">แก้ไขข้อมูลการจอง (Admin)</h3>
                            <p className="text-xs text-gray-500">
                                {reservation.profiles?.first_name} {reservation.profiles?.last_name} · {reservation.equipment?.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่รับ</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่คืน</label>
                            <input
                                type="date"
                                required
                                min={startDate}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">เวลารับ (ถ้ามี)</label>
                            <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">เวลาคืน (ถ้ามี)</label>
                            <input
                                type="time"
                                value={returnTime}
                                onChange={(e) => setReturnTime(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">สถานะการจอง</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="pending">รออนุมัติ</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="ready">พร้อมรับ</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="rejected">ปฏิเสธ</option>
                            <option value="cancelled">ยกเลิก</option>
                            <option value="expired">หมดเวลา</option>
                        </select>
                    </div>

                    {/* Rejection Reason */}
                    {status === 'rejected' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">เหตุผลในการปฏิเสธ</label>
                            <textarea
                                rows={2}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="ระบุเหตุผลในการปฏิเสธ..."
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>บันทึกการแก้ไข</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ==========================================
// 3. Delete Confirmation Modal (Admin Only)
// ==========================================
interface DeleteModalProps {
    isOpen: boolean
    reservation: ReservationItemData | null
    isProcessing: boolean
    onClose: () => void
    onConfirm: (id: string) => void
}

export function DeleteModal({ isOpen, reservation, isProcessing, onClose, onConfirm }: DeleteModalProps) {
    if (!isOpen || !reservation) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl flex-shrink-0">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">ลบการจองออกจากระบบถาวร</h3>
                        <p className="text-xs text-gray-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                    </div>
                </div>

                <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-800 space-y-1 mb-5">
                    <p className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                        คำเตือนความปลอดภัยของข้อมูล
                    </p>
                    <p>
                        คุณกำลังจะลบรายการจองของ <strong>{reservation.profiles?.first_name} {reservation.profiles?.last_name}</strong> (อุปกรณ์: {reservation.equipment?.name})
                    </p>
                    <p className="text-red-700">
                        หากการจองนี้ผูกอยู่กับสัญญาการยืมที่กำลังใช้งาน ระบบจะไม่อนุญาตให้ลบ
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(reservation.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>ยืนยันลบถาวร</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==========================================
// 4. Action Confirmation Modal (Replaces window.confirm)
// ==========================================
interface ConfirmActionModalProps {
    isOpen: boolean
    title: string
    description: string
    confirmText?: string
    confirmColor?: 'blue' | 'purple' | 'orange' | 'red'
    icon?: React.ComponentType<{ className?: string }>
    isProcessing: boolean
    onClose: () => void
    onConfirm: () => void
}

export function ConfirmActionModal({
    isOpen,
    title,
    description,
    confirmText = 'ยืนยัน',
    confirmColor = 'blue',
    icon: Icon = AlertCircle,
    isProcessing,
    onClose,
    onConfirm
}: ConfirmActionModalProps) {
    if (!isOpen) return null

    const colorClasses: Record<string, { bg: string; text: string; btn: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', btn: 'bg-orange-600 hover:bg-orange-700' },
        red: { bg: 'bg-red-50', text: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' }
    }
    const color = colorClasses[confirmColor] || colorClasses.blue

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${color.bg} ${color.text}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium transition-colors shadow-xs flex items-center justify-center gap-2 ${color.btn}`}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==========================================
// 5. Conflict Detail Modal (Role-Based Clarity: User / Staff / Admin)
// ==========================================
interface ConflictDetailModalProps {
    isOpen: boolean
    conflictInfo: BookingConflictInfo | null
    onClose: () => void
    role?: 'user' | 'staff' | 'admin'
}

export function ConflictDetailModal({ isOpen, conflictInfo, onClose, role = 'staff' }: ConflictDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'user' | 'staff' | 'admin'>(role)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setActiveTab(role)
            setCopied(false)
        }
    }, [isOpen, role])

    if (!isOpen || !conflictInfo) return null

    const currentMessage = conflictInfo.messagesByRole?.[activeTab] || conflictInfo.formattedMessage || 'ตรวจพบข้อขัดแย้งกับคิวในระบบ'

    const handleCopy = () => {
        navigator.clipboard.writeText(currentMessage)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl flex-shrink-0 ${
                            activeTab === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : activeTab === 'staff'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900">
                                    {activeTab === 'admin'
                                        ? 'ตรวจพบ Conflict การจอง/ยืม (Admin)'
                                        : activeTab === 'staff'
                                        ? 'ตรวจพบคิวการจอง/ยืมที่ทับซ้อน (Staff)'
                                        : 'อุปกรณ์ไม่ว่างในช่วงเวลาที่เลือก (User)'}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500">
                                {activeTab === 'admin'
                                    ? 'ข้อมูลระดับผู้ดูแลระบบสำหรับจัดการคิวและข้อขัดแย้ง'
                                    : activeTab === 'staff'
                                    ? 'ข้อมูลติดต่อเพื่อประสานงานผู้จองหรือจัดหาเครื่องสำรอง'
                                    : 'ข้อมูลแจ้งผู้ใช้งานพร้อมคำแนะนำการจอง/ยืม'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Role Switcher Tabs (Allows viewing message for each role) */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl mb-4 text-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('user')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                            activeTab === 'user'
                                ? 'bg-white text-gray-900 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        มุมมองผู้ใช้ (User)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('staff')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                            activeTab === 'staff'
                                ? 'bg-white text-blue-700 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        เจ้าหน้าที่ (Staff)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('admin')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                            activeTab === 'admin'
                                ? 'bg-white text-purple-700 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        แอดมิน (Admin)
                    </button>
                </div>

                {/* Generated Notification Message Box */}
                <div className="relative mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                        <span>ข้อความแจ้งเตือนที่แสดงตามบทบาท:</span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                        </button>
                    </div>
                    <pre className="p-3.5 bg-slate-900 text-slate-100 text-xs rounded-xl font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800 shadow-xs">
                        {currentMessage}
                    </pre>
                </div>

                {/* Role-Specific Detail Card */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 mb-4 text-xs text-gray-800">
                    {/* Equipment Details */}
                    <div className="font-semibold text-sm text-gray-900 pb-2 border-b border-amber-200 flex items-center justify-between">
                        <div>
                            📦 {conflictInfo.equipment?.name || 'อุปกรณ์'}
                            {conflictInfo.equipment?.equipmentNumber && (
                                <span className="ml-2 font-mono text-xs bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded-sm">
                                    #{conflictInfo.equipment.equipmentNumber}
                                </span>
                            )}
                        </div>
                        {activeTab === 'admin' && conflictInfo.equipment?.id && (
                            <span className="text-[10px] text-gray-500 font-mono">
                                ID: {conflictInfo.equipment.id}
                            </span>
                        )}
                    </div>

                    {/* Holder Info: Masked for User, Detailed for Staff/Admin */}
                    {conflictInfo.holder && (
                        <div className="space-y-1">
                            <div className="text-amber-900 font-semibold">👤 ผู้ถือสิทธิ์คิวเดิม:</div>
                            {activeTab === 'user' ? (
                                <div className="space-y-1">
                                    <div className="font-medium text-gray-800">
                                        มีผู้ใช้งานในระบบจองไว้ล่วงหน้า
                                    </div>
                                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                                        <span>ข้อมูลติดต่อถูกสงวนสิทธิ์ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="font-medium text-gray-900">
                                        คุณ{conflictInfo.holder.name}
                                        {activeTab === 'admin' && (
                                            <span className="ml-1 text-gray-500 font-normal">
                                                (User ID: {conflictInfo.holder.id})
                                            </span>
                                        )}
                                    </div>
                                    {conflictInfo.holder.department && (
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Building className="w-3.5 h-3.5 text-gray-400" />
                                            <span>หน่วยงาน/ภาควิชา: {conflictInfo.holder.department}</span>
                                        </div>
                                    )}
                                    {conflictInfo.holder.phone && (
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            <span>โทร: </span>
                                            <a href={`tel:${conflictInfo.holder.phone}`} className="text-blue-600 hover:underline font-medium">
                                                {conflictInfo.holder.phone}
                                            </a>
                                        </div>
                                    )}
                                    {conflictInfo.holder.email && (
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            <span>อีเมล: </span>
                                            <a href={`mailto:${conflictInfo.holder.email}`} className="text-blue-600 hover:underline">
                                                {conflictInfo.holder.email}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Time Slot */}
                    {conflictInfo.timeSlot && (
                        <div className="space-y-1 pt-1 border-t border-amber-200">
                            <div className="text-amber-900 font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>ช่วงเวลาที่ติดคิวจอง/ยืม:</span>
                            </div>
                            <div className="text-gray-700">
                                {formatThaiDate(conflictInfo.timeSlot.startDate)}
                                {conflictInfo.timeSlot.pickupTime ? ` เวลา ${conflictInfo.timeSlot.pickupTime.slice(0, 5)} น.` : ''}
                                {' '} ถึง {' '}
                                {formatThaiDate(conflictInfo.timeSlot.endDate)}
                                {conflictInfo.timeSlot.returnTime ? ` เวลา ${conflictInfo.timeSlot.returnTime.slice(0, 5)} น.` : ''}
                            </div>
                        </div>
                    )}

                    {/* Status & Reference ID */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                        {conflictInfo.statusLabel && (
                            <div>
                                <span className="font-semibold text-amber-900">สถานะคิวเดิม: </span>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-medium">
                                    {conflictInfo.statusLabel}
                                </span>
                            </div>
                        )}
                        {activeTab === 'admin' && conflictInfo.conflictId && (
                            <span className="text-[10px] font-mono text-gray-500">
                                {conflictInfo.conflictType?.toUpperCase()} ID: {conflictInfo.conflictId}
                            </span>
                        )}
                    </div>
                </div>

                {/* Role Guidance Note */}
                <div className={`p-3 rounded-xl text-xs mb-5 ${
                    activeTab === 'admin'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200'
                        : activeTab === 'staff'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                    {activeTab === 'admin' ? (
                        <div>
                            🛠️ <strong>คำแนะนำสำหรับ Admin:</strong> คุณมีสิทธิ์ในการขยับวันเวลา, ปรับเปลี่ยนเครื่อง หรือบังคับยกเลิกคิว (Force Cancel) หากต้องการปลดล็อกอุปกรณ์
                        </div>
                    ) : activeTab === 'staff' ? (
                        <div>
                            📞 <strong>คำแนะนำสำหรับ Staff:</strong> กรุณาโทรติดต่อผู้จองล่วงหน้าตามเบอร์ด้านบนเพื่อยืนยัน หรือแนะนำให้ผู้ใช้เลือกอุปกรณ์อื่นที่ว่าง (Ready)
                        </div>
                    ) : (
                        <div>
                            💡 <strong>คำแนะนำสำหรับ User:</strong> กรุณาเลือกอุปกรณ์เครื่องอื่นที่ยังว่าง หรือปรับเปลี่ยนช่วงวันและเวลาการใช้งานไม่ให้ตรงกับคิวที่มีอยู่
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                    เข้าใจแล้ว ปิดหน้าต่าง
                </button>
            </div>
        </div>
    )
}
