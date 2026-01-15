'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalItems: number
    pageSize: number
    pageSizeOptions?: number[]
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
}

export default function Pagination({
    currentPage,
    totalItems,
    pageSize,
    pageSizeOptions = [10, 25, 50, 100],
    onPageChange,
    onPageSizeChange,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1)
        }
    }

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1)
        }
    }

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value, 10)
        onPageSizeChange(newSize)
        onPageChange(1) // Reset to first page
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>แสดง</span>
                <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
                <span>รายการต่อหน้า</span>
            </div>

            {/* Page Info & Navigation */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    {startItem}-{endItem} จาก {totalItems} รายการ
                </span>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="หน้าก่อนหน้า"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
                        หน้า {currentPage} / {totalPages || 1}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage >= totalPages}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="หน้าถัดไป"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
