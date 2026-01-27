'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback, useEffect } from 'react'
import { useSharedNotificationData } from './useSharedNotificationData'
import { supabase } from '@/lib/supabase/client'

/**
 * User Notifications Hook
 * Combines: 
 * 1. Stored event notifications (from notifications table)
 * 2. Computed reminders (from shared data - own loans only)
 */

interface StoredNotification {
    id: string
    user_id: string
    type: string
    title: string
    message: string | null
    is_read: boolean
    related_entity_id: string | null
    created_at: string
}

interface ComputedNotification {
    id: string
    type: 'due_soon' | 'overdue_warning'
    title: string
    message: string
    created_at: string
    is_computed: true
}

type UserNotification = (StoredNotification & { is_computed?: false }) | ComputedNotification

interface UserNotificationsResult {
    notifications: UserNotification[]
    unreadCount: number
    isLoading: boolean
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    refetch: () => void
}



export function useUserNotifications(userId?: string, accessToken?: string): UserNotificationsResult {
    const queryClient = useQueryClient()
    const sharedData = useSharedNotificationData()

    // Fetch stored notifications from database
    const { data: storedData, isLoading, refetch } = useQuery({
        queryKey: ['user-notifications', userId],
        queryFn: async () => {
            if (!userId) return { notifications: [] }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                console.error('[UserNotifications] Fetch error:', error)
                return { notifications: [] }
            }

            return { notifications: data || [] }
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes (invalidated by realtime)
    })

    // Mark notification as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)

            if (error) {
                console.error('[markAsRead] Failed:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
        }
    })

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!userId) throw new Error('No user ID')

            const { error } = await (supabase as any)
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false)

            if (error) {
                console.error('[markAllAsRead] Failed:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
        }
    })

    // Compute due-soon reminders from user's own active loans
    const computedReminders = useMemo(() => {
        if (!userId) return []

        const reminders: ComputedNotification[] = []
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        // Find user's loans that are due soon (within 24 hours)
        const myActiveLoans = sharedData.activeLoans.filter(loan => loan.user_id === userId)

        myActiveLoans.forEach(loan => {
            // Calculate precise end datetime
            const endDate = new Date(loan.end_date)

            // If return_time exists, set it. Otherwise, set to End of Day (23:59:59)
            if (loan.return_time) {
                const [hours, minutes] = loan.return_time.split(':').map(Number)
                endDate.setHours(hours, minutes, 0, 0)
            } else {
                endDate.setHours(23, 59, 59, 999)
            }

            // Due within 24 hours but not overdue
            if (endDate <= tomorrow && endDate >= now) {
                reminders.push({
                    id: `due-soon-${loan.id}`,
                    type: 'due_soon',
                    title: 'ใกล้ครบกำหนดคืน',
                    message: `อุปกรณ์ ${loan.equipment?.name || 'ที่ยืมไป'} ครบกำหนดคืนเร็วๆ นี้`,
                    created_at: now.toISOString(),
                    is_computed: true,
                })
            }

            // Overdue
            if (endDate < now) {
                reminders.push({
                    id: `overdue-${loan.id}`,
                    type: 'overdue_warning',
                    title: 'เกินกำหนดคืน!',
                    message: `อุปกรณ์ ${loan.equipment?.name || 'ที่ยืมไป'} เกินกำหนดคืนแล้ว กรุณาคืนโดยเร็ว`,
                    created_at: now.toISOString(),
                    is_computed: true,
                })
            }
        })

        return reminders
    }, [userId, sharedData.activeLoans])

    // Realtime Subscription
    useEffect(() => {
        if (!userId) return

        const channel = supabase
            .channel(`user-notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    // console.log('Realtime notification received:', payload)
                    // Invalidate query to refetch fresh data
                    queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, queryClient])

    // Combine stored + computed notifications
    const allNotifications = useMemo(() => {
        const stored = (storedData?.notifications || []) as UserNotification[]
        return [...computedReminders, ...stored]
    }, [storedData?.notifications, computedReminders])

    // Count unread (stored only, computed are always "unread")
    const unreadCount = useMemo(() => {
        const storedUnread = (storedData?.notifications || []).filter(
            (n: StoredNotification) => !n.is_read
        ).length
        return storedUnread + computedReminders.length
    }, [storedData?.notifications, computedReminders])

    const markAsRead = useCallback((id: string) => {
        // Only mark stored notifications (not computed ones)
        if (!id.startsWith('due-soon-') && !id.startsWith('overdue-')) {
            markAsReadMutation.mutate(id)
        }
    }, [markAsReadMutation])

    const markAllAsRead = useCallback(() => {
        markAllAsReadMutation.mutate()
    }, [markAllAsReadMutation])

    return {
        notifications: allNotifications,
        unreadCount,
        isLoading: isLoading || sharedData.isLoading,
        markAsRead,
        markAllAsRead,
        refetch,
    }
}
