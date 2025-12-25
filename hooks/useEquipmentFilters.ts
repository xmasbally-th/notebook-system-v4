import { useState, useMemo } from 'react'

interface EquipmentFilterProps {
    initialStatus?: string
    initialCategory?: string
}

export function useEquipmentFilters<T extends {
    name: string;
    status: string;
    category: any;
    search_keywords: string[]
}>(items: T[], { initialStatus = 'all', initialCategory = 'all' }: EquipmentFilterProps = {}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(initialStatus)
    const [selectedCategory, setSelectedCategory] = useState(initialCategory)

    const filteredItems = useMemo(() => {
        if (!items) return []

        return items.filter(item => {
            // 1. Search Logic (Case insensitive, check name and keywords)
            const matchesSearch = searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (Array.isArray(item.search_keywords) && item.search_keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())))

            // 2. Status Logic
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

            // 3. Category Logic
            // Assuming category is stored as { id: 'computer', ... } JSON B
            const categoryId = item.category?.id || item.category
            const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory

            return matchesSearch && matchesStatus && matchesCategory
        })
    }, [items, searchTerm, selectedStatus, selectedCategory])

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedStatus('all')
        setSelectedCategory('all')
    }

    return {
        searchTerm,
        setSearchTerm,
        selectedStatus,
        setSelectedStatus,
        selectedCategory,
        setSelectedCategory,
        filteredItems,
        clearFilters,
    }
}
