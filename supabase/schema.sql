-- Run this in your Supabase SQL Editor

-- 1. Create the chats table
create table if not exists chats (
  id text primary key,
  title text,
  messages jsonb,
  is_starred boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create the settings table (optional, for future expansion)
create table if not exists user_settings (
  user_id uuid references auth.users not null primary key,
  theme text,
  config jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Realtime for the chats table
-- This allows the frontend to receive updates immediately
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table chats;

-- 4. Set up Row Level Security (RLS)
-- Ideally, you should enable RLS. For a personal tool, we can start open or restrict to authenticated users.
alter table chats enable row level security;

-- Allow authenticated users to do everything (assuming single user or shared team)
create policy "Allow all operations for authenticated users" on chats
  for all using (auth.role() = 'authenticated');

-- Or for local testing without auth (NOT RECOMMENDED FOR PRODUCTION):
-- create policy "Allow all for anon" on chats for all using (true);
