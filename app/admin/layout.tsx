import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNotificationBell from '@/components/admin/AdminNotificationBell'
import { Suspense } from 'react'

export const metadata = {
    title: 'Admin Dashboard | ระบบยืม-คืนพัสดุและครุภัณฑ์',
}

export default async function AdminRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Server-Side Auth Check & Profile Fetch (No Client Waterfalls)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', user.id)
        .single()

    // 2. Strict Admin Route Protection
    if (profile?.role !== 'admin') {
        redirect('/')
    }

    // 3. Render the persistent layout shell
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Persistent Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-hidden">
                {/* Persistent Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                    <div className="flex items-center justify-end px-4 sm:px-6 py-4 lg:px-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <Suspense fallback={<div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />}>
                                <AdminNotificationBell isAdmin={true} />
                            </Suspense>
                            <div className="hidden sm:flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                        {profile?.first_name?.charAt(0) || 'A'}
                                    </span>
                                </div>
                                <span className="text-gray-700 font-medium whitespace-nowrap">
                                    {profile?.first_name} {profile?.last_name}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
