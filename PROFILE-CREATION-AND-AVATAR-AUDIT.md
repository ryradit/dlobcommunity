# Profile Creation & Avatar Handling - Complete Audit

## Overview
This document provides a comprehensive audit of how user profiles are created and managed during authentication/registration, including avatar URL handling.

---

## 1. PROFILE CREATION ON AUTHENTICATION

### A. Database Schema
**File:** [supabase-setup.sql](supabase-setup.sql#L1-L22)

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,                    -- ⭐ AVATAR URL STORED HERE
  playing_level TEXT,
  dominant_hand TEXT,
  years_playing TEXT,
  achievements TEXT,
  partner_preferences TEXT,
  instagram_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### B. Trigger: Automatic Profile Creation on User Signup
**File:** [supabase-setup.sql](supabase-setup.sql#L45-L70)

**Trigger Function:** `handle_new_user()`
- **Executes on:** `AFTER INSERT ON auth.users`
- **Action:** Automatically creates profile entry when user signs up

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'member',
    true
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    is_active = COALESCE(EXCLUDED.is_active, profiles.is_active);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Key Points:**
- Profile is created **automatically** when user is created in auth.users
- `full_name` is extracted from `raw_user_meta_data->>'full_name'`
- `avatar_url` is **NOT SET** during initial signup (stays NULL)
- All new users get role = 'member' and is_active = true

---

## 2. SIGNUP FLOW

### Sign Up Endpoint
**File:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L311-L340)

```typescript
const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,  // ⭐ Passed to metadata
      },
      emailRedirectTo: undefined, // Disable auto-email
    },
  });

  if (error) throw error;

  // Profile is automatically created by database trigger (handle_new_user)
  
  // Send custom verification email via DreamHost SMTP
  if (data?.user?.id) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email: email,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
  }
  
  return data;
};
```

**What happens:**
1. User provides: email, password, fullName
2. Supabase creates auth user with `full_name` in metadata
3. Database trigger `handle_new_user()` fires and creates profile row
4. Profile row has: id, full_name, email, role='member', is_active=true
5. **Avatar URL is NULL at this point**

---

## 3. GOOGLE OAUTH FLOW

### Google OAuth Sign In
**File:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L399-L428)

```typescript
const signInWithGoogle = async () => {
  try {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('❌ [Google OAuth] Error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        details: error,
      });
      throw error;
    }
  } catch (err: any) {
    console.error('❌ [Google OAuth] Unexpected error:', err);
    throw err;
  }
};
```

**Callback Handler:**
**File:** Expected at `/auth/callback` (standard Supabase OAuth flow)

**Flow:**
1. User clicks "Sign in with Google"
2. Redirects to Supabase OAuth provider
3. Returns to `/auth/callback` route
4. Supabase creates auth user with Google metadata (name, picture, etc.)
5. Database trigger `handle_new_user()` fires
6. Profile is created with: id, full_name (from Google name), email, etc.
7. **Google profile picture is in auth.users metadata, but NOT automatically synced to profile.avatar_url**

---

## 4. TEMP EMAIL / ADMIN MEMBER CREATION

### Create Temp Member (Admin API)
**File:** [src/app/api/admin/create-temp-member/route.ts](src/app/api/admin/create-temp-member/route.ts)

```typescript
// Create auth user
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,  // e.g., "abdul.dedi@temp.dlob.local"
  password: 'Dlob2026!',
  email_confirm: true,
  user_metadata: { full_name: name },
});

// Update profile created by trigger using RPC function
const { data: result, error: updateError } = await supabaseAdmin
  .rpc('update_profile_safe', {
    p_id: data.user.id,
    p_full_name: name,
    p_email: email,
    p_role: 'member',
    p_is_active: true,
  });
```

**Flow:**
1. Admin creates temp member with temp email (e.g., abdul@temp.dlob.local)
2. Auth user is created with full_name in metadata
3. Database trigger creates profile
4. RPC function updates profile with details
5. **avatar_url is still NULL**

---

## 5. BULK ACCOUNT CREATION

