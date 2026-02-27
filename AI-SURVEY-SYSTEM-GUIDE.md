# 🤖 AI Survey System Implementation Guide

## Overview
Automatic AI-powered feedback system for DLOB Community with:
- ✅ **Always-available general feedback survey** - members can submit feedback anytime
- ✅ **Anonymous option** - members choose to be named or anonymous
- ✅ Conversational AI agent using Google Gemini 2.5 Flash Lite (natural chat)
- ✅ Open-ended topics: management, pricing, match/mix issues, or anything else
- ✅ Real-time sentiment analysis
- ✅ AI-generated insights and recommendations
- ✅ **Admin analytics dashboard (view-only)**

**Key Features:**
- **Always Active:** Feedback survey is permanently available at `/survey`
- **Any Topic:** Members can discuss management, shuttlecock prices, membership fees, match pairings, schedules, facilities, or any concerns
- **Natural Conversation:** AI asks follow-up questions like a real person, not a form
- **Privacy Options:** Members choose to submit feedback anonymously or with their name
- **Automatic Analysis:** AI processes sentiment, extracts topics, and generates actionable insights

---

## 📋 Implementation Checklist

### 1. Database Setup (Supabase)

```bash
# Run the SQL schema in Supabase SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Open: supabase-survey-system.sql
3. Run the entire script
```

**What it creates:**
- `survey_templates` - Survey configurations
- `survey_instances` - Active surveys sent to members
- `survey_responses` - Member responses with AI conversations
- `survey_insights` - AI-generated analytics
- `survey_triggers` - Automated survey scheduling
- 2 seed templates (Event Feedback + Feature Requests)

### 2. Environment Variables

Add to `.env.local`:

```env
# Gemini AI - Required for AI surveys
GEMINI_API_KEY=your_gemini_api_key

# Supabase Service Role - Required for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Get Gemini API Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Copy and paste in `.env.local`

### 3. Install Dependencies

Already using Google AI, so no new packages needed! ✅

### 4. Add Survey Link to Navigation

Update dashboard navigation to include survey page:

**File:** `src/app/(dashboard)/layout.tsx` or navigation component

```tsx
{
  name: 'Survey',
  href: '/survey',
  icon: MessageSquare,
}
```

---

## 🎯 How It Works

### For Members (User Flow)

1. **Access Feedback Survey**
   - Navigate to `/survey` anytime
   - See "Feedback & Saran DLOB" card
   - Click **"Mulai Survey"** to start

2. **Choose Privacy Level**
   ```
   AI: Halo! 👋 Apakah Anda ingin menyampaikan feedback secara anonim?
   Options:
   - "Ya, saya ingin anonim"
   - "Tidak, cantumkan nama saya"
   ```

3. **Conversational Experience** - Natural chat flow
   ```
   AI: Tentang apa yang ingin Anda sampaikan?
   User: Soal harga shuttlecock
   
   AI: Hmm, soal harga shuttlecock ya. Ceritain dong, kenapa menurutmu jadi masalah?
   User: Terlalu mahal, naik dari 70rb ke 80rb per tube
   
   AI: Oh gitu, naiknya lumayan juga ya. Ada saran buat solusinya ga?
   User: Mungkin beli dalam jumlah banyak biar dapat diskon
   
   AI: Ide bagus! Ada hal lain yang ingin disampaikan?
   User: Tidak, itu aja
   
   AI: Terima kasih atas feedbacknya! 🙏 Masukan kamu sangat berharga untuk DLOB
   ```

**Topics Members Can Discuss:**
- 💼 **Manajemen:** Organisasi, komunikasi, kebijakan
- 💰 **Harga:** Shuttlecock, membership fee, biaya latihan
- 🏸 **Pertandingan:** Pairing, skill balance, fairness
- ⏰ **Jadwal:** Waktu latihan, frekuensi
- 🏢 **Fasilitas:** Lapangan, pencahayaan, parkir
- ❓ **Lainnya:** Apapun yang ingin disampaikan

4. **Auto-Completion**
   - Survey marks complete when all required questions answered
   - Sentiment analysis runs automatically (-1.0 to +1.0 score)
   - Member can't retake same survey
   - AI extracts key topics and priority score

### For Admins (View-Only Analytics)

**No manual survey creation needed!** Surveys auto-trigger after training sessions. Admin dashboard is purely for viewing AI-processed insights.

1. **Access Analytics Dashboard**
   - Go to Admin Dashboard → Survey Member tab
   - Auto-loads to "AI Insights" tab
   - Select survey from dropdown

2. **View AI Insights**
   - Overall summary of member feedback
   - Sentiment distribution (positive/neutral/negative)
   - Key findings and themes
   - Top positive points members loved
   - Improvement areas that need attention
   - Feature requests from members
   - Actionable recommendations from AI

3. **View Individual Responses**
   - Switch to "Responses" tab
   - See all member survey responses
   - View completion status and sentiment
   - Monitor response rate

4. **Survey History**
   - "Survey History" tab shows all past surveys
   - Stats: total responses, completion rate, sentiment breakdown
   - Click any survey card to view its analytics

**Key Insight:** AI processes everything automatically. Admin just needs to review the insights and act on recommendations.

---

## 🚀 How to Enable the Feedback Survey

The general feedback survey is created automatically when you run the SQL schema. No API trigger needed - it's always available!

### Database Setup (One-Time)

1. **Run SQL Schema**
   ```bash
   # Go to Supabase Dashboard → SQL Editor
   # Paste supabase-survey-system.sql
   # Click "Run"
   ```

2. **What Gets Created:**
   - Survey template: "Feedback & Saran DLOB"
   - Permanent survey instance (never expires)
   - All 5 database tables with RLS policies
   - Ready to use immediately!

3. **Verify Setup**
   ```sql
   -- Check if survey exists
   SELECT * FROM survey_instances WHERE trigger_type = 'always_available';
   
   -- Should return 1 row with status = 'active' and expires_at = NULL
   ```

### Member Access

Members can now:
1. Go to `/survey`
2. See "Feedback & Saran DLOB" card
3. Click "Mulai Survey" and start chatting with AI
4. Choose anonymous or named feedback
5. Discuss any topic they want

---

## 📊 Database Queries (Useful)

### Get All Active Surveys for a Member

```sql
SELECT si.*
FROM survey_instances si
LEFT JOIN survey_responses sr 
  ON si.id = sr.instance_id 
  AND sr.member_id = 'user-uuid'
WHERE si.status = 'active'
  AND si.expires_at > NOW()
  AND (sr.completion_status IS NULL OR sr.completion_status != 'completed');
```

### Get Survey Response Rate

```sql
SELECT 
  si.title,
  COUNT(DISTINCT sr.member_id) as responses,
  (COUNT(DISTINCT sr.member_id)::float / (SELECT COUNT(*) FROM members) * 100) as response_rate_percent
FROM survey_instances si
LEFT JOIN survey_responses sr ON si.id = sr.instance_id
WHERE si.id = 'instance-uuid'
GROUP BY si.id, si.title;
```

### Get Top Topics Across All Surveys

```sql
SELECT 
  topic,
  COUNT(*) as frequency
FROM survey_responses,
  LATERAL unnest(key_topics) as topic
WHERE completion_status = 'completed'
GROUP BY topic
ORDER BY frequency DESC
LIMIT 10;
```

### Get Sentiment Trends Over Time

```sql
SELECT 
  DATE_TRUNC('week', sr.completed_at) as week,
  AVG(sr.sentiment_score) as avg_sentiment,
  COUNT(*) as responses
