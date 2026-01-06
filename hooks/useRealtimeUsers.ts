'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

type NewUser = {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    status: string
    created_at: string
}

const POLL_INTERVAL = 10000 // 10 seconds

// Get Supabase credentials
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

export function useRealtimeUsers(isAdmin: boolean) {
    const [pendingCount, setPendingCount] = useState(0)
    const [newUser, setNewUser] = useState<NewUser | null>(null)
    const previousCountRef = useRef<number>(0)
    const latestUserRef = useRef<string | null>(null)

    // Fetch pending count and check for new users
    const fetchPendingUsers = useCallback(async () => {
        if (!isAdmin) return

        try {
            const { url, key } = getSupabaseCredentials()

            if (!url || !key) {
                console.error('[useRealtimeUsers] Missing credentials')
                return
            }

            // Use direct fetch API
            const endpoint = `${url}/rest/v1/profiles?status=eq.pending&select=*&order=created_at.desc&limit=1`

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'count=exact'
                }
            })

            if (!response.ok) {
                console.error('[useRealtimeUsers] HTTP Error:', response.status)
                return
            }

            const data = await response.json()
            const countHeader = response.headers.get('content-range')
            const newCount = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : data.length

            // Check if there's a new user (count increased and different user)
            if (data && data.length > 0) {
                const latestPendingUser = data[0] as NewUser

                // If count increased and it's a new user ID, show notification
                if (newCount > previousCountRef.current &&
                    latestUserRef.current !== latestPendingUser.id) {
                    setNewUser(latestPendingUser)
                    latestUserRef.current = latestPendingUser.id
                }
            }

            previousCountRef.current = newCount
            setPendingCount(newCount)
        } catch (err: any) {
            console.error('[useRealtimeUsers] Exception:', err?.message || err)
        }
    }, [isAdmin])

    // Initial fetch and setup polling
    useEffect(() => {
        if (!isAdmin) return

        // Initial fetch
        fetchPendingUsers()

        // Setup polling interval
        const intervalId = setInterval(fetchPendingUsers, POLL_INTERVAL)

        return () => {
            clearInterval(intervalId)
        }
    }, [isAdmin, fetchPendingUsers])

    const clearNewUser = useCallback(() => setNewUser(null), [])

    return { pendingCount, newUser, clearNewUser, refetch: fetchPendingUsers }
}
