import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSettingsClient from '@/components/admin/settings/AdminSettingsClient'

export const metadata = {
    title: 'ตั้งค่าระบบ | Admin',
}

export default async function AdminSettingsPage() {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect('/')
    }

    // Fetch initial data for the settings form to avoid client-side waterfall
    const [configResult, equipmentTypesResult] = await Promise.all([
        supabase.from('system_config').select('*').single(),
        supabase.from('equipment_types').select('*').order('name')
    ])

    const initialConfig = configResult.data
    const initialEquipmentTypes = equipmentTypesResult.data || []

    return (
        <AdminSettingsClient 
            initialConfig={initialConfig} 
            initialEquipmentTypes={initialEquipmentTypes} 
        />
    )
}
