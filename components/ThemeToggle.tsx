'use client'

import { useTheme } from '@/components/providers/ThemeContext'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
    showLabel?: boolean
    variant?: 'default' | 'sidebar'
    className?: string
}

export default function ThemeToggle({ showLabel = false, variant = 'default', className = '' }: ThemeToggleProps) {
    const { isDark, toggleDark } = useTheme()

    const getButtonStyle = () => {
        if (variant === 'sidebar') {
            return isDark
                ? 'bg-white/10 border-white/10 text-yellow-400 hover:bg-white/20 shadow-[0_0_12px_rgba(250,204,21,0.1)]'
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
        }
        
        return isDark
            ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800 hover:border-slate-700 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
            : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-gray-300 hover:text-slate-900 shadow-sm'
    }

    return (
        <button
            onClick={toggleDark}
            className={`relative flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 border ${getButtonStyle()} ${className}`}
            title={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            aria-label="สลับธีมมืด/สว่าง"
        >
            <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                <Sun className={`w-5 h-5 transition-transform duration-500 absolute ${
                    isDark ? 'translate-y-8 rotate-45' : 'translate-y-0 rotate-0'
                }`} />
                <Moon className={`w-5 h-5 transition-transform duration-500 absolute ${
                    isDark ? 'translate-y-0 rotate-0' : '-translate-y-8 -rotate-45'
                }`} />
            </div>
            {showLabel && (
                <span className="text-sm font-semibold whitespace-nowrap">
                    {isDark ? 'โหมดมืด' : 'โหมดสว่าง'}
                </span>
            )}
        </button>
    )
}
