'use client'

import React, { useEffect, useState } from 'react'
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useSystemConfig'
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
    RefreshCw
} from 'lucide-react'
import { Database } from '@/supabase/types'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

type LoanLimitsByType = {
    student: { max_days: number; max_items: number }
    lecturer: { max_days: number; max_items: number }
    staff: { max_days: number; max_items: number }
}

const defaultLoanLimits: LoanLimitsByType = {
    student: { max_days: 3, max_items: 1 },
    lecturer: { max_days: 7, max_items: 3 },
    staff: { max_days: 5, max_items: 2 }
}

const userTypeLabels: Record<string, string> = {
    student: 'นักศึกษา',
    lecturer: 'อาจารย์',
    staff: 'บุคลากร'
}

type TabType = 'limits' | 'hours' | 'features' | 'notifications'

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'limits', label: 'ขีดจำกัด', icon: <Users className="w-4 h-4" /> },
    { id: 'hours', label: 'เวลาทำการ', icon: <Clock className="w-4 h-4" /> },
    { id: 'features', label: 'ฟีเจอร์', icon: <Zap className="w-4 h-4" /> },
    { id: 'notifications', label: 'แจ้งเตือน', icon: <Megaphone className="w-4 h-4" /> },
]

export default function AdminSettingsPage() {
    const { data: config, isLoading, error, refetch } = useSystemConfig()
    const updateMutation = useUpdateSystemConfig()

    const [activeTab, setActiveTab] = useState<TabType>('limits')
    const [formData, setFormData] = useState<SystemConfigUpdate>({})
    const [isDirty, setIsDirty] = useState(false)
    const [loanLimits, setLoanLimits] = useState<LoanLimitsByType>(defaultLoanLimits)
    const [closedDates, setClosedDates] = useState<string[]>([])
    const [newClosedDate, setNewClosedDate] = useState('')

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
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">ประเภทผู้ใช้</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500">จำนวนวันสูงสุด</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500">จำนวนอุปกรณ์สูงสุด</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(['student', 'lecturer', 'staff'] as const).map(userType => (
                                                <tr key={userType} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <span className="font-medium text-gray-900">{userTypeLabels[userType]}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-20 mx-auto block text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            value={loanLimits[userType].max_days}
                                                            onChange={e => handleLoanLimitChange(userType, 'max_days', parseInt(e.target.value) || 1)}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-20 mx-auto block text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            value={loanLimits[userType].max_items}
                                                            onChange={e => handleLoanLimitChange(userType, 'max_items', parseInt(e.target.value) || 1)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
