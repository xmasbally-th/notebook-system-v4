'use client'

import { Star, MessageSquare, AlertTriangle, Archive } from 'lucide-react'
import type { EvaluationStats } from '../types'

interface EvaluationStatsCardsProps {
    stats: EvaluationStats
    mandatoryCount: number
    oldCount: number
    cutoffDate: string
    formatDateShort: (date: string) => string
}

export default function EvaluationStatsCards({
    stats,
    mandatoryCount,
    oldCount,
    cutoffDate,
    formatDateShort
}: EvaluationStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. คะแนนเฉลี่ยรวม */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl shadow-md border border-amber-400 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-amber-50/80">คะแนนเฉลี่ยรวม</p>
                    <Star className="w-5 h-5 fill-white text-white opacity-80" />
                </div>
                <div>
                    <h3 className="text-3xl font-extrabold">
                        {stats.avg > 0 ? stats.avg.toFixed(2) : '0.00'}
                        <span className="text-lg font-medium text-amber-100"> / 5</span>
                    </h3>
                </div>
            </div>

            {/* 2. ประเมินแล้ว */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-md border border-blue-400 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-50/80">ประเมินแล้ว</p>
                    <MessageSquare className="w-5 h-5 text-white opacity-80" />
                </div>
                <div>
                    <h3 className="text-3xl font-extrabold">{stats.total}</h3>
                    <p className="text-xs text-blue-100/70">{stats.comments} ข้อเสนอแนะเพิ่มเติม</p>
                </div>
            </div>

            {/* 3. รอประเมิน (บังคับ) */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-2xl shadow-md border border-orange-400 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-orange-50/80">รอประเมิน (บังคับ)</p>
                    <AlertTriangle className="w-5 h-5 text-white opacity-80" />
                </div>
                <div>
                    <h3 className="text-3xl font-extrabold">{mandatoryCount}</h3>
                    <p className="text-xs text-orange-100/70">คืนหลัง {formatDateShort(cutoffDate)}</p>
                </div>
            </div>

            {/* 4. ข้อมูลเก่า (ไม่บังคับ) */}
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-5 rounded-2xl shadow-md border border-slate-500 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-50/80">ข้อมูลเก่า (ไม่บังคับ)</p>
                    <Archive className="w-5 h-5 text-white opacity-80" />
                </div>
                <div>
                    <h3 className="text-3xl font-extrabold">{oldCount}</h3>
                    <p className="text-xs text-slate-200/70">คืนก่อน {formatDateShort(cutoffDate)}</p>
                </div>
            </div>
        </div>
    )
}
