'use client'

import React, { useState, useEffect } from 'react'
import { Send, Users, User, AlertCircle, CheckCircle2, Loader2, Plus, X, Search } from 'lucide-react'
import { sendManualNotification } from '@/app/admin/settings/actions'
import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export default function ManualNotificationSender() {
    const [type, setType] = useState<'group' | 'individual'>('group')
    const [targetGroup, setTargetGroup] = useState<'all' | 'student' | 'personnel'>('all')
    const [selectedUsers, setSelectedUsers] = useState<any[]>([])
    const [userSearch, setUserSearch] = useState('')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [link, setLink] = useState('')
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    // Debounce user search input to prevent query flooding
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(userSearch)
        }, 300)
        return () => clearTimeout(handler)
    }, [userSearch])

    // User search query (triggered by debounced search term)
    const { data: searchUsers, isLoading: searchLoading } = useQuery({
        queryKey: ['search-users-notify', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch.trim()) return []
            
            const { data, error } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name, email, avatar_url')
                .eq('status', 'approved')
                .or(`first_name.ilike.${debouncedSearch}%,last_name.ilike.${debouncedSearch}%,email.ilike.${debouncedSearch}%,user_id.ilike.${debouncedSearch}%`)
                .limit(10)

            if (error) throw error
            return data
        },
        enabled: type === 'individual' && !!debouncedSearch.trim()
    })

    const handleAddUser = (user: any) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user])
            setUserSearch('') // Clear search after picking
        }
    }

    const handleRemoveUser = (id: string) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== id))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)

        if (!title.trim() || !body.trim()) {
            setStatus({ type: 'error', message: 'กรุณากรอกหัวข้อและรายละเอียด' })
            return
        }

        if (title.length > 65) {
            setStatus({ type: 'error', message: 'หัวข้อการแจ้งเตือนต้องไม่เกิน 65 ตัวอักษร' })
            return
        }

        if (body.length > 240) {
            setStatus({ type: 'error', message: 'รายละเอียดการแจ้งเตือนต้องไม่เกิน 240 ตัวอักษร' })
            return
        }

        if (type === 'individual' && selectedUsers.length === 0) {
            setStatus({ type: 'error', message: 'กรุณาเลือกผู้รับอย่างน้อย 1 คน' })
            return
        }

        if (type === 'group') {
            setShowConfirmModal(true)
        } else {
            executeNotificationSend()
        }
    }

    const executeNotificationSend = async () => {
        setIsSubmitting(true)
        try {
            const result = await sendManualNotification({
                type,
                targetGroup: type === 'group' ? targetGroup : undefined,
                userIds: type === 'individual' ? selectedUsers.map(u => u.user_id).filter(Boolean) : undefined,
                title,
                body,
                link: link.trim() || undefined
            })

            if (result.success) {
                setStatus({ type: 'success', message: 'ส่งการแจ้งเตือนเรียบร้อยแล้ว' })
                setTitle('')
                setBody('')
                setLink('')
                if (type === 'individual') setSelectedUsers([])
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาผู้รับ (รายบุคคล)</label>
                        <div className="relative mb-3">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="พิมพ์ชื่อ, นามสกุล, อีเมล หรือรหัสผู้ใช้เพื่อค้นหา..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            
                            {/* Search Results Dropdown */}
                            {userSearch.trim() && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                                    {searchLoading ? (
                                        <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> กำลังค้นหา...
                                        </div>
                                    ) : !searchUsers?.length ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">ไม่พบผู้ใช้ที่ตรงกับคำค้นหา</div>
                                    ) : (
                                        <div className="p-1">
                                            {searchUsers.map((u: any) => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => handleAddUser(u)}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                        {u.avatar_url ? (
                                                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {u.first_name} {u.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{u.user_id ? `รหัส: ${u.user_id}` : ''} {u.email ? `(${u.email})` : ''}</p>
                                                    </div>
                                                    {selectedUsers.find(su => su.id === u.id) && (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Users List */}
                        {selectedUsers.length > 0 ? (
                            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-[150px] overflow-y-auto">
                                {selectedUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-3 h-3 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0 text-sm">
                                                <p className="font-medium text-gray-900 truncate leading-tight">
                                                    {user.first_name} {user.last_name}
                                                </p>
                                                <p className="text-[10px] text-gray-500 truncate leading-tight">{user.user_id ? `รหัส: ${user.user_id}` : ''} {user.email ? `(${user.email})` : ''}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(user.id)}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors flex-shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100 border-dashed text-center">
                                ยังไม่มีผู้รับ พิมพ์ค้นหาแล้วคลิกเพื่อเพิ่ม
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">หัวข้อการแจ้งเตือน <span className="text-red-500">*</span></label>
                            <span className={`text-xs ${(title.length > 65) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{title.length}/65</span>
                        </div>
                        <input
                            type="text"
                            required
                            maxLength={65}
                            placeholder="เช่น ประกาศสำคัญจากระบบ..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">รายละเอียด <span className="text-red-500">*</span></label>
                            <span className={`text-xs ${(body.length > 240) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{body.length}/240</span>
                        </div>
                        <textarea
                            required
                            rows={3}
                            maxLength={240}
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
                        disabled={isSubmitting || !title.trim() || !body.trim() || (type === 'individual' && selectedUsers.length === 0)}
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

            {/* Confirmation Modal for Group Broadcasting */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 animate-in scale-in duration-200">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertCircle className="w-8 h-8 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-gray-900">ยืนยันการส่งแจ้งเตือนกลุ่ม?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 font-normal">
                            คุณกำลังจะส่งข้อความแจ้งเตือนถึงผู้ใช้ทั้งหมดในกลุ่ม <strong className="text-gray-900">"{targetGroup === 'all' ? 'ผู้ใช้ทุกคน' : targetGroup === 'student' ? 'นักศึกษา' : 'บุคลากร'}"</strong> ข้อความนี้จะถูกส่งไปยังแอปพลิเคชัน WeLPRU ทันที กรุณาตรวจสอบความถูกต้องของหัวข้อและรายละเอียดก่อนกดส่ง
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmModal(false)
                                    executeNotificationSend()
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-colors"
                            >
                                ยืนยันการส่ง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
