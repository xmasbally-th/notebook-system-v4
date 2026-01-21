'use client'

import dynamic from 'next/dynamic'
import { ReportData, StaffActivityItem } from '@/hooks/useReportData'
import { exportToCSV } from '@/lib/reports'
import { formatThaiDateTime } from '@/lib/formatThaiDate'
import { getActionTypeLabel, getActionTypeIcon } from '@/lib/staffActivityLog'
import { User } from 'lucide-react'

// Dynamic imports for charts
const ActivityBarChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.ActivityBarChart })), { ssr: false })
const StaffActivityBarChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.StaffActivityBarChart })), { ssr: false })
const DailyActivityChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.DailyActivityChart })), { ssr: false })

interface ActivityTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function ActivityTab({ data, isLoading }: ActivityTabProps) {
    const exportActivityCSV = () => {
        if (!data?.staffActivity?.recentActivities) return
        exportToCSV({
            filename: 'รายงานกิจกรรมเจ้าหน้าที่',
            headers: ['ลำดับ', 'เจ้าหน้าที่', 'กิจกรรม', 'ประเภท', 'วันที่'],
            rows: data.staffActivity.recentActivities.map((activity, index) => [
                index + 1,
                activity.staff_name,
                getActionTypeLabel(activity.action_type as any),
                activity.target_type,
                formatThaiDateTime(new Date(activity.created_at))
            ])
        })
    }

    return (
        <div className="space-y-6">
            {/* Activity Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data?.staffActivity?.total ?? 0}</p>
                    <p className="text-sm text-blue-700">กิจกรรมทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {data?.staffActivity?.byActionType?.find(a => a.name.includes('อนุมัติ'))?.count ?? 0}
                    </p>
                    <p className="text-sm text-green-700">อนุมัติ</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                        {data?.staffActivity?.byActionType?.find(a => a.name.includes('ปฏิเสธ'))?.count ?? 0}
                    </p>
                    <p className="text-sm text-red-700">ปฏิเสธ</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                        {data?.staffActivity?.byStaff?.length ?? 0}
                    </p>
                    <p className="text-sm text-purple-700">เจ้าหน้าที่</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity Chart */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมรายวัน</h3>
                    <DailyActivityChart data={data?.staffActivity?.dailyActivity ?? []} />
                </div>

                {/* Activity by Type */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">ประเภทกิจกรรม</h3>
                    <ActivityBarChart data={data?.staffActivity?.byActionType ?? []} />
                </div>
            </div>

            {/* Staff Activity Table */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมแยกตามเจ้าหน้าที่</h3>
                <StaffActivityBarChart data={data?.staffActivity?.byStaff ?? []} />
            </div>

            {/* Recent Activities Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        กิจกรรมล่าสุด ({data?.staffActivity?.recentActivities?.length ?? 0} รายการ)
                    </h3>
                    <button
                        onClick={exportActivityCSV}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">เจ้าหน้าที่</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">กิจกรรม</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ประเภท</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">วัน-เวลา</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(4)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : !data?.staffActivity?.recentActivities?.length ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        ไม่มีข้อมูลกิจกรรม
                                    </td>
                                </tr>
                            ) : (
                                data.staffActivity.recentActivities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {activity.staff_avatar ? (
                                                        <img src={activity.staff_avatar} alt="" className="w-8 h-8 object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                {activity.staff_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="mr-2">{getActionTypeIcon(activity.action_type as any)}</span>
                                            {getActionTypeLabel(activity.action_type as any)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {activity.target_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatThaiDateTime(new Date(activity.created_at))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
