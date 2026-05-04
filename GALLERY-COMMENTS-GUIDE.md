# Gallery Comments System - Implementation Guide

## Overview

A complete **threaded commenting system** for DLOB's gallery page with optional authentication, admin moderation, and real-time updates support.

**Key Features**:
- ✅ Authenticated users (using profile name) & Anonymous visitors (using session ID)
- ✅ Threaded replies (threaded conversations)
- ✅ Comment flagging system for community moderation
- ✅ Admin delete & unflag management
- ✅ Persistent storage in Supabase
- ✅ Soft delete (users can delete own comments)
- ✅ Hard delete (admins only)

---

## Architecture

### Database Schema

**Table**: `gallery_comments`

```sql
- id: UUID (Primary Key)
- gallery_item_id: TEXT (Image/Video ID)
- user_id: UUID (FK to auth.users) - NULL for anonymous
- display_name: TEXT (Profile name or anonymous name)
- anonymous_session_id: TEXT - NULL for authenticated users
- content: TEXT (1-1000 chars)
- parent_comment_id: UUID (FK self) - For threaded replies
- is_flagged: BOOLEAN (Default: false)
- flag_reason: TEXT (Why flagged)
- is_deleted: BOOLEAN (Soft delete)
- deleted_at: TIMESTAMP
- deleted_by: UUID
- created_at: TIMESTAMP (Auto)
- updated_at: TIMESTAMP (Auto)
```

**Indexes**: 
- gallery_item_id, user_id, session_id, parent_id, created_at, is_flagged
- All filtered by `is_deleted = FALSE` for performance

**Row-Level Security (RLS)**: 
- Users see only non-deleted comments
- Admins see all comments
- Users can only update own comments
- Anonymous users tracked by session_id

---

## Files & Implementation

### 1. Database Setup

**File**: [`supabase-gallery-comments.sql`](./supabase-gallery-comments.sql)

Run this migration in Supabase to create:
- Table with constraints & indexes
- RLS policies
- Helper functions: `soft_delete_gallery_comment()`, `flag_gallery_comment()`
- View: `gallery_comments_view` for easy querying

### 2. API Routes

**File**: [`src/app/api/gallery-comments/route.ts`](./src/app/api/gallery-comments/route.ts)

Supports: GET, POST, PUT, DELETE

#### **GET** - Fetch Comments
```bash
GET /api/gallery-comments?galleryItemId=xxx&parentCommentId=yyy&limit=50&offset=0
```
- Fetches comments for a gallery item
- Optional `parentCommentId` for threaded replies
- Returns comment count & `hasMore` for pagination

**Response**:
```json
{
  "comments": [
    {
      "id": "...",
      "gallery_item_id": "xxx",
      "user_id": null,
      "display_name": "Ahmed",
      "content": "Great photo!",
      "parent_comment_id": null,
      "is_flagged": false,
      "created_at": "2026-04-20T...",
      "reply_count": 2
    }
  ],
  "total": 10,
  "hasMore": false
}
```

#### **POST** - Create Comment
```bash
POST /api/gallery-comments
Body: {
  "galleryItemId": "xxx",
  "content": "Great photo!",
  "parentCommentId": null,  // Optional for replies
  "displayName": "Ahmed",    // Ignored if authenticated
  "userRole": "member"
}
```

- Auto-detects auth user and uses profile name
- Generates session_id for anonymous users (returned in response)
- Returns created comment with potential sessionId

#### **PUT** - Update/Flag Comment
```bash
PUT /api/gallery-comments
Body: {
  "commentId": "xxx",
  "action": "delete" | "flag",
  "reason": "Spam message",  // For flag action
  "sessionId": "anon_xxx"    // For anonymous deletes
}
```

- **delete**: Soft delete (only comment owner can do)
- **flag**: Mark for moderation

#### **DELETE** - Hard Delete (Admin Only)
```bash
DELETE /api/gallery-comments?commentId=xxx
```

- Permanent deletion
- Only admins can perform
- Triggers deletion from all nested replies

---

### 3. React Component

**File**: [`src/components/GalleryComments.tsx`](./src/components/GalleryComments.tsx)

