'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import {
    Package, CalendarPlus, Clock, CheckCircle2, XCircle,
    Send, ArrowRight, Bookmark, AlertTriangle, Timer,
    Monitor, ClipboardList, ArrowLeft, HelpCircle, Search,
    User, Bell, MessageSquare, LogIn, RotateCcw, ShoppingCart
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
                                ขั้นตอนการเข้าสู่ระบบ, ยืม, คืน, จองอุปกรณ์ และฟีเจอร์ต่างๆ สำหรับผู้ใช้งานทั่วไป
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        {/* Quick Nav */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
                            <h2 className="text-sm font-medium text-gray-500 mb-3">ลิงก์ลัด</h2>
                            <div className="flex flex-wrap gap-2">
                                <a href="#login" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
                                    เข้าสู่ระบบ
                                </a>
                                <a href="#find" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors">
                                    ค้นหาอุปกรณ์
                                </a>
                                <a href="#borrow" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors">
                                    ขอยืม
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
                                <a href="#notifications" className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm hover:bg-yellow-100 transition-colors">
                                    การแจ้งเตือน
                                </a>
                                <a href="#support" className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm hover:bg-teal-100 transition-colors">
                                    Support Chat
                                </a>
                                <a href="#profile" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
                                    โปรไฟล์
                                </a>
                            </div>
                        </div>

                        {/* Overview */}
                        <section className="mb-10">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">📋 ภาพรวมระบบ</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    ระบบยืม-คืนอุปกรณ์ช่วยให้คุณสามารถ<strong>ขอยืมอุปกรณ์</strong>หรือ<strong>จองล่วงหน้า</strong>ได้อย่างสะดวก
                                    เพียงเลือกอุปกรณ์, กรอกข้อมูล และรอการอนุมัติจากเจ้าหน้าที่ — ระบบจะแจ้งเตือนคุณทุกขั้นตอน
                                </p>
                            </div>
                        </section>

                        {/* Login Section */}
                        <section id="login" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <LogIn className="w-5 h-5 text-gray-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">การเข้าสู่ระบบ / ลงทะเบียน</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <Step
                                        number={1}
                                        title="เปิดระบบ"
                                        description="เปิดเบราว์เซอร์ (Chrome/Edge แนะนำ) และไปที่ URL ของระบบ"
                                    />
                                    <Step
                                        number={2}
                                        title="คลิก 'เข้าสู่ระบบด้วย Google'"
                                        description="เลือกบัญชี Google ของคุณ — ระบบจะดำเนินการต่อโดยอัตโนมัติ"
                                    />
                                    <Step
                                        number={3}
                                        title="กรอกข้อมูล (สำหรับผู้ใช้ใหม่เท่านั้น)"
                                        description="ชื่อ-นามสกุล, เบอร์โทรศัพท์ (10 หลัก), ภาควิชา/หน่วยงาน, ประเภทผู้ใช้"
                                    />
                                    <Step
                                        number={4}
                                        title="รอการอนุมัติจาก Admin"
                                        description="หลังลงทะเบียน ระบบจะแจ้งเตือนเมื่อบัญชีพร้อมใช้งาน — ระบบจะพาไปหน้าหลักโดยอัตโนมัติ"
                                        isLast
                                    />
                                </div>
                            </div>
                            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                                🔒 <strong>ข้อแนะนำ:</strong> ออกจากระบบทุกครั้งเมื่อใช้งานเสร็จ โดยเฉพาะบนคอมพิวเตอร์สาธารณะ
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
                                        <p className="text-sm text-gray-600 ml-8">
                                            พิมพ์ชื่ออุปกรณ์ในช่องค้นหา เช่น "MacBook", "iPad" — ระบบแสดงผลแบบ Real-time
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                                            กรองตามหมวดหมู่
                                        </h3>
                                        <p className="text-sm text-gray-600 ml-8">
                                            เลือกหมวดหมู่อุปกรณ์ หรือกรองตามสถานะ เช่น แสดงเฉพาะ "ว่าง" เพื่อหาอุปกรณ์ที่ยืมได้ทันที
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="font-medium text-gray-700 mb-2 text-sm">สถานะอุปกรณ์:</h4>
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <span className="flex items-center gap-1.5">🟢 <strong>ว่าง</strong> — ยืมได้ทันที</span>
                                        <span className="flex items-center gap-1.5">🔵 <strong>ถูกยืม</strong> — มีผู้ยืมอยู่</span>
                                        <span className="flex items-center gap-1.5">🟡 <strong>ซ่อมบำรุง</strong> — ยืมไม่ได้</span>
                                        <span className="flex items-center gap-1.5">⚫ <strong>เลิกใช้งาน</strong> — ยืมไม่ได้</span>
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
                                <h2 className="text-xl font-bold text-gray-900">ขั้นตอนการขอยืมอุปกรณ์</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <Step
                                        number={1}
                                        title="เลือกอุปกรณ์"
                                        description={
                                            <>
                                                ไปที่หน้า <Link href="/equipment" className="text-blue-600 hover:underline font-medium">อุปกรณ์</Link> และเลือกอุปกรณ์ที่มีสถานะ "ว่าง" (สีเขียว)
                                            </>
                                        }
                                    />
                                    <Step
                                        number={2}
                                        title={
                                            <span className="flex items-center gap-1.5 flex-wrap">
                                                คลิกปุ่ม <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-medium"><ShoppingCart className="w-3.5 h-3.5" /> รายการที่เลือก</span>
                                            </span>
                                        }
                                        description="เมื่อเลือกอุปกรณ์ลงตะกร้าแล้ว ให้กดที่ปุ่ม 'รายการที่เลือก' เพื่อเข้าสู่หน้าจอกรอกข้อมูล"
                                    />
                                    <Step
                                        number={3}
                                        title="กรอกข้อมูลการยืม"
                                        description="วันที่ยืม, วันที่คืน, เวลาคืน (บังคับ), และวัตถุประสงค์การยืม"
                                    />
                                    <Step
                                        number={4}
                                        title="ส่งคำขอ"
                                        description="ตรวจสอบข้อมูลให้ถูกต้อง → กดปุ่ม 'ส่งคำขอยืม' — ระบบแจ้งเตือน Staff ทันที"
                                    />
                                    <Step
                                        number={5}
                                        title="รับอุปกรณ์"
                                        description="เมื่อได้รับการอนุมัติ (ระบบแจ้งเตือน) → มารับอุปกรณ์ที่เคาน์เตอร์บริการ"
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
                                        title='คลิกปุ่ม "จอง"'
                                        description="คลิกปุ่ม 'จอง' บนหน้ารายละเอียดอุปกรณ์"
                                    />
                                    <Step
                                        number={3}
                                        title="กรอกวันที่และเวลา"
                                        description="เลือกวันที่เริ่มต้น, วันที่สิ้นสุด, เวลาคืน และวัตถุประสงค์"
                                    />
                                    <Step
                                        number={4}
                                        title="รอการอนุมัติ"
                                        description="เจ้าหน้าที่จะตรวจสอบและอนุมัติการจอง — คุณจะได้รับแจ้งเตือนเมื่ออนุมัติ"
                                    />
                                    <Step
                                        number={5}
                                        title="มารับอุปกรณ์ตามกำหนด"
                                        description="เมื่อถึงวันที่จอง มารับอุปกรณ์ตามเวลาที่ระบุ"
                                        isLast
                                    />
                                </div>
                            </div>

                            <div className="mt-4 bg-purple-50 border border-purple-100 rounded-lg p-4">
                                <p className="text-sm text-purple-700">
                                    💡 <strong>หมายเหตุ:</strong> การจองล่วงหน้าเหมาะสำหรับกรณีที่ต้องการอุปกรณ์ในวันข้างหน้า
                                    เพื่อให้มั่นใจว่าอุปกรณ์จะพร้อมใช้งานเมื่อถึงเวลา
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
                                    ดูสถานะคำขอยืมและจองทั้งหมดได้ที่{' '}
                                    <Link href="/my-loans" className="text-blue-600 hover:underline font-medium">คำขอของฉัน</Link>
                                    {' '}และ{' '}
                                    <Link href="/my-reservations" className="text-purple-600 hover:underline font-medium">การจองของฉัน</Link>
                                    {' '}— สถานะอัปเดต<strong>แบบ Real-time</strong>
                                </p>

                                <h3 className="font-semibold text-gray-800 mb-3">ความหมายของสถานะ:</h3>

                                {/* Loan Statuses */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-500 mb-2">สถานะการยืม</p>
                                    <div className="space-y-2">
                                        <StatusBadge icon={<Clock className="w-4 h-4" />} label="รอการอนุมัติ" color="bg-yellow-100 text-yellow-800 border-yellow-200" description="คำขอกำลังรอเจ้าหน้าที่ตรวจสอบ" />
                                        <StatusBadge icon={<CheckCircle2 className="w-4 h-4" />} label="อนุมัติแล้ว" color="bg-green-100 text-green-800 border-green-200" description="ได้รับอนุมัติ → มารับอุปกรณ์ได้" />
                                        <StatusBadge icon={<Package className="w-4 h-4" />} label="กำลังยืม" color="bg-blue-100 text-blue-800 border-blue-200" description="อุปกรณ์อยู่ในความดูแลของคุณ" />
                                        <StatusBadge icon={<XCircle className="w-4 h-4" />} label="ถูกปฏิเสธ" color="bg-red-100 text-red-800 border-red-200" description="คำขอไม่ผ่าน — ดูเหตุผลในรายละเอียด" />
                                        <StatusBadge icon={<RotateCcw className="w-4 h-4" />} label="คืนแล้ว" color="bg-gray-100 text-gray-800 border-gray-200" description="ส่งคืนเรียบร้อยแล้ว" />
                                    </div>
                                </div>

                                {/* Reservation Statuses */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">สถานะการจอง</p>
                                    <div className="space-y-2">
                                        <StatusBadge icon={<Clock className="w-4 h-4" />} label="รอการอนุมัติ" color="bg-yellow-100 text-yellow-800 border-yellow-200" description="การจองรอเจ้าหน้าที่อนุมัติ" />
                                        <StatusBadge icon={<Bookmark className="w-4 h-4" />} label="จองสำเร็จ" color="bg-blue-100 text-blue-800 border-blue-200" description="ได้รับอนุมัติ — รอถึงวันรับ" />
                                        <StatusBadge icon={<Timer className="w-4 h-4" />} label="พร้อมรับ" color="bg-green-100 text-green-800 border-green-200" description="ถึงเวลารับอุปกรณ์แล้ว กรุณามารับ" />
                                        <StatusBadge icon={<AlertTriangle className="w-4 h-4" />} label="หมดอายุ" color="bg-orange-100 text-orange-800 border-orange-200" description="ไม่ได้มารับอุปกรณ์ตามเวลาที่กำหนด" />
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
                                            <h4 className="font-medium text-gray-900">เตรียมอุปกรณ์ให้ครบ</h4>
                                            <p className="text-sm text-gray-500">ตรวจสอบสายชาร์จ, กระเป๋า และอุปกรณ์เสริมอื่นๆ ให้ครบถ้วน และลบข้อมูลส่วนตัวออกจากอุปกรณ์</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-sm font-bold text-orange-600">2</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">นำมาคืนที่เคาน์เตอร์บริการ</h4>
                                            <p className="text-sm text-gray-500">แจ้งชื่อและอุปกรณ์ที่ต้องการคืนกับเจ้าหน้าที่</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-sm font-bold text-orange-600">3</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">เจ้าหน้าที่บันทึกการคืน</h4>
                                            <p className="text-sm text-gray-500">เจ้าหน้าที่ตรวจสอบสภาพและบันทึกในระบบ — รอยืนยันจากเจ้าหน้าที่ว่าบันทึกสำเร็จ</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">เสร็จสิ้น</h4>
                                            <p className="text-sm text-gray-500">สถานะจะเปลี่ยนเป็น "คืนแล้ว" ในหน้าคำขอของฉัน</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-4">
                                    <p className="text-sm text-red-700">
                                        ⚠️ <strong>ข้อควรระวัง:</strong> กรุณาคืนอุปกรณ์ตามวันและเวลาที่กำหนด
                                        หากคืนล่าช้าอาจมีผลต่อสิทธิ์การยืมในอนาคต และระบบจะแสดงในรายการ "ค้างคืน"
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Notifications Section */}
                        <section id="notifications" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">การแจ้งเตือน</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-gray-600 mb-4">
                                    คลิกไอคอน <strong>🔔</strong> ที่มุมขวาบน หรือไปที่{' '}
                                    <Link href="/notifications" className="text-blue-600 hover:underline font-medium">การแจ้งเตือน</Link>
                                    {' '}เพื่อดูการแจ้งเตือนทั้งหมด
                                </p>
                                <div className="mb-4 bg-teal-50 border border-teal-100 rounded-lg p-3 text-sm text-teal-800">
                                    📱 <strong>WeLPRU Notifications:</strong> ระบบรองรับการส่งการแจ้งเตือนผ่านแอปพลิเคชัน <strong>WeLPRU</strong> โดยตรง (ต้องกรอกรหัสนักศึกษา/บุคลากรที่หน้าโปรไฟล์ให้ถูกต้อง)
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { label: 'บัญชีได้รับการอนุมัติ', desc: 'เมื่อ Admin อนุมัติบัญชีใหม่ของคุณ' },
                                        { label: 'คำขอได้รับอนุมัติ', desc: 'เมื่อ Staff อนุมัติคำขอยืมของคุณ' },
                                        { label: 'คำขอถูกปฏิเสธ', desc: 'เมื่อ Staff ปฏิเสธ (พร้อมเหตุผล)' },
                                        { label: 'แจ้งเตือนใกล้วันคืน', desc: 'เตือนล่วงหน้าก่อนถึงวันที่กำหนดคืน' },
                                        { label: 'ข้อความจาก Admin', desc: 'เมื่อ Admin ส่งข้อความผ่าน Support Chat' },
                                        { label: 'การจองได้รับการอนุมัติ', desc: 'เมื่อการจองล่วงหน้าได้รับการอนุมัติ' },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                                <p className="text-xs text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Support Chat Section */}
                        <section id="support" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-teal-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Support Chat (ติดต่อ Admin)</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-gray-600 mb-4">
                                    หากมีข้อสงสัยหรือต้องการความช่วยเหลือ Admin สามารถส่งข้อความหาคุณโดยตรงผ่านระบบ
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                                        <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">1</div>
                                        <p className="text-sm text-teal-800">มองหาปุ่ม <strong>💬 Support</strong> ที่มุมล่างขวาของหน้าจอ</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                                        <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">2</div>
                                        <p className="text-sm text-teal-800">หากมีจุดสีแดง (🔴 Badge) แสดงว่ามีข้อความใหม่จาก Admin รอการอ่าน</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                                        <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">3</div>
                                        <p className="text-sm text-teal-800">คลิกปุ่ม Support → ดูข้อความ → ตอบกลับได้ทันที</p>
                                    </div>
                                </div>
                                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
                                    ℹ️ Admin เป็นผู้เริ่มการสนทนาเสมอ — ผู้ใช้ทั่วไปไม่สามารถเปิดแชทใหม่เองได้
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
                                    ตรวจสอบและแก้ไขข้อมูลส่วนตัวได้ที่หน้า{' '}
                                    <Link href="/profile" className="text-blue-600 hover:underline font-medium">
                                        โปรไฟล์ของฉัน
                                    </Link>
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-600">
                                            <strong>แก้ไขได้:</strong> ชื่อ-นามสกุล, เบอร์โทรศัพท์, ภาควิชา/หน่วยงาน
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-600">
                                            <strong>แก้ไขเองไม่ได้:</strong> อีเมล (ผูกกับ Google), Role, สถานะบัญชี — ต้องติดต่อ Admin
                                        </span>
                                    </div>
                                </div>
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
                                    ดูคำขอของฉัน
                                </Link>
                                <Link
                                    href="/notifications"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <Bell className="w-5 h-5" />
                                    การแจ้งเตือน
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
    title: React.ReactNode
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
