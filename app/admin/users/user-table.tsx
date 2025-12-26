'use client'

import { useState } from 'react'
import { Check, X, Shield, ShieldAlert, Search, Filter } from 'lucide-react'
import { updateUserStatus, updateUserRole } from './actions'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    title: string | null
    role: string
    status: string
    user_type: string | null
    phone_number: string | null
    created_at: string
    departments: { name: string } | null
}

export default function UserTable({ users }: { users: User[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterRole, setFilterRole] = useState('all')
    const [search, setSearch] = useState('')

    const filteredUsers = users.filter(user => {
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus
        const matchesRole = filterRole === 'all' || user.role === filterRole
        const fullName = `${user.title || ''}${user.first_name} ${user.last_name || ''}`.toLowerCase()
        const matchesSearch = fullName.includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesRole && matchesSearch
    })

    const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this user?`)) return

        setLoading(userId)
        try {
            await updateUserStatus(userId, status)
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(null)
        }
    }

    const handleRoleUpdate = async (userId: string, role: 'admin' | 'user') => {
        if (!confirm(`Change role to ${role}?`)) return

        setLoading(userId)
        try {
            await updateUserRole(userId, role)
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex gap-4 items-center flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-4">
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">User</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Contact / Dept</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Role</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No users found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {user.title} {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-gray-500 text-xs">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{user.departments?.name || '-'}</div>
                                            <div className="text-gray-500 text-xs capitalize">{user.user_type} • {user.phone_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'admin' ? (
                                                <span className="flex items-center gap-1 text-purple-600 font-medium text-xs">
                                                    <ShieldAlert className="w-3 h-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {loading === user.id ? (
                                                <span className="text-xs text-gray-500">Updating...</span>
                                            ) : (
                                                <>
                                                    {/* Status Actions */}
                                                    {user.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                                className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-1.5 rounded-md transition-colors"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(user.id, 'rejected')}
                                                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Role Toggle (Simple for now) */}
                                                    {user.role === 'user' ? (
                                                        <button
                                                            onClick={() => handleRoleUpdate(user.id, 'admin')}
                                                            className="text-gray-400 hover:text-purple-600 p-1.5"
                                                            title="Promote to Admin"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRoleUpdate(user.id, 'user')}
                                                            className="text-purple-600 hover:text-gray-500 p-1.5"
                                                            title="Demote to User"
                                                        >
                                                            <ShieldAlert className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
