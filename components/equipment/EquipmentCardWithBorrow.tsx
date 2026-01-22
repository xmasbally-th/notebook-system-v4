'use client'

import { Database } from '@/supabase/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Package, ArrowRight, Plus, Check, Clock } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'

type Equipment = Database['public']['Tables']['equipment']['Row']

interface EquipmentCardWithBorrowProps {
    item: Equipment
    isRecentlyBorrowed?: boolean
}

const statusConfig: Record<string, { label: string; color: string; canBorrow: boolean }> = {
    ready: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700 border-green-200', canBorrow: true },
    active: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700 border-green-200', canBorrow: true }, // Legacy enum value
    borrowed: { label: 'กำลังถูกยืม', color: 'bg-orange-100 text-orange-700 border-orange-200', canBorrow: false },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', canBorrow: false },
    retired: { label: 'ปลดระวาง', color: 'bg-gray-100 text-gray-600 border-gray-200', canBorrow: false },
}

export default function EquipmentCardWithBorrow({ item, isRecentlyBorrowed = false }: EquipmentCardWithBorrowProps) {
    // Defensive: ensure images is an array
    const images = Array.isArray(item.images) ? item.images : []
    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/600x400?text=No+Image'

    // Status config
    const status = statusConfig[item.status] || statusConfig.ready

    // Cart context
    const { isInCart, addItem, removeItem, isAtLimit } = useCart()
    const inCart = isInCart(item.id)

    const handleCartToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (inCart) {
            removeItem(item.id)
        } else {
            addItem({
                id: item.id,
                name: item.name,
                equipment_number: item.equipment_number,
                imageUrl,
            })
        }
    }

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 max-w-[300px] mx-auto">
            {/* Recently Borrowed Badge */}
            {isRecentlyBorrowed && (
                <div className="absolute left-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-blue-600 text-white shadow-sm">
                        <Clock className="w-3 h-3" />
                        ยืมล่าสุด
                    </span>
                </div>
            )}

            {/* Image Area - Responsive Thumbnail (max 300x300px) */}
            <Link href={`/equipment/${item.id}`} className="relative aspect-square w-full max-h-[300px] overflow-hidden bg-gray-100">
                <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
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
            <div className="flex flex-1 flex-col p-2.5">
                {/* Name & Number */}
                <Link href={`/equipment/${item.id}`}>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.name}
                    </h3>
                </Link>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {item.equipment_number}
                </p>

                {/* Action Area */}
                <div className="mt-auto pt-3 flex gap-1.5">
                    {status.canBorrow ? (
                        <>
                            {/* Add to Cart / Remove from Cart Button */}
                            <button
                                onClick={handleCartToggle}
                                disabled={!inCart && isAtLimit}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-medium rounded-lg transition-colors text-xs",
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
                                        เลือกอุปกรณ์
                                    </>
                                )}
                            </button>
                        </>
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
                        className="flex items-center justify-center px-2.5 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        title="ดูรายละเอียด"
                    >
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
