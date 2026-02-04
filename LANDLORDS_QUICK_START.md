# 🚀 Landlords Management - Quick Start Guide

## ✅ What Was Created

### 1. **Database Schema** 
- **File**: `scripts/LANDLORDS_SCHEMA.sql`
- Tables: `landlord_profiles`, `landlord_payments`, `landlord_documents`
- RLS policies, triggers, and views included

### 2. **Admin Page**
- **File**: `app/(dashboard)/admin/landlords/page.tsx`
- Route: `/admin/landlords`
- Accessible only to admins

### 3. **UI Component**
- **File**: `components/adminView/comprehensive-landlord-manager.tsx`
- Features: CRUD operations, search, filters, expandable details

### 4. **Navigation**
- Updated `components/adminView/admin-sidebar.tsx`
- Added "Landlords" menu item

---

## 🎯 Setup Steps (3 Minutes)

### Step 1: Run Database Migration
1. Open your **Supabase SQL Editor**
2. Copy and paste the entire content from `scripts/LANDLORDS_SCHEMA.sql`
3. Click **Run** to execute
4. Verify: You should see confirmation that tables, policies, and triggers were created

### Step 2: Create Test Landlord User
```sql
-- First, create a test landlord account or update an existing user
UPDATE public.profiles 
SET role = 'landlord' 
WHERE email = 'test-landlord@example.com';
```

### Step 3: Access the Landlords Page
1. Login as an admin user
2. Navigate to `/admin/landlords`
3. You should see the landlords management interface

---

## 🎨 Quick Feature Tour

### Dashboard Statistics
View at a glance:
- Total landlords
- Active landlords
- Verified landlords
- Pending verifications
- Total properties managed
- Total units

### Search & Filter
- **Search**: By name, email, business name, or phone
- **Filter by Status**: Active, Pending, Inactive, Suspended
- **Filter by Verification**: Verified, Pending, Unverified, Rejected

### Add New Landlord
1. Click **"Add Landlord"** button
2. Fill in 4 tabs:
   - **Basic Info**: User account, phones, address
   - **Business**: Business details, status, notes
   - **Banking**: Bank & mobile money info
   - **Settings**: Commission rate, payment schedule
3. Click **"Create Landlord"**

### View Details
- Click any row to expand
- See 4 tabs: Overview, Properties, Payments, Documents

### Quick Actions (... menu)
- View Details
- Edit
- Set Active / Suspend
- Verify / Reject Verification
- Delete

---

## 📊 Key Features

✅ **Full CRUD Operations** - Create, Read, Update, Delete
✅ **Status Management** - Active, Pending, Suspended, Inactive, Blacklisted
✅ **Verification Workflow** - Verify or reject landlord accounts
✅ **Commission Tracking** - Set custom commission rates per landlord
✅ **Payment History** - Track commission payments
✅ **Document Management** - Store and verify landlord documents
✅ **Property Linking** - Automatic property and unit counting
✅ **Search & Filters** - Find landlords quickly
✅ **Expandable Details** - View comprehensive landlord info
✅ **Mobile Responsive** - Works on all devices

---

## 🔗 Integration with Properties

### Linking Properties to Landlords
When creating/editing a property, you can assign it to a landlord:

```typescript
// Properties automatically link when landlord_id is set
// Statistics update automatically via triggers
```

The `landlord_id` column has been added to the properties table by the migration script.

---

## 💡 Common Tasks

### Create First Landlord
```sql
-- 1. Ensure user has landlord role
UPDATE profiles SET role = 'landlord' WHERE email = 'john@example.com';

-- 2. Use the admin UI to create landlord profile
-- Go to /admin/landlords > Add Landlord
```

### Verify a Landlord
1. Click on landlord row to expand
2. Review their information and documents
3. Click "..." menu > Verify
4. Update status to "Active"

### Track Payments
```sql
-- Create a commission payment record
INSERT INTO landlord_payments (
  landlord_id,
  amount_ugx,
  commission_rate,
  period_start,
  period_end,
  status
) VALUES (
  'landlord-uuid',
  500000,
  10.00,
  '2024-01-01',
  '2024-01-31',
  'completed'
);
```

---

## 🔒 Security Features

- **RLS Enabled** - All tables have Row Level Security
- **Admin Access** - Only admins can manage all landlords
- **Landlord Access** - Landlords can view/edit their own profile
- **Audit Trail** - Created/updated timestamps on all records

---

## 🎯 Next Steps

1. **Document Upload** - Add file upload for verification documents
2. **Email Notifications** - Send emails on status changes
3. **Analytics Dashboard** - Create landlord performance metrics
4. **Landlord Portal** - Build landlord-facing dashboard
5. **Automated Payments** - Integrate payment processing

---

## 📞 Troubleshooting

### Cannot see Landlords menu?
- Ensure you're logged in as admin
- Check `profiles.is_admin = true` or `profiles.role = 'admin'`

### Cannot create landlord?
- Ensure user has `role = 'landlord'` in profiles table
- Check RLS policies are active

### Statistics not updating?
- Triggers should auto-update
- Manually update a property to trigger recalculation

---

## 📝 Files Created/Modified

```
✅ scripts/LANDLORDS_SCHEMA.sql (NEW)
✅ app/(dashboard)/admin/landlords/page.tsx (NEW)
✅ components/adminView/comprehensive-landlord-manager.tsx (NEW)
✅ components/adminView/admin-sidebar.tsx (MODIFIED)
✅ LANDLORDS_MANAGEMENT_GUIDE.md (NEW)
✅ LANDLORDS_QUICK_START.md (NEW)
```

---

**🎉 You're all set! Start managing your landlords at `/admin/landlords`**
