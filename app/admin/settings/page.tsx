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
    Package,
    Zap,
    Building2,
    Bell,
    ChevronRight
} from 'lucide-react'
import { Database } from '@/supabase/types'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

export default function AdminSettingsPage() {
    const { data: config, isLoading } = useSystemConfig()
    const updateMutation = useUpdateSystemConfig()

    // Local state for form
    const [formData, setFormData] = useState<SystemConfigUpdate>({})
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (config) {
            setFormData({
                max_loan_days: config.max_loan_days,
                max_items_per_user: config.max_items_per_user,
                opening_time: config.opening_time,
                closing_time: config.closing_time,
                is_loan_system_active: config.is_loan_system_active,
                is_reservation_active: config.is_reservation_active,
                discord_webhook_url: config.discord_webhook_url,
                announcement_message: config.announcement_message,
                announcement_active: config.announcement_active,
            })
        }
    }, [config])

    const handleChange = (field: keyof SystemConfigUpdate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)
    }

    const handleSave = () => {
        updateMutation.mutate(formData, {
            onSuccess: () => {
                setIsDirty(false)
                alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
            },
            onError: (err) => {
                alert(`เกิดข้อผิดพลาด: ${err.message}`)
            }
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

    return (
        <AdminLayout title="ตั้งค่าระบบ" subtitle="จัดการการตั้งค่าระบบยืม-คืนอุปกรณ์">
            {/* Sticky Save Button */}
            {isDirty && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
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
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            )}

            <div className="max-w-4xl space-y-6">
                {/* Loan Limits */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">ขีดจำกัดการยืม</h2>
                            <p className="text-sm text-gray-500">กำหนดจำนวนวันและจำนวนอุปกรณ์ที่ยืมได้</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนวันสูงสุด</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={formData.max_loan_days || ''}
                                onChange={(e) => handleChange('max_loan_days', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-gray-400 mt-1.5">จำนวนวันสูงสุดที่ผู้ใช้สามารถยืมอุปกรณ์ได้</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนอุปกรณ์สูงสุดต่อผู้ใช้</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={formData.max_items_per_user || ''}
                                onChange={(e) => handleChange('max_items_per_user', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-gray-400 mt-1.5">จำนวนอุปกรณ์ที่ผู้ใช้สามารถยืมพร้อมกันได้</p>
                        </div>
                    </div>
                </section>

                {/* Operating Hours */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">เวลาทำการ</h2>
                            <p className="text-sm text-gray-500">กำหนดช่วงเวลาเปิดให้บริการ</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาเปิด</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                value={formData.opening_time || ''}
                                onChange={(e) => handleChange('opening_time', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาปิด</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                value={formData.closing_time || ''}
                                onChange={(e) => handleChange('closing_time', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Feature Toggles */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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

                {/* Organization */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
                            <p className="text-sm text-indigo-600">เพิ่ม แก้ไข หรือลบหน่วยงาน</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </section>

                {/* Discord Integration */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-violet-50 rounded-xl">
                            <Bell className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h2>
                            <p className="text-sm text-gray-500">ตั้งค่าการแจ้งเตือนผ่าน Discord</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Discord Webhook URL</label>
                        <input
                            type="url"
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-sm transition-all"
                            value={formData.discord_webhook_url || ''}
                            onChange={(e) => handleChange('discord_webhook_url', e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">การแจ้งเตือนคำขอยืมใหม่จะถูกส่งไปยัง webhook นี้</p>
                    </div>
                </section>

                {/* Announcements */}
                <section className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-2xl border border-orange-200 shadow-sm">
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
                                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                                placeholder="เช่น ระบบจะปิดปรับปรุงในวันอาทิตย์..."
                                value={formData.announcement_message || ''}
                                onChange={(e) => handleChange('announcement_message', e.target.value)}
                            />
                        </div>
                    </div>
                </section>
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
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
                <span className="font-medium text-gray-900">{label}</span>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
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
