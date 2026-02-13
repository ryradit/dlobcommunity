# Training History - Supabase Setup

## Setup Instructions

### 1. Run SQL Migration

Execute the SQL file to create the training_history table:

```bash
# Option 1: Run via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy content from `supabase-training-history.sql`
4. Execute the SQL

# Option 2: Run via psql (if you have direct access)
psql -h your-db-host -U postgres -d postgres -f supabase-training-history.sql
```

### 2. Verify Table Creation

Check if the table was created successfully:

```sql
-- Check table exists
SELECT * FROM training_history LIMIT 1;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'training_history';
```

### 3. Test the Feature

1. **Login as a member**
2. **Go to Training Center** (`/dashboard/training`)
3. **Ask a training question**: e.g., "Bagaimana cara meningkatkan smash?"
4. **Check history sidebar**: Your question should appear in "Riwayat Latihan"
5. **Refresh page**: History should persist
6. **Click history item**: Loads previous advice and videos
7. **Hover and delete**: Delete icon appears on hover

## Features Implemented

### Training Center Page
- ✅ **Auto-load history** from Supabase on page load
- ✅ **Auto-save** new training sessions to database
- ✅ **Persistent history** across sessions and devices
- ✅ **Delete functionality** with hover-to-reveal delete button
- ✅ **Loading states** for better UX
- ✅ **Limit to 20 recent items** (configurable)

### Database Schema
```typescript
interface TrainingHistory {
  id: UUID;
  user_id: UUID;           // References auth.users
  query: TEXT;             // User's question
  advice: TEXT;            // AI's training advice
  videos: JSONB;           // YouTube video recommendations
  created_at: TIMESTAMP;   // Auto-generated
}
```

### API Endpoints

#### GET `/api/training-history`
Fetch user's training history
```typescript
Query params:
- userId: string (required)
- limit: number (default: 10)

Response:
{
  history: TrainingHistory[]
}
```

#### POST `/api/training-history`
Save new training session
```typescript
Body:
{
  userId: string,
  query: string,
  advice: string,
  videos: YouTubeVideo[]
}

Response:
{
  success: boolean,
  data: TrainingHistory
}
```

#### DELETE `/api/training-history`
Delete a training history item
```typescript
Query params:
- id: string (required)
- userId: string (required)

Response:
{
  success: boolean
}
```

### Security (Row Level Security)

**Policies applied:**
1. ✅ Users can **only view** their own training history
2. ✅ Users can **only insert** their own training history
3. ✅ Users can **only delete** their own training history
4. ❌ Admin cannot view other users' history (privacy-first)

## Testing Checklist

- [ ] Table created successfully
- [ ] RLS policies active
- [ ] User can save training session
- [ ] History loads on page refresh
- [ ] User can view their own history only
- [ ] User can delete their history items
- [ ] Videos and advice load correctly from history
- [ ] Different users see different histories

## Files Created/Modified

### Created:
- `supabase-training-history.sql` - Database schema
- `/src/app/api/training-history/route.ts` - API endpoints

### Modified:
- `/src/app/dashboard/training/page.tsx` - Added Supabase integration

## Future Enhancements

1. **Favorites/Bookmarks**: Star important training sessions
2. **Categories**: Auto-categorize by training type
3. **Search**: Search through history
4. **Export**: Export history as PDF
5. **Share**: Share training sessions with other members
6. **Analytics**: Track most asked questions
7. **Recommendations**: Suggest related training based on history

## Troubleshooting

### History not loading
- Check browser console for errors
- Verify user is logged in
- Check Supabase logs for policy violations

### Cannot save history
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check table permissions
- Verify API endpoint is accessible

### Videos not showing from history
- Check JSONB format in database
- Verify video URLs are valid
- Check Next.js image configuration for `i.ytimg.com`

## Database Maintenance

```sql
-- View all training sessions
SELECT u.email, th.query, th.created_at 
FROM training_history th
JOIN auth.users u ON th.user_id = u.id
ORDER BY th.created_at DESC;

-- Count sessions per user
SELECT user_id, COUNT(*) as session_count
FROM training_history
GROUP BY user_id
ORDER BY session_count DESC;

-- Clean old history (optional - older than 6 months)
DELETE FROM training_history 
WHERE created_at < NOW() - INTERVAL '6 months';
```

## Success! 🎉

Your Training Center now has persistent history storage. Members can:
- ✅ Access their training history anytime
- ✅ Review past advice and videos
- ✅ Build a personal training knowledge base
- ✅ Track their badminton improvement journey
