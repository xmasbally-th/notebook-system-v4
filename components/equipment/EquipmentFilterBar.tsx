'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

export type EquipmentTypeOption = {
    id: string
    name: string
    icon: string
}

interface EquipmentFilterBarProps {
    searchTerm: string
    onSearchChange: (val: string) => void
    selectedTypeId: string | null
    onTypeChange: (val: string | null) => void
    selectedStatus: string
    onStatusChange: (val: string) => void
    equipmentTypes: EquipmentTypeOption[]
    onClearFilters: () => void
}

export default function EquipmentFilterBar({
    searchTerm,
    onSearchChange,
    selectedTypeId,
    onTypeChange,
    selectedStatus,
    onStatusChange,
    equipmentTypes,
    onClearFilters
}: EquipmentFilterBarProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4 z-10">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาอุปกรณ์, รหัสครุภัณฑ์, ยี่ห้อ..."
                        className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                    {/* Type Selector */}
                    <select
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                        value={selectedTypeId || 'all'}
                        onChange={(e) => {
                            const val = e.target.value
                            onTypeChange(val === 'all' ? null : val)
                        }}
                    >
                        <option value="all">ทั้งหมด</option>
                        {equipmentTypes?.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.icon} {type.name}
                            </option>
                        ))}
                    </select>

                    {/* Status Selector */}
                    <select
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                        value={selectedStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                    >
                        <option value="all">ทุกสถานะ</option>
                        <option value="ready">พร้อมให้ยืม</option>
                        <option value="borrowed">กำลังถูกยืม</option>
                        <option value="maintenance">ซ่อมบำรุง</option>
                    </select>

                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg whitespace-nowrap text-sm font-medium transition-colors"
                    >
                        ล้างตัวกรอง
                    </button>
                </div>
            </div>
        </div>
    )
}
