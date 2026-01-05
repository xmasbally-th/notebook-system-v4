import AdminLayout from '@/components/admin/AdminLayout'
import EquipmentForm from '@/components/admin/EquipmentForm'

export const dynamic = 'force-dynamic'

export default function NewEquipmentPage() {
    return (
        <AdminLayout title="เพิ่มอุปกรณ์ใหม่" subtitle="กรอกข้อมูลอุปกรณ์ที่ต้องการเพิ่มในระบบ">
            <EquipmentForm />
        </AdminLayout>
    )
}
