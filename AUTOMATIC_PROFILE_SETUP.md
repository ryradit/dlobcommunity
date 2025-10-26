# 🚀 DLOB Automatic Profile Creation Setup

## Problem
When users register, they get created in Supabase Auth but NOT in the `members` table, causing login failures.

## Solution
Set up automatic profile creation using a database trigger that creates a member profile whenever a new user registers.

## Step-by-Step Setup

### 1. Run the Automatic Profile Trigger

**Go to Supabase Dashboard > SQL Editor and run this:**

```sql
-- DLOB Automatic Profile Creation
-- This trigger automatically creates a member profile when a new user signs up

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, name, phone, role, membership_type, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), -- Use name from signup or email as fallback
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),     -- Use phone from signup if provided
    'member',                                             -- Default role
    'regular',                                            -- Default membership
    true                                                  -- Active by default
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Verify the Trigger Works

**Test by checking if trigger exists:**
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

You should see one row returned.

### 3. Test Registration

1. **Go to your app**: `http://localhost:3000/register`
2. **Register a new user** with:
   - Email: test@example.com
   - Password: test123456
   - Name: Test User
   - Phone: +628123456789
3. **Check email confirmation**
4. **Try logging in**

### 4. Verify Profile Creation

**Check that both records were created:**

```sql
-- Check auth user
SELECT id, email, created_at FROM auth.users WHERE email = 'test@example.com';

-- Check member profile
SELECT id, email, name, role FROM members WHERE email = 'test@example.com';
```

Both queries should return data with the same `id`.

## How It Works

### Before (Broken):
1. User registers → Supabase Auth creates user
2. App tries to create member profile → Sometimes fails
3. User can't login → No profile in members table

### After (Fixed):
1. User registers → Supabase Auth creates user
2. **Database trigger automatically creates member profile**
3. User can login immediately → Profile exists in both places

## Benefits

✅ **Automatic**: No manual profile creation needed  
✅ **Reliable**: Database-level trigger can't fail silently  
✅ **Fast**: Happens instantly when auth user is created  
✅ **Consistent**: Every user gets a member profile  
✅ **Secure**: Uses database security definer  

## Customization

### Default User Settings
The trigger creates users with these defaults:
- **Role**: `member` (change to `admin` for admin accounts)
- **Membership**: `regular` (can be `premium`)
- **Status**: `active` (always true for new users)

### To Create Admin Users
After registration, update the role:
```sql
UPDATE members 
SET role = 'admin', membership_type = 'premium'
WHERE email = 'admin@example.com';
```

## Troubleshooting

### Trigger Not Working
1. Check if trigger exists (Step 2)
2. Verify function has correct permissions
3. Check Supabase logs for errors

### Profile Still Not Created
1. Check RLS policies allow inserts
2. Verify members table structure
3. Check for constraint violations

### Duplicate Profile Errors
This is normal - the app code handles duplicates gracefully now.

## Success Indicators

✅ New users can register and login immediately  
✅ Every registered user has a member profile  
✅ No manual profile creation needed  
✅ Admin can see all users in admin dashboard  

**The system now works exactly as expected! 🎉**