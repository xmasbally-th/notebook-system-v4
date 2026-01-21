'use client'

import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData } from '@/hooks/useReportData'
import { exportOverdueReportCSV } from '@/lib/reports'

interface LoansTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function LoansTab({ data, isLoading }: LoansTabProps) {
    const overdueColumns = [
        { key: 'user_name', label: 'ผู้ยืม' },
        { key: 'user_email', label: 'อีเมล' },
        { key: 'equipment_name', label: 'อุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'end_date', label: 'วันครบกำหนด', render: columnRenderers.date },
        { key: 'days_overdue', label: 'เกินกำหนด', render: columnRenderers.daysOverdue }
    ]

    return (
        <div className="space-y-6">
            {/* Loan Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data?.loanStats.total ?? 0}</p>
                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{data?.loanStats.pending ?? 0}</p>
                    <p className="text-sm text-yellow-700">รอดำเนินการ</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{data?.loanStats.returned ?? 0}</p>
                    <p className="text-sm text-green-700">คืนแล้ว</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{data?.loanStats.overdue ?? 0}</p>
                    <p className="text-sm text-red-700">เกินกำหนด</p>
                </div>
            </div>

            {/* Overdue Table */}
            <ReportTable
                title="รายการเกินกำหนดคืน"
                columns={overdueColumns}
                data={data?.overdueItems ?? []}
                loading={isLoading}
                emptyMessage="ไม่มีรายการเกินกำหนด"
                onExport={() => data?.overdueItems && exportOverdueReportCSV(data.overdueItems)}
            />
        </div>
    )
}
