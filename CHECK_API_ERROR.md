# Debug API Error

## Check Server Console

1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Click "I'm Interested" button
4. Look at the terminal where the dev server is running

You should see console.log messages like:
```
Express Interest Request: { propertyId: '...', userId: '...', ... }
Attempting to insert interest: { ... }
Error recording interest: { ... }
```

**Copy and paste ALL the error messages from the terminal** and I'll tell you exactly what's wrong.

---

## Alternative: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click "I'm Interested"
4. Find the failed request (it will be red)
5. Click on it
6. Go to **Response** tab
7. Copy the full response JSON

This will show the detailed error message with hints!
