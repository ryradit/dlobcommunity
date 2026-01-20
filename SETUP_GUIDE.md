# DLOB Platform Setup Guide

## Quick Start (Demo Mode)

The platform is currently running in **Demo Mode**, which means you can test all features without setting up a database.

### Demo Accounts
- **Admin Account**: `admin@dlob.com` / `password123`
- **Member Account**: `member@dlob.com` / `password123`

### Running the Application
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and use the demo credentials to login.

## Features Available in Demo Mode

✅ **Admin Dashboard**
- View attendance overview
- Manage payments (mock data)
- Member management interface

✅ **Member Dashboard** 
- Personal attendance history
- Payment tracking
- AI-powered analytics (mock data)

✅ **Authentication System**
- Role-based access control
- Login/logout functionality
- Protected routes

## Setting Up Production Database

When ready to use real data, follow these steps:

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

### 2. Set Up Database Schema
```sql
-- Run the SQL from database/schema.sql in your Supabase SQL editor
```

### 3. Update Environment Variables
In `frontend/.env.local`:
```bash
# Update with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Disable demo mode
NEXT_PUBLIC_FORCE_DEMO_MODE=false
```

### 4. Restart Development Server
```bash
npm run dev
```

## Error Resolution

### "Invalid login credentials" Error
This typically happens when:
1. Demo mode is disabled but database isn't set up
2. Supabase credentials are incorrect
3. Database tables don't exist

**Solution**: Either enable demo mode (`NEXT_PUBLIC_FORCE_DEMO_MODE=true`) or complete the database setup.

### "Failed to fetch" Error  
Usually indicates network issues or incorrect Supabase configuration.

**Solution**: Check your internet connection and verify Supabase credentials.

## Project Structure
```
frontend/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable React components
│   ├── lib/           # Utilities and services
│   └── types/         # TypeScript type definitions
└── .env.local         # Environment variables
```

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom Demo System
- **Styling**: TailwindCSS
- **Icons**: Lucide React

## Development Guidelines
- All code is in TypeScript
- Use the demo mode for initial development
- Test with both admin and member roles
- Implement real Supabase integration when ready for production

## Need Help?
- Check console logs for detailed error messages
- Ensure all environment variables are correctly set
- Verify that the development server is running on the correct port
- Use demo mode to test features before setting up database