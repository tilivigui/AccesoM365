-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table to manage user roles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'approver', 'user')) default 'user',
  updated_at timestamp with time zone default now()
);

-- Room Requests table
create table public.room_requests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description_html text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  organizer_id uuid references auth.users not null,
  organizer_email text not null,
  room_id text not null, -- M365 Place/Room ID
  room_email text not null,
  participants jsonb default '[]', -- List of participant emails/names
  resources jsonb default '{}', -- Checklist of extras: {wifi: bool, tv: bool, etc}
  status text check (status in ('pending', 'approved', 'rejected', 'suspended')) default 'pending',
  m365_event_id text, -- ID of the event in M365 after approval
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.room_requests enable row level security;

-- Profiles: Anyone can read their own profile, admins can read all
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Room Requests:
-- Split into separate policies for clarity and reliability
-- 1. Users can always view their own requests
create policy "room_requests_select_own" on room_requests
  for select using (auth.uid() = organizer_id);

-- 2. Admins/Approvers can view all requests
create policy "room_requests_select_managers" on room_requests
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'approver')
    )
  );

-- 3. Dedicated supervisor email fallback (bypass profile latency)
create policy "room_requests_select_supervisor" on room_requests
  for select using (
    (auth.jwt() ->> 'email' = 'supervisorti@livigui.com') OR
    (lower(auth.jwt() -> 'user_metadata' ->> 'email') = 'supervisorti@livigui.com') OR
    (lower(auth.jwt() ->> 'preferred_username') = 'supervisorti@livigui.com')
  );

-- Users can create requests
create policy "Users can create requests" on room_requests
  for insert with check (auth.uid() = organizer_id);

-- Only Approvers/Admins can update status
create policy "Approvers/Admins can update status" on room_requests
  for update using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('admin', 'approver')
    )
  );

-- Only Approvers/Admins can delete requests
create policy "Approvers/Admins can delete requests" on room_requests
  for delete using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('admin', 'approver')
    )
  );

-- Function to handle new user profile creation
-- Function to handle new user profile creation with special role for TI supervisor
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text := 'user';
begin
  -- Automatically assign approver role to the designated supervisor
  if new.email = 'supervisorti@livigui.com' then
    assigned_role := 'approver';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', assigned_role);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- FIX: Ensure supervisor has approver role if they already signed up
-- This is a one-time repair block
update public.profiles
set role = 'approver'
where email = 'supervisorti@livigui.com';
