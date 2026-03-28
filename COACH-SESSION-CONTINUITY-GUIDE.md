# Coach Agent Conversation History & Continuity Guide

## Overview
The Coach Agent now maintains persistent conversation history in Supabase, enabling:
- **Continuous coaching sessions** across multiple conversations
- **Progress tracking** of action items and weaknesses
- **Personalized context** based on previous discussions
- **Intelligent recommendations** that reference past sessions

## Architecture

### 1. Database Schema (`coaching_sessions` table)

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users
- `created_at` (TIMESTAMP) - Session timestamp
- `query` (TEXT) - User's message
- `response` (TEXT) - Coach's response body
- `response_type` (VARCHAR) - 'ask_weakness' or 'provide_analysis'
- `key_finding` (JSONB) - Structured: `{ severity, title, stats[] }`
- `action_items` (JSONB) - Array of actionable recommendations
- `expected_results` (JSONB) - `{ timeframe, target, metric }`
- `weakness_options` (JSONB) - Available weaknesses for selection
- `full_response` (JSONB) - Complete response object for audit trail

**Indexes:**
- `idx_coaching_sessions_user_date` - Fast lookup by user and date
- `idx_coaching_sessions_user_recent` - Optimized for recent sessions (last 30 days)

**RLS Policies:**
- Users can only view/insert their own sessions
- Service role can manage all sessions

---

## How It Works

### Session 1: Progressive Disclosure
```
User: "Apa yang perlu ditingkatkan?"
   ↓
API fetches last 5 sessions from DB
   ↓
Coach responds with weakness options (ask_weakness)
   ↓
Response saved: 
   {
     "responseType": "ask_weakness",
     "weaknessOptions": [
       { "id": "w1", "title": "Net Position", ... },
       { "id": "w2", "title": "Stamina", ... }
     ]
   }
```

### Session 2: Detailed Analysis
```
User: "analisis weakness: Net Position"
   ↓
API fetches last 5 sessions (including Session 1)
   ↓
Coach recognizes this is a SPECIFIC selection
   ↓
Generates detailed action-focused response (provide_analysis)
   ↓
Response saved:
   {
     "responseType": "provide_analysis",
     "keyFinding": { "severity": "critical", "title": "...", "stats": [...] },
     "actionItems": [...],
     "expectedResults": { "timeframe": "2 weeks", "target": "30% WR improvement", ... }
   }
```

### Session 3: Progress Check-in
```
User: "Gimana progress saya?"
   ↓
API fetches history and finds:
   - Session 1: Asked for weakness
   - Session 2: Chose "Net Position" for analysis
   ↓
Coach acknowledges: "Minggu lalu kita fokus Net Position..."
   ↓
Asks about progress on action items from Session 2
   ↓
If progress made: "Great! Next level is..."
   ↓
If not: "No problem, jangan skip - yuk fokus..."
```

---

## Data Flow

### API Request (`POST /api/ai/coach-agent`)

```javascript
// Frontend sends
{
  query: "analisis weakness: Net Position",
  userId: "user-123",
  memberName: "Adit"
  // Note: NO sessionHistory in request anymore - API fetches it
}

// Backend does:
1. Fetch last 5 sessions from coaching_sessions table
2. Inject into system prompt as context
3. AI generates response (can reference past discussions)
4. Save complete response to coaching_sessions table
5. Return to frontend
```

### Save Logic

After AI generates response, the API saves:
```javascript
await supabase.from('coaching_sessions').insert({
  user_id: userId,
  query: query,
  response: coachingResponse.response,           // Main text response
  response_type: coachingResponse.responseType,   // 'ask_weakness' or 'provide_analysis'
  key_finding: coachingResponse.keyFinding,      // Structured data
  action_items: coachingResponse.actionItems,     // [{ title, description, expectedOutcome }]
  expected_results: coachingResponse.expectedResults, // { timeframe, target, metric }
  weakness_options: coachingResponse.weaknessOptions,  // For ask_weakness responses
  full_response: coachingResponse,               // Complete object for reference
  created_at: new Date().toISOString()
});
```

---

## Deployment Instructions

### 1. Create Table in Supabase
Run the SQL migration in Supabase SQL Editor:
```sql
-- File: coaching-session-history.sql
-- This creates the coaching_sessions table with proper indexes and RLS
```

