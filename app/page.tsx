import EquipmentListContainer from '@/components/equipment/EquipmentList'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RulesSection from '@/components/home/RulesSection'
import HoursSection from '@/components/home/HoursSection'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('department_id, phone_number')
            .eq('id', user.id)
            .single()

        // If logged in but profile incomplete -> redirect
        if (profile && (!profile.department_id || !profile.phone_number)) {
            redirect('/register/complete-profile')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow">
                {/* Hero Section (or just Equipment List Title) */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight mb-4">
                            Notebook Lending System
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Borrow laptops, tablets, and accessories for your academic needs.
                            Seamless, digital, and efficient.
                        </p>
                    </div>
                </div>

                <RulesSection />

                {/* Equipment Section */}
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-gray-900">Available Equipment</h2>
                        <p className="mt-2 text-gray-500">Browse our real-time inventory and request items swiftly.</p>
                    </div>
                    <EquipmentListContainer />
                </section>

                <HoursSection />
            </main>

            <Footer />
        </div>
    )
}
