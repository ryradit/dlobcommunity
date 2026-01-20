# Pre-Order Form Error Fixes

## Issues Fixed

### 1. ❌ Button Nesting Hydration Error
**Error**: `In HTML, <button> cannot be a descendant of <button>`

**Cause**: The color preview cards had a button inside another button - the outer button for selecting color and the inner button for the eye icon preview.

**Fix**: Changed the outer container from a `<button>` to a `<div>`, and moved the color selection click handler to the inner button while keeping the eye icon button separate with `z-10` layering.

**File**: `frontend/src/app/pre-order/page.tsx` (lines 425-460)

---

### 2. ❌ API 500 Error on Pre-Order Submission
**Error**: `POST /api/pre-orders 500 Internal Server Error`

**Root Cause**: The database CHECK constraint for `ukuran` (size) field doesn't include 'XS' yet. When XS is selected and sent to the API, Supabase rejects it with a constraint violation.

**Status**: 
- ✅ Frontend code updated to support XS
- ✅ API validation updated to accept XS  
- ⏳ **Database constraint still needs manual update**

**What to Do**:
1. Go to https://supabase.com/dashboard
2. Click "SQL Editor"
3. Click "+ New Query"
4. Run this SQL:

```sql
ALTER TABLE public.pre_orders DROP CONSTRAINT IF EXISTS pre_orders_ukuran_check;

ALTER TABLE public.pre_orders ADD CONSTRAINT pre_orders_ukuran_check 
  CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));
```

5. Click "Run"
6. Try the form again

**Improved Error Logging**: Added detailed error logging in the API to help diagnose constraint violations and other database errors.

**File**: `frontend/src/app/api/pre-orders/route.ts` (error handling section)

---

### 3. ⚠️ Hydration Mismatch (Language/Locale Issue)
**Error**: Server rendered "Home" but client rendered "Beranda" (language mismatch)

**Cause**: The Header component uses the `useLanguage()` hook which returns the client-side language preference. During server-side rendering, the language might be different, causing a mismatch.

**Status**: This is a separate issue from the button nesting. May not affect functionality but causes console warnings.

**Possible Fix**: Check if Header component properly handles SSR/client-side language.

---

## Testing Steps

### After Fixing Button Nesting:
1. Refresh the browser (Ctrl+Shift+R for hard refresh)
2. The console should no longer show the hydration error about nested buttons
3. Try selecting different jersey colors - the eye icon should still work

### After Updating Database Constraint:
1. Go to the pre-order form
2. Select "XS" as the size
3. Complete and submit the form
4. Should see success message instead of 500 error

---

## Files Modified

1. **frontend/src/app/pre-order/page.tsx**
   - Fixed nested button structure in color preview section
   - Structure: `<div>` → `<button>` (color select) + `<button>` (eye icon)

2. **frontend/src/app/api/pre-orders/route.ts**
   - Enhanced error logging for constraint violations
   - Better error messages to help diagnose issues

3. **database/create-pre-orders-table.sql**
   - Updated CHECK constraint definition (for future deployments)

4. **database/add-xs-size.sql** (new)
   - Migration script for XS constraint

5. **database/deploy-xs-size.js** (new)
   - Deployment script to verify XS support

---

## Summary

✅ **FIXED**: Nested button HTML validation error
⏳ **PENDING**: Database constraint update for XS size support
⚠️ **MINOR**: Language hydration mismatch (doesn't affect functionality)

The form should now work correctly once you update the database constraint.
