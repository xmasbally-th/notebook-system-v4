'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'classic' | 'playful'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'playful',
    setTheme: () => { },
    toggleTheme: () => { },
})

const THEME_STORAGE_KEY = 'notebook-system-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('playful')
    const [mounted, setMounted] = useState(false)

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
        if (savedTheme && (savedTheme === 'classic' || savedTheme === 'playful')) {
            setThemeState(savedTheme)
        }
        setMounted(true)
    }, [])

    // Apply theme to document
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem(THEME_STORAGE_KEY, theme)
        }
    }, [theme, mounted])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'playful' ? 'classic' : 'playful')
    }, [])

    // Prevent flash of wrong theme
    if (!mounted) {
        return null
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
