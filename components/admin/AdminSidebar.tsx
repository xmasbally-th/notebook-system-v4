'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Package,
    ClipboardList,
    Settings,
    Laptop,
    LogOut,
    ChevronLeft,
    Menu,
    X,
    Tag,
    User,
    Activity,
    CalendarPlus
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Get Supabase client for auth operations
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
    { href: '/admin/equipment', label: 'จัดการอุปกรณ์', icon: Package },
    { href: '/admin/equipment-types', label: 'ประเภทอุปกรณ์', icon: Tag },
    { href: '/admin/loans', label: 'คำขอยืม', icon: ClipboardList },
    { href: '/admin/reservations', label: 'จัดการการจอง', icon: CalendarPlus },
    { href: '/admin/staff-activity', label: 'ประวัติการทำงาน', icon: Activity },
    { href: '/admin/settings', label: 'ตั้งค่าระบบ', icon: Settings },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const handleSignOut = async () => {
        const client = getSupabaseClient()
        if (client) {
            await client.auth.signOut()
        }
        router.push('/login')
        router.refresh()
    }

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin'
        }
        return pathname?.startsWith(href)
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full z-40
                bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900
                text-white shadow-xl
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-20' : 'w-64'}
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="p-4 border-b border-blue-600/50">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Laptop className="w-6 h-6 text-orange-400" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="font-bold text-lg leading-tight">Admin Panel</span>
                                <span className="text-xs text-blue-200">Notebook System</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-3 flex-1">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl
                                            transition-all duration-200
                                            ${active
                                                ? 'bg-white/20 text-white shadow-lg'
                                                : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 ${active ? 'text-orange-400' : ''}`} />
                                        {!isCollapsed && (
                                            <span className="font-medium">{item.label}</span>
                                        )}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-blue-600/50">
                    <Link
                        href="/profile"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <User className="w-5 h-5" />
                        {!isCollapsed && <span>โปรไฟล์ของฉัน</span>}
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {!isCollapsed && <span>กลับหน้าหลัก</span>}
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-xl transition-colors mt-1"
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span>ออกจากระบบ</span>}
                    </button>
                </div>

                {/* Collapse Button (Desktop) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-20 p-1.5 bg-blue-600 rounded-full shadow-lg text-white hover:bg-blue-500 transition-colors"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </aside>
        </>
    )
}
