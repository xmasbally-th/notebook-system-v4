import { NextResponse } from 'next/server'
import { runDailyAutomation } from '@/lib/cron/dailyAutomation'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handleCronRequest(request: Request) {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, if CRON_SECRET is configured, require Bearer token
    if (cronSecret) {
        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    try {
        const result = await runDailyAutomation()
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('[API Cron Daily-Tasks] Error:', error)
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    return handleCronRequest(request)
}

export async function POST(request: Request) {
    return handleCronRequest(request)
}
