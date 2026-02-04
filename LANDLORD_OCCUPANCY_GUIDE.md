# Landlord Occupancy Management System - Complete Guide

## Overview

A dedicated occupancy management interface for landlords to track their occupied properties, view tenant information, extend lease periods, and monitor revenue from their property portfolio.

---

## 🎯 Features

### **Dashboard Overview**
- ✅ View all YOUR occupied properties only
- ✅ Real-time statistics (Total Occupied, Expiring Soon, Expired, Revenue)
- ✅ Color-coded status badges
- ✅ Tenant contact information
- ✅ Revenue tracking per property

### **Property Management**
- ✅ See which of your properties are occupied
- ✅ View tenant details (name, email, phone)
- ✅ Track occupancy dates
- ✅ Monitor days remaining

### **Occupancy Extension**
- ✅ Extend tenant lease by 1-12 months
- ✅ Add reason for extension
- ✅ See revenue impact preview
- ✅ Track extension history

### **History Tracking**
- ✅ View complete occupancy history for your properties
- ✅ Filter by specific property
- ✅ See all past tenants
- ✅ Track revenue over time

---

## 🚀 Access the Landlord UI

### **Navigate to Occupancies Page**

1. **Login as Landlord**
   - Go to `/auth/login`
   - Sign in with your landlord credentials

2. **Access Landlord Dashboard**
   - Navigate to `/landlord`
   - You'll see the landlord sidebar

3. **Open Occupancies**
   - Click **"Occupancies"** in the sidebar (Key icon)
   - Or navigate directly to `/landlord/occupancies`

---

## 📊 Dashboard Overview

### **Statistics Cards**

#### **My Occupied Properties**
- Shows count of YOUR properties that are currently occupied
- Icon: Home
- Updates in real-time

#### **Expiring Soon**
- Your properties expiring within 30 days
- Icon: Alert (Yellow)
- Helps plan for tenant renewals

#### **Expired**
- Your properties past their occupancy end date
- Icon: Alert (Red)
- Properties that need attention

#### **Total Revenue**
- Sum of revenue from all YOUR occupied properties
- Calculated: `Σ(price × months_paid)` for your properties only
- Formatted in UGX

---

## 📋 Properties Table

### **Columns**

1. **Property**
   - Your property title
   - Location
   - Property code (10-digit)

2. **Tenant**
   - Full name
   - Email address
   - Phone number (if available)

3. **Start Date**
   - When tenant's occupancy began
   - Format: MMM DD, YYYY

4. **End Date**
   - When occupancy expires
   - Format: MMM DD, YYYY

5. **Status**
   - 🔴 **Expired** (past end date)
   - 🟡 **Expires in X days** (≤30 days)
   - 🟢 **X days remaining** (>30 days)

6. **Revenue**
   - Total amount earned from this occupancy
   - Shows: `price × months_paid`
   - Displays months paid

7. **Actions**
   - Extend button
   - History button

---

## ⚙️ Actions Guide

### **1. Extend Occupancy**

**Purpose**: Add more months to a tenant's lease

**Steps**:
1. Click **"Extend"** button on property row
2. Dialog opens with form:
   - **Additional Months**: Enter 1-12 months
   - **Reason**: Optional explanation (e.g., "Tenant requested extension")
3. Review preview:
   - Current end date
   - New end date (calculated)
   - **Additional Revenue** (in green)
4. Click **"Extend Occupancy"**
5. Success toast appears
6. Table refreshes automatically

**Example Use Cases**:
- Tenant wants to renew lease
- Tenant paid extension via bank transfer
- Long-term tenant arrangement
- Seasonal extension

**What You See**:
```
Additional Revenue: +3,000,000 UGX
(if extending 3 months at 1M/month)
```

**Database Changes**:
- Updates `occupancy_end_date`
- Increments `paid_months`
- Creates history record with status: `extended`
- Records your landlord ID as extender

---

### **2. View History**

**Purpose**: See complete occupancy timeline for your properties

**Steps**:
1. Click **"History"** button on property row (for specific property)
2. OR click **"View History"** button (top right) for all properties
3. Dialog opens showing:
   - All past occupancies for your properties
   - Current occupancy
   - Extension records
   - Revenue earned

**Table Columns**:
- Property (title, location)
- Tenant (name, email)
- Period (start to end date, months paid)
- Revenue (total amount)
- Status (active, expired, extended, cancelled)

**Status Badges**:
- 🟢 **Active**: Currently occupied
- 🔵 **Extended**: Has been extended
- ⚪ **Expired**: Period completed naturally
- 🔴 **Cancelled**: Terminated early by admin

**Benefits**:
- Track tenant history
- See revenue trends
- Identify good long-term tenants
- Plan for future occupancies

