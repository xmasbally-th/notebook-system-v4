'use client'

import { useState, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient, getSupabaseCredentials } from '@/lib/supabase-helpers'
import { Loader2 } from 'lucide-react'
import { completeRegistrationAction, RegistrationState } from '@/app/register/actions'
import Turnstile from 'react-turnstile'

// Types
type Department = { id: string, name: string }

const initialState: RegistrationState = {}

export default function CompleteProfilePage() {
    const router = useRouter()
    const [departments, setDepartments] = useState<Department[]>([])
    const [turnstileToken, setTurnstileToken] = useState('')

    // Form State for controlled inputs (needed for fetching initial data)
    const [title, setTitle] = useState('นาย')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [userType, setUserType] = useState('student')
    const [departmentId, setDepartmentId] = useState('')

    const [state, formAction, isPending] = useActionState(completeRegistrationAction, initialState)

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            const client = getSupabaseBrowserClient()
            const { url, key } = getSupabaseCredentials()

            if (!client || !url || !key) {
                router.replace('/login')
                return
            }

            // 1. Get User and Session
            const { data: { user } } = await client.auth.getUser()
            const { data: { session } } = await client.auth.getSession()
            if (!user || !session) {
                router.replace('/login')
                return
            }

            // Use access token for RLS
            const authToken = session.access_token

            // 2. Load current profile using direct fetch
            const profileRes = await fetch(
                `${url}/rest/v1/profiles?id=eq.${user.id}&select=first_name,last_name,title,phone_number,user_type,department_id`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${authToken}` } }
            )
            const profiles = await profileRes.json()
            const profile = profiles?.[0]

            if (profile) {
                // If first_name contains full name from Google (no last_name), split it
                if (profile.first_name && !profile.last_name) {
                    const nameParts = profile.first_name.trim().split(/\s+/)
                    if (nameParts.length >= 2) {
                        // First part is first name, rest is last name
                        setFirstName(nameParts[0])
                        setLastName(nameParts.slice(1).join(' '))
                    } else {
                        // Single name, put in first name only
                        setFirstName(profile.first_name)
                    }
                } else {
                    // Normal case: both fields exist
                    if (profile.first_name) setFirstName(profile.first_name)
                    if (profile.last_name) setLastName(profile.last_name)
                }
            }

            // 3. Load Departments using direct fetch
            const deptRes = await fetch(
                `${url}/rest/v1/departments?is_active=eq.true&select=id,name&order=name.asc`,
                { headers: { 'apikey': key, 'Authorization': `Bearer ${authToken}` } }
            )
            const depts = await deptRes.json()
            if (depts) setDepartments(depts)
        }
        init()
    }, [router])

    // Handle Success Redirect
    useEffect(() => {
        if (state.success) {
            // Force hard reload to clear AuthGuard cache
            window.location.href = '/'
        }
    }, [state.success, router])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    กรอกข้อมูลส่วนตัว
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    กรุณากรอกข้อมูลของท่านเพื่อลงทะเบียนใช้งานระบบ
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" action={formAction}>

                        {/* Error Message */}
                        {state.error && (
                            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                                {state.error}
                            </div>
                        )}

                        {/* Title & Name */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">คำนำหน้า</label>
                                <select
                                    id="title"
                                    name="title"
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
                                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">ชื่อจริง</label>
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
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">นามสกุล</label>
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
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
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
                            <label htmlFor="user-type" className="block text-sm font-medium text-gray-700">ประเภทผู้ใช้งาน</label>
                            <select
                                id="user-type"
                                name="user-type"
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
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">สาขา / หน่วยงาน</label>
                            <select
                                id="department"
                                name="department"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={departmentId}
                                onChange={e => setDepartmentId(e.target.value)}
                            >
                                <option value="">-- เลือกสาขา/หน่วยงาน --</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Turnstile & Submit */}
                        <div>
                            <div className="mb-4 flex justify-center">
                                <Turnstile
                                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                    onVerify={token => setTurnstileToken(token)}
                                />
                                <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending || !turnstileToken}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    'ยืนยันลงทะเบียน'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
