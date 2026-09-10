'use client'

import React from 'react'
import { Zap } from 'lucide-react'
import { Database } from '@/supabase/types'
import ToggleItem from '../ToggleItem'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

interface FeaturesTabProps {
    formData: SystemConfigUpdate
    onFieldChange: (field: keyof SystemConfigUpdate, val: any) => void
}

export default function FeaturesTab({ formData, onFieldChange }: FeaturesTabProps) {
    return (
        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-purple-50 rounded-xl">
                    <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">ฟีเจอร์ระบบ</h2>
                    <p className="text-sm text-gray-500">เปิด/ปิดฟีเจอร์ต่างๆ ของระบบ</p>
                </div>
            </div>
            <div className="space-y-4">
                <ToggleItem
                    label="ระบบยืม-คืน"
                    description="เปิดหรือปิดการให้บริการยืมอุปกรณ์"
                    checked={formData.is_loan_system_active ?? true}
                    onChange={(checked) => onFieldChange('is_loan_system_active', checked)}
                    color="blue"
                />
                <ToggleItem
                    label="การจองล่วงหน้า"
                    description="อนุญาตให้ผู้ใช้จองอุปกรณ์ล่วงหน้า"
                    checked={formData.is_reservation_active ?? true}
                    onChange={(checked) => onFieldChange('is_reservation_active', checked)}
                    color="blue"
                />
            </div>
        </section>
    )
}