---

### **3. Refresh Data**

**Purpose**: Get latest occupancy data for your properties

**Steps**:
1. Click **"Refresh"** button (top right)
2. Data reloads from database
3. Statistics update
4. Table refreshes

**When to Use**:
- After tenant makes payment
- To check if occupancy started
- To see latest status
- After admin makes changes

---

## 🎨 UI Components

### **Status Badges**

#### **Expired** (Red)
```
When: getDaysRemaining(endDate) < 0
Color: Red/Destructive
Text: "Expired"
Action: Contact tenant or admin
```

#### **Expiring Soon** (Yellow)
```
When: getDaysRemaining(endDate) <= 7 days
Color: Yellow-500
Text: "Expires in X days"
Action: Contact tenant about renewal
```

#### **Expiring This Month** (Yellow)
```
When: 7 < getDaysRemaining(endDate) <= 30
Color: Yellow-500
Text: "Expires in X days"
Action: Plan for renewal or new tenant
```

#### **Active** (Green)
```
When: getDaysRemaining(endDate) > 30
Color: Default/Green
Text: "X days remaining"
Action: No immediate action needed
```

---

## 💰 Revenue Tracking

### **Per Property Revenue**

In the table, you'll see:
```
Revenue: 3,000,000 UGX
3 months paid
```

This shows:
- Total amount earned from current occupancy
- Number of months tenant has paid for

### **Total Revenue**

Dashboard shows total across all your occupied properties:
```
Total Revenue: 15,000,000 UGX
From occupied properties
```

### **Revenue Preview (During Extension)**

When extending, you see projected additional revenue:
```
Additional Revenue: +2,000,000 UGX
(for 2 additional months at 1M/month)
```

---

## 📱 Responsive Design

### **Desktop View**
- Full table layout
- All columns visible
- Side-by-side dialogs

### **Tablet View**
- Responsive cards
- Important columns visible
- Touch-friendly buttons

### **Mobile View**
- Stacked information
- Scrollable tables
- Large touch targets

---

## 🎯 Best Practices for Landlords

### **Monitoring Occupancies**

✅ **Do**:
- Check dashboard weekly
- Monitor "Expiring Soon" count
- Contact tenants 30 days before expiry
- Keep track of good tenants
- Document extension reasons

❌ **Don't**:
- Ignore expired occupancies
- Miss renewal opportunities
- Forget to verify payment before extending
- Neglect tenant communication

### **Extending Leases**

✅ **Do**:
- Verify payment received first
- Communicate clearly with tenant
- Document the reason
- Check property condition
- Confirm tenant satisfaction

❌ **Don't**:
- Extend without payment confirmation
- Extend more than 12 months at once
- Skip documentation
- Forget to get tenant agreement in writing

### **Revenue Management**

✅ **Do**:
- Track total revenue monthly
- Monitor payment patterns
- Plan for vacancy periods
- Consider tenant retention incentives
- Keep records of all transactions

---

## 📊 Common Scenarios

### **Scenario 1: Tenant Wants to Extend**

**Situation**: Tenant contacts you wanting to stay 3 more months

**Steps**:
1. Discuss terms with tenant
2. Confirm payment method and amount
3. Receive payment confirmation
4. Navigate to Occupancies dashboard
5. Find the property
6. Click "Extend"
7. Enter: 3 months
8. Reason: "Tenant requested extension - payment received"
9. Review additional revenue: +3,000,000 UGX
10. Click "Extend Occupancy"
11. Confirm with tenant

**Result**: 
- Occupancy extended
- Revenue tracked
- History updated

---

### **Scenario 2: Property Expiring Soon**

**Situation**: Dashboard shows property expiring in 15 days

**Steps**:
1. Check dashboard - see "Expiring Soon: 1"
2. View property details
3. Contact tenant:
   - Ask if they want to renew
   - Discuss terms
   - Confirm payment
4. If renewing:
   - Extend occupancy as above
5. If not renewing:
   - Wait for auto-expiry
   - Property becomes available
   - Plan for new tenant

---

### **Scenario 3: Checking Revenue**

**Situation**: End of month - want to see total revenue

**Steps**:
1. Navigate to Occupancies
2. Check "Total Revenue" card
3. Click "View History" for detailed breakdown
4. Export or screenshot for records
5. Compare with bank statements

---

## 🔍 Troubleshooting

### **Properties Not Showing**

**Problem**: Your occupied properties not appearing

**Solutions**:
1. Click "Refresh" button
2. Verify properties are marked as occupied in system
3. Check that property `host_id` matches your user ID
4. Contact admin if issue persists

### **Can't Extend Property**

**Problem**: Extend button is disabled

