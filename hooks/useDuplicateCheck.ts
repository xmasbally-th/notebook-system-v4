'use client'

import { useState, useCallback, useRef } from 'react'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'

interface UseDuplicateCheckOptions {
    table: string
    column: string
    excludeId?: string
    debounceMs?: number
}

interface DuplicateCheckResult {
    isDuplicate: boolean
    isChecking: boolean
    error: string | null
    checkDuplicate: (value: string) => Promise<boolean>
    reset: () => void
}

/**
 * Hook to check for duplicate values in a database table
 * Uses on-blur validation pattern
 */
export function useDuplicateCheck({
    table,
    column,
    excludeId,
    debounceMs = 300
}: UseDuplicateCheckOptions): DuplicateCheckResult {
    const [isDuplicate, setIsDuplicate] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const checkDuplicate = useCallback(async (value: string): Promise<boolean> => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Reset if empty value
        if (!value.trim()) {
            setIsDuplicate(false)
            setError(null)
            return false
        }

        return new Promise((resolve) => {
            timeoutRef.current = setTimeout(async () => {
                setIsChecking(true)
                setError(null)

                abortControllerRef.current = new AbortController()

                try {
                    const { url, key } = getSupabaseCredentials()
                    if (!url || !key) {
                        throw new Error('Missing Supabase credentials')
                    }

                    // Build query with URL encoding for safety
                    let query = `${url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=id`

                    // Exclude current record when editing
                    if (excludeId) {
                        query += `&id=neq.${excludeId}`
                    }

                    const response = await fetch(query, {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`
                        },
                        signal: abortControllerRef.current.signal
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`)
                    }

                    const data = await response.json()
                    const duplicate = Array.isArray(data) && data.length > 0

                    setIsDuplicate(duplicate)
                    resolve(duplicate)
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error('[useDuplicateCheck] Error:', err)
                        setError('ไม่สามารถตรวจสอบได้')
                    }
                    resolve(false)
                } finally {
                    setIsChecking(false)
                }
            }, debounceMs)
        })
    }, [table, column, excludeId, debounceMs])

    const reset = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setIsDuplicate(false)
        setIsChecking(false)
        setError(null)
    }, [])

    return {
        isDuplicate,
        isChecking,
        error,
        checkDuplicate,
        reset
    }
}
