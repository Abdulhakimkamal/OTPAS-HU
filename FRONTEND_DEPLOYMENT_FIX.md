# Frontend Deployment Fix - OTPAS-HU

## Problem
The frontend URL (https://otpas-hu.onrender.com) was not working because the frontend service wasn't properly configured in Render.

## Solution
Updated the `render.yaml` configuration to properly deploy the frontend as a static site.

## Changes Made

### 1. Updated render.yaml
- Added frontend service configuration with:
  - `type: web` with `env: static`
  - `buildCommand: npm install && npm run build`
  - `publishDirectory: dist` (where Vite outputs the built files)
  - Removed `startCommand` (not needed for static sites)

### 2. Updated vite.config.ts
- Added proper build configuration:
  - `outDir: 'dist'` - Output directory for production build
  - `sourcemap: false` - Disable source maps for production
  - `minify: 'terser'` - Minify JavaScript for smaller bundle
- Updated API proxy to use production backend URL when in production mode

## How to Deploy

### Option 1: Manual Redeploy on Render
1. Go to https://dashboard.render.com
2. Select the "otpas-hu" frontend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete (2-3 minutes)
5. Visit https://otpas-hu.onrender.com

### Option 2: Push to GitHub and Auto-Deploy
1. Commit changes:
   ```bash
   git add render.yaml vite.config.ts
   git commit -m "Fix: Update frontend deployment configuration"
   git push
   ```
2. Render will automatically redeploy when it detects the push

## Verification

After deployment, verify:
1. Frontend loads at https://otpas-hu.onrender.com
2. Login page displays correctly
3. API calls work (check browser console for errors)
4. Backend responds at https://otpas-hu-backend.onrender.com/api/health

## API Communication

The frontend communicates with the backend via:
- **Development**: `http://localhost:3000/api/*`
- **Production**: `https://otpas-hu-backend.onrender.com/api/*`

This is configured in `vite.config.ts` and uses relative paths in the code.

## Troubleshooting

### Frontend still not loading
1. Check Render dashboard logs for build errors
2. Verify `npm run build` works locally:
   ```bash
   npm install
   npm run build
   ```
3. Check that `dist/` folder is created with `index.html`

### API calls failing
1. Verify backend is running: https://otpas-hu-backend.onrender.com/api/health
2. Check browser console for CORS errors
3. Verify CORS_ORIGIN in backend is set to `https://otpas-hu.onrender.com`

### Build taking too long
- Render free tier has limited resources
- First build may take 3-5 minutes
- Subsequent builds are faster due to caching

## Next Steps

1. Test the application at https://otpas-hu.onrender.com
2. Create test accounts
3. Verify all features work correctly
4. Monitor performance in Render dashboard

---

**Status**: ✅ Frontend deployment configured  
**Last Updated**: February 13, 2026