### 2. Verify in Frontend
The `CoachingChat` component already supports the response structure:
- Displays `keyFinding` with severity badge
- Shows `actionItems` with `expectedOutcome`
- Renders `expectedResults` section
- No UI changes needed - backend handles persistence

---

## Continuity Features

### 1. Progress Tracking
The coach can now understand:
- Which weaknesses have been discussed
- Which action items were given
- Whether user is following through
- Multi-session improvement trajectory

### 2. Personalization
Each response can:
- Reference specific past weaknesses: "Minggu lalu kita diskusi net position..."
- Acknowledge progress: "Bagus! Win rate vs Wiwin naik dari 0% ke 20%"
- Build on previous advice: "Dari latihan net position, sekarang kita focus..."

### 3. Smart Recommendations
The system considers:
- Historical weakness patterns
- Session count and frequency
- Action items completion status
- Overall progress since first session

---

## Example Context in System Prompt

```
📝 RIWAYAT PERCAKAPAN COACHING (5 sesi terakhir - UNTUK KONTINUITAS):

[Session 1] 20 Mar 2026
User: "Apa yang perlu saya improve?"
Coach Response Type: ask_weakness
Summary: Showed 3 weakness options

[Session 2] 20 Mar 2026
User: "analisis weakness: Kesulitan Mengkonversi Pertandingan Ketat"
Coach Response Type: provide_analysis
Summary: Focused on high-pressure closing scenarios...

[Session 3] 21 Mar 2026
User: "Sudah mulai latihan smash?"
Coach Response Type: provide_analysis
Summary: Asked about progress, adjusted drill intensity...

💡 KONTEKS UNTUK KONTINUITAS:
- Apakah user membahas weakness yang SAMA? Jika ya, progress apa yang sudah dibuat?
- Apakah ada action items dari session lalu yang belum diselesaikan? Tanyakan progressnya!
- Gunakan riwayat untuk membangun relationship continuity
```

---

## Testing Checklist

- [ ] Run `coaching-session-history.sql` in Supabase
- [ ] Test: User starts new conversation → fetches history (should be empty)
- [ ] Test: Ask for weakness options → response saved
- [ ] Test: Select weakness → detailed analysis response saved
- [ ] Test: Next day, return to chat → coach references previous sessions
- [ ] Check Supabase: Verify all 3+ sessions are saved in coaching_sessions table
- [ ] Verify: Coach can refer to specific past conversations by name/content

---

## Future Improvements

### Phase 2: Progress Dashboard
- Create `/dashboard/coaching-progress` page
- Show chart of WR improvement over time
- Display completed vs pending action items
- Visualize weakness resolution progress

### Phase 3: AI Goal Generation
- Coach suggests specific goals based on session history
- Auto-create training goals from recommendations
- Track goal progress across sessions

### Phase 4: Mobile Notifications
- Remind users about pending action items from past sessions
- "Hey Adit! Jangan lupa net position drill - target 1 minggu ini"
- Weekly coaching digest

### Phase 5: Coach Analytics
- Admin dashboard showing coaching effectiveness
- Which weaknesses improve fastest?
- Which members are most committed to action items?
- ROI of coaching sessions

---

## Troubleshooting

### Issue: Coach forgetting previous context
**Cause:** sessionHistory not being fetched from database
**Fix:** Check logs for "Error fetching session history" - verify RLS policies

### Issue: Responses not being saved
**Cause:** `coaching_sessions` table doesn't exist or userId is null
**Fix:** Run migration script, verify userId from auth.users

### Issue: Old sessions cluttering context
**Fix:** Change `limit(5)` in API to `limit(3)` or add date filter `created_at > NOW() - INTERVAL '7 days'`

---

## File References

- **API Endpoint:** `/src/app/api/ai/coach-agent/route.ts`
  - Line ~80: Fetch session history
  - Line ~415: Save coaching session
  
- **Database Migration:** `coaching-session-history.sql`
  
- **Frontend:** `/src/components/CoachingChat.tsx`
  - Already displays keyFinding, actionItems, expectedResults

---

## Team Notes

- Session history is auto-fetched from DB (no frontend changes needed)
- Coach system prompt now includes continuity instructions
- Complete response (JSON) is stored in `full_response` column for future AI features
- 30-day rolling window of sessions for performance (auto-cleanup older ones if needed)
