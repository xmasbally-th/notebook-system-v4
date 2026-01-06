'use client'

import { Database } from '@/supabase/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'

type Equipment = Database['public']['Tables']['equipment']['Row']

interface EquipmentCardWithBorrowProps {
    item: Equipment
}

const statusConfig: Record<string, { label: string; color: string; canBorrow: boolean }> = {
    ready: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700 border-green-200', canBorrow: true },
    borrowed: { label: 'กำลังถูกยืม', color: 'bg-orange-100 text-orange-700 border-orange-200', canBorrow: false },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', canBorrow: false },
    retired: { label: 'ปลดระวาง', color: 'bg-gray-100 text-gray-600 border-gray-200', canBorrow: false },
}

export default function EquipmentCardWithBorrow({ item }: EquipmentCardWithBorrowProps) {
    // Defensive: ensure images is an array
    const images = Array.isArray(item.images) ? item.images : []
    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/600x400?text=No+Image'

    // Defensive: category parsing
    const category = (item.category as any) || {}
    const categoryName = category.name || 'ไม่ระบุประเภท'
    const categoryIcon = category.icon || '📦'

    // Status config
    const status = statusConfig[item.status] || statusConfig.ready

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            {/* Image Area - Thumbnail */}
            <Link href={`/equipment/${item.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
                {/* Status Badge */}
                <div className="absolute right-2 top-2">
                    <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
                        status.color
                    )}>
                        {status.label}
                    </span>
                </div>
            </Link>

            {/* Content Area */}
            <div className="flex flex-1 flex-col p-3">
                {/* Name & Number */}
                <Link href={`/equipment/${item.id}`}>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.name}
                    </h3>
                </Link>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {item.equipment_number}
                </p>

                {/* Action Area */}
                <div className="mt-auto pt-4 flex gap-2">
                    {status.canBorrow ? (
                        <Link
                            href={`/equipment/${item.id}#borrow-form`}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Package className="w-4 h-4" />
                            ยืมอุปกรณ์
                        </Link>
                    ) : (
                        <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed text-sm"
                        >
                            <Package className="w-4 h-4" />
                            ไม่สามารถยืมได้
                        </button>
                    )}
                    <Link
                        href={`/equipment/${item.id}`}
                        className="flex items-center justify-center px-3 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        title="ดูรายละเอียด"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
