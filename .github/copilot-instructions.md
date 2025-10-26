# DLOB Badminton Community Platform - Copilot Instructions

## Project Overview
**DLOB** is a full-stack web-based community platform for badminton players that automates attendance tracking, match scheduling, and payment collection with AI-powered features.

## Tech Stack
- **Frontend:** Next.js 14+ (React, TypeScript, TailwindCSS)
- **Backend:** Node.js with Express (TypeScript)
- **Database:** Supabase (PostgreSQL)
- **AI Integration:** Gemini API
- **Payment:** Midtrans/Xendit
- **Messaging:** WhatsApp API/Telegram Bot
- **Deployment:** Vercel (frontend), Render/Railway (backend)

## Key Features to Implement
1. **Attendance System:** QR code/GPS check-in every Saturday
2. **Payment Management:** Auto-calculate fees, payment tracking, reminders
3. **Match Management:** Scheduling, results, stats, leaderboards
4. **AI Assistant:** Gemini-powered chat, recommendations, analytics
5. **Admin Dashboard:** Financial reports, member management, AI insights

## AI Features (Gemini Integration)
- Payment message parsing and auto-marking
- Fair match pairing recommendations based on win rates
- Weekly performance analysis summaries
- Community Q&A chatbot
- Attendance and expense forecasting

## Development Guidelines
- Use TypeScript throughout the entire codebase
- Environment variables for all API keys and secrets
- Follow RESTful API principles
- Implement async/await for all API calls
- Use JSON schemas for Gemini API input/output validation
- Modular, clean code architecture
- Comprehensive error handling and validation

## Database Schema (Supabase)
Key tables: members, attendance, payments, matches, match_results, ai_interactions

## Project Structure
```
dlob-platform/
├── frontend/          # Next.js application
├── backend/           # Express.js API server
├── shared/           # Shared TypeScript types and utilities
├── database/         # Supabase schemas and migrations
└── docs/            # Documentation
```

## Common Tasks
- Building API routes (/api/attendance, /api/payment, /api/matches)
- Creating React components for dashboards and tracking
- Implementing Gemini API integration functions
- Developing match scheduling and leaderboard views
- Setting up Supabase database schemas
- Implementing WhatsApp/Telegram notification systems

## Coding Standards
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Implement proper error boundaries in React
- Use Zod or similar for runtime type validation
- Follow security best practices for API endpoints
- Implement proper authentication and authorization