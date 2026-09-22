'use client'

import StaffPageHeader from '@/components/staff/StaffPageHeader'
import Link from 'next/link'
import {
    Activity, Box, UserPlus, Edit, FileStack,
    LayoutDashboard, ClipboardList, CalendarPlus, RotateCcw,
    AlertTriangle, CheckCircle2, XCircle, Search, HelpCircle,
    ArrowRight, Clock, Users, FileText, Package, Printer,
    QrCode, UserCheck, ShieldCheck, Check, Sparkles, AlertCircle,
    Camera, Smartphone, Send, Bell
} from 'lucide-react'
import React, { useState } from 'react'
import { VisualFlowchart } from '@/components/ui/visual-flowchart'

export default function StaffManualPage() {
    const [activeStaffWorkflow, setActiveStaffWorkflow] = useState<'counter' | 'approvals' | 'returns' | 'users' | 'overdue'>('counter')

    return (
        <div className="space-y-6">
            <div className="print-hidden">
                <StaffPageHeader
                    title="คู่มือการใช้งาน (สำหรับเจ้าหน้าที่ปฏิบัติการ)"
                    subtitle="แนะนำการใช้งานระบบทุกฟังก์ชันสำหรับเจ้าหน้าที่ (Staff) — Notebook System V5"
                />
            </div>

            <div className="max-w-5xl mx-auto">
                {/* Introduction Banner */}
                <div className="manual-header-banner bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-5">
                        <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 hidden sm:block shadow-inner shrink-0">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2.5 w-full">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/40 text-teal-100 text-xs font-medium border border-teal-400/30 mb-1">
                                        <Sparkles className="w-3 h-3" /> Staff Operations Guide
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">คู่มือปฏิบัติการสำหรับเจ้าหน้าที่ (Staff)</h2>
                                </div>
                                <button
                                    onClick={() => window.print()}
                                    className="print-hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/25 backdrop-blur-sm self-start sm:self-auto text-sm font-medium shadow-sm active:scale-95"
                                >
                                    <Printer className="w-4 h-4" />
                                    พิมพ์ / Export PDF
                                </button>
                            </div>
                            <p className="text-teal-100 leading-relaxed text-sm sm:text-base max-w-3xl">
                                คู่มือนี้รวบรวมหน้าที่หลักของเจ้าหน้าที่ปฏิบัติการ ได้แก่ การให้บริการยืม-คืนด่วนหน้าเคาน์เตอร์,
                                การอนุมัติผู้ใช้งานใหม่, การอนุมัติคำขอยืม-การจอง, การตรวจสภาพอุปกรณ์เมื่อรับคืน และการติดตามอุปกรณ์ค้างคืน
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role & Permissions Note */}
                <div className="mb-8 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                        <div className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                            <strong className="font-bold text-emerald-950">ขอบเขตสิทธิ์ของเจ้าหน้าที่ (Staff Permissions):</strong>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                    ✅ <strong>จุดบริการเคาน์เตอร์:</strong> สแกน/คีย์รหัสยืม-คืนด่วน
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                    ✅ <strong>อนุมัติผู้ใช้งาน:</strong> ตรวจสอบและอนุมัติบัญชีใหม่
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                    ✅ <strong>จัดการคำขอยืม:</strong> อนุมัติ/ปฏิเสธ (รองรับ Bulk)
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                    ✅ <strong>จัดการการจอง:</strong> อนุมัติและจัดเตรียมเครื่องพร้อมจ่าย
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                    ✅ <strong>รับคืน & ตรวจสภาพ:</strong> บันทึกสภาพสมบูรณ์/ชำรุด/ขาด
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    🔒 <em>สงวนสิทธิ์ Admin: เพิ่ม/ลบอุปกรณ์, ตั้งค่าระบบ, ลบฐานข้อมูล</em>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mb-10 text-center print-hidden">
                    <QuickNavLink href="#dashboard" icon={LayoutDashboard} label="Dashboard" color="blue" />
                    <QuickNavLink href="#counter" icon={QrCode} label="เคาน์เตอร์บริการ" color="teal" />
                    <QuickNavLink href="#users" icon={UserCheck} label="อนุมัติผู้ใช้" color="green" />
                    <QuickNavLink href="#loans" icon={ClipboardList} label="คำขอยืม" color="indigo" />
                    <QuickNavLink href="#reservations" icon={CalendarPlus} label="การจอง" color="purple" />
                    <QuickNavLink href="#returns" icon={RotateCcw} label="รับคืนอุปกรณ์" color="amber" />
                    <QuickNavLink href="#overdue" icon={AlertTriangle} label="รายการค้างคืน" color="red" />
                </div>

                {/* Content Sections */}
                <div className="space-y-10">
                    {/* 1. Dashboard */}
                    <Section id="dashboard" title="1. ภาพรวมระบบ (Staff Dashboard)" icon={LayoutDashboard} color="blue">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            หน้าแรกของ <strong>Staff Panel (`/staff`)</strong> ออกแบบมาเพื่อให้เจ้าหน้าที่เห็นภาระงานเร่งด่วนในแต่ละวันได้ทันที:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                            <DashboardStatCard
                                title="คำขอรออนุมัติ"
                                desc="คำขอยืมใหม่ที่ส่งเข้ามา ต้องตรวจสอบและอนุมัติก่อนจ่ายเครื่อง"
                                color="border-amber-200 bg-amber-50/60 text-amber-800"
                            />
                            <DashboardStatCard
                                title="กำลังยืมใช้งาน"
                                desc="จำนวนอุปกรณ์ที่อยู่ระหว่างการยืม พร้อมระบุวันครบกำหนดส่งคืน"
                                color="border-blue-200 bg-blue-50/60 text-blue-800"
                            />
                            <DashboardStatCard
                                title="รายการค้างคืน"
                                desc="อุปกรณ์ที่เลยกำหนดส่งคืนแล้ว ต้องเร่งรัดติดต่อผู้ยืมทันที"
                                color="border-rose-200 bg-rose-50/60 text-rose-800"
                            />
                            <DashboardStatCard
                                title="การจองวันนี้"
                                desc="รายการจองล่วงหน้าที่มีกำหนดรับเครื่องในวันนี้ เพื่อจัดเตรียมล่วงหน้า"
                                color="border-purple-200 bg-purple-50/60 text-purple-800"
                            />
                        </div>
                        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            💡 ข้อมูลบน Dashboard มีระบบ Real-time Cache Refresh เมื่อมีการกระทำจากผู้ใช้หรือเจ้าหน้าที่อื่น หน้าจอจะอัปเดตตัวเลขโดยอัตโนมัติ
                        </div>
                    </Section>

                    {/* 2. Counter Service (NEW & CRITICAL) */}
                    <Section id="counter" title="2. จุดบริการเคาน์เตอร์ (Counter Service & Quick Lookup)" icon={QrCode} color="teal">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จุดบริการเคาน์เตอร์ (`/staff/counter`)"</strong> คือเครื่องมืออำนวยความสะดวกสูงสุดสำหรับการทำงานหน้าเคาน์เตอร์
                            ช่วยให้เจ้าหน้าที่ทำงานได้อย่างรวดเร็ว ไม่ต้องค้นหาจากตารางยาวๆ:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div className="bg-teal-50/60 border border-teal-200 p-4 rounded-xl">
                                <h4 className="font-bold text-teal-950 text-sm mb-2 flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-teal-600" />
                                    การค้นหาด้วยการสแกนหรือพิมพ์รหัส
                                </h4>
                                <ul className="text-xs text-teal-800 space-y-1.5 list-disc list-inside">
                                    <li>กดปุ่ม <strong>"สแกน QR / Barcode"</strong> เพื่อใช้กล้องสแกนจากตัวเครื่อง</li>
                                    <li>หรือพิมพ์ <strong>หมายเลขครุภัณฑ์ / รหัสอุปกรณ์ / Serial Number</strong> ลงในช่องค้นหาด่วน</li>
                                    <li>ระบบจะค้นหาและตรวจสอบสถานะของอุปกรณ์นั้นทันทีใน 1 วินาที</li>
                                </ul>
                            </div>

                            <div className="bg-white border border-slate-200 p-4 rounded-xl">
                                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    การทำงานอัตโนมัติตามสถานะอุปกรณ์
                                </h4>
                                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                                    <li><strong>หากเครื่องมีสถานะ 'ว่าง':</strong> ระบบจะเปิดหน้าต่าง <em>"ยืมด่วนหน้าเคาน์เตอร์ (Fast Borrow)"</em> ให้เลือกผู้ยืมและจ่ายเครื่องทันที</li>
                                    <li><strong>หากเครื่องมีสถานะ 'กำลังยืม':</strong> ระบบจะเปิดหน้าต่าง <em>"รับคืนด่วน (Fast Return)"</em> เพื่อตรวจสภาพและบันทึกรับคืนทันที</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                            <strong>ขั้นตอนแนะนำ:</strong> เมื่อผู้ใช้นำเครื่องมาคืนที่เคาน์เตอร์ เพียงยิงบาร์โค้ดหรือพิมพ์รหัสเครื่อง ระบบจะดึงข้อมูลผู้ยืมขึ้นมาอัตโนมัติ เจ้าหน้าที่เพียงตรวจสภาพเครื่องและกด "ยืนยันรับคืน" ก็เสร็จสิ้นทันที
                        </div>
                    </Section>

                    {/* 3. User Approval (NEW & CRITICAL) */}
                    <Section id="users" title="3. การอนุมัติผู้ใช้งานใหม่ (User Approval)" icon={UserCheck} color="green">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"อนุมัติผู้ใช้งาน (`/staff/users`)"</strong> เจ้าหน้าที่มีสิทธิ์ตรวจสอบผู้ลงทะเบียนใหม่และอนุมัติให้เข้าใช้งานระบบ:
                        </p>

                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 mb-4">
                            <h4 className="font-bold text-emerald-950 text-sm mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ขั้นตอนการตรวจสอบและอนุมัติบัญชี
                            </h4>
                            <div className="space-y-2.5 text-xs text-emerald-900">
                                <StepInline num={1} text="คลิกแท็บ 'รอการอนุมัติ (Pending)' เพื่อดูรายชื่อผู้ใช้ที่เพิ่งลงทะเบียน" />
                                <StepInline num={2} text="ตรวจสอบความถูกต้องของ: ชื่อ-นามสกุล, รหัสนักศึกษา/บุคลากร, คณะ/สาขา, เบอร์โทรศัพท์" />
                                <StepInline num={3} text="กดปุ่ม 'อนุมัติ (Approve)' สีเขียว เพื่อเปิดสิทธิ์การใช้งาน — ผู้ใช้จะได้รับแจ้งเตือนและสามารถยืมอุปกรณ์ได้ทันที" />
                                <StepInline num={4} text="หากข้อมูลไม่ถูกต้อง ให้กด 'ปฏิเสธ (Reject)' เพื่อไม่อนุมัติบัญชีนั้น" />
                            </div>
                        </div>
                    </Section>

                    {/* 4. Loan Requests Management */}
                    <Section id="loans" title="4. การจัดการคำขอยืม (Loans Management)" icon={ClipboardList} color="indigo">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จัดการคำขอยืม (`/staff/loans`)"</strong> ใช้สำหรับตรวจสอบและอนุมัติคำขอที่ผู้ใช้ส่งมาจากหน้าเว็บ:
                        </p>

                        <div className="space-y-3 mb-5">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <h4 className="font-bold text-slate-800 text-sm mb-2">ขั้นตอนการอนุมัติคำขอ:</h4>
                                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                                    <li>ตรวจสอบข้อมูล: ผู้ยืม, อุปกรณ์ที่ขอ, วันที่ยืม-คืน, เวลาคืน และวัตถุประสงค์</li>
                                    <li>ตรวจเช็คว่าอุปกรณ์เครื่องนั้นยังมีสภาพสมบูรณ์และพร้อมจ่ายหรือไม่</li>
                                    <li>คลิก <strong>"อนุมัติ (Approve)"</strong> — ระบบจะเปลี่ยนสถานะเป็นอนุมัติ และส่งแจ้งเตือนหาผู้ยืม</li>
                                    <li>หากต้องไม่อนุมัติ ให้คลิก <strong>"ปฏิเสธ (Reject)"</strong> และ <u>จำเป็นต้องระบุเหตุผล</u> ให้ผู้ยืมทราบ</li>
                                </ol>
                            </div>

                            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                                <h4 className="font-bold text-indigo-950 text-sm mb-1.5 flex items-center gap-2">
                                    <Check className="w-4 h-4 text-indigo-600" />
                                    ฟังก์ชันอนุมัติหลายรายการพร้อมกัน (Bulk Approve)
                                </h4>
                                <p className="text-xs text-indigo-900 leading-relaxed">
                                    ในกรณีที่มีคำขอเข้ามาเป็นจำนวนมาก เจ้าหน้าที่สามารถติ๊กเลือกเช็คบ็อกซ์หน้ารายการที่ต้องการ แล้วคลิกปุ่ม <strong>"อนุมัติที่เลือก"</strong> ด้านบนตาราง เพื่ออนุมัติทั้งหมดในคลิกเดียว
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                            💡 <strong>Auto-Approve:</strong> หากเจ้าหน้าที่ (Staff) หรือ Admin เป็นผู้ส่งคำขอยืมของตนเอง ระบบจะทำการ<strong>อนุมัติอัตโนมัติทันที</strong>โดยไม่ต้องรอขั้นตอนตรวจสอบ
                        </div>
                    </Section>

                    {/* 5. Reservations Management */}
                    <Section id="reservations" title="5. การจัดการการจองล่วงหน้า (Reservations)" icon={CalendarPlus} color="purple">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จัดการการจอง (`/staff/reservations`)"</strong> ใช้สำหรับตรวจสอบคิวการจองอุปกรณ์ในอนาคต:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <ReservationActionCard
                                title="1. อนุมัติการจอง"
                                desc="ตรวจสอบช่วงวันเวลาว่าไม่มีการซ้อนทับ แล้วกดยืนยันการจอง สถานะจะเปลี่ยนเป็น 'จองสำเร็จ'"
                                badge="Approved"
                                badgeColor="bg-blue-100 text-blue-800"
                            />
                            <ReservationActionCard
                                title="2. เตรียมเครื่องพร้อมรับ"
                                desc="เมื่อถึงวันนัดหมาย ให้จัดเตรียมอุปกรณ์และปรับสถานะเป็น 'พร้อมรับ' เพื่อแจ้งเตือนผู้จอง"
                                badge="Ready"
                                badgeColor="bg-emerald-100 text-emerald-800"
                            />
                            <ReservationActionCard
                                title="3. ส่งมอบ & แปลงเป็นการยืม"
                                desc="เมื่อผู้จองมารับเครื่อง ให้กดยืนยันส่งมอบ ระบบจะแปลงรายการจองเป็นการยืมใช้งานจริงทันที"
                                badge="Completed"
                                badgeColor="bg-indigo-100 text-indigo-800"
                            />
                        </div>
                    </Section>

                    {/* 6. Returns & Inspection */}
                    <Section id="returns" title="6. การรับคืนอุปกรณ์และตรวจสภาพ (Returns & Condition Inspection)" icon={RotateCcw} color="amber">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมื่อผู้ใช้นำอุปกรณ์มาส่งคืน ให้เข้าเมนู <strong>"รับคืนอุปกรณ์ (`/staff/returns`)"</strong> หรือใช้จุดบริการเคาน์เตอร์:
                        </p>

                        <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-xl mb-4">
                            <h4 className="font-bold text-amber-950 text-sm mb-3">
                                🔍 การตรวจสภาพอุปกรณ์ 3 ระดับ (Condition Check):
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-white rounded-lg border border-emerald-200">
                                    <span className="font-bold text-emerald-800 block mb-1">🟢 สภาพสมบูรณ์ (Good)</span>
                                    <p className="text-slate-600">ตัวเครื่อง อุปกรณ์เสริมครบ ใช้งานได้ปกติ อุปกรณ์จะกลับสู่สถานะ 'ว่าง' ทันที</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-amber-200">
                                    <span className="font-bold text-amber-800 block mb-1">🟡 ชำรุดเสียหาย (Damaged)</span>
                                    <p className="text-slate-600">มีรอยแตก จอเสีย ปุ่มหลุด ต้องกรอกรายละเอียดความเสียหายในช่องหมายเหตุ</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-rose-200">
                                    <span className="font-bold text-rose-800 block mb-1">🔴 อุปกรณ์เสริมไม่ครบ (Missing)</span>
                                    <p className="text-slate-600">ขาดสายชาร์จ กระเป๋า อะแดปเตอร์ ต้องบันทึกว่าขาดรายการใดเพื่อติดตาม</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                            ⚠️ <strong>สำคัญมาก:</strong> ต้องกดบันทึกการคืนในระบบทุกครั้ง ไม่รับคืนเฉพาะเครื่องโดยไม่กดในระบบ เพราะสถานะจะยังค้างเป็น 'กำลังยืม' และทำให้ระบบแจ้งเตือนค้างคืนแก่ผู้ใช้
                        </div>
                    </Section>

                    {/* 7. Overdue Items */}
                    <Section id="overdue" title="7. รายการค้างคืน (Overdue Management)" icon={AlertTriangle} color="red">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"รายการค้างคืน (`/staff/overdue`)"</strong> รวบรวมอุปกรณ์ทั้งหมดที่เลยกำหนดส่งคืนแล้ว เจ้าหน้าที่ควรเข้ามาตรวจสอบทุกวัน:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                                <h4 className="font-bold text-rose-950 text-sm mb-2">ข้อมูลที่ระบบแสดง</h4>
                                <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside">
                                    <li>ชื่อ-นามสกุล และเบอร์โทรศัพท์ของผู้ยืม</li>
                                    <li>ชื่ออุปกรณ์และหมายเลขครุภัณฑ์</li>
                                    <li>วันที่และเวลาที่ครบกำหนดส่งคืน</li>
                                    <li>จำนวนวันและชั่วโมงที่เกินกำหนดส่งคืน (Overdue Time)</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <h4 className="font-bold text-slate-900 text-sm mb-2">แนวทางการดำเนินงานของเจ้าหน้าที่</h4>
                                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                                    <li>ติดต่อผู้ยืมโดยตรงผ่านทางเบอร์โทรศัพท์ หรือข้อความ</li>
                                    <li>ตรวจสอบเหตุผลและนัดหมายเวลาส่งคืนใหม่</li>
                                    <li>หากผู้ใช้นำมาคืน ให้ไปที่เมนู <strong>"รับคืนอุปกรณ์"</strong> เพื่อปลดสถานะค้างคืน</li>
                                </ol>
                            </div>
                        </div>
                    </Section>

                    {/* 8. Staff Workflows */}
                    <Section id="workflows" title="8. แผนผังขั้นตอนการทำงานของเจ้าหน้าที่ (Staff Workflows)" icon={Activity} color="teal">
                        <div className="space-y-6">
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                                แผนผังขั้นตอนการปฏิบัติงานจริงของเจ้าหน้าที่ (Staff Operations) ในระบบ Notebook System V5 แสดงขั้นตอนการบริการ จุดตรวจเช็ค และ <strong>จุดแยกตัดสินใจ (Decision Branches)</strong> ทั้งหมด:
                            </p>

                            {/* Touch-friendly Workflow Tabs */}
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-slate-100 print-hidden">
                                <button
                                    onClick={() => setActiveStaffWorkflow('counter')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeStaffWorkflow === 'counter' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>บริการด่วน (Fast Counter)</span>
                                </button>
                                <button
                                    onClick={() => setActiveStaffWorkflow('approvals')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeStaffWorkflow === 'approvals' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>อนุมัติคำขอยืม & จอง (Approvals)</span>
                                </button>
                                <button
                                    onClick={() => setActiveStaffWorkflow('returns')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeStaffWorkflow === 'returns' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>รับคืน & ตรวจสภาพ (Returns)</span>
                                </button>
                                <button
                                    onClick={() => setActiveStaffWorkflow('users')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeStaffWorkflow === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>อนุมัติผู้ใช้ใหม่ (Onboarding)</span>
                                </button>
                                <button
                                    onClick={() => setActiveStaffWorkflow('overdue')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeStaffWorkflow === 'overdue' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>ติดตามค้างคืน (Overdue)</span>
                                </button>
                            </div>

                            {/* Workflow 1: Fast Counter */}
                            <div className={`space-y-5 animate-fadeIn ${activeStaffWorkflow === 'counter' ? 'block' : 'hidden print:block print:mt-8'}`}>
                                <WorkflowMetaBar
                                    title="ขั้นตอนการให้บริการด่วนหน้าเคาน์เตอร์ (Fast Counter Service Flow)"
                                    actors="👮‍♂️ Staff เคาน์เตอร์, 👤 ผู้รับบริการ, 🤖 ระบบ Fast Search"
                                    channels="In-App Sound Feedback, Real-time Database Sync"
                                />
                                <VisualFlowchart
                                    startLabel="จุดเริ่มต้น: เจ้าหน้าที่เปิดสถานี Fast Counter"
                                    endLabel="สิ้นสุด: ทำรายการเคาน์เตอร์สำเร็จ & ข้อมูล Sync ทันที"
                                    steps={[
                                        {
                                            stepNum: 1,
                                            actor: '👮‍♂️ Staff เคาน์เตอร์',
                                            actorRole: 'counter',
                                            title: 'เปิดสถานี Fast Counter (/staff/counter)',
                                            desc: 'เข้าสู่หน้าจอ Fast Counter เตรียมเครื่องยิงสแกนเนอร์ หรือเปิดกล้องเว็บแคม/มือถือ',
                                        },
                                        {
                                            stepNum: 2,
                                            actor: '👮‍♂️ Staff เคาน์เตอร์',
                                            actorRole: 'counter',
                                            title: 'สแกน QR Code หรือพิมพ์รหัสครุภัณฑ์',
                                            desc: 'ระบบจะค้นหาและดึงข้อมูลอุปกรณ์พร้อมสถานะปัจจุบันขึ้นมาอัตโนมัติภายใน 1 วินาที',
                                            statusBadge: '⚡ Fast Lookup',
                                        },
                                        {
                                            stepNum: 3,
                                            actor: '🤖 ระบบตรวจสอบสถานะ',
                                            actorRole: 'system',
                                            title: 'วิเคราะห์สถานะอัตโนมัติ (Intelligent Routing)',
                                            desc: 'ระบบสลับโหมดการทำงานให้อัตโนมัติตามสถานะจริงของอุปกรณ์:',
                                            branches: [
                                                {
                                                    type: 'success',
                                                    label: '🟢 หากสถานะ "ว่าง (available)"',
                                                    text: 'สลับเข้าสู่โหมด "จ่ายเครื่องด่วน" -> ค้นหาชื่อผู้รับบริการ หรือสแกนบัตร -> บันทึกการยืมทันที',
                                                    status: '🔵 borrowed',
                                                },
                                                {
                                                    type: 'special',
                                                    label: '🔵 หากสถานะ "ถูกยืม (borrowed)"',
                                                    text: 'สลับเข้าสู่โหมด "รับคืนด่วน" -> แสดงชื่อผู้ยืมและปุ่มตรวจสภาพ 3 ระดับทันที',
                                                    status: '⚪ returned',
                                                },
                                                {
                                                    type: 'alert',
                                                    label: '🟣 หากมีคิว "จองล่วงหน้า"',
                                                    text: 'ตรวจสอบสิทธิ์ผู้จองตรงรอบเวลา -> กดส่งมอบอุปกรณ์ให้ผู้จองทันที',
                                                    status: '🟢 completed',
                                                },
                                            ],
                                        },
                                        {
                                            stepNum: 4,
                                            actor: '👮‍♂️ Staff เคาน์เตอร์',
                                            actorRole: 'counter',
                                            title: 'ส่งมอบหรือจัดเก็บอุปกรณ์เข้าตู้',
                                            desc: 'ส่งมอบเครื่องพร้อมอะแดปเตอร์ให้ผู้รับบริการ หรือเก็บเข้าช่องพร้อมให้บริการต่อไป',
                                        },
                                    ]}
                                />
                            </div>

                            {/* Workflow 2: Approvals (Loans & Reservations) */}
                            <div className={`space-y-5 animate-fadeIn ${activeStaffWorkflow === 'approvals' ? 'block' : 'hidden print:block print:mt-8'}`}>
                                <WorkflowMetaBar
                                    title="วงจรการพิจารณาอนุมัติคำขอยืมและการจอง (Approvals Workflow)"
                                    actors="👤 ผู้ส่งคำขอ (User), 👮‍♂️ เจ้าหน้าที่ (Staff), 🤖 WeLPRU Push"
                                    channels="Discord Notification Webhook, WeLPRU Mobile Push Notification"
                                />
                                <VisualFlowchart
                                    startLabel="จุดเริ่มต้น: คำขอใหม่เข้าระบบ (Pending Request)"
                                    endLabel="สิ้นสุด: ส่งมอบอุปกรณ์หรือยกเลิกคำขอเสร็จสิ้น"
                                    steps={[
                                        {
                                            stepNum: 1,
                                            actor: '👤 ผู้ใช้งาน',
                                            actorRole: 'user',
                                            title: 'ยื่นคำขอยืมหรือจองผ่านหน้าเว็บ',
                                            desc: 'เลือกอุปกรณ์ วัตถุประสงค์ และช่วงวันที่ต้องการใช้งาน -> ส่งคำขอเข้าระบบ',
                                            statusBadge: '🟡 รออนุมัติ (pending)',
                                        },
                                        {
                                            stepNum: 2,
                                            actor: '👮‍♂️ Staff',
                                            actorRole: 'staff',
                                            title: 'ตรวจสอบข้อมูลในหน้า /staff/loans หรือ /staff/reservations',
                                            desc: 'เช็คประวัติการใช้งาน ความถูกต้องของเหตุผล และสถานะความพร้อมของอุปกรณ์',
                                            branches: [
                                                {
                                                    type: 'success',
                                                    label: '⚡ มีสิทธิ์ Auto-Approve',
                                                    text: 'กรณีเจ้าหน้าที่ยืมเอง หรือได้รับสิทธิ์ยกเว้น -> ระบบอนุมัติทันทีโดยไม่ต้องรอ',
                                                    status: '🟢 approved',
                                                },
                                            ],
                                        },
                                        {
                                            stepNum: 3,
                                            actor: '👮‍♂️ Staff',
                                            actorRole: 'staff',
                                            title: 'พิจารณาตัดสินใจ (Decision Point)',
                                            desc: 'กดปุ่มเพื่อดำเนินการตามผลการพิจารณา:',
                                            branches: [
                                                {
                                                    type: 'success',
                                                    label: '🟢 อนุมัติ (Approve)',
                                                    text: 'ระบบเปลี่ยนสถานะเป็น Approved และส่งแจ้งเตือน WeLPRU นัดหมายให้มารับเครื่องที่เคาน์เตอร์',
                                                    status: '🟢 approved',
                                                },
                                                {
                                                    type: 'danger',
                                                    label: '🔴 ปฏิเสธ (Reject)',
                                                    text: 'เจ้าหน้าที่ต้องระบุเหตุผลในการไม่อนุมัติ -> ระบบส่งแจ้งเตือนผู้ใช้พร้อมเหตุผล -> จบกระบวนการ',
                                                    status: '🔴 rejected',
                                                },
                                            ],
                                        },
                                        {
                                            stepNum: 4,
                                            actor: '👮‍♂️ Staff เคาน์เตอร์',
                                            actorRole: 'counter',
                                            title: 'จ่ายเครื่องจริงเมื่อผู้ขอมารับ',
                                            desc: 'ตรวจสอบตัวตน -> ตรวจสภาพตัวเครื่องร่วมกัน -> กด "ยืนยันส่งมอบ" -> ปรับสถานะเป็น "กำลังยืม"',
                                            statusBadge: '🔵 กำลังยืม (borrowed)',
                                        },
                                    ]}
                                />
                            </div>

                            {/* Workflow 3: Returns & Condition Check */}
                            <div className={`space-y-5 animate-fadeIn ${activeStaffWorkflow === 'returns' ? 'block' : 'hidden print:block print:mt-8'}`}>
                                <WorkflowMetaBar
                                    title="วงจรการรับคืนและตรวจสภาพอุปกรณ์ 3 ระดับ (Inspection & Condition Workflow)"
                                    actors="👮‍♂️ เจ้าหน้าที่ (Staff), 👤 ผู้ส่งคืน (User)"
                                    channels="WeLPRU Notification, In-App 5-Star Evaluation, Audit Log"
                                />
                                <VisualFlowchart
                                    startLabel="จุดเริ่มต้น: ผู้ใช้นำอุปกรณ์มาส่งคืนที่เคาน์เตอร์"
                                    endLabel="สิ้นสุด: บันทึกรับคืนสำเร็จ & ส่งลิงก์ประเมินความพึงพอใจ"
                                    steps={[
                                        {
                                            stepNum: 1,
                                            actor: '👤 ผู้ใช้ + 👮‍♂️ Staff',
                                            actorRole: 'counter',
                                            title: 'รับอุปกรณ์ที่เคาน์เตอร์บริการ',
                                            desc: 'รับตัวเครื่อง โน้ตบุ๊ค อะแดปเตอร์สายชาร์จ และกระเป๋า ค้นหาคำขอยืมในระบบ',
                                            statusBadge: '🔵 กำลังยืม (borrowed)',
                                        },
                                        {
                                            stepNum: 2,
                                            actor: '👮‍♂️ Staff',
                                            actorRole: 'staff',
                                            title: 'ตรวจเช็คสภาพเครื่องและอุปกรณ์เสริม 3 ระดับ',
                                            desc: 'เจ้าหน้าที่ตรวจสอบสภาพจริงและเลือกผลการตรวจ 3 ระดับ:',
                                            branches: [
                                                {
                                                    type: 'success',
                                                    label: '🟢 สมบูรณ์ 100% (Normal)',
                                                    text: 'ตัวเครื่องและอุปกรณ์ครบถ้วน ทำงานได้ปกติ -> ปรับสถานะเป็น "ว่าง (available)" ทันที',
                                                    status: '🟢 available',
                                                },
                                                {
                                                    type: 'alert',
                                                    label: '🟡 ชำรุด (Damaged)',
                                                    text: 'จอแตก, บอดี้มีรอยบุบ, แป้นพิมพ์เสียหาย -> แนบรูปถ่ายสภาพ -> ส่งต่อซ่อมบำรุง',
                                                    status: '🟡 maintenance',
                                                },
                                                {
                                                    type: 'danger',
                                                    label: '🔴 อุปกรณ์ขาด / สูญหาย (Lost Items)',
                                                    text: 'สายชาร์จไม่ครบ, หายทั้งชุด -> บันทึกหมายเหตุ ติดตามชดใช้ตามระเบียบ',
                                                    status: '🔴 missing items',
                                                },
                                            ],
                                        },
                                        {
                                            stepNum: 3,
                                            actor: '👮‍♂️ Staff เคาน์เตอร์',
                                            actorRole: 'counter',
                                            title: 'กดยืนยันการรับคืน (Confirm Return)',
                                            desc: 'บันทึกวัน-เวลาที่ส่งคืนจริง และบันทึกหมายเหตุสภาพเครื่องลงในระบบ',
                                            statusBadge: '⚪ คืนแล้ว (returned)',
                                        },
                                        {
                                            stepNum: 4,
                                            actor: '👤 ผู้ใช้งาน',
                                            actorRole: 'user',
                                            title: 'ประเมินความพึงพอใจ 5 ดาว',
                                            desc: 'ผู้ใช้งานได้รับแจ้งเตือนให้ทำแบบประเมินความพึงพอใจ เพื่อนำข้อมูลไปปรับปรุงคุณภาพบริการ',
                                            statusBadge: '⭐ Rated',
                                        },
                                    ]}
                                />
                            </div>

                            {/* Workflow 4: User Verification */}
                            <div className={`space-y-5 animate-fadeIn ${activeStaffWorkflow === 'users' ? 'block' : 'hidden print:block print:mt-8'}`}>
                                <WorkflowMetaBar
                                    title="วงจรการตรวจสอบและอนุมัติผู้ใช้งานใหม่ (User Verification Flow)"
                                    actors="👤 ผู้สมัครใหม่, 👮‍♂️ เจ้าหน้าที่ (Staff), 🤖 Google Workspace"
                                    channels="Discord Webhook (ห้อง Auth), WeLPRU Welcome Notification"
                                />
                                <VisualFlowchart
                                    startLabel="จุดเริ่มต้น: ผู้ใช้ลงทะเบียนด้วย Google บัญชีมหาวิทยาลัย"
                                    endLabel="สิ้นสุด: บัญชีผ่านการอนุมัติ & รับสิทธิ์ยืมตามโควตา"
                                    steps={[
                                        {
                                            stepNum: 1,
                                            actor: '👤 ผู้สมัครใหม่',
                                            actorRole: 'user',
                                            title: 'ลงทะเบียนเข้าสู่ระบบ',
                                            desc: 'กรอกชื่อ-สกุล, รหัสนักศึกษา/บุคลากร, เบอร์โทรศัพท์ และสังกัดคณะ/หน่วยงาน',
                                            statusBadge: '🟡 pending',
                                        },
                                        {
                                            stepNum: 2,
                                            actor: '👮‍♂️ Staff',
                                            actorRole: 'staff',
                                            title: 'ตรวจสอบความถูกต้องใน /staff/users',
                                            desc: 'ตรวจสอบรหัสประจำตัวและความถูกต้องของข้อมูลสังกัดคณะ:',
                                            branches: [
                                                {
                                                    type: 'success',
                                                    label: '🟢 อนุมัติบัญชี (Approved)',
                                                    text: 'เปิดสิทธิ์การใช้งานทันที ผู้ใช้จะสามารถเริ่มยืมและจองอุปกรณ์ได้ตามโควตา',
                                                    status: '🟢 approved',
                                                },
                                                {
                                                    type: 'danger',
                                                    label: '🔴 ปฏิเสธ / ระงับสิทธิ์ (Rejected / Suspended)',
                                                    text: 'ข้อมูลเท็จหรือไม่ตรงกับสังกัด ระบุเหตุผลการปฏิเสธ บัญชีจะไม่สามารถทำรายการยืม-จองได้',
                                                    status: '🔴 rejected',
                                                },
                                            ],
                                        },
                                    ]}
                                />
                            </div>

                            {/* Workflow 5: Overdue Tracking & Escalation */}
                            <div className={`space-y-5 animate-fadeIn ${activeStaffWorkflow === 'overdue' ? 'block' : 'hidden print:block print:mt-8'}`}>
                                <WorkflowMetaBar
                                    title="วงจรการติดตามอุปกรณ์ค้างคืนและการส่งแจ้งเตือน (Overdue Escalation Flow)"
                                    actors="🤖 Smart Cron (08:30 น.), 👮‍♂️ เจ้าหน้าที่ (Staff), 👤 ผู้ยืมที่ค้างส่ง"
                                    channels="WeLPRU Mobile Push, Discord Webhook (แจ้งเตือนด่วน), In-App Overdue Badge"
                                />
                                <VisualFlowchart
                                    startLabel="จุดเริ่มต้น: Smart Cron รันอัตโนมัติเวลา 08:30 น."
                                    endLabel="สิ้นสุด: ติดตามทวงถามสำเร็จ / ดำเนินการเสนอระงับสิทธิ์"
                                    steps={[
                                        {
                                            stepNum: 1,
                                            actor: '🤖 Smart Cron (08:30 น.)',
                                            actorRole: 'system',
                                            title: 'ตรวจสอบฐานข้อมูลอัตโนมัติทุกเช้า',
                                            desc: 'รันคำสั่งเช็ครายการคำขอยืมที่ถึงกำหนดส่งคืนในวันนี้ และรายการที่เลยกำหนดเวลา',
                                            branches: [
                                                {
                                                    type: 'alert',
                                                    label: '🔔 รายการที่ต้องคืนวันนี้',
                                                    text: 'ส่ง WeLPRU Push ล่วงหน้า เตือนให้นำเครื่องมาส่งคืนก่อนเวลาหมดสัญญา',
                                                },
                                                {
                                                    type: 'danger',
                                                    label: '⚠️ รายการที่เลยกำหนด (Overdue)',
                                                    text: 'ระบบเปลี่ยนสถานะเป็น Overdue อัตโนมัติ พร้อมยิง Discord Alert เข้าห้องเจ้าหน้าที่ทันที',
                                                    status: '⚠️ ค้างคืน (overdue)',
                                                },
                                            ],
                                        },
                                        {
                                            stepNum: 2,
                                            actor: '👮‍♂️ Staff',
                                            actorRole: 'staff',
                                            title: 'ตรวจสอบรายการค้างคืนในหน้า /staff/overdue',
                                            desc: 'ดูรายชื่อผู้ค้างคืน หมายเลขโทรศัพท์ จำนวนวันที่เกินกำหนด และรุ่นอุปกรณ์ที่ค้างส่ง',
                                            statusBadge: '⚠️ Overdue List',
                                        },
                                        {
                                            stepNum: 3,
                                            actor: '👮‍♂️ Staff',
                                            actorRole: 'staff',
                                            title: 'ดำเนินการติดตามทวงถาม (Action Escalation)',
                                            desc: 'โทรศัพท์ติดต่อผู้ยืมโดยตรง หรือกดปุ่ม "ส่งการแจ้งเตือนเตือนความจำ" ไปยัง WeLPRU ซ้ำอีกครั้ง',
                                            branches: [
                                                {
                                                    type: 'success',
                                                    label: '🟢 ผู้ยืมนำส่งคืน',
                                                    text: 'เข้าสู่กระบวนการตรวจสภาพ 3 ระดับ และปลดสถานะค้างคืนทันที',
                                                    status: '⚪ returned',
                                                },
                                                {
                                                    type: 'danger',
                                                    label: '🔴 ค้างคืนเกินกำหนดขั้นวิกฤต',
                                                    text: 'ส่งเรื่องเสนอ Admin เพื่อระงับบัญชีผู้ใช้ชั่วคราว และดำเนินการตามระเบียบมหาวิทยาลัย',
                                                    status: '🔴 suspended',
                                                },
                                            ],
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Footer Note */}
                <div className="mt-14 text-center border-t border-slate-200 pt-8 pb-4">
                    <p className="text-slate-500 text-xs sm:text-sm mb-1">
                        คู่มือปฏิบัติการสำหรับเจ้าหน้าที่ (Staff) — Notebook System V5
                    </p>
                    <p className="text-slate-400 text-xs">
                        หากพบปัญหาทางเทคนิคหรือข้อผิดพลาดของระบบ กรุณาติดต่อผู้ดูแลระบบ (Admin)
                    </p>
                </div>
            </div>
        </div>
    )
}

/* ─── Helper Components ─── */

function QuickNavLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
        teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200',
        green: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
        indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
        amber: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200',
        red: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
    }

    return (
        <a href={href} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${colorClasses[color]} shadow-2xs active:scale-95`}>
            <Icon className="w-5 h-5 mb-1.5 shrink-0" />
            <span className="text-xs font-semibold leading-tight">{label}</span>
        </a>
    )
}

function Section({ id, title, icon: Icon, children, color }: { id: string; title: string; icon: any; children: React.ReactNode; color: string }) {
    const headerColors: Record<string, string> = {
        blue: 'text-blue-800',
        teal: 'text-teal-800',
        green: 'text-emerald-800',
        indigo: 'text-indigo-800',
        purple: 'text-purple-800',
        amber: 'text-amber-800',
        red: 'text-rose-800',
    }
    const bgColors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700',
        teal: 'bg-teal-100 text-teal-700',
        green: 'bg-emerald-100 text-emerald-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        purple: 'bg-purple-100 text-purple-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-rose-100 text-rose-700',
    }

    return (
        <section id={id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${bgColors[color]} shrink-0 shadow-2xs`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${headerColors[color]} tracking-tight`}>{title}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                {children}
            </div>
        </section>
    )
}

function DashboardStatCard({ title, desc, color }: { title: string; desc: string; color: string }) {
    return (
        <div className={`p-3.5 rounded-xl border ${color}`}>
            <h5 className="font-bold text-sm mb-1">{title}</h5>
            <p className="text-xs opacity-90 leading-relaxed">{desc}</p>
        </div>
    )
}

function StepInline({ num, text }: { num: number; text: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {num}
            </span>
            <span className="leading-relaxed">{text}</span>
        </div>
    )
}

function ReservationActionCard({ title, desc, badge, badgeColor }: { title: string; desc: string; badge: string; badgeColor: string }) {
    return (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${badgeColor}`}>
                    {badge}
                </span>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 mb-1">{title}</h5>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
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