Props:
```typescript
{
  galleryItemId: string;    // Image/Video ID
  title?: string;           // Optional title
}
```

Features:
- Displays comments in tree structure (with indentation)
- Reply button to start threaded conversations
- Flag & Delete buttons with proper authorization
- Character counter (1000 char limit)
- Anonymous user session tracking (localStorage)
- Threaded reply loading/collapsing
- Time formatting (e.g., "2 hours ago")

**State Management**:
```typescript
- comments[]              // All comments
- loading, submitting     // UI states
- showForm                // Toggle comment form
- replyingTo              // Which comment being replied to
- expandedReplies         // Set<string> of expanded threads
- sessionId               // Anonymous session
```

---

### 4. useAuth Hook

**File**: [`src/hooks/useAuth.ts`](./src/hooks/useAuth.ts)

Returns:
```typescript
{
  user: User | null,           // Supabase Auth User
  userRole: 'admin' | 'member' | null,
  loading: boolean             // Auth state loading
}
```

- Checks Supabase auth status
- Fetches user role from profiles table
- Listens to auth state changes
- Returns null for anonymous users

---

### 5. Gallery Page Integration

**Files Modified**: 
- [`src/app/(public)/galeri/page.tsx`](./src/app/(public)/galeri/page.tsx)

**Changes**:
1. Imported `GalleryComments` component
2. Updated **Image Modal** (selectedImage):
   - Layout: Image on left, Comments on right (lg responsive)
   - Mobile: Stacked vertically
   - Scrollable comments section

3. Updated **Video Modal** (selectedVideo):
   - Video on left, Comments on right (lg responsive)
   - Video title shown above comments
   - Mobile: Stacked with border separator

---

### 6. Admin Moderation Panel

**File**: [`src/app/(admin)/gallery-moderation/page.tsx`](./src/app/(admin)/gallery-moderation/page.tsx)

Features:
- **Authorization**: Only admins can access (/admin route)
- **Filter Tabs**: View flagged comments or all comments
- **Actions Per Comment**:
  - Remove flag (unreview)
  - Delete permanently
  - View raw flag reason

**UI**:
- Flagged comments highlighted in red (border & background)
- Shows: Display name, gallery item ID, timestamp, flag reason
- Loading states & error handling
- Responsive grid layout

**Access**: `/admin/gallery-moderation`

---

## Session Management (Anonymous Users)

Anonymous users are tracked via `anonymous_session_id`:

```typescript
// In browser (GalleryComments.tsx)
useEffect(() => {
  if (!user) {
    const stored = localStorage.getItem('gallery_session_id');
    if (!stored) {
      const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('gallery_session_id', newId);
    }
  }
}, [user]);
```

- Session persists across page reloads
- Used to identify anonymous comment ownership
- Can delete own comments using session_id
- No account required

---

## Authorization Rules

| Action | Authenticated | Anonymous | Admin |
|--------|---------------|-----------|-------|
| View comments | ✅ | ✅ | ✅ |
| Post comment | ✅ | ✅ (via session) | ✅ |
| Delete own | ✅ | ✅ (if session matches) | ✅ |
| Delete others | ❌ | ❌ | ✅ |
| Flag comment | ✅ | ✅ | ✅ |
| Unflag comment | ❌ | ❌ | ✅ |
| View flagged | ❌ | ❌ | ✅ |

---

## User Flow

### 1. **Authenticated User Comments**
```
User clicks "Add Comment" 
→ Form appears with no name field (auto-filled from profile)
→ Types comment & clicks "Comment"
→ Comment posted with user_id from auth
→ Display name = profile.full_name
```

### 2. **Anonymous User Comments**
```
Visitor clicks "Add Comment"
→ Form appears with optional name field
→ Enters name (e.g., "Ahmed") & comment
→ Posts comment with session_id
→ display_name = entered name or "Anonymous"
→ Session stored in localStorage for persistence
```

### 3. **Threading**
```
User sees comment & clicks "Reply"
→ Reply form appears (different placeholder text)
→ Types reply & clicks "Reply"
→ New comment created with parent_comment_id set
→ Appears indented under parent (with left border)
```

