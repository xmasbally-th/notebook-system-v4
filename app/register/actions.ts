'use server'

import { sendDiscordNotification } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { parseRegistrationFormData } from '@/lib/schemas'

// Verify Cloudflare Turnstile Token
async function verifyTurnstileToken(token: string) {
    const secretKey = process.env.TURNSTILE_SECRET_KEY
    if (!secretKey) {
        console.warn('TURNSTILE_SECRET_KEY is not set, skipping verification.')
        return true // Fail open if key is missing (dev mode safety)
    }

    const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1'
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)
    formData.append('remoteip', ip)

    try {
        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        })

        const outcome = await result.json()
        return outcome.success
    } catch (e) {
        console.error('Turnstile verification failed:', e)
        return false
    }
}

export type RegistrationState = {
    success?: boolean
    error?: string
}

export async function completeRegistrationAction(
    prevState: RegistrationState,
    formData: FormData
): Promise<RegistrationState> {
    const turnstileToken = formData.get('cf-turnstile-response') as string

    // 1. Verify Turnstile
    const isHuman = await verifyTurnstileToken(turnstileToken)
    if (!isHuman) {
        return { error: 'กรุณายืนยันตัวตนผ่านระบบความปลอดภัย (Security Check Failed)' }
    }

    const supabase = await createClient()

    // 2. Get Current User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่' }
    }

    // 3. Parse & Validate Data with Zod
    const parsed = parseRegistrationFormData(formData)
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง'
        return { error: firstError }
    }

    const { title, firstName, lastName, phone, userType, departmentId } = parsed.data

    // 4. Update Profile
    const updates = {
        id: user.id,
        email: user.email,
        title,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        user_type: userType,
        department_id: departmentId,
        updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await (supabase as any)
        .from('profiles')
        .upsert(updates)
        .eq('id', user.id)

    if (updateError) {
        console.error('Profile update error:', updateError)
        return { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + updateError.message }
    }

    // 6. Notify Admin
    await notifyNewRegistration(user.id)

    return { success: true }
}

export async function notifyNewRegistration(userId: string) {
    const supabase = await createClient()

    // Fetch user details for the message
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('first_name, last_name, email, departments(name)')
        .eq('id', userId)
        .single()

    if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        const dept = profile.departments?.name || 'N/A'

        const message = `
**🔔 New User Registration**
**Name:** ${fullName}
**Email:** ${profile.email}
**Department:** ${dept}
**Status:** Pending Approval
        `.trim()

        await sendDiscordNotification(message, 'auth')
    }
}
