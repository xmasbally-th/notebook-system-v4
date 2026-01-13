'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { useMemo, useCallback } from 'react'

type UserType = 'student' | 'lecturer' | 'staff'

interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

interface ReservationConfig {
    maxDays: number
    maxItems: number
    openingTime: string
    closingTime: string
    breakStartTime: string | null
    breakEndTime: string | null
    closedDays: number[]        // 0=Sunday, 1=Monday, etc.
    closedDates: string[]       // ['2026-01-01', '2026-04-13']
    maxAdvanceBookingDays: number
    isReservationActive: boolean
}

// Get credentials for direct fetch API
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

// Get client for auth operations
function getSupabaseClient() {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

// Day names in Thai
const DAY_NAMES_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

export function useReservationValidation(userType: UserType = 'student') {
    // Fetch system config
    const { data: systemConfig, isLoading: configLoading } = useQuery({
        queryKey: ['system_config'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return null

            // Try to get user's access token for authenticated requests
            const client = getSupabaseClient()
            let authToken = key
            if (client) {
                const { data: { session } } = await client.auth.getSession()
                if (session?.access_token) {
                    authToken = session.access_token
                }
            }

            const response = await fetch(`${url}/rest/v1/system_config?select=*&limit=1`, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${authToken}`
                }
            })
            if (!response.ok) return null
            const data = await response.json()
            return data?.[0] || null
        }
    })

    // Fetch current user's active reservations count
    const { data: activeReservationData, isLoading: reservationsLoading } = useQuery({
        queryKey: ['my-active-reservations-count'],
        staleTime: 30000,
        queryFn: async () => {
            const client = getSupabaseClient()
            if (!client) return { count: 0 }

            const { data: { user } } = await client.auth.getUser()
            if (!user) return { count: 0 }

            const { url, key } = getSupabaseCredentials()
            const response = await fetch(
                `${url}/rest/v1/reservations?user_id=eq.${user.id}&status=in.(pending,approved,ready)&select=id`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                }
            )
            if (!response.ok) return { count: 0 }
            const data = await response.json()
            return { count: data?.length || 0 }
        }
    })

    // Parse config
    const config = useMemo((): ReservationConfig | null => {
        if (!systemConfig) return null

        const loanLimits = systemConfig.loan_limits_by_type as any
        const limits = loanLimits?.[userType] || { max_days: 7, max_items: 1 }

        return {
            maxDays: limits.max_days,
            maxItems: limits.max_items,
            openingTime: systemConfig.opening_time || '08:30',
            closingTime: systemConfig.closing_time || '16:30',
            breakStartTime: systemConfig.break_start_time || null,
            breakEndTime: systemConfig.break_end_time || null,
            closedDays: (systemConfig.closed_days as number[]) || [0, 6], // Default: Sat, Sun
            closedDates: (systemConfig.closed_dates as string[]) || [],
            maxAdvanceBookingDays: systemConfig.max_advance_booking_days || 30,
            isReservationActive: systemConfig.is_reservation_active ?? true
        }
    }, [systemConfig, userType])

    const currentReservationCount = activeReservationData?.count || 0

    // Format time for display
    const formatTimeDisplay = (time: string): string => {
        const [h, m] = time.split(':')
        return `${h}:${m} น.`
    }

    // Check if a date falls on a closed day
    const isClosedDay = useCallback((date: Date, config: ReservationConfig): boolean => {
        return config.closedDays.includes(date.getDay())
    }, [])

    // Check if a date is a closed date (special holiday)
    const isClosedDate = useCallback((date: Date, config: ReservationConfig): boolean => {
        const dateStr = date.toISOString().split('T')[0]
        return config.closedDates.includes(dateStr)
    }, [])

    // Get closed days as Thai names
    const getClosedDaysText = useCallback((config: ReservationConfig): string => {
        return config.closedDays.map(d => DAY_NAMES_TH[d]).join(', ')
    }, [])

    // Main validation function
    const validateReservation = useCallback((
        startDate: string,
        endDate: string
    ): ValidationResult => {
        const errors: string[] = []
        const warnings: string[] = []

        if (!config) {
            return { isValid: false, errors: ['กำลังโหลดการตั้งค่าระบบ...'], warnings: [] }
        }

        // Check if reservation system is active
        if (!config.isReservationActive) {
            errors.push('ระบบจองล่วงหน้าปิดให้บริการชั่วคราว')
            return { isValid: false, errors, warnings }
        }

        // Check if dates are provided
        if (!startDate || !endDate) {
            errors.push('กรุณาระบุวันที่รับและวันที่คืน')
            return { isValid: false, errors, warnings }
        }

        const start = new Date(startDate)
        const end = new Date(endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Check if start date is at least tomorrow (advance booking)
        if (start < tomorrow) {
            errors.push('การจองล่วงหน้าต้องเริ่มตั้งแต่วันพรุ่งนี้เป็นต้นไป')
        }

        // Check max advance booking days
        const maxAdvanceDate = new Date(today)
        maxAdvanceDate.setDate(maxAdvanceDate.getDate() + config.maxAdvanceBookingDays)
        if (start > maxAdvanceDate) {
            errors.push(`จองล่วงหน้าได้ไม่เกิน ${config.maxAdvanceBookingDays} วัน`)
        }

        // Check if end date is before start date
        if (end < start) {
            errors.push('วันที่คืนต้องไม่ก่อนวันที่รับ')
        }

        // Calculate duration
        const durationMs = end.getTime() - start.getTime()
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1

        // Check max days
        if (durationDays > config.maxDays) {
            errors.push(`ระยะเวลายืมเกินกำหนด (สูงสุด ${config.maxDays} วัน คุณเลือก ${durationDays} วัน)`)
        }

        // Check if start date is on closed day (e.g., Saturday, Sunday)
        if (isClosedDay(start, config)) {
            const dayName = DAY_NAMES_TH[start.getDay()]
            errors.push(`วันที่รับตรงกับวันหยุด (วัน${dayName}) - ปิดทำการ: ${getClosedDaysText(config)}`)
        }

        // Check if end date is on closed day
        if (isClosedDay(end, config)) {
            const dayName = DAY_NAMES_TH[end.getDay()]
            errors.push(`วันที่คืนตรงกับวันหยุด (วัน${dayName})`)
        }

        // Check if start date is on special closed date
        if (isClosedDate(start, config)) {
            errors.push('วันที่รับตรงกับวันหยุดพิเศษ')
        }

        // Check if end date is on special closed date
        if (isClosedDate(end, config)) {
            errors.push('วันที่คืนตรงกับวันหยุดพิเศษ')
        }

        // Warnings
        if (durationDays >= config.maxDays - 1 && durationDays <= config.maxDays) {
            warnings.push('ระยะเวลายืมใกล้ถึงขีดจำกัดสูงสุด')
        }

        if (currentReservationCount >= config.maxItems - 1 && currentReservationCount < config.maxItems) {
            warnings.push(`คุณมีรายการจองใกล้ถึงขีดจำกัด (${currentReservationCount}/${config.maxItems})`)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        }
    }, [config, currentReservationCount, isClosedDay, isClosedDate, getClosedDaysText])

    return {
        validateReservation,
        isLoading: configLoading || reservationsLoading,
        config,
        currentReservationCount
    }
}
