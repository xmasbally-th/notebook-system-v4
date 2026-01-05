'use client'

import { useParams } from 'next/navigation'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'
import AdminLayout from '@/components/admin/AdminLayout'
import EquipmentTypeForm from '@/components/admin/EquipmentTypeForm'
import { Database } from '@/supabase/types'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']

export default function EditEquipmentTypePage() {
    const params = useParams()
    const id = params?.id as string

    const { data: type, isLoading, error } = useEquipmentTypes(id)

    if (isLoading) {
        return (
            <AdminLayout title="แก้ไขประเภทอุปกรณ์" subtitle="กำลังโหลด...">
                <div className="max-w-xl">
                    <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6"></div>
                    <div className="h-96 bg-gray-200 animate-pulse rounded-xl"></div>
                </div>
            </AdminLayout>
        )
    }

    if (error || !type) {
        return (
            <AdminLayout title="แก้ไขประเภทอุปกรณ์" subtitle="ไม่พบข้อมูล">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-red-600">ไม่พบประเภทอุปกรณ์นี้</h2>
                    <p className="text-gray-500 mt-2">อาจถูกลบไปแล้วหรือ ID ไม่ถูกต้อง</p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="แก้ไขประเภทอุปกรณ์" subtitle={`แก้ไข: ${(type as EquipmentType).name}`}>
            <EquipmentTypeForm initialData={type as EquipmentType} isEditing />
        </AdminLayout>
    )
}
