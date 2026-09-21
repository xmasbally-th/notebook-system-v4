'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import {
    Activity, Box, UserPlus, Edit, FileStack,
    Package, CalendarPlus, Clock, CheckCircle2, XCircle,
    Send, ArrowRight, Bookmark, AlertTriangle, Timer,
    Monitor, ClipboardList, ArrowLeft, HelpCircle, Search,
    User, Bell, MessageSquare, LogIn, RotateCcw, ShoppingCart,
    Printer, Star, Shield, Smartphone, Check, Sparkles, AlertCircle,
    Zap, CornerDownRight, GitBranch
} from 'lucide-react'
import React, { useState } from 'react'

export default function UserGuidePage() {
    const [activeStatusTab, setActiveStatusTab] = useState<'loans' | 'reservations' | 'equipment' | 'accounts'>('loans')
    const [activeWorkflowTab, setActiveWorkflowTab] = useState<'loan' | 'reservation' | 'onboarding' | 'inspection'>('loan')

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 py-10 md:py-14 text-white shadow-md">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3.5">
                                <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                                    <HelpCircle className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/40 text-blue-100 text-xs font-medium border border-blue-400/30 mb-1">
                                        <Sparkles className="w-3 h-3" /> สำหรับผู้ใช้งานทั่วไป (Students / Lecturers / Staff)
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                        คู่มือการใช้งานระบบยืม-คืนอุปกรณ์
                                    </h1>
                                </div>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="print-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/25 backdrop-blur-sm self-start sm:self-auto text-sm font-medium shadow-sm active:scale-95"
                            >
                                <Printer className="w-4 h-4" />
                                พิมพ์ / Export PDF
                            </button>
                        </div>
                        <p className="text-blue-100 max-w-3xl leading-relaxed text-sm sm:text-base">
                            รวมขั้นตอนการใช้งานตั้งแต่การเข้าสู่ระบบ, การค้นหาอุปกรณ์, การขอยืมทันที, การจองล่วงหน้า,
                            การติดตามสถานะทุกขั้นตอน, การส่งคืน และการทำแบบประเมินความพึงพอใจ
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {/* Quick Nav Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-8 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                            <LayersIcon className="w-3.5 h-3.5" /> สารบัญและลิงก์ลัด
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <QuickNavChip href="#overview" label="ภาพรวม & ประเภทผู้ใช้" color="slate" />
                            <QuickNavChip href="#login" label="เข้าสู่ระบบ & ลงทะเบียน" color="gray" />
                            <QuickNavChip href="#find" label="ค้นหาอุปกรณ์" color="indigo" />
                            <QuickNavChip href="#borrow" label="ขอยืมอุปกรณ์ทันที" color="blue" />
                            <QuickNavChip href="#reserve" label="จองอุปกรณ์ล่วงหน้า" color="purple" />
                            <QuickNavChip href="#statuses" label="ความหมายของทุกสถานะ" color="emerald" />
                            <QuickNavChip href="#return" label="การส่งคืน & ประเมินผล" color="amber" />
                            <QuickNavChip href="#notifications" label="การแจ้งเตือน & WeLPRU" color="teal" />
                            <QuickNavChip href="#profile" label="โปรไฟล์ & ขีดจำกัดการยืม" color="sky" />
                            <QuickNavChip href="#workflows" label="แผนผังการทำงาน (Workflows)" color="violet" />
                        </div>
                    </div>

                    {/* Section 1: Overview & User Types */}
                    <section id="overview" className="mb-12 scroll-mt-24">
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white rounded-2xl p-6 sm:p-7 border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="p-2 bg-blue-600 text-white rounded-xl text-lg shadow-sm">📋</span>
                                <h2 className="text-xl font-bold text-slate-900">ภาพรวมระบบและประเภทผู้ใช้งาน</h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-6">
                                ระบบยืม-คืนอุปกรณ์ (Notebook System) พัฒนาขึ้นเพื่ออำนวยความสะดวกแก่นักศึกษา อาจารย์ และบุคลากร
                                ให้สามารถยืมอุปกรณ์สำหรับการเรียนการสอนหรือการปฏิบัติงานได้อย่างเป็นระบบ โปร่งใส และตรวจสอบได้แบบ Real-time
                            </p>

                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                                👥 ประเภทผู้ใช้งานและสิทธิ์การยืม (User Types)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <UserTypeCard
                                    icon="🎓"
                                    title="นักศึกษา (Student)"
                                    desc="ยืมเพื่อการศึกษา ค้นคว้า หรือทำโครงงาน"
                                    quota="ยืมได้ตามโควตามาตรฐาน (กำหนดโดยระบบ)"
                                    badgeColor="bg-blue-100 text-blue-800 border-blue-200"
                                />
                                <UserTypeCard
                                    icon="👨‍🏫"
                                    title="อาจารย์ (Lecturer)"
                                    desc="ยืมเพื่อการจัดการเรียนการสอนและการวิจัย"
                                    quota="ขยายระยะเวลายืมและโควตาพิเศษตามนโยบาย"
                                    badgeColor="bg-indigo-100 text-indigo-800 border-indigo-200"
                                />
                                <UserTypeCard
                                    icon="💼"
                                    title="บุคลากร (Staff)"
                                    desc="ยืมเพื่อสนับสนุนงานปฏิบัติการและงานโครงการ"
                                    quota="อนุมัติอัตโนมัติ (Auto-Approve) เมื่อส่งคำขอ"
                                    badgeColor="bg-teal-100 text-teal-800 border-teal-200"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Login & Registration */}
                    <section id="login" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={LogIn} iconColor="text-slate-700" iconBg="bg-slate-100" title="1. การเข้าสู่ระบบและการลงทะเบียน (Login & Registration)" />

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                <Step
                                    number={1}
                                    title="เข้าสู่หน้าเว็บไซต์ของระบบ"
                                    description="เปิดเว็บเบราว์เซอร์ (แนะนำ Google Chrome, Microsoft Edge หรือ Safari) และไปยังลิงก์ของระบบ"
                                />
                                <Step
                                    number={2}
                                    title="เข้าสู่ระบบด้วยบัญชี Google (Google Sign-In)"
                                    description="คลิกปุ่ม 'เข้าสู่ระบบด้วย Google' โดยใช้อีเมลสถาบันหรืออีเมลส่วนตัวที่ต้องการใช้งาน ระบบจะนำท่านเข้าสู่ขั้นตอนถัดไปอัตโนมัติ"
                                />
                                <Step
                                    number={3}
                                    title="กรอกข้อมูลโปรไฟล์ (เฉพาะการเข้าใช้งานครั้งแรก)"
                                    description={
                                        <div className="space-y-2 mt-1">
                                            <p className="text-slate-600">กรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการตรวจสอบ:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <span>• <strong>ชื่อ-นามสกุล</strong> (ภาษาไทย)</span>
                                                <span>• <strong>เบอร์โทรศัพท์</strong> (10 หลัก สำหรับติดต่อฉุกเฉิน)</span>
                                                <span>• <strong>คณะ / สำนัก / สาขาวิชา</strong></span>
                                                <span>• <strong>รหัสประจำตัว</strong> (นักศึกษาหรือบุคลากร สำหรับรับแจ้งเตือน WeLPRU)</span>
                                                <span className="sm:col-span-2">• <strong>ประเภทผู้ใช้งาน:</strong> เลือกนักศึกษา, อาจารย์ หรือบุคลากร</span>
                                            </div>
                                        </div>
                                    }
                                />
                                <Step
                                    number={4}
                                    title="รอการอนุมัติบัญชีจากเจ้าหน้าที่ (Account Approval)"
                                    description="หลังจากลงทะเบียน สถานะบัญชีจะเป็น 'รอการอนุมัติ (Pending)' เมื่อเจ้าหน้าที่หรือผู้ดูแลระบบอนุมัติเรียบร้อย ท่านจะได้รับแจ้งเตือนและสามารถยืมอุปกรณ์ได้ทันที"
                                    isLast
                                />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-800">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span><strong>คำแนะนำความปลอดภัย:</strong> หากใช้งานบนเครื่องคอมพิวเตอร์สาธารณะ ให้กดออกจากระบบ (Sign Out) ทุกครั้งหลังเสร็จสิ้นการใช้งาน</span>
                        </div>
                    </section>

                    {/* Section 3: Finding Equipment */}
                    <section id="find" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={Search} iconColor="text-indigo-600" iconBg="bg-indigo-100" title="2. การค้นหาอุปกรณ์และสถานะอุปกรณ์ (Equipment Catalog)" />

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-600 mb-5 leading-relaxed text-sm sm:text-base">
                                ไปที่เมนู <Link href="/equipment" className="text-blue-600 font-semibold hover:underline">อุปกรณ์</Link> เพื่อดูรายการอุปกรณ์ทั้งหมดของสถาบัน ระบบมีเครื่องมือช่วยค้นหาอย่างรวดเร็ว:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-1.5">
                                        <Search className="w-4 h-4 text-blue-600" />
                                        ค้นหาด่วน (Quick Search)
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        พิมพ์ชื่ออุปกรณ์, รุ่น, แบรนด์ หรือหมายเลขครุภัณฑ์ เช่น "MacBook", "Dell", "iPad" ผลการค้นหาจะแสดงแบบ Real-time ทันที
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-1.5">
                                        <TagIcon className="w-4 h-4 text-indigo-600" />
                                        กรองตามหมวดหมู่และสถานะ
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        คลิกเลือกหมวดหมู่อุปกรณ์ (เช่น โน้ตบุ๊ก, แท็บเล็ต, โปรเจกเตอร์) หรือกรองเฉพาะเครื่องที่มีสถานะ "ว่าง" เพื่อยืมได้ทันที
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-slate-500" /> ความหมายของสถานะอุปกรณ์ทั้ง 5 สถานะ:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <StatusCardSimple
                                        badge="🟢 ว่าง (available)"
                                        badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                                        desc="อุปกรณ์พร้อมให้บริการ สามารถกดลงตะกร้าเพื่อขอยืมหรือจองได้ทันที"
                                    />
                                    <StatusCardSimple
                                        badge="🔵 ถูกยืม (borrowed)"
                                        badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                                        desc="มีผู้ยืมใช้งานอยู่ ไม่สามารถขอยืมได้ในขณะนี้"
                                    />
                                    <StatusCardSimple
                                        badge="🟣 ถูกจอง (reserved)"
                                        badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                                        desc="มีผู้จองล่วงหน้าและได้รับอนุมัติแล้ว รอส่งมอบในวันที่นัดหมาย"
                                    />
                                    <StatusCardSimple
                                        badge="🟡 ซ่อมบำรุง (maintenance)"
                                        badgeColor="bg-amber-50 text-amber-700 border-amber-200"
                                        desc="อุปกรณ์อยู่ระหว่างตรวจซ่อม ปรับปรุง หรือรออะไหล่ งดยืมชั่วคราว"
                                    />
                                    <StatusCardSimple
                                        badge="⚫ เลิกใช้งาน (retired)"
                                        badgeColor="bg-slate-100 text-slate-700 border-slate-200"
                                        desc="ปลดระวาง จำหน่าย หรือตัดจำหน่ายออกจากบัญชีอุปกรณ์แล้ว"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Borrowing Now */}
                    <section id="borrow" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={Send} iconColor="text-blue-600" iconBg="bg-blue-100" title="3. ขั้นตอนการขอยืมอุปกรณ์ทันที (Direct Loan)" />

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                <Step
                                    number={1}
                                    title="เลือกอุปกรณ์ที่ต้องการยืม"
                                    description={
                                        <span>
                                            เข้าไปที่หน้า <Link href="/equipment" className="text-blue-600 font-semibold hover:underline">อุปกรณ์</Link> ค้นหาและเลือกเครื่องที่มีสถานะ <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">🟢 ว่าง</span> จากนั้นกดปุ่ม <strong>"เพิ่มลงตะกร้า"</strong>
                                        </span>
                                    }
                                />
                                <Step
                                    number={2}
                                    title={
                                        <span className="flex items-center gap-2 flex-wrap">
                                            เปิดตะกร้า <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold"><ShoppingCart className="w-3 h-3" /> รายการที่เลือก</span>
                                        </span>
                                    }
                                    description="คลิกที่ไอคอนตะกร้าหรือปุ่ม 'รายการที่เลือก' บริเวณแถบนำทาง เพื่อเปิดแผงบันทึกรายละเอียดคำขอยืม (Cart Drawer)"
                                />
                                <Step
                                    number={3}
                                    title="ระบุวัน-เวลา และวัตถุประสงค์การยืม"
                                    description={
                                        <div className="space-y-1.5 mt-1 text-slate-600">
                                            <p>• <strong>วันที่ยืม & วันที่คืน:</strong> เลือกช่วงวันที่ต้องการใช้งาน (ต้องไม่เกินจำนวนวันสูงสุดตามประเภทผู้ใช้)</p>
                                            <p>• <strong>เวลาที่จะคืน (Return Time):</strong> จำเป็นต้องระบุอย่างชัดเจน เพื่อให้เจ้าหน้าที่วางแผนการรับคืน</p>
                                            <p>• <strong>วัตถุประสงค์:</strong> ระบุการนำไปใช้งาน เช่น ใช้ในการเรียนวิชา..., ทำการทดลอง, อบรมสัมมนา</p>
                                        </div>
                                    }
                                />
                                <Step
                                    number={4}
                                    title="ส่งคำขอยืม (Submit Request)"
                                    description="ตรวจสอบความถูกต้อง และคลิกปุ่ม 'ส่งคำขอยืม' — ระบบจะบันทึกสถานะเป็น 'รอการอนุมัติ (Pending)' พร้อมแจ้งเตือนเจ้าหน้าที่ทันที (หากเป็น Staff/Admin ยืมเอง ระบบจะอนุมัติอัตโนมัติ)"
                                />
                                <Step
                                    number={5}
                                    title="รับอุปกรณ์ที่เคาน์เตอร์บริการ"
                                    description="เมื่อได้รับการอนุมัติ (แจ้งเตือนผ่านเว็บและ WeLPRU) ให้เดินทางไปรับอุปกรณ์ที่เคาน์เตอร์บริการ ตรวจสอบสภาพเครื่องและอุปกรณ์เสริมต่อหน้าเจ้าหน้าที่ จากนั้นสถานะจะเปลี่ยนเป็น 'กำลังยืม'"
                                    isLast
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Reservation */}
                    <section id="reserve" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={CalendarPlus} iconColor="text-purple-600" iconBg="bg-purple-100" title="4. ขั้นตอนการจองอุปกรณ์ล่วงหน้า (Advance Reservation)" />

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                <Step
                                    number={1}
                                    title="ค้นหาอุปกรณ์และกดปุ่ม 'จอง'"
                                    description="เลือกอุปกรณ์ที่ต้องการจองล่วงหน้า กดปุ่ม 'จอง' ที่การ์ดหรือหน้ารายละเอียดอุปกรณ์ (เหมาะสำหรับการวางแผนใช้งานในอนาคต เช่น โครงการสัปดาห์หน้า)"
                                />
                                <Step
                                    number={2}
                                    title="ระบุช่วงเวลาที่ต้องการจองล่วงหน้า"
                                    description="กำหนดวันที่เริ่มต้นจอง, วันที่สิ้นสุด, เวลาที่สะดวกมารับ และเวลาคืน พร้อมกรอกเหตุผลหรือกิจกรรมที่ใช้งาน"
                                />
                                <Step
                                    number={3}
                                    title="รอเจ้าหน้าที่อนุมัติการจอง"
                                    description="เจ้าหน้าที่จะตรวจสอบคิวการใช้งานและอนุมัติ เมื่ออนุมัติแล้วสถานะจะเปลี่ยนเป็น 'จองสำเร็จ (Approved)' เพื่อล็อกเครื่องไว้ให้ท่าน"
                                />
                                <Step
                                    number={4}
                                    title="สถานะเปลี่ยนเป็น 'พร้อมรับ (Ready)' เมื่อถึงกำหนด"
                                    description="เมื่อถึงวันที่จองล่วงหน้า หรือเจ้าหน้าที่จัดเตรียมอุปกรณ์พร้อมจ่าย สถานะจะปรับเป็น 'พร้อมรับ' ท่านสามารถเดินทางมารับเครื่องได้"
                                />
                                <Step
                                    number={5}
                                    title="รับอุปกรณ์และแปลงเป็นการยืมใช้งาน"
                                    description="เจ้าหน้าที่ที่เคาน์เตอร์จะส่งมอบเครื่อง และระบบจะแปลงรายการจองเป็น 'การยืมใช้งานจริง (Completed Reservation -> Active Loan)' จนกว่าจะส่งคืน"
                                    isLast
                                />
                            </div>
                        </div>

                        <div className="mt-3 p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-900 flex items-start gap-2.5">
                            <Timer className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                            <span><strong>หมายเหตุสำคัญ:</strong> หากถึงวันเวลานัดหมายแล้วท่านไม่มารับอุปกรณ์ภายในเวลาที่กำหนด การจองอาจถูกปรับสถานะเป็น <strong>"หมดอายุ (Expired)"</strong> และปล่อยสิทธิ์ให้อุปกรณ์กลับมาว่างสำหรับผู้อื่น</span>
                        </div>
                    </section>

                    {/* Section 6: Comprehensive Status Guide */}
                    <section id="statuses" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={ClipboardList} iconColor="text-emerald-600" iconBg="bg-emerald-100" title="5. ความหมายของทุกสถานะในระบบ (System Status Guide)" />

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-600 text-sm mb-5">
                                ตรวจสอบและติดตามสถานะคำขอของท่านได้ตลอดเวลาที่หน้า{' '}
                                <Link href="/my-loans" className="text-blue-600 font-semibold hover:underline">คำขอของฉัน (My Loans)</Link>
                                {' '}ข้อมูลจะอัปเดตแบบ Real-time ทันทีที่มีการเปลี่ยนแปลง
                            </p>

                            {/* Status Filter Tabs */}
                            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-5">
                                <button
                                    onClick={() => setActiveStatusTab('loans')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatusTab === 'loans' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    สถานะการยืม (Loan Statuses)
                                </button>
                                <button
                                    onClick={() => setActiveStatusTab('reservations')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatusTab === 'reservations' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    สถานะการจอง (Reservation Statuses)
                                </button>
                                <button
                                    onClick={() => setActiveStatusTab('equipment')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatusTab === 'equipment' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    สถานะอุปกรณ์ (Equipment Statuses)
                                </button>
                                <button
                                    onClick={() => setActiveStatusTab('accounts')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatusTab === 'accounts' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    สถานะบัญชี & การส่งคืน
                                </button>
                            </div>

                            {/* Tab 1: Loan Statuses */}
                            {activeStatusTab === 'loans' && (
                                <div className="space-y-3">
                                    <StatusRow
                                        icon={<Clock className="w-4 h-4 text-amber-600" />}
                                        name="รอการอนุมัติ (Pending)"
                                        badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                                        detail="คำขอยืมถูกส่งเข้าระบบแล้ว กำลังรอให้เจ้าหน้าที่ปฏิบัติการ (Staff) หรือ Admin ตรวจสอบข้อมูล"
                                    />
                                    <StatusRow
                                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                        name="อนุมัติแล้ว / กำลังยืม (Approved / Active)"
                                        badgeClass="bg-emerald-100 text-emerald-800 border-emerald-200"
                                        detail="คำขอผ่านการอนุมัติแล้ว และอุปกรณ์อยู่ในความรับผิดชอบการดูแลของผู้ยืม จนกว่าจะส่งคืน"
                                    />
                                    <StatusRow
                                        icon={<XCircle className="w-4 h-4 text-rose-600" />}
                                        name="ถูกปฏิเสธ (Rejected)"
                                        badgeClass="bg-rose-100 text-rose-800 border-rose-200"
                                        detail="คำขอไม่ผ่านการอนุมัติ สามารถคลิกดู 'เหตุผลในการปฏิเสธ' ที่เจ้าหน้าที่ระบุไว้ในรายละเอียดคำขอ"
                                    />
                                    <StatusRow
                                        icon={<Package className="w-4 h-4 text-slate-600" />}
                                        name="คืนแล้ว (Returned)"
                                        badgeClass="bg-slate-100 text-slate-800 border-slate-200"
                                        detail="ผู้ใช้นำอุปกรณ์ส่งคืนและเจ้าหน้าที่ตรวจสภาพเรียบร้อย จบกระบวนการยืม (สามารถทำแบบประเมินความพึงพอใจได้)"
                                    />
                                    <StatusRow
                                        icon={<AlertTriangle className="w-4 h-4 text-rose-700" />}
                                        name="ค้างคืน / เกินกำหนด (Overdue)"
                                        badgeClass="bg-rose-50 text-rose-700 border-rose-300 font-bold"
                                        detail="เลยวันและเวลาที่ระบุส่งคืนแล้ว อุปกรณ์ยังไม่ถูกบันทึกรับคืนในระบบ เจ้าหน้าที่จะดำเนินการติดต่อทวงถาม"
                                    />
                                </div>
                            )}

                            {/* Tab 2: Reservation Statuses */}
                            {activeStatusTab === 'reservations' && (
                                <div className="space-y-3">
                                    <StatusRow
                                        icon={<Clock className="w-4 h-4 text-amber-600" />}
                                        name="รอการอนุมัติ (Pending)"
                                        badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                                        detail="คำขอจองล่วงหน้าส่งแล้ว รอเจ้าหน้าที่ตรวจสอบคิวการใช้งานอุปกรณ์"
                                    />
                                    <StatusRow
                                        icon={<Bookmark className="w-4 h-4 text-blue-600" />}
                                        name="จองสำเร็จ (Approved)"
                                        badgeClass="bg-blue-100 text-blue-800 border-blue-200"
                                        detail="ได้รับการอนุมัติการจอง อุปกรณ์จะถูกกันไว้ให้ตามช่วงวันเวลาที่ระบุ"
                                    />
                                    <StatusRow
                                        icon={<Timer className="w-4 h-4 text-emerald-600" />}
                                        name="พร้อมรับ (Ready)"
                                        badgeClass="bg-emerald-100 text-emerald-800 border-emerald-200"
                                        detail="ถึงกำหนดวันนัดหมายแล้ว กรุณาเดินทางมารับอุปกรณ์ที่เคาน์เตอร์บริการตามเวลาที่ระบุ"
                                    />
                                    <StatusRow
                                        icon={<CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                        name="รับแล้ว / แปลงเป็นการยืม (Completed)"
                                        badgeClass="bg-indigo-100 text-indigo-800 border-indigo-200"
                                        detail="ผู้ใช้รับอุปกรณ์ไปใช้งานจริงแล้ว ระบบทำการแปลงสถานะการจองเป็นรายการยืมสมบูรณ์"
                                    />
                                    <StatusRow
                                        icon={<XCircle className="w-4 h-4 text-rose-600" />}
                                        name="ถูกปฏิเสธ (Rejected)"
                                        badgeClass="bg-rose-100 text-rose-800 border-rose-200"
                                        detail="คำขอจองไม่ผ่านการพิจารณา เช่น มีการจองซ้อนทับ หรืออุปกรณ์ติดซ่อมบำรุง"
                                    />
                                    <StatusRow
                                        icon={<XCircle className="w-4 h-4 text-slate-500" />}
                                        name="ยกเลิกแล้ว (Cancelled)"
                                        badgeClass="bg-slate-100 text-slate-600 border-slate-200"
                                        detail="ผู้ใช้ทำการกดยกเลิกการจองเอง หรือเจ้าหน้าที่ยกเลิกตามคำร้องขอ"
                                    />
                                    <StatusRow
                                        icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                                        name="หมดอายุ (Expired)"
                                        badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                                        detail="ผู้ใช้ไม่ได้เดินทางมารับอุปกรณ์ภายในเวลาที่กำหนดหลังถึงวันนัดหมาย ระบบจึงยกเลิกสิทธิ์อัตโนมัติ"
                                    />
                                </div>
                            )}

                            {/* Tab 3: Equipment Statuses */}
                            {activeStatusTab === 'equipment' && (
                                <div className="space-y-3">
                                    <StatusRow
                                        icon={<span className="text-base">🟢</span>}
                                        name="ว่าง (available)"
                                        badgeClass="bg-emerald-100 text-emerald-800 border-emerald-200"
                                        detail="อุปกรณ์พร้อมให้บริการ สามารถกดลงตะกร้าเพื่อยืมทันทีหรือจองล่วงหน้าได้"
                                    />
                                    <StatusRow
                                        icon={<span className="text-base">🔵</span>}
                                        name="ถูกยืม (borrowed)"
                                        badgeClass="bg-blue-100 text-blue-800 border-blue-200"
                                        detail="มีผู้ใช้งานกำลังยืมเครื่องอยู่ ไม่สามารถยืมได้ในขณะนี้"
                                    />
                                    <StatusRow
                                        icon={<span className="text-base">🟣</span>}
                                        name="ถูกจอง (reserved)"
                                        badgeClass="bg-purple-100 text-purple-800 border-purple-200"
                                        detail="มีการจองล่วงหน้าที่ได้รับการอนุมัติแล้ว อุปกรณ์ถูกกันสิทธิ์ไว้สำหรับผู้จอง"
                                    />
                                    <StatusRow
                                        icon={<span className="text-base">🟡</span>}
                                        name="ซ่อมบำรุง (maintenance)"
                                        badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                                        detail="อยู่ระหว่างตรวจเช็ค ซ่อมแซม หรือส่งศูนย์บริการ งดให้บริการชั่วคราว"
                                    />
                                    <StatusRow
                                        icon={<span className="text-base">⚫</span>}
                                        name="เลิกใช้งาน (retired)"
                                        badgeClass="bg-slate-200 text-slate-800 border-slate-300"
                                        detail="อุปกรณ์ปลดระวาง จำหน่าย หรือหมดอายุการใช้งานแล้ว ไม่สามารถขอยืมได้อีก"
                                    />
                                </div>
                            )}

                            {/* Tab 4: Accounts & Return Conditions */}
                            {activeStatusTab === 'accounts' && (
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">สถานะบัญชีผู้ใช้งาน (User Account)</h5>
                                        <div className="space-y-2">
                                            <StatusRow
                                                icon={<Clock className="w-4 h-4 text-amber-600" />}
                                                name="รอการอนุมัติ (Pending)"
                                                badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                                                detail="เพิ่งลงทะเบียน รอเจ้าหน้าที่ตรวจสอบความถูกต้องของรหัสนักศึกษา/บุคลากร"
                                            />
                                            <StatusRow
                                                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                                name="อนุมัติแล้ว (Approved)"
                                                badgeClass="bg-emerald-100 text-emerald-800 border-emerald-200"
                                                detail="บัญชีเปิดใช้งานสมบูรณ์ สามารถยืมและจองอุปกรณ์ได้ตามโควตา"
                                            />
                                            <StatusRow
                                                icon={<XCircle className="w-4 h-4 text-rose-600" />}
                                                name="ระงับการใช้งาน (Rejected / Suspended)"
                                                badgeClass="bg-rose-100 text-rose-800 border-rose-200"
                                                detail="บัญชีถูกระงับสิทธิ์ชั่วคราวหรือถาวร เช่น มีรายการค้างคืนสะสม หรือข้อมูลไม่ถูกต้อง"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">สภาพอุปกรณ์เมื่อส่งคืน (Return Inspection Condition)</h5>
                                        <div className="space-y-2">
                                            <StatusRow
                                                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                                name="สภาพสมบูรณ์ (Good)"
                                                badgeClass="bg-emerald-100 text-emerald-800 border-emerald-200"
                                                detail="ตัวเครื่องปกติ อุปกรณ์เสริมครบถ้วน พร้อมนำไปให้บริการต่อทันที"
                                            />
                                            <StatusRow
                                                icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                                                name="ชำรุดเสียหาย (Damaged)"
                                                badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                                                detail="มีรอยแตกร้าว การทำงานผิดปกติ หรือมีปัญหาทางฮาร์ดแวร์ บันทึกเพื่อส่งซ่อม"
                                            />
                                            <StatusRow
                                                icon={<XCircle className="w-4 h-4 text-rose-600" />}
                                                name="อุปกรณ์เสริมไม่ครบ (Missing Parts)"
                                                badgeClass="bg-rose-100 text-rose-800 border-rose-200"
                                                detail="ขาดสายชาร์จ, อะแดปเตอร์ หรือกระเป๋าใส่ ผู้ยืมต้องนำมาส่งคืนให้ครบถ้วน"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section 7: Return & Evaluation */}
                    <section id="return" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={RotateCcw} iconColor="text-amber-600" iconBg="bg-amber-100" title="6. การคืนอุปกรณ์และการทำแบบประเมินความพึงพอใจ (Return & Evaluation)" />

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-amber-600" />
                                        ขั้นตอนการคืนอุปกรณ์ที่เคาน์เตอร์
                                    </h3>
                                    <div className="space-y-3">
                                        <ReturnStepMini
                                            step={1}
                                            title="เตรียมอุปกรณ์และตรวจเช็คความครบถ้วน"
                                            desc="ตรวจสอบตัวเครื่อง สายชาร์จ อะแดปเตอร์ กระเป๋า และสำรอง/ลบข้อมูลส่วนตัวออกจากเครื่อง"
                                        />
                                        <ReturnStepMini
                                            step={2}
                                            title="นำส่งคืนที่เคาน์เตอร์บริการตามกำหนด"
                                            desc="แจ้งชื่อผู้ยืมหรือหมายเลขครุภัณฑ์แก่เจ้าหน้าที่ก่อนถึงเวลาที่กำหนดส่งคืน"
                                        />
                                        <ReturnStepMini
                                            step={3}
                                            title="เจ้าหน้าที่ตรวจสภาพและบันทึกการคืน"
                                            desc="เจ้าหน้าที่ตรวจสอบสภาพและกด 'บันทึกการคืน' ในระบบ สถานะจะเปลี่ยนเป็น 'คืนแล้ว (Returned)' ทันที"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200/80">
                                    <h3 className="font-bold text-amber-950 mb-2 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        การทำแบบประเมินความพึงพอใจ
                                    </h3>
                                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed mb-4">
                                        เมื่อคืนอุปกรณ์เรียบร้อยแล้ว ในหน้า <strong>"คำขอของฉัน (My Loans)"</strong> จะปรากฏปุ่ม
                                        <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-amber-500 text-white rounded text-xs font-semibold">
                                            <Star className="w-3 h-3 fill-white" /> ประเมินความพึงพอใจ
                                        </span>
                                    </p>
                                    <ul className="text-xs text-amber-900/90 space-y-2 list-disc list-inside bg-white/60 p-3.5 rounded-lg border border-amber-200/50">
                                        <li>ให้คะแนนความพึงพอใจด้านสภาพอุปกรณ์และการบริการ (1 ถึง 5 ดาว)</li>
                                        <li>ระบุความคิดเห็นหรือข้อเสนอแนะเพื่อการปรับปรุงระบบ</li>
                                        <li>สามารถทำแบบประเมินได้ภายในระยะเวลาที่กำหนด</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                <div>
                                    <strong>ข้อควรระวังเรื่องการคืนล่าช้า (Overdue):</strong> หากไม่นำส่งคืนตามกำหนดเวลา ระบบจะขึ้นสถานะ <strong>ค้างคืน</strong> และส่งการแจ้งเตือนไปยังแอป WeLPRU รวมถึงอาจส่งผลต่อการจำกัดสิทธิ์ในการยืมอุปกรณ์ครั้งต่อไป
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 8: Notifications & WeLPRU */}
                    <section id="notifications" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={Bell} iconColor="text-teal-600" iconBg="bg-teal-100" title="7. ระบบการแจ้งเตือน (Notifications & WeLPRU Push)" />

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-600 text-sm mb-4">
                                ท่านสามารถคลิกที่ไอคอนกระดิ่ง <Bell className="w-4 h-4 inline text-teal-600" /> ที่มุมขวาบน หรือไปที่หน้า{' '}
                                <Link href="/notifications" className="text-blue-600 font-semibold hover:underline">การแจ้งเตือน</Link>{' '}
                                เพื่ออ่านประวัติข้อความเตือนทั้งหมด
                            </p>

                            <div className="mb-5 p-4 rounded-xl bg-teal-50/80 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-teal-600 text-white rounded-xl shrink-0">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-teal-950 text-sm">รองรับการแจ้งเตือนผ่านแอป WeLPRU บนมือถือ</h4>
                                        <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
                                            รับการแจ้งเตือนแบบ Push Notification ตรงถึงโทรศัพท์ของท่านทันที เพียงกรอกรหัสนักศึกษาหรือรหัสบุคลากรที่ถูกต้องในหน้าโปรไฟล์
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/profile"
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto"
                                >
                                    เช็ครหัสในโปรไฟล์ <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                <NotificationBadgeItem label="คำขอยืมได้รับการอนุมัติ" desc="แจ้งเตือนเมื่อเจ้าหน้าที่อนุมัติ ให้มารับเครื่องได้" />
                                <NotificationBadgeItem label="คำขอยืมถูกปฏิเสธ" desc="แจ้งเตือนพร้อมเหตุผลที่ไม่อนุมัติ" />
                                <NotificationBadgeItem label="การจองได้รับการอนุมัติ" desc="ยืนยันการล็อกคิวอุปกรณ์ล่วงหน้า" />
                                <NotificationBadgeItem label="เตือนใกล้วันครบกำหนดคืน" desc="ส่งข้อความเตือนล่วงหน้า 1 วัน เพื่อไม่ให้คืนล่าช้า" />
                                <NotificationBadgeItem label="เตือนอุปกรณ์ค้างคืน" desc="แจ้งเตือนด่วนเมื่อเลยกำหนดเวลาส่งคืน" />
                                <NotificationBadgeItem label="ข้อความประกาศจาก Admin" desc="ข่าวสารและประกาศสำคัญเกี่ยวกับระบบ" />
                            </div>
                        </div>
                    </section>

                    {/* Section 9: Profile & Quotas */}
                    <section id="profile" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={User} iconColor="text-sky-600" iconBg="bg-sky-100" title="8. การจัดการโปรไฟล์และขีดจำกัดการยืม (Profile & Loan Limits)" />

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-600 text-sm mb-4">
                                ไปที่หน้า <Link href="/profile" className="text-blue-600 font-semibold hover:underline">โปรไฟล์ของฉัน (Profile)</Link> เพื่อตรวจสอบสถานะและปรับปรุงข้อมูลให้เป็นปัจจุบัน:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                    <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ข้อมูลที่ท่านแก้ไขได้ด้วยตนเอง
                                    </div>
                                    <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
                                        <li>ชื่อ - นามสกุล (ภาษาไทย)</li>
                                        <li>เบอร์โทรศัพท์ติดต่อ (10 หลัก)</li>
                                        <li>คณะ / สำนัก / สาขาวิชา</li>
                                        <li>รหัสประจำตัวนักศึกษา / บุคลากร (สำหรับเชื่อมต่อ WeLPRU)</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
                                        <Shield className="w-4 h-4 text-slate-500" />
                                        ข้อมูลที่ต้องติดต่อ Admin เพื่อแก้ไข
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                                        <li>อีเมลบัญชีผู้ใช้ (ผูกกับ Google Account)</li>
                                        <li>บทบาทในระบบ (Role: User / Staff / Admin)</li>
                                        <li>ประเภทผู้ใช้งาน (Student / Lecturer / Staff)</li>
                                        <li>สถานะบัญชี (Pending / Approved / Suspended)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 10: Workflows Pipeline */}
                    <section id="workflows" className="mb-12 scroll-mt-24">
                        <SectionHeader icon={Activity} iconColor="text-violet-600" iconBg="bg-violet-100" title="9. แผนผังขั้นตอนการทำงาน (System Workflows)" />

                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                            <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
                                แผนผังกระบวนการทำงานจริงของระบบ Notebook System V5 แสดงขั้นตอนการส่งต่อข้อมูล บทบาทผู้กระทำ และ <strong>จุดแยกตัดสินใจ (Decision Branches)</strong> ทั้งหมด:
                            </p>

                            {/* Workflow Tabs (Touch-friendly & swipeable on mobile) */}
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 mb-6 border-b border-slate-100">
                                <button
                                    onClick={() => setActiveWorkflowTab('loan')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeWorkflowTab === 'loan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>วงจรการยืมทันที (Direct Loan)</span>
                                </button>
                                <button
                                    onClick={() => setActiveWorkflowTab('reservation')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeWorkflowTab === 'reservation' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <CalendarPlus className="w-3.5 h-3.5" />
                                    <span>วงจรการจองล่วงหน้า (Reservation)</span>
                                </button>
                                <button
                                    onClick={() => setActiveWorkflowTab('onboarding')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeWorkflowTab === 'onboarding' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>การสมัครสมาชิก & อนุมัติ (Onboarding)</span>
                                </button>
                                <button
                                    onClick={() => setActiveWorkflowTab('inspection')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeWorkflowTab === 'inspection' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>ตรวจสภาพ & ประเมินผล (Inspection)</span>
                                </button>
                            </div>

                            {/* Workflow 1: Direct Loan Flow */}
                            {activeWorkflowTab === 'loan' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรการขอยืมอุปกรณ์ทันทีและการส่งคืน (Direct Lending & Return Flow)"
                                        actors="👤 ผู้ใช้งาน (User), 👮‍♂️ เจ้าหน้าที่ (Staff), 🤖 Smart Cron (08:30 น.)"
                                        channels="WeLPRU Mobile Push, Discord Webhook, In-App Alert"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'เลือกอุปกรณ์ที่สถานะว่าง',
                                                desc: 'ค้นหาในหน้า /equipment เลือกเครื่องที่พร้อมใช้งาน กดเพิ่มลงตะกร้า',
                                                statusBadge: '🟢 ว่าง (available)',
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'เปิดตะกร้า ระบุวัน-เวลาคืน และวัตถุประสงค์',
                                                desc: 'กำหนดวันที่ยืม-คืน ระบุเวลาคืนชัดเจน กรอกเหตุผล แล้วกดยืนยันคำขอ',
                                                branches: [
                                                    {
                                                        type: 'special',
                                                        label: '⚡ กรณี Staff / Admin ยืมเอง',
                                                        text: 'ระบบ Auto-Approve อนุมัติทันที ข้ามขั้นตอนรอตรวจ ไปรับเครื่องได้ทันที',
                                                        status: '🟢 approved'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '👮‍♂️ Staff / Admin',
                                                actorRole: 'staff',
                                                title: 'พิจารณาคำขอยืม (Staff Review)',
                                                desc: 'ตรวจสอบข้อมูลผู้ยืม วันที่ เวลา วัตถุประสงค์ และความพร้อมของอุปกรณ์',
                                                statusBadge: '🟡 รอการอนุมัติ (pending)',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 หากอนุมัติ (Approved)',
                                                        text: 'ระบบส่งแจ้งเตือน WeLPRU + In-App นัดมารับอุปกรณ์ที่เคาน์เตอร์',
                                                        status: '🟢 approved'
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🔴 หากปฏิเสธ (Rejected)',
                                                        text: 'เจ้าหน้าที่ระบุเหตุผล -> ผู้ใช้ได้รับแจ้งเตือน -> สิ้นสุดคำขอ',
                                                        status: '🔴 rejected'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '👤 ผู้ใช้ + 👮‍♂️ Staff',
                                                actorRole: 'counter',
                                                title: 'รับมอบอุปกรณ์ที่เคาน์เตอร์บริการ',
                                                desc: 'ผู้ใช้ติดต่อเคาน์เตอร์ เจ้าหน้าที่ตรวจและจ่ายเครื่อง -> สถานะเครื่องเปลี่ยนเป็นถูกยืม',
                                                statusBadge: '🔵 ถูกยืม (borrowed)'
                                            },
                                            {
                                                stepNum: 5,
                                                actor: '🤖 Smart Cron (08:30 น.)',
                                                actorRole: 'system',
                                                title: 'ระบบตรวจสอบกำหนดคืนอัตโนมัติ',
                                                desc: 'ตรวจสอบทุกเช้าเวลา 08:30 น. เพื่อแจ้งเตือนป้องกันการคืนล่าช้า',
                                                branches: [
                                                    {
                                                        type: 'alert',
                                                        label: '🔔 ก่อนครบกำหนด 1 วัน',
                                                        text: 'ส่งแจ้งเตือน WeLPRU เตือนใกล้วันส่งคืน',
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '⚠️ เลยกำหนดคืน (Overdue)',
                                                        text: 'ขึ้นสถานะค้างคืน -> ส่งแจ้งเตือนฉุกเฉิน WeLPRU ถึงผู้ยืม + แจ้ง Discord เจ้าหน้าที่',
                                                        status: '⚠️ ค้างคืน (overdue)'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 6,
                                                actor: '👤 ผู้ใช้ + 👮‍♂️ Staff',
                                                actorRole: 'counter',
                                                title: 'ส่งคืนที่เคาน์เตอร์ & ตรวจสภาพ 3 ระดับ',
                                                desc: 'นำอุปกรณ์มาส่งคืนที่เคาน์เตอร์ เจ้าหน้าที่ตรวจสภาพเครื่องและอุปกรณ์เสริม',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 สมบูรณ์ (Good)',
                                                        text: 'เครื่องและสายชาร์จครบ -> อุปกรณ์กลับสู่สถานะ ว่าง (available)',
                                                        status: '🟢 available'
                                                    },
                                                    {
                                                        type: 'alert',
                                                        label: '🟡 ชำรุด (Damaged) / 🔴 ของไม่ครบ (Missing)',
                                                        text: 'บันทึกหมายเหตุความเสียหาย -> ปรับสถานะเป็นซ่อมบำรุง (maintenance)',
                                                        status: '🟡 maintenance'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 7,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'ทำแบบประเมินความพึงพอใจ 5 ดาว',
                                                desc: 'ในหน้าคำขอของฉัน คลิกปุ่มประเมิน ให้คะแนนสภาพอุปกรณ์และการบริการ พร้อมระบุข้อเสนอแนะ -> สิ้นสุดกระบวนการสมบูรณ์',
                                                statusBadge: '⚪ คืนแล้ว (returned)'
                                            }
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Workflow 2: Reservation Flow */}
                            {activeWorkflowTab === 'reservation' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรการจองอุปกรณ์ล่วงหน้าและการแปลงสัญญา (Advance Reservation Flow)"
                                        actors="👤 ผู้ใช้งาน (User), 👮‍♂️ เจ้าหน้าที่ (Staff), 🤖 Smart Cron Engine"
                                        channels="WeLPRU Mobile Push, Discord Webhook (ห้อง Reservation), In-App Alert"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'ค้นหาอุปกรณ์ & คลิกปุ่ม "จอง"',
                                                desc: 'เลือกอุปกรณ์ที่ต้องการใช้งานในอนาคตเพื่อล็อกคิวล่วงหน้า',
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '👤 ผู้ใช้ + 🤖 ระบบ',
                                                actorRole: 'system',
                                                title: 'ระบุวัน-เวลา และตรวจสอบการซ้อนทับ',
                                                desc: 'ระบุวันที่เริ่ม-สิ้นสุด และเวลา ระบบรันฟังก์ชัน validateBooking ป้องกันเวลาชนกัน',
                                                branches: [
                                                    {
                                                        type: 'danger',
                                                        label: '⚠️ หากตรวจพบเวลาซ้อนทับ',
                                                        text: 'ระบบแจ้งเตือนช่วงเวลามีผู้จองแล้ว ระงับการทำรายการทันที',
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '👮‍♂️ Staff / Admin',
                                                actorRole: 'staff',
                                                title: 'พิจารณาคำขอจองล่วงหน้า',
                                                desc: 'เจ้าหน้าที่ตรวจสอบคิวการใช้งานและอุปกรณ์ในปฏิทินระบบ',
                                                statusBadge: '🟡 รอการอนุมัติ (pending)',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 หากอนุมัติ (Approved)',
                                                        text: 'สถานะเป็น "จองสำเร็จ" ล็อกคิวอุปกรณ์ไว้ให้ผู้จอง',
                                                        status: '🔵 จองสำเร็จ (approved)'
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🔴 หากปฏิเสธ (Rejected)',
                                                        text: 'เจ้าหน้าที่ระบุเหตุผล -> แจ้งเตือนผู้ใช้ -> สิ้นสุดคำขอ',
                                                        status: '🔴 rejected'
                                                    },
                                                    {
                                                        type: 'neutral',
                                                        label: '⚪ หากผู้ใช้ขอยกเลิก (Cancelled)',
                                                        text: 'ผู้ใช้กดยกเลิกการจองเองก่อนถึงวันนัดหมาย',
                                                        status: '⚪ cancelled'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '👮‍♂️ Staff + 🤖 Smart Cron',
                                                actorRole: 'system',
                                                title: 'การเปลี่ยนผ่านเมื่อถึงวันนัดหมาย',
                                                desc: 'เมื่อถึงวันนัดรับเครื่อง เจ้าหน้าที่จัดเตรียมอุปกรณ์หรือระบบจัดการคิว',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 เจ้าหน้าที่เตรียมเครื่องพร้อมจ่าย',
                                                        text: 'ปรับสถานะเป็น "พร้อมรับ (Ready)" แจ้งเตือนผู้ใช้ให้มารับเครื่อง',
                                                        status: '🟢 พร้อมรับ (ready)'
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🟠 หากไม่มารับตามกำหนด (Expired)',
                                                        text: 'Smart Cron (08:30 น.) ปรับสถานะเป็นหมดอายุ และปลดล็อกเครื่องกลับมาว่าง',
                                                        status: '🟠 หมดอายุ (expired)'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 5,
                                                actor: '👤 ผู้ใช้ + 👮‍♂️ Staff',
                                                actorRole: 'counter',
                                                title: 'รับมอบเครื่อง & แปลงเป็นการยืมจริง',
                                                desc: 'ผู้ใช้นำหลักฐานมารับเครื่อง เจ้าหน้าที่กดยืนยันส่งมอบ -> ระบบปรับการจองเป็น Completed และสร้างสัญญาการยืม Active Loan ทันที',
                                                statusBadge: '📦 รับแล้ว (completed) -> 🔵 กำลังยืม (approved)'
                                            },
                                            {
                                                stepNum: 6,
                                                actor: '👤 ผู้ใช้ + 👮‍♂️ Staff',
                                                actorRole: 'user',
                                                title: 'ใช้งานตามกำหนด ส่งคืนที่เคาน์เตอร์ และทำแบบประเมิน',
                                                desc: 'นำส่งคืนตามกำหนดเวลา -> เจ้าหน้าที่ตรวจสภาพ -> ทำแบบประเมินความพึงพอใจ 5 ดาว',
                                                statusBadge: '⚪ คืนแล้ว (returned)'
                                            }
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Workflow 3: Onboarding Flow */}
                            {activeWorkflowTab === 'onboarding' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรการสมัครสมาชิกและการอนุมัติบัญชีผู้ใช้งาน (User Onboarding Lifecycle)"
                                        actors="👤 ผู้ใช้งาน (User), 👮‍♂️ เจ้าหน้าที่ (Staff), 🛡️ ผู้ดูแลระบบ (Admin)"
                                        channels="Discord Webhook (ห้อง Auth), WeLPRU Mobile Push, In-App Alert"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'เข้าสู่ระบบด้วย Google Sign-In',
                                                desc: 'คลิกเข้าสู่ระบบด้วยบัญชี Google เพื่อยืนยันตัวตนระดับแรก',
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'กรอกข้อมูลโปรไฟล์ให้ครบถ้วน',
                                                desc: 'ระบุชื่อ-นามสกุล, เบอร์โทร 10 หลัก, คณะ/สาขา, รหัสนักศึกษา/บุคลากร และเลือกประเภท (Student / Lecturer / Staff)',
                                                statusBadge: '🟡 รอการอนุมัติ (pending)'
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '🤖 ระบบ',
                                                actorRole: 'system',
                                                title: 'ส่งการแจ้งเตือน Discord แจ้งเจ้าหน้าที่',
                                                desc: 'ระบบส่ง Webhook เข้าห้อง Auth ของเจ้าหน้าที่ เพื่อแจ้งเตือนว่ามีผู้ใช้ใหม่รออนุมัติ',
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '👮‍♂️ Staff / 🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'ตรวจสอบข้อมูลและพิจารณาอนุมัติ',
                                                desc: 'เจ้าหน้าที่เข้าไปที่เมนู /staff/users หรือ Admin ไปที่ /admin/users เพื่อตรวจสอบรหัสและข้อมูล',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 อนุมัติบัญชี (Approved)',
                                                        text: 'ผู้ใช้ได้รับแจ้งเตือน บัญชีเปิดใช้งานสมบูรณ์ สามารถยืมและจองอุปกรณ์ได้ตามโควตา',
                                                        status: '🟢 approved'
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🔴 ไม่อนุมัติ / ระงับสิทธิ์ (Rejected / Suspended)',
                                                        text: 'ข้อมูลไม่ถูกต้อง หรือผิดระเบียบ ระบบระงับสิทธิ์ไม่ให้ทำรายการยืม-จอง',
                                                        status: '🔴 rejected'
                                                    }
                                                ]
                                            }
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Workflow 4: Return & Inspection Flow */}
                            {activeWorkflowTab === 'inspection' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรการรับคืน ตรวจสภาพอุปกรณ์ และประเมินความพึงพอใจ (Return, Inspection & Evaluation)"
                                        actors="👤 ผู้ใช้งาน (User), 👮‍♂️ เจ้าหน้าที่ (Staff)"
                                        channels="Discord Webhook (ห้อง General), In-App Evaluation Prompt"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'นำอุปกรณ์มาส่งคืนที่เคาน์เตอร์',
                                                desc: 'เตรียมเครื่อง สายชาร์จ กระเป๋า ลบข้อมูลส่วนตัว แล้วนำมาส่งที่เคาน์เตอร์บริการ',
                                                statusBadge: '🔵 กำลังยืม (borrowed)'
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '👮‍♂️ Staff',
                                                actorRole: 'counter',
                                                title: 'ค้นหารายการผ่านระบบ Fast Counter',
                                                desc: 'สแกนบาร์โค้ด หรือพิมพ์หมายเลขครุภัณฑ์ ระบบจะดึงข้อมูลผู้ยืมขึ้นมาอัตโนมัติใน 1 วินาที',
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '👮‍♂️ Staff',
                                                actorRole: 'staff',
                                                title: 'ตรวจสอบสภาพอุปกรณ์ 3 ระดับ',
                                                desc: 'ตรวจเช็คตัวเครื่อง หน้าจอ แป้นพิมพ์ และอุปกรณ์เสริมอย่างละเอียด',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 สภาพสมบูรณ์ (Good)',
                                                        text: 'เครื่องปกติ อุปกรณ์ครบ -> ระบบปรับอุปกรณ์เป็น ว่าง (available) ทันที',
                                                        status: '🟢 available'
                                                    },
                                                    {
                                                        type: 'alert',
                                                        label: '🟡 ชำรุดเสียหาย (Damaged)',
                                                        text: 'บันทึกหมายเหตุความเสียหาย -> ปรับอุปกรณ์เป็น ซ่อมบำรุง (maintenance)',
                                                        status: '🟡 maintenance'
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🔴 อุปกรณ์เสริมไม่ครบ (Missing Parts)',
                                                        text: 'ระบุรายการอุปกรณ์ที่ขาด (เช่น สายชาร์จ) เพื่อติดตามทวงถาม',
                                                        status: '🟡 maintenance'
                                                    }
                                                ]
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '👮‍♂️ Staff + 🤖 ระบบ',
                                                actorRole: 'system',
                                                title: 'ยืนยันรับคืน & อัปเดตสถานะสำเร็จ',
                                                desc: 'ระบบเปลี่ยนสถานะคำขอเป็น "คืนแล้ว (Returned)" และส่งการแจ้งเตือนยืนยันการคืน',
                                                statusBadge: '⚪ คืนแล้ว (returned)'
                                            },
                                            {
                                                stepNum: 5,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'ทำแบบประเมินความพึงพอใจ 5 ดาว',
                                                desc: 'ผู้ใช้เข้าไปที่หน้าคำขอของฉัน คลิกปุ่ม "ประเมินความพึงพอใจ" เพื่อให้คะแนน 1-5 ดาว และกรอกข้อเสนอแนะเพื่อนำไปพัฒนาบริการ',
                                                statusBadge: '⭐ ประเมินผลแล้ว'
                                            }
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Legend Bar */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-500">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-semibold text-slate-700">สัญลักษณ์บทบาท:</span>
                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">👤 ผู้ใช้ (User)</span>
                                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">👮‍♂️ เจ้าหน้าที่ (Staff)</span>
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">🤖 ระบบ (Smart Cron)</span>
                                </div>
                                <span className="text-slate-400">รองรับการแสดงผลทั้งหน้าจอมือถือและเดสก์ท็อป</span>
                            </div>
                        </div>
                    </section>

                    {/* Quick Launch CTA */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold mb-1.5">พร้อมเริ่มต้นใช้งานแล้วหรือยัง?</h3>
                                <p className="text-blue-100 text-sm">
                                    เลือกดูรายการอุปกรณ์ที่พร้อมให้บริการ หรือตรวจสอบคำขอของท่านได้ทันที
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/equipment"
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm shadow-sm"
                                >
                                    <Monitor className="w-4 h-4" /> ดูรายการอุปกรณ์
                                </Link>
                                <Link
                                    href="/my-loans"
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all text-sm"
                                >
                                    <Package className="w-4 h-4" /> คำขอของฉัน
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Back Link */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าแรกของระบบ
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

/* ─── Helper UI Components ─── */

function QuickNavChip({ href, label, color }: { href: string; label: string; color: string }) {
    return (
        <a
            href={href}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-medium transition-colors"
        >
            {label}
        </a>
    )
}

function SectionHeader({ icon: Icon, iconColor, iconBg, title }: { icon: any; iconColor: string; iconBg: string; title: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
    )
}

function UserTypeCard({ icon, title, desc, quota, badgeColor }: { icon: string; title: string; desc: string; quota: string; badgeColor: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
                <div className="text-2xl mb-2">{icon}</div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{desc}</p>
            </div>
            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium border ${badgeColor}`}>
                {quota}
            </span>
        </div>
    )
}

function StatusCardSimple({ badge, badgeColor, desc }: { badge: string; badgeColor: string; desc: string }) {
    return (
        <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border mb-2 ${badgeColor}`}>
                {badge}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
        </div>
    )
}

function StatusRow({ icon, name, badgeClass, detail }: { icon: React.ReactNode; name: string; badgeClass: string; detail: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5 shrink-0">
                <span className="p-1 rounded bg-white shadow-xs border border-slate-200">{icon}</span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
                    {name}
                </span>
            </div>
            <p className="text-xs text-slate-600 sm:text-right leading-relaxed">{detail}</p>
        </div>
    )
}

function Step({ number, title, description, isLast = false }: {
    number: number
    title: React.ReactNode
    description: React.ReactNode
    isLast?: boolean
}) {
    return (
        <div className="flex gap-4 p-5 sm:p-6">
            <div className={`flex flex-col items-center ${isLast ? '' : 'relative'}`}>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {number}
                </div>
                {!isLast && (
                    <div className="w-0.5 bg-blue-200 flex-1 mt-2 min-h-[24px]" />
                )}
            </div>
            <div className="pt-0.5 flex-1">
                <h4 className="font-bold text-slate-900 text-base mb-1">{title}</h4>
                <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
            </div>
        </div>
    )
}

function ReturnStepMini({ step, title, desc }: { step: number; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {step}
            </span>
            <div>
                <h5 className="font-semibold text-slate-800 text-xs sm:text-sm">{title}</h5>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function NotificationBadgeItem({ label, desc }: { label: string; desc: string }) {
    return (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                <span>{label}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
        </div>
    )
}

function WorkflowMetaBar({ title, actors, channels }: { title: string; actors: string; channels: string }) {
    return (
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-2">{title}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700 shrink-0">👥 ผู้เกี่ยวข้อง:</span>
                    <span>{actors}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700 shrink-0">📡 ช่องทางแจ้งเตือน:</span>
                    <span className="text-teal-700 font-medium">{channels}</span>
                </div>
            </div>
        </div>
    )
}

interface FlowchartBranch {
    type: 'success' | 'danger' | 'alert' | 'special' | 'neutral'
    label: string
    text: string
    status?: string
}

interface FlowchartStep {
    stepNum: number
    actor: string
    actorRole?: 'user' | 'staff' | 'counter' | 'system'
    title: string
    desc: string
    statusBadge?: string
    branches?: FlowchartBranch[]
}

const branchStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    success: {
        bg: 'bg-emerald-50/70',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    danger: {
        bg: 'bg-rose-50/70',
        border: 'border-rose-200',
        text: 'text-rose-900',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    alert: {
        bg: 'bg-amber-50/70',
        border: 'border-amber-200',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    special: {
        bg: 'bg-indigo-50/70',
        border: 'border-indigo-200',
        text: 'text-indigo-900',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    neutral: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
}

const actorRoleStyles: Record<string, string> = {
    user: 'bg-blue-50 text-blue-700 border-blue-200',
    staff: 'bg-teal-50 text-teal-700 border-teal-200',
    counter: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    system: 'bg-purple-50 text-purple-700 border-purple-200',
}

function ResponsiveWorkflowFlowchart({ steps }: { steps: FlowchartStep[] }) {
    return (
        <div>
            {/* Mobile View: Vertical Connected Timeline (320px - 767px) */}
            <div className="block md:hidden relative pl-6 border-l-2 border-slate-200 ml-3.5 space-y-5">
                {steps.map((step) => {
                    const actorStyle = actorRoleStyles[step.actorRole || 'user'] || actorRoleStyles.user
                    return (
                        <div key={step.stepNum} className="relative">
                            {/* Step Badge positioned on the timeline line */}
                            <div className="absolute -left-[35px] top-0 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-4 ring-white">
                                {step.stepNum}
                            </div>

                            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${actorStyle}`}>
                                        {step.actor}
                                    </span>
                                    {step.statusBadge && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                                            {step.statusBadge}
                                        </span>
                                    )}
                                </div>
                                <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{step.desc}</p>

                                {step.branches && step.branches.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-2">
                                        {step.branches.map((b, bIdx) => {
                                            const bStyle = branchStyles[b.type] || branchStyles.neutral
                                            return (
                                                <div key={bIdx} className={`p-2.5 rounded-lg border ${bStyle.bg} ${bStyle.border} ${bStyle.text}`}>
                                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                                        <span className="font-bold text-xs">{b.label}</span>
                                                        {b.status && (
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${bStyle.badge}`}>
                                                                {b.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] opacity-90 leading-relaxed">{b.text}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Desktop View: Expanded Stepper with Decision Branches (768px+) */}
            <div className="hidden md:block space-y-3.5">
                {steps.map((step) => {
                    const actorStyle = actorRoleStyles[step.actorRole || 'user'] || actorRoleStyles.user
                    return (
                        <div key={step.stepNum} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors shadow-2xs">
                            <div className="flex items-start gap-3.5">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                                    {step.stepNum}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${actorStyle}`}>
                                                {step.actor}
                                            </span>
                                            <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                                        </div>
                                        {step.statusBadge && (
                                            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                                                {step.statusBadge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>

                                    {step.branches && step.branches.length > 0 && (
                                        <div className={`mt-3 pt-3 border-t border-slate-100 grid gap-2.5 ${step.branches.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                            {step.branches.map((b, bIdx) => {
                                                const bStyle = branchStyles[b.type] || branchStyles.neutral
                                                return (
                                                    <div key={bIdx} className={`p-2.5 rounded-lg border ${bStyle.bg} ${bStyle.border} ${bStyle.text}`}>
                                                        <div className="flex items-center justify-between gap-1 mb-1">
                                                            <span className="font-bold text-xs">{b.label}</span>
                                                            {b.status && (
                                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${bStyle.badge}`}>
                                                                    {b.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs opacity-90 leading-relaxed">{b.text}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function LayersIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    )
}

function TagIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <path d="M7 7h.01" />
        </svg>
    )
}
