'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import { Trash2, AlertTriangle } from 'lucide-react'
import { CartItem } from './CartContext'

interface CartDrawerItemProps {
    item: CartItem
    isUnavailable: boolean
    onRemove: (id: string) => void
}

function CartDrawerItemComponent({ item, isUnavailable, onRemove }: CartDrawerItemProps) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isUnavailable ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
            }`}
        >
            <div
                className={`w-16 h-16 rounded-lg bg-white relative flex-shrink-0 overflow-hidden ${
                    isUnavailable ? 'opacity-50' : ''
                }`}
            >
                <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-contain"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate ${isUnavailable ? 'text-red-700' : 'text-gray-900'}`}>
                    {item.name}
                </h4>
                <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                {isUnavailable && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        ไม่พร้อมให้ยืม / ถูกยืมแล้ว
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="นำออกจากรายการ"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}

export const CartDrawerItem = memo(CartDrawerItemComponent)
export default CartDrawerItem
