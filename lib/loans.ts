// Get Supabase credentials for direct API calls
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

export const checkConflict = async (
    equipmentId: string,
    startDate: Date,
    endDate: Date
): Promise<boolean> => {
    const { url, key } = getSupabaseCredentials()

    if (!url || !key) {
        console.error('[checkConflict] Missing Supabase credentials')
        return true // Fail safe: assume conflict
    }

    try {
        // Call the RPC function using direct fetch
        const response = await fetch(`${url}/rest/v1/rpc/check_reservation_conflict`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target_equipment_id: equipmentId,
                new_start_date: startDate.toISOString(),
                new_end_date: endDate.toISOString(),
            })
        })

        if (!response.ok) {
            console.error('[checkConflict] HTTP Error:', response.status)
            return true // Fail safe: assume conflict
        }

        const data = await response.json()
        return data as boolean
    } catch (error) {
        console.error('[checkConflict] Error:', error)
        return true // Fail safe: assume conflict
    }
}
