'use client'

import React, { useState, useMemo, useEffect, useCallback, startTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { Search, Package } from 'lucide-react'
import { useEquipment } from '@/hooks/useEquipment'
import { useRecentlyBorrowed, isRecentlyBorrowed, sortByRecentlyBorrowed } from '@/hooks/useRecentlyBorrowed'
import { Database } from '@/supabase/types'
import { supabase } from '@/lib/supabase/client'
import { CartProvider, useCart } from '@/components/cart/CartContext'
import CartButton from '@/components/cart/CartButton'
import EquipmentFilterBar from './EquipmentFilterBar'
import EquipmentTableRow from './EquipmentTableRow'
import EquipmentGridCard from './EquipmentGridCard'

// Dynamic import: CartDrawer loaded only when user opens it
const CartDrawer = dynamic(
    () => import('@/components/cart/CartDrawer'),
    { ssr: false }
)

type Equipment = Database['public']['Tables']['equipment']['Row']
type EquipmentType = {
    id: string
    name: string
    icon: string
}

interface EquipmentListWithFiltersProps {
    equipmentTypes: EquipmentType[]
}

function EquipmentListContent({ equipmentTypes }: EquipmentListWithFiltersProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    // State
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Sync state with URL params on mount
    useEffect(() => {
        const typeParam = searchParams.get('type')
        const searchParam = searchParams.get('search')
        const statusParam = searchParams.get('status')

        if (typeParam && typeParam !== 'all') setSelectedTypeId(typeParam)
        if (searchParam) {
            setSearchTerm(searchParam)
            setDebouncedSearch(searchParam)
        }
        if (statusParam) setSelectedStatus(statusParam)
    }, []) // Run only once on mount

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchTerm])

    // Determine if we should fetch data
    const shouldFetch = Boolean(selectedTypeId || debouncedSearch)

    // Fetch Data
    const { data: equipment, isLoading, error } = useEquipment(null, {
        typeId: selectedTypeId,
        search: debouncedSearch,
        enabled: shouldFetch
    })

    const { data: recentlyBorrowed = [] } = useRecentlyBorrowed()
    const { isInCart, addItem, removeItem, isAtLimit } = useCart()

    // Fast O(1) Set lookup for active loan equipment IDs
    const { data: activeLoanEquipmentIdSet = new Set<string>() } = useQuery({
        queryKey: ['active-loan-equipment-ids'],
        staleTime: 1000 * 30, // 30 seconds
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loanRequests')
                .select('equipment_id')
                .in('status', ['pending', 'approved'])
            if (error) {
                console.error('[EquipmentList] Failed to fetch active loans:', error)
                return new Set<string>()
            }
            return new Set<string>((data || []).map((d: any) => d.equipment_id as string))
        },
    })

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (selectedTypeId) params.set('type', selectedTypeId)
        if (selectedStatus !== 'all') params.set('status', selectedStatus)

        const queryString = params.toString()
        if (queryString !== searchParams.toString()) {
            router.replace(`/equipment?${queryString}`, { scroll: false })
        }
    }, [debouncedSearch, selectedTypeId, selectedStatus, router, searchParams])

    // Filter logic (status and sorting)
    const filteredItems = useMemo(() => {
        if (!equipment) return []

        let items = equipment as Equipment[]

        // Status filter
        if (selectedStatus !== 'all') {
            items = items.filter(item => {
                if (selectedStatus === 'ready') {
                    return item.status === 'ready' || item.status === 'active'
                }
                return item.status === selectedStatus
            })
        }

        // Sort by recently borrowed first
        return sortByRecentlyBorrowed(items, recentlyBorrowed)
    }, [equipment, selectedStatus, recentlyBorrowed])

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const paginatedItems = useMemo(() => {
        return filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    }, [filteredItems, currentPage, pageSize])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch, selectedTypeId, selectedStatus])

    const clearFilters = useCallback(() => {
        startTransition(() => {
            setSearchTerm('')
            setDebouncedSearch('')
            setSelectedTypeId(null)
            setSelectedStatus('all')
            setCurrentPage(1)
        })
        router.replace('/equipment')
    }, [router])

    const handleCartToggle = useCallback((item: Equipment, imageUrl: string) => {
        if (isInCart(item.id)) {
            removeItem(item.id)
        } else {
            addItem({
                id: item.id,
                name: item.name,
                equipment_number: item.equipment_number,
                imageUrl,
            })
        }
    }, [isInCart, removeItem, addItem])

    // View: Category Selection (when no filters active)
    if (!shouldFetch) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Search Hero */}
                <div className="text-center space-y-6 max-w-2xl mx-auto py-8">
                    <h2 className="text-2xl font-bold text-gray-900">ค้นหาพัสดุและครุภัณฑ์</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="พิมพ์ชื่ออุปกรณ์, หมายเลขครุภัณฑ์..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Category Grid */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">เลือกประเภทอุปกรณ์</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {equipmentTypes.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setSelectedTypeId(type.id)}
                                className="group flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 gap-3"
                            >
                                <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
                                    {type.icon}
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-blue-600">
                                    {type.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cart Button & Drawer */}
                <CartButton onClick={() => setIsCartOpen(true)} />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        )
    }

    // View: Loading
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex gap-4 mb-8">
                    <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
                <CartButton onClick={() => setIsCartOpen(true)} />
            </div>
        )
    }

    // View: Error
    if (error) {
        return (
            <div className="text-center py-12 bg-red-50 rounded-xl">
                <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        )
    }

    // View: Equipment List Result
    return (
        <div className="space-y-6">
            {/* Header & Filters Bar */}
            <EquipmentFilterBar
                searchTerm={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val)
                    if (!val) setDebouncedSearch('')
                }}
                selectedTypeId={selectedTypeId}
                onTypeChange={setSelectedTypeId}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                equipmentTypes={equipmentTypes}
                onClearFilters={clearFilters}
            />

            {/* Results Info */}
            <div className="flex items-center justify-between px-2">
                <h3 className="font-medium text-gray-700 text-sm">
                    {filteredItems.length > 0
                        ? `พบ ${filteredItems.length} รายการ`
                        : 'ไม่พบรายการที่ค้นหา'
                    }
                </h3>
            </div>

            {/* List / Table */}
            {filteredItems.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">ไม่พบอุปกรณ์ที่คุณค้นหา</p>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-blue-600 hover:underline text-sm mt-2"
                    >
                        กลับไปเลือกหมวดหมู่
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเลขครุภัณฑ์</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยี่ห้อ/รุ่น</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เลือก</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedItems.map((item) => {
                                    const canBorrow = item.status === 'ready' || item.status === 'active'
                                    const isUnavailable = !canBorrow || activeLoanEquipmentIdSet.has(item.id)
                                    const inCart = isInCart(item.id)
                                    const isRecent = isRecentlyBorrowed(item.id, recentlyBorrowed)

                                    return (
                                        <EquipmentTableRow
                                            key={item.id}
                                            item={item}
                                            inCart={inCart}
                                            isAtLimit={isAtLimit}
                                            isUnavailable={isUnavailable}
                                            isRecent={isRecent}
                                            onCartToggle={handleCartToggle}
                                        />
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {paginatedItems.map((item) => {
                            const canBorrow = item.status === 'ready' || item.status === 'active'
                            const isUnavailable = !canBorrow || activeLoanEquipmentIdSet.has(item.id)
                            const inCart = isInCart(item.id)
                            const isRecent = isRecentlyBorrowed(item.id, recentlyBorrowed)

                            return (
                                <EquipmentGridCard
                                    key={item.id}
                                    item={item}
                                    inCart={inCart}
                                    isAtLimit={isAtLimit}
                                    isUnavailable={isUnavailable}
                                    isRecent={isRecent}
                                    onCartToggle={handleCartToggle}
                                />
                            )
                        })}
                    </div>
                </>
            )}

            {/* Pagination */}
            {filteredItems.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>แสดง</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>
                            รายการ | {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} จาก {filteredItems.length}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            ก่อนหน้า
                        </button>
                        <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1
                                if (totalPages > 5) {
                                    if (currentPage > 3) pageNum = currentPage - 2 + i
                                    if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Button & Drawer */}
            <CartButton onClick={() => setIsCartOpen(true)} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    )
}

// Wrapper component with CartProvider
export default function EquipmentListWithFilters({ equipmentTypes }: EquipmentListWithFiltersProps) {
    return (
        <CartProvider>
            <EquipmentListContent equipmentTypes={equipmentTypes} />
        </CartProvider>
    )
}
