# API Integration Guide: Campaign Monitor & GA4

## Overview

This guide covers the setup and verification of two key backend integrations:
1. **Campaign Monitor API** — syncs email campaign sends into tasks
2. **GA4 API** — fetches brand website traffic metrics

Both services are implemented in the backend but require configuration via environment variables on Railway.

---

## Campaign Monitor API Integration

### What It Does
- Fetches sent email campaigns from Campaign Monitor API
- Creates/updates email-send tasks automatically
- Runs on a weekly schedule (configurable via cron) OR manually via UI button
- Deduplicates using `externalId` (Campaign Monitor ID)

### Files
- **Service:** `backend/src/services/campaignMonitor.ts` (lines 1-273)
- **Route:** `backend/src/routes/campaignMonitor.ts`
  - `POST /api/campaign-monitor/sync` — manual trigger (requires edit access)
  - `POST /api/campaign-monitor/seed-test-data` — populate test data
- **Scheduler:** `backend/src/server.ts` (lines 172-185)

### Required Environment Variables

```bash
# Campaign Monitor API key (from your Account Settings)
CAMPAIGN_MONITOR_API_KEY=your-api-key-here

# Optional: set to 'true' to enable weekly syncing (default: false)
CAMPAIGN_MONITOR_SYNC_ENABLED=true

# Optional: cron schedule for weekly sync (default: '0 18 * * 0' = Sunday 6pm UTC)
CAMPAIGN_MONITOR_SYNC_SCHEDULE=0 18 * * 0
```

### How to Get Your API Key
1. Log into Campaign Monitor
2. Go to **Account Settings** → **API Keys**
3. Copy your API key
4. Add to Railway environment variables

### Testing the Integration

#### Test 1: Manual Sync Endpoint
```bash
# From browser console (via Railway URL):
fetch('/api/campaign-monitor/sync', { 
  method: 'POST',
  credentials: 'include'  // includes session cookie
}).then(r => r.json()).then(console.log)

# Expected response (on success):
{
  success: true,
  message: "Synced 5 new and 2 updated send(s) from 2 client(s), 7 campaign(s) in range.",
  clientsProcessed: 2,
  campaignsSeen: 7,
  created: 5,
  updated: 2,
  skipped: 0,
  errors: []
}

# If GA4 not configured:
{
  success: false,
  message: "CAMPAIGN_MONITOR_API_KEY is not set — sync skipped.",
  errors: ["CAMPAIGN_MONITOR_API_KEY missing"]
}
```

#### Test 2: Check Synced Tasks
After running sync, visit the Calendar tab. You should see completed email-send tasks with:
- ✓ Checkmark (completed)
- Brand color coding
- Cost (£) displayed
- Recipient count
- Date matches Campaign Monitor send date

