'use client'

import React, { useState } from 'react'
import {
    Megaphone,
    Users,
    Bell,
    AlertTriangle,
    Eye,
    EyeOff,
    Search,
    Loader2,
    Check,
    X
} from 'lucide-react'
import { Database } from '@/supabase/types'
import { supabase } from '@/lib/supabase/client'
import ManualNotificationSender from '@/components/admin/ManualNotificationSender'
import ToggleItem from '../ToggleItem'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

const ADMIN_EVENT_LIST = [
    { key: 'new_registration',        label: 'มีผู้สมัครสมาชิกใหม่',       defaultOn: true },
    { key: 'new_loan_request',        label: 'มีคำขอยืมอุปกรณ์ใหม่',       defaultOn: true },
    { key: 'new_reservation_request', label: 'มีคำขอจองอุปกรณ์ใหม่',       defaultOn: true },
    { key: 'loan_approved',           label: 'อนุมัติการยืมแล้ว',           defaultOn: false },
    { key: 'loan_rejected',           label: 'ปฏิเสธการยืมแล้ว',           defaultOn: false },
    { key: 'loan_returned',           label: 'คืนอุปกรณ์แล้ว',             defaultOn: false },
    { key: 'reservation_approved',    label: 'อนุมัติการจองแล้ว',           defaultOn: false },
    { key: 'reservation_rejected',    label: 'ปฏิเสธการจองแล้ว',           defaultOn: false },
    { key: 'reservation_ready',       label: 'อุปกรณ์พร้อมให้รับแล้ว',     defaultOn: false },
    { key: 'reservation_converted',   label: 'แปลงการจองเป็นการยืม',       defaultOn: false },
    { key: 'special_loan_created',    label: 'สร้างการยืมพิเศษใหม่',       defaultOn: false },
    { key: 'special_loan_completed',  label: 'คืนการยืมพิเศษแล้ว',         defaultOn: false },
    { key: 'special_loan_cancelled',  label: 'ยกเลิกการยืมพิเศษ',          defaultOn: false },
]

function AdminEventCheckboxes({
    settings,
    onChange,
}: {
    settings: Record<string, any>
    onChange: (key: string, val: boolean) => void
}) {
    return (
        <div className="space-y-2">
            {ADMIN_EVENT_LIST.map(({ key, label, defaultOn }) => {
                const checked = settings[key]?.admin_welpru ?? defaultOn
                return (
                    <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onChange(key, e.target.checked)}
                            className="w-4 h-4 rounded accent-indigo-600"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                    </label>
                )
            })}
        </div>
    )
}

