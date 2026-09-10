'use client'

import React from 'react'
import { Palette, Check } from 'lucide-react'
import { themeInfo, type Theme } from '@/components/providers/ThemeContext'

interface ThemeTabProps {
    theme: Theme
    setTheme: (theme: Theme) => void
}

export default function ThemeTab({ theme, setTheme }: ThemeTabProps) {
    return (
        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-purple-50 rounded-xl">
                    <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">เลือกธีม</h2>
                    <p className="text-sm text-gray-500">เปลี่ยนรูปแบบสีและสไตล์ของระบบ</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {(Object.keys(themeInfo) as Theme[]).map((themeKey) => {
                    const info = themeInfo[themeKey]
                    const isActive = theme === themeKey

                    return (
                        <button
                            key={themeKey}
                            type="button"
                            onClick={() => setTheme(themeKey)}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all text-left
                                ${isActive
                                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                            `}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}

                            {/* Theme preview colors */}
                            <div className="flex gap-2 mb-3">
                                <div
                                    className="w-8 h-8 rounded-lg shadow-sm"
                                    style={{ backgroundColor: info.colors.primary }}
                                />
                                <div
                                    className="w-8 h-8 rounded-lg shadow-sm"
                                    style={{ backgroundColor: info.colors.secondary }}
                                />
                                <div
                                    className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                                    style={{ backgroundColor: info.colors.background }}
                                />
                            </div>

                            {/* Theme info */}
                            <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                                {info.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {info.description}
                            </p>
                        </button>
                    )
                })}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 text-center">
                    🎨 การเปลี่ยนธีมจะมีผลทันทีและจะถูกบันทึกไว้สำหรับการใช้งานครั้งต่อไป
                </p>
            </div>
        </section>
    )
}
