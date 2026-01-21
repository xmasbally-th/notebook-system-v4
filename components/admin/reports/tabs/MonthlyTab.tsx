'use client'

import dynamic from 'next/dynamic'
import { ReportData } from '@/hooks/useReportData'
import { exportToCSV } from '@/lib/reports'

// Dynamic import for chart
const MonthlyTrendChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.MonthlyTrendChart })), { ssr: false })

interface MonthlyTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function MonthlyTab({ data, isLoading }: MonthlyTabProps) {
    const exportMonthlyCSV = () => {
        if (!data?.monthlyStats) return
        exportToCSV({
            filename: 'รายงานสรุปรายเดือน',
            headers: ['เดือน', 'การยืม', 'การจอง', 'คืนแล้ว', 'เกินกำหนด'],
            rows: data.monthlyStats.map(stat => [
                stat.month,
                stat.loans,
                stat.reservations,
                stat.returned,
                stat.overdue
            ])
        })
    }

    return (
        <div className="space-y-6">
            {/* Monthly Trend Chart */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มการยืม-จองรายเดือน</h3>
                <MonthlyTrendChart data={data?.monthlyStats ?? []} />
            </div>

            {/* Monthly Stats Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        สรุปรายเดือน
                    </h3>
                    <button
                        onClick={exportMonthlyCSV}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">เดือน</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">การยืม</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">การจอง</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">คืนแล้ว</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">รวม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-16"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : !data?.monthlyStats?.length ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        ไม่มีข้อมูลรายเดือน
                                    </td>
                                </tr>
                            ) : (
                                data.monthlyStats.map((stat, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {stat.month}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-blue-600">{stat.loans}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-purple-600">{stat.reservations}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-green-600">{stat.returned}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-900">{stat.loans + stat.reservations}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data?.monthlyStats && data.monthlyStats.length > 0 && (
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">รวมทั้งหมด</td>
                                    <td className="px-6 py-4 text-center font-bold text-blue-600">
                                        {data.monthlyStats.reduce((sum, s) => sum + s.loans, 0)}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-purple-600">
                                        {data.monthlyStats.reduce((sum, s) => sum + s.reservations, 0)}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-green-600">
                                        {data.monthlyStats.reduce((sum, s) => sum + s.returned, 0)}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-900">
                                        {data.monthlyStats.reduce((sum, s) => sum + s.loans + s.reservations, 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    )
}
