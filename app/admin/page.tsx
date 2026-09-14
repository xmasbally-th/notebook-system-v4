import { Suspense } from 'react'
import { getAdminDashboardData } from '@/lib/data/admin-dashboard'
import DashboardClient from './DashboardClient'
import AdminDashboardSkeleton from '@/components/admin/AdminDashboardSkeleton'

export const metadata = {
    title: 'Dashboard | ผู้ดูแลระบบ (Admin)',
}

async function DashboardDataFetcher() {
    const data = await getAdminDashboardData()
    return <DashboardClient initialData={data} />
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<AdminDashboardSkeleton />}>
            <DashboardDataFetcher />
        </Suspense>
    )
}
