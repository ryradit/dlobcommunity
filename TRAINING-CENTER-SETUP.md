# DLOB Training Center Feature - Setup Guide

## Overview
The Training Center feature allows members to ask AI about badminton training and receive personalized advice with Indonesian YouTube video tutorials.

## Features Implemented

### 1. Enhanced FloatingAIChat
- **Dual Mode**: Toggle between "Bantuan Umum" (General Help) and "Pelatih AI" (Training Assistant)
- **Training Mode**: Ask questions about badminton techniques and get:
  - Personalized AI advice (2-3 sentences)
  - 5 relevant YouTube video recommendations with Indonesian content
  - Video thumbnails, duration, and channel info

### 2. Training Center Page (`/dashboard/training`)
- Dedicated page for in-depth training exploration
- Search bar for custom queries
- Popular topics shortcuts (Smash, Backhand, Footwork, etc.)
- Video gallery with thumbnails and metadata
- Training history (last 10 sessions)
- Tips sidebar for better questions

### 3. API Endpoint (`/api/ai/training-recommendations`)
- Integrates with Google Gemini AI for training advice
- YouTube Data API v3 integration for video search
- Smart keyword extraction from AI responses
- In-memory caching (7-day TTL) to reduce API costs
- Indonesian language preference for video results

## Setup Instructions

### 1. Enable YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create API credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - (Recommended) Restrict the key to YouTube Data API v3 only

### 2. Add Environment Variable

Add to your `.env.local` file:

```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. API Quota Information

**YouTube Data API v3 Free Tier:**
- 10,000 quota units per day
- Search operation: ~100 units
- Video details: ~1 unit per video
- **Estimated capacity**: ~100 searches/day (with caching, can handle more)

**Cost Optimization:**
- In-memory cache stores popular queries for 7 days
- Duplicate queries don't consume API quota
- In production, consider using Redis for persistent caching

### 4. Test the Feature

#### Test FloatingAIChat Training Mode:
1. Click the floating chat button (bottom-right)
2. Switch to "Pelatih AI" mode
3. Ask: "Bagaimana cara meningkatkan smash saya?"
4. Should see AI advice + 5 YouTube videos

#### Test Training Center Page:
1. Login as a member
2. Navigate to `/dashboard/training` (from sidebar: "Training Center")
3. Try popular topics or type custom query
4. Videos should load with thumbnails

## Usage Examples

**Good Questions:**
- "Bagaimana cara meningkatkan kekuatan smash saya?"
- "Teknik backhand yang benar untuk pemula"
- "Cara meningkatkan footwork dan kecepatan bergerak"
- "Latihan untuk meningkatkan stamina badminton"

**AI Response Format:**
```
[2-3 sentences of practical advice]

KEYWORDS: keyword1, keyword2, keyword3, keyword4, keyword5
```

The API extracts keywords and searches YouTube with:
- Relevance language: Indonesian (`relevanceLanguage=id`)
- Embeddable videos only
- Safe search enabled
- Sorted by relevance

## Files Modified/Created

### Created:
- `/src/app/api/ai/training-recommendations/route.ts` - API endpoint
- `/src/app/dashboard/training/page.tsx` - Training Center page
- `/.env.example` - Environment variable template
- `/TRAINING-CENTER-SETUP.md` - This file

### Modified:
- `/src/components/FloatingAIChat.tsx` - Added training mode
- `/src/components/DashboardSidebar.tsx` - Added navigation link

## Troubleshooting

### Videos Not Showing
- Check if `YOUTUBE_API_KEY` is set in `.env.local`
- Verify API key is enabled for YouTube Data API v3
- Check browser console for error messages
- Verify quota hasn't been exceeded (check Cloud Console)

### API Quota Exceeded
- Implement Redis caching for production (replace in-memory cache)
- Consider increasing quota (paid plan)
- Monitor usage in Google Cloud Console

### Wrong Language Videos
- API prioritizes Indonesian content (`relevanceLanguage=id`)
- Some queries may return English content if Indonesian results are limited
- Try more specific Indonesian keywords

## Future Enhancements

1. **Persistent Storage**:
   - Save training history to Supabase
   - Track favorite videos
   - Progress tracking

2. **Advanced Features**:
   - Video bookmarking
   - Personalized recommendations based on match performance
   - Training plans/programs
   - Video playlist creation

3. **Performance Optimization**:
   - Redis caching for multi-instance deployments
   - Video thumbnail caching
   - Lazy loading for video list

4. **Analytics**:
   - Track popular training topics
   - Video engagement metrics
   - Training frequency per member

## Cost Estimation

**Free Tier Usage:**
- 100 unique queries/day = FREE (within quota)
- With caching, can handle 500+ queries/day = FREE

**If Exceeding Free Tier:**
- $0 for first 10,000 units
- Additional units available at cost (check Google Cloud Pricing)

**Recommendation**: Start with free tier and monitor usage. Implement Redis caching before scaling.

## Support

For issues or questions:
1. Check Google Cloud Console for API errors
2. Review server logs for detailed error messages
3. Test API key with Google's API Explorer
4. Verify environment variables are loaded correctly

## License

Part of DLOB Web Application - Internal use only.
