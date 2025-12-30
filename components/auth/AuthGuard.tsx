'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [session, setSession] = useState<any>(null)

    // Manage session state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Fetch profile if session exists
    const { data: profile, isLoading } = useProfile(session?.user?.id)

    useEffect(() => {
        if (isLoading) return

        // 1. If not logged in and not on login page, redirect to login
        const publicPaths = ['/login', '/', '/auth/callback', '/auth/auth-code-error', '/pending-approval']
        const isPublicPath = publicPaths.includes(pathname) ||
            pathname.startsWith('/equipment') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/auth/')

        if (!session && !isPublicPath) {
            router.push('/login')
            return
        }

        // 2. If logged in but no profile (should happen rarely due to trigger), wait or error
        if (session && !profile) return

        // 3. Check Status
        if (profile) {
            // 3.1 Profile Incomplete -> Force Setup
            const isProfileComplete = profile.first_name && profile.last_name && profile.phone_number
            if (!isProfileComplete && pathname !== '/profile/setup') {
                router.push('/profile/setup')
                return
            }

            // 3.2 If on setup page but complete, go home
            if (isProfileComplete && pathname === '/profile/setup') {
                router.push('/')
            }

            // 3.3 Admin Redirect
            if (profile.role === 'admin' && profile.status === 'approved' && pathname === '/') {
                router.push('/admin')
            }

            // 3.4 Pending Status Check (Block actions if pending?)
            // This might be handled inside specific pages, but global guard ensures basic auth.
        }
    }, [session, profile, isLoading, pathname, router])

    if (isLoading) { // Show loading spinner
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return <>{children}</>
}
