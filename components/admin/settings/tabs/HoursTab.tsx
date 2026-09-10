'use client'

import React, { useState } from 'react'
import { Clock, Coffee, CalendarX, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Database } from '@/supabase/types'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

interface HoursTabProps {
    formData: SystemConfigUpdate
    onFieldChange: (field: keyof SystemConfigUpdate, val: any) => void
    closedDates: string[]
    onAddClosedDate: (date: string) => void
    onRemoveClosedDate: (date: string) => void
    timeError?: string | null
}

export default function HoursTab({
    formData,
    onFieldChange,
    closedDates,
    onAddClosedDate,
    onRemoveClosedDate,
    timeError
}: HoursTabProps) {
    const [newClosedDate, setNewClosedDate] = useState('')

    const handleAddDate = () => {
        if (!newClosedDate) return
        onAddClosedDate(newClosedDate)
        setNewClosedDate('')
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            {timeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{timeError}</span>
                </div>
            )}

            {/* Operating Hours */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-green-50 rounded-xl">
                        <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">เวลาทำการ</h2>
                        <p className="text-sm text-gray-500">กำหนดช่วงเวลาเปิดให้บริการ</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาเปิด</label>
                        <input
                            type="time"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                            value={formData.opening_time || ''}
                            onChange={(e) => onFieldChange('opening_time', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาปิด</label>
                        <input
                            type="time"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                            value={formData.closing_time || ''}
                            onChange={(e) => onFieldChange('closing_time', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Lunch Break */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-orange-50 rounded-xl">
                        <Coffee className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">เวลาพักกลางวัน</h2>
                        <p className="text-sm text-gray-500">กำหนดช่วงเวลาพักที่ไม่ให้บริการ</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เริ่มพัก</label>
                        <input
                            type="time"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm"
                            value={formData.break_start_time || '12:00'}
                            onChange={(e) => onFieldChange('break_start_time', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">สิ้นสุดพัก</label>
                        <input
                            type="time"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm"
                            value={formData.break_end_time || '13:00'}
                            onChange={(e) => onFieldChange('break_end_time', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Closed Dates */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-red-50 rounded-xl">
                        <CalendarX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">วันปิดทำการ</h2>
                        <p className="text-sm text-gray-500">กำหนดวันหยุดที่ไม่เปิดให้ยืม/คืน/จอง</p>
                    </div>
                </div>

                {/* Add new date */}
                <div className="flex gap-2 sm:gap-3 mb-4">
                    <input
                        type="date"
                        className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                        value={newClosedDate}
                        onChange={(e) => setNewClosedDate(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleAddDate}
                        disabled={!newClosedDate}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">เพิ่ม</span>
                    </button>
                </div>

                {/* List of closed dates */}
                {closedDates.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {closedDates.map(date => (
                            <div
                                key={date}
                                className="flex items-center justify-between p-3 bg-red-50 rounded-xl group"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <CalendarX className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-red-800 truncate">
                                        {formatDate(date)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveClosedDate(date)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <CalendarX className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">ยังไม่มีวันปิดทำการ</p>
                    </div>
                )}
            </section>
        </div>
    )
}
