import { Suspense } from 'react'
import StaffSidebar from './StaffSidebar'
import StaffNotificationBell from './StaffNotificationBell'
import { isStaffOrAbove, getRoleDisplayName } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

interface ProfileData {
    first_name: string | null
    last_name: string | null
    role: string
}

interface StaffLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    profile?: ProfileData | null
}

/**
 * Server-compatible StaffLayout.
 * Receives profile as a prop (fetched on server) → no client-side auth waterfall.
 * StaffSidebar stays 'use client' for mobile toggle interactivity.
 */
export default function StaffLayout({ children, title, subtitle, profile }: StaffLayoutProps) {
    const hasAccess = profile?.role && isStaffOrAbove(profile.role as Role)

    return (
        <div className="min-h-screen bg-gray-50">
            <StaffSidebar />

            {/* Main Content Area */}
            <div className="lg:pl-64 transition-all duration-300">
                {/* Top Header — renders immediately, no client waterfall */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                        <div className="pl-12 lg:pl-0">
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <Suspense fallback={<div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />}>
                                <StaffNotificationBell isStaff={hasAccess || false} />
                            </Suspense>
                            {profile && (
                                <div className="hidden sm:flex items-center gap-2 text-sm">
                                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                        <span className="text-teal-600 font-semibold">
                                            {profile.first_name?.charAt(0) || 'S'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-700 font-medium">
                                            {profile.first_name} {profile.last_name}
                                        </span>
                                        <span className="text-xs text-teal-600">
                                            {getRoleDisplayName(profile.role as Role)}
                                        </span>
                                    </div>
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
