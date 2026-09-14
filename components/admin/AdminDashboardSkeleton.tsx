export default function AdminDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-4 w-72 bg-gray-100 dark:bg-slate-850 rounded-lg" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-28 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-slate-800 rounded" />
                                <div className="h-8 w-16 bg-gray-300 dark:bg-slate-700 rounded-lg" />
                            </div>
                            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
                        </div>
                        <div className="h-3 w-32 bg-gray-100 dark:bg-slate-850 rounded" />
                    </div>
                ))}
            </div>

            {/* Cockpit & System Health Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Action Cockpit */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            <div className="h-9 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                            <div className="h-9 w-32 bg-gray-100 dark:bg-slate-850 rounded-xl" />
                            <div className="h-9 w-32 bg-gray-100 dark:bg-slate-850 rounded-xl" />
                        </div>
                        <div className="h-4 w-20 bg-gray-100 dark:bg-slate-850 rounded" />
                    </div>

                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-50 dark:bg-slate-800/60 rounded-2xl" />
                        ))}
                    </div>
                </div>

                {/* Right 1 Col: Live System Health */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-14 bg-gray-50 dark:bg-slate-800/60 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Visual Analytics Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                    <div className="h-6 w-44 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-64 bg-gray-50 dark:bg-slate-800/50 rounded-2xl" />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                    <div className="h-6 w-44 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-64 bg-gray-50 dark:bg-slate-800/50 rounded-2xl" />
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                <div className="h-6 w-36 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-50 dark:bg-slate-800/60 rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
