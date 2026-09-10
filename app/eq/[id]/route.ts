import { NextRequest, NextResponse } from 'next/server'

/**
 * Short URL redirect route handler: /eq/[id]
 * Shortens the QR code payload significantly (cutting 20+ characters),
 * which reduces QR matrix density and enables faster mobile camera decoding.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    const origin = request.nextUrl.origin
    const destination = new URL(`/equipment/${encodeURIComponent(id)}?mode=counter`, origin)

    return NextResponse.redirect(destination, 307)
}
