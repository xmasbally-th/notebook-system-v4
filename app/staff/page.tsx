import StaffLayout from '@/components/staff/StaffLayout'
import StaffDashboardClient from '@/components/staff/StaffDashboardClient'
import { getStaffDashboardStats, getRecentActivity } from '@/lib/data/staff-dashboard'

// Revalidate every 60 seconds to keep stats reasonably fresh
export const revalidate = 60

export default async function StaffDashboard() {
    // Fetch both datasets in parallel on the server — no client waterfall
    const [stats, recentActivity] = await Promise.all([
        getStaffDashboardStats(),
        getRecentActivity(),
    ])

    return (
        <StaffLayout title="Dashboard" subtitle="ภาพรวมการยืม-คืนอุปกรณ์">
            <StaffDashboardClient stats={stats} recentActivity={recentActivity} />
        </StaffLayout>
    )
}
