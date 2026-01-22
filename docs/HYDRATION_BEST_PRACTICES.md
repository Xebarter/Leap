# Hydration Best Practices - The Complete Guide

## 🎯 The Golden Rule

> **Server and client must render IDENTICAL HTML on the initial render. Period.**

No exceptions, no tricks, no workarounds. If they render differently, you have a hydration error.

---

## ✅ The ONLY Correct Solutions

### 1. Use Deterministic Values (BEST)

```typescript
// ✅ PERFECT - Same output every time
let counter = 0;
function generateId() {
  counter++;
  return `id_${counter}`;
}

function MyComponent() {
  const id = generateId();
  return <div id={id}>Content</div>;
}
```

**Why this works:**
- Counter increments the same way on server and client
- Same input → Same output
- Zero hydration issues

### 2. Pass Data from Server (BEST for Next.js)

```typescript
// ✅ PERFECT - Data comes from server
export async function getServerSideProps() {
  return {
    props: {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    },
  };
}

function MyComponent({ id, timestamp }) {
  return <div id={id}>Generated at {timestamp}</div>;
}
```

**Why this works:**
- Values generated once on server
- Passed as props to component
- Same values on server render and client hydration

### 3. Update State After Mount (GOOD)

```typescript
// ✅ GOOD - Initialize with safe value, update after mount
function MyComponent() {
  const [id, setId] = useState<string>('');
  
  useEffect(() => {
    setId(crypto.randomUUID());
  }, []);
  
  return <div id={id || 'temp'}>Content</div>;
}
```

**Why this works:**
- Server renders: `<div id="temp">`
- Client initially renders: `<div id="temp">` (matches!)
- Client then updates to: `<div id="uuid">` (after hydration)

### 4. Use Client-Only Components (ACCEPTABLE)

```typescript
// ✅ ACCEPTABLE - Component only renders on client
'use client'
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(() => import('./ClientComponent'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

function MyPage() {
  return (
    <div>
      <h1>Server-rendered content</h1>
      <ClientOnlyComponent />
    </div>
  );
}
```

**Why this works:**
- Component is explicitly marked as client-only
- Server doesn't try to render it
- No server/client HTML to compare

---

## ❌ Common Mistakes (NEVER DO THESE)

### ❌ Mistake 1: Using typeof window

```typescript
// ❌ WRONG - Different values on server vs client
function MyComponent() {
  const id = typeof window !== 'undefined'
    ? crypto.randomUUID()
    : 'server-id';
  
  return <div id={id}>Content</div>;
}

// Server renders: <div id="server-id">
// Client renders: <div id="abc-123">
// HYDRATION ERROR! ⚠️
```

### ❌ Mistake 2: Using Date.now() or Math.random()

```typescript
// ❌ WRONG - Different timestamps
function MyComponent() {
  const timestamp = Date.now();
  return <div>{timestamp}</div>;
}

// Server: <div>1704067200000</div>
// Client: <div>1704067200100</div> (100ms later)
// HYDRATION ERROR! ⚠️
```

### ❌ Mistake 3: Mounted State Pattern

```typescript
// ❌ WRONG - Server and client render different HTML
function MyComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>; // Server renders this
  }
  
  return <div>Content</div>; // Client renders this
}

// Server: <div>Loading...</div>
// Client: <div>Content</div>
// DIFFERENT! Hydration warning! ⚠️
```

**Why it's wrong:** Even though React may suppress the warning with `suppressHydrationWarning`, you're still creating different HTML on server vs client. This is a **code smell** and should be avoided.

### ❌ Mistake 4: Direct Browser API Access

```typescript
// ❌ WRONG - Crashes on server
function MyComponent() {
  const width = window.innerWidth;
  return <div>Width: {width}</div>;
}

// Server: CRASH! window is not defined
```

### ❌ Mistake 5: Conditional Rendering Based on Environment

```typescript
// ❌ WRONG - Different HTML on server vs client
function MyComponent() {
  const isBrowser = typeof window !== 'undefined';
  
  return (
    <div>
      {isBrowser ? (
        <button>Click me</button>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

// Server: <div><div>Loading...</div></div>
// Client: <div><button>Click me</button></div>
// HYDRATION ERROR! ⚠️
```

---

