'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { useProfile } from '@/hooks/useProfile'

export interface CartItem {
    id: string
    name: string
    equipment_number: string
    imageUrl: string
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: CartItem) => boolean
    removeItem: (id: string) => void
    clearCart: () => void
    isInCart: (id: string) => boolean
    itemCount: number
    maxItems: number
    isAtLimit: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'equipment_cart'

interface CartProviderProps {
    children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([])
    const { data: config } = useSystemConfig()
    const { data: profile } = useProfile()

    // Determine max items based on user type
    const getMaxItems = useCallback(() => {
        if (!config?.loan_limits_by_type || !profile?.user_type) {
            return 3 // Default
        }
        const limits = config.loan_limits_by_type as Record<string, { max_items: number }>
        return limits[profile.user_type]?.max_items || 3
    }, [config, profile])

    const maxItems = getMaxItems()

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) {
                    setItems(parsed)
                }
            }
        } catch (e) {
            console.error('[CartContext] Failed to load cart from storage:', e)
        }
    }, [])

    // Save cart to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
        } catch (e) {
            console.error('[CartContext] Failed to save cart to storage:', e)
        }
    }, [items])

    const addItem = useCallback((item: CartItem): boolean => {
        if (items.length >= maxItems) {
            return false
        }
        if (items.some(i => i.id === item.id)) {
            return false // Already in cart
        }
        setItems(prev => [...prev, item])
        return true
    }, [items, maxItems])

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }, [])

    const clearCart = useCallback(() => {
        setItems([])
    }, [])

    const isInCart = useCallback((id: string) => {
        return items.some(item => item.id === id)
    }, [items])

    const value: CartContextType = {
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        itemCount: items.length,
        maxItems,
        isAtLimit: items.length >= maxItems,
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