### 4. **Flagging**
```
User sees inappropriate comment
→ Clicks "Flag" button
→ Prompt asks for flag reason
→ Sends to API: action="flag", reason="Spam"
→ Admin sees in moderation panel
```

### 5. **Admin Moderation**
```
Admin goes to /admin/gallery-moderation
→ Views flagged comments (red highlighted)
→ Can:
   • Remove flag (if was mistake)
   • Delete permanently
   • See flag reason
→ Unflagged comments appear in "All Comments" tab
```

---

## Testing Checklist

### Frontend
- [ ] Comments load on image open
- [ ] Comments load on video open
- [ ] Add comment as authenticated user
- [ ] Add comment as anonymous visitor
- [ ] Reply to comment creates thread
- [ ] Expand/collapse replies
- [ ] Delete own comment (confirmation prompt)
- [ ] Flag comment (reason prompt)
- [ ] Character counter works (1000 limit)
- [ ] Responsive on mobile (stacked layout)

### Backend
- [ ] GET comments returns paginated results
- [ ] POST creates comment with correct user_id/session_id
- [ ] Anonymous session persists in localStorage
- [ ] DELETE requires auth & admin role
- [ ] PUT with action="flag" updates is_flagged
- [ ] RLS prevents unauthorized access

### Admin
- [ ] Admin can access /admin/gallery-moderation
- [ ] Non-admins redirected to home
- [ ] Flagged comments display correctly
- [ ] Can delete comments
- [ ] Can unflag comments
- [ ] Filter tabs show correct counts

---

## Styling & UI

### Color Scheme
- **Comment form**: `bg-gray-50` with gray border
- **Buttons**: `bg-[#3e6461]` (primary), `bg-red-600` (danger)
- **Flagged comments**: `bg-red-50` with red left border
- **Timestamps**: Small gray text
- **Admin panel**: Red badges for flagged, green for approved

### Responsive Breakpoints
- **Mobile**: Stacked layout (comments below modal)
- **Tablet (lg screen)**: Side-by-side (comments right of image)
- **Scrolling**: Both image/video and comments independently scrollable

---

## Performance Optimizations

1. **Indexes**: All queries use indexed columns
2. **RLS**: Filters in database, not frontend
3. **Pagination**: 50 items default with offset-based pagination
4. **Lazy Loading**: Replies loaded on demand (expand/collapse)
5. **Soft Delete**: Comments marked deleted, not removed (faster queries)
6. **Caching**: Session ID stored locally (no re-fetch)

---

## Future Enhancements

- [ ] Comment likes/reactions (emoji reactions)
- [ ] Rich text editor (Markdown support)
- [ ] @mention notifications
- [ ] Comment editing (edit history)
- [ ] Real-time updates (Supabase subscriptions)
- [ ] Comment screenshots/reports
- [ ] Pagination UI for replies
- [ ] Comment search


---

## Deployment Checklist

1. **Run SQL migration**: Execute `supabase-gallery-comments.sql` in Supabase
2. **Deploy code**: Push all new files to production
3. **Environment variables**: Ensure Supabase URLs are set
4. **Test**: Verify comments work in production
5. **Monitor**: Check admin panel for flagged comments daily

---

## Troubleshooting

**Comments not loading**:
- Check Supabase RLS policies
- Verify `NEXT_PUBLIC_SUPABASE_URL` env var
- Check browser console for API errors

**Can't delete comment**:
- Verify user_id matches (for authenticated)
- Check session_id matches (for anonymous)
- Ensure only admins can delete others' comments

**Flagged comments not updating**:
- Admin role must be set in profiles table
- Check RLS policy allows admin access
- Verify API response status code

---

## API Error Responses

```json
{
  "error": "galleryItemId is required"
}
```

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Missing required fields | Validation error |
| 400 | Comment must be 1000 characters or less | Too long |
| 401 | Unauthorized | Not authenticated (for delete) |
| 403 | Only admins can delete comments | Permission denied |
| 404 | Comment not found | Invalid comment ID |
| 500 | Failed to create comment | Server error |

---

**Created**: April 20, 2026
**Author**: DLOB Development Team
**Status**: ✅ Ready for Production
