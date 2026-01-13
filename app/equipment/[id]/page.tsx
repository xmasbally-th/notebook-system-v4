import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Wrench } from 'lucide-react'
import LoanRequestForm from './loan-form'
import ReservationForm from './reservation-form'
import BorrowTabs from './borrow-tabs'

const STATUS_CONFIG = {
    ready: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    borrowed: { label: 'กำลังถูกยืม', color: 'bg-blue-100 text-blue-700', icon: Clock },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
    retired: { label: 'ปลดระวาง', color: 'bg-gray-100 text-gray-500', icon: AlertTriangle },
}

export default async function EquipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Equipment with equipment_types
    const { data: item } = await (supabase as any)
        .from('equipment')
        .select('*, equipment_types(id, name, icon)')
        .eq('id', id)
        .single()

    if (!item) notFound()

    // 2. Fetch User Status
    const { data: { user } } = await supabase.auth.getUser()
    let userStatus = 'guest'

    if (user) {
        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('status')
            .eq('id', user.id)
            .single()
        if (profile) userStatus = profile.status
    }

    const images = Array.isArray(item.images) ? item.images : []
    const imageUrl = images.length > 0 ? (images[0] as string) : 'https://placehold.co/800x600?text=No+Image'
    const equipmentType = (item as any).equipment_types || { name: 'ทั่วไป', icon: '📦' }
    const equipmentStatus = (item.status || 'ready') as keyof typeof STATUS_CONFIG
    const statusConfig = STATUS_CONFIG[equipmentStatus] || STATUS_CONFIG.ready
    const StatusIcon = statusConfig.icon

    // Check if equipment is available for borrowing
    const canBorrow = equipmentStatus === 'ready'

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/equipment" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับไปรายการอุปกรณ์
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Side - Thumbnail */}
                        <div className="bg-gray-100 relative flex items-center justify-center p-4">
                            <img
                                src={imageUrl}
                                alt={item.name}
                                className="object-contain w-full max-h-[200px] md:max-h-[250px] rounded-lg"
                            />
                        </div>

                        {/* Content Side */}
                        <div className="p-5 md:p-8 space-y-6">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                        <span>{equipmentType.icon}</span>
                                        <span>{equipmentType.name}</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                                <p className="text-gray-500 font-mono text-sm">หมายเลขครุภัณฑ์: {item.equipment_number}</p>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                {userStatus === 'approved' ? (
                                    canBorrow ? (
                                        <BorrowTabs
                                            equipmentId={item.id}
                                            loanForm={<LoanRequestForm equipmentId={item.id} />}
                                            reservationForm={<ReservationForm equipmentId={item.id} />}
                                        />
                                    ) : (
                                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm">
                                            อุปกรณ์นี้ไม่พร้อมให้ยืมในขณะนี้ ({statusConfig.label})
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm">
                                        {userStatus === 'pending'
                                            ? 'บัญชีของคุณอยู่ระหว่างการอนุมัติ ไม่สามารถยืมอุปกรณ์ได้'
                                            : 'กรุณาเข้าสู่ระบบเพื่อยืมอุปกรณ์'}
                                    </div>
                                )}

                                {/* Cancel Button */}
                                <div className="mt-4">
                                    <Link
                                        href="/equipment"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        ยกเลิก
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

