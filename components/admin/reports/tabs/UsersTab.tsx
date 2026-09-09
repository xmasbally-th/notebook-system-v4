'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { ReportData, UserStats } from '@/hooks/useReportData'
import { exportToCSV } from '@/lib/reports'
import { supabase } from '@/lib/supabase/client'
import { formatThaiDate } from '@/lib/formatThaiDate'
import { getDueDate } from '@/lib/reportDataProcessors'
import {
    User,
    Package,
    Clock,
    CheckCircle2,
    AlertTriangle,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    FileText,
    ExternalLink
} from 'lucide-react'

type UserSortKey = 'name' | 'department' | 'loan_count' | 'total_activity' | 'overdue_count'

interface UserLoanRecord {
    id: string
    status: string
    created_at: string
    start_date?: string | null
    end_date: string
    return_time?: string | null
    returned_at?: string | null
    return_condition?: string | null
    return_notes?: string | null
    purpose?: string | null
    equipment: {
        name: string
        equipment_number: string
        brand?: string | null
        model?: string | null
        equipment_type?: {
            name: string
            icon: string
        } | null
    } | null
}

function UserBorrowHistoryModal({
    isOpen,
    onClose,
    user
}: {
    isOpen: boolean
    onClose: () => void
    user: UserStats | null
}) {
    const [records, setRecords] = useState<UserLoanRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 6

    const fetchUserLoans = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchErr } = await supabase
                .from('loanRequests')
                .select(`
                    id,
                    status,
                    created_at,
                    start_date,
                    end_date,
                    return_time,
                    returned_at,
                    return_condition,
                    return_notes,
                    purpose,
                    equipment:equipment_id(name, equipment_number, brand, model, equipment_type:equipment_types(name, icon))
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (fetchErr) throw fetchErr
            setRecords(Array.isArray(data) ? (data as any[]) : [])
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการยืม')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (isOpen && user) {
            setCurrentPage(1)
            setStatusFilter('all')
            fetchUserLoans()
        }
        return () => {
            setRecords([])
            setError(null)
            setCurrentPage(1)
        }
    }, [isOpen, user, fetchUserLoans])

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (statusFilter === 'active' && r.status !== 'approved') return false
            if (statusFilter === 'returned' && r.status !== 'returned') return false
            return true
        })
    }, [records, statusFilter])

    if (!isOpen || !user) return null

    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedRecords = filteredRecords.slice(startIdx, startIdx + ITEMS_PER_PAGE)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full relative overflow-hidden bg-white border-2 border-white shadow flex-shrink-0 flex items-center justify-center">
                            {user.avatar_url ? (
                                <Image src={user.avatar_url} alt={userName} fill sizes="48px" className="object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-blue-600" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{userName}</h2>
                                <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full font-medium">
                                    {user.department || 'ไม่ระบุ'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-xl transition-colors flex-shrink-0 ml-2"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Sub-header / Filters */}
                <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-medium">
                        <button
                            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            ทั้งหมด ({records.length})
                        </button>
                        <button
                            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'active' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            กำลังยืม ({records.filter(r => r.status === 'approved').length})
                        </button>
                        <button
                            onClick={() => { setStatusFilter('returned'); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'returned' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            คืนแล้ว ({records.filter(r => r.status === 'returned').length})
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium">
                            <Package className="w-3.5 h-3.5 text-blue-500" />
                            รายการอุปกรณ์ที่เคยยืม
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-500">กำลังโหลดรายการอุปกรณ์...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Package className="w-12 h-12 text-gray-200" />
                            <p className="text-gray-500 font-medium">ไม่พบรายการยืมอุปกรณ์</p>
                            <p className="text-xs text-gray-400">ผู้ใช้นี้ยังไม่มีประวัติการยืมตามเงื่อนไขที่เลือก</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    รายการอุปกรณ์ ({filteredRecords.length} ชิ้น)
                                </h4>
                                {totalPages > 1 && (
                                    <span className="text-xs text-gray-400">หน้า {currentPage}/{totalPages}</span>
                                )}
                            </div>
                            {paginatedRecords.map((record) => {
                                const dueDate = getDueDate(record.end_date, record.return_time)
                                const isOverdue = record.status === 'approved' && new Date() > dueDate
                                const isReturned = record.status === 'returned'
                                const eq = record.equipment

                                return (
                                    <div
                                        key={record.id}
                                        className="bg-white hover:bg-gray-50/80 rounded-xl p-4 transition-all duration-200 border border-gray-200 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg flex-shrink-0">
                                                    {eq?.equipment_type?.icon || '📦'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 text-sm truncate">
                                                            {eq?.name || 'ไม่ระบุชื่ออุปกรณ์'}
                                                        </h4>
                                                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200 flex-shrink-0">
                                                            #{eq?.equipment_number || '-'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>ยืม:</span>
                                                            <span className="font-medium text-gray-800">{formatThaiDate(record.start_date || record.created_at)}</span>
                                                        </span>
                                                        <span className="text-gray-300 hidden sm:inline">•</span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                            <span>กำหนดคืน:</span>
                                                            <span className="font-medium text-gray-800">{formatThaiDate(record.end_date)}</span>
                                                        </span>
                                                        {record.returned_at && (
                                                            <>
                                                                <span className="text-gray-300 hidden sm:inline">•</span>
                                                                <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                    <span>คืนจริง: {formatThaiDate(record.returned_at)}</span>
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {record.purpose && (
                                                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                                            <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <span className="font-medium text-gray-600">วัตถุประสงค์:</span> {record.purpose}
                                                        </p>
                                                    )}

                                                    {record.return_notes && (
                                                        <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1 bg-amber-50/60 px-2 py-1 rounded border border-amber-100">
                                                            <span className="font-semibold">หมายเหตุการคืน:</span> {record.return_notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                {isReturned ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        คืนแล้ว
                                                    </span>
                                                ) : isOverdue ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        เกินกำหนด
                                                    </span>
                                                ) : record.status === 'approved' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                        <Clock className="w-3 h-3" />
                                                        กำลังยืม
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                        {record.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        ก่อนหน้า
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ถัดไป
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 sm:rounded-b-2xl flex-shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    )
}

interface UsersTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function UsersTab({ data, isLoading }: UsersTabProps) {
    const [userDeptFilter, setUserDeptFilter] = useState<string>('all')
    const [userSortKey, setUserSortKey] = useState<UserSortKey>('loan_count')
    const [userSortAsc, setUserSortAsc] = useState<boolean>(false)
    const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true)
    const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        let users = data?.userStats ?? []

        // Filter by department
        if (userDeptFilter !== 'all') {
            users = users.filter(u => u.department === userDeptFilter)
        }

        // Filter inactive users
        if (showActiveOnly) {
            users = users.filter(u => u.total_activity > 0 || u.overdue_count > 0)
        }

        // Sort
        return [...users].sort((a, b) => {
            let aVal: string | number = ''
            let bVal: string | number = ''

            switch (userSortKey) {
                case 'name':
                    aVal = `${a.first_name} ${a.last_name}`
                    bVal = `${b.first_name} ${b.last_name}`
                    break
                case 'department':
                    aVal = a.department
                    bVal = b.department
                    break
                case 'loan_count':
                    aVal = a.loan_count
                    bVal = b.loan_count
                    break
                case 'total_activity':
                    aVal = a.total_activity
                    bVal = b.total_activity
                    break
                case 'overdue_count':
                    aVal = a.overdue_count
                    bVal = b.overdue_count
                    break
            }

            if (typeof aVal === 'string') {
                return userSortAsc
                    ? aVal.localeCompare(bVal as string, 'th')
                    : (bVal as string).localeCompare(aVal, 'th')
            }
            return userSortAsc ? aVal - (bVal as number) : (bVal as number) - aVal
        })
    }, [data?.userStats, userDeptFilter, showActiveOnly, userSortKey, userSortAsc])

    // Export user stats to CSV
    const exportUserStatsCSV = () => {
        if (!filteredUsers.length) return
        exportToCSV({
            filename: 'รายงานผู้ใช้',
            headers: ['ลำดับ', 'ชื่อ-สกุล', 'อีเมล', 'สาขาวิชา', 'จำนวนครั้งที่ยืม', 'จำนวนครั้งที่จอง', 'รวมกิจกรรม', 'เกินกำหนด'],
            rows: filteredUsers.map((user, index) => [
                index + 1,
                `${user.first_name} ${user.last_name}`.trim() || '-',
                user.email,
                user.department,
                user.loan_count,
                user.reservation_count,
                user.total_activity,
                user.overdue_count
            ])
        })
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Department Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600">สาขาวิชา:</label>
                        <select
                            value={userDeptFilter}
                            onChange={(e) => setUserDeptFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="all">ทั้งหมด</option>
                            {(data?.departments ?? []).map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600">เรียงตาม:</label>
                        <select
                            value={userSortKey}
                            onChange={(e) => setUserSortKey(e.target.value as UserSortKey)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="loan_count">จำนวนครั้งที่ยืม</option>
                            <option value="total_activity">รวมกิจกรรม</option>
                            <option value="overdue_count">เกินกำหนด</option>
                            <option value="name">ชื่อ</option>
                            <option value="department">สาขาวิชา</option>
                        </select>
                        <button
                            onClick={() => setUserSortAsc(!userSortAsc)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors font-medium text-gray-700 bg-white"
                        >
                            {userSortAsc ? '↑ น้อย-มาก' : '↓ มาก-น้อย'}
                        </button>
                    </div>
                </div>

                {/* Active Only Filter Toggle */}
                <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showActiveOnly}
                            onChange={(e) => setShowActiveOnly(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-2.5 text-sm font-medium text-gray-700">แสดงเฉพาะผู้ใช้ที่มีความเคลื่อนไหว</span>
                    </label>
                </div>
            </div>

            {/* Summary by Department */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
                    <p className="text-sm text-blue-700">ผู้ใช้ทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {filteredUsers.reduce((sum, u) => sum + u.loan_count, 0)}
                    </p>
                    <p className="text-sm text-green-700">ยืมทั้งหมด</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                        {filteredUsers.reduce((sum, u) => sum + u.reservation_count, 0)}
                    </p>
                    <p className="text-sm text-purple-700">จองทั้งหมด</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                        {filteredUsers.filter(u => u.overdue_count > 0).length}
                    </p>
                    <p className="text-sm text-red-700">คืนล่าช้า</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        รายชื่อผู้ใช้ ({filteredUsers.length} คน)
                    </h3>
                    <button
                        onClick={exportUserStatsCSV}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลำดับ</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อ-สกุล</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">อีเมล</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สาขาวิชา</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">ยืม</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">จอง</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">เกินกำหนด</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">อุปกรณ์ที่ยืม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        ไม่มีข้อมูลผู้ใช้
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedUser(user)
                                            setIsUserModalOpen(true)
                                        }}
                                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative border border-gray-200">
                                                    {user.avatar_url ? (
                                                        <Image src={user.avatar_url} alt="" fill sizes="32px" className="object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="group-hover:text-blue-600 transition-colors font-semibold">
                                                    {`${user.first_name} ${user.last_name}`.trim() || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-green-600">{user.loan_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-purple-600">{user.reservation_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.overdue_count > 0 ? (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {user.overdue_count} ครั้ง
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedUser(user)
                                                    setIsUserModalOpen(true)
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all shadow-sm"
                                                title="คลิกเพื่อดูรายการอุปกรณ์ที่เคยยืม"
                                            >
                                                <Package className="w-3.5 h-3.5" />
                                                <span>ดูอุปกรณ์</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Borrow History Modal */}
            <UserBorrowHistoryModal
                isOpen={isUserModalOpen}
                onClose={() => {
                    setIsUserModalOpen(false)
                    setSelectedUser(null)
                }}
                user={selectedUser}
            />
        </div>
    )
}
