export default function MyLoansLoading() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 space-y-2">
                    <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 mb-6 gap-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-9 bg-gray-100 rounded-md animate-pulse" />
                    ))}
                </div>

                {/* Items */}
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 animate-pulse">
                            <div className="flex gap-3 sm:gap-4">
                                {/* Image placeholder */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg flex-shrink-0" />
                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between">
                                        <div className="space-y-1">
                                            <div className="h-5 w-40 bg-gray-200 rounded" />
                                            <div className="h-3 w-24 bg-gray-100 rounded" />
                                        </div>
                                        <div className="h-6 w-20 bg-gray-100 rounded-full" />
                                    </div>
                                    <div className="h-4 w-48 bg-gray-100 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