#### Test 3: Scheduled Sync
If `CAMPAIGN_MONITOR_SYNC_ENABLED=true`, the server logs will show:
```
[campaign-monitor] weekly sync scheduled: "0 18 * * 0"
[campaign-monitor] scheduled sync starting...
[campaign-monitor] scheduled sync finished: {"success":true,...}
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Invalid API key | Verify key in Campaign Monitor Account Settings |
| `Campaign Monitor API 404` | API path error | Ensure endpoint uses `api.createsend.com` (not `api.campaignmonitor.com`) |
| No sync runs | `CAMPAIGN_MONITOR_SYNC_ENABLED` not set | Add `CAMPAIGN_MONITOR_SYNC_ENABLED=true` to Railway vars |
| Duplicate tasks | externalId not set | Database includes `externalId` column — sync should dedupe automatically |
| Cost shows as null | Plan doesn't expose cost field | Set `cost` TBD in Calendar UI — not all plans expose cost |

---

## GA4 Integration

### What It Does
- Fetches live website traffic (sessions, active users) for each brand
- Queries past 7 days AND past month per brand property
- Shows on Dashboard "Website Traffic" widget
- No local caching — fetches on every Dashboard load

### Files
- **Service:** `backend/src/services/ga4.ts` (lines 1-181)
- **Route:** `backend/src/routes/analytics.ts` (line 6-9)
  - `GET /api/analytics/ga4` — fetch brand traffic
- **Frontend:** `src/screens/DashboardScreen.tsx` (lines 150-156)

### Required Environment Variables

```bash
# Google Cloud service account JSON (see below how to generate)
GA4_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# GA4 property IDs for each brand
GA4_PROPERTY_ID_MTECH=123456789
GA4_PROPERTY_ID_BRENTWOOD=234567890
GA4_PROPERTY_ID_RADIO_LINKS=345678901
GA4_PROPERTY_ID_CAPCOM=456789012
GA4_PROPERTY_ID_IRCL=567890123
GA4_PROPERTY_ID_IDARO=678901234
```

### How to Set Up GA4

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: **MTech Analytics**
3. Enable the **Google Analytics Data API** (Search → "Analytics Data API" → Enable)

#### Step 2: Create a Service Account
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
   - Name: `ai-office-analytics`
   - Click **Create and Continue**
3. Grant roles: **Viewer** (for Analytics)
4. Click **Create Key** → JSON → Download
5. Copy the entire JSON content

#### Step 3: Add to Railway
1. Open Railway project settings
2. Add environment variable:
   - Key: `GA4_SERVICE_ACCOUNT_JSON`
   - Value: Paste the entire JSON (as is, as a single-line string)

#### Step 4: Add Property IDs
1. Go to Google Analytics 4 → Admin → Property Settings
2. Copy the **Property ID** (numeric)
3. Add to Railway as `GA4_PROPERTY_ID_{BRAND}` for each brand

#### Step 5: Grant Service Account Access
1. In GA4, go to **Admin** → **Property Access Management**
2. Add the service account email (from JSON: `client_email`)
3. Grant **Viewer** role

### Testing the Integration

#### Test 1: Fetch GA4 Data
```bash
# From browser console (via Railway URL):
fetch('/api/analytics/ga4', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

# Expected response (on success):
{
  configured: true,
  brands: [
    {
      brand: "brentwood",
      sessionsWeek: 1234,
      usersWeek: 456,
      sessionsMonth: 5678,
      usersMonth: 1200
    },
    ... (one per configured brand)
  ],
  errors: []
}

# If GA4 not configured:
{
  configured: false,
  brands: [],
  errors: [
    "GA4 is not configured — set GA4_SERVICE_ACCOUNT_JSON and at least one GA4_PROPERTY_ID_* variable."
  ]
}
```

#### Test 2: Dashboard Widget
1. Visit the Dashboard (any user)
2. Look for **Website Traffic** section (right side)
3. You should see:
   - Brand names with traffic metrics
   - Sessions & users for this week
   - Sessions & users for this month
   - Green = configured, red text = error

#### Test 3: Check Logs
Server logs will show:
```
[ga4] failed to get access token: ...  (if key is invalid)
[ga4] failed to fetch traffic for brentwood: ...  (if property ID is wrong)
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` | Service account not granted access | Add service account email to GA4 Property Access Management |
| `404 Property not found` | Wrong property ID | Verify ID in GA4 → Admin → Property Settings |
| `JWT signing failed` | Invalid service account JSON | Check JSON is valid (copy entire downloaded file) |
| Widget shows "GA4 is not configured" | Missing env vars | Set both `GA4_SERVICE_ACCOUNT_JSON` and at least one `GA4_PROPERTY_ID_*` |
| Traffic shows as 0 | No traffic in that period | Normal if site had no visits that day — will update as traffic accrues |

---

## Verification Checklist

### Campaign Monitor
- [ ] `CAMPAIGN_MONITOR_API_KEY` set in Railway
- [ ] Manual sync endpoint returns `success: true`
- [ ] Calendar shows completed email-send tasks from last 7 days
- [ ] Task costs and recipient counts display correctly
- [ ] (Optional) `CAMPAIGN_MONITOR_SYNC_ENABLED=true` and sync runs on schedule

### GA4
- [ ] `GA4_SERVICE_ACCOUNT_JSON` set in Railway (valid JSON)
- [ ] Service account has Viewer role in GA4 property
- [ ] At least one `GA4_PROPERTY_ID_*` set
- [ ] `/api/analytics/ga4` endpoint returns `configured: true`
- [ ] Dashboard Website Traffic widget displays metrics

---

## Local Testing (Offline)

Both services have defensive coding and return graceful errors when environment variables are missing. To test locally without API credentials:

### Campaign Monitor Mock Test
```bash
# Mock: No API key → returns success: false
cd backend
NODE_ENV=development npm run dev
# POST /api/campaign-monitor/sync
# → response: {"success":false, "message":"CAMPAIGN_MONITOR_API_KEY is not set..."}
```

### GA4 Mock Test
```bash
# Mock: No GA4 config → returns configured: false
# GET /api/analytics/ga4
# → response: {"configured":false, "brands":[], "errors":[...]}
```

---

## Next Steps

1. **Get Campaign Monitor API Key** from your Account Settings
2. **Set up Google Cloud Project** for GA4 (service account + property IDs)
3. **Add both** to Railway environment variables
4. **Test** using the console commands above
5. **Monitor** server logs for sync successes/errors

Both integrations are production-ready once configured. No code changes needed.

