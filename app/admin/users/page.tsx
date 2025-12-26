import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './user-table'

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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Approve new registrations and manage user roles.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {users?.filter((u: any) => u.status === 'pending').length} Pending Requests
                </div>
            </div>

            <UserTable users={users || []} />
        </div>
    )
}
