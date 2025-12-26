'use client'

import React, { useEffect, useState } from 'react'
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useSystemConfig'
import Link from 'next/link'
import { Loader2, Save, AlertTriangle } from 'lucide-react'
import { Database } from '@/supabase/types'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

export default function AdminSettingsPage() {
    const { data: config, isLoading } = useSystemConfig()
    const updateMutation = useUpdateSystemConfig()

    // Local state for form
    const [formData, setFormData] = useState<SystemConfigUpdate>({})
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (config) {
            setFormData({
                max_loan_days: config.max_loan_days,
                max_items_per_user: config.max_items_per_user,
                opening_time: config.opening_time,
                closing_time: config.closing_time,
                is_loan_system_active: config.is_loan_system_active,
                is_reservation_active: config.is_reservation_active,
                discord_webhook_url: config.discord_webhook_url,
                announcement_message: config.announcement_message,
                announcement_active: config.announcement_active,
            })
        }
    }, [config])

    const handleChange = (field: keyof SystemConfigUpdate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)
    }

    const handleSave = () => {
        updateMutation.mutate(formData, {
            onSuccess: () => {
                setIsDirty(false)
                alert('Settings saved successfully')
            },
            onError: (err) => {
                alert(`Failed to save settings: ${err.message}`)
            }
        })
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-500">Manage global configuration for the lending system.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!isDirty || updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* General Limits */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Loan Limits</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Loan Days</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            value={formData.max_loan_days || ''}
                            onChange={(e) => handleChange('max_loan_days', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum number of days a user can borrow equipment.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Items Per User</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            value={formData.max_items_per_user || ''}
                            onChange={(e) => handleChange('max_items_per_user', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum number of active loans per user.</p>
                    </div>
                </div>
            </section>

            {/* Operations */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Operating Hours</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                        <input
                            type="time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            value={formData.opening_time || ''}
                            onChange={(e) => handleChange('opening_time', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                        <input
                            type="time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            value={formData.closing_time || ''}
                            onChange={(e) => handleChange('closing_time', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Feature Toggles */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Feature Controls</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-gray-900">Loan System Active</span>
                            <p className="text-sm text-gray-500">Enable or disable the ability for users to request loans.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.is_loan_system_active ?? true}
                                onChange={(e) => handleChange('is_loan_system_active', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-gray-900">Advance Reservation</span>
                            <p className="text-sm text-gray-500">Allow users to book equipment for future dates.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.is_reservation_active ?? true}
                                onChange={(e) => handleChange('is_reservation_active', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Integrations */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Integrations</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discord Webhook URL</label>
                    <input
                        type="url"
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        value={formData.discord_webhook_url || ''}
                        onChange={(e) => handleChange('discord_webhook_url', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Notifications about new requests will be sent here.</p>
                </div>
            </section>

            {/* Organization */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Organization</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">Departments</h3>
                        <p className="text-sm text-gray-500">Manage academic departments and faculties.</p>
                    </div>
                    <Link href="/admin/settings/departments" className="px-4 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                        Manage Departments
                    </Link>
                </div>
            </section>

            {/* Announcements */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm ring-1 ring-orange-100">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="w-5 h-5" />
                    System Announcement
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">Show Announcement Banner</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.announcement_active ?? false}
                                onChange={(e) => handleChange('announcement_active', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., System maintenance scheduled for Sunday..."
                            value={formData.announcement_message || ''}
                            onChange={(e) => handleChange('announcement_message', e.target.value)}
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}
