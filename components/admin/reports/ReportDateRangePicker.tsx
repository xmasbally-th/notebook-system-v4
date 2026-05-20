'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { getDateRangePresets } from '@/lib/reports'
import { formatThaiDateShort } from '@/lib/formatThaiDate'

interface DateRange {
    from: Date
    to: Date
}

interface ReportDateRangePickerProps {
    value: DateRange
    onChange: (range: DateRange) => void
}

const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const parseLocalDateString = (dateStr: string, isEnd = false): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (isEnd) {
        date.setHours(23, 59, 59, 999)
    } else {
        date.setHours(0, 0, 0, 0)
    }
    return date
}

export default function ReportDateRangePicker({ value, onChange }: ReportDateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [activePreset, setActivePreset] = useState<string>('30 วันล่าสุด')
    const dropdownRef = useRef<HTMLDivElement>(null)

    const presets = getDateRangePresets()

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handlePresetClick = (preset: { label: string; from: Date; to: Date }) => {
        setActivePreset(preset.label)
        onChange({ from: preset.from, to: preset.to })
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
            >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{activePreset}</span>
                <span className="text-gray-400 text-xs">
                    ({formatThaiDateShort(value.from)} - {formatThaiDateShort(value.to)})
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {presets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => handlePresetClick(preset)}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${activePreset === preset.label
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}

                    <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                        <p className="text-xs text-gray-400 mb-2">กำหนดเอง</p>
                        <div className="space-y-2">
                            <input
                                type="date"
                                value={toLocalDateString(value.from)}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const newFrom = parseLocalDateString(e.target.value, false)
                                        if (!isNaN(newFrom.getTime())) {
                                            setActivePreset('กำหนดเอง')
                                            onChange({ from: newFrom, to: value.to })
                                        }
                                    }
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                                type="date"
                                value={toLocalDateString(value.to)}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const newTo = parseLocalDateString(e.target.value, true)
                                        if (!isNaN(newTo.getTime())) {
                                            setActivePreset('กำหนดเอง')
                                            onChange({ from: value.from, to: newTo })
                                        }
                                    }
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
