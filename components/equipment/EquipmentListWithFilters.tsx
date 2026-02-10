'use client'

import { useEquipment } from '@/hooks/useEquipment'
import { useRecentlyBorrowed, isRecentlyBorrowed, sortByRecentlyBorrowed } from '@/hooks/useRecentlyBorrowed'
import { useState, useMemo, useEffect } from 'react'
import { Database } from '@/supabase/types'
import { Search, X, Package, Plus, Check, Clock, CheckCircle, Users, Wrench } from 'lucide-react'
import { CartProvider, useCart } from '@/components/cart/CartContext'
import CartButton from '@/components/cart/CartButton'
import CartDrawer from '@/components/cart/CartDrawer'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'

type Equipment = Database['public']['Tables']['equipment']['Row']
type EquipmentType = {
    id: string
    name: string
    icon: string
}

interface EquipmentListWithFiltersProps {
    equipmentTypes: EquipmentType[]
}

const STATUS_CONFIG = {
    ready: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700', icon: CheckCircle, canBorrow: true },
    active: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700', icon: CheckCircle, canBorrow: true },
    borrowed: { label: 'กำลังถูกยืม', color: 'bg-orange-100 text-orange-700', icon: Users, canBorrow: false },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700', icon: Wrench, canBorrow: false },
    retired: { label: 'เลิกใช้งาน', color: 'bg-gray-100 text-gray-600', icon: Package, canBorrow: false },
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
    const shouldFetch = !!(selectedTypeId || debouncedSearch)

    // Fetch Data
    const { data: equipment, isLoading, error } = useEquipment(null, {
        typeId: selectedTypeId,
        search: debouncedSearch,
        enabled: shouldFetch
    })

    const { data: recentlyBorrowed = [] } = useRecentlyBorrowed()
    const { isInCart, addItem, removeItem, isAtLimit } = useCart()

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (selectedTypeId) params.set('type', selectedTypeId)
        if (selectedStatus !== 'all') params.set('status', selectedStatus)

        const queryString = params.toString()
        if (queryString !== searchParams.toString()) {
            // Use replace to update URL without adding history entry for every char
            // But we only update when debouncedSearch changes, so push is fine? 
            // Actually better to replace for filters.
            router.replace(`/equipment?${queryString}`, { scroll: false })
        }
    }, [debouncedSearch, selectedTypeId, selectedStatus, router, searchParams])


    // Filter logic (status and sorting)
    const filteredItems = useMemo(() => {
        if (!equipment) return []

        let items = (equipment as Equipment[])

        // Status filter (Client-side for now)
        if (selectedStatus !== 'all') {
            items = items.filter(item => item.status === selectedStatus)
        }

        // Sort by recently borrowed first
        return sortByRecentlyBorrowed(items, recentlyBorrowed)
    }, [equipment, selectedStatus, recentlyBorrowed])

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch, selectedTypeId, selectedStatus])

    const clearFilters = () => {
        setSearchTerm('')
        setDebouncedSearch('')
        setSelectedTypeId(null)
        setSelectedStatus('all')
        setCurrentPage(1)
        router.replace('/equipment')
    }

    const handleCartToggle = (item: Equipment, imageUrl: string) => {
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
    }

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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4 z-10">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                        {/* Type Selector */}
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            value={selectedTypeId || ''}
                            onChange={(e) => {
                                const val = e.target.value
                                setSelectedTypeId(val === 'all' ? null : val)
                            }}
                        >
                            <option value="all">ทั้งหมด</option>
                            {equipmentTypes?.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Selector */}
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="ready">พร้อมให้ยืม</option>
                            <option value="borrowed">กำลังถูกยืม</option>
                            <option value="maintenance">ซ่อมบำรุง</option>
                        </select>

                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg whitespace-nowrap font-medium transition-colors"
                        >
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between px-2">
                <h3 className="font-medium text-gray-700">
                    {filteredItems.length > 0
                        ? `พบ ${filteredItems.length} รายการ`
                        : 'ไม่พบรายการที่ค้นหา'
                    }
                </h3>
            </div>

            {/* List/Table */}
            {filteredItems.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">ไม่พบอุปกรณ์ที่คุณค้นหา</p>
                    <button
                        onClick={clearFilters}
                        className="text-blue-600 hover:underline text-sm mt-2"
                    >
                        กลับไปเลือกหมวดหมู่
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table (Reuse existing structure) */}
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
                                    const images = Array.isArray(item.images) ? item.images : []
                                    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/100x100?text=No+Image'
                                    const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ready
                                    const StatusIcon = statusConfig.icon
                                    const inCart = isInCart(item.id)
                                    const isRecent = isRecentlyBorrowed(item.id, recentlyBorrowed)

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.name}
                                                            className="h-12 w-12 object-cover"
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
                                                    {statusConfig.canBorrow ? (
                                                        <button
                                                            onClick={() => handleCartToggle(item, imageUrl)}
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
                                                        <span className="text-sm text-gray-400">ไม่พร้อมยืม</span>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards (Reuse existing structure) */}
                    <div className="lg:hidden space-y-3">
                        {paginatedItems.map((item) => {
                            const images = Array.isArray(item.images) ? item.images : []
                            const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/100x100?text=No+Image'
                            const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ready
                            const StatusIcon = statusConfig.icon
                            const inCart = isInCart(item.id)
                            const isRecent = isRecentlyBorrowed(item.id, recentlyBorrowed)

                            return (
                                <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={imageUrl}
                                                alt={item.name}
                                                className="h-16 w-16 object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/equipment/${item.id}`} className="font-medium text-gray-900 truncate hover:text-blue-600">
                                                            {item.name}
                                                        </Link>
                                                        {isRecent && (
                                                            <Clock className="w-4 h-4 text-blue-600" />
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
                                                {statusConfig.canBorrow ? (
                                                    <button
                                                        onClick={() => handleCartToggle(item, imageUrl)}
                                                        disabled={!inCart && isAtLimit}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                            inCart
                                                                ? "bg-green-600 text-white"
                                                                : isAtLimit
                                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    : "bg-blue-600 text-white"
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
                                                    <span className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">
                                                        ไม่พร้อมยืม
                                                    </span>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Pagination (Reuse existing structure) */}
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
                        <span>รายการ | {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} จาก {filteredItems.length}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
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
