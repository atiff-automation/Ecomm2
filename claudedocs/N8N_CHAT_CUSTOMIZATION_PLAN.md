# n8n Chat Customization Implementation Plan

**Created:** 2025-10-06
**Status:** Planning Phase
**Objective:** Enable admin-configurable chat widget with bot avatar, colors, and text customization

---

## Overview

Enhance the n8n chat widget to support database-driven customization including:
- Dynamic colors and styling
- Customizable text content (title, subtitle, welcome messages)
- Bot avatar image upload
- All managed through `/admin/chat-config` interface

**Principle:** Simple, practical implementation. No over-engineering. Follow DRY and single source of truth.

---

## Current State Analysis

### ✅ What's Already Working
1. Database schema has chat config fields:
   - `n8n_chat_webhook_url`
   - `n8n_chat_enabled`
   - `n8n_chat_position`
   - `n8n_chat_primary_color`
   - `n8n_chat_title`
   - `n8n_chat_subtitle`
   - `n8n_chat_welcome_message`
   - `n8n_chat_input_placeholder`

2. API endpoint `/api/chat-config/public` returns config
3. Admin UI exists at `/admin/chat-config` with form fields
4. Chat component exists at `SimpleN8nChatLoader.tsx`

### ❌ What's NOT Working
1. Chat component has **hardcoded values** - doesn't use database config
2. No bot avatar support
3. No dynamic CSS color injection
4. No image upload functionality

---

## Implementation Plan

### Phase 1: Database Schema Update

#### Task 1.1: Add Bot Avatar Field
**File:** Prisma schema or direct SQL migration

**Action:**
```sql
-- Add bot avatar URL field to SystemConfig
-- This should be added to existing chat config fields
```

**Database Field:**
- Key: `n8n_chat_bot_avatar_url`
- Value: URL string (can be null)

**Validation:**
- Run migration
- Verify field exists in database
- Test with Prisma Studio

---

### Phase 2: Image Upload Infrastructure

#### Task 2.1: Evaluate Existing Upload System
**Research needed:**
- Check if project has existing image upload API
- Look in: `/api/admin/products`, `/api/admin/site-customization`
- Determine if we can reuse existing upload logic

**Decision point:**
- ✅ If exists: Reuse existing upload endpoint
- ❌ If not: Create simple upload endpoint

#### Task 2.2: Create Image Upload Endpoint (if needed)

**File:** `/src/app/api/admin/chat-config/upload-avatar/route.ts`

**Requirements:**
- Accept image files (JPG, PNG, WebP)
- Max size: 2MB
- Store in `/public/uploads/chat/` directory
- Return public URL path
- Handle file validation
- Handle errors gracefully

**Response format:**
```typescript
{
  success: boolean;
  url?: string;
  error?: string;
}
```

**Note:** Check existing product image upload for reference pattern.

---

### Phase 3: Backend API Updates

#### Task 3.1: Update Admin Chat Config API

**File:** `/src/app/api/admin/chat-config/route.ts`

**Changes needed:**

**GET endpoint:**
- Add `botAvatarUrl` to response
- Read `n8n_chat_bot_avatar_url` from database

**POST endpoint:**
- Accept `botAvatarUrl` in request body
- Save to `n8n_chat_bot_avatar_url` in database
- Validate URL format (optional)

**Implementation:**
```typescript
// GET - Add to config map
botAvatarUrl: configMap['n8n_chat_bot_avatar_url'] || ''

// POST - Add to upsert operations
{
  key: 'n8n_chat_bot_avatar_url',
  value: botAvatarUrl || ''
}
```

#### Task 3.2: Update Public Chat Config API

**File:** `/src/app/api/chat-config/public/route.ts`

**Changes needed:**
- Add `botAvatarUrl` to public response
- Read from database like other config fields

**Implementation:**
```typescript
const response = {
  // ... existing fields
  botAvatarUrl: configMap['n8n_chat_bot_avatar_url'] || '',
}
```

**Note:** This is already a public endpoint, no auth needed.

---

### Phase 4: Admin UI Updates

#### Task 4.1: Add Bot Avatar Upload to Chat Config Page

**File:** `/src/app/admin/chat-config/page.tsx`

**Add state variables:**
```typescript
const [botAvatarUrl, setBotAvatarUrl] = useState('');
const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
```

**UI Components to Add:**

1. **Bot Avatar Section** (add after "UI Customization" card)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Bot Avatar</CardTitle>
    <CardDescription>
      Upload a bot avatar image (recommended: 80×80px, max 2MB)
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Avatar preview */}
    {/* Upload button */}
    {/* Remove button */}
  </CardContent>
</Card>
```

2. **Avatar Preview Component**
- Show current avatar if exists
- Show placeholder if no avatar
- Circular display (40-50px preview)

3. **Upload Button**
- File input (accept: image/jpeg, image/png, image/webp)
- Upload progress indicator
- Success/error feedback

4. **Remove Button**
- Only show if avatar exists
- Confirm before removal
- Clear avatar URL

**Functions to Add:**

```typescript
const handleAvatarUpload = async (file: File) => {
  // Validate file size and type
  // Upload to endpoint
  // Update botAvatarUrl state
  // Show success/error message
}

