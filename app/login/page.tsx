import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/auth/LoginForm'
import { Suspense } from 'react'

export const metadata = {
    title: 'เข้าสู่ระบบ | ระบบยืม-คืนพัสดุและครุภัณฑ์',
    description: 'เข้าสู่ระบบเพื่อใช้งานระบบยืม-คืนพัสดุและครุภัณฑ์',
}

// Optional: you could make this page static by revalidating, but since it calls cookies() via createClient
// we will fetch the config and let Next.js cache the fetch call natively.

async function fetchLogoUrl(): Promise<string | null> {
    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('system_config')
            .select('document_logo_url')
            .eq('id', 1)
            .single()
            
        return data?.document_logo_url || null
    } catch (err) {
        console.error('Error fetching logo URL on server:', err)
        return null
    }
}

export default async function LoginPage() {
    const logoUrl = await fetchLogoUrl()
    
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginForm logoUrl={logoUrl} />
        </Suspense>
    )
}
