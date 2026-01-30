'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ChatWindow from '@/components/chat/ChatWindow'
import { MessageSquare, User, Clock, CheckCircle, ArrowLeft, ChevronRight } from 'lucide-react'

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

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    }, [])

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

    return (
        <AdminLayout title="System Support" subtitle="จัดการการสนทนาและแจ้งปัญหาการใช้งาน">
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
                            <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                {tickets?.filter((t: any) => t.status === 'open').length || 0} Open
                            </span>
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
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {tickets?.filter((t: any) => t.status === 'open').length || 0} Open
                        </span>
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
        </AdminLayout>
    )
}
