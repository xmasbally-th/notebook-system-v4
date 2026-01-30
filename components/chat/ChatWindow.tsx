'use client'

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'
import { Send, X, MessageSquare, Loader2, Check, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sendMessageAction, markMessagesAsReadAction } from './actions'

// Extended Message type with read_at (may not be in generated types yet)
type Message = Database['public']['Tables']['support_messages']['Row'] & {
    read_at?: string | null
}

interface ChatWindowProps {
    ticketId: string
    currentUserId: string
    isStaffView?: boolean
    onClose?: () => void
}

export default function ChatWindow({ ticketId, currentUserId, isStaffView = false, onClose }: ChatWindowProps) {
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    // Realtime Subscription - Hybrid: use payload + invalidate as fallback
    useEffect(() => {
        const channel = supabase
            .channel(`ticket-${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `ticket_id=eq.${ticketId}`
                },
                (payload) => {
                    const newMessage = payload.new as Message

                    // Try to add message directly to cache (instant)
                    queryClient.setQueryData<Message[]>(['chat-messages', ticketId], (old) => {
                        if (!old) return [newMessage]

                        // Avoid duplicates (from optimistic update or previous events)
                        const exists = old.some(msg =>
                            msg.id === newMessage.id ||
                            (msg.id.startsWith('optimistic-') &&
                                msg.message === newMessage.message &&
                                msg.sender_id === newMessage.sender_id)
                        )

                        if (exists) {
                            // Replace optimistic message with real one
                            return old.map(msg =>
                                msg.id.startsWith('optimistic-') &&
                                    msg.message === newMessage.message &&
                                    msg.sender_id === newMessage.sender_id
                                    ? newMessage
                                    : msg
                            )
                        }

                        return [...old, newMessage]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [ticketId, queryClient])

    // Polling fallback for RLS edge cases (every 3 seconds when window is focused)
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null

        const startPolling = () => {
            intervalId = setInterval(() => {
                if (document.hasFocus()) {
                    queryClient.invalidateQueries({ queryKey: ['chat-messages', ticketId] })
                }
            }, 3000)
        }

        const stopPolling = () => {
            if (intervalId) {
                clearInterval(intervalId)
                intervalId = null
            }
        }

        // Only poll when tab is visible
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                startPolling()
            } else {
                stopPolling()
            }
        }

        if (document.visibilityState === 'visible') {
            startPolling()
        }

        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            stopPolling()
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [ticketId, queryClient])

    // Scroll to bottom on new messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Fetch Messages
    const { data: messages, isLoading } = useQuery({
        queryKey: ['chat-messages', ticketId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('support_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data as Message[]
        }
    })

    useEffect(() => {
        if (messages) {
            scrollToBottom()
        }
    }, [messages])

    // Mark messages from other party as read when component mounts or messages change
    useEffect(() => {
        if (messages && messages.length > 0) {
            // Check if there are unread messages from the other side
            const hasUnreadFromOther = messages.some(msg => {
                const isFromOther = isStaffView ? !msg.is_staff_reply : msg.is_staff_reply
                return isFromOther && !msg.read_at
            })

            if (hasUnreadFromOther) {
                markMessagesAsReadAction(ticketId).catch(err =>
                    console.error('Failed to mark messages as read:', err)
                )
            }
        }
    }, [messages, ticketId, isStaffView])

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (text: string) => {
            if (!text.trim()) return
            await sendMessageAction(ticketId, text)
        },
        onMutate: async (text) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['chat-messages', ticketId] })

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData<Message[]>(['chat-messages', ticketId])

            // Optimistically update to the new value
            if (previousMessages) {
                const optimisticMessage: Message = {
                    id: 'optimistic-' + Math.random(),
                    ticket_id: ticketId,
                    sender_id: currentUserId,
                    message: text,
                    is_staff_reply: isStaffView,
                    created_at: new Date().toISOString(),
                    read_at: null  // New message is unread
                }

                queryClient.setQueryData<Message[]>(['chat-messages', ticketId], [
                    ...previousMessages,
                    optimisticMessage
                ])
            }

            return { previousMessages }
        },
        onError: (err, newTodo, context) => {
            // Rollback to the previous value
            if (context?.previousMessages) {
                queryClient.setQueryData(['chat-messages', ticketId], context.previousMessages)
            }
        },
        // onSettled removed - Realtime subscription handles message sync automatically
    })

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        sendMessageMutation.mutate(newMessage)
        setNewMessage('') // Clear input immediately
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className={`p-4 ${isStaffView ? 'bg-purple-600' : 'bg-teal-600'} text-white flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-semibold">Support Chat</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px] max-h-[500px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : messages?.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p>เริ่มสนทนาได้เลย</p>
                    </div>
                ) : (
                    messages?.map((msg) => {
                        const isMe = msg.sender_id === currentUserId
                        // If staff view: my messages are right (purple), user messages are left (gray)
                        // If user view: my messages are right (teal), staff messages are left (gray)
                        const alignRight = isMe
                        const isRead = !!msg.read_at

                        return (
                            <div key={msg.id} className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`
                                        max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                                        ${alignRight
                                            ? (isStaffView ? 'bg-purple-600 text-white rounded-br-none' : 'bg-teal-600 text-white rounded-br-none')
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }
                                    `}
                                >
                                    <p>{msg.message}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${alignRight ? 'text-white/70' : 'text-gray-400'}`}>
                                        <span className="text-[10px]">
                                            {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {/* Show read indicators only for my messages */}
                                        {isMe && (
                                            isRead ? (
                                                <CheckCheck className="w-3.5 h-3.5" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
                    disabled={sendMessageMutation.isPending}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className={`
                        p-2 rounded-full text-white transition-colors
                        ${isStaffView ? 'bg-purple-600 hover:bg-purple-700' : 'bg-teal-600 hover:bg-teal-700'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    )
}
