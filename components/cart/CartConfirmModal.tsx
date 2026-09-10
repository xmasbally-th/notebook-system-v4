'use client'

import React from 'react'
import Image from 'next/image'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { CartItem } from './CartContext'

interface CartConfirmModalProps {
    items: CartItem[]
    mode: 'borrow' | 'reserve'
    today: string
    endDate: string
    returnTime: string
    reserveStartDate: string
    reservePickupTime: string
    reserveEndDate: string
    reserveReturnTime: string
    isSubmitting: boolean
    error: string | null
    onConfirm: () => void
    onCancel: () => void
    formatThaiDateShort: (dateStr: string) => string
}

export default function CartConfirmModal({
    items,
    mode,
    today,
    endDate,
    returnTime,
    reserveStartDate,
    reservePickupTime,
    reserveEndDate,
    reserveReturnTime,
    isSubmitting,
    error,
    onConfirm,
    onCancel,
    formatThaiDateShort
}: CartConfirmModalProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                    ยืนยันการ{mode === 'borrow' ? 'ยืม' : 'จอง'}อุปกรณ์
                </h3>
                <p className="text-sm text-gray-500 mt-1">กรุณาตรวจสอบข้อมูลก่อนส่งคำขอ</p>
            </div>

            {/* Summary: Equipment List */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-700">📦 รายการอุปกรณ์ ({items.length} รายการ)</h4>
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded relative flex-shrink-0 bg-gray-50 overflow-hidden">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                sizes="32px"
                                className="object-contain"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary: Date & Time */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-blue-800">📅 กำหนดการ</h4>
                {mode === 'borrow' ? (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">วันที่รับ:</span>
                            <span className="font-medium text-blue-900">{formatThaiDateShort(today)} (วันนี้)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">วันที่คืน:</span>
                            <span className="font-medium text-blue-900">{formatThaiDateShort(endDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">⏰ เวลาคืน:</span>
                            <span className="font-bold text-lg text-blue-900">{returnTime} น.</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">วันที่รับ:</span>
                            <span className="font-medium text-blue-900">{formatThaiDateShort(reserveStartDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">เวลารับ:</span>
                            <span className="font-medium text-blue-900">{reservePickupTime} น.</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">วันที่คืน:</span>
                            <span className="font-medium text-blue-900">{formatThaiDateShort(reserveEndDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">⏰ เวลาคืน:</span>
                            <span className="font-bold text-lg text-blue-900">{reserveReturnTime} น.</span>
                        </div>
                    </>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-colors ${
                        mode === 'borrow'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                    } disabled:opacity-60`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังส่งคำขอ...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            ยืนยัน {mode === 'borrow' ? 'ส่งคำขอยืม' : 'ส่งคำขอจอง'}
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                    ย้อนกลับแก้ไข
                </button>
            </div>
        </div>
    )
}
