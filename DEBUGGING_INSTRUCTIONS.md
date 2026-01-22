# How to Find the Actual Error

## In Chrome/Edge DevTools:

1. Open the browser console (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Look for error messages (usually in red)
4. Click on **"Show 13 ignore-listed frame(s)"** to expand the stack trace
5. Copy the **entire error message** including:
   - The error type (e.g., "ReferenceError", "TypeError")
   - The error message
   - The file name and line number
   - The first few lines of the stack trace

## Example of what to share:

```
ReferenceError: Minus is not defined
    at PropertyCreateForm (property-manager.tsx:523)
    at renderWithHooks (react-dom.js:123)
    ...
```

## Or take a screenshot showing:
- The red error message in the console
- The expanded stack trace

## Common Issues:

### If you see "Cannot find module" or "Module not found":
- The import path is wrong
- Run: `npm install` to ensure dependencies are installed

### If you see "X is not defined":
- Missing import statement
- Variable used before declaration

### If you see "Unexpected token":
- Syntax error in the code
- Missing bracket, parenthesis, or comma

### If you see hydration errors:
- Server and client render differently
- Check for dynamic content that changes between renders

## Quick Check:

1. Stop the dev server (Ctrl+C)
2. Clear Next.js cache: `Remove-Item -Recurse -Force .next`
3. Restart: `npm run dev`
4. Refresh browser (Ctrl+F5 for hard refresh)
5. Check console again

## If the server won't start:

Check the **terminal** where you ran `npm run dev` for compilation errors.
