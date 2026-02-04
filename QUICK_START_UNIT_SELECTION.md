# Quick Start: Interactive Unit Selection

## 🎯 Overview
Click any unit in the building visualization to reserve, pay, or schedule a visit for that specific unit.

## 🚀 How It Works

### 1️⃣ View the Building
Navigate to any property details page that has a building visualization:
```
/properties/[property-id]
```

Scroll down to see the **"Unit Availability"** section with the interactive building graphic.

### 2️⃣ Click a Unit
Click on any colored unit box in the building visualization:
- **Available units**: Bright colors (clickable)
- **Occupied units**: Dimmed colors with strikethrough (still clickable)

### 3️⃣ Choose Your Action
A dialog appears with three options:

#### 🏠 Reserve Unit
- Submit application to rent this unit
- Provide identity and move-in details
- Pay booking fee
- ⚠️ Only enabled for available units

#### 💳 Make Payment
- Pay rent or deposit for this unit
- Mobile money payment (MTN/Airtel)
- Payment tracked by unit ID
- ✅ Available for all units

#### 📅 Schedule Visit
- Book a time to view the unit
- Choose date and time
- Get confirmation email
- ✅ Available for available units

### 4️⃣ Complete Your Action
- Fill in the required information
- Submit your request
- Receive confirmation

## 📱 User Interface

### Main Dialog (Unit Action Dialog)
```
┌─────────────────────────────────────┐
│ 🏢 Unit 203                         │
│ Choose an action for this unit      │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Unit Details Card           │   │
│ │ • Type: 2BR                 │   │
│ │ • Floor: 2                  │   │
│ │ • Status: Available         │   │
│ │ • Price: 800,000 UGX/month  │   │
│ │ • ID: 1234-5678-90          │   │
│ └─────────────────────────────┘   │
│                                     │
│ What would you like to do?          │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏠 Reserve Unit         →    │   │
│ │ Submit an application to     │   │
│ │ reserve this unit            │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 💳 Make Payment          →   │   │
│ │ Pay rent or deposit for      │   │
│ │ this unit                    │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 📅 Schedule Visit        →   │   │
│ │ Book a time to view this     │   │
│ │ unit in person               │   │
│ └─────────────────────────────┘   │
│                                     │
│ 💡 You can schedule a visit to      │
│    view the unit before making      │
│    any commitments                  │
└─────────────────────────────────────┘
```

### Color Coding
- 🔵 **Blue**: Reserve Unit
- 🟢 **Green**: Make Payment
- 🟣 **Purple**: Schedule Visit

## 🔧 For Developers

### Component Location
```
components/publicView/unit-action-dialog.tsx
```

### Integration Example
```typescript
import { UnitActionDialog } from '@/components/publicView/unit-action-dialog'
import { BuildingBlockVisualization } from '@/components/publicView/building-block-visualization'

// State
const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
const [dialogOpen, setDialogOpen] = useState(false)

// Handler
const handleUnitClick = (unit: Unit) => {
  setSelectedUnit(unit)
  setDialogOpen(true)
}

// JSX
<BuildingBlockVisualization
  buildingName="My Building"
  totalFloors={5}
  units={units}
  onUnitClick={handleUnitClick}
/>

<UnitActionDialog
  unit={selectedUnit}
  propertyId={propertyId}
  propertyTitle={propertyTitle}
  propertyLocation={propertyLocation}
  propertyCode={propertyCode}
  open={dialogOpen}
  onOpenChange={setDialogOpen}
/>
```

## ✅ Testing Checklist

- [ ] Click on available unit → Dialog opens with all actions enabled
- [ ] Click on occupied unit → Dialog opens, "Reserve" is disabled
- [ ] Select "Reserve Unit" → Opens reservation dialog
- [ ] Select "Make Payment" → Opens payment dialog
- [ ] Select "Schedule Visit" → Opens visit scheduling dialog
- [ ] Close sub-dialog → Returns to action selection
- [ ] Complete any action → Success confirmation
- [ ] Mobile responsive → Works on all screen sizes

## 💡 Tips

### For Users
- **Preview First**: Schedule a visit to see the unit before reserving
- **Check Details**: Review unit specifications carefully
- **Availability**: Green badge = available, Gray = occupied

### For Admins
- Units must have `isAvailable` property set correctly
- Ensure unit prices are in cents (UGX * 100)
- Unit `uniqueId` is auto-generated if not provided

## 🐛 Troubleshooting

### Dialog doesn't open
- Check that `onUnitClick` is properly connected
- Verify unit data has required fields (id, unitNumber, floor, type)

### Actions not working
- Ensure sub-dialogs (Reserve, Payment, Visit) are imported
- Check authentication state if actions require login

### Unit details missing
- Verify unit data includes optional fields (price, area, bedrooms, bathrooms)
- Check `property_code` or `uniqueId` is set

## 📚 Related Documentation
- `UNIT_INTERACTIVE_SELECTION_FEATURE.md` - Complete implementation details
- `FLOOR_UNIT_TYPE_FEATURE_SUMMARY.md` - Building visualization setup
- `QUICK_START_VISIT_SCHEDULING.md` - Visit scheduling system
- `QUICK_START_PAYMENTS.md` - Payment system integration

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2026-01-31
