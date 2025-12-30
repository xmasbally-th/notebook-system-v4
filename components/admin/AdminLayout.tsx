'use client'

import React from 'react'
import AdminSidebar from './AdminSidebar'
import AdminNotificationBell from './AdminNotificationBell'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface AdminLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    const [userId, setUserId] = useState<string | undefined>(undefined)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id || undefined)
        })
    }, [])

    const { data: profile } = useProfile(userId)
    const isAdmin = profile?.role === 'admin'

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="lg:pl-64 transition-all duration-300">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                        <div className="pl-12 lg:pl-0">
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <AdminNotificationBell isAdmin={isAdmin} />
                            {profile && (
                                <div className="hidden sm:flex items-center gap-2 text-sm">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold">
                                            {profile.first_name?.charAt(0) || 'A'}
                                        </span>
                                    </div>
                                    <span className="text-gray-700 font-medium">
                                        {profile.first_name} {profile.last_name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
