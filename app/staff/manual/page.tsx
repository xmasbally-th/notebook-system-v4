'use client'

import StaffLayout from '@/components/staff/StaffLayout'
import Link from 'next/link'
import {
    LayoutDashboard, ClipboardList, CalendarPlus, RotateCcw,
    AlertTriangle, CheckCircle2, XCircle, Search, HelpCircle,
    ArrowRight, Clock, Users, FileText
} from 'lucide-react'
import React from 'react'

export default function StaffManualPage() {
    return (
        <StaffLayout title="คู่มือการใช้งาน (สำหรับเจ้าหน้าที่)" subtitle="แนะนำการใช้งานระบบสำหรับผู้ดูแลและเจ้าหน้าที่">
            <div className="max-w-5xl mx-auto">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-6">
                        <div className="p-3 bg-white/20 rounded-xl hidden sm:block">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-3">ยินดีต้อนรับสู่ระบบจัดการอุปกรณ์</h2>
                            <p className="text-teal-100 leading-relaxed text-lg">
                                คู่มือนี้จะช่วยให้คุณเข้าใจการทำงานของระบบในส่วนของเจ้าหน้าที่ (Staff)
                                ตั้งแต่การจัดการคำขอยืม, การตรวจสอบการจอง, การรับคืนอุปกรณ์, ไปจนถึงการติดตามรายการค้างคืน
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Nav */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
                    <QuickNavLink href="#dashboard" icon={LayoutDashboard} label="Dashboard" color="blue" />
                    <QuickNavLink href="#loans" icon={ClipboardList} label="จัดการคำขอ" color="indigo" />
                    <QuickNavLink href="#reservations" icon={CalendarPlus} label="การจอง" color="purple" />
                    <QuickNavLink href="#returns" icon={RotateCcw} label="รับคืน" color="green" />
                    <QuickNavLink href="#overdue" icon={AlertTriangle} label="ค้างคืน" color="red" />
                </div>

                <div className="space-y-12">
                    {/* Dashboard Section */}
                    <Section id="dashboard" title="1. ภาพรวม (Dashboard)" icon={LayoutDashboard} color="blue">
                        <div className="prose max-w-none text-gray-600">
                            <p className="mb-4">
                                เมื่อเข้าสู่ระบบ หน้าแรกที่คุณจะพบคือ <strong>Dashboard</strong> ซึ่งแสดงสถานะภาพรวมของระบบในปัจจุบัน
                                เพื่อให้เจ้าหน้าที่วางแผนการทำงานได้ทันที
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                                <FeatureItem
                                    title="สถิติคำขอ"
                                    description="แสดงจำนวนคำขอที่ 'รออนุมัติ', 'กำลังยืม', และ 'เกินกำหนด' ในรูปแบบ Card ที่เข้าใจง่าย"
                                />
                                <FeatureItem
                                    title="กิจกรรมล่าสุด"
                                    description="รายการความเคลื่อนไหวล่าสุดในระบบ เช่น มีใครยืมอุปกรณ์อะไร หรือคืนเมื่อไหร่"
                                />
                                <FeatureItem
                                    title="เมนูลัด"
                                    description="ปุ่มกดเพื่อไปยังหน้างานต่างๆ ได้อย่างรวดเร็ว เช่น ไปหน้าจัดการคำขอ หรือหน้ารับคืน"
                                />
                            </ul>
                        </div>
                    </Section>

                    {/* Loans Management Section */}
                    <Section id="loans" title="2. การจัดการคำขอยืม (Loans)" icon={ClipboardList} color="indigo">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการคำขอยืม"</strong> เป็นส่วนที่เจ้าหน้าที่ใช้ตรวจสอบคำขอที่ผู้ใช้ส่งเข้ามา
                            โดยสามารถดำเนินการได้ดังนี้:
                        </p>

                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 mb-6">
                            <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                ขั้นตอนการอนุมัติ
                            </h4>
                            <div className="space-y-4">
                                <Step number={1} text="ตรวจสอบรายละเอียดคำขอ (ผู้ยืม, อุปกรณ์, วันที่ยืม-คืน, เหตุผล)" />
                                <Step number={2} text="ตรวจสอบสถานะอุปกรณ์ว่าพร้อมให้ยืมหรือไม่" />
                                <Step number={3} text="กดปุ่ม 'อนุมัติ' (สีเขียว) หากข้อมูลถูกต้อง หรือ 'ปฏิเสธ' (สีแดง) หากไม่สามารถให้ยืมได้" />
                                <Step number={4} text="หากปฏิเสธ ควรระบุเหตุผลให้ผู้ใช้ทราบด้วย" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatusCard status="pending" label="รออนุมัติ" desc="คำขอใหม่ที่ต้องดำเนินการตรวจสอบ" />
                            <StatusCard status="approved" label="อนุมัติแล้ว" desc="ผู้ได้รับอนุญาตให้ยืม (รอรับของ/กำลังยืม)" />
                            <StatusCard status="rejected" label="ปฏิเสธ" desc="คำขอที่ถูกไม่อนุมัติ" />
                        </div>
                    </Section>

                    {/* Reservations Section */}
                    <Section id="reservations" title="3. การจัดการการจอง (Reservations)" icon={CalendarPlus} color="purple">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการการจอง"</strong> ใช้สำหรับดูรายการจองล่วงหน้า ช่วยให้เจ้าหน้าที่เตรียมอุปกรณ์ให้พร้อม
                            เมื่อถึงกำหนดวันที่ผู้ใช้จะมารับ
                        </p>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-purple-500 mt-0.5" />
                                    <span>
                                        <strong>การจองล่วงหน้า:</strong> ผู้ใช้สามารถจองอุปกรณ์ล่วงหน้าได้ เจ้าหน้าที่ต้องคอยดูว่า
                                        ในแต่ละวันมีรายการจองอะไรบ้าง เพื่อกันอุปกรณ์ไว้
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5" />
                                    <span>
                                        <strong>การเปลี่ยนสถานะ:</strong> เมื่อผู้ใช้มารับอุปกรณ์ตามนัด ให้เจ้าหน้าที่ดำเนินการเปลี่ยนสถานะ
                                        จากการ 'จอง' เป็น 'กำลังยืม' (ในระบบอาจจะรวมอยู่ใน流程การอนุมัติ/รับของ)
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </Section>

                    {/* Returns Section */}
                    <Section id="returns" title="4. การรับคืนอุปกรณ์ (Returns)" icon={RotateCcw} color="green">
                        <p className="mb-6 text-gray-600">
                            เมื่อผู้ใช้นำอุปกรณ์มาคืน ให้เข้าเมนู <strong>"รับคืนอุปกรณ์"</strong> เพื่อบันทึกการคืน
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">1</div>
                                <div>
                                    <h5 className="font-semibold text-gray-900">ค้นหารายการ</h5>
                                    <p className="text-sm text-gray-600">ค้นหาจากชื่อผู้ยืม หรือรหัสครุภัณฑ์ (Serial No.)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">2</div>
                                <div>
                                    <h5 className="font-semibold text-gray-900">ตรวจสอบสภาพ</h5>
                                    <p className="text-sm text-gray-600">เช็คสภาพอุปกรณ์ว่าสมบูรณ์หรือไม่, อุปกรณ์เสริมครบไหม</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">3</div>
                                <div>
                                    <h5 className="font-semibold text-gray-900">ยืนยันการคืน</h5>
                                    <p className="text-sm text-gray-600">กดปุ่ม "รับคืน" ระบบจะบันทึกเวลาคืนและเปลี่ยนสถานะอุปกรณ์เป็น "ว่าง" พร้อมให้ยืมต่อ</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Overdue Section */}
                    <Section id="overdue" title="5. รายการค้างคืน (Overdue)" icon={AlertTriangle} color="red">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"รายการค้างคืน"</strong> แสดงรายการที่เลยกำหนดส่งคืนแล้ว
                            เจ้าหน้าที่ควรตรวจสอบหน้านี้เป็นประจำ
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    สิ่งที่ต้องทำ
                                </h4>
                                <ul className="list-disc list-inside space-y-2 text-red-900/80 text-sm">
                                    <li>ตรวจสอบรายชื่อผู้ที่ยังไม่คืนอุปกรณ์</li>
                                    <li>ติดต่อผู้ยืมเพื่อแจ้งเตือน (โทรศัพท์, อีเมล, หรือแจ้งผ่านไลน์)</li>
                                    <li>หากอุปกรณ์สูญหาย ให้ดำเนินการตามระเบียบขององค์กร</li>
                                </ul>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3">การคำนวณค่าปรับ (ถ้ามี)</h4>
                                <p className="text-sm text-gray-600">
                                    ระบบจะแสดงจำนวนวันที่เกินกำหนดให้ทราบ เพื่อใช้ประกอบการพิจารณาบทลงโทษหรือค่าปรับตามนโยบาย
                                </p>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Footer Help */}
                <div className="mt-16 text-center border-t border-gray-200 pt-10">
                    <p className="text-gray-500 mb-4">หากพบปัญหาการใช้งานระบบ หรือต้องการความช่วยเหลือเพิ่มเติม</p>
                    <a href="mailto:admin@example.com" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                        <Users className="w-5 h-5" />
                        ติดต่อผู้ดูแลระบบ (Admin)
                    </a>
                </div>
            </div>
        </StaffLayout>
    )
}

function QuickNavLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
        indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
        green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
        red: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
    }

    return (
        <a href={href} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">{label}</span>
        </a>
    )
}

function Section({ id, title, icon: Icon, children, color }: { id: string; title: string; icon: any; children: React.ReactNode; color: string }) {
    const headerColors: Record<string, string> = {
        blue: 'text-blue-700',
        indigo: 'text-indigo-700',
        purple: 'text-purple-700',
        green: 'text-green-700',
        red: 'text-red-700',
    }

    return (
        <section id={id} className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <Icon className={`w-6 h-6 ${headerColors[color]}`} />
                </div>
                <h3 className={`text-xl font-bold ${headerColors[color]}`}>{title}</h3>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                {children}
            </div>
        </section>
    )
}

function FeatureItem({ title, description }: { title: string; description: string }) {
    return (
        <li className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 shrink-0" />
            <div>
                <strong className="block text-gray-900 mb-1">{title}</strong>
                <span className="text-sm text-gray-600">{description}</span>
            </div>
        </li>
    )
}

function Step({ number, text }: { number: number; text: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold shrink-0">
                {number}
            </span>
            <span className="text-indigo-900/80 text-sm">{text}</span>
        </div>
    )
}

function StatusCard({ status, label, desc }: { status: string; label: string; desc: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        approved: 'bg-green-50 border-green-200 text-green-800',
        rejected: 'bg-red-50 border-red-200 text-red-800',
    }

    return (
        <div className={`p-4 rounded-xl border ${styles[status]}`}>
            <span className="block font-bold mb-1">{label}</span>
            <span className="text-xs opacity-80">{desc}</span>
        </div>
    )
}
