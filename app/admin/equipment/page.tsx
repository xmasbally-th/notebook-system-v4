'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials, getSupabaseBrowserClient } from '@/lib/supabase-helpers'
import { Database } from '@/supabase/types'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    Plus, Edit, Trash2, Search, Package,
    CheckCircle, Users, Wrench, Archive,
    AlertTriangle, Filter, ChevronDown, Copy, Layers
} from 'lucide-react'
import BatchAddModal from '@/components/admin/BatchAddModal'

type Equipment = Database['public']['Tables']['equipment']['Row']
type EquipmentType = Database['public']['Tables']['equipment_types']['Row']

const STATUS_CONFIG = {
    ready: { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    borrowed: { label: 'ถูกยืม', color: 'bg-blue-100 text-blue-700', icon: Users },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
    retired: { label: 'เลิกใช้งาน', color: 'bg-gray-100 text-gray-600', icon: Archive },
    // Legacy statuses for compatibility
    active: { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    lost: { label: 'สูญหาย', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export default function AdminEquipmentList() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [selectedType, setSelectedType] = useState('all')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showBatchModal, setShowBatchModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Fetch equipment with type relation using direct fetch
    const { data: equipment, isLoading } = useQuery({
        queryKey: ['equipment'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            // Get user's access token for RLS
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            const response = await fetch(
                `${url}/rest/v1/equipment?select=*,equipment_types(id,name,icon)&order=created_at.desc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json() as Promise<(Equipment & { equipment_types?: EquipmentType })[]>
        }
    })

    // Fetch equipment types for filter using direct fetch
    const { data: equipmentTypes } = useQuery({
        queryKey: ['equipment-types'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            // Get user's access token for RLS
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            const response = await fetch(
                `${url}/rest/v1/equipment_types?select=*&order=name.asc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json() as Promise<EquipmentType[]>
        }
    })

    // Delete mutation using direct fetch with user auth
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { url, key } = getSupabaseCredentials()

            // Get user's access token for RLS
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.access_token) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            const response = await fetch(`${url}/rest/v1/equipment?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (!response.ok) throw new Error('Failed to delete')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] })
            setDeleteId(null)
        }
    })

    // Filter and search
    const filteredItems = useMemo(() => {
        if (!equipment) return []

        return equipment.filter(item => {
            // Get status from status_new or status
            const itemStatus = (item as any).status_new || item.status

            // Search filter
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchLower) ||
                item.equipment_number.toLowerCase().includes(searchLower) ||
                ((item as any).brand || '').toLowerCase().includes(searchLower) ||
                ((item as any).model || '').toLowerCase().includes(searchLower)

            // Status filter
            const matchesStatus = selectedStatus === 'all' || itemStatus === selectedStatus

            // Type filter
            const matchesType = selectedType === 'all' || (item as any).equipment_type_id === selectedType

            return matchesSearch && matchesStatus && matchesType
        })
    }, [equipment, searchTerm, selectedStatus, selectedType])

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    // Stats
    const stats = useMemo(() => {
        if (!equipment) return { total: 0, ready: 0, borrowed: 0, maintenance: 0 }
        return {
            total: equipment.length,
            ready: equipment.filter(e => ((e as any).status_new || e.status) === 'ready' || ((e as any).status_new || e.status) === 'active').length,
            borrowed: equipment.filter(e => ((e as any).status_new || e.status) === 'borrowed').length,
            maintenance: equipment.filter(e => ((e as any).status_new || e.status) === 'maintenance').length,
        }
    }, [equipment])

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id)
        } catch (err: any) {
            alert('ไม่สามารถลบได้: ' + err.message)
        }
    }

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedStatus, selectedType])

    return (
        <AdminLayout title="จัดการอุปกรณ์" subtitle="เพิ่ม แก้ไข และจัดการอุปกรณ์ทั้งหมด">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">อุปกรณ์ทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
                            <p className="text-xs text-gray-500">พร้อมใช้งาน</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{stats.borrowed}</p>
                            <p className="text-xs text-gray-500">ถูกยืม</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Wrench className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                            <p className="text-xs text-gray-500">ซ่อมบำรุง</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header & Filters */}
                <div className="p-4 border-b border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">รายการอุปกรณ์</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBatchModal(true)}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                            >
                                <Layers className="w-4 h-4" />
                                เพิ่มหลายตัว
                            </button>
                            <Link
                                href="/admin/equipment/new"
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                เพิ่มอุปกรณ์
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, หมายเลข, ยี่ห้อ..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="all">ทุกประเภท</option>
                            {equipmentTypes?.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="ready">พร้อมใช้งาน</option>
                            <option value="borrowed">ถูกยืม</option>
                            <option value="maintenance">ซ่อมบำรุง</option>
                            <option value="retired">เลิกใช้งาน</option>
                        </select>
                    </div>
                </div>

                {/* Loading & Empty States */}
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
                ) : paginatedItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่พบอุปกรณ์ที่ค้นหา</p>
                        {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' ? (
                            <button
                                onClick={() => {
                                    setSearchTerm('')
                                    setSelectedStatus('all')
                                    setSelectedType('all')
                                }}
                                className="text-blue-600 hover:underline text-sm mt-2"
                            >
                                ล้างตัวกรอง
                            </button>
                        ) : (
                            <Link href="/admin/equipment/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                                + เพิ่มอุปกรณ์แรก
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยี่ห้อ/รุ่น</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedItems.map((item) => {
                                        const itemStatus = ((item as any).status_new || item.status) as keyof typeof STATUS_CONFIG
                                        const statusConfig = STATUS_CONFIG[itemStatus] || STATUS_CONFIG.ready
                                        const StatusIcon = statusConfig.icon

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                            {(item.images as any)?.[0] ? (
                                                                <img
                                                                    src={(item.images as any)[0]}
                                                                    alt={item.name}
                                                                    className="h-12 w-12 object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-12 w-12 flex items-center justify-center text-2xl">
                                                                    {(item as any).equipment_types?.icon || '📦'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{item.equipment_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{(item as any).brand || '-'}</div>
                                                    <div className="text-xs text-gray-500">{(item as any).model || ''}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">
                                                        {(item as any).equipment_types?.icon} {(item as any).equipment_types?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/admin/equipment/new?clone=${item.id}`}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="สร้างสำเนา"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/equipment/${item.id}`}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteId(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden p-4 space-y-3">
                            {paginatedItems.map((item) => {
                                const itemStatus = ((item as any).status_new || item.status) as keyof typeof STATUS_CONFIG
                                const statusConfig = STATUS_CONFIG[itemStatus] || STATUS_CONFIG.ready
                                const StatusIcon = statusConfig.icon

                                return (
                                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            {/* Image */}
                                            <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                                {(item.images as any)?.[0] ? (
                                                    <img
                                                        src={(item.images as any)[0]}
                                                        alt={item.name}
                                                        className="h-16 w-16 object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 flex items-center justify-center text-2xl bg-white">
                                                        {(item as any).equipment_types?.icon || '📦'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                                                        <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                                                    </div>
                                                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span className="hidden sm:inline">{statusConfig.label}</span>
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    {((item as any).brand || (item as any).model) && (
                                                        <span>{(item as any).brand} {(item as any).model}</span>
                                                    )}
                                                    <span>{(item as any).equipment_types?.icon} {(item as any).equipment_types?.name || '-'}</span>
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-3 flex gap-2">
                                                    <Link
                                                        href={`/admin/equipment/new?clone=${item.id}`}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/equipment/${item.id}`}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        แก้ไข
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteId(item.id)}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {filteredItems.length > 0 && (
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
                            <span>รายการ | {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} จาก {filteredItems.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                ก่อนหน้า
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1
                                    if (totalPages > 5) {
                                        if (currentPage > 3) pageNum = currentPage - 2 + i
                                        if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
                <Link
                    href="/admin/equipment-types"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                    <Filter className="w-4 h-4" />
                    จัดการประเภทอุปกรณ์
                </Link>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">ยืนยันการลบอุปกรณ์</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            คุณต้องการลบอุปกรณ์นี้หรือไม่? การดำเนินการนี้ไม่สามารถเลิกทำได้
                            และอาจส่งผลกระทบต่อประวัติการยืม
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบอุปกรณ์'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Add Modal */}
            <BatchAddModal
                isOpen={showBatchModal}
                onClose={() => setShowBatchModal(false)}
            />
        </AdminLayout>
    )
}
