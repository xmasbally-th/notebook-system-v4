'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'

export async function createTicketAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // 1. Create Ticket
    const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
            user_id: user.id,
            status: 'open',
            subject: 'General Support'
        })
        .select()
        .single()

    if (error) throw error

    // 2. Fetch User Profile for nice notification
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single()

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : user.email

    // 3. Send Discord Notification
    await sendDiscordNotification(
        `🎫 **New Support Ticket**\n**User:** ${userName}\n**Ticket ID:** \`${ticket.id}\``
    )

    return ticket
}

export async function sendMessageAction(ticketId: string, message: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // 1. Quick check if user is staff/admin (needed for is_staff_reply flag)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single()

    const isStaff = profile?.role === 'admin' || profile?.role === 'staff'

    // 2. Insert Message FIRST for fastest delivery
    const { error } = await supabase
        .from('support_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            message: message.trim(),
            is_staff_reply: isStaff
        })

    if (error) throw error

    // 3. Handle Discord notification in background (non-blocking)
    // Only for non-staff users
    if (!isStaff) {
        // Fire and forget - don't await
        (async () => {
            try {
                // Check if admin has already responded (do this after insert to not block)
                const { data: existingMessages } = await supabase
                    .from('support_messages')
                    .select('id, is_staff_reply')
                    .eq('ticket_id', ticketId)
                    .limit(50)

                const hasStaffReply = existingMessages?.some(msg => msg.is_staff_reply)
                const isFirstMessage = (existingMessages?.length || 0) <= 1  // Only our new message

                if (isFirstMessage || !hasStaffReply) {
                    const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User'
                    await sendDiscordNotification(
                        isFirstMessage
                            ? `🆕 **New Support Chat Started**\n**User:** ${userName}\n**Message:** ${message.trim()}`
                            : `💬 **User Waiting for Response**\n**User:** ${userName}\n**Ticket:** \`${ticketId.slice(0, 8)}...\`\n**Message:** ${message.trim()}`
                    )
                }
            } catch (err) {
                console.error('Discord notification failed:', err)
            }
        })()
    }

    return { success: true }
}

/**
 * Mark messages as read when user opens the chat window
 * Staff: marks user messages as read
 * User: marks staff messages as read
 */
export async function markMessagesAsReadAction(ticketId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if current user is staff/admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isStaff = profile?.role === 'admin' || profile?.role === 'staff'

    // Mark messages from the OTHER side as read
    // If I'm staff, mark user messages (is_staff_reply = false) as read
    // If I'm user, mark staff messages (is_staff_reply = true) as read
    const { error } = await supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('ticket_id', ticketId)
        .eq('is_staff_reply', !isStaff)  // Mark opposite side's messages
        .is('read_at', null)  // Only update unread messages

    if (error) throw error

    return { success: true }
}
