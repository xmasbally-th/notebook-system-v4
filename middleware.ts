import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protected routes that require authentication
const PROTECTED_PREFIXES = [
    '/my-loans',
    '/my-reservations',
    '/equipment',
    '/admin',
    '/staff',
    '/pending-approval',
    '/profile',
    '/notifications',
    '/user-guide'
]

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Should not happen in proper env, but safeguard
    if (!supabaseUrl || !supabaseAnonKey) {
        return supabaseResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const url = request.nextUrl.clone()
    const path = url.pathname

    // Allow static assets, images, API routes, auth callback
    if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.') || path.startsWith('/auth')) {
        return supabaseResponse
    }

    const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
    const isLoginRoute = path === '/login'

    // If it's a public route (like /), don't check auth at the edge to save latency
    // and avoid Edge clock skew bugs where getSession() clears valid cookies.
    if (!isProtectedRoute && !isLoginRoute) {
        return supabaseResponse
    }

    // For protected routes and /login, use getUser() instead of getSession()
    // getUser() makes a network request to Supabase API, bypassing local clock skew issues
    // that cause getSession() to falsely invalidate and delete fresh tokens.
    const { data: { user } } = await supabase.auth.getUser()

    // Not authenticated, trying to access protected route -> Redirect to login
    if (!user && isProtectedRoute) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authenticated, trying to access login -> Redirect to home
    if (user && isLoginRoute) {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
