# YouTube Data API V3 Setup Guide

This guide will help you set up YouTube Data API V3 integration for the DLOB platform gallery page.

## Prerequisites

- A Google Account
- A YouTube channel (or access to one)
- Basic knowledge of environment variables

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "DLOB Badminton Platform")
4. Wait for the project to be created

## Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"
4. Wait for the API to be enabled

## Step 3: Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Click "Restrict Key" to add security restrictions:
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Under "Website restrictions", add your domain if deploying to production

## Step 4: Find Your YouTube Channel ID

### Method 1: YouTube Studio
1. Go to [YouTube Studio](https://studio.youtube.com/)
2. In the left sidebar, click "Settings" > "Channel" > "Advanced settings"
3. Your Channel ID will be displayed

### Method 2: Channel URL
1. Go to your YouTube channel
2. Look at the URL - if it shows `/channel/UC...`, that's your Channel ID
3. If it shows `/c/channelname` or `/user/username`, use Method 1 or 3

### Method 3: Online Tool
1. Go to [commentpicker.com/youtube-channel-id.php](https://commentpicker.com/youtube-channel-id.php)
2. Enter your channel URL or username
3. Get your Channel ID

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in your frontend directory (if it doesn't exist)
2. Add the following variables:

```bash
# YouTube Data API Configuration
NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=your_channel_id_here
```

3. Replace `your_api_key_here` with the API key from Step 3
4. Replace `your_channel_id_here` with the Channel ID from Step 4

## Step 6: Restart Your Development Server

```bash
cd frontend
npm run dev
```

## Step 7: Test the Integration

1. Visit your gallery page at `http://localhost:3000/gallery`
2. You should see:
   - Videos automatically loaded from your YouTube channel
   - Proper thumbnails, titles, and descriptions
   - Video duration and view counts
   - No "YouTube API not configured" warning

## Troubleshooting

### "YouTube API not configured" message appears
- Check that both environment variables are set correctly
- Ensure there are no extra spaces or quotes in the values
- Restart the development server after adding environment variables

### No videos appear
- Verify your Channel ID is correct
- Check that your channel has public videos
- Look at the browser console for error messages
- Ensure your API key has the YouTube Data API v3 enabled

### "API key not valid" errors
- Make sure you copied the API key correctly
- Check that the YouTube Data API v3 is enabled for your project
- Verify API restrictions if you set any

### Quota exceeded errors
- YouTube Data API has daily quotas (10,000 units by default)
- Each API call uses quota units
- Consider implementing caching for production use

## API Quota Usage

The current implementation uses approximately:
- **Search API call**: 100 units per request (gets video list)
- **Videos API call**: 1 unit per video for details
- **Total per page load**: ~112 units for 12 videos

With the default 10,000 units/day quota, you can load the gallery page approximately 89 times per day.

## Production Considerations

1. **Caching**: Implement Redis or database caching to reduce API calls
2. **Rate Limiting**: Add rate limiting to prevent quota exhaustion  
3. **Error Handling**: Add retry logic and graceful fallbacks
4. **Security**: Use environment variables, never commit API keys
5. **Monitoring**: Set up quota monitoring and alerts

## Environment Variables Reference

```bash
# Required
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSy...          # Your Google API key
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UC...           # Your YouTube Channel ID

# Optional (for enhanced features)
YOUTUBE_API_QUOTA_LIMIT=10000                  # Daily quota limit
YOUTUBE_CACHE_DURATION=3600                    # Cache duration in seconds
```

## Next Steps

Once configured, the gallery will automatically:
- ✅ Load latest videos from your YouTube channel
- ✅ Display proper thumbnails and metadata
- ✅ Update when new videos are published
- ✅ Categorize videos based on upload order
- ✅ Provide click-to-play functionality
- ✅ Show video duration and view counts
- ✅ Fallback to static content if API fails

Your badminton community gallery will now stay automatically updated with your latest YouTube content! 🏸📺