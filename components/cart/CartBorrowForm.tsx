'use client'

import React from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'

interface CartBorrowFormProps {
    today: string
    endDate: string
    onEndDateChange: (val: string) => void
    returnTime: string
    onReturnTimeChange: (val: string) => void
    maxEndDate: string
    openingTime: string
    closingTime: string
}

export default function CartBorrowForm({
    today,
    endDate,
    onEndDateChange,
    returnTime,
    onReturnTimeChange,
    maxEndDate,
    openingTime,
    closingTime
}: CartBorrowFormProps) {
    const todayThai = new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="space-y-3 pt-2">
            {/* Start Date - Auto today */}
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>วันที่รับอุปกรณ์:</span>
                    <strong className="text-gray-900">{todayThai} (วันนี้)</strong>
                </div>
            </div>

            {/* End Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1 text-blue-600" />
                    วันที่คืนอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    min={today}
                    max={maxEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
            </div>

            {/* Return Time */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1 text-blue-600" />
                    เวลาคืนอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => onReturnTimeChange(e.target.value)}
                    min={openingTime}
                    max={closingTime}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        !returnTime ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                    }`}
                    placeholder="กรุณาเลือกเวลาคืน"
                />
                {!returnTime && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        กรุณาระบุเวลาที่จะนำอุปกรณ์มาคืน
                    </p>
                )}
            </div>
        </div>
    )
}
