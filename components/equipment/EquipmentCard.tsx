import { Database } from '@/supabase/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Equipment = Database['public']['Tables']['equipment']['Row']

interface EquipmentCardProps {
    item: Equipment
}

const statusColorMap: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    retired: 'bg-gray-100 text-gray-800 border-gray-200',
    lost: 'bg-red-100 text-red-800 border-red-200',
}

export default function EquipmentCard({ item }: EquipmentCardProps) {
    // Defensive: ensure images is an array
    const images = Array.isArray(item.images) ? item.images : []
    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/600x400?text=No+Image'

    return (
        <Link href={`/equipment/${item.id}`} className="block group">
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                {/* Image Area */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                    <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute right-2 top-2">
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                            statusColorMap[item.status] || statusColorMap.active
                        )}>
                            {item.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col p-3 md:p-4">

                    <h3 className="mb-1 text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600">
                        {item.name}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4 font-mono">
                        {item.equipment_number}
                    </p>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">
                            {/* Location could go here */}
                            {(item.location as any)?.building || 'Main Building'}
                        </span>
                        <span className="rounded-lg bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            View Details
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
