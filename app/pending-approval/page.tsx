import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PendingApprovalClient from './PendingApprovalClient'

export const metadata = {
    title: 'รอการอนุมัติ | ระบบยืม-คืนพัสดุและครุภัณฑ์',
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
    
    if (!profile) redirect('/register/complete-profile')
    if (profile.status === 'approved') redirect('/')
    
    return <PendingApprovalClient initialProfile={profile} />
}