FROM survey_responses sr
WHERE sr.completion_status = 'completed'
GROUP BY week
ORDER BY week DESC;
```

---

## 🎨 Customization Options

### 1. Change AI Personality

Edit in `src/app/api/survey/chat/route.ts`:

```typescript
const prompt = `You are a friendly AI assistant conducting a survey...

// Modify personality:
- [Current] Friendly and casual in Bahasa Indonesia
- [Option] Professional and formal
- [Option] Humorous and playful
- [Option] Empathetic and understanding
`;
```

### 2. Add New Survey Template

```sql
INSERT INTO survey_templates (title, description, type, trigger_type, questions)
VALUES (
  'Skill Assessment Survey',
  'Self-evaluation untuk perkembangan skill',
  'skill_assessment',
  'monthly',
  '[
    {
      "id": "q1_level",
      "type": "rating",
      "question": "Seberapa percaya diri Anda dengan skill bermain saat ini? (1-5)",
      "scale": 5,
      "required": true
    },
    {
      "id": "q2_improvement",
      "type": "conversational",
      "question": "Aspek mana yang ingin Anda tingkatkan?",
      "required": true
    }
  ]'::jsonb
);
```

### 3. Custom Sentiment Scoring

Modify `analyzeSentiment()` in `src/app/api/survey/chat/route.ts`:

```typescript
// Add domain-specific keywords
const badmintonPositive = ['seru', 'asyik', 'seimbang', 'cocok', 'bagus'];
const badmintonNegative = ['capek', 'berat', 'panas', 'penuh', 'telat'];

// Weight badminton-specific terms higher
if (hasBadmintonPositiveTerms) score += 0.2;
if (hasBadmintonNegativeTerms) score -= 0.2;
```

---

## 🔐 Security & Privacy

### Row Level Security (RLS)

Already configured:
- ✅ Members can only see/edit their own responses
- ✅ Admins can view all responses (for insights)
- ✅ Only admins can create/manage templates and instances
- ✅ Everyone can view published insights

### Data Privacy

- Individual responses are private (RLS enforced)
- Insights are aggregated and anonymized
- No personally identifiable information in insights
- Member names not exposed in AI analysis

---

## 🧪 Testing Guide

### 1. Test Conversational Survey

```typescript
// Simulate member taking survey
1. Create test survey instance (use seed template)
2. Navigate to /survey as logged-in member
3. Click "Mulai Survey"
4. Have conversation with AI:
   - Answer questions naturally
   - Try short/long answers
   - Test emoji responses
   - Verify completion flow
```

### 2. Test Sentiment Analysis

```typescript
// Test different sentiment scenarios

// Positive Response:
"Latihan hari ini luar biasa! Pasangan mainnya cocok dan lapangan bagus. Puas banget!"
// Expected: sentiment_score ≈ 0.7-0.9, label: 'positive'

// Negative Response:
"Kurang puas. Lapangan terlalu panas dan pasangan main tidak seimbang."
// Expected: sentiment_score ≈ -0.5 to -0.7, label: 'negative'

// Neutral Response:
"Standar saja. Tidak ada yang istimewa."
// Expected: sentiment_score ≈ -0.2 to 0.2, label: 'neutral'
```

### 3. Test AI Insights Generation

```sql
-- Ensure at least 3+ completed responses
SELECT COUNT(*) FROM survey_responses 
WHERE instance_id = 'test-instance' AND completion_status = 'completed';

-- Generate insights via API or admin UI
POST /api/survey/insights
{
  "instanceId": "test-instance-uuid"
}

-- Verify insights created
SELECT * FROM survey_insights WHERE instance_id = 'test-instance';
```

---

## 📈 Analytics & Reporting

### Key Metrics to Track

1. **Response Rate**
   - Target: >60% for post-event surveys
   - Track: Responses / Total Active Members

2. **Completion Rate**
   - Target: >80% of started surveys
   - Track: Completed / Started

3. **Sentiment Trends**
   - Healthy: avg_sentiment > 0.3
   - Warning: avg_sentiment 0 to 0.3
   - Critical: avg_sentiment < 0

4. **Response Time**
   - Target: <3 minutes average
   - Track: time_spent_seconds

### Export Survey Data

```sql
-- Export responses as JSON
COPY (
  SELECT 
    sr.id,
    m.full_name,
    sr.answers,
    sr.sentiment_score,
    sr.sentiment_label,
    sr.key_topics,
    sr.completed_at
  FROM survey_responses sr
  JOIN members m ON sr.member_id = m.user_id
  WHERE sr.instance_id = 'instance-uuid'
    AND sr.completion_status = 'completed'
) TO '/tmp/survey_export.json';
```

---

## 🚨 Troubleshooting

### Issue: AI Not Responding

**Cause:** Gemini API key invalid or quota exceeded

**Solution:**
```bash
# Check API key
echo $GEMINI_API_KEY

