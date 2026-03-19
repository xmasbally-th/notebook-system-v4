import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffLayout from '@/components/staff/StaffLayout'
import StaffDashboardClient from '@/components/staff/StaffDashboardClient'
import { getStaffDashboardStats, getRecentActivity } from '@/lib/data/staff-dashboard'

// Revalidate every 60 seconds to keep stats reasonably fresh
export const revalidate = 60

export default async function StaffDashboard() {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Fetch profile + dashboard data in parallel
    const [profileResult, stats, recentActivity] = await Promise.all([
        supabase
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', user.id)
            .single(),
        getStaffDashboardStats(),
        getRecentActivity(),
    ])

    const profile = profileResult.data

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
            <StaffDashboardClient stats={stats} recentActivity={recentActivity} />
        </StaffLayout>
    )
}
