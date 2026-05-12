'use client'

import React, { useState } from 'react'
import { Send, Users, User, AlertCircle, CheckCircle2, Loader2, Plus, X } from 'lucide-react'
import { sendManualNotification } from '@/app/admin/settings/actions'

export default function ManualNotificationSender() {
    const [type, setType] = useState<'group' | 'individual'>('group')
    const [targetGroup, setTargetGroup] = useState<'all' | 'student' | 'personnel'>('all')
    const [userIds, setUserIds] = useState<string[]>([])
    const [currentUserId, setCurrentUserId] = useState('')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [link, setLink] = useState('')
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleAddUser = () => {
        if (currentUserId.trim() && !userIds.includes(currentUserId.trim())) {
            setUserIds([...userIds, currentUserId.trim()])
            setCurrentUserId('')
        }
    }

    const handleRemoveUser = (id: string) => {
        setUserIds(userIds.filter(uid => uid !== id))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddUser()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)

        if (!title.trim() || !body.trim()) {
            setStatus({ type: 'error', message: 'กรุณากรอกหัวข้อและรายละเอียด' })
            return
        }

        if (type === 'individual' && userIds.length === 0) {
            setStatus({ type: 'error', message: 'กรุณาระบุรหัสผู้ใช้อย่างน้อย 1 คน' })
            return
        }

        setIsSubmitting(true)
        try {
            const result = await sendManualNotification({
                type,
                targetGroup: type === 'group' ? targetGroup : undefined,
                userIds: type === 'individual' ? userIds : undefined,
                title,
                body,
                link: link.trim() || undefined
            })

            if (result.success) {
                setStatus({ type: 'success', message: 'ส่งการแจ้งเตือนเรียบร้อยแล้ว' })
                setTitle('')
                setBody('')
                setLink('')
                if (type === 'individual') setUserIds([])
            } else {
                setStatus({ type: 'error', message: result.error || 'เกิดข้อผิดพลาดในการส่ง' })
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'เกิดข้อผิดพลาด' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-50 rounded-xl">
                    <Send className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">ส่งการแจ้งเตือน (Manual Send)</h2>
                    <p className="text-sm text-gray-500">ส่งข้อความแจ้งเตือนผ่าน WeLPRU แบบกำหนดเอง</p>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-xl mb-5 flex items-center gap-3 ${
                    status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{status.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการส่ง</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('group')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                type === 'group'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                            }`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-medium">ส่งแบบกลุ่ม</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('individual')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                type === 'individual'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                            }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="font-medium">ส่งรายบุคคล</span>
                        </button>
                    </div>
                </div>

                {/* Target Selection */}
                {type === 'group' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">กลุ่มเป้าหมาย</label>
                        <select
                            value={targetGroup}
                            onChange={(e) => setTargetGroup(e.target.value as any)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">ทุกคนในระบบ (All Users)</option>
                            <option value="student">นักศึกษา (Students)</option>
                            <option value="personnel">บุคลากร (Personnel)</option>
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผู้ใช้ (User IDs)</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="เช่น 6600001, 30489..."
                                value={currentUserId}
                                onChange={(e) => setCurrentUserId(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleAddUser}
                                disabled={!currentUserId.trim()}
                                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 disabled:opacity-50 transition-colors flex items-center justify-center"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        {userIds.length > 0 ? (
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 min-h-[60px]">
                                {userIds.map(id => (
                                    <span key={id} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-full shadow-sm">
                                        {id}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(id)}
                                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100 border-dashed text-center">
                                ยังไม่มีผู้รับ พิมพ์รหัสผู้ใช้แล้วกดเพิ่ม หรือกด Enter
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อการแจ้งเตือน <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            placeholder="เช่น ประกาศสำคัญจากระบบ..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด <span className="text-red-500">*</span></label>
                        <textarea
                            required
                            rows={3}
                            placeholder="พิมพ์ข้อความที่ต้องการแจ้งให้ผู้ใช้ทราบ..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>
                    {type === 'individual' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์เพิ่มเติม (ไม่บังคับ)</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">เฉพาะการส่งแบบรายบุคคลที่รองรับการเปิดลิงก์เมื่อกดดูแจ้งเตือน</p>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || !body.trim() || (type === 'individual' && userIds.length === 0)}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังส่ง...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                ส่งการแจ้งเตือน
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
