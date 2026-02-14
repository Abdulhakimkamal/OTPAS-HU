# Manual Frontend Deployment on Render

## Problem
The frontend needs to be deployed as a separate static site service on Render, not through render.yaml.

## Solution: Deploy Frontend Manually on Render

### Step 1: Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Click "New +" button
3. Select "Static Site"

### Step 2: Connect GitHub Repository
1. Click "Connect a repository"
2. Select your GitHub account
3. Find and select: `OTPAS-HU`
4. Click "Connect"

### Step 3: Configure Static Site
Fill in these settings:

| Setting | Value |
|---------|-------|
| Name | `otpas-hu` |
| Root Directory | (leave empty) |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment | Node 22 (default) |

### Step 4: Deploy
1. Click "Create Static Site"
2. Wait for build to complete (3-5 minutes)
3. Once live, visit the URL provided

### Step 5: Verify
Your frontend will be at a URL like: `https://otpas-hu-xxxxx.onrender.com`

Update the backend CORS if needed:
1. Go to backend service settings
2. Find `CORS_ORIGIN` environment variable
3. Update to your new frontend URL
4. Redeploy backend

## Alternative: Use Netlify (Easier)

If you prefer, you can deploy frontend to Netlify instead:

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub
4. Select OTPAS-HU repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy

Netlify is often easier for static sites and has better free tier support.

## Current Status

- ✅ Backend: https://otpas-hu-backend.onrender.com
- ⏳ Frontend: Needs manual deployment
- ✅ Database: PostgreSQL on Render

---

**Next Step**: Deploy frontend using one of the methods above
