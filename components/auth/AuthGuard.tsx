'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useQueryClient } from '@tanstack/react-query'

type Profile = {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    role: 'user' | 'staff' | 'admin'
    first_name: string | null
    last_name: string | null
    phone_number: string | null
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

// Cache profile for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

// Routes that don't require profile check
const PUBLIC_PATHS = [
    '/login',
    '/auth/callback',
    '/auth/auth-code-error'
]

const PENDING_PATHS = [
    '/pending-approval'
]

const SETUP_PATHS = [
    '/profile/setup',
    '/register/complete-profile'
]

// Get credentials and client
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

function getSupabaseClient() {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()

    const [authState, setAuthState] = useState<AuthState>('loading')
    const [userId, setUserId] = useState<string | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)

    // Cache refs
    const profileCacheRef = useRef<{ data: Profile | null; timestamp: number } | null>(null)
    const lastRedirectRef = useRef<string | null>(null)

    // Check if current path matches any pattern
    const matchesPath = useCallback((patterns: string[]) => {
        return patterns.some(pattern => pathname.startsWith(pattern))
    }, [pathname])

    // Fetch profile with caching using direct fetch
    const fetchProfile = useCallback(async (uid: string): Promise<Profile | null> => {
        // Check cache first
        const now = Date.now()
        if (profileCacheRef.current &&
            profileCacheRef.current.data?.id === uid &&
            (now - profileCacheRef.current.timestamp) < CACHE_DURATION) {
            return profileCacheRef.current.data
        }

        try {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return null

            const response = await fetch(
                `${url}/rest/v1/profiles?id=eq.${uid}&select=id,status,role,first_name,last_name,phone_number`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                }
            )

            if (!response.ok) {
                console.warn('AuthGuard: Failed to fetch profile')
                return null
            }

            const data = await response.json()
            const profileData = data?.[0] as Profile | null

            // Update cache
            if (profileData) {
                profileCacheRef.current = {
                    data: profileData,
                    timestamp: now
                }
            }

            return profileData
        } catch (err) {
            console.error('AuthGuard: Error fetching profile', err)
            return null
        }
    }, [])

    // Clear cache when needed
    const clearProfileCache = useCallback(() => {
        profileCacheRef.current = null
        queryClient.invalidateQueries({ queryKey: ['profile'] })
    }, [queryClient])

    // Handle redirects
    const handleRedirect = useCallback((targetPath: string) => {
        // Prevent redirect loops
        if (lastRedirectRef.current === targetPath || pathname === targetPath) {
            return
        }

        lastRedirectRef.current = targetPath
        router.push(targetPath)

        // Reset redirect ref after a short delay
        setTimeout(() => {
            lastRedirectRef.current = null
        }, 1000)
    }, [pathname, router])

    // Initial auth check
    useEffect(() => {
        let isMounted = true
        const client = getSupabaseClient()

        const checkAuth = async () => {
            if (!client) {
                setAuthState('unauthenticated')
                return
            }

            try {
                const { data: { user } } = await client.auth.getUser()

                if (!isMounted) return

                if (user) {
                    setUserId(user.id)
                    setAuthState('authenticated')

                    // Fetch profile
                    const userProfile = await fetchProfile(user.id)
                    if (isMounted) {
                        setProfile(userProfile)
                    }
                } else {
                    setUserId(null)
                    setAuthState('unauthenticated')
                    setProfile(null)
                }
            } catch (error) {
                console.error('AuthGuard: Auth check error', error)
                if (isMounted) {
                    setAuthState('unauthenticated')
                }
            }
        }

        checkAuth()

        // Listen for auth changes
        if (client) {
            const { data: { subscription } } = client.auth.onAuthStateChange(
                async (event, session) => {
                    if (!isMounted) return

                    if (event === 'SIGNED_OUT') {
                        setUserId(null)
                        setProfile(null)
                        setAuthState('unauthenticated')
                        clearProfileCache()
                    } else if (session?.user) {
                        setUserId(session.user.id)
                        setAuthState('authenticated')

                        // Clear cache on sign in to get fresh data
                        if (event === 'SIGNED_IN') {
                            clearProfileCache()
                        }

                        const userProfile = await fetchProfile(session.user.id)
                        if (isMounted) {
                            setProfile(userProfile)
                        }
                    }
                }
            )

            return () => {
                isMounted = false
                subscription.unsubscribe()
            }
        }

        return () => {
            isMounted = false
        }
    }, [fetchProfile, clearProfileCache])

    // Handle redirects based on auth and profile state
    useEffect(() => {
        // Skip during loading
        if (authState === 'loading') return

        const isPublicPath = matchesPath(PUBLIC_PATHS)
        const isPendingPath = matchesPath(PENDING_PATHS)
        const isSetupPath = matchesPath(SETUP_PATHS)
        const isEquipmentPath = pathname.startsWith('/equipment')

        // Skip checks for public paths and equipment pages
        if (isPublicPath || isEquipmentPath) return

        // If not authenticated and not on public path, redirect to login
        if (authState === 'unauthenticated' && !isPublicPath) {
            handleRedirect('/login')
            return
        }

        // If authenticated, check profile
        if (authState === 'authenticated' && profile) {
            const isProfileComplete = profile.first_name && profile.last_name && profile.phone_number
            const isPending = profile.status === 'pending'
            const isRejected = profile.status === 'rejected'
            const isApproved = profile.status === 'approved'
            const isAdmin = profile.role === 'admin'
            const isStaff = profile.role === 'staff'
            const isAdminPath = pathname.startsWith('/admin')
            const isStaffPath = pathname.startsWith('/staff')

            // If profile incomplete, redirect to setup
            if (!isProfileComplete && !isSetupPath && !isPendingPath) {
                handleRedirect('/register/complete-profile')
                return
            }

            // If pending or rejected (with complete profile), redirect to pending-approval
            if ((isPending || isRejected) && isProfileComplete && !isPendingPath && !isSetupPath) {
                handleRedirect('/pending-approval')
                return
            }

            // If approved and on pending page, redirect to home
            if (isApproved && isPendingPath) {
                handleRedirect('/')
                return
            }

            // Block admin routes for non-admins
            if (isAdminPath && !isAdmin) {
                handleRedirect(isStaff ? '/staff' : '/')
                return
            }

            // Block staff routes for regular users
            if (isStaffPath && !isStaff && !isAdmin) {
                handleRedirect('/')
                return
            }

            // Role-based home page redirect
            if (isApproved && pathname === '/') {
                if (isAdmin) {
                    handleRedirect('/admin')
                    return
                } else if (isStaff) {
                    handleRedirect('/staff')
                    return
                }
            }
        }
    }, [authState, profile, pathname, matchesPath, handleRedirect])

    // Show loading spinner during initial load
    if (authState === 'loading') {
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

// Export a hook to invalidate profile cache externally
export function useInvalidateProfile() {
    const queryClient = useQueryClient()

    return useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['profile'] })
    }, [queryClient])
}
