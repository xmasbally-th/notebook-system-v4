'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Bell,
    ClipboardList,
    Calendar,
    AlertTriangle,
    Bookmark,
    X,
    CheckCircle,
    XCircle,
    Clock,
    Package
} from 'lucide-react'

/**
 * Shared Notification Dropdown Component
 * Used by both Staff and User notification bells
 */

export interface NotificationItem {
    id: string
    type: string
    title: string
    message?: string | null
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    href?: string
    count?: number
    is_read?: boolean
    created_at?: string
}

interface NotificationDropdownProps {
    items: NotificationItem[]
    onItemClick?: (item: NotificationItem) => void
    onClose: () => void
    emptyMessage?: string
    showMarkAllRead?: boolean
    onMarkAllRead?: () => void
}

export function NotificationDropdown({
    items,
    onItemClick,
    onClose,
    emptyMessage = 'ไม่มีการแจ้งเตือน',
    showMarkAllRead = false,
    onMarkAllRead,
}: NotificationDropdownProps) {
    return (
        <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 w-80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                <div className="flex items-center gap-2">
                    {showMarkAllRead && items.length > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            อ่านทั้งหมด
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Notification Items */}
            <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{emptyMessage}</p>
                    </div>
                ) : (
                    items.map((item) => (
                        item.href ? (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => {
                                    onItemClick?.(item)
                                    onClose()
                                }}
                                className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 ${item.is_read === false ? 'bg-blue-50/50' : ''
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${item.iconBg}`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                                    {item.message && (
                                        <p className="text-gray-500 text-xs truncate">{item.message}</p>
                                    )}
                                </div>
                                {item.count !== undefined && item.count > 0 && (
                                    <span className={`${item.iconBg.replace('100', '500').replace('bg-', 'bg-')} text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2`}>
                                        {item.count}
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <div
                                key={item.id}
                                onClick={() => onItemClick?.(item)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 ${item.is_read === false ? 'bg-blue-50/50' : ''
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${item.iconBg}`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                                    {item.message && (
                                        <p className="text-gray-500 text-xs truncate">{item.message}</p>
                                    )}
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    )
}

// Icon components for notification types
export const NotificationIcons = {
    // Staff icons
    pendingLoan: <ClipboardList className="w-5 h-5 text-blue-600" />,
    dueToday: <Calendar className="w-5 h-5 text-orange-600" />,
    overdue: <AlertTriangle className="w-5 h-5 text-red-600" />,
    reservation: <Bookmark className="w-5 h-5 text-purple-600" />,

    // User icons
    approved: <CheckCircle className="w-5 h-5 text-green-600" />,
    rejected: <XCircle className="w-5 h-5 text-red-600" />,
    dueSoon: <Clock className="w-5 h-5 text-orange-600" />,
    overdueWarning: <AlertTriangle className="w-5 h-5 text-red-600" />,
    reservationConfirmed: <Bookmark className="w-5 h-5 text-blue-600" />,
    equipmentReady: <Package className="w-5 h-5 text-green-600" />,
}

export const NotificationBgColors = {
    blue: 'bg-blue-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    gray: 'bg-gray-100',
}
