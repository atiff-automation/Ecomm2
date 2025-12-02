# Debug Mode Usage - Click Page Blocks

## 🎯 Purpose

Browser console debug logging system to diagnose React hydration errors and track block state changes in real-time.

---

## 🚀 How to Enable Debug Mode

### Step 1: Open Browser Console
- **Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
- **Mac**: Press `Cmd + Option + I`

### Step 2: Enable Debug Logging
In the console, type:
```javascript
localStorage.setItem('DEBUG_BLOCKS', 'true');
location.reload();
```

### Step 3: Use the Application
- Open any click page in the editor
- Add, edit, or remove blocks
- Watch the console for detailed debug logs

### Step 4: Disable When Done
```javascript
localStorage.removeItem('DEBUG_BLOCKS');
location.reload();
```

---

## 📊 What Gets Logged

### On Page Load
- ✅ Debug mode initialization banner
- ⚠️ Hydration check for all blocks
- 🔍 Detection of undefined/null rounded properties

### When Adding Blocks
- ➕ Block creation details (ID, type, sort order)
- 🔘 Rounded property value and type
- 📊 State change before/after
- 🆕 New blocks summary

### When Updating Blocks
- ✏️ Block update details (block ID, updates)
- 🔘 Rounded property changes (if applicable)
- 📊 State change before/after
- 🔄 Updated blocks summary

### When Removing Blocks
- 🗑️ Removed blocks list
- 📊 State change before/after
- 🔢 Block count changes

### When Saving
- 💾 Total blocks count
- 📷 Media blocks analysis (IMAGE, VIDEO, IMAGE_GALLERY)
- 📊 Rounded property status table for all media blocks
- 📝 Full payload inspection

### On Errors
- ❌ Error details (message, stack trace)
- 🔍 Special detection for React error #185
- 💡 Tips for fixing hydration mismatches

---

## 🔍 Example Debug Output

### Adding an Image Block
```
🔍 Block Debug Mode Enabled
💡 To disable: localStorage.removeItem("DEBUG_BLOCKS"); location.reload();

➕ [BLOCKS] Creating IMAGE block
  Block ID: block_1733109876543_abc123def
  Sort Order: 0
  Settings: { imageUrl: '', rounded: false }
  🔘 Rounded property: false (type: boolean)

📊 [BLOCKS] State change: Add block
  Previous blocks: 0
  Next blocks: 1
  🆕 New blocks: [{id: "block_1733109876543_abc123def", type: "IMAGE", rounded: false}]
```

### Toggling Rounded Corners
```
✏️ [BLOCKS] Updating block block_1733109876543_abc123def
  Updates: { settings: { imageUrl: '', rounded: true } }
  🔘 Rounded changed to: true (type: boolean)

📊 [BLOCKS] State change: Update block
  Previous blocks: 1
  Next blocks: 1
  🔄 Updated blocks: [{id: "block_1733109876543_abc123def", type: "IMAGE"}]
```

### Saving Click Page
```
💾 [BLOCKS] Saving click page
  Total blocks: 3
  📷 Media blocks: 3

  ┌─────────┬────────────────────────────┬───────┬───────────┬─────────────┐
  │ (index) │ id                         │ type  │ rounded   │ roundedType │
  ├─────────┼────────────────────────────┼───────┼───────────┼─────────────┤
  │    0    │ 'block_1733109876543_abc1' │ IMAGE │ false     │ 'boolean'   │
  │    1    │ 'block_1733109876544_def2' │ VIDEO │ true      │ 'boolean'   │
  │    2    │ 'block_1733109876545_ghi3' │ IMAGE │ false     │ 'boolean'   │
  └─────────┴────────────────────────────┴───────┴───────────┴─────────────┘
```

### Hydration Error Detection
```
⚠️ [BLOCKS] Potential hydration issues detected
  Block 2 (IMAGE, ID: block_xyz): rounded is undefined
  Block 4 (VIDEO, ID: block_abc): rounded is null
  💡 Tip: Run migration script to fix: npx tsx scripts/fix-rounded-property.ts
```

