# Admin Occupancy Management UI - Complete Guide

## Overview

A comprehensive admin interface for managing property occupancies, extending periods, viewing history, and monitoring revenue. This UI provides full control over the property occupancy lifecycle.

---

## 🎯 Features

### **Dashboard Overview**
- ✅ Real-time statistics (Total Occupied, Expiring Soon, Expired, Total Revenue)
- ✅ Color-coded status badges
- ✅ Sortable property table
- ✅ Quick action buttons

### **Property Management**
- ✅ View all occupied properties
- ✅ See tenant information
- ✅ Track start/end dates
- ✅ Monitor days remaining

### **Occupancy Extension**
- ✅ Extend occupancy by 1-12 months
- ✅ Add reason for extension
- ✅ Preview new end date
- ✅ Track extension history

### **Occupancy Cancellation**
- ✅ Cancel occupancy early
- ✅ Add reason for cancellation
- ✅ Immediately make property available

### **History Tracking**
- ✅ View complete occupancy history
- ✅ Filter by property
- ✅ See all transactions
- ✅ Track extensions and cancellations

---

## 🚀 Access the Admin UI

### **Navigate to Occupancies Page**

1. **Login as Admin**
   - Go to `/auth/login`
   - Sign in with admin credentials

2. **Access Admin Dashboard**
   - Navigate to `/admin`
   - You'll see the admin sidebar

3. **Open Occupancies**
   - Click **"Occupancies"** in the sidebar
   - Or navigate directly to `/admin/occupancies`

---

## 📊 Dashboard Overview

### **Statistics Cards**

#### **Total Occupied**
- Shows number of currently occupied properties
- Icon: Home
- Updates in real-time

#### **Expiring Soon**
- Properties expiring within 30 days
- Icon: Alert (Yellow)
- Helps prioritize follow-ups

#### **Expired**
- Properties past their occupancy end date
- Icon: X (Red)
- Need immediate attention

#### **Total Revenue**
- Sum of all occupied property revenues
- Calculated: `(price_ugx / 100) × paid_months`
- Formatted in UGX

---

## 📋 Properties Table

### **Columns**

1. **Property**
   - Property title
   - Location
   - Property code (10-digit)

2. **Tenant**
   - Full name
   - Email address

3. **Start Date**
   - When occupancy began
   - Format: MMM DD, YYYY

4. **End Date**
   - When occupancy expires
   - Format: MMM DD, YYYY

5. **Status**
   - 🔴 **Expired** (past end date)
   - 🟡 **Expires in X days** (≤30 days)
   - 🟢 **X days remaining** (>30 days)

6. **Months Paid**
   - Number of months tenant paid for
   - Badge display

7. **Actions**
   - Extend button
   - History button
   - Cancel button

---

## ⚙️ Actions Guide

### **1. Extend Occupancy**

**Purpose**: Add more months to an existing occupancy period

**Steps**:
1. Click **"Extend"** button on property row
2. Dialog opens with form:
   - **Additional Months**: Enter 1-12 months
   - **Reason**: Optional explanation
3. Review preview:
   - Current end date
   - New end date (calculated)
4. Click **"Extend Occupancy"**
5. Success toast appears
6. Table refreshes automatically

**Example Use Cases**:
- Tenant wants to extend lease
- Payment received via bank transfer
- Special arrangements made

**Database Changes**:
- Updates `occupancy_end_date`
- Increments `paid_months`
- Creates history record with status: `extended`
- Tracks who extended and when

---

### **2. View History**

**Purpose**: See complete occupancy timeline for a property

**Steps**:
1. Click **"History"** button on property row
2. Dialog opens showing:
   - All past occupancies
   - Current occupancy
   - Extension records
   - Cancellation records

**Table Columns**:
- Property (title, location)
- Tenant (name, email)
- Period (start to end date)
- Months paid
- Amount paid
- Status (active, expired, extended, cancelled)

**Filters**:
- Click "View All History" for all properties
- Click property-specific history for single property

