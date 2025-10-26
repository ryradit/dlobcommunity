# DLOB Platform - Supabase Authentication Setup Guide

## 🚀 Quick Setup Instructions

### 1. Supabase Project Setup

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Project Credentials**
   - Go to Project Settings → API
   - Copy your `Project URL` and `anon/public` key

### 2. Environment Variables

1. **Copy the environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update your .env.local file:**
   ```bash
   # Required Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Optional - for AI features
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

### 3. Database Setup

1. **Run the SQL Schema**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Click "Run" to execute the schema

2. **Enable Email Authentication**
   - Go to Authentication → Settings
   - Enable "Email" provider
   - Configure email settings (optional: set up SMTP)

3. **Set up Row Level Security**
   - The schema automatically enables RLS
   - Policies are included for proper access control

### 4. Authentication Configuration

1. **Enable Email Confirmation (Recommended)**
   - Go to Authentication → Settings
   - Enable "Email Confirmations"
   - Set confirmation URL to: `http://localhost:3000/auth/callback`

2. **Configure Redirect URLs**
   - Add your domain to "Site URL" and "Redirect URLs"
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

### 5. Install Dependencies

Make sure you have the required packages:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 6. Test Authentication

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test with Demo Accounts:**
   - Admin: `admin@dlob.com` / `password123`
   - Member: `member@dlob.com` / `password123`

   > Note: You'll need to create these users in Supabase Auth first, or register new accounts

### 7. Create Demo Users (Optional)

You can create demo users directly in Supabase:

1. Go to Authentication → Users
2. Click "Add User"
3. Create users with emails matching the sample data
4. Set passwords (remember to hash them properly)

## 🔧 Advanced Configuration

### Custom Email Templates

1. Go to Authentication → Email Templates
2. Customize the confirmation and reset password emails
3. Use your branding and styling

### Role-Based Access

The system automatically handles role-based redirects:
- **Admin users** → `/admin` dashboard
- **Member users** → `/dashboard` dashboard

### API Routes Protection

API routes are protected using the `authenticateRequest` function. Example:

```typescript
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Your protected API logic here
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure your `.env.local` file has the correct variables
   - Restart your development server after adding variables

2. **Authentication not working**
   - Check your Supabase project is active
   - Verify the URLs and keys are correct
   - Check browser console for errors

3. **RLS Policy Errors**
   - Make sure the SQL schema was executed completely
   - Check that policies match your user IDs

4. **Email confirmation not working**
   - Check your email provider settings in Supabase
   - Verify the redirect URLs are correct
   - Check spam folder for confirmation emails

### Getting Help

- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review Next.js Auth documentation
- Check browser developer tools for console errors

## 📋 Features Included

### ✅ Authentication Features
- [x] Email/password registration and login
- [x] Email verification
- [x] Password reset functionality
- [x] Role-based access control (Admin/Member)
- [x] Protected routes
- [x] Session management
- [x] Automatic redirects based on user role

### ✅ Integration Features
- [x] Supabase Auth integration
- [x] Row Level Security (RLS) policies
- [x] TypeScript support
- [x] React context for auth state
- [x] Protected API routes
- [x] Error handling and validation

## 🚀 Next Steps

After authentication is working:

1. **Test the full user flow:**
   - Register → Email verification → Login → Role-based redirect

2. **Customize the experience:**
   - Update email templates
   - Modify the UI/UX
   - Add additional user fields

3. **Connect other features:**
   - Link attendance tracking to authenticated users
   - Connect payment system to user accounts
   - Enable AI features for logged-in users

Your DLOB platform now has a complete, production-ready authentication system! 🎉