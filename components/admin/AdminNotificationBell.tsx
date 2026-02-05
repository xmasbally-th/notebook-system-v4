'use client'

import { useEffect, useState } from 'react'
import { Bell, UserPlus, Package, X, Users, ClipboardList, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useRealtimeUsers } from '@/hooks/useRealtimeUsers'
import { useSharedNotificationData } from '@/hooks/useSharedNotificationData'

interface AdminNotificationBellProps {
    isAdmin: boolean
}

export default function AdminNotificationBell({ isAdmin }: AdminNotificationBellProps) {
    const { pendingCount: pendingUsersCount, newUser, clearNewUser } = useRealtimeUsers(isAdmin)
    const {
        pendingLoans,
        pendingReservations,
        newLoan,
        newReservation,
        clearNewLoan,
        clearNewReservation
    } = useSharedNotificationData()

    const pendingLoansCount = pendingLoans.length
    const pendingReservationsCount = pendingReservations.length

    const [showDropdown, setShowDropdown] = useState(false)

    const totalPending = pendingUsersCount + pendingLoansCount + pendingReservationsCount

    // Auto-clear new notifications after 5 seconds
    useEffect(() => {
        if (newUser) {
            const timer = setTimeout(clearNewUser, 5000)
            return () => clearTimeout(timer)
        }
    }, [newUser, clearNewUser])

    useEffect(() => {
        if (newLoan) {
            const timer = setTimeout(clearNewLoan, 5000)
            return () => clearTimeout(timer)
        }
    }, [newLoan, clearNewLoan])

    useEffect(() => {
        if (newReservation) {
            const timer = setTimeout(clearNewReservation, 5000)
            return () => clearTimeout(timer)
        }
    }, [newReservation, clearNewReservation])

    if (!isAdmin) return null

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="การแจ้งเตือน"
            >
                <Bell className="w-6 h-6" />
                {totalPending > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                        {totalPending > 9 ? '9+' : totalPending}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 w-80 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Notification Items - Only show if pending */}
                    <div className="max-h-80 overflow-y-auto">
                        {/* Pending Users */}
                        {pendingUsersCount > 0 && (
                            <Link
                                href="/admin/users"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50"
                            >
                                <div className="p-2 rounded-lg bg-orange-100">
                                    <Users className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">ผู้ใช้รอการอนุมัติ</p>
                                    <p className="text-gray-500 text-xs">คลิกเพื่อจัดการผู้ใช้</p>
                                </div>
                                <span className="bg-orange-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2">
                                    {pendingUsersCount}
                                </span>
                            </Link>
                        )}

                        {/* Pending Loans */}
                        {pendingLoansCount > 0 && (
                            <Link
                                href="/admin/loans"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50"
                            >
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <ClipboardList className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">คำขอยืมรอการอนุมัติ</p>
                                    <p className="text-gray-500 text-xs">คลิกเพื่อจัดการคำขอยืม</p>
                                </div>
                                <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2">
                                    {pendingLoansCount}
                                </span>
                            </Link>
                        )}

                        {/* Pending Reservations */}
                        {pendingReservationsCount > 0 && (
                            <Link
                                href="/admin/reservations"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                            >
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <Bookmark className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">คำขอจองรอการอนุมัติ</p>
                                    <p className="text-gray-500 text-xs">คลิกเพื่อจัดการคำขอจอง</p>
                                </div>
                                <span className="bg-purple-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2">
                                    {pendingReservationsCount}
                                </span>
                            </Link>
                        )}

                        {/* Empty State */}
                        {totalPending === 0 && (
                            <div className="px-4 py-6 text-center text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast: New User */}
            {newUser && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-50 animate-slide-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-full">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">ผู้ใช้ใหม่ลงทะเบียน!</p>
                            <p className="text-gray-500 text-xs truncate">{newUser.email}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Link
                            href="/admin/users"
                            className="flex-1 bg-orange-600 text-white text-center text-xs py-1.5 rounded-md hover:bg-orange-700 transition-colors"
                            onClick={clearNewUser}
                        >
                            ตรวจสอบเลย
                        </Link>
                        <button
                            onClick={clearNewUser}
                            className="px-3 text-gray-500 text-xs hover:text-gray-700"
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            )}

            {/* Toast: New Loan */}
            {newLoan && !newUser && !newReservation && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-50 animate-slide-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">คำขอยืมใหม่!</p>
                            <p className="text-gray-500 text-xs">มีคำขอยืมอุปกรณ์รอการอนุมัติ</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Link
                            href="/admin/loans"
                            className="flex-1 bg-blue-600 text-white text-center text-xs py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                            onClick={clearNewLoan}
                        >
                            ตรวจสอบเลย
                        </Link>
                        <button
                            onClick={clearNewLoan}
                            className="px-3 text-gray-500 text-xs hover:text-gray-700"
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            )}

            {/* Toast: New Reservation */}
            {newReservation && !newUser && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-50 animate-slide-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                            <Bookmark className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">คำขอจองใหม่!</p>
                            <p className="text-gray-500 text-xs">มีคำขอจองอุปกรณ์รอการอนุมัติ</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Link
                            href="/admin/reservations"
                            className="flex-1 bg-purple-600 text-white text-center text-xs py-1.5 rounded-md hover:bg-purple-700 transition-colors"
                            onClick={clearNewReservation}
                        >
                            ตรวจสอบเลย
                        </Link>
                        <button
                            onClick={clearNewReservation}
                            className="px-3 text-gray-500 text-xs hover:text-gray-700"
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
