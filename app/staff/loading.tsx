export default function StaffDashboardLoading() {
    return (
        <div className="space-y-6">
                    {/* Stat Cards Skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-gray-100 rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gray-200" />
                                    <div className="space-y-2">
                                        <div className="h-6 w-10 bg-gray-200 rounded" />
                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gray-100" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-28 bg-gray-200 rounded" />
                                        <div className="h-3 w-20 bg-gray-100 rounded" />
                                    </div>
                                </div>
                                <div className="w-5 h-5 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-gray-200 rounded" />
                                        <div className="h-3 w-48 bg-gray-100 rounded" />
                                    </div>
                                    <div className="text-right space-y-2">
                                        <div className="h-5 w-20 bg-gray-200 rounded-full ml-auto" />
                                        <div className="h-3 w-24 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
        </div>
    )
}
