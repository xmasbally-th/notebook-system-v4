'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEquipmentTypeMutation } from '@/hooks/useEquipmentTypes'
import { Database } from '@/supabase/types'
import { Loader2, Save, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']
type EquipmentTypeInsert = Database['public']['Tables']['equipment_types']['Insert']

interface EquipmentTypeFormProps {
    initialData?: EquipmentType
    isEditing?: boolean
}

const EMOJI_OPTIONS = ['📦', '💻', '📽️', '📷', '🎤', '🔊', '🖥️', '🖨️', '📱', '⌨️', '🖱️', '🎧', '📡', '🔧']

export default function EquipmentTypeForm({ initialData, isEditing = false }: EquipmentTypeFormProps) {
    const router = useRouter()
    const mutations = useEquipmentTypeMutation()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<EquipmentTypeInsert>>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        icon: initialData?.icon || '📦',
        is_active: initialData?.is_active ?? true,
    })

    // Duplicate check for name
    const {
        isDuplicate: isNameDuplicate,
        isChecking: isCheckingName,
        checkDuplicate: checkName
    } = useDuplicateCheck({
        table: 'equipment_types',
        column: 'name',
        excludeId: isEditing ? initialData?.id : undefined
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.name?.trim()) {
            setError('กรุณาระบุชื่อประเภท')
            return
        }
        if (isNameDuplicate) {
            setError('ชื่อประเภทนี้มีอยู่ในระบบแล้ว')
            return
        }

        try {
            if (isEditing && initialData) {
                await mutations.update.mutateAsync({
                    id: initialData.id,
                    data: formData
                })
            } else {
                await mutations.create.mutateAsync(formData as EquipmentTypeInsert)
            }
            router.push('/admin/equipment-types')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาด')
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const isPending = mutations.create.isPending || mutations.update.isPending

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            {/* Back Link */}
            <Link
                href="/admin/equipment-types"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-4 h-4" />
                กลับไปรายการประเภท
            </Link>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                    {isEditing ? 'แก้ไขประเภทอุปกรณ์' : 'เพิ่มประเภทอุปกรณ์ใหม่'}
                </h2>

                {/* Icon Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ไอคอน
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {EMOJI_OPTIONS.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleChange('icon', emoji)}
                                className={`
                                    w-10 h-10 text-xl rounded-lg border-2 flex items-center justify-center
                                    transition-all hover:scale-110
                                    ${formData.icon === emoji
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                `}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อประเภท <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${isNameDuplicate
                                    ? 'border-red-300 bg-red-50'
                                    : formData.name && !isCheckingName && !isNameDuplicate
                                        ? 'border-green-300'
                                        : 'border-gray-300'
                                }`}
                            placeholder="เช่น โน้ตบุ๊ก, โปรเจกเตอร์"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={(e) => checkName(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isCheckingName && (
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            )}
                            {!isCheckingName && isNameDuplicate && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            {!isCheckingName && formData.name && !isNameDuplicate && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                        </div>
                    </div>
                    {isNameDuplicate && (
                        <p className="text-xs text-red-500 mt-1">ชื่อประเภทนี้มีอยู่ในระบบแล้ว</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        คำอธิบาย
                    </label>
                    <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับประเภทนี้"
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="is_active"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.is_active}
                        onChange={(e) => handleChange('is_active', e.target.checked)}
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">
                        เปิดใช้งาน (แสดงในรายการตัวเลือก)
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Link
                    href="/admin/equipment-types"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    ยกเลิก
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isEditing ? 'บันทึกการแก้ไข' : 'สร้างประเภท'}
                </button>
            </div>
        </form>
    )
}
