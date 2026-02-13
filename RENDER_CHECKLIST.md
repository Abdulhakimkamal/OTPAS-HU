# Render Deployment Checklist

## Pre-Deployment ✅

- [x] server.js updated with PORT 3000
- [x] Health check route added
- [x] package.json start script verified
- [x] .env.example updated for Render
- [x] render.yaml created
- [x] Graceful shutdown handlers added
- [x] Code pushed to GitHub

## Render Setup

### Database Setup
- [ ] Go to https://render.com
- [ ] Create PostgreSQL database
  - [ ] Name: `otpas-hu-db`
  - [ ] Database: `academic_compass`
  - [ ] User: `postgres`
  - [ ] Plan: Free
- [ ] Wait for database to be ready (5-10 min)
- [ ] Copy Internal Database URL
- [ ] Note down: Host, Port, User, Password

### Web Service Setup
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
  - [ ] Select: `Abdulhakimkamal/OTPAS-HU`
- [ ] Fill deployment details:
  - [ ] Name: `otpas-hu-backend`
  - [ ] Environment: `Node`
  - [ ] Build Command: `cd backend && npm install`
  - [ ] Start Command: `cd backend && npm start`
  - [ ] Plan: Free
- [ ] Click "Create Web Service"

### Environment Variables
- [ ] Go to "Environment" tab
- [ ] Add variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `3000`
  - [ ] `DB_HOST` = (from database)
  - [ ] `DB_PORT` = `5432`
  - [ ] `DB_NAME` = `academic_compass`
  - [ ] `DB_USER` = `postgres`
  - [ ] `DB_PASSWORD` = (from database)
  - [ ] `JWT_SECRET` = (generate random 32+ chars)
  - [ ] `CORS_ORIGIN` = `https://your-frontend.onrender.com`
- [ ] Click "Save"

## Deployment

- [ ] Wait for deployment to complete (2-5 min)
- [ ] Check logs for errors
- [ ] Verify: "Server running on port 3000"
- [ ] Note your backend URL: `https://otpas-hu-backend.onrender.com`

## Post-Deployment Testing

### Health Check
- [ ] Open: `https://otpas-hu-backend.onrender.com/`
- [ ] Verify response:
  ```json
  {
    "success": true,
    "message": "Server is running",
    "environment": "production",
    "timestamp": "..."
  }
  ```

### API Health
- [ ] Test: `https://otpas-hu-backend.onrender.com/api/health`
- [ ] Should return: `{"success": true, "message": "Server is running"}`

### Database Connection
- [ ] Check logs for: "✅ Database connected successfully"
- [ ] Or: "⚠️ Database connection error" (server still runs)

## Troubleshooting

### Server stays loading
- [ ] Check Render logs
- [ ] Verify PORT = 3000
- [ ] Check build command
- [ ] Verify start command

### Database connection fails
- [ ] Verify DB_HOST is correct
- [ ] Verify DB_PASSWORD is correct
- [ ] Check database is running
- [ ] Verify IP allowlist (if applicable)

### Deployment fails
- [ ] Check build logs
- [ ] Verify `backend/package.json` exists
- [ ] Check all dependencies are listed
- [ ] Verify Node version compatibility

### Slow response time
- [ ] Normal on free tier (cold start)
- [ ] First request: 30+ seconds
- [ ] Subsequent requests: < 1 second

## Frontend Deployment

- [ ] Deploy frontend to Render
- [ ] Get frontend URL: `https://your-frontend.onrender.com`
- [ ] Update backend CORS_ORIGIN with frontend URL
- [ ] Redeploy backend

## Monitoring

- [ ] Set up Render alerts (optional)
- [ ] Monitor logs regularly
- [ ] Check database usage
- [ ] Monitor bandwidth usage

## Success Criteria

✅ All items checked
✅ Health check responds
✅ No errors in logs
✅ Database connected (or gracefully handles error)
✅ Frontend can communicate with backend
✅ API endpoints working

---

**Status**: Ready for Render Deployment 🚀
