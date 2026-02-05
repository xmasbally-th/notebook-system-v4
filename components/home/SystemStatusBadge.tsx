'use client'

import { useSystemConfig } from '@/hooks/useSystemConfig'

export default function SystemStatusBadge() {
    const { data: config, isLoading } = useSystemConfig()

    if (isLoading) return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-4 animate-pulse">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            กำลังตรวจสอบสถานะ...
        </div>
    )

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    const isClosedDay = (config?.closed_days as string[])?.includes(currentDay)
    const isBeforeOpen = currentTime < (config?.opening_time || '08:30')
    const isAfterClose = currentTime > (config?.closing_time || '16:30')
    const isLunchBreak = currentTime >= (config?.break_start_time || '12:00') && currentTime < (config?.break_end_time || '13:00')

    let status = { text: 'ระบบพร้อมให้บริการ', color: 'bg-green-400', subText: '' }

    if (isClosedDay) {
        status = { text: 'ระบบปิดทำการ (วันหยุด)', color: 'bg-red-400', subText: 'เปิดทำการวันจันทร์' }
    } else if (isBeforeOpen || isAfterClose) {
        status = { text: 'ระบบปิดทำการ (นอกเวลา)', color: 'bg-red-400', subText: `เปิดเวลา ${config?.opening_time?.slice(0, 5)} น.` }
    } else if (isLunchBreak) {
        status = { text: 'พักกลางวัน', color: 'bg-orange-400', subText: `เปิดเวลา ${config?.break_end_time?.slice(0, 5)} น.` }
    }

    return (
        <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${status.color}`}></span>
                {status.text}
            </div>
            {status.subText && (
                <span className="text-xs text-blue-200 mb-4 font-light">{status.subText}</span>
            )}
        </div>
    )
}
