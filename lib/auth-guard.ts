/**
 * Auth Guard — Centralized Authentication & Authorization Helper
 *
 * Eliminates duplicate role-check boilerplate across all Server Actions.
 *
 * Usage:
 * ```ts
 * const { user, profile, error } = await requireAdmin()
 * if (error) return { error }
 * // user and profile are now guaranteed non-null
 * ```
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthProfile {
    id: string
    role: 'admin' | 'staff' | 'user'
    status: 'pending' | 'approved' | 'rejected'
    first_name: string | null
    last_name: string | null
    email: string | null
}

export interface AuthGuardResult {
    user: User | null
    profile: AuthProfile | null
    error: string | null
}

// ─── Core helper ─────────────────────────────────────────────────────────────

async function getAuthenticatedUser(): Promise<AuthGuardResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { user: null, profile: null, error: 'Unauthorized: กรุณาเข้าสู่ระบบ' }
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, status, first_name, last_name, email')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return { user: null, profile: null, error: 'Unauthorized: ไม่พบข้อมูลผู้ใช้' }
        }

        return { user, profile: profile as AuthProfile, error: null }
    } catch {
        return { user: null, profile: null, error: 'Unauthorized: เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' }
    }
}

// ─── Public Guard Functions ───────────────────────────────────────────────────

/**
 * Requires the caller to be an authenticated, approved admin.
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
    const result = await getAuthenticatedUser()
    if (result.error) return result

    if (result.profile!.role !== 'admin') {
        return { user: null, profile: null, error: 'Forbidden: ต้องการสิทธิ์ผู้ดูแลระบบ (Admin)' }
    }
    if (result.profile!.status !== 'approved') {
        return { user: null, profile: null, error: 'Forbidden: บัญชีของคุณยังไม่ได้รับการอนุมัติ' }
    }

    return result
}

/**
 * Requires the caller to be an authenticated, approved staff or admin.
 */
export async function requireStaff(): Promise<AuthGuardResult> {
    const result = await getAuthenticatedUser()
    if (result.error) return result

    if (!['staff', 'admin'].includes(result.profile!.role)) {
        return { user: null, profile: null, error: 'Forbidden: ต้องการสิทธิ์เจ้าหน้าที่ (Staff) หรือสูงกว่า' }
    }
    if (result.profile!.status !== 'approved') {
        return { user: null, profile: null, error: 'Forbidden: บัญชีของคุณยังไม่ได้รับการอนุมัติ' }
    }

    return result
}

/**
 * Requires the caller to be an authenticated, approved user of any role.
 */
export async function requireApprovedUser(): Promise<AuthGuardResult> {
    const result = await getAuthenticatedUser()
    if (result.error) return result

    if (result.profile!.status !== 'approved') {
        return { user: null, profile: null, error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ กรุณารอการตรวจสอบจากเจ้าหน้าที่' }
    }

    return result
}

/**
 * Requires authentication only (any role, any status).
 */
export async function requireAuth(): Promise<AuthGuardResult> {
    return getAuthenticatedUser()
}