### Bulk Create Accounts API
**File:** [src/app/api/admin/bulk-create-accounts/route.ts](src/app/api/admin/bulk-create-accounts/route.ts#L130-L170)

```typescript
// Create new user
const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: member.email,
  password: template_password,
  email_confirm: !send_email,
  user_metadata: {
    full_name: member.full_name,
    phone: member.phone,
    playing_level: member.playing_level,
    dominant_hand: member.dominant_hand,
    years_playing: member.years_playing
  }
});

// Update or create profile (trigger should handle this, but we do it explicitly)
const { error: profileError } = await supabaseAdmin
  .from('profiles')
  .upsert({
    id: newUser.user.id,
    full_name: member.full_name,
    email: member.email,
    phone: member.phone,
    playing_level: member.playing_level,
    dominant_hand: member.dominant_hand,
    years_playing: member.years_playing,
    role: member.role || 'member',
    is_active: true
    // ⚠️ avatar_url is NOT set here either
  });
```

**Flow:**
1. Admin bulk creates members with email, password, and metadata
2. Auth users created
3. Database trigger fires and creates profiles
4. Code explicitly upserts profile with additional fields
5. **Still no avatar_url**

---

## 6. COMPLETE PROFILE FLOW (Temp Email Users)

### Profile Completion Page
**File:** [src/app/dashboard/complete-profile/page.tsx](src/app/dashboard/complete-profile/page.tsx)

Allows temp email users to:
1. Update email to real email
2. Set their own password
3. Verify their new email

### Update Profile API
**File:** [src/app/api/complete-profile/route.ts](src/app/api/complete-profile/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const { userId, newEmail, newPassword, fullName, phone } = await request.json();

  // Update user credentials
  const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      email: newEmail,
      password: newPassword,
      email_confirm: false,
      user_metadata: {
        ...(fullName && { full_name: fullName })
      }
    }
  );

  // Update profile to mark as complete
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      email: newEmail,
      ...(fullName && { full_name: fullName }),
      ...(phone && { phone }),
      using_temp_email: false,
      must_change_password: false,
      pending_email_verification: true,  // Block login until verified
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Send verification email via Resend
  const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-verification-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email: newEmail })
  });

  return NextResponse.json({
    success: true,
    requiresVerification: true
  });
}
```

**What happens:**
1. User updates email, password, phone
2. Profile is updated with new values
3. **avatar_url is STILL NOT SET**
4. pending_email_verification flag is set to true
5. Verification email is sent

---

## 7. AVATAR UPLOAD & URL STORAGE

### Avatar Upload Function
**File:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L487-L535)

```typescript
const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  if (!user) throw new Error('No user logged in');
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // Upload to 'profiles' bucket in Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    // ⭐ UPDATE profile.avatar_url IN DATABASE
    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    // ⭐ UPDATE auth.users metadata
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    });

    // Refresh user to get updated metadata
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if (updatedUser) {
      setUser(updatedUser);
    }

    return { avatarUrl };
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    throw error;
  }
};
```

**Key Points:**
- **File stored in:** `profiles` bucket (PUBLIC)
- **File naming:** `{user_id}-{timestamp}.{extension}`
- **Both locations updated:**
  1. `profiles.avatar_url` (database)
  2. `auth.users.user_metadata.avatar_url` (for metadata sync)
- **Returns:** Public URL from Supabase Storage

### Avatar Sync from Profile
**File:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L47-L76)

```typescript
// Sync avatar from profiles table to user metadata
const syncAvatarFromProfile = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (profile?.avatar_url) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser && currentUser.user_metadata?.avatar_url !== profile.avatar_url) {
        const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
          data: { avatar_url: profile.avatar_url }
        });
        
        if (!error && updatedUser) {
          setUser(updatedUser);
        }
      } else if (currentUser) {
        setUser(currentUser);
      }
    } else {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      }
    }
  } catch (error) {
    console.error('Error syncing avatar:', error);
  }
};
```

**Called:**
- On auth context initialization
- When user logs in
- On auth state changes
- On window focus (cross-tab sync)

---

## 8. AVATAR RETRIEVAL

### Get User Avatar API
**File:** [src/app/api/get-user-avatar/route.ts](src/app/api/get-user-avatar/route.ts)

```typescript
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch user profile with avatar_url
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user avatar for user:', userId, error);
      return NextResponse.json({ avatarUrl: null }, { status: 200 });
    }

    if (!data?.avatar_url) {
      console.log(`No avatar_url for user ${userId}`);
      return NextResponse.json({ avatarUrl: null }, { status: 200 });
    }

    return NextResponse.json({ avatarUrl: data.avatar_url }, { status: 200 });
  } catch (error) {
    console.error('Error in get-user-avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Used by:**
- [src/components/GalleryComments.tsx](src/components/GalleryComments.tsx#L86)

---

## 9. GALLERY COMMENTS - AVATAR INTEGRATION

### Comment API with Avatar Fetching
**File:** [src/app/api/gallery-comments/route.ts](src/app/api/gallery-comments/route.ts#L64-L95)

```typescript
// Get user avatar if comment has a user_id
let avatarUrl: string | null = null;
if (comment.user_id) {
  console.log(`🔍 Fetching avatar for user: ${comment.user_id}`);
  
  const { data: profileData } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', comment.user_id)
    .single();

  console.log(`  ✓ Profile avatar_url field:`, profileData?.avatar_url);

  if (profileData?.avatar_url) {
    avatarUrl = profileData.avatar_url;
    console.log(`  ✓ Avatar found: ${avatarUrl}`);
  } else {
    console.log(`  ⚠️ No avatar_url in profile`);
  }
}

// Add avatar to comment for return
avatar_url: avatarUrl,
```

---

## 10. MEMBER SETTINGS - AVATAR UPLOAD

### Settings Page Avatar Upload
**File:** [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L15-L20)

```typescript
const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();
const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

// On file selected:
const result = await uploadAvatar(file);
// Updates:
// 1. Supabase Storage (profiles bucket)
// 2. profiles.avatar_url (database)
// 3. auth.users.user_metadata.avatar_url (metadata)
```

---

## 11. ADMIN MEMBERS PAGE - AVATAR DISPLAY

### Admin Members Display
**File:** [src/app/admin/members/page.tsx](src/app/admin/members/page.tsx#L22-L837)

```typescript
interface Member {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;  // ⭐ From profiles table
  // ... other fields
}

// Display avatar if exists
{member.avatar_url ? (
  <Image
    src={member.avatar_url}
    alt={member.full_name}
    className="w-9 h-9 rounded-full"
  />
) : (
  // Fallback gradient avatar
)}
```

---

## SUMMARY TABLE

| Stage | Profile Created | Avatar URL Set | Location | Notes |
|-------|-----------------|----------------|----------|-------|
| User Signup (Email/Pass) | ✅ Yes (Trigger) | ❌ No | profiles table | Trigger: `handle_new_user()` |
| User Signup (Google OAuth) | ✅ Yes (Trigger) | ❌ No | profiles table | Trigger fires, avatar in auth metadata only |
| Admin Create Temp Member | ✅ Yes (Trigger + RPC) | ❌ No | profiles table | RPC function: `update_profile_safe()` |
| Bulk Create Accounts | ✅ Yes (Trigger + Upsert) | ❌ No | profiles table | Upsert ensures profile exists |
| User Uploads Avatar | ✅ Already exists | ✅ Yes | profiles + auth metadata | Function: `uploadAvatar()` |
| Complete Profile (Temp) | ✅ Already exists | ❌ No | profiles table | Updates email, password, phone only |

---

## KEY FINDINGS

### ✅ What's Being Set
1. **User ID** - From auth.users.id
2. **Full Name** - From signup form or Google metadata
3. **Email** - From signup or updated in complete-profile
4. **Phone** - Optionally set during signup or in complete-profile
5. **Role** - Always defaults to 'member'
6. **is_active** - Always defaults to true
7. **Avatar URL** - ✅ Only set when user explicitly uploads avatar

### ❌ What's NOT Being Set Automatically
1. **avatar_url** - NULL until user uploads
2. **playing_level** - Only set during bulk creation if provided
3. **dominant_hand** - Only set during bulk creation if provided
4. **years_playing** - Only set during bulk creation if provided
5. **achievements** - Never set automatically
6. **partner_preferences** - Never set automatically
7. **instagram_url** - Never set automatically

### 📍 Files Involved in Profile Creation/Avatar

**Database Setup:**
- [supabase-setup.sql](supabase-setup.sql#L1-L80) - Schema, trigger, RLS policies

**Auth Context (Main Logic):**
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Sign up, OAuth, avatar upload, sync

**API Routes:**
- [src/app/api/complete-profile/route.ts](src/app/api/complete-profile/route.ts) - Update temp email profiles
- [src/app/api/admin/create-temp-member/route.ts](src/app/api/admin/create-temp-member/route.ts) - Create member with temp credentials
- [src/app/api/admin/bulk-create-accounts/route.ts](src/app/api/admin/bulk-create-accounts/route.ts) - Bulk member creation
- [src/app/api/get-user-avatar/route.ts](src/app/api/get-user-avatar/route.ts) - Retrieve avatar URL
- [src/app/api/gallery-comments/route.ts](src/app/api/gallery-comments/route.ts#L64-L95) - Fetch avatars for comments

**UI Components:**
- [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx) - Avatar upload for members
- [src/app/admin/settings/page.tsx](src/app/admin/settings/page.tsx) - Avatar upload for admins
- [src/app/admin/members/page.tsx](src/app/admin/members/page.tsx) - Display member avatars
- [src/components/GalleryComments.tsx](src/components/GalleryComments.tsx#L80-L98) - Fetch and display avatars in comments

---

## AVATAR STORAGE

**Bucket:** `profiles` (PUBLIC)
**Format:** `{user_id}-{timestamp}.{extension}`
**Example:** `b5e4f8c1-2d3e-4f5a-b6c7-d8e9f0a1b2c3-1704067200000.jpg`

**Setup Guide:** [AVATAR-SETUP-GUIDE.md](AVATAR-SETUP-GUIDE.md)

---

