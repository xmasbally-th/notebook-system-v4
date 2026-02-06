'use client'

import React, { useEffect, useState } from 'react'
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useSystemConfig'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    Loader2,
    Save,
    AlertTriangle,
    Clock,
    Zap,
    Building2,
    Bell,
    ChevronRight,
    Coffee,
    CalendarX,
    Users,
    Plus,
    Trash2,
    Settings,
    Megaphone,
    RefreshCw,
    FileText,
    Upload,
    Image as ImageIcon,
    X,
    Palette,
    Check
} from 'lucide-react'
import { Database } from '@/supabase/types'
import { useTheme, themeInfo, type Theme } from '@/components/providers/ThemeContext'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

type LoanLimitsByType = {
    [key: string]: {
        max_days: number
        max_items: number
        type_limits?: Record<string, number> // key: equipment_type_id, value: limit
    }
}

const defaultLoanLimits: LoanLimitsByType = {
    student: { max_days: 3, max_items: 1, type_limits: {} },
    lecturer: { max_days: 7, max_items: 3, type_limits: {} },
    staff: { max_days: 5, max_items: 2, type_limits: {} }
}

const userTypeLabels: Record<string, string> = {
    student: 'นักศึกษา',
    lecturer: 'อาจารย์',
    staff: 'บุคลากร'
}

type TabType = 'limits' | 'hours' | 'features' | 'notifications' | 'documents' | 'theme'

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'limits', label: 'ขีดจำกัด', icon: <Users className="w-4 h-4" /> },
    { id: 'hours', label: 'เวลาทำการ', icon: <Clock className="w-4 h-4" /> },
    { id: 'features', label: 'ฟีเจอร์', icon: <Zap className="w-4 h-4" /> },
    { id: 'notifications', label: 'แจ้งเตือน', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'documents', label: 'เอกสาร', icon: <FileText className="w-4 h-4" /> },
    { id: 'theme', label: 'ธีม', icon: <Palette className="w-4 h-4" /> },
]

