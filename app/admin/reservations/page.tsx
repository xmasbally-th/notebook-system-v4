'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useToast } from '@/components/ui/toast'
import { Loader2, AlertTriangle, CalendarPlus, Ban, ArrowRightCircle } from 'lucide-react'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'

import {
    getReservationsAction,
    approveReservationAction,
    rejectReservationAction,
    markReadyReservationAction,
    adminUpdateReservationAction,
    adminForceCancelReservationAction,
    adminDeleteReservationAction,
    convertReservationToLoanAction,
    type ReservationItemData
} from './actions'

import ReservationStatsCards from '@/components/reservations/ReservationStatsCards'
import ReservationFilterBar from '@/components/reservations/ReservationFilterBar'
import ReservationItem from '@/components/reservations/ReservationItem'
import {
    RejectModal,
    EditModal,
    DeleteModal,
    ConfirmActionModal,
    ConflictDetailModal
} from '@/components/reservations/ReservationModals'
import type { BookingConflictInfo } from '@/lib/domain'

export default function AdminReservationsPage() {
    const toast = useToast()
    const queryClient = useQueryClient()

    // Filter & Pagination State
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Modals State
    const [rejectModalItem, setRejectModalItem] = useState<ReservationItemData | null>(null)
    const [editModalItem, setEditModalItem] = useState<ReservationItemData | null>(null)
    const [deleteModalItem, setDeleteModalItem] = useState<ReservationItemData | null>(null)
    const [conflictInfo, setConflictInfo] = useState<BookingConflictInfo | null>(null)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean
        title: string
        description: string
        confirmText: string
        confirmColor: 'blue' | 'purple' | 'orange' | 'red'
        icon?: any
        onConfirm: () => void
    }>({
        isOpen: false,
        title: '',
        description: '',
        confirmText: 'ยืนยัน',
        confirmColor: 'blue',
        onConfirm: () => {}
    })

    const [processingId, setProcessingId] = useState<string | null>(null)

    // Realtime Sync: Invalidate when reservations table changes
    useRealtimeInvalidator(['reservations'], [['admin-reservations']])

    // Fetch Reservations & Global Stats in a single server action roundtrip
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-reservations', statusFilter, searchTerm, currentPage, pageSize],
        queryFn: () => getReservationsAction({
            status: statusFilter,
            search: searchTerm,
            page: currentPage,
            pageSize
        }),
        staleTime: 15000
    })

    const reservations = data?.items || []
    const stats = data?.stats
    const totalPages = data?.totalPages || 1
    const totalItems = data?.total || 0

    // Filter change handler (resets page to 1)
    const handleStatusChange = (newStatus: string) => {
        setStatusFilter(newStatus)
        setCurrentPage(1)
    }

    const handleSearchChange = (newSearch: string) => {
        setSearchTerm(newSearch)
        setCurrentPage(1)
    }

    // Workflow: Approve
    const handleApprove = async (id: string) => {
        setProcessingId(id)
        const result = await approveReservationAction(id)
        setProcessingId(null)

        if (result.success) {
            toast.success('อนุมัติการจองเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาดในการอนุมัติ')
        }
    }

    // Workflow: Reject
    const handleRejectConfirm = async (id: string, reason: string) => {
        setProcessingId(id)
        const result = await rejectReservationAction(id, reason)
        setProcessingId(null)
        setRejectModalItem(null)

        if (result.success) {
            toast.success('ปฏิเสธการจองเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาดในการปฏิเสธ')
        }
    }

    // Workflow: Mark Ready
    const handleMarkReady = async (id: string) => {
        setProcessingId(id)
        const result = await markReadyReservationAction(id)
        setProcessingId(null)

        if (result.success) {
            toast.success('เปลี่ยนสถานะเป็น "พร้อมรับ" แล้ว')
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาด')
        }
    }

    // Workflow: Convert to Loan
    const handleConvertToLoan = (reservation: ReservationItemData) => {
        const borrowerName = reservation.profiles
            ? `${reservation.profiles.first_name || ''} ${reservation.profiles.last_name || ''}`.trim()
            : 'ผู้ใช้'

        setConfirmModal({
            isOpen: true,
            title: 'แปลงการจองเป็นคำขอยืมใช้งาน',
            description: `ยืนยันส่งมอบอุปกรณ์ ${reservation.equipment?.name} ให้คุณ ${borrowerName} และสร้างประวัติการยืมในระบบ?`,
            confirmText: 'ยืนยันแปลงเป็นการยืม',
            confirmColor: 'purple',
            icon: ArrowRightCircle,
            onConfirm: async () => {
                setProcessingId(reservation.id)
                setConfirmModal(prev => ({ ...prev, isOpen: false }))
                const result = await convertReservationToLoanAction(reservation.id)
                setProcessingId(null)

                if (result.success) {
                    toast.success('แปลงเป็นคำขอยืมเรียบร้อยแล้ว (สถานะอุปกรณ์: ถูกยืม)')
                    queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
                    queryClient.invalidateQueries({ queryKey: ['staff-loan-requests'] })
                } else {
                    toast.error(result.error || 'ไม่สามารถแปลงเป็นการยืมได้')
                }
            }
        })
    }

    // Admin Action: Edit
    const handleEditSave = async (editData: any) => {
        setProcessingId(editData.reservationId)
        const result = await adminUpdateReservationAction(editData)
        setProcessingId(null)

        if (result.success) {
            toast.success('แก้ไขข้อมูลการจองเรียบร้อยแล้ว')
            setEditModalItem(null)
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
        } else {
            toast.error(result.error || 'เกิดข้อผิดพลาดในการบันทึก')
        }
    }

    // Admin Action: Force Cancel
    const handleForceCancel = (reservation: ReservationItemData) => {
        setConfirmModal({
            isOpen: true,
            title: 'บังคับยกเลิกการจอง (Admin)',
            description: `ยืนยันยกเลิกการจองอุปกรณ์ ${reservation.equipment?.name} นี้หรือไม่? อุปกรณ์จะถูกคืนสถานะเป็นพร้อมใช้งานทันที`,
            confirmText: 'ยืนยันยกเลิกการจอง',
            confirmColor: 'orange',
            icon: Ban,
            onConfirm: async () => {
                setProcessingId(reservation.id)
                setConfirmModal(prev => ({ ...prev, isOpen: false }))
                const result = await adminForceCancelReservationAction(reservation.id)
                setProcessingId(null)

                if (result.success) {
                    toast.success('ยกเลิกการจองเรียบร้อยแล้ว')
                    queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
                } else {
                    toast.error(result.error || 'เกิดข้อผิดพลาด')
                }
            }
        })
    }

    // Admin Action: Delete
    const handleDeleteConfirm = async (id: string) => {
        setProcessingId(id)
        const result = await adminDeleteReservationAction(id)
        setProcessingId(null)
        setDeleteModalItem(null)

        if (result.success) {
            toast.success('ลบการจองออกจากระบบเรียบร้อยแล้ว')
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
        } else {
            toast.error(result.error || 'ไม่สามารถลบการจองได้')
        }
    }

    return (
        <>
            <AdminPageHeader
                title="จัดการการจอง"
                subtitle="ดูแลและจัดการการจองอุปกรณ์ล่วงหน้าทั้งหมดในระบบ (Admin)"
            />

            {/* Stats Cards (Global counts, immune to table filter) */}
            <ReservationStatsCards
                stats={stats}
                isLoading={isLoading}
                isAdmin={true}
            />

            {/* Main Content Box */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden mb-8">
                {/* Filter & Search Bar */}
                <ReservationFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    statusFilter={statusFilter}
                    onStatusChange={handleStatusChange}
                    isAdmin={true}
                    exportItems={reservations}
                />

                {/* Content Table / List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                        <span className="text-sm">กำลังโหลดข้อมูลการจอง...</span>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
                        <p className="text-red-600 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                        <p className="text-xs text-gray-400 mt-1">{(error as any)?.message}</p>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="p-16 text-center">
                        <CalendarPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">ไม่มีรายการจองตามเงื่อนไขที่เลือก</p>
                        <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
                    </div>
                ) : (
                    <div>
                        {reservations.map((reservation) => (
                            <ReservationItem
                                key={reservation.id}
                                reservation={reservation}
                                isAdmin={true}
                                processingId={processingId}
                                onApprove={handleApprove}
                                onReject={(r) => setRejectModalItem(r)}
                                onMarkReady={handleMarkReady}
                                onConvertToLoan={handleConvertToLoan}
                                onEdit={(r) => setEditModalItem(r)}
                                onForceCancel={handleForceCancel}
                                onDelete={(r) => setDeleteModalItem(r)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalItems > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>แสดง</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>รายการต่อหน้า | รายการที่ {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} จากทั้งหมด {totalItems}</span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ก่อนหน้า
                                </button>
                                <span className="px-3 py-1.5 text-xs text-gray-600 font-medium">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <RejectModal
                isOpen={!!rejectModalItem}
                reservation={rejectModalItem}
                isProcessing={processingId === rejectModalItem?.id}
                onClose={() => setRejectModalItem(null)}
                onConfirm={handleRejectConfirm}
            />

            <EditModal
                isOpen={!!editModalItem}
                reservation={editModalItem}
                isProcessing={processingId === editModalItem?.id}
                onClose={() => setEditModalItem(null)}
                onSave={handleEditSave}
            />

            <DeleteModal
                isOpen={!!deleteModalItem}
                reservation={deleteModalItem}
                isProcessing={processingId === deleteModalItem?.id}
                onClose={() => setDeleteModalItem(null)}
                onConfirm={handleDeleteConfirm}
            />

            <ConfirmActionModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                confirmColor={confirmModal.confirmColor}
                icon={confirmModal.icon}
                isProcessing={!!processingId}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
            />

            <ConflictDetailModal
                isOpen={!!conflictInfo}
                conflictInfo={conflictInfo}
                onClose={() => setConflictInfo(null)}
                role="admin"
            />
        </>
    )
}