### React Error #185 Details
```
❌ [BLOCKS] Error in handleSave
  Error: Minified React error #185
  Message: Minified React error #185; visit https://reactjs.org/docs/error-decoder.html?invariant=185
  Stack: Error: Minified React error #185...

  🔍 React Error #185 - Hydration Mismatch
  This usually means server/client rendered different content
  Check for:
    - undefined vs false/true values
    - null vs undefined
    - missing properties on some blocks
```

---

## 🎯 Using Debug Logs to Diagnose Issues

### Issue: Rounded toggle doesn't work
**Look for:**
- ✏️ Block update logs showing rounded property changes
- Check if `roundedType` is `'boolean'` (not `'undefined'` or `'object'`)
- Verify state change shows updated blocks

### Issue: React error #185 on save
**Look for:**
- ⚠️ Hydration check warnings on page load
- 💾 Save operation rounded status table
- Check for `undefined` or `null` values in roundedType column
- ❌ Error details with stack trace

### Issue: Visual doesn't match setting
**Look for:**
- ✅ No hydration issues detected
- 🔘 Rounded property showing correct value and type
- Check CSS classes in browser DevTools (should be `rounded-lg` when true)

### Issue: Error appears when adding multiple blocks
**Look for:**
- ➕ Each block creation log
- 📊 State changes showing block count increases
- ⚠️ Hydration warnings appearing after certain block additions
- Check if new blocks have proper rounded property

---

## 🔧 Troubleshooting

### Debug mode not working?
1. Verify localStorage is set:
   ```javascript
   localStorage.getItem('DEBUG_BLOCKS'); // Should return 'true'
   ```
2. Ensure you reloaded the page after setting the flag
3. Check browser console filters aren't hiding logs

### Too much output?
- Debug mode logs EVERYTHING - this is intentional
- Use browser console filters to focus on specific emojis:
  - Filter by `➕` for block creation
  - Filter by `💾` for save operations
  - Filter by `⚠️` for warnings
  - Filter by `❌` for errors

### Still getting errors?
1. Copy all console output (right-click → Save as...)
2. Look for the first ⚠️ warning - this is often the root cause
3. Check the rounded property status table in save logs
4. Share console output for analysis

---

## 📝 What to Report

When reporting issues, include:

1. **Debug initialization output** (shows mode is enabled)
2. **Hydration check results** (warnings about undefined/null)
3. **Relevant operation logs** (block creation, updates, save)
4. **Error logs** (if any ❌ appear)
5. **Steps to reproduce** (what you clicked)

**Example Report:**
```
Steps:
1. Enabled debug mode
2. Added 3 IMAGE blocks
3. Toggled rounded corners on block 2
4. Clicked save
5. Error appeared

Logs show:
- ⚠️ Hydration warning on block 2: rounded is undefined
- 💾 Save operation shows block 2 roundedType: 'undefined'
- ❌ React error #185 with hydration mismatch
```

---

## 🎉 Success Indicators

Debug mode is working correctly when you see:

- ✅ "Block Debug Mode Enabled" banner on page load
- ✅ "No hydration issues detected" message
- ✅ All blocks show `roundedType: 'boolean'` in save logs
- ✅ State changes track before/after correctly
- ✅ No ⚠️ warnings about undefined/null properties

---

## 📞 Support

If debug logs reveal unexpected behavior:
1. Take screenshots of relevant console output
2. Note the exact sequence of operations
3. Include the rounded status table from save operations
4. Report findings for further investigation

---

**Created**: 2025-12-02
**Related Commits**:
- `7fc0503` - feat: Add browser console debug logging for click page blocks
- `435c34b` - fix: Remove hardcoded rounded corners from editor preview wrappers
- `a2b94ad` - fix: Resolve React hydration error #185 for rounded property in click page blocks