**Status Badges**:
- 🟢 **Active**: Currently occupied
- 🔵 **Extended**: Has been extended
- ⚪ **Expired**: Period completed naturally
- 🔴 **Cancelled**: Terminated early

---

### **3. Cancel Occupancy**

**Purpose**: Terminate occupancy early and make property available

**Steps**:
1. Click **"Cancel"** (red button) on property row
2. Confirmation dialog opens
3. Enter **Reason for Cancellation**:
   - Required for audit trail
   - Examples: "Tenant moved out early", "Property maintenance needed"
4. Click **"Yes, Cancel Occupancy"**
5. Property immediately becomes available
6. Success toast appears

**What Happens**:
- Property marked: `is_occupied = false`
- All occupancy fields cleared
- History updated: `status = cancelled`
- Property reappears in public listings
- Tenant loses access

**Warning**: This action immediately makes the property available to new tenants!

---

### **4. Refresh Data**

**Purpose**: Get latest occupancy data

**Steps**:
1. Click **"Refresh"** button (top right)
2. Data reloads from database
3. Statistics update
4. Table refreshes

**When to Use**:
- After making changes in database
- To check if cron job ran
- To see latest payment confirmations

---

## 🎨 UI Components

### **Status Badges**

#### **Expired** (Red)
```
Appears when: getDaysRemaining(endDate) < 0
Color: Destructive/Red
Text: "Expired"
```

#### **Expiring Soon** (Yellow)
```
Appears when: getDaysRemaining(endDate) <= 7
Color: Yellow-500
Text: "Expires in X days"
```

#### **Expiring This Month** (Yellow)
```
Appears when: 7 < getDaysRemaining(endDate) <= 30
Color: Yellow-500
Text: "Expires in X days"
```

#### **Active** (Green)
```
Appears when: getDaysRemaining(endDate) > 30
Color: Default/Green
Text: "X days remaining"
```

---

## 🔧 Technical Details

### **API Endpoints Used**

#### **GET /api/admin/occupancies**
- Fetches all occupied properties
- Includes tenant details via join
- Requires admin authentication
- Returns array of properties

#### **POST /api/admin/occupancies/extend**
```json
{
  "propertyId": "uuid",
  "additionalMonths": 3,
  "reason": "Tenant requested extension"
}
```

#### **GET /api/admin/occupancies/history**
```
Query params: ?propertyId=uuid (optional)
```

#### **POST /api/admin/occupancies/cancel**
```json
{
  "propertyId": "uuid",
  "reason": "Property needed for maintenance"
}
```

---

## 📱 Responsive Design

### **Desktop View**
- Full table layout
- All columns visible
- Side-by-side dialogs

### **Mobile View**
- Responsive cards
- Stacked information
- Touch-friendly buttons
- Scrollable tables

---

## 🎯 Best Practices

### **Extending Occupancies**

✅ **Do**:
- Always add a reason for audit trail
- Verify payment received before extending
- Communicate with tenant about extension
- Check property condition before extending

❌ **Don't**:
- Extend without payment confirmation
- Extend more than 12 months at once
- Forget to document the reason

### **Cancelling Occupancies**

✅ **Do**:
- Verify tenant has moved out
- Document clear reason
- Check for any outstanding issues
- Inspect property before making available

❌ **Don't**:
- Cancel without proper notice
- Skip documentation
- Forget to check property condition

### **Monitoring**

✅ **Do**:
- Check "Expiring Soon" daily
- Review expired properties weekly
- Contact tenants 30 days before expiry
- Keep history for records

---

## 🔍 Troubleshooting

### **Properties Not Showing**

**Problem**: Occupied properties not appearing in list

**Solutions**:
1. Click "Refresh" button
2. Check if properties are marked: `is_occupied = true`
3. Verify admin permissions
4. Check browser console for errors

### **Can't Extend Property**

**Problem**: Extend button is disabled

