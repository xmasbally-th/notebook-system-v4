'use server'

/**
 * Auto-Archive Actions
 * Calls the run_data_archive() PostgreSQL function via Supabase RPC.
 * Only callable by admin users (enforced by createClient session check).
 */

import { createClient } from '@/lib/supabase/server'

export interface ArchiveResult {
    deleted_tickets: number
    deleted_notifications: number
    archived_at: string
}

/**
 * Run the auto-archive process based on retention settings in system_config.
 * Deletes:
 *   - Closed support tickets (+ messages via CASCADE) older than archive_support_after_days
 *   - Notifications older than archive_notifications_after_days
 */
export async function runAutoArchiveAction(): Promise<ArchiveResult> {
    const supabase = await createClient()

    // Verify the caller is an authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('เฉพาะ Admin เท่านั้นที่สามารถรัน Archive ได้')
    }

    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('run_data_archive')
    if (error) throw new Error(error.message)

    return data as ArchiveResult
}
