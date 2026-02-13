# Render Deployment - Manual Fix Required

## Problem
Render is looking for "database" directory instead of "backend" directory.

## Solution: Update Render Service Settings Manually

### **IMPORTANT: Do This Now**

1. **Go to Render Dashboard**
   - Open https://render.com
   - Click on your **otpas-hu-backend** service

2. **Click Settings Tab**

3. **Find "Root Directory" Field**
   - Current value: `database` (WRONG)
   - Change to: `backend` (CORRECT)

4. **Verify Build Command**
   - Should be: `npm install`

5. **Verify Start Command**
   - Should be: `npm start`

6. **Click Save**

7. **Redeploy**
   - Go to "Deploys" tab
   - Click "Redeploy" or "Deploy latest"
   - Select "Clear build cache and redeploy"

8. **Wait 5-10 minutes**
   - Check logs for success

---

## Expected Success Logs

```
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
[SUCCESS] Server running on port 3000
[INFO] Environment: production
```

## Test

Open: `https://otpas-hu-backend.onrender.com/`

Should see:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "timestamp": "..."
}
```

---

## Screenshots Guide

### Step 1: Go to Settings
```
Render Dashboard
  → otpas-hu-backend service
    → Settings tab
```

### Step 2: Find Root Directory
```
Look for field labeled "Root Directory"
Current: database
Change to: backend
```

### Step 3: Save
```
Click "Save" button at bottom
```

### Step 4: Redeploy
```
Go to "Deploys" tab
Click "Redeploy" button
Select "Clear build cache and redeploy"
```

---

## If You Can't Find Root Directory Setting

Some Render services don't show Root Directory in UI. In that case:

1. **Delete the service**
   - Settings → Scroll down → "Delete Service"

2. **Create new service**
   - Click "New +" → "Web Service"
   - Connect GitHub: `Abdulhakimkamal/OTPAS-HU`
   - When asked for "Root Directory", enter: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

3. **Add Environment Variables**
   - NODE_ENV=production
   - PORT=3000
   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
   - JWT_SECRET
   - CORS_ORIGIN

4. **Create Service**

---

## Checklist

- [ ] Go to Render Settings
- [ ] Find Root Directory field
- [ ] Change from "database" to "backend"
- [ ] Verify Build Command: `npm install`
- [ ] Verify Start Command: `npm start`
- [ ] Click Save
- [ ] Go to Deploys tab
- [ ] Click Redeploy
- [ ] Wait 5-10 minutes
- [ ] Check logs for success
- [ ] Test health check endpoint

---

**Do this now and let me know when it's fixed!** 🚀
