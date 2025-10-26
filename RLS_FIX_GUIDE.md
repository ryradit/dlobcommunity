# 🔒 **RLS Policy Fix Required**

## **Issue:** 
`new row violates row-level security policy for table "members"`

## **Cause:**
Supabase Row Level Security (RLS) is blocking member creation because the API requests don't have authentication.

## **🚀 Quick Fix - Run SQL Script:**

1. **Go to Supabase Dashboard**
   - Open [supabase.com](https://supabase.com) → Your Project
   - Go to **SQL Editor** (left sidebar)

2. **Run the Fix Script**
   - Copy the content from `database/fix-member-rls.sql`
   - Paste it into the SQL Editor
   - Click **"RUN"**

3. **Test Member Creation**
   - Go back to your app: Admin → Match Management → Create Match
   - Click "Add New Member" 
   - Should now work with ✅ "Saved to Supabase database"

## **📋 SQL Script to Run:**

```sql
-- Fix RLS policies for member creation
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Members can insert their own profile" ON members;

-- Create a permissive policy for member insertion  
CREATE POLICY "Allow member creation" ON members FOR INSERT 
WITH CHECK (true);

-- Ensure public can view active members
DROP POLICY IF EXISTS "Members can view active members" ON members;
CREATE POLICY "Public can view active members" ON members FOR SELECT 
USING (is_active = true);
```

## **🔄 Alternative: Use Service Key (Advanced)**

If you prefer more secure approach:

1. **Get Service Key from Supabase**
   - Dashboard → Settings → API → `service_role` key

2. **Add to .env.local:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart Server**

## **✅ After Fix:**
- Member creation will store directly in Supabase
- No more RLS policy errors
- Real database persistence
- Success message: "✅ Saved to Supabase database"

**The system is already set up to detect RLS issues and provide helpful error messages!** 🎉