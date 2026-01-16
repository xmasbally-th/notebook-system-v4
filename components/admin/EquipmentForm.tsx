'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Database } from '@/supabase/types'
import { Loader2, Save, ArrowLeft, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

type Equipment = Database['public']['Tables']['equipment']['Row']
type EquipmentInsert = Database['public']['Tables']['equipment']['Insert']
type EquipmentType = Database['public']['Tables']['equipment_types']['Row']

// Get Supabase credentials for direct fetch
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

interface EquipmentFormProps {
    initialData?: Equipment
    isEditing?: boolean
}

const STATUS_OPTIONS = [
    { value: 'ready', label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700' },
    { value: 'borrowed', label: 'ถูกยืม', color: 'bg-blue-100 text-blue-700' },
    { value: 'maintenance', label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'retired', label: 'เลิกใช้งาน', color: 'bg-gray-100 text-gray-600' },
]

export default function EquipmentForm({ initialData, isEditing = false }: EquipmentFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)

    // Fetch equipment types using fixed hook
    const { data: equipmentTypesData } = useEquipmentTypes()
    // Filter active types only
    const equipmentTypes = Array.isArray(equipmentTypesData)
        ? equipmentTypesData.filter((t: EquipmentType) => t.is_active)
        : []

    // Duplicate check for equipment_number
    const {
        isDuplicate: isEquipmentNumberDuplicate,
        isChecking: isCheckingEquipmentNumber,
        checkDuplicate: checkEquipmentNumber
    } = useDuplicateCheck({
        table: 'equipment',
        column: 'equipment_number',
        excludeId: isEditing ? initialData?.id : undefined
    })

    // Form State - updated with new fields
    const [formData, setFormData] = useState<Partial<EquipmentInsert>>({
        name: initialData?.name || '',
        equipment_number: initialData?.equipment_number || '',
        brand: (initialData as any)?.brand || '',
        model: (initialData as any)?.model || '',
        equipment_type_id: (initialData as any)?.equipment_type_id || '',
        status: ((initialData as any)?.status_new || initialData?.status || 'ready') as any,
        location: (initialData?.location as any) || { building: '', room: '' },
        specifications: (initialData?.specifications as any) || {},
        images: (initialData?.images as any) || [],
        is_active: initialData?.is_active ?? true,
    })

    const mutation = useMutation({
        mutationFn: async (data: EquipmentInsert) => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) throw new Error('Supabase credentials not available')

            // Get user's access token for RLS authentication
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.access_token) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            // Map new status values to old enum values for the 'status' column
            // Old enum: 'active', 'maintenance', 'retired', 'lost'
            // New enum: 'ready', 'borrowed', 'maintenance', 'retired'
            const statusForOldColumn = (status: string) => {
                if (status === 'ready' || status === 'borrowed') return 'active'
                if (status === 'maintenance') return 'maintenance'
                if (status === 'retired') return 'retired'
                return 'active'
            }

            const currentStatus = data.status || 'ready'

            // Prepare data for upsert
            const submitData = {
                name: data.name,
                equipment_number: data.equipment_number,
                brand: (data as any).brand || null,
                model: (data as any).model || null,
                equipment_type_id: (data as any).equipment_type_id || null,
                status: statusForOldColumn(currentStatus), // Old column uses 'active' instead of 'ready'
                status_new: currentStatus, // New column uses 'ready', 'borrowed', etc.
                location: data.location || {},
                specifications: data.specifications || {},
                images: data.images || [],
                is_active: data.is_active ?? true,
            }

            console.log('[EquipmentForm] Submitting with user token:', submitData)

            // Use user's access token in Authorization header for RLS
            const authHeaders = {
                'apikey': key,
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }

            if (isEditing && initialData) {
                const response = await fetch(`${url}/rest/v1/equipment?id=eq.${initialData.id}`, {
                    method: 'PATCH',
                    headers: authHeaders,
                    body: JSON.stringify(submitData)
                })
                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('[EquipmentForm] Update error:', errorText)
                    throw new Error(errorText || 'Failed to update equipment')
                }
            } else {
                const response = await fetch(`${url}/rest/v1/equipment`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify(submitData)
                })
                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('[EquipmentForm] Insert error:', errorText)
                    throw new Error(errorText || 'Failed to create equipment')
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] })
            router.push('/admin/equipment')
            router.refresh()
        },
        onError: (err: any) => {
            setError(err.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!formData.name?.trim()) {
            setError('กรุณาระบุชื่ออุปกรณ์')
            return
        }
        if (!formData.equipment_number?.trim()) {
            setError('กรุณาระบุหมายเลขครุภัณฑ์')
            return
        }
        if (isEquipmentNumberDuplicate) {
            setError('หมายเลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว')
            return
        }

        mutation.mutate(formData as EquipmentInsert)
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleLocationChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            location: {
                ...(prev.location as any),
                [field]: value
            }
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            {/* Back Link */}
            <Link
                href="/admin/equipment"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-4 h-4" />
                กลับไปรายการอุปกรณ์
            </Link>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Main Form Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isEditing ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                กรอกข้อมูลด้านล่างให้ครบถ้วน
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            ข้อมูลพื้นฐาน
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่ออุปกรณ์ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="เช่น MacBook Pro 14"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>

                            {/* Equipment Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    หมายเลขครุภัณฑ์ <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${isEquipmentNumberDuplicate
                                                ? 'border-red-300 bg-red-50'
                                                : formData.equipment_number && !isCheckingEquipmentNumber && !isEquipmentNumberDuplicate
                                                    ? 'border-green-300'
                                                    : 'border-gray-300'
                                            }`}
                                        placeholder="เช่น IT-NB-001"
                                        value={formData.equipment_number}
                                        onChange={(e) => handleChange('equipment_number', e.target.value)}
                                        onBlur={(e) => checkEquipmentNumber(e.target.value)}
                                    />
                                    {/* Validation indicator */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {isCheckingEquipmentNumber && (
                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                        )}
                                        {!isCheckingEquipmentNumber && isEquipmentNumberDuplicate && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        {!isCheckingEquipmentNumber && formData.equipment_number && !isEquipmentNumberDuplicate && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                    </div>
                                </div>
                                {isEquipmentNumberDuplicate && (
                                    <p className="text-xs text-red-500 mt-1">หมายเลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว</p>
                                )}
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ยี่ห้อ
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="เช่น Apple, Dell, HP"
                                    value={(formData as any).brand || ''}
                                    onChange={(e) => handleChange('brand', e.target.value)}
                                />
                            </div>

                            {/* Model */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รุ่น
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="เช่น MacBook Pro 14-inch M3"
                                    value={(formData as any).model || ''}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category & Status */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            ประเภทและสถานะ
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Equipment Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ประเภทอุปกรณ์
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={(formData as any).equipment_type_id || ''}
                                    onChange={(e) => handleChange('equipment_type_id', e.target.value || null)}
                                >
                                    <option value="">-- เลือกประเภท --</option>
                                    {equipmentTypes?.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.icon} {type.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    <Link href="/admin/equipment-types" className="text-blue-600 hover:underline">
                                        จัดการประเภทอุปกรณ์
                                    </Link>
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    สถานะ
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            ตำแหน่งจัดเก็บ
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    อาคาร/สถานที่
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="เช่น อาคาร IT"
                                    value={(formData.location as any)?.building || ''}
                                    onChange={(e) => handleLocationChange('building', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ห้อง
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="เช่น 301"
                                    value={(formData.location as any)?.room || ''}
                                    onChange={(e) => handleLocationChange('room', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            รูปภาพอุปกรณ์
                        </h3>
                        <p className="text-sm text-gray-500">
                            อัปโหลดรูปภาพเพื่อแสดงในรายการอุปกรณ์ (รูปจะถูกบีบอัดอัตโนมัติเพื่อลดขนาดไฟล์)
                        </p>
                        <ImageUpload
                            images={(formData.images as string[]) || []}
                            onChange={(images) => handleChange('images', images)}
                            maxImages={5}
                            disabled={mutation.isPending}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.is_active}
                                onChange={(e) => handleChange('is_active', e.target.checked)}
                            />
                            <label htmlFor="is_active" className="text-sm text-gray-700">
                                <span className="font-medium">เปิดให้ยืม</span>
                                <span className="text-gray-500 ml-1">
                                    (แสดงในรายการอุปกรณ์สำหรับผู้ใช้)
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Link
                    href="/admin/equipment"
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    ยกเลิก
                </Link>
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                    {mutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isEditing ? 'บันทึกการแก้ไข' : 'สร้างอุปกรณ์'}
                </button>
            </div>
        </form>
    )
}
