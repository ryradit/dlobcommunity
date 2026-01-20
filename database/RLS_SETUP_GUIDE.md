# Session Payments RLS Policies Setup Guide

## What are RLS Policies?

Row Level Security (RLS) policies control **who can access what data** in your database tables. For the DLOB payment system, we need to ensure:

- **Members** can only see their own payments
- **Admins** can see and manage all payments
- **Security** is enforced at the database level

## Quick Setup (Copy & Paste)

### 1. Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### 2. Run the Complete Setup Script

Copy and paste the entire contents of `complete-session-payments-setup.sql` into the SQL editor and run it.

This will:
✅ Create the `session_payments` table
✅ Set up all RLS policies
✅ Add indexes for performance  
✅ Insert sample payment data
✅ Verify everything works

### 3. What Each Policy Does

| Policy | Who | What They Can Do |
|--------|-----|------------------|
| **Members view own payments** | Regular members | See only their own payment records |
| **Admins view all payments** | Admin users | See all payment records from all members |
| **Admins create payments** | Admin users | Create new payment records for any member |
| **Admins update payments** | Admin users | Mark payments as paid, update amounts, etc. |
| **Members update own notes** | Regular members | Add payment proof notes to their pending payments |
| **Admins delete payments** | Admin users | Delete payment records (use carefully) |

### 4. Security Features

🔒 **Member Protection**: Members can only see their own payment data
🔒 **Admin Control**: Only admins can create and manage payments
🔒 **Data Integrity**: Proper constraints ensure valid payment data
🔒 **Audit Trail**: All changes are timestamped automatically

### 5. Test the Setup

After running the script, test these queries in the SQL editor:

```sql
-- View all payments (will respect RLS based on your role)
SELECT * FROM session_payments;

-- Check policy status
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'session_payments';

-- View sample data summary
SELECT 
    type,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM session_payments 
GROUP BY type, status;
```

## After Setup

Once you run the SQL script, your DLOB payment system will have:

✅ **Secure payment table** with proper access control
✅ **Sample payment data** for testing
✅ **Real-time updates** in your Next.js application
✅ **Complete payment flow** from match creation to payment tracking

Your application at `http://localhost:3000/admin/payments` will now show both legacy payments and new session payments with full functionality!

## Troubleshooting

**Error: "Could not find table"**
- Make sure you ran the complete setup script
- Check that RLS policies are enabled

**Error: "Permission denied"** 
- Verify your user has the correct role (admin/member)
- Check that the member record exists with proper role

**No sample data showing**
- Check if you have member records in the `members` table
- Adjust the sample data section with actual member IDs if needed