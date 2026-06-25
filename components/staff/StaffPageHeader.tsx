import React from 'react'

interface StaffPageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
}

export default function StaffPageHeader({ title, subtitle, action }: StaffPageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
                <h1 className="text-xl lg:text-2xl font-bold text-(--foreground)">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>
                )}
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}
