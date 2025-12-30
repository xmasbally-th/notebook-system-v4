'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [userId, setUserId] = useState<string | undefined>(undefined)
    const [isInitialized, setIsInitialized] = useState(false)

    // Get user ID from auth state
    useEffect(() => {
        // Initial check
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id)
            setIsInitialized(true)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id)
            setIsInitialized(true)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Fetch profile if userId exists
    const { data: profile, isLoading: profileLoading } = useProfile(userId)

    // Handle redirects based on profile state
    useEffect(() => {
        // Wait for initialization and profile loading
        if (!isInitialized || profileLoading) return

        // Don't redirect on public/auth pages
        const skipProfileCheckPaths = [
            '/login',
            '/auth/callback',
            '/auth/auth-code-error',
            '/pending-approval',
            '/profile/setup',
            '/register/complete-profile'
        ]

        if (skipProfileCheckPaths.includes(pathname) ||
            pathname.startsWith('/auth/') ||
            pathname.startsWith('/equipment')) {
            return
        }

        // If user is logged in and has profile
        if (userId && profile) {
            // Check if profile is complete
            const isProfileComplete = profile.first_name && profile.last_name && profile.phone_number

            // Force setup if profile incomplete
            if (!isProfileComplete && pathname !== '/profile/setup') {
                router.push('/profile/setup')
                return
            }

            // Check for pending status (but not on pending-approval page)
            if (profile.status === 'pending' || profile.status === 'rejected') {
                router.push('/pending-approval')
                return
            }

            // Redirect admin to admin dashboard from homepage
            if (profile.role === 'admin' && profile.status === 'approved' && pathname === '/') {
                router.push('/admin')
            }
        }
    }, [isInitialized, userId, profile, profileLoading, pathname, router])

    // Show loading only while initializing auth
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
