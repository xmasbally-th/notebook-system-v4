# 📚 เอกสารประกอบ — ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์

**ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์**  
**Tech Stack:** Next.js 15+ (App Router) · Supabase · TypeScript · TailwindCSS · Zod · Recharts  
**อัปเดตล่าสุด:** 26 กุมภาพันธ์ 2569

---

## 📁 โครงสร้างเอกสาร

### 📖 [คู่มือการใช้งาน](./user-guides/)

คู่มือสำหรับผู้ใช้และผู้ดูแลระบบ ภาษาไทย

| ไฟล์ | คำอธิบาย |
|------|----------|
| `admin-manual-th.md` | คู่มือผู้ดูแลระบบ (รวมระบบสถิติ และ Support Chat) |
| `admin-manual-equipment-th.md` | คู่มือจัดการอุปกรณ์ (Admin) |
| `user-manual-th.md` | คู่มือผู้ใช้งาน |
| `user-manual-equipment-th.md` | คู่มือยืม-คืนอุปกรณ์ (User) |
| `quick-start-guide.md` | คู่มือเริ่มต้นใช้งาน |
| `menu-navigation-guide.md` | คู่มือเมนูนำทาง |

### 📝 [ประวัติการแก้ไขระบบ](./change-log/)

บันทึกการเปลี่ยนแปลงระบบทั้งหมด แบบละเอียดสำหรับแต่ละเวอร์ชันโดยเฉพาะ V5:

| โฟลเดอร์ | คำอธิบาย |
|----------|----------|
| `01-ฐานข้อมูล/` | Schema, migrations, RLS Hardening, indexes |
| `02-ระบบผู้ใช้/` | ลงทะเบียน, auth, บทบาท, โปรไฟล์ |
| `03-ระบบอุปกรณ์/` | อุปกรณ์, หมวดหมู่, ประเภท |
| `04-ระบบยืมคืน/` | ยืม, คืน, จอง, ยืมพิเศษ, แบบประเมิน |
| `05-ระบบแจ้งเตือน/` | แจ้งเตือน, Discord webhook, inventory alerts |
| `06-ระบบจัดการ/` | Admin, staff, settings, charts & reports, support chat |

---

## 🏗️ โครงสร้างระบบ

```text
notebook-system-v4/
├── app/                    # Next.js App Router (หน้าเว็บ)
│   ├── admin/              # หน้า Admin (จัดการระบบ, สถิติ, การประเมิน)
│   ├── staff/              # หน้า Staff (ปฏิบัติงาน)
│   ├── equipment/          # หน้าอุปกรณ์
│   ├── my-requests/        # คำขอยืมของฉัน
│   └── ...
├── components/             # React Components (UI, Recharts)
├── hooks/                  # Custom Hooks
├── lib/                    # Server Actions, Zod Schemas, Supabase Client, Utils
├── supabase/               # Migrations & Database Schema (RLS)
│   └── migrations/         # SQL migration files
├── public/                 # Static assets
└── docs/                   # เอกสาร (โฟลเดอร์นี้)
```

---

## 🔑 บทบาทผู้ใช้

| บทบาท | สิทธิ์ |
|--------|--------|
| **Admin** | จัดการทุกอย่าง — ผู้ใช้, อุปกรณ์, การยืม, การตั้งค่าแบบ Dynamic, รายงานสถิติ, และ Support Chat |
| **Staff** | อนุมัติ/ปฏิเสธคำขอยืม, จัดการการคืน, ดูรายงาน |
| **User** | ค้นหาอุปกรณ์, ขอยืม, จอง, ดูประวัติ, รับแจ้งเตือนผ่านหน้าเว็บและ Discord |

---

## 🗄️ ฐานข้อมูล

ระบบใช้ **Supabase (PostgreSQL)** โดยมีตารางหลัก:

- `profiles` — ข้อมูลผู้ใช้
- `equipment` — ข้อมูลอุปกรณ์
- `equipment_categories` — หมวดหมู่อุปกรณ์
- `loan_requests` — คำขอยืมอุปกรณ์
- `reservations` — การจองอุปกรณ์
- `special_loans` — การยืมพิเศษ
- `evaluations` — แบบประเมินการยืม
- `system_config` — การตั้งค่าระบบ (RLS Protected ข้อมูล Webhook)
- `staff_activity_log` — บันทึกกิจกรรมเจ้าหน้าที่ (Audit Trail)
- `support_tickets` — บันทึกข้อความแชทระหว่างแอดมินกับผู้ใช้

ดู migration files ทั้งหมดได้ที่ `supabase/migrations/`

---

## 🚀 การเริ่มต้นพัฒนา

```bash
# ติดตั้ง dependencies
npm install

# รันในโหมดพัฒนา
npm run dev

# Build สำหรับ production
npm run build
```

**ตัวแปรสภาพแวดล้อม:** ตั้งค่าใน `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
