import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Explicitly read env vars at module level for Node.js runtime
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Define route patterns
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', '/auth/auth-code-error']
const PENDING_ROUTES = ['/pending-approval']
const PROFILE_SETUP_ROUTES = ['/register/complete-profile', '/profile/setup']
const ADMIN_ROUTES = ['/admin']
const STAFF_ROUTES = ['/staff']
const EQUIPMENT_ROUTES = ['/equipment']

// Default export function - required by Next.js 16 proxy
export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    let response = NextResponse.next({ request })

    // If env vars are not available, pass through without auth
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars not configured, skipping auth')
        return response
    }

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Check route types
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
        // For root path, use exact match
        if (route === '/') return pathname === '/'
        // For other paths, use startsWith
        return pathname.startsWith(route)
    })
    const isPendingRoute = PENDING_ROUTES.some(route => pathname.startsWith(route))
    const isProfileSetupRoute = PROFILE_SETUP_ROUTES.some(route => pathname.startsWith(route))
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
    const isStaffRoute = STAFF_ROUTES.some(route => pathname.startsWith(route))
    const isEquipmentRoute = EQUIPMENT_ROUTES.some(route => pathname.startsWith(route))

    // Equipment routes are public - no auth needed
    if (isEquipmentRoute) {
        return response
    }

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute && !isPendingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user exists, check profile and status
    if (user) {
        // Redirect logged-in users away from login page
        if (pathname === '/login') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Get user profile for status/role checking (minimal select)
        const { data: profile } = await supabase
            .from('profiles')
            .select('status, role')
            .eq('id', user.id)
            .single()

        if (profile) {
            const isPending = profile.status === 'pending'
            const isRejected = profile.status === 'rejected'
            const isApproved = profile.status === 'approved'
            const isAdminUser = profile.role === 'admin'
            const isStaffUser = profile.role === 'staff'

            // If pending/rejected, redirect to pending-approval
            if ((isPending || isRejected) && !isPendingRoute && !isProfileSetupRoute) {
                const url = request.nextUrl.clone()
                url.pathname = '/pending-approval'
                return NextResponse.redirect(url)
            }

            // If approved and trying to access pending-approval, redirect to home
            if (isApproved && isPendingRoute) {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }

            // Admin route access control
            if (isAdminRoute && !isAdminUser) {
                const url = request.nextUrl.clone()
                url.pathname = isStaffUser ? '/staff' : '/'
                return NextResponse.redirect(url)
            }

            // Staff route access control - staff and admin can access
            if (isStaffRoute && !isStaffUser && !isAdminUser) {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }

            // Redirect based on role when accessing home page
            if (isApproved && pathname === '/') {
                if (isAdminUser) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/admin'
                    return NextResponse.redirect(url)
                } else if (isStaffUser) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/staff'
                    return NextResponse.redirect(url)
                }
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

