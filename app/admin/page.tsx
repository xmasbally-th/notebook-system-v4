import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import { Suspense } from 'react'

export const metadata = {
    title: 'Dashboard | Admin',
}

async function DashboardStatsFetcher() {
    const supabase = await createClient()

    const [
        { count: equipment },
        { count: pendingUsers },
        { count: pendingLoans },
        { count: activeLoans },
        { count: totalUsers }
    ] = await Promise.all([
        supabase.from('equipment').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
    ])

    const initialStats = {
        equipment: equipment || 0,
        pendingUsers: pendingUsers || 0,
        pendingLoans: pendingLoans || 0,
        activeLoans: activeLoans || 0,
        totalUsers: totalUsers || 0
    }

    return <DashboardClient initialStats={initialStats} />
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        }>
            <DashboardStatsFetcher />
        </Suspense>
    )
}
