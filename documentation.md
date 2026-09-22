# 📚 เอกสารประกอบ — ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์

เอกสารรายละเอียดเชิงเทคนิคและการทำงานของระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์ฉบับสมบูรณ์

---

## 1. ภาพรวม (Overview)
**ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์** เป็นระบบเว็บแอปพลิเคชันสำหรับจัดการการยืม-คืนพัสดุและครุภัณฑ์ส่วนกลาง พัฒนาด้วยเทคโนโลยีสมัยใหม่ เน้นความรวดเร็ว ความปลอดภัยสูง และการทำงานที่มีประสิทธิภาพมากขึ้น โดยมีฟีเจอร์หลักคือการจอง (Reservation), การยืม (Loan), การจัดการระบบสำหรับ Admin ที่ครอบคลุมมากขึ้น เช่น ระบบ Support Chat ทางตรงจากแอดมิน, รายงานและสถิติเชิงลึก (Analytics & Export), รวมถึงการแจ้งเตือนผ่าน Discord

### Tech Stack หลัก:
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling & UI:** TailwindCSS, Recharts (สำหรับกราฟสถิติ)
- **State & Data Fetching:** React Query & Server Actions
- **Validation:** Zod (Schema Validation สำหรับ Server Actions ทั้งหมด)
- **Notification:** Discord Webhook

---

## 2. โครงสร้างโฟลเดอร์ (Folder Structure)
```text
notebook-system-v4/
├── app/                    # Next.js App Router (Routes & Pages)
│   ├── admin/              # จัดการระบบ สำหรับผู้ดูแล (รวมถึงหน้ารายงาน สถิติ การประเมิน)
│   ├── staff/              # ระบบปฏิบัติงาน สำหรับเจ้าหน้าที่
│   ├── equipment/          # หน้าแสดงรายการอุปกรณ์
│   ├── auth/               # ระบบ Authentication callback
│   └── (profile, loans...) # หน้าเพจสำหรับผู้ใช้งานทั่วไป
├── components/             # Reusable React UI Components
├── hooks/                  # Custom React Hooks
├── lib/                    # Logic ชั้นกลาง (Server Actions, API, Tools, Zod Schemas)
│   ├── supabase/           # การตั้งค่าเชื่อมต่อ Supabase
│   ├── data/               # ข้อมูล Static หรือ Helper
│   └── ...                 # ระบบแจ้งเตือน, รูปแบบวันที่ Thai
├── supabase/               # Backend Logic
│   └── migrations/         # ไฟล์ SQL สำหรับสร้างตาราง และ RLS
├── public/                 # ไฟล์ Static (รูปภาพ, ไอคอน)
└── docs/                   # เอกสารบันทึกประวัติการเปลี่ยนแปลง
    ├── database/
    ├── users/
    ├── equipment/
    └── admin/
```

---

## 3. การติดตั้ง (Installation)
1. **Clone Repository และติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
2. **ตั้งค่า Environment Variables:**
   สร้างไฟล์ `.env.local` ใน Root directory และใส่ค่าจาก Supabase Project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **รันระบบ (Development Mode):**
   ```bash
   npm run dev
   ```
4. **Build สำหรับ Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 4. อธิบายระบบอัตโนมัติ (Automation)
ระบบมีการทำงานอัตโนมัติในส่วนหลัก ๆ ดังนี้:
- **Discord Notifications:** เมื่อมีการจองใหม่, คืนอุปกรณ์, หรือความผิดปกติ ระบบจะส่งข้อความไปยัง Webhook ที่ตั้งค่าไว้โดยอัตโนมัติ (`lib/notifications.ts`)
- **Auto-Approval:** สำหรับผู้ใช้ที่มีบทบาท `staff` หรือ `admin` เมื่อทำการจองระบบจะอนุมัติ (Status: `approved`) ให้ทันทีโดยไม่ต้องผ่านขั้นตอนตรวจสอบ
- **Activity Logging:** บันทึกทุกกิจกรรมของเจ้าหน้าที่ (Staff Activity) ลงในตาราง `staff_activity_log` เพื่อใช้ในการตรวจสอบย้อนหลัง (Audit Trail)
- **Support Badges:** ระบบแจ้งเตือนข้อความแชทใหม่ (Unread message badge) บน SupportButton สำหรับผู้ใช้งานเมื่อ Admin ทักหา

---

## 5. Config & Environment
ระบบใช้ไฟล์ `.env.local` ในการจัดการ Config หลัก และมีตาราง `system_config` ในฐานข้อมูลเพื่อเก็บค่าคอนฟิกที่สามารถแก้ไขได้ผ่านหน้าเว็บ (Dynamic Config) เช่น:
- URL ของ Discord Webhooks แยกตามประเภท (General, Auth, Reservation)
- จำนวนอุปกรณ์สูงสุดที่แต่ละบทบาทสามารถยืมได้
- **หมายเหตุ V5:** ระบบมีการปรับปรุง RLS (Row Level Security) สำหรับ `system_config` อย่างเข้มงวด เพื่อให้ข้อมูลสำคัญอย่างบัญชี Webhook ปลอดภัยและเข้าถึงได้เฉพาะ Admin เท่านั้น

---

