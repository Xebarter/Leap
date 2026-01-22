# Tenant System Implementation Guidelines

## Quick Start Guide

### 1. Verify the Build
```bash
# Check that all files were created
ls app/(dashboard)/tenant/
ls components/tenantView/
ls components/tenantView/forms/

# Expected:
# app/(dashboard)/tenant/: page.tsx, profile/, documents/, payments/, maintenance/, notices/, complaints/
# components/tenantView/: *.tsx files + forms/
# components/tenantView/forms/: 5 form components
```

### 2. Test Navigation
Visit these URLs in your browser:
- `http://localhost:3000/tenant` - Dashboard
- `http://localhost:3000/tenant/profile` - Profile
- `http://localhost:3000/tenant/documents` - Documents
- `http://localhost:3000/tenant/payments` - Payments
- `http://localhost:3000/tenant/maintenance` - Maintenance
- `http://localhost:3000/tenant/notices` - Notices
- `http://localhost:3000/tenant/complaints` - Complaints

### 3. Verify Data Display
- Sidebar loads correctly with all navigation items
- Pages display without errors
- Authentication check works
- Sidebar shows proper user info

---

## Implementation Roadmap

### Phase 1: API Integration (Weeks 1-2)

#### Step 1: Create API Routes
```typescript
// app/api/tenant/maintenance-requests/route.ts
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  
  const formData = await request.json()
  
  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert([{
      tenant_id: user.id,
      title: formData.title,
      description: formData.description,
      severity: formData.severity,
      location_in_property: formData.location_in_property,
      request_date: new Date().toISOString(),
      status: "open"
    }])
    .select()
  
  if (error) return Response.json({ error: error.message }, { status: 400 })
  
  return Response.json(data[0])
}
```

