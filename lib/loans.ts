import { supabase } from '@/lib/supabase/client'

export const checkConflict = async (
    equipmentId: string,
    startDate: Date,
    endDate: Date
): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_reservation_conflict', {
        target_equipment_id: equipmentId,
        new_start_date: startDate.toISOString(),
        new_end_date: endDate.toISOString(),
    })

    if (error) {
        console.error('Error checking conflicts:', error)
        // Fail safe: assume conflict if error? Or allow? 
        // Secure approach: Fail safe.
        return true
    }

    return data as boolean
}
