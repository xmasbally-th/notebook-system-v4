
// Actually for Route Handlers in App Router with Cookie Auth, we need specific setup.
// But since we are using client-side auth mostly, let's see. 
// Standard Next.js + Supabase SSR pattern:

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    let response: NextResponse | null = null

    if (code) {
        const cookieStore = await cookies()
        let pendingCookies: { name: string, value: string, options: any }[] = []
        
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            // Save cookies to apply to the response later
                            pendingCookies = cookiesToSet
                            // Also set on cookieStore just in case
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set({ name, value, ...options })
                            })
                        } catch (error) {
                            // ignore
                        }
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            response = NextResponse.redirect(`${origin}${next}`)
            // Manually inject cookies into the redirect response
            pendingCookies.forEach(({ name, value, options }) => {
                response!.cookies.set(name, value, options)
            })
            return response
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
