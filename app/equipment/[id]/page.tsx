import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import LoanRequestForm from './loan-form'

export default async function EquipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Equipment
    const { data: item } = await (supabase as any)
        .from('equipment')
        .select('*')
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
    const category = (item.category as any) || {}

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Equipment
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Side */}
                        <div className="bg-gray-100 aspect-square md:aspect-auto relative">
                            <img
                                src={imageUrl}
                                alt={item.name}
                                className="object-cover w-full h-full"
                            />
                        </div>

                        {/* Content Side */}
                        <div className="p-5 md:p-8 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
                                    <span>{category.icon || '📦'}</span>
                                    <span>{category.name || 'General'}</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                                <p className="text-gray-500 font-mono text-sm">#{item.equipment_number}</p>
                            </div>

                            <div className="prose prose-sm text-gray-600">
                                <h3 className="text-gray-900 font-medium mb-2">Specifications</h3>
                                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto">
                                    {JSON.stringify(item.specifications, null, 2)}
                                </pre>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request to Borrow</h3>

                                {userStatus === 'approved' ? (
                                    <LoanRequestForm equipmentId={item.id} />
                                ) : (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm">
                                        {userStatus === 'pending'
                                            ? 'Your account is pending approval. You cannot borrow items yet.'
                                            : 'Please log in to borrow items.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
