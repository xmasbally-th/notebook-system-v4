'use client'

import React from 'react'
import { useEquipment } from '@/hooks/useEquipment'
import EquipmentForm from '@/components/admin/EquipmentForm'
import { useParams } from 'next/navigation'

export default function EditEquipmentPage() {
    // Correctly unwrap params using React.use() or just treating it as a hook if configured? 
    // In Next.js 15+ params is a Promise, but in typical client component usage it can be accessed directly or via useParams hook.
    // Using useParams hook for client component safely.
    const params = useParams()
    const id = params?.id as string

    const { data: equipment, isLoading, error } = useEquipment(id)

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6"></div>
                <div className="h-96 w-full max-w-2xl bg-gray-200 animate-pulse rounded-xl"></div>
            </div>
        )
    }

    if (error || !equipment) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center py-20">
                <h2 className="text-xl font-semibold text-red-600">Error Loading Equipment</h2>
                <p className="text-gray-500 mt-2">The equipment could not be found or an error occurred.</p>
            </div>
        )
    }

    // useEquipment when passing an ID returns a single object but typed as array due to shared hook logic sometimes.
    // Let's ensure we treat it right. The hook logic seems to handle single fetch if ID is present.
    // But verify the return type. 
    // Looking at useEquipment hook: 
    // "if (id) { query = query.eq('id', id).single() }"
    // So it returns a single object.

    // However, the hook might return generic Equipment | Equipment[] depending on implementation.
    // Let's cast it safely in the form prop.

    // Wait, the hook return is:
    // return data.map(...) as Equipment[] OR return {...} as Equipment
    // So if ID is provided, it returns Equipment.

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Equipment</h1>

            <EquipmentForm
                initialData={equipment as any}
                isEditing={true}
            />
        </div>
    )
}
