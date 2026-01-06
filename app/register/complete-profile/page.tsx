'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient, getSupabaseCredentials } from '@/lib/supabase-helpers'
import { Loader2 } from 'lucide-react'
import { notifyNewRegistration } from '@/app/register/actions'

// Types
type Department = { id: string, name: string }

export default function CompleteProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState<Department[]>([])

    // Form State
    const [title, setTitle] = useState('นาย')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [userType, setUserType] = useState('student')
    const [departmentId, setDepartmentId] = useState('')

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            const client = getSupabaseBrowserClient()
            const { url, key } = getSupabaseCredentials()

            if (!client || !url || !key) {
                router.replace('/login')
                return
            }

            // 1. Get User
            const { data: { user } } = await client.auth.getUser()
            if (!user) {
                router.replace('/login')
                return
            }

            // 2. Load current profile using direct fetch
            const profileRes = await fetch(
                `${url}/rest/v1/profiles?id=eq.${user.id}&select=first_name,last_name,title,phone_number,user_type,department_id`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
            )
            const profiles = await profileRes.json()
            const profile = profiles?.[0]

            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name)
                if (profile.last_name) setLastName(profile.last_name)
            }

            // 3. Load Departments using direct fetch
            const deptRes = await fetch(
                `${url}/rest/v1/departments?is_active=eq.true&select=id,name&order=name.asc`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
            )
            const depts = await deptRes.json()
            if (depts) setDepartments(depts)
        }
        init()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const client = getSupabaseBrowserClient()
            const { url, key } = getSupabaseCredentials()
            if (!client) throw new Error('No client available')

            // Get session for access token
            const { data: { session } } = await client.auth.getSession()
            const { data: { user } } = await client.auth.getUser()
            if (!user || !session) throw new Error('No user found')

            const updates = {
                title,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                user_type: userType,
                department_id: departmentId,
                updated_at: new Date().toISOString(),
            }

            const response = await fetch(
                `${url}/rest/v1/profiles?id=eq.${user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                }
            )

            if (!response.ok) throw new Error('Failed to update profile')

            // Notify Admin via Discord
            await notifyNewRegistration(user.id)

            // Success -> Redirect to Pending Approval page
            router.replace('/pending-approval')

        } catch (error: any) {
            alert('Error updating profile: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Complete Your Profile
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Please provide your details to register for the service.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {/* Title & Name */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                <select
                                    id="title"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                >
                                    <option value="นาย">นาย</option>
                                    <option value="นาง">นาง</option>
                                    <option value="นางสาว">นางสาว</option>
                                </select>
                            </div>
                            <div className="col-span-8">
                                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    name="first-name"
                                    id="first-name"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="last-name"
                                id="last-name"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>

                        {/* Type & Dept */}
                        <div>
                            <label htmlFor="user-type" className="block text-sm font-medium text-gray-700">User Type</label>
                            <select
                                id="user-type"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={userType}
                                onChange={e => setUserType(e.target.value)}
                            >
                                <option value="student">นักศึกษา (Student)</option>
                                <option value="lecturer">อาจารย์ (Lecturer)</option>
                                <option value="staff">เจ้าหน้าที่ (Staff)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department / Faculty</label>
                            <select
                                id="department"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={departmentId}
                                onChange={e => setDepartmentId(e.target.value)}
                            >
                                <option value="">Select a department...</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Complete Registration'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
