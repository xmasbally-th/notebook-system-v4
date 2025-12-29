'use client'

import { useEffect } from 'react'
import { Bell, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRealtimeUsers } from '@/hooks/useRealtimeUsers'

interface AdminNotificationBellProps {
    isAdmin: boolean
}

export default function AdminNotificationBell({ isAdmin }: AdminNotificationBellProps) {
    const { pendingCount, newUser, clearNewUser } = useRealtimeUsers(isAdmin)

    // Show toast when new user registers
    useEffect(() => {
        if (newUser) {
            // Auto-clear after 5 seconds
            const timer = setTimeout(clearNewUser, 5000)
            return () => clearTimeout(timer)
        }
    }, [newUser, clearNewUser])

    if (!isAdmin) return null

    return (
        <div className="relative">
            <Link
                href="/admin/users"
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors inline-block"
                title="User Notifications"
            >
                <Bell className="w-6 h-6" />
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                )}
            </Link>

            {/* Toast Notification */}
            {newUser && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-50 animate-slide-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">ผู้ใช้ใหม่ลงทะเบียน!</p>
                            <p className="text-gray-500 text-xs truncate">{newUser.email}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Link
                            href="/admin/users"
                            className="flex-1 bg-blue-600 text-white text-center text-xs py-1.5 rounded-md hover:bg-blue-700 transition-colors"
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
        </div>
    )
}
