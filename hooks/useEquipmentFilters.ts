import { useState, useMemo } from 'react'

interface EquipmentFilterProps {
    initialStatus?: string
}

export function useEquipmentFilters<T extends {
    name: string;
    status: string;
    search_keywords: string[]
}>(items: T[], { initialStatus = 'all' }: EquipmentFilterProps = {}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(initialStatus)

    const filteredItems = useMemo(() => {
        if (!items) return []

        return items.filter(item => {
            // 1. Search Logic (Case insensitive, check name and keywords)
            const matchesSearch = searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (Array.isArray(item.search_keywords) && item.search_keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())))

            // 2. Status Logic
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

            return matchesSearch && matchesStatus
        })
    }, [items, searchTerm, selectedStatus])

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedStatus('all')
    }

    return {
        searchTerm,
        setSearchTerm,
        selectedStatus,
        setSelectedStatus,
        filteredItems,
        clearFilters,
    }
}
