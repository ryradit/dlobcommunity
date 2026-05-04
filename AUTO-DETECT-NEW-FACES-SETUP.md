# Auto-Detect New Faces Setup Guide

## How It Works

The **auto-detect endpoint** automatically:
1. ✅ Fetches ALL images from Google Drive folder
2. ✅ Checks which ones ALREADY have face data in database
3. ✅ Processes ONLY the NEW images
4. ✅ Stores results in database
5. ✅ Shows up immediately in the carousel

## Option 1: Manual Run (Quickest)

```powershell
cd "d:\Kerjaan\dlobcommunity-new-dlob-web-2026"
.\auto-detect-new-faces.ps1
```

**When to use:** After uploading new images to Google Drive

---

## Option 2: Windows Task Scheduler (Automatic Daily)

### Step 1: Create Task Scheduler Script
Save this as `C:\scheduled-face-detection.ps1`:

```powershell
# Run face auto-detection every day
$baseUrl = "http://localhost:3000"
$folderId = "1vEBxWbSSh_4UIflg9Duw6RlZVvnrHeSC"
$logFile = "C:\temp\face-detection.log"

# Ensure log directory exists
New-Item -ItemType Directory -Path (Split-Path $logFile) -Force | Out-Null

"$(Get-Date): Starting auto-detection..." | Add-Content $logFile

try {
    $body = @{ folderId = $folderId } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/api/face/auto-process" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 600
    
    $result = $response.Content | ConvertFrom-Json
    "$(Get-Date): ✅ Processed $($result.processedCount) new images" | Add-Content $logFile
}
catch {
    "$(Get-Date): ❌ Error: $($_.Exception.Message)" | Add-Content $logFile
}
```

### Step 2: Create Scheduled Task

**Run this in PowerShell as Administrator:**

```powershell
# Define task parameters
$TaskName = "DLOBFaceDetection"
$ScriptPath = "C:\scheduled-face-detection.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At 03:00AM  # Run at 3 AM daily
$Principal = New-ScheduledTaskPrincipal -UserId SYSTEM -LogonType ServiceAccount
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# Create the task
Register-ScheduledTask -TaskName $TaskName -Trigger $Trigger -Principal $Principal -Action $Action -Settings $Settings -Force

Write-Host "✅ Task scheduled!"
Write-Host "📅 Task: $TaskName"
Write-Host "⏰ Time: Daily at 3:00 AM"
```

**To verify it's running:**
```powershell
Get-ScheduledTask -TaskName "DLOBFaceDetection" | Select-Object State, NextRunTime
```

---

## Option 3: GitHub Actions (For Production)

Create `.github/workflows/face-detection.yml`:

```yaml
name: Auto-Detect New Faces

on:
  schedule:
    - cron: '0 3 * * *'  # Run daily at 3 AM UTC
  workflow_dispatch:     # Allow manual trigger

jobs:
  detect-faces:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Face Detection
        run: |
          curl -X POST http://your-production-url.com/api/face/auto-process \
            -H "Content-Type: application/json" \
            -d '{"folderId":"1vEBxWbSSh_4UIflg9Duw6RlZVvnrHeSC"}'
```

---

## Option 4: Linux Cron Job (For Server)

**Edit crontab:**
```bash
crontab -e
```

**Add this line (runs daily at 3 AM):**
```
0 3 * * * curl -X POST http://localhost:3000/api/face/auto-process \
  -H "Content-Type: application/json" \
  -d '{"folderId":"1vEBxWbSSh_4UIflg9Duw6RlZVvnrHeSC"}'
```

---

## What Gets Detected

✅ **Automatically detected:**
- JPG images
- PNG images  
- HEIC images (from iPhones/iPads)
- WEBP images

✅ **From Google Drive:**
- Any images in the specified folder
- Including subfolders

✅ **Face data extracted:**
- Bounding box (location)
- Confidence score
- Facial landmarks
- Expressions (joy, sorrow, anger)
- Angles (roll, pan, tilt)

---

## Monitoring

### Check if new images were detected:

```powershell
# View database stats
Invoke-WebRequest -Uri "http://localhost:3000/api/face/batch-process?action=stats" -Method GET | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### View processing logs:

**Terminal output:**
```
✅ Detected {N} faces in image {id}
📊 Auto-process complete: X/Y successful
```

**Task Scheduler logs:**
```
C:\temp\face-detection.log
```

---

## Troubleshooting

### Q: Nothing detected
**A:** Make sure the folder ID is correct:
```powershell
# Get your folder ID from the URL
# https://drive.google.com/drive/folders/[FOLDER_ID]
```

### Q: Only processing some images
**A:** Images already in database are skipped (by design). Delete from database to reprocess:
```sql
DELETE FROM latihan_faces WHERE image_id = 'xxx';
```

### Q: Task not running
**A:** Check Task Scheduler:
```powershell
Get-ScheduledTask -TaskName "DLOBFaceDetection" | Get-ScheduledTaskInfo
```

### Q: API timeout
**A:** Increase timeout in the scripts if you have 100+ new images:
```powershell
-TimeoutSec 900  # 15 minutes instead of 600 (10 minutes)
```

---

## Cost Estimation

**Google Vision API costs:**
- $1.50 per 1,000 face detection requests
- Auto-detecting 250 images = $0.38
- Auto-detecting 500 new images = $0.75/month (if added daily)
- Scales with your usage

---

## Summary

| Option | Setup | Cost | Ease |
|--------|-------|------|------|
| Manual Run | 1 command | Free | 🟢 Easy |
| Task Scheduler | ~5 min | Free | 🟡 Medium |
| GitHub Actions | ~5 min | Free* | 🟡 Medium |
| Cron (Linux) | ~2 min | Free | 🟡 Medium |

*GitHub Actions is free for public repos, limited for private with free tier.

---

**Next Step:** Choose your automation option and test with `auto-detect-new-faces.ps1`!