## 6. HTTP Layer และประสิทธิภาพ (Performance)
ใน V5 มีการปรับเปลี่ยนและโฟกัสที่เรื่องประสิทธิภาพขนานใหญ่:
- **Client Client & Server Client:** จัดการด้วย `@supabase/ssr`
- **React Query Optimization:** ลดการดึงข้อมูลที่ซ้ำซ้อน จัดการ Cache อย่างมีประสิทธิภาพเพิ่มความเร็วในการ Render หน้าเว็บ
- **Bundle Size Reduction:** ลดขนาดไฟล์ JavaScript ที่ฝั่ง Client ต้องโหลด

---

## 7. Utils Layer
รวมฟังก์ชันช่วยเหลือที่ใช้ซ้ำบ่อย:
- **`formatThaiDate.ts`:** จัดการแปลงวันที่ ISO เป็นรูปแบบภาษาไทย พุทธศักราช และเวลาที่อ่านง่าย
- **`permissions.ts`:** จัดการตรวจสอบสิทธิ์ของผู้ใช้ (Role-based access control)
- **`docxGenerator.ts`:** ส่วนงาน Generate เอกสาร Word (ใบยืม-คืน) จาก Template
- **`utils.ts`:** ฟังก์ชันทั่วไป เช่น `cn` สำหรับการ Merge Tailwind classes

---

## 8. API Endpoint & Server Actions (V5 Standard)
ใน V5 ระบบได้ทำการ **Refactor Server Actions ทั้งหมด** ให้ทำงานประสานกับ **Zod Schema** เพื่อสร้างมาตรฐานการรับส่งข้อมูลและการจัดการ Error รูปแบบเดียวกัน:
- ทุก Action จะมีการตรวจสอบชนิดข้อมูล (Type Validation) ก่อนบันทึกลงฐานข้อมูล
- รูปแบบการจัดการ Error เป็นมาตรฐาน (Standardized Error Handling) 
- ตัวอย่างฟีเจอร์สำคัญ:
  - `createTicketForUserAction`: สร้าง Support Chat จาก Admin ถึง User
  - `updateEquipmentStatus`: อัปเดตสถานะความพร้อมของอุปกรณ์พร้อมพิมพ์ Validation ผ่าน Zod
  - ระบบ Export CSV และ Filter ช่วงวันที่ในหน้ารายงาน Admin Evaluation

---

## 9. ตัวอย่างจริง (Real Example V5)
ตัวอย่างโครงสร้างของ **Server Action** มาตรฐาน V5 ที่ใช้ Zod:

```typescript
// app/actions/example.ts
'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// 1. Zod Schema
const ExampleSchema = z.object({
  equipmentId: z.string().uuid(),
  notes: z.string().optional()
})

export async function submitExampleAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 2. Auth Check
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    // 3. Validation Logic with Zod
    const parsed = ExampleSchema.safeParse({
        equipmentId: formData.get('equipmentId'),
        notes: formData.get('notes')
    })

    if (!parsed.success) {
        return { error: 'ข้อมูลไม่ถูกต้อง' }
    }

    // 4. Database Operation
    const { data, error } = await supabase
        .from('some_table')
        .insert({ 
            user_id: user.id, 
            ...parsed.data
        })

    if (error) return { error: error.message }
    return { success: true }
}
```

---

## 10. Security (ความปลอดภัย)
ระบบรักษาความปลอดภัยผ่าน 3 ชั้นหลักที่มีการยกระดับใน V5:
1. **Middleware:** ตรวจสอบ Session JWT ของ Supabase ก่อนเข้าถึงหน้าที่มีการป้องกัน
2. **Row Level Security (RLS) Hardening:** ใน V5 มีการแก้บัคผู้ใช้ค้นหาอุปกรณ์ไม่ได้ และพนักงานทำคืนผ่านระบบไม่ได้ โดยการปรับ RLS Policies ให้แม่นยำและปลอดภัยที่สุด
3. **Server-Side Validation:** ตรวจสอบความถูกต้องของข้อมูลผ่าน **Zod** ทุกเส้นทางก่อนการทำงานเชิงลึก

---

## 11. Best Practices
- **Server-First:** เน้นการประมวลผลที่ Server โดยใช้ Server Components เพื่อลดภาระของ Client
- **Zod for Everything:** ใช้ Zod จัดการ Type ทั้งฝั่งรับจากฟอร์มและการเขียนลงฐานข้อมูล เพื่อลดข้อผิดพลาด
- **Atomic Operations:** ใช้ Transaction หรือ RPC เมื่อต้องจัดการข้อมูลหลายตารางพร้อมกัน
- **Error Boundaries:** มีการดักจับ Error และแจ้งเตือนผู้ใช้งานด้วย UI ที่เข้าใจง่าย (Toast Notifications)
- **Data Analytics & Reports:** การแสดงผลข้อมูลที่มีปริมาณมาก ออกแบบให้รองรับ Pagination, Date Filtering และ Export เพื่อความสะดวกในการวิเคราะห์ของส่วนบริหาร

---
*เอกสารนี้จัดทำขึ้นเพื่อให้ทีมนักพัฒนาเข้าใจโครงสร้างและมาตรฐานของระบบ พัฒนาโดย Antigravity.*
