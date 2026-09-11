import { NextRequest, NextResponse } from 'next/server'
import { generateCounterToken } from '@/lib/counter-session'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Short URL redirect route handler: /eq/[id]
 * When scanned from mobile device sticker (or in-app scanner), generates a verified on-site token
 * and redirects directly to the counter borrowing flow with that equipment preselected.
 * Supports both equipment UUID and equipment_number.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: rawId } = await context.params
    const origin = request.nextUrl.origin

    let targetId = rawId
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawId)

    if (!isUuid) {
        const adminClient = createAdminClient()
        const { data } = await adminClient
            .from('equipment')
            .select('id')
            .or(`equipment_number.eq.${rawId},equipment_number.ilike.${rawId}`)
            .maybeSingle()
        if (data?.id) {
            targetId = data.id
        }
    }

    const token = generateCounterToken(targetId)
    const destination = new URL(`/equipment/${encodeURIComponent(targetId)}?mode=counter&token=${encodeURIComponent(token)}`, origin)

    return NextResponse.redirect(destination, 307)
}

