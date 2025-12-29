'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useQuery } from '@tanstack/react-query'
import { User, Phone, Building2, Briefcase, Loader2, Info } from 'lucide-react'

export default function ProfileSetupPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { data: profile } = useProfile(session?.user?.id)

    const [formData, setFormData] = useState({
        title: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        user_type: '' as 'student' | 'lecturer' | 'staff' | '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.user?.id) return

        setIsSubmitting(true)

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
            router.push('/')
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header Card */}
                <div className="bg-blue-600 text-white rounded-t-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">ตั้งค่าโปรไฟล์ของคุณ</h1>
                    <p className="text-blue-100 text-sm">
                        กรุณากรอกข้อมูลให้ครบถ้วนเพื่อใช้งานระบบยืม-คืนอุปกรณ์
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-b-2xl shadow-xl p-6 border border-gray-100">
                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">ทำไมต้องกรอกข้อมูลนี้?</p>
                            <p className="text-blue-600">ข้อมูลเหล่านี้จะถูกใช้ในการติดต่อกลับ และยืนยันตัวตนเมื่อมารับ-คืนอุปกรณ์</p>
                        </div>
                    </div>

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
                            <p className="text-xs text-gray-500 mt-1">เบอร์ที่สามารถติดต่อได้สะดวก</p>
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
                                    onChange={e => setFormData({ ...formData, user_type: e.target.value as any })}
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
                            {(!departments || departments.length === 0) && (
                                <p className="text-xs text-amber-600 mt-1">ยังไม่มีหน่วยงานในระบบ - ผู้ดูแลระบบจะเพิ่มให้ภายหลัง</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                'บันทึกข้อมูล'
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 text-center mt-4">
                        ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัยตามนโยบายความเป็นส่วนตัว
                    </p>
                </div>
            </div>
        </div>
    )
}
