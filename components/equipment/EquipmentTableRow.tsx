'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Check, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/supabase/types'
import { STATUS_CONFIG } from './equipment-status'

type Equipment = Database['public']['Tables']['equipment']['Row']

interface EquipmentTableRowProps {
    item: Equipment
    inCart: boolean
    isAtLimit: boolean
    isUnavailable: boolean
    isRecent: boolean
    onCartToggle: (item: Equipment, imageUrl: string) => void
}

function EquipmentTableRowComponent({
    item,
    inCart,
    isAtLimit,
    isUnavailable,
    isRecent,
    onCartToggle
}: EquipmentTableRowProps) {
    const images = Array.isArray(item.images) ? item.images : []
    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/100x100?text=No+Image'
    const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ready
    const StatusIcon = statusConfig.icon

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                        <Image
                            src={imageUrl}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/equipment/${item.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                            {item.name}
                        </Link>
                        {isRecent && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                                <Clock className="w-3 h-3" />
                                ยืมล่าสุด
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-gray-900 font-mono">{item.equipment_number}</span>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{item.brand || '-'}</div>
                <div className="text-xs text-gray-500">{item.model || ''}</div>
            </td>
            <td className="px-6 py-4">
                <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full",
                    statusConfig.color
                )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                    {!isUnavailable ? (
                        <button
                            type="button"
                            onClick={() => onCartToggle(item, imageUrl)}
                            disabled={!inCart && isAtLimit}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                inCart
                                    ? "bg-green-600 text-white hover:bg-green-700"
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
                        <span className="inline-flex items-center gap-1 text-sm text-orange-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            ไม่พร้อมยืม
                        </span>
                    )}
                </div>
            </td>
        </tr>
    )
}

export const EquipmentTableRow = memo(EquipmentTableRowComponent)
export default EquipmentTableRow
