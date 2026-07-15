'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseBrowserClient, getSupabaseCredentials } from '@/lib/supabase-helpers'

type Profile = {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    role: 'user' | 'staff' | 'admin'
    first_name: string | null
    last_name: string | null
    phone_number: string | null
    title: string | null
    user_type: string | null
    department_id: string | null
    user_id: string | null
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextType {
    authState: AuthState
    userId: string | null
    profile: Profile | null
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    authState: 'loading',
    userId: null,
    profile: null,
    refreshProfile: async () => {},
})

const CACHE_DURATION = 2 * 60 * 1000

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()
    const [authState, setAuthState] = useState<AuthState>('loading')
    const [userId, setUserId] = useState<string | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    
    const router = useRouter()
    const pathname = usePathname()

    const profileCacheRef = useRef<{ data: Profile | null; timestamp: number } | null>(null)

    const fetchProfile = useCallback(async (uid: string, forceRefresh = false): Promise<Profile | null> => {
        const now = Date.now()
        if (!forceRefresh &&
            profileCacheRef.current &&
            profileCacheRef.current.data?.id === uid &&
            (now - profileCacheRef.current.timestamp) < CACHE_DURATION) {
            return profileCacheRef.current.data
        }

        try {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return null

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const response = await fetch(
                `${url}/rest/v1/profiles?id=eq.${uid}&select=id,status,role,first_name,last_name,phone_number,title,user_type,department_id,user_id`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}` // Note: Ideally should use session.access_token but this is what existed
                    },
                    signal: controller.signal,
                    cache: 'no-store'
                }
            )

            clearTimeout(timeoutId)

            if (!response.ok) return null

            const data = await response.json()
            const profileData = data?.[0] as Profile | null

            if (profileData) {
                profileCacheRef.current = {
                    data: profileData,
                    timestamp: now
                }
            }

            return profileData
        } catch (err: any) {
            return null
        }
    }, [])

    const clearProfileCache = useCallback(() => {
        profileCacheRef.current = null
        queryClient.invalidateQueries({ queryKey: ['profile'] })
    }, [queryClient])

    const refreshProfile = useCallback(async () => {
        if (userId) {
            const newProfile = await fetchProfile(userId, true)
            setProfile(newProfile)
        }
    }, [userId, fetchProfile])

    useEffect(() => {
        let isMounted = true
        const client = getSupabaseBrowserClient()

        if (client) {
            const { data: { subscription } } = client.auth.onAuthStateChange(
                async (event: any, session: any) => {
                    if (!isMounted) return

                    if (event === 'SIGNED_OUT') {
                        setUserId(null)
                        setProfile(null)
                        setAuthState('unauthenticated')
                        clearProfileCache()
                    } else if (session?.user) {
                        setUserId(session.user.id)
                        setAuthState('authenticated')

                        if (event === 'SIGNED_IN') {
                            clearProfileCache()
                        }

                        const userProfile = await fetchProfile(session.user.id)
                        if (isMounted) {
                            setProfile(userProfile)
                        }
                    } else if (event === 'INITIAL_SESSION' && !session) {
                        setUserId(null)
                        setAuthState('unauthenticated')
                        setProfile(null)
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

    // Role-based redirect for home page (Client-side)
    useEffect(() => {
        if (authState === 'authenticated' && profile?.status === 'approved') {
            const isAdmin = profile.role === 'admin'
            const isStaff = profile.role === 'staff'
            
            // Redirect admin and staff to their respective dashboards when visiting home
            if (pathname === '/') {
                if (isAdmin) {
                    router.replace('/admin')
                } else if (isStaff) {
                    router.replace('/staff')
                }
            }
        }
    }, [authState, profile, pathname, router])

    // Notice we do NOT block rendering. We just return children.
    return (
        <AuthContext.Provider value={{ authState, userId, profile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}

export function useInvalidateProfile() {
    const queryClient = useQueryClient()
    const { refreshProfile } = useAuth()

    return useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        refreshProfile()
    }, [queryClient, refreshProfile])
}
