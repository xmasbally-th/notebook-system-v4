'use client'

import React from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'

interface CartReserveFormProps {
    reserveStartDate: string
    onReserveStartDateChange: (val: string) => void
    reservePickupTime: string
    onReservePickupTimeChange: (val: string) => void
    reserveEndDate: string
    onReserveEndDateChange: (val: string) => void
    reserveReturnTime: string
    onReserveReturnTimeChange: (val: string) => void
    tomorrow: string
    maxAdvanceDate: string
    maxAdvanceBookingDays: number
    reserveMaxEndDate: string
    openingTime: string
    closingTime: string
}

export default function CartReserveForm({
    reserveStartDate,
    onReserveStartDateChange,
    reservePickupTime,
    onReservePickupTimeChange,
    reserveEndDate,
    onReserveEndDateChange,
    reserveReturnTime,
    onReserveReturnTimeChange,
    tomorrow,
    maxAdvanceDate,
    maxAdvanceBookingDays,
    reserveMaxEndDate,
    openingTime,
    closingTime
}: CartReserveFormProps) {
    return (
        <div className="space-y-3 pt-2">
            {/* Reserve Start Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1 text-purple-600" />
                    วันที่รับอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={reserveStartDate}
                    onChange={(e) => onReserveStartDateChange(e.target.value)}
                    min={tomorrow}
                    max={maxAdvanceDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
            </div>

            {/* Pickup Time */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1 text-purple-600" />
                    เวลารับอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                    type="time"
                    value={reservePickupTime}
                    onChange={(e) => onReservePickupTimeChange(e.target.value)}
                    min={openingTime}
                    max={closingTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
            </div>

            {/* Reserve End Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1 text-purple-600" />
                    วันที่คืนอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={reserveEndDate}
                    onChange={(e) => onReserveEndDateChange(e.target.value)}
                    min={reserveStartDate || tomorrow}
                    max={reserveMaxEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
            </div>

            {/* Return Time */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1 text-purple-600" />
                    เวลาคืนอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                    type="time"
                    value={reserveReturnTime}
                    onChange={(e) => onReserveReturnTimeChange(e.target.value)}
                    min={openingTime}
                    max={closingTime}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${
                        !reserveReturnTime ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                    }`}
                    placeholder="กรุณาเลือกเวลาคืน"
                />
                {!reserveReturnTime && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        กรุณาระบุเวลาที่จะนำอุปกรณ์มาคืน
                    </p>
                )}
            </div>

            {/* Reserve Mode Info */}
            <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                <p>📅 สามารถจองล่วงหน้าได้สูงสุด {maxAdvanceBookingDays} วัน</p>
            </div>
        </div>
    )
}
