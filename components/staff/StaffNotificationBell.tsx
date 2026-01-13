'use client'

import { useState } from 'react'
import { Bell, ClipboardList, Calendar, AlertTriangle, Bookmark } from 'lucide-react'
import { useStaffNotifications } from '@/hooks/useStaffNotifications'
import { NotificationDropdown, NotificationItem } from '@/components/ui/NotificationDropdown'

interface StaffNotificationBellProps {
    isStaff: boolean
}

export default function StaffNotificationBell({ isStaff }: StaffNotificationBellProps) {
    const notifications = useStaffNotifications(isStaff)
    const [showDropdown, setShowDropdown] = useState(false)

    if (!isStaff) return null

    // Build notification items from computed data
    const items: NotificationItem[] = []

    if (notifications.pendingLoansCount > 0) {
        items.push({
            id: 'pending-loans',
            type: 'pending_loans',
            title: 'คำขอยืมรอดำเนินการ',
            message: `มี ${notifications.pendingLoansCount} คำขอรอการอนุมัติ`,
            icon: <ClipboardList className="w-5 h-5 text-blue-600" />,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            href: '/staff/loans',
            count: notifications.pendingLoansCount,
        })
    }

    if (notifications.dueTodayCount > 0) {
        items.push({
            id: 'due-today',
            type: 'due_today',
            title: 'อุปกรณ์ครบกำหนดวันนี้',
            message: `มี ${notifications.dueTodayCount} รายการครบกำหนดคืน`,
            icon: <Calendar className="w-5 h-5 text-orange-600" />,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            href: '/staff/loans',
            count: notifications.dueTodayCount,
        })
    }

    if (notifications.overdueCount > 0) {
        items.push({
            id: 'overdue',
            type: 'overdue',
            title: 'อุปกรณ์เกินกำหนดคืน',
            message: `มี ${notifications.overdueCount} รายการเกินกำหนด`,
            icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            href: '/staff/loans',
            count: notifications.overdueCount,
        })
    }

    if (notifications.pendingReservationsCount > 0) {
        items.push({
            id: 'pending-reservations',
            type: 'pending_reservations',
            title: 'การจองรอดำเนินการ',
            message: `มี ${notifications.pendingReservationsCount} การจองใหม่`,
            icon: <Bookmark className="w-5 h-5 text-purple-600" />,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            href: '/staff/reservations',
            count: notifications.pendingReservationsCount,
        })
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-teal-600 transition-colors"
                title="การแจ้งเตือน"
            >
                <Bell className="w-6 h-6" />
                {notifications.totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                        {notifications.totalCount > 9 ? '9+' : notifications.totalCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <NotificationDropdown
                    items={items}
                    onClose={() => setShowDropdown(false)}
                    emptyMessage="ไม่มีรายการที่ต้องดำเนินการ"
                />
            )}
        </div>
    )
}
