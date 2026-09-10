'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import StaffPageHeader from '@/components/staff/StaffPageHeader'
import { useToast } from '@/components/ui/toast'
import { Loader2, AlertTriangle, CalendarPlus, ArrowRightCircle } from 'lucide-react'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'

import {
    getReservationsAction,
    approveReservationAction,
    rejectReservationAction,
    markReadyReservationAction,
    convertReservationToLoanAction,
    type ReservationItemData
} from './actions'

import ReservationStatsCards from '@/components/reservations/ReservationStatsCards'
import ReservationFilterBar from '@/components/reservations/ReservationFilterBar'
import ReservationItem from '@/components/reservations/ReservationItem'
import { RejectModal, ConfirmActionModal, ConflictDetailModal } from '@/components/reservations/ReservationModals'

export default function StaffReservationsPage() {
    const toast = useToast()
    const queryClient = useQueryClient()

    // Filter & Pagination State (Staff starts at 'pending' to focus on pending tasks)
    const [statusFilter, setStatusFilter] = useState('pending')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Modals & Action State
    const [rejectModalItem, setRejectModalItem] = useState<ReservationItemData | null>(null)
    const [conflictInfo, setConflictInfo] = useState<any>(null)
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
        confirmColor: 'purple',
        onConfirm: () => {}
    })

    const [processingId, setProcessingId] = useState<string | null>(null)

    // Realtime Sync
    useRealtimeInvalidator(['reservations'], [['staff-reservations']])

    // Fetch Reservations & Global Stats in a single server action roundtrip
    const { data, isLoading, error } = useQuery({
        queryKey: ['staff-reservations', statusFilter, searchTerm, currentPage, pageSize],
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
            queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
        } else {
            if (result.conflictInfo) {
                setConflictInfo(result.conflictInfo)
            }
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
            queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
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
            queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
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
                    queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
                    queryClient.invalidateQueries({ queryKey: ['staff-loan-requests'] })
                } else {
                    toast.error(result.error || 'ไม่สามารถแปลงเป็นการยืมได้')
                }
            }
        })
    }

    return (
        <div className="space-y-6">
            <StaffPageHeader
                title="จัดการการจองล่วงหน้า"
                subtitle="อนุมัติ ปฏิเสธ หรือแจ้งเตือนให้ผู้ใช้มารับอุปกรณ์ที่เคาน์เตอร์"
            />

            {/* Stats Cards (Staff view: Pending, Approved, Ready) */}
            <ReservationStatsCards
                stats={stats}
                isLoading={isLoading}
                isAdmin={false}
            />

            {/* Main Content Box */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden mb-8">
                {/* Filter & Search Bar */}
                <ReservationFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    statusFilter={statusFilter}
                    onStatusChange={handleStatusChange}
                    isAdmin={false}
                    exportItems={reservations}
                />

                {/* Content List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
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
                                isAdmin={false}
                                processingId={processingId}
                                onApprove={handleApprove}
                                onReject={(r) => setRejectModalItem(r)}
                                onMarkReady={handleMarkReady}
                                onConvertToLoan={handleConvertToLoan}
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
                                className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                role="staff"
            />
        </div>
    )
}
