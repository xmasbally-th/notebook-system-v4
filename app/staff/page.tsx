import { createClient } from '@/lib/supabase/server'
import StaffPageHeader from '@/components/staff/StaffPageHeader'
import StaffDashboardClient from '@/components/staff/StaffDashboardClient'
import StaffDashboardSkeleton from '@/components/staff/StaffDashboardSkeleton'
import { getStaffDashboardStats, getRecentActivity, getEquipmentInventorySummary, getStaffActionQueues } from '@/lib/data/staff-dashboard'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Create a component that fetches and renders the dashboard data
async function StaffDashboardData() {
    const [stats, recentActivity, inventorySummary, actionQueues] = await Promise.all([
        getStaffDashboardStats(),
        getRecentActivity(),
        getEquipmentInventorySummary(),
        getStaffActionQueues(),
    ])
    
    return (
        <StaffDashboardClient
            stats={stats}
            recentActivity={recentActivity}
            inventorySummary={inventorySummary}
            actionQueues={actionQueues}
        />
    )
}

export default async function StaffDashboard() {
    return (
        <div className="space-y-6">
            <StaffPageHeader
                title="Staff Command Center"
                subtitle="จุดบริการเคาน์เตอร์ด่วน จัดการคำขอ และภาพรวมสถานะอุปกรณ์"
            />
            <Suspense fallback={<StaffDashboardSkeleton />}>
                <StaffDashboardData />
            </Suspense>
        </div>
    )
}
