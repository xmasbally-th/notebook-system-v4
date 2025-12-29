-- =======================================================
-- DEBUG & FIX SCRIPT FOR "Database error saving new user"
-- Run this in Supabase SQL Editor
-- =======================================================

-- Step 1: Check if profiles table exists and show structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check existing users in auth.users (if any)
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- Step 3: Check existing profiles (if any)
SELECT id, email, role, status FROM public.profiles LIMIT 5;

-- Step 4: Check current trigger function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
