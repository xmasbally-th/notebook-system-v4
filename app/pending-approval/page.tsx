import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PendingApprovalClient from './PendingApprovalClient'

export const metadata = {
    title: 'รอการอนุมัติ | ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์',
}

export default async function PendingApprovalPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) redirect('/login')
    
    // Fetch profile on server — no client waterfall
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('id', user.id)
        .single()
    
    // If profile doesn't exist or is missing essential details (department, phone, or student/staff id),
    // redirect to complete profile so user can submit their details and notify admin.
    const isProfileIncomplete = !profile || !profile.department_id || !profile.phone_number || !profile.user_id
    if (isProfileIncomplete) redirect('/register/complete-profile')
    if (profile.status === 'approved') redirect('/')
    
    return <PendingApprovalClient initialProfile={profile} />
}
