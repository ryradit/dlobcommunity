# Match Identification System - Quick Reference

## Problem: Ambiguous Match Numbers

**Issue:** Match #5 on Feb 22, 2026 vs Match #5 on Feb 29, 2026
- Same number, different weeks
- Confusing when discussing matches
- Hard to reference in reports

## Solution: match_code Pattern

### Format: `YYYYMMDD-NN`

**Examples:**
- `20260222-01` = Match #1 on Feb 22, 2026
- `20260222-05` = Match #5 on Feb 22, 2026
- `20260222-15` = Match #15 on Feb 22, 2026
- `20260229-01` = Match #1 on Feb 29, 2026 ← Unique!

### Benefits:

✅ **Unique** - No ambiguity across time  
✅ **Sortable** - Chronological order  
✅ **Human-readable** - Easy to say "match 20260222-05"  
✅ **Auto-generated** - Database creates it automatically  
✅ **Searchable** - Quick lookups by code

## Database Schema

```sql
matches table:
├── id (UUID)              -- Internal database ID
├── match_number (INT)     -- Sequential per day: 1, 2, 3...
├── match_code (TEXT)      -- Auto: "YYYYMMDD-NN" ← USE FOR DISPLAY
└── match_date (TIMESTAMP)
```

### How match_code is Generated:

```sql
-- Automatically generated via trigger (no manual input needed)
match_code = TO_CHAR(match_date, 'YYYYMMDD') || '-' || LPAD(match_number, 2, '0')

Examples:
- Date: 2026-02-22, Number: 1  → Code: "20260222-01"
- Date: 2026-02-22, Number: 15 → Code: "20260222-15"
- Date: 2026-02-29, Number: 1  → Code: "20260229-01"
```

**Implementation:** A database trigger automatically sets `match_code` whenever a match is inserted or updated.

## Usage Examples

### Find a Specific Match:

```sql
-- ✅ RECOMMENDED: By match_code (unique)
SELECT * FROM matches WHERE match_code = '20260222-05';

-- ❌ AMBIGUOUS: By match_number alone
SELECT * FROM matches WHERE match_number = 5;  -- Which Saturday?

-- ✅ OK: By number + date
SELECT * FROM matches 
WHERE DATE(match_date) = '2026-02-22' AND match_number = 5;
```

### Display Matches to Users:

```sql
SELECT 
  match_code AS "Match ID",     -- "20260222-05"
  TO_CHAR(match_date, 'DD Mon YYYY') AS "Date",  -- "22 Feb 2026"
  shuttlecock_count AS "Shuttlecocks"
FROM matches
WHERE DATE(match_date) = '2026-02-22'
ORDER BY match_number;
```

**Output:**
| Match ID     | Date         | Shuttlecocks |
|--------------|--------------|--------------|
| 20260222-01  | 22 Feb 2026  | 3            |
| 20260222-02  | 22 Feb 2026  | 4            |
| 20260222-03  | 22 Feb 2026  | 3            |
| ...          | ...          | ...          |

### Get Member's Matches:

```sql
SELECT 
  m.match_code,
  TO_CHAR(m.match_date, 'DD Mon') as date,
  mm.attendance_fee,
  mm.amount_due as shuttlecock_cost
FROM match_members mm
JOIN matches m ON mm.match_id = m.id
WHERE mm.member_name = 'Peno'
  AND DATE(m.match_date) >= '2026-02-01'
ORDER BY m.match_date, m.match_number;
```

**Output:**
| match_code   | date   | attendance_fee | shuttlecock_cost |
|--------------|--------|----------------|------------------|
| 20260222-05  | 22 Feb | 18000          | 9000             |
| 20260222-08  | 22 Feb | 0              | 9000             |
| 20260229-03  | 29 Feb | 18000          | 9000             |

### Matches Across Multiple Weeks:

```sql
SELECT 
  m.match_code,
  DATE(m.match_date) as play_date,
  COUNT(DISTINCT mm.member_name) as total_players
FROM matches m
LEFT JOIN match_members mm ON m.id = mm.match_id
WHERE DATE(m.match_date) IN ('2026-02-22', '2026-02-29')
GROUP BY m.match_code, m.match_date
ORDER BY m.match_date, m.match_number;
```

**Output (NO AMBIGUITY!):**
| match_code   | play_date  | total_players |
|--------------|------------|---------------|
| 20260222-01  | 2026-02-22 | 4             |
| 20260222-02  | 2026-02-22 | 4             |
| 20260222-15  | 2026-02-22 | 4             |
| 20260229-01  | 2026-02-29 | 4             | ← Different week!
| 20260229-02  | 2026-02-29 | 4             |

## Frontend Display Examples

### Admin Dashboard:
```
Match Results - Saturday, Feb 22, 2026

Match 20260222-01: Team A vs Team B (21-19)
Match 20260222-02: Team C vs Team D (18-21)
Match 20260222-03: Team A vs Team C (21-15)
...
```

### Member History:
```
Your Matches:

Feb 22, 2026
  - Match 20260222-05: Won 21-18
  - Match 20260222-08: Lost 15-21
  
Feb 29, 2026
  - Match 20260229-03: Won 21-16
```

### Payment Receipt:
```
Payment for Saturday, Feb 22, 2026

Matches Played:
  - 20260222-05: Shuttlecock Rp 9,000
  - 20260222-08: Shuttlecock Rp 9,000
  - 20260222-12: Shuttlecock Rp 9,000

Attendance Fee: Rp 18,000 (paid once)
Total Due: Rp 45,000
```

## Comparison Table

| Method       | Example                                      | Unique? | User-Friendly? | Sortable? |
|--------------|----------------------------------------------|---------|----------------|-----------|
| match_id     | `a1b2c3d4-e5f6-7890-abcd-ef1234567890`     | ✅ Yes  | ❌ No          | ❌ No     |
| match_number | `5`                                          | ❌ No   | ✅ Yes         | ⚠️ Partial |
| match_code   | `20260222-05`                                | ✅ Yes  | ✅ Yes         | ✅ Yes    |

## Summary

**Use `match_code` for:**
- User-facing displays
- Reports and exports
- Communication ("Check match 20260222-05")
- Search/filter functionality
- URLs: `/matches/20260222-05`

**Use `match_id` for:**
- Internal database operations
- Foreign key relationships
- API responses (include both id and code)

**Use `match_number` for:**
- Ordering within a single day
- "This is the 5th match today"
- Combined with date for uniqueness

---

**Result:** Clear, unique, human-friendly match identification! 🏸
