# YouTube Embed Fix - Deployment Guide

## Issues Fixed

### 1. Content Security Policy (CSP) Blocking YouTube Embeds
**Problem**: YouTube iframes were blocked by CSP `frame-src` directive
**Error**: `Framing 'https://www.youtube-nocookie.com/' violates the following Content Security Policy directive`

**Solution**: Added `frame-src` directive to allow YouTube embeds in:
- `src/middleware.ts:34`
- `src/lib/security/headers.ts:22`

**Changes**:
```diff
+ "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
```

### 2. CSS Syntax Error in Production Build
**Problem**: `e113d6819ee423f9.css:1 Uncaught SyntaxError: Invalid or unexpected token`
**Cause**: Corrupted CSS chunk in production build (likely build cache issue)

## Deployment Steps

### Step 1: Commit the CSP Fix
```bash
git add src/middleware.ts src/lib/security/headers.ts
git commit -m "fix: Add CSP frame-src directive to allow YouTube embeds

- Added frame-src to allow youtube-nocookie.com and youtube.com
- Fixed CSP violation blocking YouTube iframes in articles
- Updated both middleware.ts and security/headers.ts for consistency

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 2: Clear Build Cache (Railway)

#### Option A: Via Railway CLI
```bash
# Clear build cache and force fresh build
railway up --force
```

#### Option B: Via Railway Dashboard
1. Go to your Railway project
2. Navigate to Settings → General
3. Click "Clear Build Cache"
4. Trigger a new deployment

### Step 3: Verify the Fixes

After deployment, check:

1. **YouTube Embeds**:
   - Open browser DevTools → Console
   - Navigate to an article with YouTube video
   - Video should load without CSP errors
   - No `frame-src` violation errors

2. **CSS Loading**:
   - Open browser DevTools → Network tab
   - Filter for CSS files
   - All CSS files should load with status 200
   - No JavaScript syntax errors from CSS files

3. **Browser Console**:
   - Should NOT see: `Framing 'https://www.youtube-nocookie.com/'` error
   - Should NOT see: `Uncaught SyntaxError: Invalid or unexpected token` from CSS

## Expected Results

✅ YouTube videos display correctly in articles
✅ No CSP violations in browser console
✅ All CSS files load without errors
✅ No JavaScript syntax errors from CSS chunks

## Rollback Plan (If Issues Persist)

If CSP issues continue:
```bash
# Revert the changes
git revert HEAD
git push
```

If CSS errors persist after cache clear:
1. Try a full rebuild: Delete `.next` folder locally and rebuild
2. Check Railway logs for build errors
3. Verify no special characters in CSS files
4. Consider disabling CSS optimization in `next.config.mjs` if needed

## Notes

- The CSP fix allows both `youtube-nocookie.com` (privacy-enhanced) and `youtube.com`
- YouTube embeds use privacy-enhanced mode by default (`youtube-nocookie.com`)
- CSS error is likely a cached build artifact issue, clearing cache should resolve
- If CSS error persists, check Railway build logs for webpack/CSS compilation errors
