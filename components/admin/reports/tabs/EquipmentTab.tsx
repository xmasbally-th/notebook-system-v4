'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { ReportData } from '@/hooks/useReportData'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { formatThaiDate } from '@/lib/formatThaiDate'
import { getDueDate } from '@/lib/reportDataProcessors'
import {
    Package,
    CheckCircle2,
    Clock,
    Wrench,
    X,
    Loader2,
    User,
    ArrowRight,
    History,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Filter,
    FileText,
    Building
} from 'lucide-react'

interface EquipmentTabProps {
    data: ReportData | undefined
    isLoading: boolean
    dateRange?: { from: Date; to: Date }
}

interface BorrowRecord {
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
    profiles: {
        first_name: string
        last_name: string
        email: string
        avatar_url: string | null
        department?: { name: string } | string | null
    } | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    ready: { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    active: { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    borrowed: { label: 'ถูกยืม', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Wrench },
    retired: { label: 'เลิกใช้งาน', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
}

const CONDITION_MAP: Record<string, { label: string; color: string }> = {
    good: { label: 'ปกติ', color: 'bg-green-100 text-green-700 border-green-200' },
    damaged: { label: 'ชำรุด', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    missing_parts: { label: 'อุปกรณ์ไม่ครบ', color: 'bg-red-100 text-red-700 border-red-200' }
}

// ==========================================
// BorrowHistoryModal
// ==========================================
function BorrowHistoryModal({
    isOpen,
    onClose,
    equipment,
    dateRange
}: {
    isOpen: boolean
    onClose: () => void
    equipment: { id: string; name: string; equipment_number: string; status: string } | null
    dateRange?: { from: Date; to: Date }
}) {
    const [records, setRecords] = useState<BorrowRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned'>('all')
    const [filterByDateRange, setFilterByDateRange] = useState(false)
    const ITEMS_PER_PAGE = 8

    const fetchHistory = useCallback(async () => {
        if (!equipment) return
        setLoading(true)
        setError(null)

        try {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) throw new Error('Missing credentials')

            const { createBrowserClient } = await import('@supabase/ssr')
            const supabase = createBrowserClient(url, key)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Not authenticated')

            const query = `${url}/rest/v1/loanRequests?select=id,status,created_at,start_date,end_date,return_time,returned_at,return_condition,return_notes,purpose,profiles!fk_loanrequests_profiles(first_name,last_name,email,avatar_url,department:departments(name))&equipment_id=eq.${equipment.id}&order=created_at.desc`

            const res = await fetch(query, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setRecords(Array.isArray(data) ? data : [])
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการโหลดประวัติ')
        } finally {
            setLoading(false)
        }
    }, [equipment])

    useEffect(() => {
        if (isOpen && equipment) {
            setCurrentPage(1)
            setStatusFilter('all')
            setFilterByDateRange(false)
            fetchHistory()
        }
        return () => {
            setRecords([])
            setError(null)
            setCurrentPage(1)
        }
    }, [isOpen, equipment, fetchHistory])

    // Filter records based on active status filter and date range toggle
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const dueDate = getDueDate(record.end_date, record.return_time)

            // Status filter
            if (statusFilter === 'active' && record.status !== 'approved') return false
            if (statusFilter === 'returned' && record.status !== 'returned') return false

            // Optional Date range filter
            if (filterByDateRange && dateRange) {
                const borrowDate = record.start_date ? new Date(record.start_date) : new Date(record.created_at)
                const isWithinRange = borrowDate <= dateRange.to && (
                    record.returned_at ? new Date(record.returned_at) >= dateRange.from : dueDate >= dateRange.from
                )
                // Always show active borrowings even if dateRange filter is enabled
                if (!isWithinRange && record.status !== 'approved') return false
            }

            return true
        })
    }, [records, statusFilter, filterByDateRange, dateRange])

    if (!isOpen || !equipment) return null

    const statusConfig = STATUS_MAP[equipment.status] || STATUS_MAP.ready

