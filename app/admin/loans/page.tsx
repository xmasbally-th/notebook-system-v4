'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useState, useMemo } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    ClipboardList, CheckCircle, XCircle, Clock,
    Search, Filter, AlertTriangle, User, Package,
    Calendar, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'

const STATUS_CONFIG = {
    pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700', icon: XCircle },
    returned: { label: 'คืนแล้ว', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
}

export default function LoanRequestsPage() {
    // Enable Realtime Updates
    // Enable Realtime Updates
    // useRealtimeInvalidator(['loanRequests'], [['loan-requests']])
    const queryClient = useQueryClient()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Fetch loans with relations using direct fetch
    const { data: requests, isLoading, error } = useQuery({
        queryKey: ['loan-requests'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            // Get user's access token for RLS
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            const response = await fetch(
                `${url}/rest/v1/loanRequests?select=*,profiles(first_name,last_name,email),equipment(name,equipment_number,images)&order=created_at.desc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        }
    })

    // Bulk Action Mutation using direct fetch with user auth
    const updateStatusMutation = useMutation({
        mutationFn: async ({ ids, status }: { ids: string[], status: 'approved' | 'rejected' }) => {
            const { url, key } = getSupabaseCredentials()

            // Get user's access token for RLS
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.access_token) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            // Update each ID individually for better compatibility
            for (const id of ids) {
                const response = await fetch(`${url}/rest/v1/loanRequests?id=eq.${id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                })
                if (!response.ok) throw new Error('Failed to update')
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
            setSelectedIds([])
        }
    })

    // Filter and search
    const filteredItems = useMemo(() => {
        if (!requests) return []

        return requests.filter((item: any) => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                (item.profiles?.first_name || '').toLowerCase().includes(searchLower) ||
                (item.profiles?.last_name || '').toLowerCase().includes(searchLower) ||
                (item.profiles?.email || '').toLowerCase().includes(searchLower) ||
                (item.equipment?.name || '').toLowerCase().includes(searchLower) ||
                (item.equipment?.equipment_number || '').toLowerCase().includes(searchLower)

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [requests, searchTerm, statusFilter])

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    // Stats
    const stats = useMemo(() => {
        if (!requests) return { total: 0, pending: 0, approved: 0, rejected: 0 }
        return {
            total: requests.length,
            pending: requests.filter((r: any) => r.status === 'pending').length,
            approved: requests.filter((r: any) => r.status === 'approved').length,
            rejected: requests.filter((r: any) => r.status === 'rejected').length,
        }
    }, [requests])

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleBulkAction = (status: 'approved' | 'rejected') => {
        if (confirm(`ยืนยันการ${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ${selectedIds.length} คำขอ?`)) {
            updateStatusMutation.mutate({ ids: selectedIds, status })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <AdminLayout title="คำขอยืมอุปกรณ์" subtitle="จัดการคำขอยืมและคืนอุปกรณ์ทั้งหมด">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">คำขอทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            <p className="text-xs text-gray-500">รออนุมัติ</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            <p className="text-xs text-gray-500">อนุมัติแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                            <p className="text-xs text-gray-500">ปฏิเสธ</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header & Filters */}
                <div className="p-4 border-b border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">รายการคำขอยืม</h2>
                        <div className="flex gap-2">
                            <button
                                disabled={selectedIds.length === 0 || updateStatusMutation.isPending}
                                onClick={() => handleBulkAction('approved')}
                                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 hover:bg-green-700 text-sm font-medium"
                            >
                                <CheckCircle className="w-4 h-4" />
                                อนุมัติ ({selectedIds.length})
                            </button>
                            <button
                                disabled={selectedIds.length === 0 || updateStatusMutation.isPending}
                                onClick={() => handleBulkAction('rejected')}
                                className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 hover:bg-red-700 text-sm font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                ปฏิเสธ ({selectedIds.length})
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อผู้ยืม, อุปกรณ์..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="pending">รออนุมัติ</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="rejected">ปฏิเสธ</option>
                            <option value="returned">คืนแล้ว</option>
                        </select>
                    </div>
                </div>

                {/* Loading & Empty & Error States */}
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-300 mb-3" />
                        <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                        <p className="text-sm text-gray-500 mt-1">กรุณาลองใหม่อีกครั้ง</p>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่พบคำขอยืม</p>
                        {(searchTerm || statusFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('')
                                    setStatusFilter('all')
                                }}
                                className="text-blue-600 hover:underline text-sm mt-2"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(paginatedItems
                                                            .filter((r: any) => r.status === 'pending')
                                                            .map((r: any) => r.id))
                                                    } else {
                                                        setSelectedIds([])
                                                    }
                                                }}
                                                checked={paginatedItems.filter((r: any) => r.status === 'pending').length > 0 &&
                                                    selectedIds.length === paginatedItems.filter((r: any) => r.status === 'pending').length}
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ยืม</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ยืม-คืน</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เหตุผล</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedItems.map((request: any) => {
                                        const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
                                        const StatusIcon = statusConfig.icon
                                        const canSelect = request.status === 'pending'

                                        return (
                                            <tr key={request.id} className={`hover:bg-gray-50 ${selectedIds.includes(request.id) ? 'bg-blue-50' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                        disabled={!canSelect}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                            {request.profiles?.avatar_url ? (
                                                                <img src={request.profiles.avatar_url} alt="" className="w-8 h-8 object-cover" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.profiles?.first_name} {request.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{request.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                            {request.equipment?.images?.[0] ? (
                                                                <img src={request.equipment.images[0]} alt="" className="w-10 h-10 object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{request.equipment?.name || '-'}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{request.equipment?.equipment_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(request.start_date)}</span>
                                                        <ArrowUpRight className="w-3 h-3 text-gray-400" />
                                                        <span>{formatDate(request.end_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-gray-600 truncate max-w-[200px]" title={request.reason}>
                                                        {request.reason || '-'}
                                                    </p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden p-4 space-y-3">
                            {paginatedItems.map((request: any) => {
                                const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
                                const StatusIcon = statusConfig.icon
                                const canSelect = request.status === 'pending'

                                return (
                                    <div
                                        key={request.id}
                                        className={`bg-gray-50 rounded-xl p-4 border ${selectedIds.includes(request.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}
                                    >
                                        {/* Header with checkbox and status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {canSelect && (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                    />
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {request.profiles?.avatar_url ? (
                                                        <img src={request.profiles.avatar_url} alt="" className="w-8 h-8 object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {request.profiles?.first_name} {request.profiles?.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{request.profiles?.email}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                <span className="hidden sm:inline">{statusConfig.label}</span>
                                            </span>
                                        </div>

                                        {/* Equipment Info */}
                                        <div className="flex items-center gap-3 mb-3 bg-white rounded-lg p-2">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {request.equipment?.images?.[0] ? (
                                                    <img src={request.equipment.images[0]} alt="" className="w-12 h-12 object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{request.equipment?.name || '-'}</p>
                                                <p className="text-xs text-gray-500 font-mono">{request.equipment?.equipment_number}</p>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                                            </div>
                                            {request.reason && (
                                                <p className="text-gray-500 text-xs line-clamp-2">{request.reason}</p>
                                            )}
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
        </AdminLayout>
    )
}
