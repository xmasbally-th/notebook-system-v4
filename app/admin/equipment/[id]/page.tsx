'use client'

import { useParams } from 'next/navigation'
import { useEquipment } from '@/hooks/useEquipment'
import AdminLayout from '@/components/admin/AdminLayout'
import EquipmentForm from '@/components/admin/EquipmentForm'
import { Database } from '@/supabase/types'

type Equipment = Database['public']['Tables']['equipment']['Row']

export default function EditEquipmentPage() {
    const params = useParams()
    const id = params?.id as string

    const { data: equipment, isLoading, error } = useEquipment(id)

    if (isLoading) {
        return (
            <AdminLayout title="แก้ไขอุปกรณ์" subtitle="กำลังโหลด...">
                <div className="max-w-3xl">
                    <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6"></div>
                    <div className="h-[600px] bg-gray-200 animate-pulse rounded-xl"></div>
                </div>
            </AdminLayout>
        )
    }

    if (error || !equipment) {
        return (
            <AdminLayout title="แก้ไขอุปกรณ์" subtitle="ไม่พบข้อมูล">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-red-600">ไม่พบอุปกรณ์นี้</h2>
                    <p className="text-gray-500 mt-2">อาจถูกลบไปแล้วหรือ ID ไม่ถูกต้อง</p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout
            title="แก้ไขอุปกรณ์"
            subtitle={`แก้ไขข้อมูล: ${(equipment as Equipment).name}`}
        >
            <EquipmentForm
                initialData={equipment as Equipment}
                isEditing={true}
            />
        </AdminLayout>
    )
}
