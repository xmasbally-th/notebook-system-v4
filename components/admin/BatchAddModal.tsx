'use client'

import { useState, useMemo, useCallback } from 'react'
import { X, Layers, Loader2, AlertCircle, CheckCircle2, Package } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

interface BatchAddModalProps {
    isOpen: boolean
    onClose: () => void
}

function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

interface EquipmentNumberStatus {
    number: string
    status: 'pending' | 'checking' | 'valid' | 'duplicate' | 'empty'
}

export default function BatchAddModal({ isOpen, onClose }: BatchAddModalProps) {
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)
    const [successCount, setSuccessCount] = useState(0)

    // Form fields
    const [name, setName] = useState('')
    const [brand, setBrand] = useState('')
    const [model, setModel] = useState('')
    const [equipmentTypeId, setEquipmentTypeId] = useState('')
    const [building, setBuilding] = useState('')
    const [room, setRoom] = useState('')
    const [equipmentNumbers, setEquipmentNumbers] = useState('')
    const [numberStatuses, setNumberStatuses] = useState<EquipmentNumberStatus[]>([])
    const [isCheckingAll, setIsCheckingAll] = useState(false)

    // Fetch equipment types
    const { data: equipmentTypesData } = useEquipmentTypes()
    const equipmentTypes = Array.isArray(equipmentTypesData)
        ? equipmentTypesData.filter((t: any) => t.is_active)
        : []

    // Parse equipment numbers from textarea
    const parsedNumbers = useMemo(() => {
        return equipmentNumbers
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0)
    }, [equipmentNumbers])

    // Check all equipment numbers for duplicates
    const checkAllNumbers = useCallback(async () => {
        if (parsedNumbers.length === 0) {
            setNumberStatuses([])
            return
        }

        setIsCheckingAll(true)
        const { url, key } = getSupabaseCredentials()

        const statuses: EquipmentNumberStatus[] = []

        for (const num of parsedNumbers) {
            if (!num.trim()) {
                statuses.push({ number: num, status: 'empty' })
                continue
            }

            try {
                const response = await fetch(
                    `${url}/rest/v1/equipment?equipment_number=eq.${encodeURIComponent(num)}&select=id`,
                    {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`
                        }
                    }
                )

                if (response.ok) {
                    const data = await response.json()
                    statuses.push({
                        number: num,
                        status: data.length > 0 ? 'duplicate' : 'valid'
                    })
                } else {
                    statuses.push({ number: num, status: 'valid' })
                }
            } catch {
                statuses.push({ number: num, status: 'valid' })
            }
        }

        setNumberStatuses(statuses)
        setIsCheckingAll(false)
    }, [parsedNumbers])

    // Valid numbers (not duplicate, not empty)
    const validNumbers = useMemo(() => {
        return numberStatuses.filter(s => s.status === 'valid').map(s => s.number)
    }, [numberStatuses])

    // Create batch mutation
    const batchMutation = useMutation({
        mutationFn: async () => {
            if (validNumbers.length === 0) {
                throw new Error('ไม่มีหมายเลขครุภัณฑ์ที่สามารถสร้างได้')
            }
            if (!name.trim()) {
                throw new Error('กรุณาระบุชื่ออุปกรณ์')
            }

            const { url, key } = getSupabaseCredentials()

            // Get user's access token
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.access_token) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            let created = 0

            for (const equipmentNumber of validNumbers) {
                const submitData = {
                    name: name.trim(),
                    equipment_number: equipmentNumber,
                    brand: brand.trim() || null,
                    model: model.trim() || null,
                    equipment_type_id: equipmentTypeId || null,
                    status: 'active',
                    status_new: 'ready',
                    location: { building: building.trim(), room: room.trim() },
                    specifications: {},
                    images: [],
                    is_active: true,
                }

                const response = await fetch(`${url}/rest/v1/equipment`, {
                    method: 'POST',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(submitData)
                })

                if (response.ok) {
                    created++
                }
            }

            return created
        },
        onSuccess: (count) => {
            setSuccessCount(count)
            queryClient.invalidateQueries({ queryKey: ['equipment'] })
            // Reset form after short delay
            setTimeout(() => {
                handleClose()
            }, 2000)
        },
        onError: (err: any) => {
            setError(err.message)
        }
    })

    const handleClose = () => {
        setName('')
        setBrand('')
        setModel('')
        setEquipmentTypeId('')
        setBuilding('')
        setRoom('')
        setEquipmentNumbers('')
        setNumberStatuses([])
        setError(null)
        setSuccessCount(0)
        onClose()
    }

    const handleSubmit = () => {
        setError(null)
        batchMutation.mutate()
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Layers className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                เพิ่มอุปกรณ์แบบ Batch
                            </h2>
                            <p className="text-sm text-gray-500">
                                เพิ่มอุปกรณ์หลายตัวพร้อมกัน
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

                {/* Success Message */}
                {successCount > 0 && (
                    <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-700">
                            สร้างอุปกรณ์สำเร็จ {successCount} รายการ!
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ชื่ออุปกรณ์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น MacBook Pro 14"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ยี่ห้อ
                            </label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น Apple"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                รุ่น
                            </label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น M3 Pro"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ประเภทอุปกรณ์
                            </label>
                            <select
                                value={equipmentTypeId}
                                onChange={(e) => setEquipmentTypeId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">-- เลือกประเภท --</option>
                                {equipmentTypes.map((type: any) => (
                                    <option key={type.id} value={type.id}>
                                        {type.icon} {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                อาคาร/สถานที่
                            </label>
                            <input
                                type="text"
                                value={building}
                                onChange={(e) => setBuilding(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น อาคาร IT"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ห้อง
                            </label>
                            <input
                                type="text"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น 301"
                            />
                        </div>
                    </div>

                    {/* Equipment Numbers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            หมายเลขครุภัณฑ์ <span className="text-red-500">*</span>
                            <span className="font-normal text-gray-500 ml-1">
                                (1 หมายเลขต่อบรรทัด)
                            </span>
                        </label>
                        <textarea
                            value={equipmentNumbers}
                            onChange={(e) => {
                                setEquipmentNumbers(e.target.value)
                                setNumberStatuses([]) // Reset statuses when input changes
                            }}
                            rows={5}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder={`IT-NB-001\nIT-NB-002\nIT-NB-003`}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                                {parsedNumbers.length} หมายเลข
                            </p>
                            <button
                                type="button"
                                onClick={checkAllNumbers}
                                disabled={parsedNumbers.length === 0 || isCheckingAll}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                            >
                                {isCheckingAll ? 'กำลังตรวจสอบ...' : 'ตรวจสอบซ้ำ'}
                            </button>
                        </div>
                    </div>

                    {/* Number Status Preview */}
                    {numberStatuses.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                ผลการตรวจสอบ:
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-1.5">
                                {numberStatuses.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${item.status === 'valid'
                                                ? 'bg-green-50 text-green-700'
                                                : item.status === 'duplicate'
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {item.status === 'valid' && (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        {item.status === 'duplicate' && (
                                            <AlertCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-mono">{item.number}</span>
                                        <span className="text-xs ml-auto">
                                            {item.status === 'valid' && 'พร้อมสร้าง'}
                                            {item.status === 'duplicate' && 'มีอยู่แล้ว'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex gap-4 text-xs">
                                <span className="text-green-600">
                                    ✓ พร้อมสร้าง: {validNumbers.length}
                                </span>
                                <span className="text-red-600">
                                    ✗ ซ้ำ: {numberStatuses.filter(s => s.status === 'duplicate').length}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">
                        {validNumbers.length > 0
                            ? `พร้อมสร้าง ${validNumbers.length} อุปกรณ์`
                            : 'กรุณากรอกข้อมูลและตรวจสอบหมายเลข'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={validNumbers.length === 0 || !name.trim() || batchMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {batchMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    กำลังสร้าง...
                                </>
                            ) : (
                                <>
                                    <Package className="w-4 h-4" />
                                    สร้าง {validNumbers.length > 0 ? `${validNumbers.length} อุปกรณ์` : ''}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
