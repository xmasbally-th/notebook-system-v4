'use client'

import { useStaffActivityLog, useStaffList } from '@/hooks/useReservations'
import { getActionTypeLabel, getActionTypeIcon, ActionType } from '@/lib/staffActivityLog'
import { useState, useMemo } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { formatThaiDate } from '@/lib/formatThaiDate'
import {
    Loader2, AlertTriangle, Search, Filter, User,
    Calendar, Clock, Activity, Laptop, FileText, X
} from 'lucide-react'

export default function AdminStaffActivityPage() {
    const [staffFilter, setStaffFilter] = useState<string>('')
    const [actionFilter, setActionFilter] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)
    const [selectedLog, setSelectedLog] = useState<any | null>(null)

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

    // Filter logs by search query (Staff name, Target user name, Equipment name, Equipment number, Reason)
    const filteredLogs = useMemo(() => {
        if (!logs) return []
        if (!searchQuery.trim()) return logs

        const q = searchQuery.toLowerCase().trim()
        return logs.filter((log: any) => {
            const staffName = `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.toLowerCase()
            const targetName = `${log.target_profile?.first_name || ''} ${log.target_profile?.last_name || ''}`.toLowerCase()
            const targetEmail = (log.target_profile?.email || '').toLowerCase()
            const targetUserId = (log.target_profile?.user_id || '').toLowerCase()
            const equipName = (log.equipment?.name || log.details?.equipment_name || '').toLowerCase()
            const equipNum = (log.equipment?.equipment_number || log.details?.equipment_number || '').toLowerCase()
            const note = (log.details?.reason || log.details?.note || '').toLowerCase()

            return staffName.includes(q) ||
                targetName.includes(q) ||
                targetEmail.includes(q) ||
                targetUserId.includes(q) ||
                equipName.includes(q) ||
                equipNum.includes(q) ||
                note.includes(q)
        })
    }, [logs, searchQuery])

    // Pagination
    const totalItems = filteredLogs.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    return (
        <>
            <AdminPageHeader title="ประวัติการทำงาน Staff" subtitle="ดูบันทึกการดำเนินการของเจ้าหน้าที่และผู้ดูแลระบบ" />
            
            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาตามชื่อเจ้าหน้าที่, ชื่อผู้ยืม/ผู้จอง, รหัสนักศึกษา, ชื่ออุปกรณ์ หรือหมายเลขครุภัณฑ์..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Staff Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <User className="w-4 h-4 inline-block mr-1" />
                            เจ้าหน้าที่
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            value={staffFilter}
                            onChange={(e) => {
                                setStaffFilter(e.target.value)
                                setCurrentPage(1)
                            }}
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
                            ประเภทการดำเนินการ
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value)
                                setCurrentPage(1)
                            }}
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
                            onChange={(e) => {
                                setDateRange(prev => ({ ...prev, start: e.target.value }))
                                setCurrentPage(1)
                            }}
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
                            onChange={(e) => {
                                setDateRange(prev => ({ ...prev, end: e.target.value }))
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Activity Log Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="animate-pulse p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-300 mb-3" />
                        <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่พบประวัติการทำงานที่ตรงตามเงื่อนไข</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            วันที่/เวลา
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            เจ้าหน้าที่ (Staff)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            การดำเนินการ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            ผู้ยืม / ผู้รับบริการ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            อุปกรณ์ & หมายเลขครุภัณฑ์
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            หมายเหตุ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedLogs.map((log: any) => (
                                        <tr
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatThaiDate(log.created_at)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatTime(log.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                                                        {log.profiles?.first_name?.[0] || 'S'}
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
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                                    <span>{getActionTypeIcon(log.action_type)}</span>
                                                    <span>{getActionTypeLabel(log.action_type)}</span>
                                                </span>
                                                {log.is_self_action && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                                                        ทำรายการเอง
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {log.target_profile ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.target_profile.first_name} {log.target_profile.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {log.target_profile.user_id ? `รหัส: ${log.target_profile.user_id}` : log.target_profile.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {log.equipment ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                            {log.equipment.name}
                                                        </div>
                                                        {log.equipment.equipment_number && (
                                                            <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                                                                #{log.equipment.equipment_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {log.details?.reason || log.details?.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards List */}
                        <div className="lg:hidden divide-y divide-gray-150">
                            {paginatedLogs.map((log: any) => {
                                const isActionSuccess = ['approve_loan', 'approve_reservation', 'mark_returned', 'mark_ready', 'convert_to_loan'].includes(log.action_type)
                                const isActionDanger = ['reject_loan', 'reject_reservation', 'cancel_reservation'].includes(log.action_type)

                                const actionBadgeColor = isActionSuccess
                                    ? 'bg-green-50 text-green-750 border-green-200'
                                    : isActionDanger
                                        ? 'bg-rose-50 text-rose-750 border-rose-200'
                                        : 'bg-blue-50 text-blue-750 border-blue-200'

                                return (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="p-4 space-y-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg border ${actionBadgeColor}`}>
                                                <span>{getActionTypeIcon(log.action_type)}</span>
                                                <span>{getActionTypeLabel(log.action_type)}</span>
                                            </span>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-xs font-bold text-gray-800">{formatThaiDate(log.created_at)}</div>
                                                <div className="text-[11px] text-gray-500">{formatTime(log.created_at)}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-400 block text-[10px]">เจ้าหน้าที่ (Staff)</span>
                                                <span className="font-semibold text-gray-800">
                                                    {log.profiles?.first_name} {log.profiles?.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block text-[10px]">ผู้รับบริการ / ผู้ยืม</span>
                                                <span className="font-semibold text-gray-800">
                                                    {log.target_profile ? `${log.target_profile.first_name} ${log.target_profile.last_name}` : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {log.equipment && (
                                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs flex items-center justify-between gap-2">
                                                <div className="font-medium text-gray-800 truncate">
                                                    📦 {log.equipment.name}
                                                </div>
                                                {log.equipment.equipment_number && (
                                                    <span className="px-2 py-0.5 text-[10px] font-mono bg-white text-gray-700 rounded border border-gray-200 flex-shrink-0">
                                                        #{log.equipment.equipment_number}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {(log.details?.reason || log.details?.note) && (
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-600 italic">
                                                "{log.details?.reason || log.details?.note}"
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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
                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white"
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

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-gray-900">รายละเอียดบันทึกกิจกรรม</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                                    <span>{getActionTypeIcon(selectedLog.action_type)}</span>
                                    <span>{getActionTypeLabel(selectedLog.action_type)}</span>
                                </span>
                                <span className="text-xs text-blue-700 font-medium">
                                    {formatThaiDate(selectedLog.created_at)} {formatTime(selectedLog.created_at)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                                <div>
                                    <span className="text-xs text-gray-400 block">ผู้ดำเนินการ (Staff)</span>
                                    <span className="font-medium text-gray-900">
                                        {selectedLog.profiles?.first_name} {selectedLog.profiles?.last_name}
                                    </span>
                                    <span className="text-xs text-gray-500 block">({selectedLog.staff_role})</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block">ผู้รับบริการ / ผู้ยืม</span>
                                    <span className="font-medium text-gray-900">
                                        {selectedLog.target_profile ? `${selectedLog.target_profile.first_name} ${selectedLog.target_profile.last_name}` : '-'}
                                    </span>
                                    {selectedLog.target_profile?.user_id && (
                                        <span className="text-xs text-gray-500 block">รหัส: {selectedLog.target_profile.user_id}</span>
                                    )}
                                </div>
                            </div>

                            {selectedLog.equipment && (
                                <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                                    <span className="text-xs text-gray-400 block">อุปกรณ์ที่เกี่ยวข้อง</span>
                                    <div className="font-medium text-gray-900">{selectedLog.equipment.name}</div>
                                    {selectedLog.equipment.equipment_number && (
                                        <div className="text-xs font-mono text-blue-600">
                                            หมายเลขครุภัณฑ์: #{selectedLog.equipment.equipment_number}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(selectedLog.details?.reason || selectedLog.details?.note) && (
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">เหตุผล / หมายเหตุเพิ่มเติม</span>
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 font-medium">
                                        {selectedLog.details?.reason || selectedLog.details?.note}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 text-right">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
