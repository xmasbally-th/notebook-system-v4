'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

type NewUser = {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    status: string
    created_at: string
}

const POLL_INTERVAL = 10000 // 10 seconds

export function useRealtimeUsers(isAdmin: boolean) {
    const [pendingCount, setPendingCount] = useState(0)
    const [newUser, setNewUser] = useState<NewUser | null>(null)
    const previousCountRef = useRef<number>(0)
    const latestUserRef = useRef<string | null>(null)

    // Fetch pending count and check for new users
    const fetchPendingUsers = useCallback(async () => {
        if (!isAdmin) return

        const { data, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)

        const newCount = count || 0

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
