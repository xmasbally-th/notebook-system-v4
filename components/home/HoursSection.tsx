'use client'

import React from 'react'
import { Clock, CalendarOff } from 'lucide-react'
import { useSystemConfig } from '@/hooks/useSystemConfig'

export default function HoursSection() {
    const { data: config, isLoading } = useSystemConfig()

    // Format time string HH:mm:ss -> HH:mm
    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return '09:00'
        return timeStr.slice(0, 5)
    }

    return (
        <section className="py-16 bg-blue-50 border-t border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white rounded-2xl p-8 shadow-sm border border-blue-100">

                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Operating Hours
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">When can you pick up?</h2>
                        <p className="text-gray-600 max-w-md">
                            Our staff is available to assist with pick-ups and returns during these hours. Please plan accordingly.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-6">
                        {/* Daily Hours */}
                        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg min-w-[200px] text-center">
                            <h3 className="text-blue-100 font-medium mb-1">Daily Schedule</h3>
                            {isLoading ? (
                                <div className="h-8 w-24 bg-blue-500/50 animate-pulse mx-auto rounded"></div>
                            ) : (
                                <p className="text-3xl font-bold tracking-tight">
                                    {formatTime(config?.opening_time)} - {formatTime(config?.closing_time)}
                                </p>
                            )}
                            <p className="text-sm text-blue-200 mt-2">Monday - Friday</p>
                        </div>

                        {/* Closed Days - Static for now, consistent with db default */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 min-w-[200px] flex flex-col items-center justify-center text-center">
                            <CalendarOff className="w-8 h-8 text-gray-400 mb-2" />
                            <h3 className="text-gray-900 font-semibold">Closed</h3>
                            <p className="text-sm text-gray-500">Weekends & Public Holidays</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
