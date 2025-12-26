'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'
import { Loader2 } from 'lucide-react'

type Equipment = Database['public']['Tables']['equipment']['Row']
type EquipmentInsert = Database['public']['Tables']['equipment']['Insert']

interface EquipmentFormProps {
    initialData?: Equipment
    isEditing?: boolean
}

export default function EquipmentForm({ initialData, isEditing = false }: EquipmentFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<EquipmentInsert>>({
        name: initialData?.name || '',
        equipment_number: initialData?.equipment_number || '',
        status: initialData?.status || 'active',
        category: (initialData?.category as any) || { name: 'General', type: 'Other' },
        location: (initialData?.location as any) || { building: 'Main', room: 'Storage' },
        specifications: (initialData?.specifications as any) || {},
        images: (initialData?.images as any) || [],
        is_active: initialData?.is_active ?? true,
    })

    const mutation = useMutation({
        mutationFn: async (data: EquipmentInsert) => {
            if (isEditing && initialData) {
                const { error } = await (supabase as any)
                    .from('equipment')
                    .update(data as any)
                    .eq('id', initialData.id)
                if (error) throw error
            } else {
                const { error } = await (supabase as any)
                    .from('equipment')
                    .insert(data as any)
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] })
            router.push('/admin/equipment')
            router.refresh()
        },
        onError: (err: any) => {
            setError(err.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Basic Validation
        if (!formData.name || !formData.equipment_number) {
            setError('Name and Equipment Number are required')
            return
        }

        mutation.mutate(formData as EquipmentInsert)
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Helper for nested JSON fields
    const handleNestedChange = (parent: 'category' | 'location', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as any),
                [field]: value
            }
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Number *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={formData.equipment_number}
                            onChange={(e) => handleChange('equipment_number', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                    >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Details</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={(formData.category as any)?.name || ''}
                            onChange={(e) => handleNestedChange('category', 'name', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Building/Location</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={(formData.location as any)?.building || ''}
                            onChange={(e) => handleNestedChange('location', 'building', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Update Equipment' : 'Create Equipment'}
                </button>
            </div>
        </form>
    )
}
