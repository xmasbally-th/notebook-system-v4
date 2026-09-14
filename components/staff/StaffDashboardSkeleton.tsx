import React from 'react'

export default function StaffDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Quick Station Skeleton */}
            <div className="bg-slate-100 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                        <div className="h-4 w-64 bg-slate-200/60 dark:bg-slate-700/50 rounded" />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="h-12 w-36 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                        <div className="h-12 w-36 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                    </div>
                </div>
                <div className="h-12 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-xl" />
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm animate-pulse"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-800" />
                            <div className="space-y-2 flex-1">
                                <div className="h-6 w-12 bg-gray-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-20 bg-gray-100 dark:bg-slate-800/60 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Queues Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm space-y-4 animate-pulse">
                <div className="flex gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-8 w-32 bg-gray-100 dark:bg-slate-800/60 rounded-xl" />
                    <div className="h-8 w-32 bg-gray-100 dark:bg-slate-800/60 rounded-xl" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-40 bg-gray-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-60 bg-gray-100 dark:bg-slate-800/60 rounded" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-20 bg-gray-200 dark:bg-slate-800 rounded-lg" />
                                <div className="h-8 w-16 bg-gray-100 dark:bg-slate-800/60 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inventory Skeleton */}
            <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
    )
}
