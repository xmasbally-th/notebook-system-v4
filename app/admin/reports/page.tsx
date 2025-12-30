'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { FileText, Construction } from 'lucide-react'

export default function AdminReportsPage() {
    return (
        <AdminLayout title="รายงาน" subtitle="รายงานและสถิติการใช้งานระบบ">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Construction className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        กำลังพัฒนา
                    </h2>
                    <p className="text-gray-500 mb-6">
                        หน้ารายงานและสถิติกำลังอยู่ในระหว่างการพัฒนา
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 text-left">
                        <p className="text-sm font-medium text-gray-700 mb-3">ฟีเจอร์ที่จะมี:</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                รายงานการยืม-คืนประจำวัน/เดือน
                            </li>
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                สถิติการใช้งานอุปกรณ์
                            </li>
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                รายงานผู้ใช้งานระบบ
                            </li>
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Export เป็น Excel/PDF
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
