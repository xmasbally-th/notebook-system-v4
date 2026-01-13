'use client'

import { useCart } from './CartContext'
import { ShoppingCart } from 'lucide-react'

interface CartButtonProps {
    onClick: () => void
}

export default function CartButton({ onClick }: CartButtonProps) {
    const { itemCount, maxItems } = useCart()

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-105"
        >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">รายการที่เลือก</span>
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-white text-blue-600 text-sm font-bold rounded-full">
                {itemCount}/{maxItems}
            </span>
        </button>
    )
}
