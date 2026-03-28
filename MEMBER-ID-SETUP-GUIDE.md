# Member ID Setup Guide - Complete Flow

## Overview
This setup ensures that:
1. ✅ Every member gets proper profile data (full_name, display_name, username)
2. ✅ All existing matches are backfilled with member_id
3. ✅ New members automatically get linked to their matches

---

## Step 1: New Member Profile Setup (RUN FIRST)
**File:** `new-member-profile-setup.sql`

Creates a trigger that auto-populates member profiles on signup:
- Auto-creates profile entry when user signs up
- Ensures full_name, display_name, username are always set
- Fixes existing incomplete profiles
- Verifies all members have necessary fields

**Supabase:** Copy entire content and paste in SQL Editor, then execute

---

## Step 2: Add member_id Column & Backfill (RUN SECOND)
**File:** `add-member-id-to-matches.sql`

Adds member_id to all existing matches:
- Adds member_id column to matches table
- Creates index for performance
- Maps all existing player names to member IDs
- Shows completion stats

**Supabase:** Copy entire content and paste in SQL Editor, then execute

---

## Step 3: Auto-Link Future Matches (RUN THIRD)
**File:** `backfill-match-member-id-trigger.sql`

Creates trigger for automatic member linking on new matches:
- Auto-finds member_id from player names on match creation
- No code changes needed for future matches
- Trigger runs BEFORE INSERT on matches table

**Supabase:** Copy entire content and paste in SQL Editor, then execute

---

## Expected Results

### After Step 1:
```
total_members | with_full_name | with_display_name | with_username | fully_complete
      X       |       X        |         X         |       X       |       X
```
All members should be fully_complete

### After Step 2:
```
total_matches | matched_matches | unmatched_matches | match_percentage
     X        |       Y         |         Z         |      88%
```
Most matches should be matched (80%+)

### After Step 3:
```
✓ Trigger created successfully
✓ All new matches auto-linked to member_id
```

---

## Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check member profile completion
SELECT 
  COUNT(*) as total_members,
  COUNT(CASE WHEN full_name IS NOT NULL AND display_name IS NOT NULL THEN 1 END) as complete_profiles
FROM profiles;

-- Check member_id in matches
SELECT 
  COUNT(*) as total_matches,
  COUNT(CASE WHEN member_id IS NOT NULL THEN 1 END) as linked_matches,
  ROUND(100.0 * COUNT(CASE WHEN member_id IS NOT NULL THEN 1 END) / COUNT(*), 2) as percentage
FROM matches;

-- Check coaching chat can find match names
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  COUNT(m.id) as match_count,
  STRING_AGG(DISTINCT m.team1_player1, ', ') as player_names
FROM profiles p
LEFT JOIN matches m ON m.member_id = p.user_id
GROUP BY p.id, p.user_id, p.full_name
HAVING COUNT(m.id) > 0
ORDER BY COUNT(m.id) DESC;
```

---

## Timeline
1. Run Step 1: ~5 seconds
2. Run Step 2: ~10 seconds (depends on match count)
3. Run Step 3: ~2 seconds
4. **Total Setup Time:** ~20 seconds

All steps are safe to rerun if needed.
