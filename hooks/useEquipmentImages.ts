'use client'

import { useQuery } from '@tanstack/react-query'
import { useEquipmentTypes } from './useEquipmentTypes'

export interface EquipmentImageItem {
    imageUrl: string
    equipmentId: string
    equipmentName: string
    equipmentNumber: string
    equipmentTypeId: string | null
    equipmentTypeName?: string
}

interface UseEquipmentImagesOptions {
    filterByTypeId?: string
    searchTerm?: string
}

function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

export function useEquipmentImages(options?: UseEquipmentImagesOptions) {
    const { data: equipmentTypes } = useEquipmentTypes()

    return useQuery({
        queryKey: ['equipment-images', options?.filterByTypeId, options?.searchTerm],
        staleTime: 30000, // 30 seconds
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            // Build query
            let endpoint = `${url}/rest/v1/equipment?select=id,name,equipment_number,equipment_type_id,images&is_active=eq.true`

            // Filter by equipment type
            if (options?.filterByTypeId) {
                endpoint += `&equipment_type_id=eq.${options.filterByTypeId}`
            }

            // Search by name or equipment number
            if (options?.searchTerm) {
                const term = options.searchTerm.toLowerCase()
                endpoint += `&or=(name.ilike.*${term}*,equipment_number.ilike.*${term}*)`
            }

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) return []

            const data = await response.json()

            // Flatten images from all equipment
            const allImages: EquipmentImageItem[] = []

            for (const equipment of data) {
                const images = Array.isArray(equipment.images) ? equipment.images : []
                const typeName = equipmentTypes?.find(
                    (t: any) => t.id === equipment.equipment_type_id
                )?.name

                for (const imageUrl of images) {
                    if (typeof imageUrl === 'string' && imageUrl.trim()) {
                        allImages.push({
                            imageUrl,
                            equipmentId: equipment.id,
                            equipmentName: equipment.name,
                            equipmentNumber: equipment.equipment_number,
                            equipmentTypeId: equipment.equipment_type_id,
                            equipmentTypeName: typeName
                        })
                    }
                }
            }

            return allImages
        },
        enabled: true
    })
}

// Hook to get equipment list with images (for clone feature)
export function useEquipmentWithImages() {
    return useQuery({
        queryKey: ['equipment-with-images'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const response = await fetch(
                `${url}/rest/v1/equipment?select=id,name,equipment_number,images&is_active=eq.true&order=name.asc`,
                {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (!response.ok) return []

            const data = await response.json()

            // Filter only equipment that has at least one image
            return data.filter((eq: any) => {
                const images = Array.isArray(eq.images) ? eq.images : []
                return images.length > 0
            }).map((eq: any) => ({
                id: eq.id,
                name: eq.name,
                equipmentNumber: eq.equipment_number,
                images: eq.images as string[]
            }))
        }
    })
}
