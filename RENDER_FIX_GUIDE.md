# Fix Render Deployment - Manual Configuration

## Problem
Render is running `npm install` in the root directory (frontend) instead of backend, causing dotenv package not found error.

## Solution: Update Render Service Settings

### Step 1: Go to Render Dashboard
1. Open https://render.com
2. Click on your **otpas-hu-backend** service
3. Click **Settings** tab

### Step 2: Update Build Command
1. Find **Build Command** field
2. Change from:
   ```
   cd backend && npm install
   ```
   To:
   ```
   npm install
   ```

### Step 3: Update Start Command
1. Find **Start Command** field
2. Change from:
   ```
   cd backend && npm start
   ```
   To:
   ```
   npm start
   ```

### Step 4: Add Root Directory
1. Find **Root Directory** field (if available)
2. Enter:
   ```
   backend
   ```

### Step 5: Save Settings
1. Click **Save** button
2. Render will automatically redeploy

### Step 6: Wait for Deployment
- Watch the logs
- Should see: `[SUCCESS] Server running on port 3000`
- Test: `https://otpas-hu-backend.onrender.com/`

---

## Alternative: Delete and Redeploy

If the above doesn't work:

1. **Delete current service**
   - Go to Settings
   - Scroll to bottom
   - Click "Delete Service"
   - Confirm deletion

2. **Create new service**
   - Click "New +" → "Web Service"
   - Connect GitHub: `Abdulhakimkamal/OTPAS-HU`
   - **Important**: Select **Root Directory: `backend`**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

3. **Add Environment Variables**
   - NODE_ENV=production
   - PORT=3000
   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
   - JWT_SECRET
   - CORS_ORIGIN

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes

---

## Expected Success Output

```
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
[SUCCESS] Server running on port 3000
[INFO] Environment: production
[INFO] URL: http://localhost:3000
```

## Test Health Check

Open in browser:
```
https://otpas-hu-backend.onrender.com/
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "timestamp": "2026-02-13T..."
}
```

---

## Troubleshooting

### Still getting "Cannot find package 'dotenv'"
- Verify Root Directory is set to `backend`
- Clear build cache and redeploy
- Check backend/package.json has dotenv in dependencies

### Port not detected
- Ensure PORT=3000 in environment variables
- Check server.js has `app.listen(PORT, '0.0.0.0')`

### Build still fails
- Delete service and create new one
- Make sure to set Root Directory to `backend`

---

## Quick Checklist

- [ ] Go to Render service settings
- [ ] Update Build Command to: `npm install`
- [ ] Update Start Command to: `npm start`
- [ ] Set Root Directory to: `backend`
- [ ] Save settings
- [ ] Wait for redeploy (5-10 min)
- [ ] Check logs for success
- [ ] Test health check endpoint
