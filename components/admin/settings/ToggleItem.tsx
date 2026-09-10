'use client'

import React from 'react'

interface ToggleItemProps {
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
    color?: 'blue' | 'orange'
}

export default function ToggleItem({
    label,
    description,
    checked,
    onChange,
    color = 'blue'
}: ToggleItemProps) {
    const colorClasses = {
        blue: 'peer-checked:bg-blue-600 peer-focus:ring-blue-300',
        orange: 'peer-checked:bg-orange-600 peer-focus:ring-orange-300'
    }

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
            <div className="min-w-0">
                <span className="font-medium text-gray-900">{label}</span>
                <p className="text-sm text-gray-500 hidden sm:block">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${colorClasses[color]}`}></div>
            </label>
        </div>
    )
}
