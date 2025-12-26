'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitLoanRequest(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Validate User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('status, first_name, last_name, email, departments(name)')
        .eq('id', user.id)
        .single()

    if (profile?.status !== 'approved') {
        return { error: 'Your account is pending approval.' }
    }

    // 2. Parse Data
    const equipmentId = formData.get('equipmentId') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const reason = formData.get('reason') as string

    if (!equipmentId || !startDate || !endDate || !reason) {
        return { error: 'All fields are required' }
    }

    // 3. Create Loan Request
    const { error } = await (supabase as any)
        .from('loanRequests')
        .insert({
            user_id: user.id,
            equipment_id: equipmentId,
            start_date: new Date(startDate).toISOString(),
            end_date: new Date(endDate).toISOString(),
            reason: reason,
            status: 'pending'
        })

    if (error) {
        return { error: error.message }
    }

    // 4. Notify Discord
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    const message = `
**📋 New Loan Request**
**User:** ${fullName}
**Item ID:** ${equipmentId}
**Dates:** ${startDate} to ${endDate}
**Reason:** ${reason}
    `.trim()

    await sendDiscordNotification(message)

    revalidatePath('/')
    return { success: true }
}
