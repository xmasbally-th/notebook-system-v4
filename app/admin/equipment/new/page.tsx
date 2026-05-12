'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import EquipmentForm from '@/components/admin/EquipmentForm'

function NewEquipmentContent() {
    const searchParams = useSearchParams()
    const cloneFromId = searchParams.get('clone')

    return (
        <>
            <AdminPageHeader
            title={cloneFromId ? "สร้างสำเนาอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
            subtitle={cloneFromId ? "แก้ไขหมายเลขครุภัณฑ์และข้อมูลอื่นๆ ตามต้องการ" : "กรอกข้อมูลอุปกรณ์ที่ต้องการเพิ่มในระบบ"}
        />
            <EquipmentForm cloneFromId={cloneFromId || undefined} />
        </>
    )
}

export default function NewEquipmentPage() {
    return (
        <Suspense fallback={
            <>
            <AdminPageHeader title="เพิ่มอุปกรณ์ใหม่" subtitle="กำลังโหลด..."/>
                <div className="animate-pulse bg-gray-100 rounded-xl h-96" />
            </>
        }>
            <NewEquipmentContent />
        </Suspense>
    )
}
