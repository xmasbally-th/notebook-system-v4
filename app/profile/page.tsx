'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient, getSupabaseCredentials, supabaseFetch } from '@/lib/supabase-helpers'
import { useProfile } from '@/hooks/useProfile'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
    User,
    Phone,
    Building2,
    Briefcase,
    Loader2,
    ArrowLeft,
    Mail,
    Edit3,
    Save,
    X,
    Shield,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react'

type UserType = 'student' | 'lecturer' | 'staff'
type Status = 'pending' | 'approved' | 'rejected'

const userTypeLabels: Record<UserType, string> = {
    student: 'นักศึกษา',
    lecturer: 'อาจารย์',
    staff: 'บุคลากร'
}

const statusConfig: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/50', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/50', icon: <XCircle className="w-4 h-4" /> },
}

export default function ProfilePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [session, setSession] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(session?.user?.id)

    const [formData, setFormData] = useState({
        title: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        user_id: '',
        user_type: '' as UserType | '',
        department_id: '',
    })

    // Fetch departments using direct fetch
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const response = await fetch(
                `${url}/rest/v1/departments?is_active=eq.true&select=id,name&order=name.asc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        },
    })

    useEffect(() => {
        const client = getSupabaseBrowserClient()
        if (client) {
            client.auth.getSession().then(({ data: { session } }: any) => {
                setSession(session)
            })
        }
    }, [])

    useEffect(() => {
        if (profile) {
            setFormData({
                title: profile.title || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone_number: profile.phone_number || '',
                user_id: profile.user_id || '',
                user_type: profile.user_type || '',
                department_id: profile.department_id || '',
            })
            // Force edit mode if user_id is missing
            if (!profile.user_id) {
                setIsEditing(true)
            }
        }
    }, [profile])

    const getDepartmentName = (departmentId: string) => {
        if (!departments || !departmentId) return '-'
        const dept = departments.find((d: any) => d.id === departmentId)
        return dept?.name || '-'
    }

    const handleCancel = () => {
        // Reset form to original profile data
        if (profile) {
            setFormData({
                title: profile.title || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone_number: profile.phone_number || '',
                user_id: profile.user_id || '',
                user_type: profile.user_type || '',
                department_id: profile.department_id || '',
            })
        }
        setIsEditing(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.user?.id) return

        setIsSubmitting(true)
        setSuccessMessage('')

        const { url, key } = getSupabaseCredentials()

        // Use session access token for RLS authentication
        const accessToken = session.access_token

        const response = await fetch(
            `${url}/rest/v1/profiles?id=eq.${session.user.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    title: formData.title || null,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone_number: formData.phone_number,
                    user_id: formData.user_id,
                    user_type: formData.user_type || null,
                    department_id: formData.department_id || null,
                })
            }
        )

        setIsSubmitting(false)

        if (response.ok) {
            // Invalidate and refetch profile data
            queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] })
            setSuccessMessage('บันทึกข้อมูลเรียบร้อยแล้ว')
            setIsEditing(false)

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000)
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
        }
    }

    const status = (profile?.status || 'pending') as Status
    const statusInfo = statusConfig[status] || statusConfig.pending

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">โปรไฟล์ของฉัน</h1>
                    <p className="mt-2 text-gray-500 dark:text-slate-400">ดูและจัดการข้อมูลส่วนตัวของคุณ</p>
                </div>

                {profileError ? (
                    <div className="text-center py-12 bg-red-50 dark:bg-red-950/20 rounded-xl px-8 border border-red-200 dark:border-red-900/50 shadow-sm">
                        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    </div>
                ) : !session || profileLoading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden animate-pulse">
                        {/* Profile Header Skeleton */}
                        <div className="bg-gradient-to-r from-gray-100 dark:from-slate-800 to-gray-200 dark:to-slate-700 p-6 flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-300 dark:bg-slate-700 rounded-full flex-shrink-0"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-6 w-1/3 bg-gray-300 dark:bg-slate-700 rounded"></div>
                                <div className="h-4 w-1/4 bg-gray-300 dark:bg-slate-700 rounded"></div>
                            </div>
                        </div>
                        {/* Profile Content Skeleton */}
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
                                        <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0 mt-0.5"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-12 w-full bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Success Message */}
                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-green-800 dark:text-green-300 font-medium">{successMessage}</span>
                            </div>
                        )}

                        {/* Warning Message if user_id is missing */}
                        {profile && !profile.user_id && (
                            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 text-orange-600" />
                                <span className="text-orange-800 dark:text-orange-300 font-medium">กรุณาระบุ "รหัสนักศึกษา / รหัสบุคลากร" เพื่อใช้งานระบบและรับการแจ้งเตือน WeLPRU</span>
                            </div>
                        )}

                        {/* Profile Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-r from-blue-600 dark:from-blue-900 to-blue-700 dark:to-blue-950 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {profile?.title} {profile?.first_name} {profile?.last_name}
                                </h2>
                                <p className="text-blue-100 dark:text-blue-200 text-sm">{session?.user?.email}</p>
                            </div>
                        </div>

                        {/* Status & Role Badges */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                            </span>
                            {profile?.role === 'admin' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                                    <Shield className="w-4 h-4" />
                                    ผู้ดูแลระบบ
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6">
                        {isEditing ? (
                            /* Edit Mode */
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                        คำนำหน้าชื่อ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    >
                                        <option value="">-- เลือกคำนำหน้า --</option>
                                        <option value="นาย">นาย</option>
                                        <option value="นาง">นาง</option>
                                        <option value="นางสาว">นางสาว</option>
                                        <option value="ดร.">ดร.</option>
                                        <option value="ผศ.">ผศ.</option>
                                        <option value="รศ.">รศ.</option>
                                        <option value="ศ.">ศ.</option>
                                    </select>
                                </div>

                                {/* Name Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                            ชื่อ <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="กรอกชื่อจริง"
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            />
                                            <User className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                            นามสกุล <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="กรอกนามสกุล"
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                required
                                                placeholder="0812345678"
                                                pattern="[0-9]{9,10}"
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.phone_number}
                                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                            />
                                            <Phone className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                            รหัสนักศึกษา / รหัสบุคลากร <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="กรอกรหัสประจำตัว"
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.user_id}
                                                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                            />
                                            <User className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </div>

                                {/* User Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                        ประเภทผู้ใช้ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.user_type}
                                            onChange={e => setFormData({ ...formData, user_type: e.target.value as UserType })}
                                        >
                                            <option value="">-- เลือกประเภท --</option>
                                            <option value="student">นักศึกษา</option>
                                            <option value="lecturer">อาจารย์</option>
                                            <option value="staff">บุคลากร</option>
                                        </select>
                                        <Briefcase className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                        หน่วยงาน/ภาควิชา <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.department_id}
                                            onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                        >
                                            <option value="">-- เลือกหน่วยงาน --</option>
                                            {departments?.map((dept: any) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Building2 className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                กำลังบันทึก...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                บันทึก
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* View Mode */
                            <div className="space-y-6">
                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
                                        <Mail className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">อีเมล</p>
                                            <p className="font-medium text-gray-900 dark:text-slate-100">{session?.user?.email || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
                                        <Phone className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">เบอร์โทรศัพท์</p>
                                            <p className="font-medium text-gray-900 dark:text-slate-100">{profile?.phone_number || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
                                        <User className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">รหัสนักศึกษา / รหัสบุคลากร</p>
                                            <p className="font-medium text-gray-900 dark:text-slate-100">{profile?.user_id || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">ประเภทผู้ใช้</p>
                                            <p className="font-medium text-gray-900 dark:text-slate-100">
                                                {profile?.user_type ? userTypeLabels[profile.user_type as UserType] : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
                                        <Building2 className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">หน่วยงาน/ภาควิชา</p>
                                            <p className="font-medium text-gray-900 dark:text-slate-100">{getDepartmentName(profile?.department_id || '')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    แก้ไขข้อมูล
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                    </>
                )}
            </div>
        </div>
    )
}