## 🎓 Decision Tree: What Should I Use?

```
Do you need dynamic/random values?
│
├─ YES → Can you generate them on the server?
│         │
│         ├─ YES → Use getServerSideProps ✅
│         │
│         └─ NO → Update state in useEffect ✅
│
└─ NO → Use deterministic values (counters, props) ✅
```

---

## 📋 Hydration Safety Checklist

Before deploying, check your code:

### ✅ Safe Patterns
- [ ] Using counters for IDs
- [ ] Using props passed from server
- [ ] Using static/constant values
- [ ] Updating state in `useEffect`
- [ ] Using `dynamic()` with `ssr: false` for client-only components

### ❌ Unsafe Patterns
- [ ] Using `Date.now()` or `new Date()` in render
- [ ] Using `Math.random()` in render
- [ ] Using `typeof window !== 'undefined'` conditionals that affect output
- [ ] Using `window` or `document` directly in render
- [ ] Using `localStorage` or `sessionStorage` in render
- [ ] Mounted state pattern that renders different HTML
- [ ] Different content on server vs client

---

## 🔍 Debugging Hydration Errors

### Step 1: Identify the Mismatch

React will tell you in the console:
```
Warning: Text content did not match. 
Server: "server-id" 
Client: "abc-123"
```

### Step 2: Find the Variable Input

Look for:
- `Date.now()`
- `Math.random()`
- `typeof window`
- `window.*` or `document.*`
- `localStorage.*`

### Step 3: Apply the Fix

Replace with:
- Counter-based IDs
- Props from server
- State updated in `useEffect`

### Step 4: Verify

```bash
# Build and run production
npm run build
npm run start

# Check browser console
# Should see: No hydration warnings ✅
```

---

## 🏆 Real-World Examples

### Example 1: Unique IDs

```typescript
// ❌ BAD
const id = `form-${Math.random()}`;

// ✅ GOOD
let formCounter = 0;
const id = `form-${formCounter++}`;
```

### Example 2: Timestamps

```typescript
// ❌ BAD
const createdAt = Date.now();

// ✅ GOOD - Pass from server
export async function getServerSideProps() {
  return { props: { createdAt: Date.now() } };
}

// ✅ GOOD - Update after mount
const [createdAt, setCreatedAt] = useState<number | null>(null);
useEffect(() => {
  setCreatedAt(Date.now());
}, []);
```

### Example 3: User-Specific Content

```typescript
// ❌ BAD
const username = localStorage.getItem('username');

// ✅ GOOD - Update after mount
const [username, setUsername] = useState<string | null>(null);
useEffect(() => {
  setUsername(localStorage.getItem('username'));
}, []);
```

### Example 4: Responsive Layout

```typescript
// ❌ BAD
const isMobile = typeof window !== 'undefined' 
  && window.innerWidth < 768;

// ✅ GOOD - CSS media queries (no JS needed)
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// ✅ GOOD - Update after mount if JS needed
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(window.innerWidth < 768);
}, []);
```

---

## 📚 Additional Resources

### Next.js Specific
- Use `getServerSideProps` for dynamic data
- Use `getStaticProps` for static data
- Use `dynamic()` with `ssr: false` for client-only components

### React Specific
- `useEffect` runs only on client
- `useState` initial value should be deterministic
- Props are safe (same on server and client)

---

## 🎯 Summary

### The Rules
1. Server and client must render **identical HTML** initially
2. Use **deterministic values** (counters, props, static data)
3. Update **non-deterministic values** in `useEffect`
4. **Never** use environment checks that affect rendered output

### The Pattern
```typescript
// For IDs
let counter = 0;
const id = `id_${counter++}`;

// For dynamic values
const [value, setValue] = useState<T | null>(null);
useEffect(() => {
  setValue(getDynamicValue());
}, []);

// For server data
export async function getServerSideProps() {
  return { props: { data: await fetchData() } };
}
```

### The Test
1. View page source (server HTML)
2. Inspect element (client HTML)
3. Are they identical? ✅ Safe
4. Are they different? ❌ Hydration error

---

## 🚀 Conclusion

Hydration errors are **100% preventable** by following one simple rule:

> **Make server and client render the exact same HTML.**

Use deterministic values, update dynamic values after mount, and you'll never have hydration issues again!
