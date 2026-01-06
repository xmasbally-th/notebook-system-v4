'use client'

import { useEquipment } from '@/hooks/useEquipment'
import { usePagination } from '@/hooks/usePagination'
import { useState, useMemo } from 'react'
import EquipmentCardWithBorrow from './EquipmentCardWithBorrow'
import { Database } from '@/supabase/types'
import { Search, Filter, X, Package } from 'lucide-react'

type Equipment = Database['public']['Tables']['equipment']['Row']
type EquipmentType = {
    id: string
    name: string
    icon: string
}

interface EquipmentListWithFiltersProps {
    equipmentTypes: EquipmentType[]
}

export default function EquipmentListWithFilters({ equipmentTypes }: EquipmentListWithFiltersProps) {
    const { data: equipment, isLoading, error } = useEquipment()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTypeId, setSelectedTypeId] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')

    // Filter logic
    const filteredItems = useMemo(() => {
        if (!equipment) return []

        return (equipment as Equipment[]).filter(item => {
            // Search filter
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchLower) ||
                item.equipment_number.toLowerCase().includes(searchLower) ||
                (item.brand || '').toLowerCase().includes(searchLower) ||
                (item.model || '').toLowerCase().includes(searchLower)

            // Type filter
            const matchesType = selectedTypeId === 'all' || item.equipment_type_id === selectedTypeId

            // Status filter (only show active/ready by default for borrowing)
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

            return matchesSearch && matchesType && matchesStatus
        })
    }, [equipment, searchTerm, selectedTypeId, selectedStatus])

    const {
        paginatedItems,
        currentPage,
        totalPages,
        nextPage,
        previousPage,
        resetPage,
        goToPage
    } = usePagination(filteredItems, 5)

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedTypeId('all')
        setSelectedStatus('all')
        resetPage()
    }

    const hasActiveFilters = searchTerm || selectedTypeId !== 'all' || selectedStatus !== 'all'

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Filter Skeleton */}
                <div className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
                    ))}
                </div>
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
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาอุปกรณ์..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); resetPage() }}
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-3">
                        {/* Type Filter */}
                        <select
                            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            value={selectedTypeId}
                            onChange={(e) => { setSelectedTypeId(e.target.value); resetPage() }}
                        >
                            <option value="all">ทุกประเภท</option>
                            {equipmentTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); resetPage() }}
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
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            พบ <span className="font-semibold text-gray-900">{filteredItems.length}</span> รายการ
                        </p>
                    </div>
                )}
            </div>

            {/* Equipment Type Pills (Quick Filter) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => { setSelectedTypeId('all'); resetPage() }}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTypeId === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                >
                    ทั้งหมด
                </button>
                {equipmentTypes.map(type => (
                    <button
                        key={type.id}
                        onClick={() => { setSelectedTypeId(type.id); resetPage() }}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${selectedTypeId === type.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                    >
                        <span>{type.icon}</span>
                        {type.name}
                    </button>
                ))}
            </div>

            {/* Equipment Grid */}
            {paginatedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                    <Package className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500">ไม่พบอุปกรณ์</p>
                    <p className="text-sm text-gray-400 mt-1">ลองปรับตัวกรองหรือคำค้นหา</p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            ล้างตัวกรองทั้งหมด
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedItems.map((item) => (
                        <EquipmentCardWithBorrow key={item.id} item={item} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        หน้า {currentPage} จาก {totalPages} ({filteredItems.length} รายการ)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={previousPage}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ก่อนหน้า
                        </button>

                        {/* Page Numbers */}
                        <div className="hidden sm:flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => goToPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
