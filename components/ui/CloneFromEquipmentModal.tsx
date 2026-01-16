'use client'

import { useState, useMemo } from 'react'
import { X, Search, Copy, Check, Loader2, ChevronDown } from 'lucide-react'
import { useEquipmentWithImages } from '@/hooks/useEquipmentImages'

interface CloneFromEquipmentModalProps {
    isOpen: boolean
    onClose: () => void
    onClone: (imageUrls: string[]) => void
    maxSelectable?: number
    excludeEquipmentId?: string
}

interface EquipmentOption {
    id: string
    name: string
    equipmentNumber: string
    images: string[]
}

export default function CloneFromEquipmentModal({
    isOpen,
    onClose,
    onClone,
    maxSelectable = 5,
    excludeEquipmentId
}: CloneFromEquipmentModalProps) {
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption | null>(null)
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const { data: equipmentList, isLoading } = useEquipmentWithImages()

    // Filter equipment list
    const filteredEquipment = useMemo(() => {
        if (!equipmentList) return []
        return equipmentList
            .filter((eq: EquipmentOption) => eq.id !== excludeEquipmentId)
            .filter((eq: EquipmentOption) => {
                if (!searchTerm) return true
                const term = searchTerm.toLowerCase()
                return (
                    eq.name.toLowerCase().includes(term) ||
                    eq.equipmentNumber.toLowerCase().includes(term)
                )
            })
    }, [equipmentList, excludeEquipmentId, searchTerm])

    const handleSelectEquipment = (equipment: EquipmentOption) => {
        setSelectedEquipment(equipment)
        setSelectedImages(new Set(equipment.images.slice(0, maxSelectable)))
        setIsDropdownOpen(false)
        setSearchTerm('')
    }

    const toggleImage = (imageUrl: string) => {
        const newSelected = new Set(selectedImages)
        if (newSelected.has(imageUrl)) {
            newSelected.delete(imageUrl)
        } else if (newSelected.size < maxSelectable) {
            newSelected.add(imageUrl)
        }
        setSelectedImages(newSelected)
    }

    const selectAll = () => {
        if (selectedEquipment) {
            const allImages = selectedEquipment.images.slice(0, maxSelectable)
            setSelectedImages(new Set(allImages))
        }
    }

    const handleConfirm = () => {
        onClone(Array.from(selectedImages))
        setSelectedEquipment(null)
        setSelectedImages(new Set())
        onClose()
    }

    const handleClose = () => {
        setSelectedEquipment(null)
        setSelectedImages(new Set())
        setSearchTerm('')
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Copy className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                คัดลอกรูปจากอุปกรณ์อื่น
                            </h2>
                            <p className="text-sm text-gray-500">
                                เลือกอุปกรณ์เพื่อคัดลอกรูปภาพ
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Equipment Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            เลือกอุปกรณ์
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                            >
                                {selectedEquipment ? (
                                    <span className="truncate">
                                        {selectedEquipment.name} ({selectedEquipment.equipmentNumber})
                                    </span>
                                ) : (
                                    <span className="text-gray-400">
                                        -- เลือกอุปกรณ์ที่มีรูปภาพ --
                                    </span>
                                )}
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-10 max-h-60 overflow-hidden">
                                    {/* Search */}
                                    <div className="p-2 border-b border-gray-100">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="ค้นหาอุปกรณ์..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="max-h-48 overflow-y-auto">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                            </div>
                                        ) : filteredEquipment.length === 0 ? (
                                            <p className="text-center text-sm text-gray-500 py-4">
                                                ไม่พบอุปกรณ์ที่มีรูปภาพ
                                            </p>
                                        ) : (
                                            filteredEquipment.map((eq: EquipmentOption) => (
                                                <button
                                                    key={eq.id}
                                                    type="button"
                                                    onClick={() => handleSelectEquipment(eq)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                                                >
                                                    <div className="truncate">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {eq.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {eq.equipmentNumber} • {eq.images.length} รูป
                                                        </p>
                                                    </div>
                                                    {eq.images[0] && (
                                                        <img
                                                            src={eq.images[0]}
                                                            alt=""
                                                            className="w-10 h-10 rounded object-cover flex-shrink-0 ml-2"
                                                        />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Image Preview */}
                    {selectedEquipment && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    รูปภาพของอุปกรณ์นี้
                                </label>
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    เลือกทั้งหมด
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {selectedEquipment.images.map((imageUrl, index) => {
                                    const isSelected = selectedImages.has(imageUrl)
                                    const isDisabled = !isSelected && selectedImages.size >= maxSelectable

                                    return (
                                        <div
                                            key={`${imageUrl}-${index}`}
                                            onClick={() => !isDisabled && toggleImage(imageUrl)}
                                            className={`
                                                relative aspect-square rounded-lg overflow-hidden cursor-pointer
                                                border-2 transition-all
                                                ${isSelected
                                                    ? 'border-purple-500 ring-2 ring-purple-200'
                                                    : 'border-transparent hover:border-gray-300'
                                                }
                                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">
                        {selectedEquipment
                            ? `เลือกแล้ว ${selectedImages.size} / ${Math.min(selectedEquipment.images.length, maxSelectable)} รูป`
                            : 'กรุณาเลือกอุปกรณ์'}
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
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            คัดลอก {selectedImages.size > 0 ? `${selectedImages.size} รูป` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
