'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, requireStaff } from '@/lib/auth-guard'
import { notifyAndLog } from '@/lib/serverNotify'
import { revalidatePath } from 'next/cache'

export interface EquipmentInput {
    name: string
    equipment_number: string
    brand?: string | null
    model?: string | null
    equipment_type_id?: string | null
    status: 'ready' | 'borrowed' | 'reserved' | 'maintenance' | 'retired'
    location?: Record<string, any> | null
    specifications?: Record<string, any> | null
    images?: string[]
    is_active?: boolean
}

/**
 * Fetch paginated, filtered equipment list along with aggregate counts
 */
export async function getPaginatedEquipment(params: {
    page: number
    pageSize: number
    search?: string
    status?: string
    type?: string
}) {
    const auth = await requireStaff()
    if (auth.error) return { error: auth.error }

    const supabase = await createClient()
    const { page, pageSize, search, status, type } = params

    // 1. Build main query
    let query = supabase
        .from('equipment')
        .select('*, equipment_types(name, icon)', { count: 'exact' })

    if (search) {
        query = query.or(`name.ilike.%${search}%,equipment_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
    }
    if (status && status !== 'all') {
        query = query.eq('status', status)
    }
    if (type && type !== 'all') {
        query = query.eq('equipment_type_id', type)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: items, count, error } = await query
    if (error) return { error: error.message }

    // 2. Fetch all statuses for stats computation
    const { data: allStatuses, error: statsError } = await supabase
        .from('equipment')
        .select('status')

    const stats = {
        total: 0,
        ready: 0,
        borrowed: 0,
        reserved: 0,
        maintenance: 0,
        retired: 0,
    }

    if (!statsError && allStatuses) {
        stats.total = allStatuses.length
        allStatuses.forEach((item: any) => {
            const s = item.status
            if (s === 'ready' || s === 'active') stats.ready++
            else if (s === 'borrowed') stats.borrowed++
            else if (s === 'reserved') stats.reserved++
            else if (s === 'maintenance') stats.maintenance++
            else if (s === 'retired') stats.retired++
        })
    }

    return {
        items: items || [],
        count: count || 0,
        stats,
    }
}

/**
 * Admin Action: Create new equipment
 */
export async function createEquipmentAction(input: EquipmentInput) {
    const auth = await requireAdmin()
    if (auth.error || !auth.user) {
        return { error: auth.error || 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    if (!input.name || !input.equipment_number) {
        return { error: 'กรุณาระบุชื่อและหมายเลขครุภัณฑ์' }
    }

    const adminClient = createAdminClient()

    // Check duplicate equipment number
    const { data: existing } = await adminClient
        .from('equipment')
        .select('id')
        .eq('equipment_number', input.equipment_number)
        .maybeSingle()

    if (existing) {
        return { error: 'หมายเลขครุภัณฑ์นี้มีอยู่แล้วในระบบ' }
    }

    const { data: inserted, error } = await adminClient
        .from('equipment')
        .insert({
            name: input.name,
            equipment_number: input.equipment_number,
            brand: input.brand || null,
            model: input.model || null,
            equipment_type_id: input.equipment_type_id || null,
            status: input.status,
            location: input.location || null,
            specifications: input.specifications || null,
            images: input.images || [],
            is_active: input.is_active ?? true,
        })
        .select('id, name, equipment_number')
        .single()

    if (error || !inserted) {
        return { error: error?.message || 'ไม่สามารถเพิ่มอุปกรณ์ได้' }
    }

    // Log Activity & Notify Discord
    const statusLabels: Record<string, string> = {
        ready: 'พร้อมใช้งาน',
        borrowed: 'ยืม',
        reserved: 'จอง',
        maintenance: 'บำรุงรักษา',
        retired: 'เลิกใช้งาน',
    }

    await notifyAndLog({
        discordMessage:
            `➕ **เพิ่มอุปกรณ์ใหม่ (Admin)**\n\n` +
            `📦 **อุปกรณ์:** ${inserted.name}\n` +
            `🔖 **รหัสครุภัณฑ์:** #${inserted.equipment_number}\n` +
            `⚙️ **สถานะแรกเริ่ม:** ${statusLabels[input.status] || input.status}\n` +
            `👑 **ดำเนินการโดย:** Admin`,
        discordType: 'general',
        activity: {
            staffId: auth.user.id,
            staffRole: 'admin',
            actionType: 'create_equipment' as any,
            targetType: 'equipment' as any,
            targetId: inserted.id,
            details: { name: inserted.name, equipment_number: inserted.equipment_number },
        },
    })

    revalidatePath('/equipment')
    revalidatePath('/admin/equipment')

    return { success: true, id: inserted.id }
}

