'use client'

import { useStaffActivityLog, useStaffList } from '@/hooks/useReservations'
import { getActionTypeLabel, getActionTypeIcon, ActionType } from '@/lib/staffActivityLog'
import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatThaiDate } from '@/lib/formatThaiDate'
import {
    Loader2, AlertTriangle, Search, Filter, User,
    Calendar, Clock, Activity
} from 'lucide-react'

export default function AdminStaffActivityPage() {
    const [staffFilter, setStaffFilter] = useState<string>('')
    const [actionFilter, setActionFilter] = useState<string>('')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)

    const { data: logs, isLoading, error } = useStaffActivityLog({
        staffId: staffFilter || undefined,
        actionType: actionFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
    })

    const { data: staffList } = useStaffList()

    const actionTypes: ActionType[] = [
        'approve_loan', 'reject_loan', 'mark_returned',
        'approve_reservation', 'reject_reservation', 'mark_ready',
        'convert_to_loan', 'cancel_reservation', 'self_borrow', 'self_reserve'
    ]

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Pagination
    const totalItems = logs?.length || 0
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedLogs = logs?.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    ) || []

    return (
        <AdminLayout title="ประวัติการทำงาน Staff" subtitle="ดูบันทึกการดำเนินการของเจ้าหน้าที่และผู้ดูแลระบบ">
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Staff Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <User className="w-4 h-4 inline-block mr-1" />
                            เจ้าหน้าที่
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            value={staffFilter}
                            onChange={(e) => setStaffFilter(e.target.value)}
                        >
                            <option value="">ทั้งหมด</option>
                            {staffList?.map((staff: any) => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.first_name} {staff.last_name} ({staff.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Filter className="w-4 h-4 inline-block mr-1" />
                            ประเภท
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="">ทั้งหมด</option>
                            {actionTypes.map((type) => (
                                <option key={type} value={type}>
                                    {getActionTypeIcon(type)} {getActionTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline-block mr-1" />
                            ตั้งแต่วันที่
                        </label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline-block mr-1" />
                            ถึงวันที่
                        </label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Activity Log Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-300 mb-3" />
                        <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    </div>
                ) : !logs || logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่พบประวัติการทำงาน</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            วันที่/เวลา
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            เจ้าหน้าที่
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            การดำเนินการ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            ประเภท
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            หมายเหตุ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatThaiDate(log.created_at)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatTime(log.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.profiles?.first_name} {log.profiles?.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {log.staff_role === 'admin' ? '👑 Admin' : '👤 Staff'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-sm">
                                                    <span>{getActionTypeIcon(log.action_type)}</span>
                                                    <span>{getActionTypeLabel(log.action_type)}</span>
                                                </span>
                                                {log.is_self_action && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                                                        ตัวเอง
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.target_type === 'loan'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {log.target_type === 'loan' ? 'ยืม' : 'จอง'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {log.details?.reason || log.details?.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalItems > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>แสดง</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value))
                                            setCurrentPage(1)
                                        }}
                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span>รายการ | {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} จาก {totalItems}</span>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            ก่อนหน้า
                                        </button>
                                        <span className="px-3 py-1.5 text-sm text-gray-600">
                                            หน้า {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            ถัดไป
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}
