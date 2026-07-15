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

export default async function proxy(request: NextRequest) {
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

    // Using getSession is faster but less secure. Since we do a full secure check in the layouts, 
    // getSession is sufficient for this fast middleware redirect.
    const { data: { session } } = await supabase.auth.getSession()

    const url = request.nextUrl.clone()
    const path = url.pathname

    // Allow static assets, images, API routes, auth callback
    if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.') || path.startsWith('/auth')) {
        return supabaseResponse
    }

    const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
    const isLoginRoute = path === '/login'

    // Not authenticated, trying to access protected route -> Redirect to login
    if (!session && isProtectedRoute) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authenticated, trying to access login -> Redirect to home
    if (session && isLoginRoute) {
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
