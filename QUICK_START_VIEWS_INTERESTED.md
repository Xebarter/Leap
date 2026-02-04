# Quick Start: Property Views & Interested Feature

## 🚀 Setup in 3 Steps

### Step 1: Run Database Migration (Required)
Execute this SQL in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor
# Copy and run: scripts/ADD_PROPERTY_VIEWS_INTERESTED.sql
```

This creates:
- ✅ `property_views` table
- ✅ `property_interested` table  
- ✅ Automatic counting triggers
- ✅ Security policies

### Step 2: Verify Setup
Check if tables exist:
```sql
SELECT COUNT(*) FROM property_views;
SELECT COUNT(*) FROM property_interested;
SELECT daily_views_count, interested_count FROM properties LIMIT 1;
```

### Step 3: Test the Feature
1. Open any property details page
2. ✅ See view counter increment
3. ✅ Click "I'm Interested" button
4. ✅ See interested counter increase

---

## 📊 What You Get

### Real-time Metrics
```
┌─────────────────────────────────┐
│  👁️  124 Views today            │
│  👥  8 Interested               │
└─────────────────────────────────┘
```

### User Actions
- **"I'm Interested" button** - Users can express interest
- **Toggle functionality** - Add or remove interest
- **Live updates** - Counters update instantly

---

## 🎯 How It Works

### Automatic View Tracking
```typescript
// Happens automatically on page load
useEffect(() => {
  fetch(`/api/properties/${id}/view`, { method: 'POST' })
}, [id])
```

### Interest Expression
```typescript
// User clicks "I'm Interested"
handleExpressInterest() → API call → Counter updates
```

---

## 📈 For Admins/Landlords

### View Analytics
```sql
-- Most viewed properties
SELECT title, daily_views_count 
FROM properties 
ORDER BY daily_views_count DESC 
LIMIT 10;

-- Most interested properties
SELECT title, interested_count 
FROM properties 
ORDER BY interested_count DESC 
LIMIT 10;

-- See who's interested
SELECT u.email, pi.interested_at, p.title
FROM property_interested pi
JOIN auth.users u ON pi.user_id = u.id
JOIN properties p ON pi.property_id = p.id
WHERE p.landlord_id = 'your-id'
ORDER BY pi.interested_at DESC;
```

---

## 🔐 Security

- ✅ **Anonymous users** can view and express interest
- ✅ **Session-based** tracking (no spam)
- ✅ **One interest** per user per property
- ✅ **RLS policies** protect data
- ✅ **Users can remove** their interest anytime

---

## 🎨 UI Features

### Engagement Stats Card
- 👁️ **Views Today** - Resets daily at midnight
- 👥 **Interested** - Total users interested
- Clean professional design

### Interest Button
- **Default State**: "I'm Interested" button
- **Interested State**: ✓ "You're interested" + Remove button
- **Loading State**: "Processing..." with disabled button
- Toast notifications on success/error

---

## 🐛 Troubleshooting

### Views not counting?
```sql
-- Check if property_views table exists
SELECT * FROM property_views LIMIT 1;

-- Check if triggers are working
SELECT daily_views_count FROM properties WHERE id = 'property-id';
```

### Interest button not working?
- Ensure user is authenticated (or check API allows anonymous)
- Check browser console for errors
- Verify API route: `/api/properties/[id]/interested`

### Counts showing 0?
- Run the SQL migration script
- Check that columns were added to properties table
- Reload the property page

---

## 📁 Files Overview

### Database
- `scripts/ADD_PROPERTY_VIEWS_INTERESTED.sql` - Complete schema

### API
- `app/api/properties/[id]/view/route.ts` - Track views
- `app/api/properties/[id]/interested/route.ts` - Track interest

### UI
- `app/(public)/properties/[id]/property-details-content.tsx` - Display & interactions

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ View counter increases when you refresh the page
2. ✅ "I'm Interested" button changes after clicking
3. ✅ Interested counter increments
4. ✅ Toast notification appears
5. ✅ You can remove interest and counter decrements

---

## 🎉 That's It!

The feature is now fully functional:
- **Automatic view tracking** ✅
- **Interest expression** ✅
- **Real-time counters** ✅
- **Professional UI** ✅

Need more details? See: `PROPERTY_VIEWS_INTERESTED_FEATURE.md`

---

**Status**: ✅ Production Ready
**Setup Time**: 5 minutes
**Difficulty**: Easy
