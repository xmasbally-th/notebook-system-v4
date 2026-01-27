'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ChatWindow from '@/components/chat/ChatWindow'
import { MessageSquare, User, Clock, CheckCircle } from 'lucide-react'

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

    // Fetch Tickets
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-tickets'],
        queryFn: async () => {
            // Cast to any to avoid type errors with recent table additions
            const { data, error } = await (supabase as any)
                .from('support_tickets')
                .select('*, profiles(first_name, last_name, email, avatar_url)')
                .order('updated_at', { ascending: false })

            if (error) throw error
            return data
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

    return (
        <AdminLayout title="System Support" subtitle="จัดการการสนทนาและแจ้งปัญหาการใช้งาน">
            <div className="h-[calc(100vh-200px)] flex gap-6">
                {/* Sidebar: Ticket List */}
                <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
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
                            <div className="p-4 text-center text-gray-400">Loading...</div>
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
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                        {profile?.avatar_url ? (
                                                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {profile?.first_name} {profile?.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{profile?.email}</p>
                                                    </div>
                                                </div>
                                                {isOpen ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-medium">Open</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">Closed</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-2 pl-10">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {timeAgo(ticket.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Chat Window */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
                    {selectedTicketId && currentUserId ? (
                        <>
                            <div className="absolute top-3 right-4 z-10">
                                {tickets?.find((t: any) => t.id === selectedTicketId)?.status === 'open' && (
                                    <button
                                        onClick={() => closeTicketMutation.mutate(selectedTicketId)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-gray-300"
                                    >
                                        <CheckCircle className="w-3 h-3" /> Mark Resolved
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
                            <p>Select a ticket to view conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