    const getDepartmentName = (dept: any): string => {
        if (!dept) return ''
        if (typeof dept === 'string') return dept
        if (typeof dept === 'object') return dept.name || dept.label || ''
        return ''
    }

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
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <History className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">ประวัติการใช้งานอุปกรณ์</h2>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 truncate">{equipment.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-mono bg-white/80 px-2 py-0.5 rounded-md text-gray-600 border border-gray-200">
                                #{equipment.equipment_number}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                {statusConfig.label}
                            </span>
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
                    {/* Status Tabs */}
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

                    {/* Date range toggle */}
                    {dateRange && (
                        <button
                            onClick={() => { setFilterByDateRange(!filterByDateRange); setCurrentPage(1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${filterByDateRange ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {filterByDateRange ? 'กรองตามช่วงวันที่เลือก' : 'ประวัติทั้งหมด'}
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-500">กำลังโหลดข้อมูลประวัติ...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Package className="w-12 h-12 text-gray-200" />
                            <p className="text-gray-500 font-medium">ไม่พบประวัติการยืมอุปกรณ์</p>
                            <p className="text-xs text-gray-400">
                                {filterByDateRange ? 'ลองปิดตัวกรองช่วงวันที่เพื่อดูประวัติทั้งหมด' : 'อุปกรณ์นี้ยังไม่มีประวัติการยืม'}
                            </p>
                        </div>
                    ) : (() => {
                        const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
                        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
                        const paginatedRecords = filteredRecords.slice(startIdx, startIdx + ITEMS_PER_PAGE)

                        return (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500 mb-2">
                                    แสดง {filteredRecords.length} รายการ
                                    {totalPages > 1 && ` • หน้า ${currentPage}/${totalPages}`}
                                </p>
                                {paginatedRecords.map((record) => {
                                    const userName = record.profiles
                                        ? `${record.profiles.first_name || ''} ${record.profiles.last_name || ''}`.trim()
                                        : 'ไม่ทราบ'
                                    const deptName = record.profiles ? getDepartmentName(record.profiles.department) : ''
                                    const dueDate = getDueDate(record.end_date, record.return_time)
                                    const isOverdue = record.status === 'approved' && new Date() > dueDate
                                    const isReturned = record.status === 'returned'
                                    const conditionConfig = record.return_condition ? CONDITION_MAP[record.return_condition] : null

                                    const borrowDateStr = record.start_date || record.created_at

                                    return (
                                        <div
                                            key={record.id}
                                            className="group bg-white hover:bg-gray-50/80 rounded-xl p-4 transition-all duration-200 border border-gray-200 shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    {record.profiles?.avatar_url ? (
                                                        <div className="w-10 h-10 rounded-full relative overflow-hidden border-2 border-white shadow-sm">
                                                            <Image
                                                                src={record.profiles.avatar_url}
                                                                alt={userName}
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                            <User className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 truncate">
                                                            <p className="font-semibold text-gray-900 text-sm truncate">{userName}</p>
                                                            {deptName && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex-shrink-0">
                                                                    <Building className="w-3 h-3 text-gray-400" />
                                                                    {deptName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {isReturned ? (
                                                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                                    คืนแล้ว
                                                                </span>
                                                            ) : isOverdue ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    เกินกำหนด
                                                                </span>
                                                            ) : record.status === 'approved' ? (
                                                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                                    กำลังยืม
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                                    {record.status}
                                                                </span>
                                                            )}

                                                            {conditionConfig && (
                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${conditionConfig.color}`}>
                                                                    {conditionConfig.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {record.profiles?.email && (
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{record.profiles.email}</p>
                                                    )}

                                                    {/* Dates */}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                            <span className="font-medium text-gray-700">วันที่ยืม:</span>
                                                            {formatThaiDate(borrowDateStr)}
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                            <span className="font-medium text-gray-700">กำหนดคืน:</span>
                                                            {formatThaiDate(record.end_date)}
                                                        </span>
                                                        {record.returned_at && (
                                                            <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                <span>คืนจริง:</span>
                                                                {formatThaiDate(record.returned_at)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Purpose or Notes */}
                                                    {record.purpose && (
                                                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                                            <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <span className="font-medium text-gray-600">วัตถุประสงค์:</span> {record.purpose}
                                                        </p>
                                                    )}
                                                    {record.return_notes && (
                                                        <p className="text-xs text-amber-700 mt-1 flex items-start gap-1 bg-amber-50/60 px-2 py-1 rounded border border-amber-100">
                                                            <span className="font-semibold">หมายเหตุการคืน:</span> {record.return_notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Pagination Controls */}
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
                        )
                    })()}
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

// ==========================================
// Main EquipmentTab
// ==========================================
export default function EquipmentTab({ data, isLoading, dateRange: parentDateRange }: EquipmentTabProps) {
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
    const [selectedEquipment, setSelectedEquipment] = useState<{
        id: string; name: string; equipment_number: string; status: string
    } | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Use parent date range or default to last 30 days
    const dateRange = useMemo(() => {
        if (parentDateRange) return parentDateRange
        const to = new Date()
        to.setHours(23, 59, 59, 999)
        const from = new Date()
        from.setDate(from.getDate() - 29)
        from.setHours(0, 0, 0, 0)
        return { from, to }
    }, [parentDateRange])

    // Set of equipment IDs currently borrowed (from active loans)
    const borrowedIds = data?.borrowedEquipmentIds ?? new Set<string>()

    // Compute effective status: cross-reference DB status with active loans
    const getEffectiveStatus = useCallback((eq: { id: string; status: string }) => {
        if (borrowedIds.has(eq.id)) return 'borrowed'
        if (eq.status === 'borrowed' && !borrowedIds.has(eq.id)) return 'ready'
        return eq.status
    }, [borrowedIds])

    // Category breakdown with stats
    const categories = useMemo(() => {
        if (!data?.allEquipment || !data?.equipmentTypes) return []

        return data.equipmentTypes.map(type => {
            const items = data.allEquipment.filter(eq => eq.equipment_type_id === type.id)
            const total = items.length
            const ready = items.filter(e => { const s = getEffectiveStatus(e); return s === 'ready' || s === 'active' }).length
            const borrowed = items.filter(e => getEffectiveStatus(e) === 'borrowed').length
            const maintenance = items.filter(e => getEffectiveStatus(e) === 'maintenance').length

            return {
                id: type.id,
                name: type.name,
                icon: type.icon,
                total,
                ready,
                borrowed,
                maintenance
            }
        }).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total)
    }, [data?.allEquipment, data?.equipmentTypes, getEffectiveStatus])

    // Filter equipment by selected type
    const filteredEquipment = useMemo(() => {
        if (!selectedTypeId || !data?.allEquipment) return []
        return data.allEquipment
            .filter(eq => eq.equipment_type_id === selectedTypeId)
            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
    }, [selectedTypeId, data?.allEquipment])

    // Equipment usage counts from equipmentUsageMap (calculated for all equipment)
    const usageMap = data?.equipmentUsageMap ?? {}

    const selectedCategory = categories.find(c => c.id === selectedTypeId)

    const handleEquipmentClick = (eq: typeof filteredEquipment[0]) => {
        setSelectedEquipment({
            id: eq.id,
            name: eq.name,
            equipment_number: eq.equipment_number,
            status: getEffectiveStatus(eq)
        })
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">รายงานอุปกรณ์ตามประเภท</h3>
                <p className="text-sm text-gray-500">เลือกประเภทอุปกรณ์เพื่อดูรายละเอียดและประวัติการยืม-คืน</p>
            </div>

            {/* Equipment Type Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                    ))
                ) : categories.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        ไม่มีข้อมูลประเภทอุปกรณ์
                    </div>
                ) : (
                    categories.map(cat => {
                        const isSelected = selectedTypeId === cat.id
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedTypeId(isSelected ? null : cat.id)}
                                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 group hover:shadow-md ${isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {cat.name}
                                    </span>
                                </div>
                                <p className={`text-2xl font-extrabold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {cat.total}
                                    <span className="text-xs font-normal text-gray-500 ml-1">ชิ้น</span>
                                </p>
                                {/* Mini status dots */}
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    {cat.ready > 0 && (
                                        <span className="flex items-center gap-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {cat.ready}
                                        </span>
                                    )}
                                    {cat.borrowed > 0 && (
                                        <span className="flex items-center gap-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {cat.borrowed}
                                        </span>
                                    )}
                                    {cat.maintenance > 0 && (
                                        <span className="flex items-center gap-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            {cat.maintenance}
                                        </span>
                                    )}
                                </div>

                                {/* Selected indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        )
                    })
                )}
            </div>

            {/* Equipment List */}
            {!selectedTypeId ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Package className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">เลือกประเภทอุปกรณ์</p>
                    <p className="text-sm text-gray-400 mt-1">คลิกที่การ์ดด้านบนเพื่อดูรายการอุปกรณ์</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {/* List Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedTypeId(null)}
                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                title="กลับ"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-500" />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{selectedCategory?.icon}</span>
                                <div>
                                    <h4 className="font-bold text-gray-900">{selectedCategory?.name}</h4>
                                    <p className="text-xs text-gray-500">{filteredEquipment.length} ชิ้น</p>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> พร้อมใช้</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> ถูกยืม</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> ซ่อมบำรุง</span>
                        </div>
                    </div>

                    {/* Equipment Grid */}
                    <div className="p-4 sm:p-5">
                        {filteredEquipment.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">ไม่มีอุปกรณ์ในประเภทนี้</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredEquipment.map(eq => {
                                    const effectiveStatus = getEffectiveStatus(eq)
                                    const config = STATUS_MAP[effectiveStatus] || STATUS_MAP.ready
                                    const StatusIcon = config.icon
                                    const usage = usageMap[eq.id] || { loan_count: 0, returned_count: 0 }

                                    return (
                                        <button
                                            key={eq.id}
                                            onClick={() => handleEquipmentClick(eq)}
                                            className="text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                                                        {eq.name}
                                                    </p>
                                                    <p className="text-xs font-mono text-gray-400 mt-0.5">#{eq.equipment_number}</p>
                                                </div>
                                                <StatusIcon className={`w-4 h-4 flex-shrink-0 ml-2 ${effectiveStatus === 'borrowed' ? 'text-blue-500'
                                                    : effectiveStatus === 'maintenance' ? 'text-orange-500'
                                                        : 'text-green-500'
                                                    }`} />
                                            </div>

                                            {/* Status badge */}
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
                                                {config.label}
                                            </span>

                                            {/* Usage stats */}
                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                                                <span>ยืม <span className="font-semibold text-gray-700">{usage.loan_count}</span></span>
                                                <span>คืน <span className="font-semibold text-green-600">{usage.returned_count}</span></span>
                                            </div>

                                            {/* Click hint */}
                                            <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                <History className="w-3 h-3" />
                                                คลิกเพื่อดูประวัติ
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Borrow History Modal */}
            <BorrowHistoryModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedEquipment(null)
                }}
                equipment={selectedEquipment}
                dateRange={dateRange}
            />
        </div>
    )
}
