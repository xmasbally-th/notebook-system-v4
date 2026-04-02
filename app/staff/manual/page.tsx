'use client'

import StaffLayout from '@/components/staff/StaffLayout'
import Link from 'next/link'
import {
    LayoutDashboard, ClipboardList, CalendarPlus, RotateCcw,
    AlertTriangle, CheckCircle2, XCircle, Search, HelpCircle,
    ArrowRight, Clock, Users, FileText, Package
} from 'lucide-react'
import React from 'react'

export default function StaffManualPage() {
    return (
        <StaffLayout title="คู่มือการใช้งาน (สำหรับเจ้าหน้าที่)" subtitle="แนะนำการใช้งานระบบสำหรับเจ้าหน้าที่ปฏิบัติการ (Staff) — Notebook System V5">
            <div className="max-w-5xl mx-auto">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-6">
                        <div className="p-3 bg-white/20 rounded-xl hidden sm:block">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-3">ยินดีต้อนรับสู่ระบบปฏิบัติการเจ้าหน้าที่</h2>
                            <p className="text-teal-100 leading-relaxed text-lg">
                                คู่มือนี้ครอบคลุมหน้าที่หลักของ Staff ตั้งแต่การอนุมัติคำขอยืม,
                                การรับคืนอุปกรณ์, การจัดการการจอง ไปจนถึงการติดตามรายการค้างคืน
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role Note */}
                <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <strong>⚠️ สิทธิ์ของ Staff:</strong> จัดการคำขอยืม, รับคืนอุปกรณ์, จัดการการจอง — แต่ <strong>ไม่มีสิทธิ์</strong> จัดการผู้ใช้, เพิ่ม/ลบอุปกรณ์, ดูรายงาน หรือตั้งค่าระบบ
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
                                เมื่อเข้าสู่ <strong>Staff Panel</strong> หน้าแรกจะแสดงสถานะภาพรวมของระบบ
                                เพื่อให้เจ้าหน้าที่วางแผนการทำงานได้ทันที
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                                <FeatureItem
                                    title="คำขอรออนุมัติ"
                                    description="จำนวนคำขอใหม่ที่ต้องดำเนินการ — ตัวเลขสีแดงแสดงว่ามีงานรอ"
                                />
                                <FeatureItem
                                    title="อุปกรณ์ที่กำลังยืม"
                                    description="รายการอุปกรณ์ที่ออกไปแล้ว พร้อมวันที่ครบกำหนดคืน"
                                />
                                <FeatureItem
                                    title="รายการค้างคืน"
                                    description="อุปกรณ์ที่เลยกำหนดคืนแล้ว — ต้องติดตามผู้ยืมโดยด่วน"
                                />
                                <FeatureItem
                                    title="การจองวันนี้"
                                    description="การจองที่มีกำหนดรับ-คืนในวันนี้ เพื่อเตรียมอุปกรณ์ล่วงหน้า"
                                />
                            </ul>
                        </div>
                    </Section>

                    {/* Loans Management Section */}
                    <Section id="loans" title="2. การจัดการคำขอยืม (Loans)" icon={ClipboardList} color="indigo">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการคำขอยืม"</strong> เป็นส่วนที่ตรวจสอบและอนุมัติคำขอที่ผู้ใช้ส่งเข้ามา
                        </p>

                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 mb-6">
                            <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                ขั้นตอนการอนุมัติ
                            </h4>
                            <div className="space-y-3">
                                <Step number={1} text="ตรวจสอบรายละเอียดคำขอ: ผู้ยืม, อุปกรณ์, วันที่ยืม-คืน, เวลาคืน, เหตุผล" />
                                <Step number={2} text="ตรวจสอบสถานะอุปกรณ์ว่ายังคง 'ว่าง' หรือไม่" />
                                <Step number={3} text="กดปุ่ม 'อนุมัติ' (สีเขียว) หากข้อมูลถูกต้องและอุปกรณ์พร้อม" />
                                <Step number={4} text="หากต้องปฏิเสธ กด 'ปฏิเสธ' (สีแดง) และระบุเหตุผลให้ผู้ใช้ทราบ" />
                                <Step number={5} text="ระบบจะส่งการแจ้งเตือนให้ผู้ยืมอัตโนมัติหลังดำเนินการ" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <StatusCard status="pending" label="รออนุมัติ" desc="คำขอใหม่ที่ต้องดำเนินการ" />
                            <StatusCard status="approved" label="อนุมัติแล้ว" desc="รออุปกรณ์ออก / กำลังยืม" />
                            <StatusCard status="rejected" label="ปฏิเสธ" desc="คำขอที่ไม่ผ่านการพิจารณา" />
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
                            💡 <strong>Auto-Approve:</strong> เมื่อ Staff หรือ Admin ยืมเอง ระบบ<strong>อนุมัติอัตโนมัติทันที</strong> ไม่ต้องรอขั้นตอนนี้
                        </div>
                    </Section>

                    {/* Reservations Section */}
                    <Section id="reservations" title="3. การจัดการการจอง (Reservations)" icon={CalendarPlus} color="purple">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการการจอง"</strong> ใช้สำหรับดูและอนุมัติการจองล่วงหน้า
                        </p>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-4">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>ดูรายการจอง:</strong> แสดงรายการจองทั้งหมดพร้อมสถานะ (รออนุมัติ / อนุมัติแล้ว / ยกเลิก)
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>อนุมัติ:</strong> คลิกรายการ → คลิก "อนุมัติ" → ยืนยัน — ระบบแจ้งเตือนผู้จองอัตโนมัติ
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>ปฏิเสธ:</strong> คลิก "ปฏิเสธ" → ระบุเหตุผล (บังคับ) → ยืนยัน
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-800">
                            💡 Staff และ Admin ที่จองเอง จะได้รับการ<strong>อนุมัติอัตโนมัติ</strong> ไม่ต้องผ่านขั้นตอนนี้
                        </div>
                    </Section>

                    {/* Returns Section */}
                    <Section id="returns" title="4. การรับคืนอุปกรณ์ (Returns)" icon={RotateCcw} color="green">
                        <p className="mb-6 text-gray-600">
                            เมื่อผู้ใช้นำอุปกรณ์มาคืน ให้เข้าเมนู <strong>"รับคืนอุปกรณ์"</strong> และบันทึกทุกครั้ง
                        </p>

                        <div className="space-y-4 mb-6">
                            <ReturnStep number={1} title="ค้นหารายการ" desc="ค้นหาจากชื่อผู้ยืม หรือ Serial Number ของอุปกรณ์" />
                            <ReturnStep number={2} title="ตรวจสอบสภาพอุปกรณ์" desc="เช็คสภาพภายนอก, รอยเสียหาย, และความครบถ้วนของอุปกรณ์เสริม (สายชาร์จ, กระเป๋า ฯลฯ)" />
                            <ReturnStep number={3} title="บันทึกหมายเหตุ (ถ้ามีความเสียหาย)" desc="ระบุรายละเอียดความเสียหายในช่อง 'หมายเหตุ' ก่อนบันทึก" />
                            <ReturnStep number={4} title="ยืนยันการคืน" desc="กดปุ่ม 'บันทึกการคืน' → ระบบเปลี่ยนสถานะอุปกรณ์เป็น 'ว่าง' อัตโนมัติ และส่งแจ้งเตือน Discord" />
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
                            ⚠️ <strong>สำคัญ:</strong> ต้องบันทึกการคืนในระบบทุกครั้ง ไม่เช่นนั้นสถานะอุปกรณ์จะยังแสดงว่า "ถูกยืม" อยู่
                        </div>
                    </Section>

                    {/* Overdue Section */}
                    <Section id="overdue" title="5. รายการค้างคืน (Overdue)" icon={AlertTriangle} color="red">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"รายการค้างคืน"</strong> แสดงรายการที่เลยกำหนดส่งคืนแล้ว — ควรตรวจสอบทุกวัน
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    ข้อมูลที่แสดง
                                </h4>
                                <ul className="space-y-1 text-red-900/80 text-sm">
                                    <li>👤 ชื่อผู้ยืม และเบอร์ติดต่อ</li>
                                    <li>📦 อุปกรณ์ที่ค้างคืน</li>
                                    <li>📅 วันที่/เวลาที่ควรคืน</li>
                                    <li>⏰ จำนวนวัน/ชั่วโมงที่เกินกำหนด</li>
                                </ul>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3">สิ่งที่ควรทำ</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>ตรวจสอบรายการค้างคืนทุกวัน</li>
                                    <li>ติดต่อผู้ยืมโดยตรง (โทร / LINE / อีเมล)</li>
                                    <li>บันทึกหมายเหตุการติดต่อในระบบ</li>
                                    <li>เมื่อนำมาคืน → ไปที่ <strong>"รับคืนอุปกรณ์"</strong></li>
                                </ol>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Footer Help */}
                <div className="mt-16 text-center border-t border-gray-200 pt-10">
                    <p className="text-gray-500 mb-4">หากพบปัญหาการใช้งานหรือต้องการความช่วยเหลือเพิ่มเติม</p>
                    <p className="text-gray-400 text-sm">ติดต่อ Admin ผ่านระบบ หรือแจ้งโดยตรง — Notebook System V5 อัปเดตล่าสุด 2 เมษายน 2569</p>
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
    const bgColors: Record<string, string> = {
        blue: 'bg-blue-100',
        indigo: 'bg-indigo-100',
        purple: 'bg-purple-100',
        green: 'bg-green-100',
        red: 'bg-red-100',
    }

    return (
        <section id={id} className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${bgColors[color]}`}>
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
        <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold shrink-0 mt-0.5">
                {number}
            </span>
            <span className="text-indigo-900/80 text-sm leading-relaxed">{text}</span>
        </div>
    )
}

function ReturnStep({ number, title, desc }: { number: number; title: string; desc: string }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                {number}
            </div>
            <div>
                <h5 className="font-semibold text-gray-900">{title}</h5>
                <p className="text-sm text-gray-600">{desc}</p>
            </div>
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
