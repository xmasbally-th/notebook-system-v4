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

    // 1. Check if user is staff/admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single()

    const isStaff = profile?.role === 'admin' || profile?.role === 'staff'

    // 2. Insert Message
    const { error } = await supabase
        .from('support_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            message: message.trim(),
            is_staff_reply: isStaff
        })

    if (error) throw error

    // 3. Send Discord Notification (Only if User sends)
    if (!isStaff) {
        const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User'
        await sendDiscordNotification(
            `💬 **New Message in Ticket** \`${ticketId.slice(0, 8)}...\`\n**From:** ${userName}\n**Message:** ${message.trim()}`
        )
    }

    return { success: true }
}
