'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import {
    Package, CalendarPlus, Clock, CheckCircle2, XCircle,
    Send, ArrowRight, Bookmark, AlertTriangle, Timer,
    Monitor, ClipboardList, ArrowLeft, HelpCircle, Search,
    User
} from 'lucide-react'
import React from 'react'

export default function UserGuidePage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
                <Header />

                <main className="flex-grow">
                    {/* Page Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8 md:py-12">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <HelpCircle className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    คู่มือการใช้งานระบบ
                                </h1>
                            </div>
                            <p className="text-blue-100">
                                ขั้นตอนการยืม, คืน, และจองอุปกรณ์สำหรับผู้ใช้งานทั่วไป
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        {/* Quick Nav */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
                            <h2 className="text-sm font-medium text-gray-500 mb-3">ลิงก์ลัด</h2>
                            <div className="flex flex-wrap gap-2">
                                <a href="#find" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors">
                                    ค้นหาอุปกรณ์
                                </a>
                                <a href="#borrow" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors">
                                    ยืมทันที
                                </a>
                                <a href="#reserve" className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors">
                                    จองล่วงหน้า
                                </a>
                                <a href="#status" className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors">
                                    ติดตามสถานะ
                                </a>
                                <a href="#return" className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm hover:bg-orange-100 transition-colors">
                                    การคืนอุปกรณ์
                                </a>
                                <a href="#profile" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
                                    จัดการโปรไฟล์
                                </a>
                            </div>
                        </div>

                        {/* Overview */}
                        <section className="mb-10">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">📋 ภาพรวมระบบ</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    ระบบยืม-คืนอุปกรณ์ช่วยให้คุณสามารถ<strong>ยืมอุปกรณ์ทันที</strong>หรือ<strong>จองล่วงหน้า</strong>ได้อย่างสะดวก
                                    เพียงเลือกอุปกรณ์ที่ต้องการ กรอกข้อมูล และรอการอนุมัติจากเจ้าหน้าที่
                                </p>
                            </div>
                        </section>

                        {/* Find Equipment Section */}
                        <section id="find" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Search className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">การค้นหาอุปกรณ์</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                                            Quick Search (ค้นหาด่วน)
                                        </h3>
                                        <p className="text-sm text-gray-600 ml-8 mb-4">
                                            พิมพ์ชื่ออุปกรณ์ที่ต้องการในช่องค้นหาหน้าแรก เช่น "iPad", "MacBook" ระบบจะพาไปยังหน้ารายการอุปกรณ์ที่เกี่ยวข้องทันที
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                                            หมวดหมู่อุปกรณ์
                                        </h3>
                                        <p className="text-sm text-gray-600 ml-8">
                                            คลิกที่ไอคอนหมวดหมู่ในหน้าแรก (Laptop, Tablet, Monitor, Accessories) เพื่อดูรายการอุปกรณ์ทั้งหมดในหมวดนั้นๆ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Borrow Now Section */}
                        <section id="borrow" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Send className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">ขั้นตอนการยืมทันที</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <Step
                                        number={1}
                                        title="เข้าสู่ระบบ"
                                        description="ใช้ Google Account ของมหาวิทยาลัยในการเข้าสู่ระบบ"
                                    />
                                    <Step
                                        number={2}
                                        title="เลือกอุปกรณ์"
                                        description={
                                            <>
                                                ไปที่หน้า <Link href="/equipment" className="text-blue-600 hover:underline font-medium">อุปกรณ์</Link> และเลือกอุปกรณ์ที่ต้องการยืม
                                            </>
                                        }
                                    />
                                    <Step
                                        number={3}
                                        title="กรอกข้อมูลการยืม"
                                        description="เลือก Tab 'ยืมทันที' และกรอกวันที่ยืม-คืน พร้อมเหตุผลการยืม"
                                    />
                                    <Step
                                        number={4}
                                        title="ส่งคำขอ"
                                        description="กดปุ่ม 'ส่งคำขอยืม' และรอการอนุมัติจากเจ้าหน้าที่"
                                    />
                                    <Step
                                        number={5}
                                        title="รับอุปกรณ์"
                                        description="เมื่อได้รับการอนุมัติ มารับอุปกรณ์ที่เคาน์เตอร์บริการ"
                                        isLast
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Reservation Section */}
                        <section id="reserve" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <CalendarPlus className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">ขั้นตอนการจองล่วงหน้า</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <Step
                                        number={1}
                                        title="เลือกอุปกรณ์"
                                        description={
                                            <>
                                                ไปที่หน้า <Link href="/equipment" className="text-purple-600 hover:underline font-medium">อุปกรณ์</Link> และเลือกอุปกรณ์ที่ต้องการจอง
                                            </>
                                        }
                                    />
                                    <Step
                                        number={2}
                                        title='เลือก Tab "จองล่วงหน้า"'
                                        description="ในหน้ารายละเอียดอุปกรณ์ เลือก Tab 'จองล่วงหน้า' แทน 'ยืมทันที'"
                                    />
                                    <Step
                                        number={3}
                                        title="กรอกวันที่และเวลา"
                                        description="เลือกวันที่ต้องการรับ-คืน พร้อมระบุเวลารับและเวลาคืน"
                                    />
                                    <Step
                                        number={4}
                                        title="รอการอนุมัติ"
                                        description="เจ้าหน้าที่จะตรวจสอบและอนุมัติการจอง (คุณจะได้รับแจ้งเตือน)"
                                    />
                                    <Step
                                        number={5}
                                        title="มารับอุปกรณ์ตามกำหนด"
                                        description="เมื่อถึงวันที่จอง มารับอุปกรณ์ตามเวลาที่ระบุ"
                                        isLast
                                    />
                                </div>
                            </div>

                            {/* Note */}
                            <div className="mt-4 bg-purple-50 border border-purple-100 rounded-lg p-4">
                                <p className="text-sm text-purple-700">
                                    💡 <strong>หมายเหตุ:</strong> การจองล่วงหน้าเหมาะสำหรับกรณีที่ต้องการอุปกรณ์ในวันข้างหน้า
                                    เพื่อให้มั่นใจว่าอุปกรณ์จะพร้อมใช้งานเมื่อถึงวันที่ต้องการ
                                </p>
                            </div>
                        </section>

                        {/* Status Tracking Section */}
                        <section id="status" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">การติดตามสถานะ</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-gray-600 mb-4">
                                    ดูสถานะคำขอยืมและจองได้ที่หน้า{' '}
                                    <Link href="/my-loans" className="text-blue-600 hover:underline font-medium">
                                        การยืมและจอง
                                    </Link>
                                    {' '}โดยสถานะจะ<strong>อัปเดตทันที (Realtime)</strong> เมื่อเจ้าหน้าที่ดำเนินการ
                                </p>

                                <h3 className="font-semibold text-gray-800 mb-3">ความหมายของสถานะ:</h3>

                                {/* Loan Statuses */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-500 mb-2">สถานะการยืม</p>
                                    <div className="space-y-2">
                                        <StatusBadge
                                            icon={<Clock className="w-4 h-4" />}
                                            label="รอการอนุมัติ"
                                            color="bg-yellow-100 text-yellow-800 border-yellow-200"
                                            description="คำขอยืมกำลังรอเจ้าหน้าที่ตรวจสอบ"
                                        />
                                        <StatusBadge
                                            icon={<CheckCircle2 className="w-4 h-4" />}
                                            label="อนุมัติแล้ว"
                                            color="bg-green-100 text-green-800 border-green-200"
                                            description="ได้รับอนุมัติแล้ว สามารถมารับอุปกรณ์ได้"
                                        />
                                        <StatusBadge
                                            icon={<XCircle className="w-4 h-4" />}
                                            label="ถูกปฏิเสธ"
                                            color="bg-red-100 text-red-800 border-red-200"
                                            description="คำขอถูกปฏิเสธ (ดูเหตุผลในรายละเอียด)"
                                        />
                                        <StatusBadge
                                            icon={<Package className="w-4 h-4" />}
                                            label="คืนแล้ว"
                                            color="bg-gray-100 text-gray-800 border-gray-200"
                                            description="ได้คืนอุปกรณ์เรียบร้อยแล้ว"
                                        />
                                    </div>
                                </div>

                                {/* Reservation Statuses */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">สถานะการจอง</p>
                                    <div className="space-y-2">
                                        <StatusBadge
                                            icon={<Clock className="w-4 h-4" />}
                                            label="รอการอนุมัติ"
                                            color="bg-yellow-100 text-yellow-800 border-yellow-200"
                                            description="การจองกำลังรอเจ้าหน้าที่ตรวจสอบ"
                                        />
                                        <StatusBadge
                                            icon={<Bookmark className="w-4 h-4" />}
                                            label="จองสำเร็จ"
                                            color="bg-blue-100 text-blue-800 border-blue-200"
                                            description="การจองได้รับการอนุมัติ รอถึงวันรับ"
                                        />
                                        <StatusBadge
                                            icon={<Timer className="w-4 h-4" />}
                                            label="พร้อมรับ"
                                            color="bg-green-100 text-green-800 border-green-200"
                                            description="ถึงเวลารับอุปกรณ์แล้ว กรุณามารับภายใน 5 นาที"
                                        />
                                        <StatusBadge
                                            icon={<AlertTriangle className="w-4 h-4" />}
                                            label="หมดอายุ"
                                            color="bg-orange-100 text-orange-800 border-orange-200"
                                            description="ไม่ได้มารับอุปกรณ์ตามเวลาที่กำหนด"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Return Section */}
                        <section id="return" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">การคืนอุปกรณ์</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-sm font-bold text-orange-600">1</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">นำอุปกรณ์มาคืน</h4>
                                            <p className="text-sm text-gray-500">นำอุปกรณ์มาคืนที่เคาน์เตอร์บริการภายในวันที่กำหนดคืน</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-sm font-bold text-orange-600">2</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">เจ้าหน้าที่ตรวจสอบ</h4>
                                            <p className="text-sm text-gray-500">เจ้าหน้าที่จะตรวจสอบสภาพอุปกรณ์และบันทึกการคืนในระบบ</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">เสร็จสิ้น</h4>
                                            <p className="text-sm text-gray-500">สถานะจะเปลี่ยนเป็น "คืนแล้ว" ในหน้าประวัติการยืม</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-4">
                                    <p className="text-sm text-red-700">
                                        ⚠️ <strong>ข้อควรระวัง:</strong> กรุณาคืนอุปกรณ์ตามกำหนด หากคืนล่าช้าอาจมีผลต่อสิทธิ์การยืมในอนาคต
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Profile Management Section */}
                        <section id="profile" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">การจัดการโปรไฟล์</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-gray-600 mb-4">
                                    คุณสามารถตรวจสอบและแก้ไขข้อมูลส่วนตัวได้ที่หน้า{' '}
                                    <Link href="/profile" className="text-blue-600 hover:underline font-medium">
                                        โปรไฟล์ของฉัน
                                    </Link>
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                        <span className="text-sm text-gray-600">
                                            <strong>แก้ไขข้อมูล:</strong> สามารถแก้ไข ชื่อ-นามสกุล, เบอร์โทรศัพท์ และหน่วยงาน/สังกัด ได้ด้วยตนเอง
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                        <span className="text-sm text-gray-600">
                                            <strong>ตรวจสอบสถานะบัญชี:</strong> ดูสถานะการอนุมัติบัญชี (รออนุมัติ/อนุมัติแล้ว) และประเภทผู้ใช้งาน
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Quick Links */}
                        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                            <h2 className="text-lg font-bold mb-4">เริ่มใช้งานเลย</h2>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/equipment"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <Monitor className="w-5 h-5" />
                                    ดูรายการอุปกรณ์
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/my-loans"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <Package className="w-5 h-5" />
                                    ดูประวัติการยืม
                                </Link>
                            </div>
                        </section>

                        {/* Back Button */}
                        <div className="mt-8 text-center">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </AuthGuard>
    )
}

// Step Component
function Step({ number, title, description, isLast = false }: {
    number: number
    title: string
    description: React.ReactNode
    isLast?: boolean
}) {
    return (
        <div className="flex gap-4 p-4">
            <div className={`flex flex-col items-center ${isLast ? '' : 'relative'}`}>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{number}</span>
                </div>
                {!isLast && (
                    <div className="w-0.5 bg-blue-200 flex-1 mt-2 min-h-[20px]" />
                )}
            </div>
            <div className="pt-1">
                <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    )
}

// Status Badge Component
function StatusBadge({ icon, label, color, description }: {
    icon: React.ReactNode
    label: string
    color: string
    description: string
}) {
    return (
        <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
                {icon}
                {label}
            </span>
            <span className="text-sm text-gray-500">{description}</span>
        </div>
    )
}
