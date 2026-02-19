# Report Generation System - Guide

## Overview

Sistem **Report Generation** untuk DLOB Community memungkinkan pembuatan laporan PDF profesional dengan fitur:

✅ **Export to PDF** - Laporan berkualitas tinggi dengan branding DLOB
✅ **Chart Integration** - Chart dari dashboard otomatis tertangkap dalam PDF
✅ **Native Sharing** - Share langsung via Web Share API (mobile/desktop)
✅ **Download Fallback** - Download otomatis jika sharing tidak tersedia
✅ **Professional Layout** - Layout profesional dengan logo DLOB

## Tech Stack

```json
{
  "@react-pdf/renderer": "^4.3.2",  // PDF generation
  "html2canvas": "^1.4.1",          // Chart capture
  "Web Share API": "Native"          // Native sharing
}
```

## Architecture

```
📁 src/
├── 📁 lib/
│   └── reportGenerator.ts           # Utility functions
├── 📁 components/reports/
│   ├── MemberPerformanceReport.tsx  # Member report template
│   └── AdminFinancialReport.tsx     # Admin report template
└── 📁 hooks/
    └── useReportGenerator.tsx       # Main hook untuk generate reports
```

## Quick Start - Member Performance Report

### 1. Import Hook

```tsx
import { useReportGenerator } from '@/hooks/useReportGenerator';
```

### 2. Initialize Hook

```tsx
const { 
  generateMemberReport, 
  isGenerating, 
  error 
} = useReportGenerator();
```

### 3. Prepare Data

```tsx
const reportData = {
  memberName: 'John Doe',
  memberEmail: 'john@dlob.com',
  stats: {
    totalMatches: 25,
    winRate: 72.5,
    singlesWinRate: 0,      // DLOB is doubles-only
    doublesWinRate: 72.5,
    attendanceRate: 85.0,
    currentRank: 5,
    totalMembers: 50,
  },
  insights: [
    {
      title: 'Excellent Performance',
      description: 'Your 72.5% win rate puts you in top performers',
      type: 'strength' as const,
    },
    {
      title: 'Improve Consistency',
      description: 'Focus on maintaining performance in tough matches',
      type: 'improvement' as const,
    },
  ],
};
```

### 4. Generate Report

```tsx
// Download PDF
async function handleDownload() {
  const result = await generateMemberReport(reportData, {
    chartElementId: 'performance-chart',  // Optional: capture chart
    share: false,                          // Download instead of share
  });
  
  if (result.success) {
    console.log('Report generated:', result.filename);
  }
}

// Share PDF
async function handleShare() {
  const result = await generateMemberReport(reportData, {
    chartElementId: 'performance-chart',
    share: true,  // Use native sharing
  });
}
```

### 5. Add UI Buttons

```tsx
<button
  onClick={handleDownload}
  disabled={isGenerating}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
>
  <Download className="w-4 h-4" />
  {isGenerating ? 'Generating...' : 'Download PDF'}
</button>

<button
  onClick={handleShare}
  disabled={isGenerating}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  <Share2 className="w-4 h-4" />
  Share PDF
</button>
```

### 6. Chart Integration (Optional)

To include a chart in the PDF, add an ID to the chart container:

```tsx
<div id="performance-chart">
  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={monthlyData}>
      {/* Chart components */}
    </BarChart>
  </ResponsiveContainer>
</div>
```

## Quick Start - Admin Financial Report

### 1. Prepare Financial Data

```tsx
const financialData = {
  period: {
    start: '1 Januari 2026',
    end: '31 Januari 2026',
  },
  summary: {
    totalRevenue: 15000000,      // IDR
    totalPending: 5,              // count
    totalPaid: 45,                // count
    totalMembers: 50,
    paymentRate: 90.0,            // percentage
  },
  payments: [
    {
      memberName: 'John Doe',
      type: 'Monthly Fee',
      amount: 300000,
      status: 'paid' as const,
      dueDate: '2026-01-15',
      paidDate: '2026-01-14',
    },
    // ... more payments
  ],
};
```

### 2. Generate Financial Report

```tsx
const { generateFinancialReport } = useReportGenerator();

async function handleGenerateFinancialReport() {
  const result = await generateFinancialReport(financialData, {
    chartElementId: 'revenue-chart',
    share: false,
  });
  
  if (result.success) {
    console.log('Financial report generated');
  }
}
```

## Live Example - Analytics Page

Already implemented in: `src/app/dashboard/analitik/page.tsx`

### Key Features:
- ✅ Download PDF button
- ✅ Share PDF button  
- ✅ Chart auto-capture
- ✅ AI insights included
- ✅ Loading states
- ✅ Error handling

### Code Snippet:

