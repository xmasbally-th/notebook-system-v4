// Special Loans API Library
import { getSupabaseCredentials } from './supabase-helpers'
import { logStaffActivity, ActionType } from './staffActivityLog'

export interface SpecialLoan {
    id: string
    borrower_id: string
    borrower_name: string
    borrower_phone: string | null
    borrower_title: string | null
    borrower_department: string | null
    equipment_type_id: string | null
    equipment_type_name: string
    quantity: number
    equipment_ids: string[]
    equipment_numbers: string[]
    loan_date: string
    return_date: string
    purpose: string
    notes: string | null
    status: 'active' | 'returned' | 'cancelled'
    created_by: string
    returned_at: string | null
    returned_by: string | null
    created_at: string
    updated_at: string
    // Joined data
    borrower?: {
        first_name: string | null
        last_name: string | null
        email: string | null
        title: string | null
        department_id: string | null
    }
    equipment_type?: {
        name: string
        icon: string
    }
}

export interface CreateSpecialLoanInput {
    borrowerId: string
    borrowerName: string
    borrowerPhone?: string
    equipmentTypeId?: string
    equipmentTypeName: string
    quantity: number
    equipmentIds: string[]
    equipmentNumbers: string[]
    loanDate: string
    returnDate: string
    purpose: string
    notes?: string
}

// Get user's access token for authenticated requests
async function getAccessToken(): Promise<string | null> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null

    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(url, key)
    const { data: { session } } = await client.auth.getSession()
    return session?.access_token || null
}

