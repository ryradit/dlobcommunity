# DLOB Badminton Community Platform

🏸 **DLOB** is a comprehensive full-stack web platform for badminton communities that automates attendance tracking, match scheduling, payment collection, and provides AI-powered insights.

## 🚀 Features

### Core Functionality
- **Smart Attendance System** - QR code and GPS-based check-ins every Saturday
- **Payment Management** - Automated fee calculations, payment tracking, and reminders
- **Match Scheduling** - Smart match pairing, results tracking, and leaderboards
- **Member Management** - Profile management, activity tracking, and statistics

### AI-Powered Features (Gemini Integration)
- **Payment Message Parsing** - Automatically parse and categorize payment messages
- **Match Recommendations** - Fair team pairing based on performance history
- **Performance Analysis** - Weekly summaries and improvement suggestions
- **Community Chat Assistant** - Answer questions and provide information
- **Attendance & Expense Forecasting** - Predict future trends and patterns

## 🛠 Tech Stack

### Full-Stack Application
- **Framework:** Next.js 14+ with TypeScript (Frontend + API Routes)
- **Styling:** TailwindCSS
- **State Management:** React Hooks
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT with Supabase Auth
- **AI Integration:** Google Gemini API

### Infrastructure
- **Deployment:** Vercel (Single Application)
- **Database:** Supabase Cloud
- **Payment Gateways:** Midtrans/Xendit
- **Messaging:** WhatsApp API/Telegram Bot

## 📁 Project Structure

```
dlob-platform/
├── frontend/              # Next.js Full-Stack Application
│   ├── src/
│   │   ├── app/          # App Router (pages + API routes)
│   │   │   ├── api/      # Backend API endpoints
│   │   │   ├── page.tsx  # Homepage
│   │   │   └── layout.tsx
│   │   ├── components/   # Reusable React components
│   │   ├── lib/          # Utilities, services, and configs
│   │   │   ├── services/ # Business logic (Gemini AI, etc.)
│   │   │   ├── supabase.ts
│   │   │   └── auth.ts
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static assets
│   └── package.json
│
├── database/              # Database schemas and migrations
│   └── schema.sql        # Supabase PostgreSQL schema
│
├── shared/               # Legacy shared types (deprecated)
│   └── types.ts         
│
└── docs/                # Project documentation
```

**Note:** This is now a unified Next.js application that serves both frontend and backend from a single server on localhost:3000.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- VS Code (recommended)

### Installation

1. **Navigate to the project:**
   ```bash
   cd dlobplatform/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   # Edit .env.local with your API keys and database URLs
   ```

4. **Set up the database:**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
   - Update your `.env.local` file with Supabase credentials

### Development

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Access the application:**
   - Application: http://localhost:3000
   - API Routes: http://localhost:3000/api/*
   - Example: http://localhost:3000/api/attendance

### VS Code Tasks

This project includes VS Code tasks for development:
- **Start DLOB Development**: Runs the unified Next.js dev server
- Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Start DLOB Development"

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
JWT_SECRET=your_secure_jwt_secret

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

## 📊 Database Schema

The platform uses the following main entities:
- **Members** - User profiles and authentication
- **Attendance** - Daily check-in records
- **Payments** - Fee tracking and payment history
- **Matches** - Game scheduling and participants
- **Match Results** - Score tracking and statistics
- **AI Interactions** - Logging of AI-powered features

See `database/schema.sql` for the complete schema definition.

## 🤖 AI Features Setup

### Gemini API Integration
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your backend `.env` file
3. The AI service handles:
   - Payment message parsing
   - Match recommendations
   - Performance analysis
   - Community chat assistance

## 🚀 Deployment

### Unified Application (Vercel)
1. Connect your GitHub repo to Vercel
2. Set the build directory to `frontend`
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Database (Supabase)
1. Create a production Supabase project
2. Run the schema from `database/schema.sql`
3. Update production environment variables

## 🤝 Contributing

This project follows these development guidelines:
- Use TypeScript throughout the codebase
- Follow RESTful API principles
- Implement proper error handling and validation
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Implement proper authentication and authorization

## 📝 API Documentation

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Check in attendance
- `GET /api/attendance/stats` - Get attendance statistics

#### Payments
- `GET /api/payments` - Get payment records
- `POST /api/payments` - Create new payment
- `PATCH /api/payments/:id/paid` - Mark payment as paid

#### Matches
- `GET /api/matches` - Get match records
- `POST /api/matches` - Create new match
- `POST /api/matches/:id/result` - Record match result

#### AI Features
- `POST /api/ai/parse-payment` - Parse payment messages
- `POST /api/ai/match-recommendations` - Get match recommendations
- `GET /api/ai/performance-analysis/:member_id` - Get performance analysis
- `POST /api/ai/chat` - Chat with AI assistant

## 📞 Support

For questions about this project or the DLOB platform:
1. Check the project documentation
2. Review the API endpoints and database schema
3. Examine the example code and components
4. Use the built-in AI chat assistant for community-related questions

## 📄 License

This project is licensed under the ISC License.