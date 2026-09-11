import { NextRequest, NextResponse } from 'next/server'
import { generateCounterToken } from '@/lib/counter-session'

/**
 * Short URL redirect route handler: /eq/[id]
 * When scanned from mobile device sticker, generates a verified on-site token
 * and redirects directly to the counter borrowing flow with that equipment preselected.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    const origin = request.nextUrl.origin

    const token = generateCounterToken(id)
    const destination = new URL(`/equipment/${encodeURIComponent(id)}?mode=counter&token=${encodeURIComponent(token)}`, origin)

    return NextResponse.redirect(destination, 307)
}

