import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './user-table'
import AdminLayout from '@/components/admin/AdminLayout'
import { Users, UserCheck, Clock, UserX } from 'lucide-react'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // 1. Check Auth & Role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: adminCheck } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminCheck?.role !== 'admin') {
        redirect('/')
    }

    // 2. Fetch Users
    const { data: users, error } = await supabase
        .from('profiles' as any)
        .select('*, departments(name)')
        .order('created_at', { ascending: false })

    if (error) {
        return <div className="p-8 text-red-500">Error loading users: {error.message}</div>
    }

    // Calculate stats
    const pendingCount = users?.filter((u: any) => u.status === 'pending').length || 0
    const approvedCount = users?.filter((u: any) => u.status === 'approved').length || 0
    const rejectedCount = users?.filter((u: any) => u.status === 'rejected').length || 0
    const totalCount = users?.length || 0

    return (
        <AdminLayout title="จัดการผู้ใช้" subtitle="อนุมัติผู้ใช้ใหม่และจัดการสิทธิ์การเข้าถึง">
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

            <UserTable users={users || []} />
        </AdminLayout>
    )
}