// Get current admin user
async function getCurrentAdmin(): Promise<{ id: string } | null> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null

    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(url, key)
    const { data: { session } } = await client.auth.getSession()

    if (!session?.user?.id) return null

    // Verify admin role
    const accessToken = session.access_token
    const response = await fetch(
        `${url}/rest/v1/profiles?id=eq.${session.user.id}&select=role`,
        {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`
            }
        }
    )

    if (!response.ok) return null
    const profiles = await response.json()
    if (!profiles[0] || profiles[0].role !== 'admin') return null

    return { id: session.user.id }
}

/**
 * Create a new special loan request
 */
export async function createSpecialLoan(
    input: CreateSpecialLoanInput
): Promise<{ success: boolean; error?: string; id?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: 'ต้องเข้าสู่ระบบด้วย Admin' }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/special_loan_requests`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                borrower_id: input.borrowerId,
                borrower_name: input.borrowerName,
                borrower_phone: input.borrowerPhone || null,
                equipment_type_id: input.equipmentTypeId || null,
                equipment_type_name: input.equipmentTypeName,
                quantity: input.quantity,
                equipment_ids: input.equipmentIds,
                equipment_numbers: input.equipmentNumbers,
                loan_date: input.loanDate,
                return_date: input.returnDate,
                purpose: input.purpose,
                notes: input.notes || null,
                created_by: admin.id
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[createSpecialLoan] Error:', errorText)
            return { success: false, error: 'ไม่สามารถสร้างยืมพิเศษได้' }
        }

        const data = await response.json()
        const id = data[0]?.id

        // Log activity
        await logStaffActivity({
            staffId: admin.id,
            staffRole: 'admin',
            actionType: 'create_special_loan' as ActionType,
            targetType: 'special_loan' as any,
            targetId: id,
            targetUserId: input.borrowerId,
            details: {
                equipment_type: input.equipmentTypeName,
                quantity: input.quantity,
                loan_date: input.loanDate,
                return_date: input.returnDate
            }
        })

        return { success: true, id }
    } catch (error) {
        console.error('[createSpecialLoan] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Get all special loan requests
 */
export async function getSpecialLoans(
    status?: 'active' | 'returned' | 'cancelled'
): Promise<SpecialLoan[]> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return []

    const accessToken = await getAccessToken()
    if (!accessToken) return []

    // 1. Fetch special loans (without joining profiles to avoid FK issue)
    let endpoint = `${url}/rest/v1/special_loan_requests?select=*&order=created_at.desc`
    if (status) {
        endpoint += `&status=eq.${status}`
    }

    try {
        const response = await fetch(endpoint, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`
            }
        })

        if (!response.ok) return []
        const loans: SpecialLoan[] = await response.json()

        if (loans.length === 0) return []

        // 2. Fetch profiles manually
        const borrowerIds = Array.from(new Set(loans.map(l => l.borrower_id)))

        let profileMap = new Map()
        let departmentMap = new Map()

        if (borrowerIds.length > 0) {
            const profileResponse = await fetch(
                `${url}/rest/v1/profiles?id=in.(${borrowerIds.join(',')})&select=id,first_name,last_name,email,title,department_id`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )

            if (profileResponse.ok) {
                const profiles = await profileResponse.json()
                profiles.forEach((p: any) => profileMap.set(p.id, p))

                // Fetch department names
                const deptIds = Array.from(new Set(profiles.map((p: any) => p.department_id).filter(Boolean)))
                if (deptIds.length > 0) {
                    const deptResponse = await fetch(
                        `${url}/rest/v1/departments?id=in.(${deptIds.join(',')})&select=id,name`,
                        {
                            headers: {
                                'apikey': key,
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    )
                    if (deptResponse.ok) {
                        const depts = await deptResponse.json()
                        depts.forEach((d: any) => departmentMap.set(d.id, d.name))
                    }
                }
            }
        }

        // 3. Merge data
        return loans.map(loan => {
            const profile = profileMap.get(loan.borrower_id)
            const deptName = profile?.department_id ? departmentMap.get(profile.department_id) : null

            return {
                ...loan,
                borrower_title: profile?.title || null,
                borrower_department: deptName || null,
                borrower: profile || {
                    first_name: null,
                    last_name: null,
                    email: null,
                    title: null,
                    department_id: null
                }
            }
        })
    } catch {
        return []
    }
}

/**
 * Get active special loans (for dashboard notice)
 */
export async function getActiveSpecialLoans(): Promise<SpecialLoan[]> {
    return getSpecialLoans('active')
}

/**
 * Complete a special loan (mark as returned)
 */
export async function completeSpecialLoan(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: 'ต้องเข้าสู่ระบบด้วย Admin' }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/special_loan_requests?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'returned',
                returned_at: new Date().toISOString(),
                returned_by: admin.id,
                updated_at: new Date().toISOString()
            })
        })

        if (!response.ok) {
            return { success: false, error: 'ไม่สามารถบันทึกการคืนได้' }
        }

        // Log activity
        await logStaffActivity({
            staffId: admin.id,
            staffRole: 'admin',
            actionType: 'complete_special_loan' as ActionType,
            targetType: 'special_loan' as any,
            targetId: id
        })

        return { success: true }
    } catch (error) {
        console.error('[completeSpecialLoan] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Cancel a special loan
 */
export async function cancelSpecialLoan(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: 'ต้องเข้าสู่ระบบด้วย Admin' }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/special_loan_requests?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
        })

        if (!response.ok) {
            return { success: false, error: 'ไม่สามารถยกเลิกได้' }
        }

        return { success: true }
    } catch (error) {
        console.error('[cancelSpecialLoan] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Check if equipment is blocked by special loan
 */
export async function checkSpecialLoanConflict(
    equipmentId: string,
    startDate: Date,
    endDate: Date
): Promise<boolean> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return false

    const accessToken = await getAccessToken()

    try {
        // Query active special loans that overlap with the date range
        const response = await fetch(
            `${url}/rest/v1/special_loan_requests?status=eq.active&loan_date=lte.${endDate.toISOString().split('T')[0]}&return_date=gte.${startDate.toISOString().split('T')[0]}&select=equipment_ids`,
            {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${accessToken || key}`
                }
            }
        )

        if (!response.ok) return false

        const loans: { equipment_ids: string[] }[] = await response.json()

        // Check if equipment is in any of the blocked lists
        for (const loan of loans) {
            if (loan.equipment_ids?.includes(equipmentId)) {
                return true // Conflict found
            }
        }

        return false
    } catch {
        return false
    }
}