**Possible Causes**:
1. `can_extend_occupancy` is set to `false`
2. Property is expired (may need manual intervention)
3. Database permission issues

**Solution**:
```sql
UPDATE properties 
SET can_extend_occupancy = true 
WHERE id = 'property-id';
```

### **History Not Loading**

**Problem**: History dialog is empty

**Solutions**:
1. Check if property has occupancy history
2. Verify database function access
3. Check RLS policies
4. Look at browser console for errors

---

## 📊 Database Queries

### **Manual Queries for Admins**

#### **Check All Occupied Properties**
```sql
SELECT 
  p.title,
  p.location,
  p.occupancy_end_date,
  pr.full_name as tenant,
  p.paid_months
FROM properties p
JOIN profiles pr ON pr.id = p.occupied_by
WHERE p.is_occupied = TRUE
ORDER BY p.occupancy_end_date ASC;
```

#### **Find Expiring Soon**
```sql
SELECT * FROM properties
WHERE is_occupied = TRUE
AND occupancy_end_date <= NOW() + INTERVAL '30 days'
ORDER BY occupancy_end_date ASC;
```

#### **View Extension History**
```sql
SELECT * FROM property_occupancy_history
WHERE status = 'extended'
ORDER BY extended_at DESC;
```

#### **Total Revenue This Month**
```sql
SELECT 
  SUM((price_ugx / 100) * paid_months) as total_revenue
FROM properties
WHERE is_occupied = TRUE
AND DATE_TRUNC('month', occupancy_start_date) = DATE_TRUNC('month', NOW());
```

---

## 🚀 Keyboard Shortcuts

Coming soon! (Future enhancement)

---

## 📈 Future Enhancements

Potential features for future versions:

- [ ] Bulk extend multiple properties
- [ ] Email notifications to tenants
- [ ] Export history to CSV/PDF
- [ ] Calendar view of expirations
- [ ] Payment reminder system
- [ ] Grace period configuration
- [ ] Auto-renewal options
- [ ] Tenant communication portal
- [ ] Revenue analytics charts
- [ ] Search and filter options

---

## 💡 Tips & Tricks

### **Efficient Workflow**

1. **Start of Day**:
   - Check "Expiring Soon" count
   - Review expired properties
   - Contact tenants for renewals

2. **Weekly Review**:
   - Export history report
   - Analyze extension patterns
   - Plan for upcoming expirations

3. **Month End**:
   - Review total revenue
   - Check for payment confirmations
   - Prepare renewal notices

### **Common Scenarios**

#### **Scenario 1: Tenant Wants to Extend**
1. Verify payment received
2. Click "Extend" on property
3. Enter months and reason
4. Confirm extension
5. Send confirmation email to tenant

#### **Scenario 2: Tenant Moved Out Early**
1. Verify property is vacant
2. Inspect property condition
3. Click "Cancel" on property
4. Enter reason for records
5. Property becomes available

#### **Scenario 3: Payment Verification**
1. Check "History" for property
2. Verify transaction details
3. Confirm payment amount
4. Match with bank records
5. Extend if payment confirmed

---

## 📞 Support

For technical issues:
1. Check browser console for errors
2. Verify database schema is up to date
3. Run SQL migration if needed
4. Check API endpoint responses
5. Review RLS policies

---

## ✅ Checklist for Admins

### **Daily Tasks**
- [ ] Check expired properties
- [ ] Review expiring soon (< 7 days)
- [ ] Process extension requests
- [ ] Verify new payments

### **Weekly Tasks**
- [ ] Review all occupancies
- [ ] Contact tenants expiring in 30 days
- [ ] Check revenue statistics
- [ ] Review history logs

### **Monthly Tasks**
- [ ] Export occupancy report
- [ ] Analyze extension patterns
- [ ] Review cancellation reasons
- [ ] Plan maintenance for expiring properties

---

**Last Updated**: 2026-01-31
**Version**: 1.0.0
**Status**: ✅ Production Ready
