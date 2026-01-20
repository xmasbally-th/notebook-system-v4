'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import ExportTab from '@/components/admin/data-management/ExportTab'
import ImportTab from '@/components/admin/data-management/ImportTab'
import DeleteTab from '@/components/admin/data-management/DeleteTab'
import { Download, Upload, Trash2, Database, ShieldAlert } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useProfile } from '@/hooks/useProfile'

type TabType = 'export' | 'import' | 'delete'

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

export default function DataManagementPage() {
    const [activeTab, setActiveTab] = useState<TabType>('export')
    const [userId, setUserId] = useState<string | undefined>(undefined)

    useEffect(() => {
        const client = getSupabaseClient()
        if (client) {
            client.auth.getUser().then(({ data: { user } }) => {
                setUserId(user?.id || undefined)
            })
        }
    }, [])

    const { data: profile, isLoading: profileLoading } = useProfile(userId)
    const isAdmin = profile?.role === 'admin'

    const tabs = [
        { id: 'export' as TabType, label: 'ส่งออกข้อมูล', icon: Download, color: 'blue' },
        { id: 'import' as TabType, label: 'นำเข้าข้อมูล', icon: Upload, color: 'purple' },
        { id: 'delete' as TabType, label: 'ลบข้อมูล', icon: Trash2, color: 'red' }
    ]

    // Loading state
    if (profileLoading || !userId) {
        return (
            <AdminLayout title="จัดการข้อมูล" subtitle="ส่งออก, นำเข้า, และลบข้อมูลในระบบ">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">กำลังโหลด...</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    // Access denied for non-admin
    if (!isAdmin) {
        return (
            <AdminLayout title="จัดการข้อมูล" subtitle="ส่งออก, นำเข้า, และลบข้อมูลในระบบ">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                        <p className="text-gray-600">
                            หน้านี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น
                        </p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="จัดการข้อมูล" subtitle="ส่งออก, นำเข้า, และลบข้อมูลในระบบ">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Database className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">ระบบจัดการข้อมูล</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            ส่งออกรายงาน, นำเข้าข้อมูลจากไฟล์, หรือลบข้อมูลเก่า (พร้อม backup)
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        const colorClasses = {
                            blue: isActive ? 'border-blue-600 text-blue-600' : '',
                            purple: isActive ? 'border-purple-600 text-purple-600' : '',
                            red: isActive ? 'border-red-600 text-red-600' : ''
                        }
                        const iconColors = {
                            blue: isActive ? 'text-blue-600' : 'text-gray-400',
                            purple: isActive ? 'text-purple-600' : 'text-gray-400',
                            red: isActive ? 'text-red-600' : 'text-gray-400'
                        }
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors 
                                    border-b-2 -mb-px
                                    ${isActive
                                        ? colorClasses[tab.color as keyof typeof colorClasses]
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 ${iconColors[tab.color as keyof typeof iconColors]}`} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'export' && <ExportTab userId={userId} />}
                    {activeTab === 'import' && <ImportTab userId={userId} />}
                    {activeTab === 'delete' && <DeleteTab userId={userId} />}
                </div>
            </div>

            {/* Info Footer */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                    <span className="text-lg">ℹ️</span>
                    ทุกการกระทำในหน้านี้จะถูกบันทึกลงระบบ Activity Log
                </p>
            </div>
        </AdminLayout>
    )
}
