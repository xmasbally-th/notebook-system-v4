'use client'

import { useState, useMemo } from 'react'
import { X, Search, ImageIcon, Check, Loader2, Filter } from 'lucide-react'
import { useEquipmentImages, EquipmentImageItem } from '@/hooks/useEquipmentImages'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'

interface ImageLibraryModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (imageUrls: string[]) => void
    maxSelectable?: number
    currentEquipmentTypeId?: string
}

export default function ImageLibraryModal({
    isOpen,
    onClose,
    onSelect,
    maxSelectable = 5,
    currentEquipmentTypeId
}: ImageLibraryModalProps) {
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
    const [filterTypeId, setFilterTypeId] = useState<string>(currentEquipmentTypeId || '')
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce search
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        const timer = setTimeout(() => setDebouncedSearch(value), 300)
        return () => clearTimeout(timer)
    }

    const { data: images, isLoading } = useEquipmentImages({
        filterByTypeId: filterTypeId || undefined,
        searchTerm: debouncedSearch || undefined
    })

    const { data: equipmentTypes } = useEquipmentTypes()
    const activeTypes = useMemo(() =>
        Array.isArray(equipmentTypes)
            ? equipmentTypes.filter((t: any) => t.is_active)
            : [],
        [equipmentTypes]
    )

    const toggleImage = (imageUrl: string) => {
        const newSelected = new Set(selectedImages)
        if (newSelected.has(imageUrl)) {
            newSelected.delete(imageUrl)
        } else if (newSelected.size < maxSelectable) {
            newSelected.add(imageUrl)
        }
        setSelectedImages(newSelected)
    }

    const handleConfirm = () => {
        onSelect(Array.from(selectedImages))
        setSelectedImages(new Set())
        onClose()
    }

    const handleClose = () => {
        setSelectedImages(new Set())
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                คลังรูปภาพอุปกรณ์
                            </h2>
                            <p className="text-sm text-gray-500">
                                เลือกรูปภาพจากอุปกรณ์ที่มีอยู่ในระบบ
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3">
                    {/* Type Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filterTypeId}
                            onChange={(e) => setFilterTypeId(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
                        >
                            <option value="">ทุกประเภท</option>
                            {activeTypes.map((type: any) => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อหรือหมายเลขอุปกรณ์..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-sm">กำลังโหลดรูปภาพ...</p>
                        </div>
                    ) : !images || images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">ไม่พบรูปภาพในระบบ</p>
                            <p className="text-xs text-gray-400 mt-1">
                                ลองปรับเงื่อนไขการค้นหา
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {images.map((item: EquipmentImageItem, index: number) => {
                                const isSelected = selectedImages.has(item.imageUrl)
                                const isDisabled = !isSelected && selectedImages.size >= maxSelectable

                                return (
                                    <div
                                        key={`${item.imageUrl}-${index}`}
                                        onClick={() => !isDisabled && toggleImage(item.imageUrl)}
                                        className={`
                                            relative aspect-square rounded-lg overflow-hidden cursor-pointer
                                            border-2 transition-all group
                                            ${isSelected
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-transparent hover:border-gray-300'
                                            }
                                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <img
                                            src={item.imageUrl}
                                            alt={item.equipmentName}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Selection indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        {/* Hover info */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs text-white font-medium truncate">
                                                {item.equipmentName}
                                            </p>
                                            <p className="text-xs text-white/70 truncate">
                                                {item.equipmentNumber}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">
                        เลือกแล้ว {selectedImages.size} / {maxSelectable} รูป
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedImages.size === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            เลือก {selectedImages.size > 0 ? `${selectedImages.size} รูป` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
