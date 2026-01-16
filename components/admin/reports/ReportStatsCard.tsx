'use client'

import { LucideIcon } from 'lucide-react'

interface ReportStatsCardProps {
    label: string
    value: number | string
    icon: LucideIcon
    color: string
    bgColor: string
    textColor: string
    subValue?: string
    trend?: 'up' | 'down' | 'neutral'
    loading?: boolean
}

export default function ReportStatsCard({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
    textColor,
    subValue,
    loading = false
}: ReportStatsCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                    <p className={`text-3xl font-bold mt-1 ${textColor}`}>
                        {loading ? (
                            <span className="inline-block w-12 h-8 bg-gray-100 rounded animate-pulse"></span>
                        ) : (
                            value
                        )}
                    </p>
                    {subValue && (
                        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${textColor}`} />
                </div>
            </div>
        </div>
    )
}
