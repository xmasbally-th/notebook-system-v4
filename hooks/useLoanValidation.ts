'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useMemo } from 'react'

type LoanLimitsByType = {
    student: { max_days: number; max_items: number }
    lecturer: { max_days: number; max_items: number }
    staff: { max_days: number; max_items: number }
}

type UserType = 'student' | 'lecturer' | 'staff'

interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

interface LoanValidationResult {
    validateDates: (startDate: string, endDate: string, returnTime?: string) => ValidationResult
    isLoading: boolean
    config: {
        maxDays: number
        maxItems: number
        openingTime: string
        closingTime: string
        closedDates: string[]
        isLoanSystemActive: boolean
    } | null
    currentLoanCount: number
}

export function useLoanValidation(userType: UserType = 'student'): LoanValidationResult {
    // Fetch system config
    const { data: systemConfig, isLoading: configLoading } = useQuery({
        queryKey: ['system_config'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('system_config')
                .select('*')
                .single()

            if (error) throw error
            return data
        }
    })

    // Fetch current user's active loans count
    const { data: activeLoanData, isLoading: loansLoading } = useQuery({
        queryKey: ['my-active-loans-count'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { count: 0 }

            const { count } = await (supabase as any)
                .from('loanRequests')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['pending', 'approved'])

            return { count: count || 0 }
        }
    })

    // Get limits based on user type
    const config = useMemo(() => {
        if (!systemConfig) return null

        const loanLimits = systemConfig.loan_limits_by_type as LoanLimitsByType | null
        const limits = loanLimits?.[userType] || { max_days: 7, max_items: 1 }

        return {
            maxDays: limits.max_days,
            maxItems: limits.max_items,
            openingTime: systemConfig.opening_time || '08:30',
            closingTime: systemConfig.closing_time || '16:30',
            closedDates: (systemConfig.closed_dates as string[]) || [],
            isLoanSystemActive: systemConfig.is_loan_system_active ?? true
        }
    }, [systemConfig, userType])

    const currentLoanCount = activeLoanData?.count || 0

    // Validation function
    const validateDates = (startDate: string, endDate: string, returnTime?: string): ValidationResult => {
        const errors: string[] = []
        const warnings: string[] = []

        if (!config) {
            return { isValid: false, errors: ['กำลังโหลดการตั้งค่าระบบ...'], warnings: [] }
        }

        // Check if loan system is active
        if (!config.isLoanSystemActive) {
            errors.push('ระบบยืม-คืนปิดให้บริการชั่วคราว')
            return { isValid: false, errors, warnings }
        }

        // Check if dates are provided
        if (!startDate || !endDate) {
            errors.push('กรุณาระบุวันที่ยืมและวันที่คืน')
            return { isValid: false, errors, warnings }
        }

        const start = new Date(startDate)
        const end = new Date(endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check if start date is in the past
        if (start < today) {
            errors.push('วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว')
        }

        // Check if end date is before start date
        if (end < start) {
            errors.push('วันที่คืนต้องไม่ก่อนวันที่ยืม')
        }

        // Calculate loan duration
        const durationMs = end.getTime() - start.getTime()
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1 // +1 because same day = 1 day

        // Check max days
        if (durationDays > config.maxDays) {
            errors.push(`ระยะเวลายืมเกินกำหนดสูงสุด (สูงสุด ${config.maxDays} วัน คุณเลือก ${durationDays} วัน)`)
        }

        // Check max items
        if (currentLoanCount >= config.maxItems) {
            errors.push(`คุณมีรายการยืมถึงขีดจำกัดแล้ว (สูงสุด ${config.maxItems} รายการ)`)
        }

        // Check if start date is on closed date
        const startDateStr = start.toISOString().split('T')[0]
        if (config.closedDates.includes(startDateStr)) {
            errors.push('วันที่ยืมตรงกับวันหยุดทำการ')
        }

        // Check if end date is on closed date
        const endDateStr = end.toISOString().split('T')[0]
        if (config.closedDates.includes(endDateStr)) {
            errors.push('วันที่คืนตรงกับวันหยุดทำการ')
        }

        // Check return time if provided
        if (returnTime) {
            const [hours, minutes] = returnTime.split(':').map(Number)
            const [openHours, openMinutes] = config.openingTime.split(':').map(Number)
            const [closeHours, closeMinutes] = config.closingTime.split(':').map(Number)

            const returnMinutes = hours * 60 + minutes
            const openingMinutes = openHours * 60 + openMinutes
            const closingMinutes = closeHours * 60 + closeMinutes

            if (returnMinutes < openingMinutes || returnMinutes > closingMinutes) {
                errors.push(`เวลาคืนต้องอยู่ในช่วงเวลาทำการ (${config.openingTime} - ${config.closingTime})`)
            }
        }

        // Warnings
        if (durationDays >= config.maxDays - 1) {
            warnings.push('ระยะเวลายืมใกล้ถึงขีดจำกัดสูงสุด')
        }

        if (currentLoanCount >= config.maxItems - 1 && currentLoanCount < config.maxItems) {
            warnings.push('คุณมีรายการยืมใกล้ถึงขีดจำกัด')
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        }
    }

    return {
        validateDates,
        isLoading: configLoading || loansLoading,
        config,
        currentLoanCount
    }
}
