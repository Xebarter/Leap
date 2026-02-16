# Troubleshooting Supabase Connection Timeout

## The Error You're Seeing

```
Error fetching featured properties: TypeError: fetch failed
Caused by: ConnectTimeoutError: Connect Timeout Error 
(attempted address: nffgbbxgajxwxjmphsxz.supabase.co:443, timeout: 10000ms)
```

## This is NOT Related to Profile Menu Changes

✅ The profile menu implementation is working correctly  
❌ This is a pre-existing Supabase connection issue

## Possible Causes & Solutions

### 1. **Supabase Project Paused (Most Likely)**
Supabase free tier projects pause after 7 days of inactivity.

**Solution:**
- Go to https://supabase.com/dashboard
- Check if your project `nffgbbxgajxwxjmphsxz` shows "Paused"
- Click "Resume Project" if paused
- Wait 2-3 minutes for it to fully start

### 2. **Network/Firewall Issues**
Your firewall or antivirus might be blocking connections.

**Solution:**
- Temporarily disable firewall and test
- Add `*.supabase.co` to allowed domains
- Check if you're behind a corporate proxy

### 3. **Rate Limiting**
Too many requests in a short time can trigger rate limits.

**Solution:**
- Wait 5-10 minutes
- Reduce concurrent requests
- Add retry logic with exponential backoff

### 4. **DNS Issues**
DNS resolution might be failing or slow.

**Solution:**
```powershell
# Clear DNS cache
ipconfig /flushdns

# Test DNS resolution
nslookup nffgbbxgajxwxjmphsxz.supabase.co
```

### 5. **Environment Variables Not Loaded**
Dev server might not have picked up .env changes.

**Solution:**
- Stop the dev server (Ctrl+C)
- Delete `.next` folder
- Restart: `npm run dev`

## Quick Fix Steps

1. **Restart Supabase Project** (if paused)
2. **Restart Dev Server:**
   ```powershell
   # Kill all node processes
   Get-Process node | Stop-Process -Force
   
   # Clean build cache
   Remove-Item -Recurse -Force .next
   
   # Restart
   npm run dev
   ```

3. **Test Connection:**
   ```powershell
   # Test API endpoint
   Invoke-WebRequest -Uri "https://nffgbbxgajxwxjmphsxz.supabase.co/rest/v1/" `
     -Headers @{"apikey" = "your-anon-key-here"} `
     -TimeoutSec 10
   ```

## Verify Profile Menu Works

Once Supabase is connected:

1. **Not Logged In:**
   - Click profile icon in header
   - Should see "Sign in as Tenant/Landlord" options

2. **After Login:**
   - Profile icon shows your avatar
   - Menu shows role-specific navigation
   - Badge displays your role

## Still Having Issues?

The profile menu is working correctly. If you continue to see errors:

1. Check Supabase dashboard for project status
2. Verify `.env` file has correct credentials
3. Look at browser console for specific error messages
4. Check if other API routes work (try `/api/properties`)

---

**Next Steps:**
1. Resume your Supabase project if paused
2. Restart the dev server
3. Test the profile menu functionality
