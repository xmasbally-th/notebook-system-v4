// Scratch script: test_rls_security.ts
// Run via: npx ts-node scratch/test_rls_security.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Manual parsing of .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local')
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const parts = trimmed.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const val = parts.slice(1).join('=').trim()
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = val
    }
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local or environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runTests() {
  console.log('=== เริ่มต้นการทดสอบความถูกต้อง RLS Security ===')
  
  // 1. Test profile update protection
  console.log('\n[Test 1] ทดสอบอัปเดตสิทธิ์ตนเองเป็น Admin (ต้องถูกบล็อกโดย Trigger/RLS)...')
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    console.log('⚠️ ไม่พบ session การล็อคอินทั่วไป (กรุณาล็อคอินด้วยบัญชีทดสอบในระบบเพื่อทดสอบ RLS)')
  } else {
    const userId = sessionData.session.user.id
    console.log(`ล็อคอินอยู่ด้วย User ID: ${userId}`)
    
    // ลองแก้บทบาทตนเองเป็น admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      
    if (profileError) {
      console.log(`✅ ผลลัพธ์: ปฏิเสธการอัปเดตสำเร็จ (Error: ${profileError.message})`)
    } else {
      console.log(`❌ ผลลัพธ์: ตรวจพบช่องโหว่! บทบาทถูกแก้ไขในฐานข้อมูลโดยไม่มีสิทธิ์`)
    }
  }

  // 2. Test inserting loan request with non-pending status
  console.log('\n[Test 2] ทดสอบแทรกใบยืมใหม่ด้วยสถานะ approved (ต้องไม่สำเร็จ)...')
  if (sessionData.session) {
    const { error: insertLoanError } = await supabase
      .from('loanRequests')
      .insert({
        user_id: sessionData.session.user.id,
        equipment_id: '00000000-0000-0000-0000-000000000000', // dummy uuid
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
        status: 'approved' // แอบแฝงสถานะอนุมัติ
      })
      
    if (insertLoanError) {
      console.log(`✅ ผลลัพธ์: ปฏิเสธการบันทึกสำเร็จ (Error: ${insertLoanError.message})`)
    } else {
      console.log(`❌ ผลลัพธ์: ตรวจพบช่องโหว่! บันทึกใบยืมด้วยสถานะ approved ได้สำเร็จ`)
    }
  }

  // 3. Test changing reservation status to approved as a user
  console.log('\n[Test 3] ทดสอบแก้ไขสถานะการจองเป็น approved โดยผู้ใช้ทั่วไป (ต้องไม่สำเร็จ)...')
  if (sessionData.session) {
    // ดึงการจองของตนเองที่ยังคงค้างอยู่มาสักอัน
    const { data: ownReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', sessionData.session.user.id)
      .limit(1)
      .single()

    if (ownReservation) {
      const { error: updateReservationError } = await supabase
        .from('reservations')
        .update({ status: 'approved' })
        .eq('id', ownReservation.id)

      if (updateReservationError) {
        console.log(`✅ ผลลัพธ์: ปฏิเสธการแก้ไขสถานะสำเร็จ (Error: ${updateReservationError.message})`)
      } else {
        console.log(`❌ ผลลัพธ์: ตรวจพบช่องโหว่! สามารถอัปเดตสถานะการจองเป็น approved ได้`)
      }
    } else {
      console.log('⚠️ ไม่พบการจองของตนเองในระบบเพื่อทดสอบการแอบแก้ไขสถานะ')
    }
  }
  
  console.log('\n=== การทดสอบเสร็จสิ้น ===')
}

runTests().catch(console.error)
