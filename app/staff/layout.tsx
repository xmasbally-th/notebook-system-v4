import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StaffLayout from '@/components/staff/StaffLayout'

export const metadata = {
    title: 'Staff Dashboard | ระบบยืม-คืนพัสดุและครุภัณฑ์',
}

export default async function StaffRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Server-Side Auth Check & Profile Fetch (No Client Waterfalls)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', user.id)
        .single()

    // 2. Strict Staff Route Protection
    if (!profile || !['staff', 'admin'].includes(profile.role)) {
        redirect('/')
    }

    // 3. Render the persistent layout shell
    return (
        <StaffLayout profile={profile}>
            {children}
        </StaffLayout>
    )
}