```tsx
// Report generation handler
async function handleGenerateReport(share: boolean = false) {
  const reportData = {
    memberName,
    memberEmail: user?.email || 'member@dlob.com',
    stats: {
      totalMatches: stats.totalMatches,
      winRate: stats.winRate,
      doublesWinRate: stats.winRate,
      // ... other stats
    },
    insights: aiInsights.map(insight => ({
      title: insight.title,
      description: insight.description,
      type: insight.type === 'positive' ? 'strength' : 'improvement',
    })),
  };

  const result = await generateMemberReport(reportData, {
    chartElementId: 'performance-chart',
    share,
  });
}

// UI Buttons
<button onClick={() => handleGenerateReport(false)}>
  <Download />Download PDF
</button>
<button onClick={() => handleGenerateReport(true)}>
  <Share2 />Share PDF
</button>
```

## Customization

### 1. Custom Logo

Change logo in `reportGenerator.ts`:

```ts
export async function getLogoAsBase64(
  logoPath: string = '/icon-dlob-putih.png'  // Change here
): Promise<string> {
  // ...
}
```

### 2. Custom PDF Styles

Edit styles in `MemberPerformanceReport.tsx` or `AdminFinancialReport.tsx`:

```ts
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: '#yourcolor',  // Customize
    // ...
  },
  // ... other styles
});
```

### 3. Custom Report Fields

Add new fields to report data interface:

```tsx
export interface MemberReportData {
  memberName: string;
  memberEmail: string;
  customField: string;  // Add custom field
  // ...
}
```

Then use in PDF template:

```tsx
<Text>{data.customField}</Text>
```

## Best Practices

### 1. **Always Handle Errors**

```tsx
const result = await generateMemberReport(data);
if (!result.success) {
  alert(\`Failed: \${result.error}\`);
}
```

### 2. **Check Data Before Generating**

```tsx
if (!memberName || stats.totalMatches === 0) {
  alert('No data available for report');
  return;
}
```

### 3. **Use Loading States**

```tsx
<button disabled={isGenerating}>
  {isGenerating ? 'Generating...' : 'Download PDF'}
</button>
```

### 4. **Optimize Chart Capture**

- Keep chart containers simple
- Avoid animations during capture
- Use solid backgrounds
- Test on mobile devices

### 5. **File Naming**

The system auto-generates filenames:
```
DLOB_Performance_Report_John_Doe_2026-02-19.pdf
DLOB_Financial_Report_2026-02-19.pdf
```

Customize in `generateReportFilename()` function.

## Platform Support

### Web Share API Support:
- ✅ iOS Safari 12.2+
- ✅ Android Chrome 75+
- ✅ macOS Safari 14+
- ✅ Windows Edge 93+
- ❌ Desktop Chrome (falls back to download)
- ❌ Desktop Firefox (falls back to download)

### Fallback Behavior:
When sharing is not available, the system automatically downloads the PDF.

## Troubleshooting

### Issue: Chart not appearing in PDF

**Solution:**
1. Verify element ID matches: `chartElementId: 'performance-chart'`
2. Ensure chart is rendered before generating report
3. Check chart has solid background color

### Issue: Logo not showing

**Solution:**
1. Verify logo file exists in `/public`
2. Check logo path in `getLogoAsBase64()`
3. Ensure logo is PNG format

### Issue: PDF too large

**Solution:**
1. Reduce chart quality: `scale: 1` instead of `scale: 2`
2. Compress logo image
3. Limit data in tables (e.g., top 10 instead of all)

### Issue: Sharing not working

**Solution:**
1. Check browser support (see Platform Support)
2. Verify HTTPS (Web Share API requires secure context)
3. Fallback to download will occur automatically

## Adding to New Pages

### Step 1: Import Hook

```tsx
import { useReportGenerator } from '@/hooks/useReportGenerator';
```

### Step 2: Add Hook to Component

```tsx
const { generateMemberReport, isGenerating } = useReportGenerator();
```

### Step 3: Create Report Handler

```tsx
async function handleReport() {
  const data = {
    // ... prepare your data
  };
  
  await generateMemberReport(data, { share: false });
}
```

### Step 4: Add Button

```tsx
<button onClick={handleReport} disabled={isGenerating}>
  Generate Report
</button>
```

## API Reference

### `useReportGenerator()`

Returns object with:
- `generateMemberReport(data, options)` - Generate member report
- `generateFinancialReport(data, options)` - Generate financial report
- `isGenerating` - Boolean loading state
- `error` - Error message if generation fails

### Options

```ts
{
  chartElementId?: string;  // ID of chart to capture
  share?: boolean;          // true = share, false = download
}
```

### Return Value

```ts
{
  success: boolean;
  filename?: string;  // If successful
  error?: string;     // If failed
}
```

## Future Enhancements

### Planned Features:
- [ ] Multi-page reports
- [ ] Custom templates builder
- [ ] Batch report generation
- [ ] Email report delivery
- [ ] Scheduled reports
- [ ] Report analytics/tracking
- [ ] Custom branding per member type

## Support

For issues or questions:
1. Check this guide first
2. Review example implementation in `analitik/page.tsx`
3. Check browser console for errors
4. Test on different devices/browsers

## Credits

Built with:
- @react-pdf/renderer - PDF generation
- html2canvas - Chart capture
- Web Share API - Native sharing

---

**Last Updated:** February 19, 2026
**Version:** 1.0.0
**Maintained by:** DLOB Platform Team