export default function AdminSettingsPage() {
    const { data: config, isLoading, error, refetch } = useSystemConfig()
    const updateMutation = useUpdateSystemConfig()
    const { data: equipmentTypes = [] } = useEquipmentTypes()
    const { theme, setTheme } = useTheme()

    const [activeTab, setActiveTab] = useState<TabType>('limits')
    const [formData, setFormData] = useState<SystemConfigUpdate>({})
    const [isDirty, setIsDirty] = useState(false)
    const [loanLimits, setLoanLimits] = useState<LoanLimitsByType>(defaultLoanLimits)
    const [closedDates, setClosedDates] = useState<string[]>([])
    const [newClosedDate, setNewClosedDate] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const [templateUrl, setTemplateUrl] = useState<string | null>(null)
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false)

    useEffect(() => {
        if (config) {
            setFormData({
                max_loan_days: config.max_loan_days,
                max_items_per_user: config.max_items_per_user,
                opening_time: config.opening_time,
                closing_time: config.closing_time,
                break_start_time: config.break_start_time,
                break_end_time: config.break_end_time,
                is_loan_system_active: config.is_loan_system_active,
                is_reservation_active: config.is_reservation_active,
                discord_webhook_url: config.discord_webhook_url,
                announcement_message: config.announcement_message,
                announcement_active: config.announcement_active,
            })
            if (config.loan_limits_by_type) {
                setLoanLimits(config.loan_limits_by_type as LoanLimitsByType)
            }
            if (config.closed_dates) {
                setClosedDates(config.closed_dates as string[])
            }
            setLogoUrl(config.document_logo_url || null)
            setTemplateUrl(config.document_template_url || null)
        }
    }, [config])

    const handleChange = (field: keyof SystemConfigUpdate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)
    }

    const handleLoanLimitChange = (userType: keyof LoanLimitsByType, field: 'max_days' | 'max_items', value: number) => {
        setLoanLimits(prev => ({
            ...prev,
            [userType]: { ...prev[userType], [field]: value }
        }))
        setIsDirty(true)
    }

    const handleAddClosedDate = () => {
        if (newClosedDate && !closedDates.includes(newClosedDate)) {
            setClosedDates(prev => [...prev, newClosedDate].sort())
            setNewClosedDate('')
            setIsDirty(true)
        }
    }

    const handleRemoveClosedDate = (date: string) => {
        setClosedDates(prev => prev.filter(d => d !== date))
        setIsDirty(true)
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('ไฟล์ต้องมีขนาดไม่เกิน 2MB')
            return
        }

        setIsUploadingLogo(true)
        try {
            const { uploadEquipmentImage } = await import('@/lib/uploadImage')
            const url = await uploadEquipmentImage(file)
            setLogoUrl(url)

            // Save immediately
            updateMutation.mutate({ document_logo_url: url }, {
                onSuccess: () => {
                    alert('อัปโหลดโลโก้เรียบร้อยแล้ว')
                },
                onError: (err) => {
                    alert(`เกิดข้อผิดพลาด: ${err.message}`)
                }
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้')
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleLogoDelete = async () => {
        if (!logoUrl) return
        if (!confirm('ต้องการลบโลโก้หรือไม่?')) return

        try {
            const { deleteEquipmentImage } = await import('@/lib/uploadImage')
            await deleteEquipmentImage(logoUrl)
            setLogoUrl(null)

            // Save immediately
            updateMutation.mutate({ document_logo_url: null }, {
                onSuccess: () => {
                    alert('ลบโลโก้เรียบร้อยแล้ว')
                },
                onError: (err) => {
                    alert(`เกิดข้อผิดพลาด: ${err.message}`)
                }
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบรูปภาพได้')
        }
    }

    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.name.endsWith('.docx')) {
            alert('กรุณาเลือกไฟล์ .docx เท่านั้น')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('ไฟล์ต้องมีขนาดไม่เกิน 5MB')
            return
        }

        setIsUploadingTemplate(true)
        try {
            // Upload as regular file (using equipment-images bucket for simplicity)
            const { uploadEquipmentImage } = await import('@/lib/uploadImage')

            // Create a blob with docx mime type
            const docxBlob = new Blob([await file.arrayBuffer()], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            })

            // Upload using fetch API directly
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            const timestamp = Date.now()
            const filePath = `templates/${timestamp}_template.docx`
            const uploadUrl = `${url}/storage/v1/object/equipment-images/${filePath}`

            // Get access token
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()
            const accessToken = session?.access_token

            if (!accessToken) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': key,
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'x-upsert': 'false'
                },
                body: docxBlob
            })

            if (!response.ok) {
                throw new Error('ไม่สามารถอัปโหลด template ได้')
            }

            const publicUrl = `${url}/storage/v1/object/public/equipment-images/${filePath}`
            setTemplateUrl(publicUrl)

            // Save immediately
            updateMutation.mutate({ document_template_url: publicUrl }, {
                onSuccess: () => {
                    alert('อัปโหลด template เรียบร้อยแล้ว')
                },
                onError: (err) => {
                    alert(`เกิดข้อผิดพลาด: ${err.message}`)
                }
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถอัปโหลด template ได้')
        } finally {
            setIsUploadingTemplate(false)
        }
    }

    const handleTemplateDelete = async () => {
        if (!templateUrl) return
        if (!confirm('ต้องการลบ template หรือไม่?')) return

        try {
            setTemplateUrl(null)

            // Save immediately
            updateMutation.mutate({ document_template_url: null }, {
                onSuccess: () => {
                    alert('ลบ template เรียบร้อยแล้ว')
                },
                onError: (err) => {
                    alert(`เกิดข้อผิดพลาด: ${err.message}`)
                }
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบ template ได้')
        }
    }

    const handleSave = () => {
        const updates = {
            ...formData,
            loan_limits_by_type: loanLimits,
            closed_dates: closedDates
        }
        updateMutation.mutate(updates, {
            onSuccess: () => {
                setIsDirty(false)
                alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
            },
            onError: (err) => {
                alert(`เกิดข้อผิดพลาด: ${err.message}`)
            }
        })
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <AdminLayout title="ตั้งค่าระบบ" subtitle="กำลังโหลด...">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        )
    }

    if (error) {
        return (
            <AdminLayout title="ตั้งค่าระบบ" subtitle="เกิดข้อผิดพลาด">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <p className="text-red-700 font-medium">ไม่สามารถโหลดการตั้งค่าได้</p>
                    </div>
                    <p className="text-sm text-red-600 mb-4">{(error as Error).message}</p>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่
                    </button>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="ตั้งค่าระบบ" subtitle="จัดการการตั้งค่าระบบยืม-คืนอุปกรณ์">
            {/* Sticky Save Button */}
            {isDirty && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-50 animate-slide-in">
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 transition-all"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง</span>
                        <span className="sm:hidden">บันทึก</span>
                    </button>
                </div>
            )}

            <div className="max-w-4xl">
                {/* Tabs Navigation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap
                                    border-b-2 transition-all flex-1 justify-center
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Limits Tab */}
                    {activeTab === 'limits' && (
                        <>
                            {/* Loan Limits by User Type */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">ขีดจำกัดตามประเภทผู้ใช้</h2>
                                        <p className="text-sm text-gray-500 hidden sm:block">กำหนดจำนวนวันและอุปกรณ์สูงสุดสำหรับแต่ละประเภท</p>
                                    </div>
                                </div>

                                {/* Mobile View */}
                                <div className="sm:hidden space-y-4">
                                    {(['student', 'lecturer', 'staff'] as const).map(userType => (
                                        <div key={userType} className="p-4 bg-gray-50 rounded-xl">
                                            <p className="font-medium text-gray-900 mb-3">{userTypeLabels[userType]}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">จำนวนวัน</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full text-center px-3 py-2 border border-gray-200 rounded-lg"
                                                        value={loanLimits[userType].max_days}
                                                        onChange={e => handleLoanLimitChange(userType, 'max_days', parseInt(e.target.value) || 1)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">จำนวนอุปกรณ์</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full text-center px-3 py-2 border border-gray-200 rounded-lg"
                                                        value={loanLimits[userType].max_items}
                                                        onChange={e => handleLoanLimitChange(userType, 'max_items', parseInt(e.target.value) || 1)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table */}
                                <div className="space-y-6">
                                    {(['student', 'lecturer', 'staff'] as const).map(userType => (
                                        <div key={userType} className="border border-gray-100 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">{userTypeLabels[userType]}</h3>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">จำนวนวันสูงสุด:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            value={loanLimits[userType]?.max_days || 1}
                                                            onChange={e => handleLoanLimitChange(userType, 'max_days', parseInt(e.target.value) || 1)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">จำนวนอุปกรณ์รวมสูงสุด:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            value={loanLimits[userType]?.max_items || 1}
                                                            onChange={e => handleLoanLimitChange(userType, 'max_items', parseInt(e.target.value) || 1)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white">
                                                <p className="text-sm font-medium text-gray-700 mb-3">ขีดจำกัดแยกตามประเภทอุปกรณ์ (ระบุ 0 เพื่อใช้ตามค่าปกติ)</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    {(Array.isArray(equipmentTypes) ? equipmentTypes : []).map((type: Database['public']['Tables']['equipment_types']['Row']) => (
                                                        <div key={type.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl">{type.icon}</span>
                                                                <span className="text-sm text-gray-600">{type.name}</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="-"
                                                                className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                                                value={loanLimits[userType]?.type_limits?.[type.id] || ''}
                                                                onChange={e => {
                                                                    const val = parseInt(e.target.value);
                                                                    const newLimits = { ...(loanLimits[userType]?.type_limits || {}) };
                                                                    if (isNaN(val) || val <= 0) {
                                                                        delete newLimits[type.id];
                                                                    } else {
                                                                        newLimits[type.id] = val;
                                                                    }
                                                                    setLoanLimits(prev => ({
                                                                        ...prev,
                                                                        [userType]: { ...prev[userType], type_limits: newLimits }
                                                                    }));
                                                                    setIsDirty(true);
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                    {(Array.isArray(equipmentTypes) ? equipmentTypes : []).length === 0 && (
                                                        <div className="col-span-full text-center py-4 text-gray-400 text-sm">
                                                            ไม่พบข้อมูลประเภทอุปกรณ์
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Organization */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">หน่วยงาน</h2>
                                        <p className="text-sm text-gray-500">จัดการหน่วยงานและภาควิชา</p>
                                    </div>
                                </div>
                                <Link
                                    href="/admin/settings/departments"
                                    className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group"
                                >
                                    <div>
                                        <p className="font-medium text-indigo-900">จัดการหน่วยงาน/ภาควิชา</p>
                                        <p className="text-sm text-indigo-600 hidden sm:block">เพิ่ม แก้ไข หรือลบหน่วยงาน</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </section>
                        </>
                    )}

                    {/* Hours Tab */}
                    {activeTab === 'hours' && (
                        <>
                            {/* Operating Hours */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-green-50 rounded-xl">
                                        <Clock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">เวลาทำการ</h2>
                                        <p className="text-sm text-gray-500">กำหนดช่วงเวลาเปิดให้บริการ</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาเปิด</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                            value={formData.opening_time || ''}
                                            onChange={(e) => handleChange('opening_time', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาปิด</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                            value={formData.closing_time || ''}
                                            onChange={(e) => handleChange('closing_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Lunch Break */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-orange-50 rounded-xl">
                                        <Coffee className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">เวลาพักกลางวัน</h2>
                                        <p className="text-sm text-gray-500">กำหนดช่วงเวลาพักที่ไม่ให้บริการ</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เริ่มพัก</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                            value={formData.break_start_time || '12:00'}
                                            onChange={(e) => handleChange('break_start_time', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">สิ้นสุดพัก</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                            value={formData.break_end_time || '13:00'}
                                            onChange={(e) => handleChange('break_end_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Closed Dates */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <CalendarX className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">วันปิดทำการ</h2>
                                        <p className="text-sm text-gray-500">กำหนดวันหยุดที่ไม่เปิดให้ยืม/คืน/จอง</p>
                                    </div>
                                </div>

                                {/* Add new date */}
                                <div className="flex gap-2 sm:gap-3 mb-4">
                                    <input
                                        type="date"
                                        className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                                        value={newClosedDate}
                                        onChange={(e) => setNewClosedDate(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAddClosedDate}
                                        disabled={!newClosedDate}
                                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">เพิ่ม</span>
                                    </button>
                                </div>

                                {/* List of closed dates */}
                                {closedDates.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {closedDates.map(date => (
                                            <div
                                                key={date}
                                                className="flex items-center justify-between p-3 bg-red-50 rounded-xl group"
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                    <CalendarX className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-red-800 truncate">
                                                        {formatDate(date)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveClosedDate(date)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <CalendarX className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">ยังไม่มีวันปิดทำการ</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-purple-50 rounded-xl">
                                    <Zap className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">ฟีเจอร์ระบบ</h2>
                                    <p className="text-sm text-gray-500">เปิด/ปิดฟีเจอร์ต่างๆ ของระบบ</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <ToggleItem
                                    label="ระบบยืม-คืน"
                                    description="เปิดหรือปิดการให้บริการยืมอุปกรณ์"
                                    checked={formData.is_loan_system_active ?? true}
                                    onChange={(checked) => handleChange('is_loan_system_active', checked)}
                                    color="blue"
                                />
                                <ToggleItem
                                    label="การจองล่วงหน้า"
                                    description="อนุญาตให้ผู้ใช้จองอุปกรณ์ล่วงหน้า"
                                    checked={formData.is_reservation_active ?? true}
                                    onChange={(checked) => handleChange('is_reservation_active', checked)}
                                    color="blue"
                                />
                            </div>
                        </section>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <>
                            {/* Discord Integration */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-violet-50 rounded-xl">
                                        <Bell className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Discord Webhook</h2>
                                        <p className="text-sm text-gray-500">ตั้งค่าการแจ้งเตือนผ่าน Discord</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://discord.com/api/webhooks/..."
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                                        value={formData.discord_webhook_url || ''}
                                        onChange={(e) => handleChange('discord_webhook_url', e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">การแจ้งเตือนคำขอยืมใหม่จะถูกส่งไปยัง webhook นี้</p>
                                </div>
                            </section>

                            {/* Announcements */}
                            <section className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 sm:p-6 rounded-2xl border border-orange-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-orange-100 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-orange-900">ประกาศระบบ</h2>
                                        <p className="text-sm text-orange-700">แสดงข้อความประกาศบนหน้าเว็บ</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <ToggleItem
                                        label="แสดงประกาศ"
                                        description="เปิดการแสดงแบนเนอร์ประกาศบนหน้าเว็บ"
                                        checked={formData.announcement_active ?? false}
                                        onChange={(checked) => handleChange('announcement_active', checked)}
                                        color="orange"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-orange-800 mb-1.5">ข้อความประกาศ</label>
                                        <textarea
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white"
                                            placeholder="เช่น ระบบจะปิดปรับปรุงในวันอาทิตย์..."
                                            value={formData.announcement_message || ''}
                                            onChange={(e) => handleChange('announcement_message', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <>
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-teal-50 rounded-xl">
                                        <FileText className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">โลโก้เอกสาร</h2>
                                        <p className="text-sm text-gray-500">โลโก้สำหรับแสดงในใบยืมพิเศษและเอกสารอื่นๆ</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Logo Preview */}
                                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        {logoUrl ? (
                                            <div className="relative group">
                                                <img
                                                    src={logoUrl}
                                                    alt="Document Logo"
                                                    className="max-w-[200px] max-h-[200px] object-contain rounded-lg shadow-sm"
                                                />
                                                <button
                                                    onClick={handleLogoDelete}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    title="ลบโลโก้"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500 text-sm">ยังไม่มีโลโก้</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Button */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <label className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                disabled={isUploadingLogo}
                                            />
                                            <div className={`
                                            flex items-center justify-center gap-2 px-4 py-3 
                                            border-2 border-dashed border-teal-300 rounded-xl 
                                            cursor-pointer hover:bg-teal-50 transition-colors
                                            ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}>
                                                {isUploadingLogo ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                                                ) : (
                                                    <Upload className="w-5 h-5 text-teal-600" />
                                                )}
                                                <span className="text-teal-700 font-medium">
                                                    {isUploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้ใหม่'}
                                                </span>
                                            </div>
                                        </label>

                                        {logoUrl && (
                                            <button
                                                onClick={handleLogoDelete}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>ลบโลโก้</span>
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-400 text-center">
                                        รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 2MB แนะนำขนาด 200x200 พิกเซล
                                    </p>
                                </div>
                            </section>

                            {/* Template Upload Section */}
                            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Template เอกสาร DOCX</h2>
                                        <p className="text-sm text-gray-500">อัปโหลด template .docx สำหรับสร้างเอกสารอัตโนมัติ</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Template Status */}
                                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        {templateUrl ? (
                                            <div className="text-center">
                                                <div className="p-3 bg-indigo-100 rounded-xl inline-block mb-3">
                                                    <FileText className="w-10 h-10 text-indigo-600" />
                                                </div>
                                                <p className="font-medium text-gray-900 mb-1">Template พร้อมใช้งาน</p>
                                                <p className="text-xs text-gray-500 break-all max-w-xs">{templateUrl.split('/').pop()}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500 text-sm">ยังไม่มี template</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Button */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <label className="flex-1">
                                            <input
                                                type="file"
                                                accept=".docx"
                                                onChange={handleTemplateUpload}
                                                className="hidden"
                                                disabled={isUploadingTemplate}
                                            />
                                            <div className={`
                                            flex items-center justify-center gap-2 px-4 py-3 
                                            border-2 border-dashed border-indigo-300 rounded-xl 
                                            cursor-pointer hover:bg-indigo-50 transition-colors
                                            ${isUploadingTemplate ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}>
                                                {isUploadingTemplate ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                                ) : (
                                                    <Upload className="w-5 h-5 text-indigo-600" />
                                                )}
                                                <span className="text-indigo-700 font-medium">
                                                    {isUploadingTemplate ? 'กำลังอัปโหลด...' : 'อัปโหลด Template ใหม่'}
                                                </span>
                                            </div>
                                        </label>

                                        {templateUrl && (
                                            <button
                                                onClick={handleTemplateDelete}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>ลบ Template</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-indigo-50 p-4 rounded-xl">
                                        <p className="text-sm font-medium text-indigo-900 mb-2">Placeholder ที่รองรับ:</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-indigo-700">
                                            <code>{'{borrower_name}'}</code>
                                            <code>{'{borrower_phone}'}</code>
                                            <code>{'{equipment_type}'}</code>
                                            <code>{'{quantity}'}</code>
                                            <code>{'{loan_date}'}</code>
                                            <code>{'{return_date}'}</code>
                                            <code>{'{purpose}'}</code>
                                            <code>{'{today_date}'}</code>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Theme Tab */}
                    {activeTab === 'theme' && (
                        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-purple-50 rounded-xl">
                                    <Palette className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">เลือกธีม</h2>
                                    <p className="text-sm text-gray-500">เปลี่ยนรูปแบบสีและสไตล์ของระบบ</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {(Object.keys(themeInfo) as Theme[]).map((themeKey) => {
                                    const info = themeInfo[themeKey]
                                    const isActive = theme === themeKey

                                    return (
                                        <button
                                            key={themeKey}
                                            onClick={() => setTheme(themeKey)}
                                            className={`
                                                relative p-4 rounded-xl border-2 transition-all text-left
                                                ${isActive
                                                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            {/* Theme preview colors */}
                                            <div className="flex gap-2 mb-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg shadow-sm"
                                                    style={{ backgroundColor: info.colors.primary }}
                                                />
                                                <div
                                                    className="w-8 h-8 rounded-lg shadow-sm"
                                                    style={{ backgroundColor: info.colors.secondary }}
                                                />
                                                <div
                                                    className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                                                    style={{ backgroundColor: info.colors.background }}
                                                />
                                            </div>

                                            {/* Theme info */}
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {info.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {info.description}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 text-center">
                                    🎨 การเปลี่ยนธีมจะมีผลทันทีและจะถูกบันทึกไว้สำหรับการใช้งานครั้งต่อไป
                                </p>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}

// Toggle Component
function ToggleItem({
    label,
    description,
    checked,
    onChange,
    color = 'blue'
}: {
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
    color?: 'blue' | 'orange'
}) {
    const colorClasses = {
        blue: 'peer-checked:bg-blue-600 peer-focus:ring-blue-300',
        orange: 'peer-checked:bg-orange-600 peer-focus:ring-orange-300'
    }

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
            <div className="min-w-0">
                <span className="font-medium text-gray-900">{label}</span>
                <p className="text-sm text-gray-500 hidden sm:block">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${colorClasses[color]}`}></div>
            </label>
        </div>
    )
}
