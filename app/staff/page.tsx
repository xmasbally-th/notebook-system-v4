import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffPageHeader from '@/components/staff/StaffPageHeader'
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
    // Auth check is handled by layout.tsx
    
    return (
        <div className="space-y-6">
            <StaffPageHeader
                title="Dashboard"
                subtitle="ภาพรวมการยืม-คืนอุปกรณ์"
            />
            <Suspense fallback={<StaffDashboardSkeleton />}>
                <StaffDashboardData />
            </Suspense>
        </div>
    )
}
