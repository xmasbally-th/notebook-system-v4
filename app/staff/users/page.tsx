import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import UserTable from '@/app/admin/users/user-table'
import StaffPageHeader from '@/components/staff/StaffPageHeader'
import { Users, UserCheck, Clock, UserX } from 'lucide-react'

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

function TableSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="p-4 border-b border-gray-100">
                <div className="h-10 bg-gray-100 rounded-xl w-full" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
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

async function StaffUsersContent() {
    const supabase = await createClient()

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
        return <div className="p-8 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน: {usersRes.error.message}</div>
    }

    const users = usersRes.data
    const departments = deptsRes.data || []

    const pendingCount = users?.filter((u: any) => u.status === 'pending').length || 0
    const approvedCount = users?.filter((u: any) => u.status === 'approved').length || 0
    const rejectedCount = users?.filter((u: any) => u.status === 'rejected').length || 0
    const totalCount = users?.length || 0

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className={`bg-white rounded-xl p-4 border shadow-sm ${pendingCount > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                            <p className="text-xs text-gray-500 font-medium">รออนุมัติ</p>
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
                            <p className="text-xs text-gray-500 font-medium">อนุมัติแล้ว</p>
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
                            <p className="text-xs text-gray-500 font-medium">ปฏิเสธแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                            <p className="text-xs text-gray-500 font-medium">ผู้ใช้งานทั้งหมด</p>
                        </div>
                    </div>
                </div>
            </div>

            <UserTable users={users || []} departments={departments} isStaffMode={true} />
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

export default function StaffUsersPage() {
    return (
        <div className="space-y-6">
            <StaffPageHeader
                title="อนุมัติผู้ใช้งาน"
                subtitle="ตรวจสอบและอนุมัติสิทธิ์ผู้ใช้งานที่ลงทะเบียนเข้าสู่ระบบ"
            />
            <Suspense fallback={<PageSkeleton />}>
                <StaffUsersContent />
            </Suspense>
        </div>
    )
}
