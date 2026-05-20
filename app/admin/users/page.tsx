import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './user-table'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { Users, UserCheck, Clock, UserX } from 'lucide-react'

// Skeleton for the stats cards while data loads
function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                <div>
                    <div className="h-7 w-10 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
            </div>
        </div>
    )
}

// Skeleton for table
function TableSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="p-4 border-b border-gray-100">
                <div className="h-10 bg-gray-100 rounded-xl w-full" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-40" />
                        <div className="h-3 bg-gray-50 rounded w-56" />
                    </div>
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    <div className="h-8 w-24 bg-gray-100 rounded-lg" />
                </div>
            ))}
        </div>
    )
}

async function UsersContent() {
    const supabase = await createClient()

    // Fetch user list and active departments in parallel (Auth and Admin check is already handled by app/admin/layout.tsx)
    const [usersRes, deptsRes] = await Promise.all([
        supabase
            .from('profiles' as any)
            .select('id, email, first_name, last_name, title, role, status, user_type, phone_number, avatar_url, created_at, department_id, user_id, departments(name)')
            .order('created_at', { ascending: false }),
        supabase
            .from('departments' as any)
            .select('id, name, is_active')
            .eq('is_active', true)
            .order('name')
    ])

    if (usersRes.error) {
        return <div className="p-8 text-red-500">Error loading users: {usersRes.error.message}</div>
    }

    const users = usersRes.data
    const departments = deptsRes.data || []

    // Calculate stats
    const pendingCount = users?.filter((u: any) => u.status === 'pending').length || 0
    const approvedCount = users?.filter((u: any) => u.status === 'approved').length || 0
    const rejectedCount = users?.filter((u: any) => u.status === 'rejected').length || 0
    const totalCount = users?.length || 0

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                            <p className="text-xs text-gray-500">ผู้ใช้ทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className={`bg-white rounded-xl p-4 border shadow-sm ${pendingCount > 0 ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                            <p className="text-xs text-gray-500">รออนุมัติ</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                            <p className="text-xs text-gray-500">อนุมัติแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <UserX className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                            <p className="text-xs text-gray-500">ถูกปฏิเสธ</p>
                        </div>
                    </div>
                </div>
            </div>

            <UserTable users={users || []} departments={departments} />
        </>
    )
}

function PageSkeleton() {
    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
            <TableSkeleton />
        </>
    )
}

export default function AdminUsersPage() {
    return (
        <>
            <AdminPageHeader title="จัดการผู้ใช้" subtitle="อนุมัติผู้ใช้ใหม่และจัดการสิทธิ์การเข้าถึง" />
            <Suspense fallback={<PageSkeleton />}>
                <UsersContent />
            </Suspense>
        </>
    )
}
