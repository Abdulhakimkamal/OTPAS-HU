# OTPAS-HU Render Deployment Guide

## Overview
This guide explains how to deploy OTPAS-HU backend to Render.com (free tier).

## Prerequisites
- GitHub account with OTPAS-HU repository pushed
- Render.com account (free)
- PostgreSQL database on Render

## Step 1: Create PostgreSQL Database on Render

1. Go to https://render.com
2. Click "New +" → "PostgreSQL"
3. Fill in details:
   - **Name**: `otpas-hu-db`
   - **Database**: `academic_compass`
   - **User**: `postgres`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. Wait for database to be created (5-10 minutes)
6. Copy the **Internal Database URL** (you'll need this)

## Step 2: Deploy Backend to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository:
   - Click "Connect account" if needed
   - Select `Abdulhakimkamal/OTPAS-HU`
4. Fill in deployment details:
   - **Name**: `otpas-hu-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
5. Click "Create Web Service"

## Step 3: Configure Environment Variables

In Render dashboard for your web service:

1. Go to "Environment" tab
2. Add these variables:

```
NODE_ENV=production
PORT=3000
DB_HOST=<your-database-host>
DB_PORT=5432
DB_NAME=academic_compass
DB_USER=postgres
DB_PASSWORD=<your-database-password>
JWT_SECRET=<generate-a-random-string-min-32-chars>
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

3. Click "Save"

## Step 4: Deploy

1. Render will automatically deploy when you save environment variables
2. Wait for deployment to complete (2-5 minutes)
3. Check the logs to ensure server started successfully
4. Your backend URL will be: `https://otpas-hu-backend.onrender.com`

## Step 5: Test Your Deployment

Open in browser:
```
https://otpas-hu-backend.onrender.com/
```

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "timestamp": "2026-02-13T..."
}
```

## Step 6: Initialize Database

After deployment, initialize the database:

1. SSH into Render service (if available)
2. Or run migrations manually:
   ```bash
   node backend/scripts/init-database.js
   ```

## Troubleshooting

### Server stays loading
- Check logs in Render dashboard
- Ensure PORT is set to 3000
- Verify database connection string

### Database connection error
- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check database is running on Render
- Ensure IP allowlist includes Render service

### Port already in use
- Render automatically assigns PORT via environment variable
- Don't hardcode port in code

### Deployment fails
- Check build logs
- Ensure `backend/package.json` exists
- Verify all dependencies are listed

## Important Notes

### Free Tier Limitations
- Server spins down after 15 minutes of inactivity
- First request after spin-down takes 30+ seconds
- Database has limited storage (256MB)
- Limited bandwidth

### Production Recommendations
- Use paid tier for production
- Set up monitoring and alerts
- Use environment variables for secrets
- Enable auto-deploy on GitHub push

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| NODE_ENV | Yes | production |
| PORT | Yes | 3000 |
| DB_HOST | Yes | dpg-xxx.onrender.com |
| DB_PORT | Yes | 5432 |
| DB_NAME | Yes | academic_compass |
| DB_USER | Yes | postgres |
| DB_PASSWORD | Yes | your_password |
| JWT_SECRET | Yes | random_string_32_chars_min |
| CORS_ORIGIN | Yes | https://frontend-url.onrender.com |

## Deployment Checklist

- [ ] GitHub repository pushed
- [ ] PostgreSQL database created on Render
- [ ] Web service created on Render
- [ ] Environment variables configured
- [ ] Deployment completed successfully
- [ ] Health check endpoint responds
- [ ] Database connection verified
- [ ] CORS configured for frontend

## Support

For issues:
1. Check Render logs
2. Verify environment variables
3. Test database connection
4. Check GitHub repository is up to date

## Next Steps

1. Deploy frontend to Render
2. Update CORS_ORIGIN with frontend URL
3. Set up monitoring
4. Configure custom domain (optional)
