# Avatar Upload Fix

## Issue Fixed
1. **Bucket name corrected**: Changed from 'avatars' to 'profiles' to match your existing Supabase bucket
2. **Path duplication**: Using just filename instead of nested path
3. **Image warnings**: Added proper style attributes to maintain aspect ratio on Image components
4. **Error handling**: Better error messages when storage bucket doesn't exist

## Setup Storage Bucket in Supabase

Your bucket already exists as **profiles** (PUBLIC). The code has been updated to use this bucket.

If you need to recreate policies or set up a new project:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Set bucket name as: `profiles`
5. Enable **Public bucket** (toggle it on)
6. Click **Create bucket**
7. Click on the `profiles` bucket
8. Go to **Policies** tab
9. Create the following policies:

#### Upload Policy
- Policy name: `Users can upload their own avatar`
- Policy command: `INSERT`
- Target roles: `authenticated`
- USING expression: 
  ```sql
  bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

#### Update Policy
- Policy name: `Users can update their own avatar`
- Policy command: `UPDATE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

#### Select Policy (Public Read)
- Policy name: `Anyone can view avatars`
- Policy command: `SELECT`
- Target roles: `public`
- USING expression:
  ```sql
  bucket_id = 'profiles'
  ```

#### Delete Policy
- Policy name: `Users can delete their own avatar`
- Policy command: `DELETE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Option 2: Using SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**
3. Copy and paste the contents of `supabase-storage-setup.sql`
4. Click **Run** or press Ctrl+Enter

## What Changed in Code

### AuthContext.tsx
- **Changed bucket name from 'avatars' to 'profiles'** to match your existing Supabase bucket
- Fixed avatar upload path to use just filename (no nested folders)
- Added better error handling with helpful messages
- Added try-catch wrapper for the entire uploadAvatar function

### DashboardSidebar.tsx
- Added `style` prop to Image components for proper aspect ratio
- Added `unoptimized` prop to avatar image to prevent caching issues with Supabase storage

### Navbar.tsx
- Added `style` prop to logo Image component

## Testing
After setting up the storage bucket:
1. Go to Dashboard → Pengaturan Profil (Settings)
2. Click the camera icon to upload a new avatar
3. Select an image file (max 5MB)
4. Avatar should upload successfully and display immediately
5. Refresh the page - avatar should persist

## Notes
- Avatars are stored with filename format: `{user_id}-{timestamp}.{extension}`
- Public URLs are generated automatically
- Cache busting is handled with timestamp query parameters
- Profile pictures appear in both sidebar and settings page
