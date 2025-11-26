-- Create table for storing processed match notes
create table processed_match_notes (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  processed_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('pending', 'verified', 'error')) default 'pending',
  accuracy_score float default 0.0,
  created_by uuid references auth.users(id),
  match_id uuid references matches(id)
);

-- Add RLS policies
alter table processed_match_notes enable row level security;

-- Allow admins to read all processed notes
create policy "Admins can read all processed notes"
  on processed_match_notes for select
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Allow admins to insert processed notes
create policy "Admins can insert processed notes"
  on processed_match_notes for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Allow admins to update processed notes
create policy "Admins can update processed notes"
  on processed_match_notes for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Create index for faster queries
create index idx_processed_notes_status on processed_match_notes(status);
create index idx_processed_notes_created_at on processed_match_notes(created_at);