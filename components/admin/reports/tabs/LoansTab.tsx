'use client'

import { useState } from 'react'
import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData, SpecialLoanItem } from '@/hooks/useReportData'
import { exportOverdueReportCSV } from '@/lib/reports'
import {
    ClipboardList, CheckCircle2, Clock, XCircle,
    AlertTriangle, ChevronDown, ChevronUp,
    Package, FileStack, Download
} from 'lucide-react'
import { formatThaiDate } from '@/lib/formatThaiDate'

interface LoansTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

function StatCard({
    label, value, subValue, icon: Icon, color, bgColor, textColor, loading
}: {
    label: string
    value: number
    subValue?: string
    icon: React.ElementType
    color: string
    bgColor: string
    textColor: string
    loading: boolean
}) {
    return (
        <div className={`${bgColor} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <div className={`p-2 ${color} rounded-xl`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
                <>
                    <p className={`text-3xl font-bold ${textColor}`}>{value.toLocaleString()}</p>
                    {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
                </>
            )}
        </div>
    )
}

function exportSpecialLoansCSV(items: SpecialLoanItem[]) {
    const rows = [
        ['ผู้ยืม', 'หน่วยงาน', 'ประเภทอุปกรณ์', 'จำนวน', 'วันที่ยืม', 'วันคืน', 'วัตถุประสงค์', 'สถานะ', 'คืนเมื่อ']
    ]
    items.forEach(item => {
        const org = item.external_borrower_org || item.borrower_department || '-'
        const statusMap: Record<string, string> = { active: 'กำลังยืม', returned: 'คืนแล้ว', cancelled: 'ยกเลิก' }
        rows.push([
            item.borrower_name,
            org,
            item.equipment_type_name,
            String(item.quantity),
            formatThaiDate(item.loan_date),
            formatThaiDate(item.return_date),
            item.purpose,
            statusMap[item.status] || item.status,
            item.returned_at ? formatThaiDate(item.returned_at) : '-'
        ])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'special_loans.csv'; a.click()
    URL.revokeObjectURL(url)
}

export default function LoansTab({ data, isLoading }: LoansTabProps) {
    const [showOverdue, setShowOverdue] = useState(false)

    const overdueColumns = [
        { key: 'user_name', label: 'ผู้ยืม' },
        { key: 'equipment_name', label: 'อุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'end_date', label: 'ครบกำหนด', render: columnRenderers.date },
        { key: 'days_overdue', label: 'เกินกำหนด', render: columnRenderers.daysOverdue }
    ]

    const specialLoanColumns = [
        {
            key: 'borrower_name', label: 'ผู้ยืม', render: (_: any, row: SpecialLoanItem) => (
                <div>
                    <p className="font-medium text-gray-900 text-sm">{row.borrower_name}</p>
                    <p className="text-xs text-gray-400">{row.external_borrower_org || row.borrower_department || '-'}</p>
                </div>
            )
        },
        { key: 'equipment_type_name', label: 'ประเภทอุปกรณ์' },
        {
            key: 'quantity', label: 'จำนวน', render: (v: number) => (
                <span className="font-semibold text-blue-600">{v} ชิ้น</span>
            )
        },
        { key: 'loan_date', label: 'วันที่ยืม', render: columnRenderers.date },
        { key: 'return_date', label: 'วันคืน', render: columnRenderers.date },
        {
            key: 'status', label: 'สถานะ', render: (v: string) => {
                const map: Record<string, { label: string; cls: string }> = {
                    active: { label: 'กำลังยืม', cls: 'bg-blue-100 text-blue-700' },
                    returned: { label: 'คืนแล้ว', cls: 'bg-green-100 text-green-700' },
                    cancelled: { label: 'ยกเลิก', cls: 'bg-gray-100 text-gray-600' }
                }
                const s = map[v] || { label: v, cls: 'bg-gray-100 text-gray-600' }
                return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
            }
        }
    ]

    const sl = data?.specialLoanStats

    return (
        <div className="space-y-8">

            {/* ─── Section 1: ยืมคืนปกติ ─── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-semibold text-gray-800">การยืม-คืนปกติ</h2>
                    <span className="text-sm text-gray-400">(ในช่วงเวลาที่เลือก)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="ทั้งหมด" value={data?.loanStats.total ?? 0} icon={ClipboardList}
                        color="bg-blue-500" bgColor="bg-blue-50" textColor="text-blue-700" loading={isLoading} />
                    <StatCard label="รอดำเนินการ" value={data?.loanStats.pending ?? 0} icon={Clock}
                        color="bg-yellow-500" bgColor="bg-yellow-50" textColor="text-yellow-700" loading={isLoading} />
                    <StatCard label="คืนแล้ว" value={data?.loanStats.returned ?? 0} icon={CheckCircle2}
                        color="bg-green-500" bgColor="bg-green-50" textColor="text-green-700" loading={isLoading} />
                    <StatCard label="เกินกำหนด" value={data?.loanStats.overdue ?? 0} icon={AlertTriangle}
                        color="bg-red-500" bgColor="bg-red-50" textColor="text-red-700" loading={isLoading} />
                </div>
            </section>

            {/* ─── Section 2: รายการเกินกำหนด (Collapsible) ─── */}
            <section>
                <button
                    onClick={() => setShowOverdue(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-red-700">รายการเกินกำหนดคืน</span>
                        {(data?.overdueItems.length ?? 0) > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                {data?.overdueItems.length}
                            </span>
                        )}
                    </div>
                    {showOverdue
                        ? <ChevronUp className="w-5 h-5 text-red-400" />
                        : <ChevronDown className="w-5 h-5 text-red-400" />
                    }
                </button>

                {showOverdue && (
                    <div className="mt-3">
                        <ReportTable
                            title=""
                            columns={overdueColumns}
                            data={data?.overdueItems ?? []}
                            loading={isLoading}
                            emptyMessage="ไม่มีรายการเกินกำหนด 🎉"
                            onExport={() => data?.overdueItems && exportOverdueReportCSV(data.overdueItems)}
                        />
                    </div>
                )}
            </section>

            {/* ─── Divider ─── */}
            <div className="border-t border-dashed border-gray-200" />

            {/* ─── Section 3: ยืมพิเศษ ─── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <FileStack className="w-5 h-5 text-purple-600" />
                    <h2 className="text-base font-semibold text-gray-800">ยืมพิเศษ</h2>
                    <span className="text-sm text-gray-400">(ในช่วงเวลาที่เลือก)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard label="ทั้งหมด" value={sl?.total ?? 0} icon={FileStack}
                        color="bg-purple-500" bgColor="bg-purple-50" textColor="text-purple-700" loading={isLoading} />
                    <StatCard label="กำลังยืม" value={sl?.active ?? 0} icon={Clock}
                        color="bg-blue-500" bgColor="bg-blue-50" textColor="text-blue-700" loading={isLoading} />
                    <StatCard label="คืนแล้ว" value={sl?.returned ?? 0} icon={CheckCircle2}
                        color="bg-green-500" bgColor="bg-green-50" textColor="text-green-700" loading={isLoading} />
                    <StatCard
                        label="อุปกรณ์รวม"
                        value={sl?.totalEquipment ?? 0}
                        subValue={`ยกเลิก ${sl?.cancelled ?? 0} ครั้ง`}
                        icon={Package}
                        color="bg-orange-500" bgColor="bg-orange-50" textColor="text-orange-700"
                        loading={isLoading}
                    />
                </div>

                {/* Special Loans Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">ประวัติยืมพิเศษ</h3>
                        {(sl?.items.length ?? 0) > 0 && (
                            <button
                                onClick={() => sl?.items && exportSpecialLoansCSV(sl.items)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    {specialLoanColumns.map(col => (
                                        <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <tr key={i}>
                                            {specialLoanColumns.map(col => (
                                                <td key={col.key} className="px-6 py-4">
                                                    <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (sl?.items.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan={specialLoanColumns.length} className="px-6 py-12 text-center text-gray-400 text-sm">
                                            ไม่มีการยืมพิเศษในช่วงเวลานี้
                                        </td>
                                    </tr>
                                ) : (
                                    sl!.items.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            {specialLoanColumns.map(col => (
                                                <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                                                    {col.render
                                                        ? col.render((row as any)[col.key], row)
                                                        : (row as any)[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!isLoading && (sl?.items.length ?? 0) > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                            แสดง {sl!.items.length} รายการ
                        </div>
                    )}
                </div>
            </section>

        </div>
    )
}
