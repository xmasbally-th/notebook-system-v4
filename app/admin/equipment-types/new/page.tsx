import AdminLayout from '@/components/admin/AdminLayout'
import EquipmentTypeForm from '@/components/admin/EquipmentTypeForm'

export const dynamic = 'force-dynamic'

export default function NewEquipmentTypePage() {
    return (
        <AdminLayout title="เพิ่มประเภทอุปกรณ์" subtitle="สร้างประเภทอุปกรณ์ใหม่">
            <EquipmentTypeForm />
        </AdminLayout>
    )
}