/**
 * Admin Action: Update equipment details
 */
export async function updateEquipmentAction(id: string, input: EquipmentInput) {
    const auth = await requireAdmin()
    if (auth.error || !auth.user) {
        return { error: auth.error || 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    if (!input.name || !input.equipment_number) {
        return { error: 'กรุณาระบุชื่อและหมายเลขครุภัณฑ์' }
    }

    const adminClient = createAdminClient()

    // Check duplicate equipment number excluding current ID
    const { data: existing } = await adminClient
        .from('equipment')
        .select('id')
        .eq('equipment_number', input.equipment_number)
        .neq('id', id)
        .maybeSingle()

    if (existing) {
        return { error: 'หมายเลขครุภัณฑ์นี้มีอยู่แล้วในระบบ' }
    }

    // Fetch old status to detect changes
    const { data: oldData } = await adminClient
        .from('equipment')
        .select('status')
        .eq('id', id)
        .single()

    const { data: updated, error } = await adminClient
        .from('equipment')
        .update({
            name: input.name,
            equipment_number: input.equipment_number,
            brand: input.brand || null,
            model: input.model || null,
            equipment_type_id: input.equipment_type_id || null,
            status: input.status,
            location: input.location || null,
            specifications: input.specifications || null,
            images: input.images || [],
            is_active: input.is_active ?? true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, name, equipment_number')
        .single()

    if (error || !updated) {
        return { error: error?.message || 'ไม่สามารถแก้ไขข้อมูลอุปกรณ์ได้' }
    }

    const statusLabels: Record<string, string> = {
        ready: 'พร้อมใช้งาน',
        borrowed: 'ยืม',
        reserved: 'จอง',
        maintenance: 'บำรุงรักษา',
        retired: 'เลิกใช้งาน',
    }

    let statusChangeText = ''
    if (oldData && oldData.status !== input.status) {
        statusChangeText = `\n🔄 **เปลี่ยนสถานะ:** จาก \`${statusLabels[oldData.status] || oldData.status}\` เป็น \`${statusLabels[input.status]}\``
    }

    await notifyAndLog({
        discordMessage:
            `✏️ **แก้ไขข้อมูลอุปกรณ์ (Admin)**\n\n` +
            `📦 **อุปกรณ์:** ${updated.name}\n` +
            `🔖 **รหัสครุภัณฑ์:** #${updated.equipment_number}${statusChangeText}\n` +
            `👑 **ดำเนินการโดย:** Admin`,
        discordType: input.status === 'maintenance' ? 'maintenance' : 'general',
        activity: {
            staffId: auth.user.id,
            staffRole: 'admin',
            actionType: 'update_equipment' as any,
            targetType: 'equipment' as any,
            targetId: updated.id,
            details: {
                name: updated.name,
                equipment_number: updated.equipment_number,
                old_status: oldData?.status,
                new_status: input.status,
            },
        },
    })

    revalidatePath('/equipment')
    revalidatePath(`/equipment/${id}`)
    revalidatePath('/admin/equipment')

    return { success: true }
}

/**
 * Admin Action: Delete equipment
 */
export async function deleteEquipmentAction(id: string) {
    const auth = await requireAdmin()
    if (auth.error || !auth.user) {
        return { error: auth.error || 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    const adminClient = createAdminClient()

    // Verify if equipment is currently borrowed or reserved
    const { data: item } = await adminClient
        .from('equipment')
        .select('name, equipment_number, status')
        .eq('id', id)
        .single()

    if (!item) {
        return { error: 'ไม่พบข้อมูลอุปกรณ์' }
    }

    if (item.status === 'borrowed') {
        return { error: 'ไม่สามารถลบอุปกรณ์ได้ เนื่องจากกำลังถูกยืมใช้งานอยู่' }
    }

    const { error } = await adminClient
        .from('equipment')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    await notifyAndLog({
        discordMessage:
            `🗑️ **ลบอุปกรณ์ออกจากระบบ (Admin)**\n\n` +
            `📦 **อุปกรณ์:** ${item.name}\n` +
            `🔖 **รหัสครุภัณฑ์:** #${item.equipment_number}\n` +
            `👑 **ดำเนินการโดย:** Admin`,
        discordType: 'general',
        activity: {
            staffId: auth.user.id,
            staffRole: 'admin',
            actionType: 'soft_delete_data', // fallback to existing activity action
            targetType: 'equipment' as any,
            targetId: id,
            details: { name: item.name, equipment_number: item.equipment_number },
        },
    })

    revalidatePath('/equipment')
    revalidatePath('/admin/equipment')

    return { success: true }
}
