'use client'

import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData } from '@/hooks/useReportData'
import { exportPopularEquipmentCSV, calculatePercentage } from '@/lib/reports'

interface EquipmentTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function EquipmentTab({ data, isLoading }: EquipmentTabProps) {
    const popularEquipmentColumns = [
        { key: 'rank', label: 'อันดับ' },
        { key: 'name', label: 'ชื่ออุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'loan_count', label: 'จำนวนครั้งที่ยืม', render: columnRenderers.number },
        { key: 'total_usage', label: 'รวมการใช้งาน', render: columnRenderers.number }
    ]

    return (
        <div className="space-y-6">
            {/* Equipment Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data?.equipmentStats.total ?? 0}</p>
                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{data?.equipmentStats.ready ?? 0}</p>
                    <p className="text-sm text-green-700">พร้อมใช้งาน</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{data?.equipmentStats.borrowed ?? 0}</p>
                    <p className="text-sm text-purple-700">ถูกยืม</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{data?.equipmentStats.maintenance ?? 0}</p>
                    <p className="text-sm text-orange-700">ซ่อมบำรุง</p>
                </div>
            </div>

            {/* Usage Rate */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">อัตราการใช้งาน</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${data?.equipmentStats.total ? Math.round((data.equipmentStats.borrowed / data.equipmentStats.total) * 100) : 0}%`
                            }}
                        />
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                        {calculatePercentage(data?.equipmentStats.borrowed ?? 0, data?.equipmentStats.total ?? 0)}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    {data?.equipmentStats.borrowed ?? 0} จาก {data?.equipmentStats.total ?? 0} ชิ้นกำลังถูกใช้งาน
                </p>
            </div>

            {/* Popular Equipment */}
            <ReportTable
                title="อุปกรณ์ยอดนิยม"
                columns={popularEquipmentColumns}
                data={(data?.popularEquipment ?? []).map((item, index) => ({ ...item, rank: index + 1 }))}
                loading={isLoading}
                emptyMessage="ไม่มีข้อมูลการใช้งาน"
                onExport={() => data?.popularEquipment && exportPopularEquipmentCSV(data.popularEquipment)}
            />
        </div>
    )
}
