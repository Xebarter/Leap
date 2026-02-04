# Landlord Management System - Complete Guide

## Overview

A comprehensive landlord/property owner management system has been successfully implemented for your rental property management platform. This system allows admins to manage landlords, track their properties, process commission payments, and handle verification workflows.

---

## 🎯 Features Implemented

### 1. **Database Schema** (`scripts/LANDLORDS_SCHEMA.sql`)
- ✅ `landlord_profiles` table - Extended landlord information
- ✅ `landlord_payments` table - Commission payment tracking
- ✅ `landlord_documents` table - Verification documents storage
- ✅ Row Level Security (RLS) policies for data protection
- ✅ Automated triggers for statistics updates
- ✅ Views for landlord analytics and reporting

### 2. **Admin Page** (`app/(dashboard)/admin/landlords/page.tsx`)
- ✅ Server-side data fetching with Supabase
- ✅ Authentication and authorization checks
- ✅ Integration with admin layout and sidebar

### 3. **Comprehensive UI Component** (`components/adminView/comprehensive-landlord-manager.tsx`)
- ✅ Dashboard with key statistics (total landlords, active, verified, pending)
- ✅ Advanced search and filtering (by status, verification status)
- ✅ Interactive landlord table with expandable details
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Quick actions dropdown menu
- ✅ Status management (Active, Suspended, Inactive, Blacklisted)
- ✅ Verification workflow (Verify, Reject, Pending)
- ✅ Detailed landlord profiles with tabs:
  - Overview (Personal, Business, Banking, Statistics)
  - Properties listing
  - Commission payments history
  - Documents management

### 4. **Create/Edit Form Dialog**
- ✅ Multi-tab form for organized data entry:
  - **Basic Info**: User account, phone numbers, address
  - **Business**: Business details, status, verification, notes
  - **Banking**: Bank account and mobile money information
  - **Settings**: Commission rate, payment schedule
- ✅ Form validation and error handling
- ✅ User dropdown (filtered by landlord role)
- ✅ Real-time updates with toast notifications

---

## 📊 Database Schema Details

### Landlord Profiles Table
```sql
CREATE TABLE landlord_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  business_name TEXT,
  business_registration_number TEXT,
  phone_number TEXT,
  alternative_phone TEXT,
  business_address TEXT,
  city TEXT,
  district TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  mobile_money_number TEXT,
  mobile_money_provider TEXT,
  status TEXT (pending|active|inactive|suspended|blacklisted),
  verification_status TEXT (unverified|pending|verified|rejected),
  commission_rate DECIMAL(5,2),
  payment_schedule TEXT (weekly|monthly|quarterly|annually),
  total_properties INTEGER,
  total_units INTEGER,
  occupied_units INTEGER,
  total_revenue_ugx BIGINT,
  total_commission_paid_ugx BIGINT,
  notes TEXT,
  rating DECIMAL(3,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Landlord Payments Table
```sql
CREATE TABLE landlord_payments (
  id UUID PRIMARY KEY,
  landlord_id UUID REFERENCES landlord_profiles(id),
  amount_ugx BIGINT,
  commission_rate DECIMAL(5,2),
  period_start DATE,
  period_end DATE,
  status TEXT (pending|processing|completed|failed|cancelled),
  payment_method TEXT,
  transaction_reference TEXT,
  paid_date TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id),
  description TEXT,
  notes TEXT
);
```

### Landlord Documents Table
```sql
CREATE TABLE landlord_documents (
  id UUID PRIMARY KEY,
  landlord_id UUID REFERENCES landlord_profiles(id),
  document_type TEXT (id_document|business_license|tax_certificate|property_title|proof_of_ownership|contract|other),
  document_name TEXT,
  document_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  is_verified BOOLEAN,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  description TEXT,
  notes TEXT
);
```

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration
```sql
-- Execute in your Supabase SQL Editor
-- File: scripts/LANDLORDS_SCHEMA.sql

-- This will create:
-- 1. All landlord tables
-- 2. RLS policies
-- 3. Indexes for performance
-- 4. Triggers for auto-updates
-- 5. Views for analytics
```

### Step 2: Update User Roles
Before creating landlord profiles, ensure users have the correct role:

```sql
-- Update a user's role to landlord
UPDATE public.profiles 
SET role = 'landlord' 
WHERE email = 'landlord@example.com';
```

### Step 3: Configure Storage (Optional)
If you want to enable document uploads:

```sql
-- Create storage bucket for landlord documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('landlord-documents', 'landlord-documents', false);

-- Set up RLS policies for storage
CREATE POLICY "Landlords can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landlord-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Landlords can view their documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'landlord-documents');

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'landlord-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

---

## 🎨 Usage Guide

### Accessing the Landlords Page
1. Navigate to: `/admin/landlords`
2. Only admins can access this page
3. The sidebar now includes a "Landlords" menu item

### Creating a New Landlord
1. Click the **"Add Landlord"** button
2. Fill in the form across multiple tabs:
   - **Basic Info**: Select user account (must have landlord role), phone numbers, address
   - **Business**: Optional business name, status, verification status, admin notes
   - **Banking**: Bank account and mobile money details for payments
   - **Settings**: Commission rate (default 10%), payment schedule
3. Click **"Create Landlord"**