const handleAvatarRemove = () => {
  // Confirm removal
  // Clear botAvatarUrl
  // Update state
}
```

**Integration with Save:**
- Include `botAvatarUrl` in save payload
- Send to `/api/admin/chat-config`

**Reference existing patterns:**
- Look at product image upload for UI patterns
- Reuse existing shadcn/ui components (Button, Input, Alert)

---

### Phase 5: Frontend Chat Widget Updates

#### Task 5.1: Update Chat Component to Use Config

**File:** `/src/components/chat/SimpleN8nChatLoader.tsx`

**Current issues:**
- Lines 38-56: Hardcoded values
- Need to use config data instead

**Changes needed:**

1. **Use config for initialMessages:**
```typescript
// OLD (hardcoded):
initialMessages: [
  'Hi there! 👋',
  'My name is Nathan. How can I assist you today?'
],

// NEW (from config):
initialMessages: config.welcomeMessage.split('\n'),
```

2. **Use config for i18n:**
```typescript
// OLD (hardcoded):
i18n: {
  en: {
    title: 'Hi there! 👋',
    subtitle: 'Start a chat. We\'re here to help you 24/7.',
    footer: '',
    getStarted: 'New Conversation',
    inputPlaceholder: 'Type your question..',
  }
},

// NEW (from config):
i18n: {
  en: {
    title: config.title,
    subtitle: config.subtitle,
    footer: '',
    getStarted: 'New Conversation',
    inputPlaceholder: config.inputPlaceholder,
  }
},
```

#### Task 5.2: Inject Dynamic CSS for Colors

**Add after createChat() initialization:**

```typescript
// Inject custom CSS variables for theming
const styleElement = document.createElement('style');
styleElement.id = 'n8n-chat-custom-styles';
styleElement.textContent = `
  :root {
    --chat--color-primary: ${config.primaryColor};
    --chat--color-primary-shade-50: ${adjustColor(config.primaryColor, -10)};
    --chat--color-primary-shade-100: ${adjustColor(config.primaryColor, -20)};
    --chat--header--background: ${config.primaryColor};
  }
`;
document.head.appendChild(styleElement);
```

**Note:** `adjustColor` function needed to darken/lighten colors for shades.

#### Task 5.3: Inject Bot Avatar

**Add after createChat() initialization:**

```typescript
// Wait for chat widget to render
setTimeout(() => {
  if (config.botAvatarUrl) {
    const chatHeader = document.querySelector('[class*="chat-header"]');

    if (chatHeader) {
      const avatar = document.createElement('img');
      avatar.src = config.botAvatarUrl;
      avatar.alt = 'Chat Bot';
      avatar.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        object-fit: cover;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;

      chatHeader.style.position = 'relative';
      chatHeader.style.paddingLeft = '60px'; // Make room for avatar
      chatHeader.prepend(avatar);
    }
  }
}, 500); // Wait for chat to render
```

**Improvements:**
- Use MutationObserver instead of setTimeout (more reliable)
- Handle avatar load errors with fallback
- Cleanup on component unmount

---

## Testing Checklist

### Unit Testing
- [ ] API endpoints return correct data
- [ ] Image upload validates file size/type
- [ ] Config save updates database correctly
- [ ] Public endpoint returns bot avatar URL

### Integration Testing
- [ ] Upload avatar → appears in admin preview
- [ ] Save config → chat widget updates immediately
- [ ] Change colors → chat updates with new colors
- [ ] Change text → chat displays new text
- [ ] Remove avatar → chat header returns to normal
- [ ] No avatar configured → chat works normally

### UI/UX Testing
- [ ] Avatar appears in correct position (top-left)
- [ ] Avatar is circular and properly sized
- [ ] Colors apply correctly to chat widget
- [ ] Welcome message displays with line breaks
- [ ] Input placeholder text updates
- [ ] Admin UI is intuitive and clear

### Edge Cases
- [ ] Very large image (>2MB) is rejected
- [ ] Invalid image format is rejected
- [ ] Missing config falls back to defaults
- [ ] Null/empty values handled gracefully
- [ ] Avatar load failure doesn't break chat
- [ ] Multiple rapid saves work correctly

---

## File Change Summary

### New Files
1. `/src/app/api/admin/chat-config/upload-avatar/route.ts` (if needed)
2. `/claudedocs/N8N_CHAT_CUSTOMIZATION_PLAN.md` (this file)

### Modified Files
1. `prisma/schema.prisma` or migration SQL (database)
2. `/src/app/api/admin/chat-config/route.ts` (add bot avatar to GET/POST)
3. `/src/app/api/chat-config/public/route.ts` (add bot avatar to response)
4. `/src/app/admin/chat-config/page.tsx` (add avatar upload UI)
5. `/src/components/chat/SimpleN8nChatLoader.tsx` (use config, inject avatar)

### No Changes Needed
- Database schema already has color/text fields ✅
- API structure already supports adding fields ✅
- Admin UI already has form structure ✅

---

## Implementation Order

### Step 1: Backend Foundation
1. Add `n8n_chat_bot_avatar_url` to database
2. Update `/api/admin/chat-config/route.ts` (GET/POST)
3. Update `/api/chat-config/public/route.ts`
4. Test API endpoints with Postman/curl

### Step 2: Admin UI
1. Add bot avatar upload section to admin page
2. Implement upload handler (reuse existing or create new)
3. Add preview and remove functionality
4. Test upload → save → verify in database

### Step 3: Chat Widget
1. Update `SimpleN8nChatLoader.tsx` to use config values
2. Replace hardcoded text with config data
3. Inject CSS variables for colors
4. Test chat updates when config changes

### Step 4: Bot Avatar Injection
1. Implement avatar injection after chat loads
2. Style avatar (circular, positioned correctly)
3. Handle edge cases (no avatar, load error)
4. Test across different scenarios

### Step 5: Polish & Testing
1. Run all tests from testing checklist
2. Fix any bugs found
3. Test on production build
4. Document any caveats or limitations

---

## Technical Decisions

### Color Adjustment Strategy
**Decision:** Use simple hex color manipulation for shades

**Options:**
1. Manual calculation (simple hex math)
2. Use library like `color` or `tinycolor2`
3. Pre-calculate shades in backend

**Choice:** Option 1 (keep dependencies minimal)

```typescript
function adjustColor(hex: string, percent: number): string {
  // Simple implementation to lighten/darken hex colors
  // Returns adjusted hex color
}
```

### Avatar Injection Strategy
**Decision:** DOM manipulation with MutationObserver

**Why:**
- More reliable than setTimeout
- Handles dynamic chat loading
- Can clean up properly on unmount

**Implementation:**
```typescript
const observer = new MutationObserver(() => {
  const header = document.querySelector('[class*="chat-header"]');
  if (header && !header.querySelector('.bot-avatar')) {
    injectAvatar(header);
    observer.disconnect();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

### Image Upload Strategy
**Decision:** Reuse existing upload infrastructure if available

**Priority:**
1. Check for existing product image upload
2. Check for site customization upload
3. Create minimal new endpoint if needed

**Storage location:** `/public/uploads/chat/`

---

## Potential Issues & Solutions

### Issue 1: Chat widget selector changes
**Problem:** @n8n/chat may update and change CSS classes
**Solution:** Use multiple fallback selectors, test after updates

### Issue 2: Avatar doesn't appear
**Problem:** Timing issue, header not found
**Solution:** Use MutationObserver + fallback setTimeout

### Issue 3: Colors not applying
**Problem:** CSS specificity, variables not overriding
**Solution:** Use `!important` or inject with higher specificity

### Issue 4: Image upload fails silently
**Problem:** No feedback to user
**Solution:** Comprehensive error handling, user-friendly messages

### Issue 5: Large image file
**Problem:** Slow upload, server limits
**Solution:** Client-side validation, compression before upload (optional)

---

## Success Criteria

### MVP Complete When:
- [✅] Bot avatar can be uploaded via admin UI
- [✅] Avatar appears in chat widget (top-left, circular)
- [✅] Colors are customizable and apply to chat
- [✅] Text content (title, subtitle, welcome) is customizable
- [✅] All changes reflect immediately in chat widget
- [✅] No hardcoded values in chat component
- [✅] Clean, maintainable code following project standards

### Nice-to-Have Enhancements (Post-MVP):
- [ ] Avatar image cropping/editing in admin
- [ ] Multiple color themes (light/dark mode)
- [ ] Live preview of chat in admin panel
- [ ] Additional CSS customization options
- [ ] Gradient background support (via advanced CSS)
- [ ] Animation customization

---

## Code Quality Standards

### Requirements (from CLAUDE.md):
✅ Systematic implementation - no hardcoding
✅ DRY principle - single source of truth
✅ Centralized approach - all config from database
✅ Best software architecture practices
✅ Follow existing project patterns
✅ No over-engineering - simple and practical

### Code Review Checklist:
- [ ] No magic numbers or hardcoded strings
- [ ] Error handling for all async operations
- [ ] TypeScript types properly defined
- [ ] Comments for complex logic only
- [ ] Consistent naming conventions
- [ ] Reuse existing components/utilities
- [ ] Clean up console.logs before commit

---

## Rollback Plan

If implementation fails or causes issues:

1. **Database:** Keep new field but set to null
2. **API:** Default to empty string if field doesn't exist
3. **Frontend:** Gracefully handle missing config
4. **Feature flag:** Can disable via `n8n_chat_enabled`

**No breaking changes:** All enhancements are additive and backward-compatible.

---

## Next Steps After Completion

1. Document final implementation in README
2. Update admin user guide
3. Test on staging environment
4. Deploy to production
5. Monitor for issues
6. Gather user feedback
7. Iterate based on feedback

---

## Notes

- Keep it simple: Avoid over-engineering
- Reuse patterns: Follow existing project structure
- Test incrementally: Don't save all testing for the end
- Document as you go: Update this plan if approach changes
- Stay pragmatic: Perfect is the enemy of done

---

**End of Plan**
