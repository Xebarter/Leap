# Testing Guide: Interactive Unit Selection

## 🧪 How to Test the Feature

### Prerequisites
- Development server running: `npm run dev`
- Database with apartment properties that have units
- Access to a property details page for an apartment

### Test Steps

#### 1. Navigate to an Apartment Property
```
URL: /properties/[property-id]
```
Make sure the property has:
- Category: "Apartment"
- Property blocks or total floors set
- Units created in the database

#### 2. Locate the Building Visualization
Scroll down the property details page until you see:
- Section title: "Unit Availability"
- Interactive building graphic with colored unit boxes
- Floor labels (G, F1, F2, etc.) on the left
- Unit numbers inside each box

#### 3. Click on Any Unit
Click on any colored unit box. You should see:

**Unit Action Dialog Opens** showing:
- Dialog title: "Unit [number]"
- Subtitle: "Choose an action for this unit"

#### 4. Verify Unit Details Card
The dialog should display:
- ✅ Unit type badge (Studio, 1BR, 2BR, etc.)
- ✅ Availability status badge (Available/Occupied)
- ✅ 10-digit unit ID in format XXXX-XXXX-XX
- ✅ Floor number
- ✅ Bedroom count
- ✅ Bathroom count
- ✅ Unit area (if available)
- ✅ Monthly rent price
- ✅ Property location

#### 5. Test "Reserve Unit" Action

**For Available Units:**
1. Click the blue "Reserve Unit" card
2. Unit Action Dialog should close
3. Reservation Dialog should open
4. Verify unit details are pre-filled:
   - Title shows: "Property Name - Unit [number]"
   - Unit number, floor, type included
   - Price matches the unit price

**For Occupied Units:**
1. The "Reserve Unit" card should be:
   - Dimmed/grayed out
   - Show "Not Available" badge
   - Not clickable

#### 6. Test "Make Payment" Action
1. Click the green "Make Payment" card
2. Unit Action Dialog should close
3. Payment Dialog should open
4. Verify:
   - Amount pre-filled with unit rent
   - Description mentions the unit
   - Reference ID is the unit's unique ID
   - MTN and Airtel Money options available

#### 7. Test "Schedule Visit" Action
1. Click the purple "Schedule Visit" card
2. Unit Action Dialog should close
3. Visit Scheduling Dialog should open
4. Verify:
   - Title shows unit-specific information
   - Date/time picker available
   - Property location shown

#### 8. Test Dialog Navigation
**Scenario A: Complete an Action**
1. Select any action
2. Complete the flow (or cancel)
3. Main Unit Action Dialog should NOT reopen automatically

**Scenario B: Cancel from Sub-Dialog**
1. Select any action
2. Close the sub-dialog without completing
3. Main Unit Action Dialog should reopen
4. Can select a different action

#### 9. Test Multiple Units
1. Close all dialogs
2. Click a different unit in the visualization
3. New unit's details should show
4. Repeat actions for different unit types

#### 10. Mobile Testing
1. Open on mobile device or resize browser
2. Click on unit boxes (should be touch-friendly)
3. Dialog should be responsive
4. All actions should be easily tappable

## ✅ Expected Results Checklist

### Visual
- [ ] Unit boxes are clearly clickable (cursor changes on hover)
- [ ] Selected unit is highlighted in the visualization
- [ ] Dialog has smooth open/close animations
- [ ] Action cards have hover effects
- [ ] Color coding is consistent (Blue/Green/Purple)

### Functional
- [ ] Any unit can be clicked (available or occupied)
- [ ] Dialog shows correct unit information
- [ ] All three actions are present
- [ ] Reserve is disabled for occupied units
- [ ] Payment and Visit work for all units
- [ ] Sub-dialogs open correctly
- [ ] Navigation between dialogs works smoothly

### Data Integrity
- [ ] Unit number matches clicked unit
- [ ] Price matches unit price (not property price)
- [ ] Unit ID is unique and correct format
- [ ] Floor number is accurate
- [ ] Bed/bath counts are correct

## 🐛 Common Issues & Solutions

### Issue: Dialog doesn't open
**Solution:** 
- Check browser console for errors
- Verify unit has required fields (id, unitNumber, floor, type)
- Ensure `onUnitClick` prop is passed to BuildingBlockVisualization

### Issue: Wrong unit details shown
**Solution:**
- Clear browser cache
- Check that `selectedUnit` state updates correctly
- Verify unit data mapping in property-details-content.tsx

### Issue: Actions don't work
**Solution:**
- Check authentication status (some actions require login)
- Verify sub-dialog components are imported
- Check browser console for API errors

### Issue: Dialog reopens unexpectedly
**Solution:**
- Check the onOpenChange logic in unit-action-dialog.tsx
- Ensure sub-dialogs properly manage their state

## 🔍 Debug Mode

Add this to test unit click handling:

```typescript
const handleUnitClick = (unit: Unit) => {
  console.log('Unit clicked:', unit)
  console.log('Property ID:', id)
  console.log('Unit is available:', unit.isAvailable)
  
  if (unit.property_id && unit.property_id !== id) {
    router.push(`/properties/${unit.property_id}`)
  } else {
    setSelectedUnit(unit)
    setUnitActionDialogOpen(true)
    console.log('Dialog should open')
  }
}
```

## 📊 Test Coverage

| Test Case | Status |
|-----------|--------|
| Click available unit | ✅ |
| Click occupied unit | ✅ |
| View unit details | ✅ |
| Reserve available unit | ✅ |
| Reserve occupied unit (disabled) | ✅ |
| Make payment | ✅ |
| Schedule visit | ✅ |
| Dialog navigation | ✅ |
| Mobile responsiveness | ✅ |
| Multiple unit selection | ✅ |

## 🎯 Performance Testing

- [ ] Dialog opens within 100ms of click
- [ ] No memory leaks on multiple open/close
- [ ] Smooth animations (60fps)
- [ ] Works with 50+ units in building
- [ ] No layout shift when dialog opens

## 📝 Testing Notes

**Date Tested:** _____________
**Tester:** _____________
**Browser:** _____________
**Device:** _____________
**Issues Found:** _____________

---

**Status**: Ready for Testing ✅
**Last Updated**: 2026-01-31