**Possible Causes**:
1. Property's `can_extend_occupancy` is set to `false`
2. Property is expired (may need admin intervention)
3. Database permission issues

**Solution**:
- Contact admin to enable extensions
- Verify payment received
- Check property status

### **Revenue Doesn't Match**

**Problem**: Displayed revenue different from records

**Check**:
1. Verify occupancy dates are correct
2. Check months paid count
3. Confirm property price is accurate
4. Review history for extensions
5. Contact admin if discrepancy persists

---

## 🔒 Security & Privacy

### **What You Can See**
- ✅ Only YOUR properties (where you are `host_id`)
- ✅ Tenant contact information for YOUR tenants
- ✅ Payment history for YOUR properties
- ✅ Extension history for YOUR properties

### **What You CANNOT Do**
- ❌ View other landlords' properties
- ❌ Cancel occupancies (admin only)
- ❌ Modify system settings
- ❌ Access tenant financial data beyond occupancy

### **Data Protection**
- All API calls verify property ownership
- Row Level Security (RLS) enforced
- Only your data is returned
- Secure authentication required

---

## 💡 Tips for Success

### **Maximize Occupancy**

1. **Be Proactive**
   - Contact tenants 30 days before expiry
   - Offer renewal incentives
   - Maintain good tenant relationships

2. **Track Patterns**
   - Note which tenants extend frequently
   - Identify seasonal trends
   - Plan maintenance during vacancies

3. **Optimize Revenue**
   - Keep properties in good condition
   - Respond quickly to tenant needs
   - Consider long-term lease discounts

### **Efficient Management**

1. **Weekly Routine**
   - Check "Expiring Soon" count
   - Review new occupancies
   - Monitor total revenue

2. **Monthly Tasks**
   - Export history for records
   - Review extension patterns
   - Contact expiring tenants

3. **Communication**
   - Keep tenant contact info updated
   - Respond to inquiries promptly
   - Document all agreements

---

## 📞 Support

### **Need Help?**

1. **Check this guide** for common questions
2. **Contact admin** for system issues
3. **Refer to property details** for specific property info
4. **Review history** for past patterns

### **Feature Requests**

Have ideas for improving the landlord portal? Contact the admin team!

---

## ✅ Landlord Checklist

### **Daily (Optional)**
- [ ] Check if any new occupancies started
- [ ] Monitor expired properties

### **Weekly**
- [ ] Review "Expiring Soon" properties
- [ ] Contact tenants about renewals
- [ ] Check total revenue

### **Monthly**
- [ ] Export occupancy history
- [ ] Review all active occupancies
- [ ] Plan for upcoming vacancies
- [ ] Analyze revenue trends

### **Before Extending**
- [ ] Verify tenant wants to extend
- [ ] Confirm payment received
- [ ] Check property condition
- [ ] Document reason for extension
- [ ] Update tenant about new end date

---

## 📈 Key Differences from Admin UI

### **Landlord View**
- Shows only YOUR properties
- Focus on revenue tracking
- Tenant relationship management
- Cannot cancel occupancies
- Streamlined for property owners

### **Admin View**
- Shows ALL properties
- System-wide management
- Can cancel occupancies
- More administrative controls
- Platform-level oversight

---

## 🎉 Benefits for Landlords

### **Visibility**
- ✅ See all your occupied properties in one place
- ✅ Real-time status updates
- ✅ Complete history tracking

### **Control**
- ✅ Extend leases independently
- ✅ Track your revenue
- ✅ Monitor tenant information

### **Efficiency**
- ✅ No need to contact admin for extensions
- ✅ Quick access to tenant details
- ✅ Easy renewal management

### **Revenue Optimization**
- ✅ Track earnings per property
- ✅ See total portfolio revenue
- ✅ Plan for future income

---

## 🚀 Getting Started

### **First Time Setup**

1. **Login** to landlord portal
2. **Navigate** to Occupancies
3. **Review** your occupied properties
4. **Check** expiring properties
5. **Contact** tenants about renewals
6. **Extend** leases as needed

### **Regular Usage**

1. **Check dashboard** regularly
2. **Monitor expiring** properties
3. **Extend leases** when confirmed
4. **Track revenue** monthly
5. **Review history** for insights

---

**Last Updated**: 2026-01-31
**Version**: 1.0.0
**Status**: ✅ Production Ready

---

## 📚 Related Documentation

- **`PROPERTY_OCCUPANCY_SYSTEM_GUIDE.md`** - Technical system overview
- **`ADMIN_OCCUPANCY_UI_GUIDE.md`** - Admin interface guide
- **`COMPLETE_OCCUPANCY_SYSTEM_SUMMARY.md`** - Complete system summary

---

**Happy Property Managing! 🏠**
