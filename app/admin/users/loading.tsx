export default function AdminUsersLoading() {
    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header skeleton */}
            <div className="mb-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-72 bg-gray-100 rounded" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                            <div>
                                <div className="h-7 w-10 bg-gray-200 rounded mb-1" />
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter bar skeleton */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 animate-pulse">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="h-10 bg-gray-100 rounded-xl flex-1" />
                    <div className="h-10 w-64 bg-gray-100 rounded-xl" />
                </div>
            </div>

            {/* Table skeleton */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex gap-6">
                        {['ผู้ใช้', 'ติดต่อ', 'หน่วยงาน', 'สถานะ', 'สิทธิ์', 'จัดการ'].map(h => (
                            <div key={h} className="h-4 w-16 bg-gray-200 rounded" />
                        ))}
                    </div>
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 border-b border-gray-50 flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-36" />
                            <div className="h-3 bg-gray-50 rounded w-48" />
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-32" />
                        <div className="h-6 w-24 bg-gray-100 rounded-full" />
                        <div className="h-6 w-14 bg-gray-100 rounded-lg" />
                        <div className="h-8 w-28 bg-gray-100 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Mobile cards skeleton */}
            <div className="lg:hidden space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32" />
                                <div className="h-3 bg-gray-100 rounded w-48" />
                            </div>
                            <div className="h-6 w-20 bg-gray-100 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
