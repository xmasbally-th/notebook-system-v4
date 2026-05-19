import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffLayout from '@/components/staff/StaffLayout'
import StaffDashboardClient from '@/components/staff/StaffDashboardClient'
import StaffDashboardSkeleton from '@/components/staff/StaffDashboardSkeleton'
import { getStaffDashboardStats, getRecentActivity } from '@/lib/data/staff-dashboard'
import { Suspense } from 'react'

// Revalidate every 60 seconds to keep stats reasonably fresh
export const revalidate = 60

// Create a component that fetches and renders the dashboard data
async function StaffDashboardData() {
    const [stats, recentActivity] = await Promise.all([
        getStaffDashboardStats(),
        getRecentActivity(),
    ])
    
    return <StaffDashboardClient stats={stats} recentActivity={recentActivity} />
}

export default async function StaffDashboard() {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Fetch only profile for the layout (don't block on stats)
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', user.id)
        .single()

    // 3. Access check
    if (!profile || !['staff', 'admin'].includes(profile.role)) {
        redirect('/')
    }

    return (
        <StaffLayout
            title="Dashboard"
            subtitle="ภาพรวมการยืม-คืนอุปกรณ์"
            profile={profile}
        >
            <Suspense fallback={<StaffDashboardSkeleton />}>
                <StaffDashboardData />
            </Suspense>
        </StaffLayout>
    )
}
