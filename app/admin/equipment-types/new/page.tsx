import AdminPageHeader from '@/components/admin/AdminPageHeader'
import EquipmentTypeForm from '@/components/admin/EquipmentTypeForm'

export const dynamic = 'force-dynamic'

export default function NewEquipmentTypePage() {
    return (
        <>
            <AdminPageHeader title="เพิ่มประเภทอุปกรณ์" subtitle="สร้างประเภทอุปกรณ์ใหม่"/>
            <EquipmentTypeForm />
        </>
    )
}
