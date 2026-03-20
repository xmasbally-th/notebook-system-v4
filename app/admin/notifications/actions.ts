'use server'

import { sendWeLPRUNotification, sendWeLPRUGroupBroadcast } from '@/lib/notifications'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/supabase/types'

async function getSupabaseServerClient() {
    const cookieStore = await cookies()
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Handle cookie error
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // Handle cookie error
                    }
                },
            },
        }
    )
}

export async function sendManualNotification(formData: FormData) {
    try {
        const title = formData.get('title') as string
        const body = formData.get('body') as string
        const type = formData.get('type') as 'broadcast' | 'direct'
        
        if (!title || !body) {
            return { success: false, error: 'กรุณากรอกหัวข้อและข้อความ' }
        }

        const supabase = await getSupabaseServerClient()
        const { data: config } = await supabase.from('system_config').select('welpru_notifications_enabled').eq('id', 1).single()

        if (!(config as any)?.welpru_notifications_enabled) {
            return { success: false, error: 'ระบบแจ้งเตือน WeLPRU ถูกปิดใช้งานอยู่' }
        }

        if (type === 'broadcast') {
            const targetGroup = formData.get('target_group') as 'all' | 'student' | 'personnel'
            if (!targetGroup) {
                return { success: false, error: 'กรุณาเลือกกลุ่มเป้าหมาย' }
            }

            try {
                await sendWeLPRUGroupBroadcast({
                    title,
                    body,
                    targetGroup
                })
            } catch (error) {
                return { success: false, error: 'เกิดข้อผิดพลาดในการส่งข้อความแบบกลุ่ม' }
            }

            return { success: true }
        } else if (type === 'direct') {
            const userId = formData.get('user_id') as string
            if (!userId) {
                return { success: false, error: 'กรุณาระบุรหัสนักศึกษา/รหัสบุคลากรเป้าหมาย' }
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', userId)
                .single()

            if (!profile) {
                 return { success: false, error: 'ไม่พบผู้ใช้งานด้วยรหัสนี้ในระบบ' }
            }

            try {
                await sendWeLPRUNotification({
                    title,
                    body,
                    userIds: [userId]
                })
            } catch (error) {
                return { success: false, error: 'เกิดข้อผิดพลาดในการส่งข้อความระบุบุคคล' }
            }

            return { success: true }
        }

        return { success: false, error: 'ประเภทการส่งไม่ถูกต้อง' }

    } catch (error: any) {
        console.error('Error in sendManualNotification:', error)
        return { success: false, error: error.message || 'เกิดข้อผิดพลาดภายในระบบ' }
    }
}
