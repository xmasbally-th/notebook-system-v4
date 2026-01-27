-- ============================================
-- Support Chat System Migration
-- Created: 2026-01-27
-- Purpose: Create tables for support tickets and messages with RLS and Realtime
-- ============================================

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  subject TEXT, -- Optional subject
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable if user is deleted but we want to keep msg
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE, -- To easily distinguish staff/admin from user side
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- TICKET POLICIES
-- Users can see their own tickets
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff/Admins can view ALL tickets
DROP POLICY IF EXISTS "Staff view all tickets" ON support_tickets;
CREATE POLICY "Staff view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- Staff/Admins can update tickets (close/open)
DROP POLICY IF EXISTS "Staff update all tickets" ON support_tickets;
CREATE POLICY "Staff update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );


-- MESSAGE POLICIES
-- Users can view messages of their own tickets
DROP POLICY IF EXISTS "Users view own ticket messages" ON support_messages;
CREATE POLICY "Users view own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Users can insert messages to their own tickets (if ticket is open? enforced in UI usually, but DB validation good too)
DROP POLICY IF EXISTS "Users send messages" ON support_messages;
CREATE POLICY "Users send messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

-- Staff/Admins can view ALL messages
DROP POLICY IF EXISTS "Staff view all messages" ON support_messages;
CREATE POLICY "Staff view all messages" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- Staff/Admins can send messages to ANY ticket
DROP POLICY IF EXISTS "Staff reply messages" ON support_messages;
CREATE POLICY "Staff reply messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages(ticket_id, created_at ASC);

-- 6. Enable Realtime for messages (so chat updates live)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
  END IF;
  
   -- Also enable for tickets so admins see new tickets appear
   IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'support_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
  END IF;
END $$;