function AdminWelpruIdManager({
    value,
    onChange,
}: {
    value: string[]
    onChange: (ids: string[]) => void
}) {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [recipientProfiles, setRecipientProfiles] = useState<Record<string, any>>({})

    React.useEffect(() => {
        if (!value.length) return
        supabase
            .from('profiles')
            .select('user_id, first_name, last_name, role')
            .in('user_id', value)
            .then(({ data }) => {
                if (data) {
                    const map: Record<string, any> = {}
                    data.forEach((p: any) => { if (p.user_id) map[p.user_id] = p })
                    setRecipientProfiles(map)
                }
            })
    }, [value])

    React.useEffect(() => {
        if (search.trim().length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name, email, role')
                .in('role', ['admin', 'staff'])
                .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,user_id.ilike.%${search}%`)
                .limit(5)
            setResults(data || [])
            setLoading(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    const addId = (id: string) => {
        if (!value.includes(id)) {
            onChange([...value, id])
        }
        setSearch('')
        setResults([])
    }

    const removeId = (id: string) => {
        onChange(value.filter(v => v !== id))
    }

    return (
        <div className="space-y-3">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map(id => {
                        const p = recipientProfiles[id]
                        return (
                            <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-full text-xs font-medium">
                                <Users className="w-3 h-3 text-indigo-500" />
                                <span>{p ? `${p.first_name} ${p.last_name}` : id}</span>
                                <span className="text-indigo-400 font-mono">({id})</span>
                                <button
                                    type="button"
                                    onClick={() => removeId(id)}
                                    className="hover:text-red-500 transition-colors ml-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )
                    })}
                </div>
            )}

            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="ค้นหา Admin/Staff ด้วยชื่อหรือรหัส..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {loading && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                {results.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {results.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => addId(u.user_id)}
                                disabled={!u.user_id || value.includes(u.user_id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                            >
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                                    <p className="text-xs text-gray-400">{u.user_id ? `รหัส: ${u.user_id}` : 'ไม่มีรหัส'} · {u.role}</p>
                                </div>
                                {value.includes(u.user_id) && <Check className="w-4 h-4 text-indigo-500 ml-auto" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400">เฉพาะผู้ใช้ที่มี Role เป็น Admin หรือ Staff เท่านั้น และต้องมีรหัสนักศึกษา/บุคลากรในระบบ</p>
        </div>
    )
}

interface NotificationsTabProps {
    formData: SystemConfigUpdate
    onFieldChange: (field: keyof SystemConfigUpdate, val: any) => void
}

export default function NotificationsTab({ formData, onFieldChange }: NotificationsTabProps) {
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="space-y-6">
            {/* WeLPRU Push Notifications */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Megaphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">WeLPRU Push Notifications</h2>
                        <p className="text-sm text-gray-500">ตั้งค่าการแจ้งเตือนผ่านแอปพลิเคชัน WeLPRU</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <ToggleItem
                        label="เปิดใช้งานการแจ้งเตือน WeLPRU"
                        description="เปิดหรือปิดการส่งข้อความแจ้งเตือนอัตโนมัติไปยังแอปพลิเคชัน WeLPRU"
                        checked={formData.welpru_notifications_enabled ?? false}
                        onChange={(checked) => onFieldChange('welpru_notifications_enabled', checked)}
                        color="blue"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            WeLPRU API Key
                            {(formData as any).welpru_api_key ? (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>ตั้งค่าแล้ว
                                </span>
                            ) : (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>ยังไม่ได้ตั้งค่า
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showSecrets['welpru_api_key'] ? 'text' : 'password'}
                                placeholder="วาง API Key ที่ได้รับจาก WeLPRU ที่นี่..."
                                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                value={(formData as any).welpru_api_key || ''}
                                onChange={(e) => onFieldChange('welpru_api_key' as any, e.target.value || null)}
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => toggleSecret('welpru_api_key')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showSecrets['welpru_api_key'] ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">API Key จะถูกเก็บในฐานข้อมูลและใช้แทน Environment Variable โดยอัตโนมัติ</p>
                    </div>

                    {/* Setup Guide */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <span className="text-base">📋</span>วิธีขอ API Key จาก WeLPRU
                        </h4>
                        <ol className="space-y-2 text-sm text-blue-800">
                            <li className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                                <span>ไปที่เมนู <strong>&quot;ขอใช้ระบบแจ้งเตือน&quot;</strong> ในแพลตฟอร์ม WeLPRU แล้วกดปุ่ม <strong>&quot;ขอเพิ่มระบบใหม่&quot;</strong></span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                                <span>รอแอดมินอนุมัติ (สถานะจะเปลี่ยนเป็น <strong>&quot;อนุมัติแล้ว&quot;</strong>)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
                                <span>กดปุ่ม <strong>&quot;สร้าง API Key&quot;</strong> แล้วนำ Key มาวางในช่องด้านบน</span>
                            </li>
                        </ol>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-700">Endpoint: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">https://api.lpruhub.com/api</code></p>
                            <p className="text-xs text-blue-700 mt-1">Header: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">X-API-Key: &lt;your_key&gt;</code></p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Manual Notification Sender */}
            <ManualNotificationSender />

            {/* Admin WeLPRU Recipients */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">ผู้รับแจ้งเตือน Admin (WeLPRU)</h2>
                        <p className="text-sm text-gray-500">เลือก Admin / Staff ที่จะรับ Push Notification เมื่อมี Event ในระบบ</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รายชื่อผู้รับแจ้งเตือน</label>
                        <AdminWelpruIdManager
                            value={((formData as any).admin_welpru_ids as string[]) || []}
                            onChange={(ids) => onFieldChange('admin_welpru_ids' as any, ids)}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">เลือก Event ที่จะส่งแจ้งเตือนให้ Admin</label>
                        <AdminEventCheckboxes
                            settings={((formData as any).notification_settings as Record<string, any>) || {}}
                            onChange={(key, val) => {
                                const current = ((formData as any).notification_settings as Record<string, any>) || {}
                                onFieldChange('notification_settings' as any, {
                                    ...current,
                                    [key]: { ...(current[key] || {}), admin_welpru: val }
                                })
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Discord Webhook */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook URL (General & Loans)</label>
                    <div className="relative">
                        <input
                            type={showSecrets['discord_webhook_url'] ? 'text' : 'password'}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                            value={formData.discord_webhook_url || ''}
                            onChange={(e) => onFieldChange('discord_webhook_url', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => toggleSecret('discord_webhook_url')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showSecrets['discord_webhook_url'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">แยกรายการแจ้งเตือน (Optional)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ระบบสมัครสมาชิก (Authentication)</label>
                            <div className="relative">
                                <input
                                    type={showSecrets['discord_webhook_auth'] ? 'text' : 'password'}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                                    value={formData.discord_webhook_auth || ''}
                                    onChange={(e) => onFieldChange('discord_webhook_auth', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleSecret('discord_webhook_auth')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showSecrets['discord_webhook_auth'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ระบบจอง (Reservations)</label>
                            <div className="relative">
                                <input
                                    type={showSecrets['discord_webhook_reservations'] ? 'text' : 'password'}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                                    value={formData.discord_webhook_reservations || ''}
                                    onChange={(e) => onFieldChange('discord_webhook_reservations', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleSecret('discord_webhook_reservations')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showSecrets['discord_webhook_reservations'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">แจ้งเตือนข้อผิดพลาด/บำรุงรักษา (Maintenance/Errors)</label>
                            <div className="relative">
                                <input
                                    type={showSecrets['discord_webhook_maintenance'] ? 'text' : 'password'}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                                    value={formData.discord_webhook_maintenance || ''}
                                    onChange={(e) => onFieldChange('discord_webhook_maintenance', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleSecret('discord_webhook_maintenance')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showSecrets['discord_webhook_maintenance'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
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
                        onChange={(checked) => onFieldChange('announcement_active', checked)}
                        color="orange"
                    />
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium text-orange-800">ข้อความประกาศ</label>
                            <span className={`text-xs ${((formData.announcement_message || '').length > 500) ? 'text-red-650 font-bold' : 'text-orange-700'}`}>
                                {(formData.announcement_message || '').length}/500
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            maxLength={500}
                            className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                            placeholder="เช่น ระบบจะปิดปรับปรุงในวันอาทิตย์..."
                            value={formData.announcement_message || ''}
                            onChange={(e) => onFieldChange('announcement_message', e.target.value)}
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}
