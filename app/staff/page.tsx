import { createClient } from '@/lib/supabase/server'
import StaffPageHeader from '@/components/staff/StaffPageHeader'
import StaffDashboardClient from '@/components/staff/StaffDashboardClient'
import StaffDashboardSkeleton from '@/components/staff/StaffDashboardSkeleton'
import { getStaffDashboardStats, getRecentActivity, getEquipmentInventorySummary } from '@/lib/data/staff-dashboard'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Create a component that fetches and renders the dashboard data
async function StaffDashboardData() {
    const [stats, recentActivity, inventorySummary] = await Promise.all([
        getStaffDashboardStats(),
        getRecentActivity(),
        getEquipmentInventorySummary(),
    ])
    
    return <StaffDashboardClient stats={stats} recentActivity={recentActivity} inventorySummary={inventorySummary} />
}

export default async function StaffDashboard() {
    return (
        <div className="space-y-6">
            <StaffPageHeader
                title="Dashboard"
                subtitle="ภาพรวมการยืม-คืนและสถานะอุปกรณ์"
            />
            <Suspense fallback={<StaffDashboardSkeleton />}>
                <StaffDashboardData />
            </Suspense>
        </div>
    )
}