# Test API directly
curl https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=$GEMINI_API_KEY

# Check quota: https://aistudio.google.com/app/apikey
```

### Issue: Survey Not Showing for Members

**Cause:** RLS policy or survey status

**Solution:**
```sql
-- Check survey status
SELECT * FROM survey_instances WHERE id = 'instance-uuid';
-- Ensure: status = 'active', expires_at > NOW()

-- Check if member already completed
SELECT * FROM survey_responses 
WHERE instance_id = 'instance-uuid' 
  AND member_id = 'user-uuid';
```

### Issue: Insights Generation Fails

**Cause:** No completed responses or AI parsing error

**Solution:**
```sql
-- Verify completed responses exist
SELECT COUNT(*) FROM survey_responses 
WHERE instance_id = 'instance-uuid' 
  AND completion_status = 'completed';

-- Check error logs in API route
-- Ensure JSON parsing from AI response is working
```

---

## 🌟 Best Practices

### 1. Survey Frequency
- **Post-Event:** After every routine match ✅
- **Monthly Check-in:** 1st of each month
- **Quarterly:** Deep-dive feature planning
- **Avoid:** More than 2 surveys per week

### 2. Question Design
- **Do:** Ask open-ended conversational questions
- **Do:** Keep surveys under 5 questions
- **Don't:** Use technical jargon
- **Don't:** Ask leading questions

### 3. Insights Utilization
- **Weekly:** Review post-event feedback
- **Monthly:** Act on top improvement areas
- **Quarterly:** Prioritize feature requests
- **Always:** Share insights with community

### 4. Member Engagement
- **Incentivize:** Acknowledge active survey participants
- **Communicate:** Share how feedback improved platform
- **Respect:** Keep surveys short and valuable
- **Thank:** Auto-thank message after completion

---

## 🔮 Future Enhancements

### Phase 2 Features (Optional)
1. **WhatsApp Integration**
   - Send survey links via WhatsApp
   - Collect responses via chat

2. **Voice Surveys**
   - Members can speak responses
   - AI transcribes and analyzes

3. **Predictive Analytics**
   - Predict member satisfaction trends
   - Identify at-risk members

4. **Smart Nudges**
   - AI determines optimal survey timing
   - Personalized survey invitations

5. **Multi-Language Support**
   - Auto-detect member language
   - Support English + Indonesian

---

## 📞 Support

For implementation help or questions:
- Refer to code comments in API routes
- Check Supabase dashboard for data issues
- Review Google AI Studio for API issues
- Test with small sample before full rollout

---

## ✅ Launch Checklist

Before going live:

- [ ] Database schema deployed to production Supabase
- [ ] Environment variables added to Vercel
- [ ] Google AI API key configured and tested
- [ ] Survey navigation added to member dashboard
- [ ] Seed templates created and verified
- [ ] RLS policies tested with test users
- [ ] First survey instance created
- [ ] Admin dashboard access configured
- [ ] Test survey completed end-to-end
- [ ] Insights generation tested with sample data

---

**Ready to deploy!** 🚀

This AI survey system will help DLOB Community:
- ✅ Gather valuable feedback effortlessly
- ✅ Understand member sentiment automatically
- ✅ Make data-driven decisions
- ✅ Improve offline programs continuously
- ✅ Engage members meaningfully
