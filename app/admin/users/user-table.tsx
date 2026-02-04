'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Check,
    X,
    Shield,
    ShieldOff,
    Search,
    User,
    Phone,
    Building2,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
    RotateCcw,
    CheckCheck,
    XOctagon,
    Pencil,
    Save,
    AlertTriangle,
    Trash2
} from 'lucide-react'
import { updateUserStatus, updateUserRole, updateMultipleUserStatus, updateUserProfile, deleteUser } from './actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import Pagination from '@/components/ui/Pagination'


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
    avatar_url: string | null
    created_at: string
    departments: { name: string } | null
    department_id?: string | null
}

type Department = {
    id: string
    name: string
    is_active: boolean
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-3.5 h-3.5" /> },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
}

const userTypeLabels: Record<string, string> = {
    student: 'นักศึกษา',
    lecturer: 'อาจารย์',
    staff: 'บุคลากร'
}

export default function UserTable({ users }: { users: User[] }) {
    const router = useRouter()
    const toast = useToast()
    const [loading, setLoading] = useState<string | null>(null)
    const [bulkLoading, setBulkLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState('all')
    const [search, setSearch] = useState('')
    const [expandedUser, setExpandedUser] = useState<string | null>(null)

    // Bulk selection state
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [showBulkActions, setShowBulkActions] = useState(false)

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState({
        title: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        user_type: '',
        department_id: '' as string | null
    })
    const [departments, setDepartments] = useState<Department[]>([])
    const [editLoading, setEditLoading] = useState(false)

    // Fetch departments for edit form
    useEffect(() => {
        const fetchDepartments = async () => {
            const { data, error } = await supabase
                .from('departments')
                .select('id, name, is_active')
                .eq('is_active', true)
                .order('name')

            if (!error && data) {
                setDepartments(data)
            }
        }
        fetchDepartments()
    }, [])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)

    // Duplicate detection - find users with similar names or same phone numbers
    const duplicateInfo = useMemo(() => {
        const nameMap = new Map<string, string[]>() // normalized name -> user ids
        const phoneMap = new Map<string, string[]>() // phone -> user ids
        const duplicateUserIds = new Set<string>()
        const duplicateReasons = new Map<string, string[]>() // userId -> reasons

        users.forEach(user => {
            // Normalize name (remove spaces, lowercase)
            const normalizedName = `${user.first_name || ''}${user.last_name || ''}`.toLowerCase().replace(/\s+/g, '')
            if (normalizedName.length >= 3) {
                if (!nameMap.has(normalizedName)) {
                    nameMap.set(normalizedName, [])
                }
                nameMap.get(normalizedName)!.push(user.id)
            }

            // Phone number (normalize by removing non-digits)
            const normalizedPhone = (user.phone_number || '').replace(/\D/g, '')
            if (normalizedPhone.length >= 9) {
                if (!phoneMap.has(normalizedPhone)) {
                    phoneMap.set(normalizedPhone, [])
                }
                phoneMap.get(normalizedPhone)!.push(user.id)
            }
        })

        // Mark duplicates
        nameMap.forEach((ids, name) => {
            if (ids.length > 1) {
                ids.forEach(id => {
                    duplicateUserIds.add(id)
                    if (!duplicateReasons.has(id)) duplicateReasons.set(id, [])
                    duplicateReasons.get(id)!.push(`ชื่อซ้ำ (${ids.length} คน)`)
                })
            }
        })

        phoneMap.forEach((ids, phone) => {
            if (ids.length > 1) {
                ids.forEach(id => {
                    duplicateUserIds.add(id)
                    if (!duplicateReasons.has(id)) duplicateReasons.set(id, [])
                    duplicateReasons.get(id)!.push(`เบอร์โทรซ้ำ (${ids.length} คน)`)
                })
            }
        })

        return { duplicateUserIds, duplicateReasons }
    }, [users])

    const filteredUsers = users.filter(user => {
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus
        const fullName = `${user.title || ''}${user.first_name} ${user.last_name || ''}`.toLowerCase()
        const matchesSearch = fullName.includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
    })

    // Calculate paginated users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredUsers.slice(startIndex, startIndex + pageSize)
    }, [filteredUsers, currentPage, pageSize])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filterStatus, search])

    // Get pending users for bulk actions
    const pendingUsers = filteredUsers.filter(u => u.status === 'pending')
    const selectedPendingCount = Array.from(selectedUsers).filter(id =>
        pendingUsers.some(u => u.id === id)
    ).length

    // Count duplicates in filtered results
    const duplicatesInFiltered = filteredUsers.filter(u => duplicateInfo.duplicateUserIds.has(u.id)).length

    const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected' | 'pending') => {
        const statusLabels: Record<string, string> = {
            approved: 'อนุมัติ',
            rejected: 'ปฏิเสธ',
            pending: 'เปลี่ยนเป็นรออนุมัติ'
        }
        if (!confirm(`ต้องการ${statusLabels[status]}ผู้ใช้นี้หรือไม่?`)) return

        setLoading(userId)
        try {
            await updateUserStatus(userId, status)
            router.refresh()
            toast.success(`${statusLabels[status]}ผู้ใช้เรียบร้อยแล้ว`)
        } catch (error: any) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
        } finally {
            setLoading(null)
        }
    }

    const handleRoleUpdate = async (userId: string, role: 'admin' | 'staff' | 'user') => {
        const roleLabels = {
            admin: 'ผู้ดูแลระบบ',
            staff: 'เจ้าหน้าที่ให้บริการ',
            user: 'ผู้ใช้งาน'
        }
        if (!confirm(`ต้องการเปลี่ยนสิทธิ์เป็น ${roleLabels[role]} หรือไม่?`)) return

        setLoading(userId)
        try {
            await updateUserRole(userId, role)
            router.refresh()
            toast.success(`เปลี่ยนสิทธิ์เป็น ${roleLabels[role]} เรียบร้อยแล้ว`)
        } catch (error: any) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
        } finally {
            setLoading(null)
        }
    }

    // Bulk actions
    const handleBulkStatusUpdate = async (status: 'approved' | 'rejected') => {
        const selectedIds = Array.from(selectedUsers).filter(id =>
            pendingUsers.some(u => u.id === id)
        )

        if (selectedIds.length === 0) {
            toast.warning('กรุณาเลือกผู้ใช้ที่รออนุมัติ')
            return
        }

        const statusLabel = status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'
        if (!confirm(`ต้องการ${statusLabel} ${selectedIds.length} คนที่เลือกหรือไม่?`)) return

        setBulkLoading(true)
        try {
            await updateMultipleUserStatus(selectedIds, status)
            setSelectedUsers(new Set())
            router.refresh()
            const statusLabel = status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'
            toast.success(`${statusLabel} ${selectedIds.length} คนเรียบร้อยแล้ว`)
        } catch (error: any) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
        } finally {
            setBulkLoading(false)
        }
    }

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedUsers.size === pendingUsers.length) {
            setSelectedUsers(new Set())
        } else {
            setSelectedUsers(new Set(pendingUsers.map(u => u.id)))
        }
    }

    const toggleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUsers(newSelected)
    }

    const getInitials = (user: User) => {
        const first = user.first_name?.charAt(0) || ''
        const last = user.last_name?.charAt(0) || ''
        return (first + last).toUpperCase() || 'U'
    }

    // Edit modal handlers
    const openEditModal = (user: User) => {
        setEditingUser(user)
        setEditForm({
            title: user.title || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone_number: user.phone_number || '',
            user_type: user.user_type || '',
            department_id: user.department_id || null
        })
        setEditModalOpen(true)
    }

    const closeEditModal = () => {
        setEditModalOpen(false)
        setEditingUser(null)
    }

    const handleEditSubmit = async () => {
        if (!editingUser) return

        setEditLoading(true)
        try {
            await updateUserProfile(editingUser.id, {
                title: editForm.title || undefined,
                first_name: editForm.first_name || undefined,
                last_name: editForm.last_name || undefined,
                phone_number: editForm.phone_number || undefined,
                user_type: editForm.user_type || undefined,
                department_id: editForm.department_id || null
            })
            router.refresh()
            toast.success('อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว')
            closeEditModal()
        } catch (error: any) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
        } finally {
            setEditLoading(false)
        }
    }

    // Delete user handler
    const handleDeleteUser = async (user: User) => {
        const fullName = `${user.title || ''}${user.first_name} ${user.last_name || ''}`.trim()
        if (!confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${fullName}"?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return

        setLoading(user.id)
        try {
            await deleteUser(user.id)
            router.refresh()
            toast.success(`ลบผู้ใช้ "${fullName}" เรียบร้อยแล้ว`)
        } catch (error: any) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
        } finally {
            setLoading(null)
        }
    }


    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาผู้ใช้..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {[
                            { value: 'all', label: 'ทั้งหมด' },
                            { value: 'pending', label: 'รออนุมัติ' },
                            { value: 'approved', label: 'อนุมัติแล้ว' },
                            { value: 'rejected', label: 'ปฏิเสธ' }
                        ].map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setFilterStatus(tab.value)}
                                className={`
                                    px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all
                                    ${filterStatus === tab.value
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {pendingUsers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectedUsers.size === pendingUsers.length && pendingUsers.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-800">
                            {selectedUsers.size > 0
                                ? `เลือก ${selectedPendingCount} คน`
                                : `เลือกทั้งหมด (${pendingUsers.length} คนรออนุมัติ)`
                            }
                        </span>
                    </div>

                    {selectedUsers.size > 0 && (
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={() => handleBulkStatusUpdate('approved')}
                                disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {bulkLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-4 h-4" />
                                )}
                                อนุมัติที่เลือก
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('rejected')}
                                disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {bulkLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <XOctagon className="w-4 h-4" />
                                )}
                                ปฏิเสธที่เลือก
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="flex items-center gap-3 text-sm text-gray-500 px-1">
                <span>แสดง {paginatedUsers.length} จาก {filteredUsers.length} รายการ</span>
                {duplicatesInFiltered > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        พบข้อมูลซ้ำ {duplicatesInFiltered} รายการ
                    </span>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {filterStatus === 'pending' && (
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.size === pendingUsers.length && pendingUsers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            <th className="px-6 py-4 font-medium text-gray-500">ผู้ใช้</th>
                            <th className="px-6 py-4 font-medium text-gray-500">ติดต่อ</th>
                            <th className="px-6 py-4 font-medium text-gray-500">หน่วยงาน</th>
                            <th className="px-6 py-4 font-medium text-gray-500">สถานะ</th>
                            <th className="px-6 py-4 font-medium text-gray-500">สิทธิ์</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={filterStatus === 'pending' ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                                    <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p>ไม่พบผู้ใช้ที่ตรงตามเงื่อนไข</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map(user => {
                                const status = statusConfig[user.status] || statusConfig.pending
                                const isDuplicate = duplicateInfo.duplicateUserIds.has(user.id)
                                const duplicateReasons = duplicateInfo.duplicateReasons.get(user.id)
                                return (
                                    <tr key={user.id} className={`transition-colors ${isDuplicate ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}>
                                        {filterStatus === 'pending' && (
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm overflow-hidden relative">
                                                    {user.avatar_url ? (
                                                        <img
                                                            src={user.avatar_url}
                                                            alt={`${user.first_name}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        getInitials(user)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                                        {user.title} {user.first_name} {user.last_name}
                                                        {isDuplicate && (
                                                            <span
                                                                className="text-amber-600 cursor-help"
                                                                title={duplicateReasons?.join(', ')}
                                                            >
                                                                <AlertTriangle className="w-4 h-4" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                        {user.user_type ? userTypeLabels[user.user_type] : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 text-xs">{user.email}</div>
                                            <div className="text-gray-500 text-xs">{user.phone_number || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {user.departments?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                                    <Shield className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            ) : user.role === 'staff' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium">
                                                    <Shield className="w-3 h-3" />
                                                    Staff
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {loading === user.id ? (
                                                <div className="flex justify-center">
                                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Pending users: show approve/reject */}
                                                    {user.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="อนุมัติ"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(user.id, 'rejected')}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="ปฏิเสธ"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Rejected users: show re-approve options */}
                                                    {user.status === 'rejected' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="อนุมัติ"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(user.id, 'pending')}
                                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                title="เปลี่ยนเป็นรออนุมัติ"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Role dropdown */}
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleUpdate(user.id, e.target.value as 'admin' | 'staff' | 'user')}
                                                        className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="staff">Staff</option>
                                                        <option value="admin">Admin</option>
                                                    </select>

                                                    {/* Edit button */}
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete button */}
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="ลบผู้ใช้"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-100">
                        <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>ไม่พบผู้ใช้ที่ตรงตามเงื่อนไข</p>
                    </div>
                ) : (
                    paginatedUsers.map(user => {
                        const status = statusConfig[user.status] || statusConfig.pending
                        const isExpanded = expandedUser === user.id
                        const isPending = user.status === 'pending'
                        const isRejected = user.status === 'rejected'
                        const isDuplicate = duplicateInfo.duplicateUserIds.has(user.id)
                        const duplicateReasons = duplicateInfo.duplicateReasons.get(user.id)

                        return (
                            <div
                                key={user.id}
                                className={`rounded-2xl border shadow-sm overflow-hidden ${isDuplicate ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}
                            >
                                {/* Card Header */}
                                <div
                                    className="p-4 flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                >
                                    {/* Checkbox for pending users */}
                                    {isPending && (
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={(e) => {
                                                e.stopPropagation()
                                                toggleSelectUser(user.id)
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    )}

                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0 overflow-hidden relative">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={`${user.first_name}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            getInitials(user)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">
                                                {user.title} {user.first_name} {user.last_name}
                                            </span>
                                            {isDuplicate && (
                                                <span
                                                    className="text-amber-600 flex-shrink-0"
                                                    title={duplicateReasons?.join(', ')}
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                </span>
                                            )}
                                            {user.role === 'admin' && (
                                                <Shield className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                            {status.icon}
                                            <span className="hidden sm:inline">{status.label}</span>
                                        </span>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span>{user.phone_number || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>{user.user_type ? userTypeLabels[user.user_type] : '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 col-span-2">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span>{user.departments?.name || '-'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {loading === user.id ? (
                                            <div className="flex justify-center py-2">
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 pt-2">
                                                {/* Pending actions */}
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            อนุมัติ
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'rejected')}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            ปฏิเสธ
                                                        </button>
                                                    </>
                                                )}

                                                {/* Rejected actions - allow re-approve */}
                                                {isRejected && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            อนุมัติ
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'pending')}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                            รออนุมัติใหม่
                                                        </button>
                                                    </>
                                                )}

                                                {/* Role toggle for non-pending */}
                                                {!isPending && user.role === 'user' ? (
                                                    <button
                                                        onClick={() => handleRoleUpdate(user.id, 'admin')}
                                                        className={`${isRejected ? '' : 'flex-1'} flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors`}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                        {isRejected ? '' : 'เลื่อนเป็น Admin'}
                                                    </button>
                                                ) : !isPending && (
                                                    <button
                                                        onClick={() => handleRoleUpdate(user.id, 'user')}
                                                        className={`${isRejected ? '' : 'flex-1'} flex items-center justify-center gap-2 py-2.5 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors`}
                                                    >
                                                        <ShieldOff className="w-4 h-4" />
                                                        {isRejected ? '' : 'ลดเป็น User'}
                                                    </button>
                                                )}

                                                {/* Edit button for mobile */}
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    แก้ไข
                                                </button>

                                                {/* Delete button for mobile */}
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    ลบ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredUsers.length}
                        pageSize={pageSize}
                        pageSizeOptions={[10, 25, 50, 100]}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            )}

            {/* Edit Modal */}
            {editModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">แก้ไขข้อมูลผู้ใช้</h3>
                                <button
                                    onClick={closeEditModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{editingUser.email}</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* คำนำหน้า */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
                                <select
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- เลือกคำนำหน้า --</option>
                                    <option value="นาย">นาย</option>
                                    <option value="นาง">นาง</option>
                                    <option value="นางสาว">นางสาว</option>
                                    <option value="ผศ.">ผศ.</option>
                                    <option value="รศ.">รศ.</option>
                                    <option value="ศ.">ศ.</option>
                                    <option value="ดร.">ดร.</option>
                                    <option value="ผศ.ดร.">ผศ.ดร.</option>
                                    <option value="รศ.ดร.">รศ.ดร.</option>
                                    <option value="ศ.ดร.">ศ.ดร.</option>
                                </select>
                            </div>

                            {/* ชื่อ-นามสกุล */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                                    <input
                                        type="text"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="ชื่อ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                                    <input
                                        type="text"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="นามสกุล"
                                    />
                                </div>
                            </div>

                            {/* เบอร์โทรศัพท์ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                                <input
                                    type="tel"
                                    value={editForm.phone_number}
                                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0812345678"
                                />
                            </div>

                            {/* ประเภทผู้ใช้ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทผู้ใช้</label>
                                <select
                                    value={editForm.user_type}
                                    onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- เลือกประเภท --</option>
                                    <option value="student">นักศึกษา</option>
                                    <option value="lecturer">อาจารย์</option>
                                    <option value="staff">บุคลากร</option>
                                </select>
                            </div>

                            {/* หน่วยงาน */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน</label>
                                <select
                                    value={editForm.department_id || ''}
                                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value || null })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- เลือกหน่วยงาน --</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={editLoading}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {editLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
