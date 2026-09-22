'use server'

import { sendDiscordNotification } from '@/lib/notifications'
import { notifyAndLog } from '@/lib/serverNotify'
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

    const { title, firstName, lastName, phone, userType, departmentId, userId: profileUserId } = parsed.data

    // 4. Fetch current profile status
    const { data: currentProfile } = await (supabase as any)
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single()

    // 5. Update Profile
    const updates: any = {
        title,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        user_type: userType,
        department_id: departmentId,
        user_id: profileUserId,
        updated_at: new Date().toISOString(),
    }

    // Only reset to pending if they were rejected
    if (currentProfile?.status === 'rejected') {
        updates.status = 'pending'
        updates.reject_reason = null
    }

    const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (updateError) {
        console.error('Profile update error:', updateError)
        return { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + updateError.message }
    }

    // 6. Notify Admin (only if they are actually becoming pending/newly submitted)
    if (!currentProfile || currentProfile.status === 'pending' || currentProfile.status === 'rejected') {
        await notifyNewRegistration(user.id)
    }

    return { success: true }
}

export async function notifyNewRegistration(userId: string) {
    const supabase = await createClient()

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('first_name, last_name, email, user_id, phone_number, user_type, departments(name)')
        .eq('id', userId)
        .single()

    if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        const dept = profile.departments?.name || 'ไม่ระบุ'
        const userIdCode = profile.user_id || 'ไม่ระบุ'

        const userTypeThai: Record<string, string> = {
            student: 'นักศึกษา',
            lecturer: 'อาจารย์',
            staff: 'บุคลากร'
        }
        const userTypeLabel = userTypeThai[profile.user_type] || profile.user_type || 'ผู้ใช้งาน'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const discordEmbed = {
            title: '🔔 มีผู้ลงทะเบียนสมาชิกใหม่ (New Registration)',
            description: `มีผู้ใช้ใหม่ลงทะเบียนและรอการอนุมัติสิทธิ์เข้าใช้งานระบบ`,
            color: 0xEAB308, // Yellow/Amber
            fields: [
                { name: '👤 ชื่อ-นามสกุล', value: fullName || '-', inline: true },
                { name: '🎓 ประเภท / รหัส', value: `${userTypeLabel} (${userIdCode})`, inline: true },
                { name: '🏢 สังกัด / สาขาวิชา', value: dept, inline: false },
                { name: '📞 เบอร์โทรศัพท์', value: profile.phone_number || '-', inline: true },
                { name: '📧 อีเมล', value: profile.email || '-', inline: true },
                { name: '🔗 จัดการผู้ใช้งาน', value: `[คลิกเพื่อตรวจสอบและอนุมัติ](${appUrl}/admin/users)`, inline: false }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์' }
        }

        const fallbackMessage = `
**🔔 มีผู้ลงทะเบียนสมาชิกใหม่ (New Registration)**
👤 **ชื่อ-นามสกุล:** ${fullName}
🎓 **ประเภท:** ${userTypeLabel} (#${userIdCode})
🏢 **สังกัด:** ${dept}
📞 **เบอร์โทร:** ${profile.phone_number || '-'}
📧 **อีเมล:** ${profile.email}
🔗 [ตรวจสอบและอนุมัติ](${appUrl}/admin/users)
        `.trim()

        await notifyAndLog({
            eventKey: 'new_registration',
            discordMessage: fallbackMessage,
            discordEmbed,
            discordType: 'auth',
            welpruVariables: {
                name: fullName,
                user_id: userIdCode,
                department: dept,
            },
        })
    }
}
