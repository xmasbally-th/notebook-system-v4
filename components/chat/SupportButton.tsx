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

    // Get Current User - MUST be called before any conditional returns
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
        staleTime: Infinity
    })

    // Get Active Ticket - MUST be called before any conditional returns
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

    // Create Ticket Mutation - MUST be called before any conditional returns
    const createTicketMutation = useMutation({
        mutationFn: async () => {
            const ticket = await createTicketAction()
            return ticket
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['active-ticket', user?.id], data)
        }
    })

    // Effect to create ticket if none exists when opened - MUST be before conditional returns
    React.useEffect(() => {
        if (isOpen && user && !ticketLoading && !activeTicket && !createTicketMutation.isPending && !createTicketMutation.isSuccess) {
            createTicketMutation.mutate()
        }
    }, [isOpen, user, ticketLoading, activeTicket, createTicketMutation])

    // Hide on admin/staff pages and login pages - AFTER all hooks
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/staff') || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
        return null
    }

    if (!user) return null

    const handleOpen = () => {
        setIsOpen(true)
    }

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
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
