'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    X,
    Loader2,
    Search,
    User,
    Package,
    Calendar,
    FileText,
    AlertTriangle,
    Check
} from 'lucide-react'
import { createSpecialLoan, checkSpecialLoanConflict } from '@/lib/specialLoans'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'

interface Props {
    onClose: () => void
    onSuccess: () => void
}

interface Profile {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    phone_number: string | null
    user_type: string
}

interface Equipment {
    id: string
    equipment_number: string
    name: string
    status: string
    equipment_type_id: string | null
    equipment_type?: {
        name: string
    }
}

interface EquipmentType {
    id: string
    name: string
    icon: string
}

export default function SpecialLoanForm({ onClose, onSuccess }: Props) {
    // Form state
    const [selectedBorrowerId, setSelectedBorrowerId] = useState('')
    const [borrowerSearch, setBorrowerSearch] = useState('')
    const [selectedTypeId, setSelectedTypeId] = useState('')
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])
    const [loanDate, setLoanDate] = useState('')
    const [returnDate, setReturnDate] = useState('')
    const [purpose, setPurpose] = useState('')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [conflictIds, setConflictIds] = useState<string[]>([])

    // Fetch lecturers
    const { data: lecturers = [] } = useQuery<Profile[]>({
        queryKey: ['lecturers'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const response = await fetch(
                `${url}/rest/v1/profiles?user_type=eq.lecturer&status=eq.approved&select=id,first_name,last_name,email,phone_number,user_type`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
            )
            if (!response.ok) return []
            return response.json()
        }
    })

    // Fetch equipment types
    const { data: equipmentTypes = [] } = useQuery<EquipmentType[]>({
        queryKey: ['equipment-types'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const response = await fetch(
                `${url}/rest/v1/equipment_types?select=id,name,icon&order=name`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
            )
            if (!response.ok) return []
            return response.json()
        }
    })

    // Fetch available equipment by type
    const { data: equipment = [], isLoading: isLoadingEquipment } = useQuery<Equipment[]>({
        queryKey: ['equipment-by-type', selectedTypeId],
        queryFn: async () => {
            if (!selectedTypeId) return []
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const response = await fetch(
                `${url}/rest/v1/equipment?equipment_type_id=eq.${selectedTypeId}&status=eq.ready&select=id,equipment_number,name,status,equipment_type_id,equipment_types(name)&order=equipment_number`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
            )
            if (!response.ok) return []
            return response.json()
        },
        enabled: !!selectedTypeId
    })

    // Filter lecturers by search
    const filteredLecturers = useMemo(() => {
        if (!borrowerSearch) return lecturers
        const query = borrowerSearch.toLowerCase()
        return lecturers.filter(l =>
            (l.first_name?.toLowerCase().includes(query)) ||
            (l.last_name?.toLowerCase().includes(query)) ||
            l.email.toLowerCase().includes(query)
        )
    }, [lecturers, borrowerSearch])

    // Selected borrower details
    const selectedBorrower = lecturers.find(l => l.id === selectedBorrowerId)
    const selectedType = equipmentTypes.find(t => t.id === selectedTypeId)

    // Check conflicts when dates change
    const checkConflicts = async () => {
        if (!loanDate || !returnDate || selectedEquipmentIds.length === 0) return

        const conflicts: string[] = []
        for (const eqId of selectedEquipmentIds) {
            const hasConflict = await checkSpecialLoanConflict(
                eqId,
                new Date(loanDate),
                new Date(returnDate)
            )
            if (hasConflict) {
                conflicts.push(eqId)
            }
        }
        setConflictIds(conflicts)
    }

    // Toggle equipment selection
    const toggleEquipment = (id: string) => {
        setSelectedEquipmentIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    // Select all equipment
    const selectAll = () => {
        setSelectedEquipmentIds(equipment.map(e => e.id))
    }

    // Deselect all
    const deselectAll = () => {
        setSelectedEquipmentIds([])
    }

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!selectedBorrowerId || !selectedTypeId || selectedEquipmentIds.length === 0 || !loanDate || !returnDate || !purpose) {
            setError('กรุณากรอกข้อมูลให้ครบถ้วน')
            return
        }

        if (new Date(returnDate) < new Date(loanDate)) {
            setError('วันที่คืนต้องไม่ก่อนวันที่ยืม')
            return
        }

        // Check for conflicts
        await checkConflicts()
        if (conflictIds.length > 0) {
            setError('มีอุปกรณ์บางรายการถูกจองหรือยืมในช่วงวันที่เลือก')
            return
        }

        setIsSubmitting(true)

        try {
            const selectedEquipment = equipment.filter(e => selectedEquipmentIds.includes(e.id))
            const result = await createSpecialLoan({
                borrowerId: selectedBorrowerId,
                borrowerName: `${selectedBorrower?.first_name || ''} ${selectedBorrower?.last_name || ''}`.trim(),
                borrowerPhone: selectedBorrower?.phone_number || undefined,
                equipmentTypeId: selectedTypeId,
                equipmentTypeName: selectedType?.name || '',
                quantity: selectedEquipmentIds.length,
                equipmentIds: selectedEquipmentIds,
                equipmentNumbers: selectedEquipment.map(e => e.equipment_number),
                loanDate,
                returnDate,
                purpose,
                notes: notes || undefined
            })

            if (result.success) {
                onSuccess()
            } else {
                setError(result.error || 'เกิดข้อผิดพลาด')
            }
        } catch (err: any) {
            setError(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">สร้างยืมพิเศษ</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Borrower Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            ผู้ยืม (อาจารย์)
                        </label>
                        {selectedBorrower ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div>
                                    <p className="font-medium text-blue-900">
                                        {selectedBorrower.first_name} {selectedBorrower.last_name}
                                    </p>
                                    <p className="text-sm text-blue-600">{selectedBorrower.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedBorrowerId('')}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    เปลี่ยน
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาอาจารย์..."
                                        value={borrowerSearch}
                                        onChange={(e) => setBorrowerSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {filteredLecturers.map(lecturer => (
                                        <button
                                            key={lecturer.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedBorrowerId(lecturer.id)
                                                setBorrowerSearch('')
                                            }}
                                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                        >
                                            <p className="font-medium">{lecturer.first_name} {lecturer.last_name}</p>
                                            <p className="text-sm text-gray-500">{lecturer.email}</p>
                                        </button>
                                    ))}
                                    {filteredLecturers.length === 0 && (
                                        <p className="p-3 text-center text-gray-500 text-sm">ไม่พบอาจารย์</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Equipment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Package className="w-4 h-4 inline mr-1" />
                            ประเภทอุปกรณ์
                        </label>
                        <select
                            value={selectedTypeId}
                            onChange={(e) => {
                                setSelectedTypeId(e.target.value)
                                setSelectedEquipmentIds([])
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">เลือกประเภท</option>
                            {equipmentTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Equipment Selection */}
                    {selectedTypeId && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    เลือกอุปกรณ์ ({selectedEquipmentIds.length} / {equipment.length})
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        เลือกทั้งหมด
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAll}
                                        className="text-xs text-gray-500 hover:underline"
                                    >
                                        ยกเลิกทั้งหมด
                                    </button>
                                </div>
                            </div>
                            {isLoadingEquipment ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            ) : equipment.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">ไม่มีอุปกรณ์พร้อมใช้งาน</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                                    {equipment.map(eq => {
                                        const isSelected = selectedEquipmentIds.includes(eq.id)
                                        const hasConflict = conflictIds.includes(eq.id)
                                        return (
                                            <button
                                                key={eq.id}
                                                type="button"
                                                onClick={() => toggleEquipment(eq.id)}
                                                className={`p-2 text-left rounded-lg border transition-colors ${hasConflict
                                                    ? 'border-red-300 bg-red-50'
                                                    : isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-sm font-medium truncate">
                                                        {eq.equipment_number}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                วันที่ยืม
                            </label>
                            <input
                                type="date"
                                value={loanDate}
                                onChange={(e) => setLoanDate(e.target.value)}
                                onBlur={checkConflicts}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                วันที่คืน
                            </label>
                            <input
                                type="date"
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                                onBlur={checkConflicts}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            วัตถุประสงค์
                        </label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="เช่น สอบปลายภาควิชา Computer Programming"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            หมายเหตุ (ถ้ามี)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        สร้างยืมพิเศษ
                    </button>
                </div>
            </div>
        </div>
    )
}
