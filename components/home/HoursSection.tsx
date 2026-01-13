'use client'

import React from 'react'
import { Clock, CalendarOff, Coffee } from 'lucide-react'
import { useSystemConfig } from '@/hooks/useSystemConfig'

export default function HoursSection() {
    const { data: config, isLoading } = useSystemConfig()

    // Format time string HH:mm:ss -> HH:mm
    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return '09:00'
        return timeStr.slice(0, 5)
    }

    // Get closed days from config
    const getClosedDaysText = () => {
        const closedDays = config?.closed_days as string[] | null
        if (closedDays && closedDays.length > 0) {
            const dayLabels: Record<string, string> = {
                'sunday': 'อาทิตย์',
                'monday': 'จันทร์',
                'tuesday': 'อังคาร',
                'wednesday': 'พุธ',
                'thursday': 'พฤหัสบดี',
                'friday': 'ศุกร์',
                'saturday': 'เสาร์'
            }
            return closedDays.map(d => dayLabels[d] || d).join(', ')
        }
        return 'เสาร์-อาทิตย์'
    }

    return (
        <section className="py-16 bg-blue-50 border-t border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white rounded-2xl p-8 shadow-sm border border-blue-100">

                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            เวลาทำการ
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">เปิดให้บริการ</h2>
                        <p className="text-gray-600 max-w-md">
                            สามารถมารับ-คืนอุปกรณ์ได้ในเวลาทำการ กรุณานัดหมายล่วงหน้า
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                        {/* Daily Hours */}
                        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg min-w-[200px] text-center">
                            <div className="flex items-center justify-center gap-2 text-blue-100 font-medium mb-1">
                                <Clock className="w-4 h-4" />
                                <span>เวลาทำการ</span>
                            </div>
                            {isLoading ? (
                                <div className="h-8 w-24 bg-blue-500/50 animate-pulse mx-auto rounded"></div>
                            ) : (
                                <p className="text-2xl font-bold tracking-tight">
                                    {formatTime(config?.opening_time)} - {formatTime(config?.closing_time)}
                                </p>
                            )}
                            <p className="text-sm text-blue-200 mt-1">จันทร์ - ศุกร์</p>
                        </div>

                        {/* Lunch Break */}
                        <div className="bg-orange-500 text-white p-6 rounded-xl shadow-lg min-w-[200px] text-center">
                            <div className="flex items-center justify-center gap-2 text-orange-100 font-medium mb-1">
                                <Coffee className="w-4 h-4" />
                                <span>พักกลางวัน</span>
                            </div>
                            {isLoading ? (
                                <div className="h-8 w-24 bg-orange-400/50 animate-pulse mx-auto rounded"></div>
                            ) : (
                                <p className="text-2xl font-bold tracking-tight">
                                    {formatTime(config?.break_start_time)} - {formatTime(config?.break_end_time)}
                                </p>
                            )}
                            <p className="text-sm text-orange-200 mt-1">ปิดให้บริการชั่วคราว</p>
                        </div>

                        {/* Closed Days */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 min-w-[200px] flex flex-col items-center justify-center text-center">
                            <CalendarOff className="w-8 h-8 text-gray-400 mb-2" />
                            <h3 className="text-gray-900 font-semibold">วันหยุด</h3>
                            <p className="text-sm text-gray-500">{getClosedDaysText()}</p>
                            <p className="text-xs text-gray-400 mt-1">และวันหยุดนักขัตฤกษ์</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
