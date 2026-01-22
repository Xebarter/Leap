# Common Hydration Pitfalls - What NOT to Do

## ⚠️ Critical Rule
**NEVER use server/client conditional logic during render that affects the output!**

## ❌ Common Mistakes

### 1. Server/Client Branches in Render

```typescript
// ❌ BAD - Different output on server vs client
function MyComponent() {
  const id = typeof window !== 'undefined' 
    ? crypto.randomUUID()  // Client: random UUID
    : 'ssr-id';            // Server: 'ssr-id'
  
  return <div id={id}>Content</div>
  // Server renders: <div id="ssr-id">
  // Client expects: <div id="random-uuid">
  // HYDRATION ERROR! ⚠️
}
```

**Why it fails:**
- Server renders one thing
- Client renders something different
- React detects mismatch and throws hydration error

### 2. Using Date/Time Values

```typescript
// ❌ BAD - Different timestamps
function MyComponent() {
  const timestamp = Date.now();
  return <div>Generated at {timestamp}</div>
  // Server: 1704067200000
  // Client: 1704067200050 (50ms later)
  // HYDRATION ERROR! ⚠️
}
```

### 3. Random Values in Render

```typescript
// ❌ BAD - Different random values
function MyComponent() {
  const randomId = Math.random();
  return <div id={randomId}>Content</div>
  // Server: 0.12345
  // Client: 0.67890
  // HYDRATION ERROR! ⚠️
}
```

### 4. Browser APIs in Initial State

```typescript
// ❌ BAD - window doesn't exist on server
function MyComponent() {
  const [width] = useState(window.innerWidth); // Crashes on server!
  return <div style={{ width }}>Content</div>
}

// ❌ BAD - Conditional but still causes hydration error
function MyComponent() {
  const [width] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  return <div style={{ width }}>Content</div>
  // Server: width=0
  // Client: width=1920
  // HYDRATION ERROR! ⚠️
}
```

### 5. LocalStorage/SessionStorage in Render

```typescript
// ❌ BAD - localStorage doesn't exist on server
function MyComponent() {
  const theme = localStorage.getItem('theme') || 'light'; // Crashes!
  return <div className={theme}>Content</div>
}

// ❌ BAD - Still causes hydration error
function MyComponent() {
  const theme = typeof window !== 'undefined'
    ? localStorage.getItem('theme')
    : 'light';
  return <div className={theme}>Content</div>
  // Server: className="light"
  // Client: className="dark" (if stored theme is dark)
  // HYDRATION ERROR! ⚠️
}
```

### 6. User Agent Detection

```typescript
// ❌ BAD - Different on server vs client
function MyComponent() {
  const isMobile = typeof window !== 'undefined' 
    && /mobile/i.test(navigator.userAgent);
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>
  // Server: "Desktop" (no navigator)
  // Client: "Mobile" (on mobile device)
  // HYDRATION ERROR! ⚠️
}
```

## ✅ Correct Solutions

### Solution 1: Use Deterministic Values

```typescript
// ✅ GOOD - Counter is deterministic
let idCounter = 0;
function generateId() {
  idCounter++;
  return `id_${idCounter}`;
}

function MyComponent() {
  const id = generateId(); // Same on server and client!
  return <div id={id}>Content</div>
}
```

### Solution 2: Defer to Client with useEffect

```typescript
// ✅ GOOD - Generate ID after mount
function MyComponent() {
  const [id, setId] = useState<string>('');
  
  useEffect(() => {
    setId(crypto.randomUUID()); // Only runs on client
  }, []);
  
  return <div id={id || 'loading'}>Content</div>
}
```

### Solution 3: Use State Updated in useEffect

```typescript
// ✅ GOOD - Initialize with null, update after mount
function MyComponent() {
  const [id, setId] = useState<string | null>(null);
  
  useEffect(() => {
    setId(crypto.randomUUID());
  }, []);
  
  // Both server and initial client render show same thing
  return <div>{id || 'Generating ID...'}</div>;
}

// ⚠️ AVOID - Mounted state pattern still causes different renders
// This is technically a hydration mismatch (server vs client render different HTML)
function MyComponent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return <div>Loading...</div>; // Server renders this
  return <div>{crypto.randomUUID()}</div>;    // Client renders this
  // Different HTML! React may suppress warning but it's still not ideal
}
```

### Solution 4: Accept Server/Client Difference (Suppresssing Warning)

```typescript
// ✅ ACCEPTABLE - When you must have different content
function MyComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Suppress hydration warning for this specific case
  return (
    <div suppressHydrationWarning>
      {mounted ? new Date().toISOString() : ''}
    </div>
  );
}
```

### Solution 5: Server-Side Props

```typescript
// ✅ BEST - Pass data from server
export async function getServerSideProps() {
  return {
    props: {
      timestamp: Date.now(),
      randomId: Math.random(),
    },
  };
}

function MyComponent({ timestamp, randomId }) {
  // Same values on server and client!
  return <div id={randomId}>Generated at {timestamp}</div>
}
```

## 📋 Checklist: Is My Code Hydration-Safe?

Ask yourself:

1. ✅ Does the code produce the **exact same output** on server and client?
2. ✅ Are all random/time-based values either:
   - Generated before SSR (in getServerSideProps)?
   - Generated after mount (in useEffect)?
   - Deterministic (counter, props, etc.)?
3. ✅ Are browser APIs only used in useEffect?
4. ✅ Is there NO `typeof window !== 'undefined'` in render logic that affects output?
5. ✅ Are all IDs deterministic or generated client-side only?

If you answer **NO** to any, you likely have a hydration issue!

## 🎯 Golden Rules

1. **Server and client must render identical HTML initially**
2. **Use useEffect for client-only code**
3. **Use mounted state pattern when you need to wait for client**
4. **Avoid `typeof window` checks that affect render output**
5. **Use deterministic values (counters, props) or defer to client (useEffect)**

## 🔍 Debugging Tips

### Check if hydration-safe:

```typescript
// Does this produce different output on server vs client?
const value = typeof window !== 'undefined' ? clientValue : serverValue;

// If YES → Hydration error!
// If NO → Safe
```

### Test:
1. Disable JavaScript in browser
2. View source (server HTML)
3. Enable JavaScript
4. Inspect element (client HTML)
5. Are they identical? → Safe ✅
6. Are they different? → Hydration error ❌

## 📚 Key Takeaways

❌ **Never do this in render:**
- `Date.now()`
- `Math.random()`
- `typeof window !== 'undefined' ? clientValue : serverValue`
- `window.` or `document.` directly
- `localStorage` or `sessionStorage`
- `navigator.userAgent`

✅ **Do this instead:**
- Use counters (deterministic)
- Use `useEffect` for client-only code
- Use mounted state pattern
- Pass data via props from server
- Use `suppressHydrationWarning` only when necessary

## 🎓 Remember

> **The server and client must render identical HTML on the first pass. Anything that makes them different causes hydration errors!**

This is the fundamental rule of React SSR/hydration. Follow it, and you'll never have hydration issues again!
