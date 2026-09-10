'use client'

import React from 'react'
import { BarChart3, Clock, CheckCircle, Bell } from 'lucide-react'
import type { ReservationStats } from '@/app/admin/reservations/actions'

interface ReservationStatsCardsProps {
    stats?: ReservationStats
    isLoading?: boolean
    isAdmin?: boolean
}

export default function ReservationStatsCards({
    stats = { total: 0, pending: 0, approved: 0, ready: 0, completed: 0, rejected: 0, cancelled: 0, expired: 0 },
    isLoading = false,
    isAdmin = true
}: ReservationStatsCardsProps) {
    if (isLoading) {
        return (
            <div className={`grid gap-4 mb-6 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {Array.from({ length: isAdmin ? 5 : 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse h-20" />
                ))}
            </div>
        )
    }

    return (
        <div className={`grid gap-4 mb-6 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {isAdmin && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                            <p className="text-xs text-gray-500 font-medium">ทั้งหมด</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        <p className="text-xs text-gray-500 font-medium">รออนุมัติ</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        <p className="text-xs text-gray-500 font-medium">รอรับอุปกรณ์</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                        <Bell className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-600">{stats.ready}</p>
                        <p className="text-xs text-gray-500 font-medium">พร้อมรับ</p>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
                            <p className="text-xs text-gray-500 font-medium">เสร็จสิ้น</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
