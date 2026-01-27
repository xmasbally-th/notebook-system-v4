'use client'

import React, { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ChatWindow from './ChatWindow'
import { usePathname } from 'next/navigation'
import { createTicketAction } from './actions'

export default function SupportButton() {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const pathname = usePathname()

    // Hide on admin/staff pages and login pages
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/staff') || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
        return null
    }

    // Get Current User
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
        staleTime: Infinity
    })

    // Get Active Ticket
    const { data: activeTicket, isLoading: ticketLoading } = useQuery({
        queryKey: ['active-ticket', user?.id],
        queryFn: async () => {
            if (!user) return null
            const { data, error } = await (supabase as any)
                .from('support_tickets')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error fetching ticket:', error)
            }
            return data
        },
        enabled: !!user && isOpen // Only fetch when open
    })

    // Create Ticket Mutation
    const createTicketMutation = useMutation({
        mutationFn: async () => {
            const ticket = await createTicketAction()
            return ticket
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['active-ticket', user?.id], data)
        }
    })

    const handleOpen = () => {
        setIsOpen(true)
        // If we opened and there is NO active ticket (and not loading), create one
        // We handle this effect inside the render or a useEffect, but click handler is safer
        // Actually, we can just let specific UI handle "Start Chat" if no ticket?
        // But for simplicity, let's auto-create on first message? 
        // ChatWindow requires ticketId. So we must have a ticket.

        // Strategy: 
        // 1. Fetch active ticket on open. 
        // 2. If valid ticket -> Show Chat.
        // 3. If no ticket -> Show "Start Support" button in place of ChatWindow? 
        //    OR just create one immediately? 
        //    Let's Create immediately for seamless experience.
    }

    // Effect to create ticket if none exists when opened
    React.useEffect(() => {
        if (isOpen && user && !ticketLoading && !activeTicket && !createTicketMutation.isPending && !createTicketMutation.isSuccess) {
            createTicketMutation.mutate()
        }
    }, [isOpen, user, ticketLoading, activeTicket])

    if (!user) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="w-[350px] h-[500px] mb-2 fade-in-up">
                    {/* Show Loading or Chat */}
                    {(ticketLoading || createTicketMutation.isPending || !activeTicket) ? (
                        <div className="h-full bg-white rounded-lg shadow-xl border border-gray-200 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                    ) : (
                        <ChatWindow
                            ticketId={activeTicket.id}
                            currentUserId={user.id}
                            onClose={() => setIsOpen(false)}
                        />
                    )}
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}
        </div>
    )
}
