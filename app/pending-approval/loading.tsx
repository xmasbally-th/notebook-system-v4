export default function PendingApprovalLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                    {/* Icon skeleton */}
                    <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-6 animate-pulse" />

                    {/* Title skeleton */}
                    <div className="h-7 w-48 bg-gray-200 rounded mx-auto mb-3 animate-pulse" />

                    {/* Description skeleton */}
                    <div className="space-y-2 mb-6">
                        <div className="h-4 w-64 bg-gray-100 rounded mx-auto animate-pulse" />
                        <div className="h-4 w-56 bg-gray-100 rounded mx-auto animate-pulse" />
                    </div>

                    {/* Status card skeleton */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            <div className="h-6 w-24 bg-yellow-100 rounded-full animate-pulse" />
                        </div>
                        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                    </div>

                    {/* Contact info skeleton */}
                    <div className="space-y-3">
                        <div className="h-4 w-40 bg-gray-100 rounded mx-auto animate-pulse" />
                        <div className="h-4 w-48 bg-gray-100 rounded mx-auto animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    )
}