### Managing Landlords
- **Search**: Use the search bar to find by name, email, business name, or phone
- **Filter**: Filter by status (Active, Pending, etc.) or verification status
- **View Details**: Click on a row to expand and see full details
- **Quick Actions**: Use the "..." menu for quick status changes:
  - Set Active/Suspend
  - Verify/Reject verification
  - Edit or Delete

### Landlord Details Tabs
When you expand a landlord row, you'll see:
1. **Overview**: All personal, business, banking info and statistics
2. **Properties**: List of all properties owned by this landlord
3. **Payments**: Commission payment history
4. **Documents**: Uploaded verification documents

### Verification Workflow
1. New landlords start with status: `pending`, verification: `unverified`
2. Admin reviews landlord information and documents
3. Admin clicks **"Verify"** to approve or **"Reject Verification"**
4. Verification date is automatically recorded
5. Update status to **"Active"** to allow full access

---

## 🔧 Integration with Properties

### Linking Properties to Landlords
The schema adds a `landlord_id` column to the properties table:

```sql
-- Properties are automatically linked when created
-- The trigger updates landlord statistics

-- To manually link a property:
UPDATE public.properties
SET landlord_id = 'landlord-uuid-here'
WHERE id = 'property-uuid-here';
```

### Automatic Statistics Updates
Triggers automatically update:
- `total_properties`: Count of properties owned
- `total_units`: Count of units across all properties
- Statistics update whenever properties are added/removed

---

## 💳 Commission Payment Management

### Creating Commission Payments
```typescript
// Example: Create a payment record
const { error } = await supabase
  .from('landlord_payments')
  .insert({
    landlord_id: 'landlord-uuid',
    amount_ugx: 500000,
    commission_rate: 10.00,
    period_start: '2024-01-01',
    period_end: '2024-01-31',
    status: 'pending',
    description: 'Commission for January 2024'
  });
```

### Payment Workflow
1. System calculates commission based on rental income
2. Payment record created with status: `pending`
3. Admin processes payment (bank transfer/mobile money)
4. Update status to `completed` and add transaction reference
5. Payment appears in landlord's payment history

---

## 📈 Statistics Dashboard

The top dashboard shows:
- **Total Landlords**: All registered landlords
- **Active**: Currently active landlords
- **Verified**: Landlords who passed verification
- **Pending**: Awaiting verification
- **Properties**: Total properties managed
- **Total Units**: Total units across all properties

---

## 🔒 Security & Permissions

### Row Level Security (RLS)
All tables have RLS enabled with policies:

**Admins can:**
- View all landlords
- Create/edit/delete landlords
- View all payments and documents
- Update verification status

**Landlords can:**
- View their own profile
- Update their own profile (limited fields)
- View their own payments
- Upload their own documents

---

## 🎯 Best Practices

1. **Verification First**: Always verify landlords before setting them active
2. **Document Everything**: Encourage landlords to upload verification documents
3. **Regular Reviews**: Periodically review landlord ratings and performance
4. **Clear Communication**: Use the notes field for internal tracking
5. **Commission Transparency**: Keep payment records up-to-date

---

## 🐛 Troubleshooting

### Landlord Creation Fails
- Ensure the user has role set to `landlord`
- Check that user_id exists in profiles table
- Verify RLS policies are properly configured

### Statistics Not Updating
- Check that triggers are active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%landlord%';`
- Manually refresh: Update a property to trigger the statistics function

### Cannot See Landlord Menu
- Verify user has `is_admin = true` or `role = 'admin'`
- Clear browser cache
- Check middleware authentication

---

## 🚀 Next Steps & Enhancements

### Recommended Additions
1. **Document Upload UI**: Add file upload functionality to the documents tab
2. **Payment Processing**: Integrate with mobile money APIs for automatic payments
3. **Analytics Dashboard**: Create landlord performance metrics
4. **Email Notifications**: Send notifications on verification status changes
5. **Landlord Portal**: Create a landlord-specific dashboard (separate from admin)
6. **Rating System**: Allow tenants to rate landlords
7. **Reporting**: Generate PDF reports for landlord earnings

### Future Features
- Multi-landlord property ownership
- Landlord contracts management
- Automated commission calculations
- Property handover workflows
- Landlord communication center

---

## 📝 API Examples

### Fetch All Landlords
```typescript
const { data: landlords } = await supabase
  .from('landlord_profiles')
  .select(`
    *,
    profiles:user_id (full_name, email, avatar_url)
  `)
  .order('created_at', { ascending: false });
```

### Update Landlord Status
```typescript
const { error } = await supabase
  .from('landlord_profiles')
  .update({ status: 'active' })
  .eq('id', landlordId);
```

### Verify Landlord
```typescript
const { error } = await supabase
  .from('landlord_profiles')
  .update({ 
    verification_status: 'verified',
    verification_date: new Date().toISOString()
  })
  .eq('id', landlordId);
```

---

## 📞 Support

For issues or questions:
1. Check the database logs in Supabase
2. Review RLS policies if permission errors occur
3. Ensure all migrations have run successfully
4. Check browser console for client-side errors

---

## ✅ Completion Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] Admin page created
- [x] Comprehensive UI component built
- [x] CRUD operations implemented
- [x] Search and filtering added
- [x] Expandable details view
- [x] Create/Edit dialog form
- [x] Status management
- [x] Verification workflow
- [x] Statistics dashboard
- [x] Sidebar navigation updated
- [x] Documentation created

---

**The landlord management system is now fully functional and ready to use!** 🎉

Simply run the database migration script and start managing your landlords through the admin panel at `/admin/landlords`.