#### Step 2: Update Form Handlers
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await fetch('/api/tenant/maintenance-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (!response.ok) throw new Error('Failed to create request')
    
    const result = await response.json()
    
    if (onSubmit) onSubmit(result)
    
    // Show success toast
    toast.success("Maintenance request created successfully")
    
    setFormData({ /* reset */ })
    setOpen(false)
  } catch (error) {
    toast.error("Failed to create maintenance request")
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

#### Step 3: Create Routes for All Forms
```
app/api/tenant/
├── maintenance-requests/route.ts
├── complaints/route.ts
├── documents/route.ts
├── references/route.ts
└── profile/route.ts
```

### Phase 2: File Upload (Week 2)

#### Step 1: Create Storage Bucket
1. Go to Supabase Dashboard > Storage
2. Create bucket: `tenant-documents` (Public)
3. Add RLS policies for authenticated users

#### Step 2: Update Document Upload Form
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('tenant-documents')
      .upload(
        `${user!.id}/${Date.now()}-${uploadedFile!.name}`,
        uploadedFile!
      )
    
    if (storageError) throw storageError
    
    // Save document record to database
    const { data, error } = await supabase
      .from('tenant_documents')
      .insert([{
        tenant_profile_id: tenantProfileId,
        document_type: formData.document_type,
        document_name: formData.document_name,
        document_url: storageData.path,
        document_storage_path: storageData.path,
        expiry_date: formData.expiry_date,
        status: 'pending',
        file_size: uploadedFile!.size,
        mime_type: uploadedFile!.type
      }])
    
    if (error) throw error
    
    toast.success("Document uploaded successfully")
    setOpen(false)
  } catch (error) {
    toast.error("Failed to upload document")
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

### Phase 3: Notifications (Week 3)

#### Step 1: Add Toast Notifications
```typescript
import { useToast } from "@/hooks/use-toast"

export function ComplaintForm() {
  const { toast } = useToast()
  
  // Use in handlers:
  toast.success("Complaint filed successfully")
  toast.error("Failed to file complaint")
  toast.loading("Processing...")
}
```

#### Step 2: Add Email Notifications
Create Supabase function to send emails on:
- Maintenance request created
- Complaint filed
- Document uploaded
- Notice sent

#### Step 3: Real-time Updates
```typescript
// Subscribe to changes
useEffect(() => {
  const subscription = supabase
    .from('maintenance_requests')
    .on('*', payload => {
      // Refresh data
    })
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

---

## Form Submission Flow

### Current (Development)
```
Form Submit
  ↓
Console.log (TODO)
  ↓
Form Reset
  ↓
Modal Close
```

### After Implementation
```
Form Submit
  ↓
Form Validation
  ↓
API Request
  ↓
Supabase Insert
  ↓
Toast Notification
  ↓
Data Refresh
  ↓
Form Reset
  ↓
Modal Close
```

---

## Key Integration Points

### 1. Maintenance Requests
**Table:** `maintenance_requests`
**Fields:** title, description, severity, location_in_property, request_date, status
**API:** POST `/api/tenant/maintenance-requests`

### 2. Complaints
**Table:** `tenant_complaints`
**Fields:** title, description, complaint_type, priority, status
**API:** POST `/api/tenant/complaints`

### 3. Documents
**Table:** `tenant_documents`
**Fields:** document_type, document_name, document_url, expiry_date, status
**Storage:** `tenant-documents` bucket
**API:** POST `/api/tenant/documents`

### 4. References
**Table:** `tenant_references`
**Fields:** reference_type, reference_name, reference_title, reference_email, reference_phone
**API:** POST `/api/tenant/references`

### 5. Profile
**Table:** `tenant_profiles`
**Fields:** All profile fields (15+)
**API:** PUT `/api/tenant/profile`

---

## Common Issues & Solutions

### Issue: Form Not Submitting
**Solution:** Check browser console for errors, verify form data structure matches schema

### Issue: File Upload Failing
**Solution:** Verify storage bucket exists and RLS policies allow authenticated uploads

### Issue: Data Not Displaying
**Solution:** Check RLS policies in database, verify user authentication

### Issue: Page Shows 404
**Solution:** Check that page file exists in correct directory structure

### Issue: Sidebar Links Not Working
**Solution:** Verify links use correct paths, check Next.js routing configuration

---

## Testing Strategy

### Unit Tests
```typescript
// components/__tests__/maintenance-request-form.test.tsx
import { render, screen } from '@testing-library/react'
import { MaintenanceRequestForm } from '../forms/maintenance-request-form'

describe('MaintenanceRequestForm', () => {
  it('renders form with all fields', () => {
    render(<MaintenanceRequestForm />)
    expect(screen.getByLabelText(/issue title/i)).toBeInTheDocument()
  })
})
```

### Integration Tests
```typescript
// Test form submission with mocked API
it('submits form data correctly', async () => {
  const mockSubmit = jest.fn()
  render(<MaintenanceRequestForm onSubmit={mockSubmit} />)
  
  // Fill form
  // Submit
  // Verify mockSubmit was called
})
```

### E2E Tests
```typescript
// tests/e2e/tenant-maintenance.spec.ts
import { test, expect } from '@playwright/test'

test('create maintenance request', async ({ page }) => {
  await page.goto('/tenant/maintenance')
  await page.click('button:has-text("New Request")')
  await page.fill('input[placeholder="e.g. Leaky faucet"]', 'Test issue')
  await page.click('button:has-text("Submit Request")')
  await expect(page).toContainText('Request created')
})
```

---

## Performance Optimization

### 1. Lazy Loading Components
```typescript
import dynamic from 'next/dynamic'

const MaintenanceRequests = dynamic(
  () => import('@/components/tenantView/maintenance-requests'),
  { loading: () => <div>Loading...</div> }
)
```

### 2. Data Pagination
```typescript
const [page, setPage] = useState(1)
const { data } = await supabase
  .from('maintenance_requests')
  .select()
  .range((page - 1) * 10, page * 10 - 1)
```

### 3. Memoization
```typescript
const MemoizedMaintenanceRequests = React.memo(MaintenanceRequests)
```

---

## Security Checklist

- [ ] All user IDs validated server-side
- [ ] RLS policies verified on all tables
- [ ] File uploads validated (type, size)
- [ ] XSS protection enabled
- [ ] CSRF tokens on forms (if needed)
- [ ] Sensitive data not exposed in logs
- [ ] API endpoints protected with auth
- [ ] Rate limiting implemented
- [ ] Input sanitization in place
- [ ] Secure headers configured

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Security audit completed

### Deployment
- [ ] Build succeeds (`npm run build`)
- [ ] No errors in build output
- [ ] Environment variables in production
- [ ] Database backup created
- [ ] Rollback plan ready

### Post-Deployment
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] Data displays properly
- [ ] Notifications working
- [ ] Monitoring enabled
- [ ] Error logging active

---

## Maintenance

### Monthly Tasks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Backup database

### Quarterly Tasks
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Review and update documentation
- [ ] Security penetration testing
- [ ] Performance profiling

---

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run lint                   # Run linter
npm run build                  # Build for production

# Database
supabase db push              # Push migrations
supabase db pull              # Pull schema
supabase functions deploy     # Deploy functions

# Testing
npm test                       # Run tests
npm run test:e2e              # Run E2E tests
npm run test:coverage         # Coverage report

# Deployment
npm run build && npm start    # Production build
```

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Radix UI Components](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## Support & Contact

For issues or questions:
1. Check existing documentation
2. Review error messages in console
3. Check Supabase dashboard for data issues
4. Review RLS policies
5. Check network requests in DevTools

---

## Summary

This implementation guide provides everything needed to:
- ✅ Verify the build
- ✅ Integrate APIs
- ✅ Set up file uploads
- ✅ Add notifications
- ✅ Test thoroughly
- ✅ Deploy confidently
- ✅ Maintain effectively

All components and pages are production-ready and waiting for backend integration.
