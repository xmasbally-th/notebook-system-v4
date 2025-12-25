'use client'

import { useEquipment } from '@/hooks/useEquipment'
import { usePagination } from '@/hooks/usePagination'
import { useEquipmentFilters } from '@/hooks/useEquipmentFilters'
import EquipmentCard from './EquipmentCard'

import { Database } from '@/supabase/types'

type Equipment = Database['public']['Tables']['equipment']['Row']

export default function EquipmentListContainer() {
    const { data: equipment, isLoading, error } = useEquipment()

    const {
        searchTerm,
        setSearchTerm,
        selectedStatus,
        setSelectedStatus,
        filteredItems,
        clearFilters
    } = useEquipmentFilters((equipment as Equipment[]) || [])

    const {
        paginatedItems,
        currentPage,
        totalPages,
        nextPage,
        previousPage,
        resetPage,
        goToPage
    } = usePagination(filteredItems, 9)

    if (isLoading) return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200"></div>
            ))}
        </div>
    )

    if (error) return <div className="text-red-500 text-center p-8">Failed to load equipment</div>

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search equipment..."
                        className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        className="rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                        value={selectedStatus}
                        onChange={(e) => { setSelectedStatus(e.target.value); resetPage(); }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                    </select>

                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Grid */}
            {paginatedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-24 text-center">
                    <p className="text-lg font-medium text-gray-500">No equipment found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {paginatedItems.map((item) => (
                        <EquipmentCard key={item.id} item={item} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center border-t border-gray-200 pt-6">
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={previousPage}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
