export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Tab skeleton */}
            <div className="flex gap-2">
                <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                <div className="h-10 w-32 bg-gray-200 rounded-lg" />
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-xl" />
                ))}
            </div>
            {/* Table skeleton */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 flex gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-48" />
                                <div className="h-3 bg-gray-200 rounded w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
