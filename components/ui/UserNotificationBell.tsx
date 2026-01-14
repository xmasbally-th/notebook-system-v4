'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Bookmark,
    Package,
    X
} from 'lucide-react'
import { useUserNotifications } from '@/hooks/useUserNotifications'

interface UserNotificationBellProps {
    userId?: string
}

export default function UserNotificationBell({ userId }: UserNotificationBellProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useUserNotifications(userId)
    const [showDropdown, setShowDropdown] = useState(false)

    if (!userId) return null

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'loan_approved':
                return { icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-100' }
            case 'loan_rejected':
                return { icon: <XCircle className="w-5 h-5 text-red-600" />, bg: 'bg-red-100' }
            case 'equipment_due_soon':
            case 'due_soon':
                return { icon: <Clock className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-100' }
            case 'equipment_overdue':
            case 'overdue_warning':
                return { icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: 'bg-red-100' }
            case 'reservation_confirmed':
            case 'reservation_approved':
                return { icon: <Bookmark className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' }
            case 'reservation_ready':
                return { icon: <Package className="w-5 h-5 text-green-600" />, bg: 'bg-green-100' }
            case 'reservation_rejected':
                return { icon: <XCircle className="w-5 h-5 text-red-600" />, bg: 'bg-red-100' }
            default:
                return { icon: <Bell className="w-5 h-5 text-gray-600" />, bg: 'bg-gray-100' }
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'เมื่อสักครู่'
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
        return `${days} วันที่แล้ว`
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="การแจ้งเตือน"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 w-80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                    อ่านทั้งหมด
                                </button>
                            )}
                            <button
                                onClick={() => setShowDropdown(false)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Notification Items */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const { icon, bg } = getNotificationIcon(notification.type)
                                const isComputed = 'is_computed' in notification && notification.is_computed

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => {
                                            if (!isComputed) {
                                                markAsRead(notification.id)
                                            }
                                        }}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 ${!('is_read' in notification) || notification.is_read === false
                                            ? 'bg-blue-50/50'
                                            : ''
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">
                                                {notification.title}
                                            </p>
                                            {notification.message && (
                                                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                            {notification.created_at && (
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {formatTime(notification.created_at)}
                                                </p>
                                            )}
                                        </div>
                                        {!('is_read' in notification) || notification.is_read === false ? (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                        ) : null}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100">
                            <Link
                                href="/my-loans"
                                onClick={() => setShowDropdown(false)}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                ดูประวัติการยืมทั้งหมด →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
