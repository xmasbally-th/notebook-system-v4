'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'classic' | 'playful'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
    isDark: boolean
    toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'playful',
    setTheme: () => { },
    toggleTheme: () => { },
    isDark: false,
    toggleDark: () => { },
})

const THEME_STORAGE_KEY = 'notebook-system-theme'
const DARK_STORAGE_KEY = 'notebook-system-dark'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
            if (saved === 'classic' || saved === 'playful') return saved
        }
        return 'playful'
    })

    const [isDark, setIsDarkState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(DARK_STORAGE_KEY)
            return saved === 'true'
        }
        return false
    })

    // Sync style theme (data-theme)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    }, [theme])

    // Sync dark mode class
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem(DARK_STORAGE_KEY, String(isDark))
    }, [isDark])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'playful' ? 'classic' : 'playful')
    }, [])

    const toggleDark = useCallback(() => {
        setIsDarkState(prev => !prev)
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, toggleDark }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

// Theme metadata for UI
export const themeInfo: Record<Theme, {
    name: string
    description: string
    colors: {
        primary: string
        secondary: string
        background: string
    }
}> = {
    classic: {
        name: 'Classic',
        description: 'ธีมคลาสสิก สีน้ำเงินเรียบง่าย',
        colors: {
            primary: '#3B82F6',
            secondary: '#6366F1',
            background: '#F9FAFB',
        }
    },
    playful: {
        name: 'Playful',
        description: 'ธีมสนุกสนาน สไตล์ 16-bit',
        colors: {
            primary: '#FF6B9D',
            secondary: '#00D4FF',
            background: '#FFF5F7',
        }
    }
}
