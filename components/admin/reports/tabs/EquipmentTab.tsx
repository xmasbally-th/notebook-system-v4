'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ReportData } from '@/hooks/useReportData'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { formatThaiDate } from '@/lib/formatThaiDate'
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
    ChevronLeft
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
    end_date: string
    returned_at: string | null
    profiles: {
        first_name: string
        last_name: string
        email: string
        avatar_url: string | null
    } | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    ready: { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    active: { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    borrowed: { label: 'ถูกยืม', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Wrench },
    retired: { label: 'เลิกใช้งาน', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
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

    const fetchHistory = useCallback(async () => {
        if (!equipment) return
        setLoading(true)
        setError(null)

        try {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) throw new Error('Missing credentials')

            // Get auth token
            const { createBrowserClient } = await import('@supabase/ssr')
            const supabase = createBrowserClient(url, key)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Not authenticated')

            let query = `${url}/rest/v1/loanRequests?select=id,status,created_at,end_date,returned_at,profiles:user_id(first_name,last_name,email,avatar_url)&equipment_id=eq.${equipment.id}&status=in.(approved,returned)&order=created_at.desc`

            if (dateRange) {
                query += `&created_at=gte.${dateRange.from.toISOString()}&created_at=lte.${dateRange.to.toISOString()}`
            }

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
            setError(err.message || 'เกิดข้อผิดพลาด')
        } finally {
            setLoading(false)
        }
    }, [equipment, dateRange])

    useEffect(() => {
        if (isOpen && equipment) {
            fetchHistory()
        }
        return () => {
            setRecords([])
            setError(null)
        }
    }, [isOpen, equipment, fetchHistory])

    if (!isOpen || !equipment) return null

    const statusConfig = STATUS_MAP[equipment.status] || STATUS_MAP.ready

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <History className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">ประวัติการยืม</h2>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{equipment.name}</p>
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Package className="w-12 h-12 text-gray-200" />
                            <p className="text-gray-500 font-medium">ไม่มีประวัติการยืมในช่วงเวลานี้</p>
                            <p className="text-xs text-gray-400">ลองเปลี่ยนช่วงวันที่ดู</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 mb-4">ทั้งหมด {records.length} รายการ</p>
                            {records.map((record) => {
                                const userName = record.profiles
                                    ? `${record.profiles.first_name || ''} ${record.profiles.last_name || ''}`.trim()
                                    : 'ไม่ทราบ'
                                const isReturned = record.status === 'returned'

                                return (
                                    <div
                                        key={record.id}
                                        className="group bg-gray-50 hover:bg-gray-100/80 rounded-xl p-4 transition-all duration-200 border border-gray-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {record.profiles?.avatar_url ? (
                                                    <img
                                                        src={record.profiles.avatar_url}
                                                        alt={userName}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                        <User className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">{userName}</p>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${isReturned
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {isReturned ? 'คืนแล้ว' : 'กำลังยืม'}
                                                    </span>
                                                </div>
                                                {record.profiles?.email && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{record.profiles.email}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                                                    <span className="inline-flex items-center gap-1">
                                                        <span className="font-medium text-gray-600">ยืม:</span>
                                                        {formatThaiDate(record.created_at)}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-gray-300 hidden sm:block" />
                                                    <span className="inline-flex items-center gap-1">
                                                        <span className="font-medium text-gray-600">กำหนดคืน:</span>
                                                        {formatThaiDate(record.end_date)}
                                                    </span>
                                                    {record.returned_at && (
                                                        <span className="inline-flex items-center gap-1 text-green-600">
                                                            <span className="font-medium">คืนจริง:</span>
                                                            {formatThaiDate(record.returned_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 sm:rounded-b-2xl">
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

    // Category breakdown with stats
    const categories = useMemo(() => {
        if (!data?.allEquipment || !data?.equipmentTypes) return []

        return data.equipmentTypes.map(type => {
            const items = data.allEquipment.filter(eq => eq.equipment_type_id === type.id)
            const total = items.length
            const ready = items.filter(e => e.status === 'ready' || e.status === 'active').length
            const borrowed = items.filter(e => e.status === 'borrowed').length
            const maintenance = items.filter(e => e.status === 'maintenance').length

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
    }, [data?.allEquipment, data?.equipmentTypes])

    // Filter equipment by selected type
    const filteredEquipment = useMemo(() => {
        if (!selectedTypeId || !data?.allEquipment) return []
        return data.allEquipment
            .filter(eq => eq.equipment_type_id === selectedTypeId)
            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
    }, [selectedTypeId, data?.allEquipment])

    // Equipment usage counts from popularEquipment
    const usageMap = useMemo(() => {
        const map: Record<string, { loan_count: number; returned_count: number }> = {}
        if (data?.popularEquipment) {
            data.popularEquipment.forEach(item => {
                map[item.id] = {
                    loan_count: item.loan_count,
                    returned_count: item.returned_count
                }
            })
        }
        return map
    }, [data?.popularEquipment])

    const selectedCategory = categories.find(c => c.id === selectedTypeId)

    const handleEquipmentClick = (eq: typeof filteredEquipment[0]) => {
        setSelectedEquipment({
            id: eq.id,
            name: eq.name,
            equipment_number: eq.equipment_number,
            status: eq.status
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
                                    const config = STATUS_MAP[eq.status] || STATUS_MAP.ready
                                    const StatusIcon = config.icon
                                    const usage = usageMap[eq.id]

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
                                                <StatusIcon className={`w-4 h-4 flex-shrink-0 ml-2 ${eq.status === 'borrowed' ? 'text-blue-500'
                                                    : eq.status === 'maintenance' ? 'text-orange-500'
                                                        : 'text-green-500'
                                                    }`} />
                                            </div>

                                            {/* Status badge */}
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
                                                {config.label}
                                            </span>

                                            {/* Usage stats */}
                                            {usage && (
                                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                                                    <span>ยืม <span className="font-semibold text-gray-700">{usage.loan_count}</span></span>
                                                    <span>คืน <span className="font-semibold text-green-600">{usage.returned_count}</span></span>
                                                </div>
                                            )}

                                            {/* Click hint */}
                                            <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
