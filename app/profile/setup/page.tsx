'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'

export default function ProfileSetupPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const { data: profile } = useProfile(session?.user?.id)

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        department: '', // Simplified for now, should be object
    })

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
    }, [])

    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone_number: profile.phone_number || '',
                department: '', // Handle logic to parse department JSON if needed
            })
        }
    }, [profile])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.user?.id) return

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
                // department: ... logic to save object
                status: 'pending', // Still pending until admin approves
            })
            .eq('id', session.user.id)

        if (!error) {
            router.push('/') // Redirect home, where AuthGuard will check status again
        } else {
            alert('Error updating profile')
        }
    }

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium">First Name</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Last Name</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Phone Number</label>
                    <input
                        type="tel"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        value={formData.phone_number}
                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                    Save Profile
                </button>
            </form>
        </div>
    )
}
