'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Check, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/supabase/types'
import { STATUS_CONFIG } from './equipment-status'

type Equipment = Database['public']['Tables']['equipment']['Row']

interface EquipmentGridCardProps {
    item: Equipment
    inCart: boolean
    isAtLimit: boolean
    isUnavailable: boolean
    isRecent: boolean
    onCartToggle: (item: Equipment, imageUrl: string) => void
}

function EquipmentGridCardComponent({
    item,
    inCart,
    isAtLimit,
    isUnavailable,
    isRecent,
    onCartToggle
}: EquipmentGridCardProps) {
    const images = Array.isArray(item.images) ? item.images : []
    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/100x100?text=No+Image'
    const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ready
    const StatusIcon = statusConfig.icon

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-start gap-3">
                <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                    <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/equipment/${item.id}`}
                                    className="font-medium text-gray-900 truncate hover:text-blue-600 text-sm"
                                >
                                    {item.name}
                                </Link>
                                {isRecent && (
                                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                        </div>
                        <span className={cn(
                            "flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                            statusConfig.color
                        )}>
                            <StatusIcon className="w-3 h-3" />
                        </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {(item.brand || item.model) && (
                            <span>{item.brand} {item.model}</span>
                        )}
                    </div>
                    <div className="mt-3 flex gap-2">
                        {!isUnavailable ? (
                            <button
                                type="button"
                                onClick={() => onCartToggle(item, imageUrl)}
                                disabled={!inCart && isAtLimit}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    inCart
                                        ? "bg-green-600 text-white"
                                        : isAtLimit
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                )}
                            >
                                {inCart ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        เลือกแล้ว
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        เลือก
                                    </>
                                )}
                            </button>
                        ) : (
                            <span className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-50 text-orange-500 rounded-lg text-sm">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                ไม่พร้อมยืม
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const EquipmentGridCard = memo(EquipmentGridCardComponent)
export default EquipmentGridCard
