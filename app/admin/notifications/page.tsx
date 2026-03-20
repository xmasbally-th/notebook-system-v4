'use client'

import React, { useState, useTransition } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Megaphone, Send, AlertTriangle, Users, User, CheckCircle2 } from 'lucide-react'
import { sendManualNotification } from './actions'

export default function AdminNotificationsPage() {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
    
    // Form state
    const [type, setType] = useState<'broadcast' | 'direct'>('broadcast')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [targetGroup, setTargetGroup] = useState<'all' | 'student' | 'personnel'>('all')
    const [userId, setUserId] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus({ type: null, message: '' })

        if (!title.trim() || !body.trim()) {
            setStatus({ type: 'error', message: 'กรุณากรอกหัวข้อและข้อความ' })
            return
        }

        if (type === 'direct' && !userId.trim()) {
            setStatus({ type: 'error', message: 'กรุณาระบุรหัสนักศึกษา/รหัสบุคลากร' })
            return
        }

        const formData = new FormData()
        formData.append('title', title)
        formData.append('body', body)
        formData.append('type', type)
        if (type === 'broadcast') {
            formData.append('target_group', targetGroup)
        } else {
            formData.append('user_id', userId)
        }

        startTransition(async () => {
            const result = await sendManualNotification(formData)
            if (result.success) {
                setStatus({ type: 'success', message: 'ส่งข้อความแจ้งเตือนเรียบร้อยแล้ว' })
                setTitle('')
                setBody('')
                setUserId('')
            } else {
                setStatus({ type: 'error', message: result.error || 'เกิดข้อผิดพลาดในการส่งข้อความ' })
            }
        })
    }

    return (
        <AdminLayout title="ระบบแจ้งเตือน" subtitle="ส่งข้อความแจ้งเตือนผ่านแอปพลิเคชัน WeLPRU">
            <div className="max-w-3xl space-y-6">
                
                {/* Status Message */}
                {status.type && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                        status.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        {status.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium">{status.message}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">ส่งข้อความแจ้งเตือน (Push Notification)</h3>
                                <p className="text-sm text-gray-500">ข้อความจะถูกส่งไปยังแอปพลิเคชัน WeLPRU ในโทรศัพท์ของผู้รับ</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Notification Type Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setType('broadcast'); setStatus({ type: null, message: '' }) }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                                        type === 'broadcast' 
                                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-200' 
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <Users className={`w-5 h-5 ${type === 'broadcast' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <div>
                                        <div className={`font-semibold ${type === 'broadcast' ? 'text-blue-900' : 'text-gray-700'}`}>แบบกลุ่ม (Broadcast)</div>
                                        <div className="text-xs text-gray-500 mt-1">ส่งข้อความไปยังกลุ่มเป้าหมายที่เลือก</div>
                                    </div>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => { setType('direct'); setStatus({ type: null, message: '' }) }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                                        type === 'direct' 
                                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-200' 
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <User className={`w-5 h-5 ${type === 'direct' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <div>
                                        <div className={`font-semibold ${type === 'direct' ? 'text-blue-900' : 'text-gray-700'}`}>ระบุบุคคล (Direct)</div>
                                        <div className="text-xs text-gray-500 mt-1">ส่งข้อความผ่านรหัสประจำตัว</div>
                                    </div>
                                </button>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Target Selection */}
                            {type === 'broadcast' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        กลุ่มเป้าหมาย (ผู้รับ)
                                    </label>
                                    <select
                                        className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={targetGroup}
                                        onChange={(e) => setTargetGroup(e.target.value as 'all' | 'student' | 'personnel')}
                                    >
                                        <option value="all">ทุกคน (All Users)</option>
                                        <option value="student">นักศึกษาทั้งหมด (All Students)</option>
                                        <option value="personnel">บุคลากร/อาจารย์ทั้งหมด (All Personnel)</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        รหัสนักศึกษา / รหัสบุคลากร เป้าหมาย <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ตัวอย่าง: 6xxxxxx หรือ Pxxxx"
                                        className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">ผู้รับจะได้รับการแจ้งเตือนเป็นรายบุคคล</p>
                                </div>
                            )}

                            {/* Message Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        หัวข้อเรื่อง (Title) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="เช่น แจ้งคืนอุปกรณ์คืน, ระบบจะปิดปรับปรุง..."
                                        className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        ข้อความแจ้งเตือน (Body) <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="โปรดนำอุปกรณ์มาคืนภายในเวลาที่กำหนด..."
                                        className="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                                >
                                    {isPending ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            กำลังดำเนินการ...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            ส่งข้อความ
                                        </span>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="flex items-center gap-2 text-yellow-800 font-medium mb-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        ข้อควรระวัง
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1 ml-6 list-disc">
                        <li>โปรดตรวจสอบข้อความให้ถี่ถ้วนก่อนส่ง</li>
                        <li>ข้อความจะถูกส่งทันที ไม่สามารถยกเลิกหรือแก้ไขได้ภายหลัง</li>
                        <li>การส่งแบบกลุ่มจะไปถึงผู้ใช้หลายคนในคราวเดียว ควรใช้เมื่อจำเป็นเท่านั้น</li>
                        <li>ต้องเปิดใช้งาน "การแจ้งเตือน WeLPRU" ในเมนูตั้งค่าระบบก่อนจึงจะสามารถส่งข้อความได้</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    )
}
