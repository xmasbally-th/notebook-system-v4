'use client'

import { useEquipment } from '@/hooks/useEquipment'
import { useRecentlyBorrowed, isRecentlyBorrowed, sortByRecentlyBorrowed } from '@/hooks/useRecentlyBorrowed'
import { useState, useMemo, useEffect } from 'react'
import { Database } from '@/supabase/types'
import { Search, X, Package, Plus, Check, Clock, CheckCircle, Users, Wrench, ArrowRight } from 'lucide-react'
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
    const { data: equipment, isLoading, error } = useEquipment()
    const { data: recentlyBorrowed = [] } = useRecentlyBorrowed()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Convert equipmentTypes from array to map for easier lookup if needed, 
    // but here we just need to know valid type IDs if we want to validate (optional)

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTypeId, setSelectedTypeId] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')

    const [isCartOpen, setIsCartOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Sync state with URL params on mount
    useEffect(() => {
        const typeParam = searchParams.get('type')
        const searchParam = searchParams.get('search')
        const statusParam = searchParams.get('status')

        if (typeParam) setSelectedTypeId(typeParam)
        if (searchParam) setSearchTerm(searchParam)
        if (statusParam) setSelectedStatus(statusParam)
    }, [searchParams])

    // Update URL when filters change (optional but good for UX so user can bookmark/share)
    // For now we just read from URL on mount, but let's also update URL when state changes
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (selectedTypeId !== 'all') params.set('type', selectedTypeId)
        if (selectedStatus !== 'all') params.set('status', selectedStatus)

        // Use replace to avoid filling browser history with every keystroke
        // Debounce logic for search term could be added here if needed
        const queryString = params.toString()
        if (queryString !== searchParams.toString()) {
            // Only push if different to avoid loop if we add dependency on searchParams
        }
    }, [searchTerm, selectedTypeId, selectedStatus])

    const { isInCart, addItem, removeItem, isAtLimit } = useCart()

    // Filter logic
    const filteredItems = useMemo(() => {
        if (!equipment) return []

        let items = (equipment as Equipment[]).filter(item => {
            // Search filter - ค้นหาชื่อ, หมายเลขครุภัณฑ์, ยี่ห้อ, รุ่น
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchLower) ||
                item.equipment_number.toLowerCase().includes(searchLower) ||
                (item.brand || '').toLowerCase().includes(searchLower) ||
                (item.model || '').toLowerCase().includes(searchLower)

            // Type filter
            const matchesType = selectedTypeId === 'all' || item.equipment_type_id === selectedTypeId

            // Status filter
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

            return matchesSearch && matchesType && matchesStatus
        })

        // Sort by recently borrowed first
        return sortByRecentlyBorrowed(items, recentlyBorrowed)
    }, [equipment, searchTerm, selectedTypeId, selectedStatus, recentlyBorrowed])

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedTypeId, selectedStatus])

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedTypeId('all')
        setSelectedStatus('all')
        setCurrentPage(1)
        router.replace('/equipment') // Clear URL params
    }

    const hasActiveFilters = searchTerm || selectedTypeId !== 'all' || selectedStatus !== 'all'

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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
                <div className="bg-white rounded-xl border border-gray-200 animate-pulse h-96" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-red-50 rounded-xl">
                <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header & Filters */}
                <div className="p-4 border-b border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">รายการอุปกรณ์</h2>
                        {hasActiveFilters && (
                            <span className="text-sm text-gray-500">
                                พบ <span className="font-semibold text-gray-900">{filteredItems.length}</span> รายการ
                            </span>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, หมายเลขครุภัณฑ์, ยี่ห้อ..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                            value={selectedTypeId}
                            onChange={(e) => setSelectedTypeId(e.target.value)}
                        >
                            <option value="all">ทุกประเภท</option>
                            {equipmentTypes?.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="ready">พร้อมให้ยืม</option>
                            <option value="borrowed">กำลังถูกยืม</option>
                            <option value="maintenance">ซ่อมบำรุง</option>
                        </select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                                ล้าง
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading & Empty States */}
                {paginatedItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่พบอุปกรณ์ที่ค้นหา</p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-blue-600 hover:underline text-sm mt-2"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
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
                                                        <Link
                                                            href={`/equipment/${item.id}`}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="ดูรายละเอียด"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden p-4 space-y-3">
                            {paginatedItems.map((item) => {
                                const images = Array.isArray(item.images) ? item.images : []
                                const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/100x100?text=No+Image'
                                const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ready
                                const StatusIcon = statusConfig.icon
                                const inCart = isInCart(item.id)
                                const isRecent = isRecentlyBorrowed(item.id, recentlyBorrowed)

                                return (
                                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            {/* Image */}
                                            <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                                <img
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    className="h-16 w-16 object-cover"
                                                />
                                            </div>

                                            {/* Info */}
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

                                                {/* Details */}
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    {(item.brand || item.model) && (
                                                        <span>{item.brand} {item.model}</span>
                                                    )}
                                                </div>

                                                {/* Actions */}
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
                                                    <Link
                                                        href={`/equipment/${item.id}`}
                                                        className="flex items-center justify-center px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {filteredItems.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            </div>

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
