import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EquipmentListWithFilters from '@/components/equipment/EquipmentListWithFilters'

export default async function EquipmentListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Redirect to login if not authenticated
    if (!user) {
        redirect('/login')
    }

    // Check user status
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single()

    if (!profile || profile.status !== 'approved') {
        redirect('/pending-approval')
    }

    // Fetch equipment types for filter
    const { data: equipmentTypes } = await (supabase as any)
        .from('equipment_types')
        .select('id, name, icon')
        .eq('is_active', true)
        .order('name')

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8 md:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                            รายการอุปกรณ์
                        </h1>
                        <p className="mt-2 text-blue-100">
                            เลือกอุปกรณ์ที่ต้องการและส่งคำขอยืมได้ทันที
                        </p>
                    </div>
                </div>

                {/* Equipment List with Filters */}
                <section className="py-8 md:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <EquipmentListWithFilters
                            equipmentTypes={equipmentTypes || []}
                        />
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
