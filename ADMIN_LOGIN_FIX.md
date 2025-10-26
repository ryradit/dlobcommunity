# Admin Login Fix Guide

## Problem
The admin user exists in the `members` table but not in Supabase Auth, causing login failures.

## Current Status
- ✅ Member record exists: admin@dlob.com (ID: 00000000-0000-0000-0000-000000000001)
- ❌ Auth user does not exist
- ❌ Automated creation fails with "Database error creating new user"

## Solution: Manual Creation in Supabase Dashboard

### Step 1: Create Auth User Manually
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qtdayzlrwmzdezkavjpd
2. Navigate to **Authentication** → **Users** in the sidebar
3. Click **"Add User"** button
4. Fill in the form:
   - **Email**: `admin@dlob.com`
   - **Password**: `AdminDLOB2025!`
   - **Auto Confirm User**: ✅ (Check this box)
   - **Send Email Confirmation**: ❌ (Leave unchecked since auto-confirming)
5. Click **"Create User"**

### Step 2: Update Member Record (if needed)
If the newly created auth user has a different ID than the member record:

1. Go to **Database** → **Table Editor** → **members**
2. Find the admin@dlob.com record
3. Update the `id` field to match the newly created auth user's ID
   - You can find the auth user ID in Authentication → Users

### Step 3: Test Login
1. Go to http://localhost:3000/login
2. Enter:
   - Email: `admin@dlob.com`
   - Password: `AdminDLOB2025!`
3. Should successfully log in and redirect to admin dashboard

## Alternative: Quick Fix Script

If manual creation doesn't work, try this temporary solution:

### Enable Demo Mode Temporarily
1. In `.env.local`, change:
   ```
   NEXT_PUBLIC_FORCE_DEMO_MODE=true
   ```
2. Restart the development server
3. Use demo credentials: admin@dlob.com / password123
4. After confirming everything works, switch back to false and fix the auth user

## Why Automated Creation Failed
The "Database error creating new user" suggests:
- Database triggers on auth.users table are failing
- RLS policies might be interfering
- Email service configuration issues
- Constraints preventing user creation

Manual creation through the dashboard bypasses these issues.

## Final Check
After creating the auth user manually, you should see:
- ✅ Auth user exists in Authentication → Users
- ✅ Member profile exists in Database → members
- ✅ IDs match between auth user and member
- ✅ Login works correctly