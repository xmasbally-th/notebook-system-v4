'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ChatWindow from '@/components/chat/ChatWindow'
import { createTicketForUserAction } from '@/components/chat/actions'
import { MessageSquare, User, Clock, CheckCircle, ArrowLeft, ChevronRight, Settings, Bot, Save, Eye, ChevronDown, ChevronUp, Plus, Search, X, Loader2 } from 'lucide-react'

// Helper for time ago
function timeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว"

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว"

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " วันที่แล้ว"

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " ชั่วโมงที่แล้ว"

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว"

    return "เมื่อสักครู่"
}

export default function AdminSupportPage() {
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
    const [autoReplyMessage, setAutoReplyMessage] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const [showNewChatModal, setShowNewChatModal] = useState(false)
    const [userSearch, setUserSearch] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [initialMessage, setInitialMessage] = useState('')

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    }, [])

    // Search users for new chat modal
    const { data: searchUsers, isLoading: searchLoading } = useQuery({
        queryKey: ['search-users', userSearch],
        queryFn: async () => {
            let query = (supabase as any)
                .from('profiles')
                .select('id, first_name, last_name, email, avatar_url, role')
                .eq('status', 'approved')
                .not('role', 'in', '(admin,staff)')
                .order('first_name')
                .limit(20)

            if (userSearch.trim()) {
                query = query.or(`first_name.ilike.%${userSearch}%,last_name.ilike.%${userSearch}%,email.ilike.%${userSearch}%`)
            }

            const { data, error } = await query
            if (error) throw error
            return data as { id: string, first_name: string, last_name: string, email: string, avatar_url: string | null, role: string }[]
        },
        enabled: showNewChatModal,
    })

    // Create ticket for user mutation
    const createChatMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUserId) throw new Error('No user selected')
            return await createTicketForUserAction(selectedUserId, initialMessage || undefined)
        },
        onSuccess: (ticket) => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
            setSelectedTicketId(ticket.id)
            setShowNewChatModal(false)
            setUserSearch('')
            setSelectedUserId(null)
            setInitialMessage('')
        },
    })

    // Fetch auto-reply settings
    const { data: autoReplyConfig } = useQuery({
        queryKey: ['auto-reply-config'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('system_config')
                .select('support_auto_reply_enabled, support_auto_reply_message')
                .eq('id', 1)
                .single()

            if (error) throw error
            return data as { support_auto_reply_enabled: boolean, support_auto_reply_message: string | null }
        }
    })

    // Initialize settings when config loads
    useEffect(() => {
        if (autoReplyConfig) {
            setAutoReplyEnabled(autoReplyConfig.support_auto_reply_enabled ?? true)
            setAutoReplyMessage(autoReplyConfig.support_auto_reply_message || '')
        }
    }, [autoReplyConfig])

    // Save auto-reply settings mutation
    const saveAutoReplyMutation = useMutation({
        mutationFn: async () => {
            const { error } = await (supabase as any)
                .from('system_config')
                .update({
                    support_auto_reply_enabled: autoReplyEnabled,
                    support_auto_reply_message: autoReplyMessage.trim() || null,
                })
                .eq('id', 1)

            if (error) throw error
        },
        onMutate: () => setSaveStatus('saving'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auto-reply-config'] })
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        },
        onError: () => setSaveStatus('idle'),
    })

    // Realtime subscription for tickets
    useEffect(() => {
        const channel = supabase
            .channel('admin-support-tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_tickets' },
                () => queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [queryClient])

    // Fetch Tickets with unread count
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-tickets'],
        queryFn: async () => {
            // Fetch tickets with profile info
            const { data: ticketData, error } = await (supabase as any)
                .from('support_tickets')
                .select('*, profiles(first_name, last_name, email, avatar_url)')
                .order('updated_at', { ascending: false })

            if (error) throw error

            // Fetch unread counts for each ticket (user messages that admin hasn't read)
            const ticketIds = ticketData.map((t: any) => t.id)
            const { data: unreadData } = await (supabase as any)
                .from('support_messages')
                .select('ticket_id')
                .in('ticket_id', ticketIds)
                .eq('is_staff_reply', false)  // User messages only
                .is('read_at', null)          // Unread only

            // Count unread per ticket
            const unreadCounts: Record<string, number> = {}
            unreadData?.forEach((msg: any) => {
                unreadCounts[msg.ticket_id] = (unreadCounts[msg.ticket_id] || 0) + 1
            })

            // Merge unread counts into tickets
            return ticketData.map((ticket: any) => ({
                ...ticket,
                unread_count: unreadCounts[ticket.id] || 0
            }))
        }
    })

    // Close Ticket Mutation
    const closeTicketMutation = useMutation({
        mutationFn: async (ticketId: string) => {
            const { error } = await (supabase as any)
                .from('support_tickets')
                .update({ status: 'closed' })
                .eq('id', ticketId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
        }
    })

    // Get selected ticket info for mobile header
    const selectedTicket = tickets?.find((t: any) => t.id === selectedTicketId)
    const selectedProfile = selectedTicket?.profiles as any

    // Handle back button on mobile
    const handleBackToList = () => {
        setSelectedTicketId(null)
    }

    // Check if settings changed
    const hasChanges = autoReplyConfig && (
        autoReplyEnabled !== (autoReplyConfig.support_auto_reply_enabled ?? true) ||
        autoReplyMessage !== (autoReplyConfig.support_auto_reply_message || '')
    )

    return (
        <AdminLayout title="System Support" subtitle="จัดการการสนทนาและแจ้งปัญหาการใช้งาน">
            {/* Auto-Reply Settings Panel */}
            <div className="mb-4">
                <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">ตั้งค่าข้อความอัตโนมัติ</span>
                        {autoReplyEnabled && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-medium">เปิดใช้งาน</span>
                        )}
                    </div>
                    {settingsOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </button>

                {settingsOpen && (
                    <div className="mt-2 p-4 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
                        {/* Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">เปิดใช้งานข้อความอัตโนมัติ</span>
                            </div>
                            <button
                                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoReplyEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Message Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                ข้อความอัตโนมัติ
                            </label>
                            <textarea
                                value={autoReplyMessage}
                                onChange={(e) => setAutoReplyMessage(e.target.value)}
                                disabled={!autoReplyEnabled}
                                rows={3}
                                placeholder="พิมพ์ข้อความอัตโนมัติที่ผู้ใช้จะได้รับเมื่อเปิด Support Chat..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">ข้อความนี้จะส่งให้ผู้ใช้โดยอัตโนมัติเมื่อเปิดห้องแชทใหม่</p>
                        </div>

                        {/* Preview Toggle */}
                        {autoReplyEnabled && autoReplyMessage && (
                            <div>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    {showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}
                                </button>

                                {showPreview && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-[10px] text-gray-400 mb-2 text-center">ตัวอย่างที่ผู้ใช้จะเห็น</p>
                                        <div className="flex justify-center">
                                            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm bg-blue-50 border border-blue-100 text-gray-700">
                                                <div className="flex items-center gap-1.5 mb-1 text-blue-600 font-medium text-xs">
                                                    <span>🤖</span>
                                                    <span>ข้อความอัตโนมัติ</span>
                                                </div>
                                                <p>{autoReplyMessage}</p>
                                                <div className="flex items-center justify-end mt-1 text-gray-400">
                                                    <span className="text-[10px]">เมื่อสักครู่</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => saveAutoReplyMutation.mutate()}
                                disabled={!hasChanges || saveAutoReplyMutation.isPending}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saveStatus === 'saved'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : hasChanges
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {saveStatus === 'saving' ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : saveStatus === 'saved' ? (
                                    <>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        บันทึกแล้ว
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        บันทึกการตั้งค่า
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Layout - Stack view with toggle */}
            <div className="md:hidden h-[calc(100vh-180px)] flex flex-col">
                {/* Mobile: Show ticket list when no ticket selected */}
                {!selectedTicketId ? (
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                รายการแชท
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowNewChatModal(true)}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    เปิดแชทใหม่
                                </button>
                                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                    {tickets?.filter((t: any) => t.status === 'open').length || 0} Open
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 text-center text-gray-400">กำลังโหลด...</div>
                            ) : tickets?.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">ไม่มีรายการแจ้งปัญหา</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {tickets?.map((ticket: any) => {
                                        const profile = ticket.profiles as any
                                        const isOpen = ticket.status === 'open'

                                        return (
                                            <div
                                                key={ticket.id}
                                                onClick={() => setSelectedTicketId(ticket.id)}
                                                className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
                                            >
                                                {/* Avatar */}
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {profile?.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                                            {profile?.first_name} {profile?.last_name}
                                                        </p>
                                                        {isOpen ? (
                                                            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs bg-green-100 text-green-700 font-medium flex-shrink-0">Open</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs bg-gray-100 text-gray-600 flex-shrink-0">Closed</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{profile?.email}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {timeAgo(ticket.updated_at)}
                                                    </p>
                                                </div>

                                                {/* Unread badge or Arrow indicator */}
                                                {ticket.unread_count > 0 ? (
                                                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                                                        {ticket.unread_count > 99 ? '99+' : ticket.unread_count}
                                                    </span>
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Mobile: Show chat window when ticket selected */
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        {/* Mobile Chat Header */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <button
                                onClick={handleBackToList}
                                className="p-2 -ml-1 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                aria-label="กลับไปรายการ"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {selectedProfile?.avatar_url ? (
                                    <img src={selectedProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-gray-500" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {selectedProfile?.first_name} {selectedProfile?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{selectedProfile?.email}</p>
                            </div>

                            {selectedTicket?.status === 'open' && (
                                <button
                                    onClick={() => closeTicketMutation.mutate(selectedTicketId)}
                                    className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-xs px-2 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-gray-300 flex-shrink-0"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span className="hidden xs:inline">ปิด</span>
                                </button>
                            )}
                        </div>

                        {/* Chat Content */}
                        <div className="flex-1 overflow-hidden">
                            {currentUserId && (
                                <ChatWindow
                                    ticketId={selectedTicketId}
                                    currentUserId={currentUserId}
                                    isStaffView={true}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop/Tablet Layout - Side by side */}
            <div className="hidden md:flex h-[calc(100vh-200px)] gap-4 lg:gap-6">
                {/* Sidebar: Ticket List */}
                <div className="w-80 lg:w-96 xl:w-[400px] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                            รายการแชท
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                เปิดแชทใหม่
                            </button>
                            <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                {tickets?.filter((t: any) => t.status === 'open').length || 0} Open
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-400">กำลังโหลด...</div>
                        ) : tickets?.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">ไม่มีรายการแจ้งปัญหา</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {tickets?.map((ticket: any) => {
                                    const profile = ticket.profiles as any
                                    const isOpen = ticket.status === 'open'
                                    const isSelected = selectedTicketId === ticket.id

                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => setSelectedTicketId(ticket.id)}
                                            className={`
                                                p-4 cursor-pointer hover:bg-gray-50 transition-colors
                                                ${isSelected ? 'bg-purple-50 border-l-4 border-purple-600' : 'border-l-4 border-transparent'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {profile?.avatar_url ? (
                                                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {profile?.first_name} {profile?.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                                                    </div>
                                                </div>
                                                {isOpen ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-medium flex-shrink-0 ml-2">Open</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 flex-shrink-0 ml-2">Closed</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-2 pl-12">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {timeAgo(ticket.updated_at)}
                                                </p>
                                                {ticket.unread_count > 0 && (
                                                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
                                                        {ticket.unread_count > 99 ? '99+' : ticket.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Chat Window */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden relative min-w-0">
                    {selectedTicketId && currentUserId ? (
                        <>
                            <div className="absolute top-3 right-4 z-10">
                                {tickets?.find((t: any) => t.id === selectedTicketId)?.status === 'open' && (
                                    <button
                                        onClick={() => closeTicketMutation.mutate(selectedTicketId)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-gray-300"
                                    >
                                        <CheckCircle className="w-3 h-3" /> ปิดการสนทนา
                                    </button>
                                )}
                            </div>
                            <ChatWindow
                                ticketId={selectedTicketId}
                                currentUserId={currentUserId}
                                isStaffView={true}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-center px-4">เลือกรายการแชทเพื่อดูการสนทนา</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewChatModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-purple-600" />
                                เปิดแชทใหม่
                            </h3>
                            <button
                                onClick={() => { setShowNewChatModal(false); setSelectedUserId(null); setUserSearch(''); setInitialMessage(''); }}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="ค้นหาผู้ใช้ (ชื่อ / อีเมล)..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto min-h-0 max-h-[300px]">
                            {searchLoading ? (
                                <div className="p-6 text-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </div>
                            ) : !searchUsers?.length ? (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    {userSearch ? 'ไม่พบผู้ใช้' : 'พิมพ์เพื่อค้นหาผู้ใช้'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {searchUsers.map((u) => (
                                        <div
                                            key={u.id}
                                            onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)}
                                            className={`p-3 cursor-pointer flex items-center gap-3 transition-colors ${selectedUserId === u.id
                                                    ? 'bg-purple-50 border-l-4 border-purple-600'
                                                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                                                }`}
                                        >
                                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                            </div>
                                            {selectedUserId === u.id && (
                                                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Initial Message (optional) */}
                        {selectedUserId && (
                            <div className="p-3 border-t border-gray-100">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    ข้อความแรก (ไม่จำเป็นต้องใส่)
                                </label>
                                <textarea
                                    value={initialMessage}
                                    onChange={(e) => setInitialMessage(e.target.value)}
                                    rows={2}
                                    placeholder="พิมพ์ข้อความแรกที่จะส่งให้ผู้ใช้..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-3 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => { setShowNewChatModal(false); setSelectedUserId(null); setUserSearch(''); setInitialMessage(''); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => createChatMutation.mutate()}
                                disabled={!selectedUserId || createChatMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createChatMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        กำลังเปิด...
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-4 h-4" />
                                        เปิดแชท
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

