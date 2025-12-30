'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
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
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" /> },
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
        user_type: '' as UserType | '',
        department_id: '',
    })

    // Fetch departments
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('departments')
                .select('id, name')
                .eq('is_active', true)
                .order('name')
            return data || []
        },
    })

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
    }, [])

    useEffect(() => {
        if (profile) {
            setFormData({
                title: profile.title || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone_number: profile.phone_number || '',
                user_type: profile.user_type || '',
                department_id: profile.department_id || '',
            })
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

        const { error } = await (supabase.from('profiles') as any)
            .update({
                title: formData.title || null,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
                user_type: formData.user_type || null,
                department_id: formData.department_id || null,
            })
            .eq('id', session.user.id)

        setIsSubmitting(false)

        if (!error) {
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

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">กำลังโหลดข้อมูลโปรไฟล์...</p>
                </div>
            </div>
        )
    }

    if (profileError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center py-12 bg-red-50 rounded-xl px-8">
                    <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                </div>
            </div>
        )
    }

    const status = (profile?.status || 'pending') as Status
    const statusInfo = statusConfig[status]

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
                    <p className="mt-2 text-gray-500">ดูและจัดการข้อมูลส่วนตัวของคุณ</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">{successMessage}</span>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {profile?.title} {profile?.first_name} {profile?.last_name}
                                </h2>
                                <p className="text-blue-100 text-sm">{session?.user?.email}</p>
                            </div>
                        </div>

                        {/* Status & Role Badges */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                            </span>
                            {profile?.role === 'admin' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        คำนำหน้าชื่อ
                                    </label>
                                    <select
                                        className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            ชื่อ <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="กรอกชื่อจริง"
                                                className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            />
                                            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            นามสกุล <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="กรอกนามสกุล"
                                            className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0812345678"
                                            pattern="[0-9]{9,10}"
                                            className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.phone_number}
                                            onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        />
                                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {/* User Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        ประเภทผู้ใช้
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.user_type}
                                            onChange={e => setFormData({ ...formData, user_type: e.target.value as UserType })}
                                        >
                                            <option value="">-- เลือกประเภท --</option>
                                            <option value="student">นักศึกษา</option>
                                            <option value="lecturer">อาจารย์</option>
                                            <option value="staff">บุคลากร</option>
                                        </select>
                                        <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        หน่วยงาน/ภาควิชา
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">อีเมล</p>
                                            <p className="font-medium text-gray-900">{session?.user?.email || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">เบอร์โทรศัพท์</p>
                                            <p className="font-medium text-gray-900">{profile?.phone_number || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">ประเภทผู้ใช้</p>
                                            <p className="font-medium text-gray-900">
                                                {profile?.user_type ? userTypeLabels[profile.user_type as UserType] : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                        <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">หน่วยงาน/ภาควิชา</p>
                                            <p className="font-medium text-gray-900">{getDepartmentName(profile?.department_id || '')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    แก้ไขข้อมูล
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
