# Debug: Find the Actual Error Message

## Method 1: Browser DevTools Network Response

1. Open your property page in browser
2. Press **F12** to open DevTools
3. Go to **Network** tab
4. Click "I'm Interested" button
5. In the Network tab, find the red line that says: `interested` and status `500`
6. **Click on that line**
7. On the right side, click the **"Response"** tab (NOT Headers, NOT Preview)
8. You should see JSON text like:
   ```json
   {
     "error": "Failed to record interest",
     "details": "relation \"property_interested\" does not exist",
     "hint": "Check if property_interested table exists",
     "code": "42P01"
   }
   ```
9. **Copy that entire JSON and paste it here**

## Method 2: Check Terminal/Console

Look at the terminal/console where you ran `npm run dev`. 

Search for lines that start with:
- `Express Interest Request:`
- `Attempting to insert interest:`
- `Error recording interest:`
- `Error details:`

**Copy those lines and paste them here**

## Method 3: Use Test File

1. Open `test_api_direct.html` in your browser
2. Click the "Test API Call" button
3. Copy the result that appears
4. Paste it here

## What I'm Looking For

The actual error will be one of these:

### If table doesn't exist:
```json
{
  "details": "relation \"property_interested\" does not exist",
  "code": "42P01"
}
```
**Fix:** Run the SQL migration script

### If RLS is blocking:
```json
{
  "details": "new row violates row-level security policy",
  "code": "42501"
}
```
**Fix:** Disable RLS or fix policies

### If column is missing:
```json
{
  "details": "column \"interested_at\" does not exist",
  "code": "42703"
}
```
**Fix:** Add missing column

---

**Please share the actual error JSON so I can help!**
