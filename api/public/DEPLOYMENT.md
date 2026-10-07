# Dashboard Deployment Guide

## What You Have

- `package.json` — Node dependencies
- `api/index.js` — Secure backend proxy (keeps Baserow key hidden)
- `public/dashboard.html` — Frontend dashboard for vendors
- `.env.example` — Your Baserow credentials

## Next Steps: Deploy to Vercel

### Step 1: Create a Vercel Account

1. Go to **vercel.com**
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Done! You now have a Vercel account.

### Step 2: Deploy Your Repository

1. After signing up, you'll see "Import Project"
2. Click **"Import Git Repository"**
3. Paste your GitHub repo URL: `https://github.com/your-username/dashboard-proxy`
4. Click **"Continue"**
5. Click **"Import"**

Vercel will now build your project. Wait for it to finish (usually 30-60 seconds).

### Step 3: Add Environment Variables

1. In Vercel dashboard, click on your project
2. Go to **Settings** (top menu)
3. Click **"Environment Variables"** (left sidebar)
4. Add these 5 variables:

| Name | Value |
|------|-------|
| BASEROW_TOKEN | `uI7xifG0amjvJFF13BDa6HYqw4GvfyWP` |
| BASEROW_DB_ID | `577538` |
| TASKS_TABLE_ID | `1234396` |
| VENDORS_TABLE_ID | `1234485` |
| COMPLETION_LOG_TABLE_ID | `1234577` |

Click **"Save"** after each one.

### Step 4: Redeploy

1. Go back to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

Wait for deployment to finish. You'll get a URL like:
```
https://dashboard-proxy-abc123.vercel.app
```

### Step 5: Update Dashboard URL

1. Go back to GitHub
2. Click on `public/dashboard.html`
3. Click the **pencil icon** to edit
4. Find this line (near the top of the script):
   ```javascript
   const API_BASE_URL = 'https://your-vercel-url-here.vercel.app';
   ```
5. Replace `https://your-vercel-url-here.vercel.app` with your actual Vercel URL
6. Click **"Commit changes..."**

### Step 6: Redeploy Again

1. Go back to Vercel
2. Your new commit will trigger an automatic redeploy
3. Wait for it to finish (green checkmark)

## Your Dashboard is NOW LIVE! 🎉

**Dashboard URL:** `https://dashboard-proxy-abc123.vercel.app` (your actual URL)

## How to Give Access to Vendors

### IDS Vendor:
- **API Key:** `vendor-ids-v2601`

### V2 Solutions Vendor:
- **API Key:** `vendor-v2solutions-v2602`

Send them:
```
Dashboard: https://your-dashboard-url.vercel.app
API Key: vendor-ids-v2601 (or vendor-v2solutions-v2602)
```

They log in with the API key and see only their tasks.

## Security Features

✅ API key NEVER visible to vendors  
✅ Vendors only see their own tasks  
✅ Read-only access (vendors can't modify data)  
✅ Encrypted connection (HTTPS)  

## Troubleshooting

**"Connection error" on login:**
- Check your Vercel URL is correct
- Check environment variables are set in Vercel
- Vercel dashboard → Deployments → Check logs for errors

**"No tasks assigned yet":**
- Tasks may not be assigned to this vendor in Baserow yet
- Add test data to your Baserow TASKS table

**Want to update vendor API keys?**
- Edit `api/index.js` VENDOR_KEYS section
- Commit to GitHub
- Vercel auto-redeploys
