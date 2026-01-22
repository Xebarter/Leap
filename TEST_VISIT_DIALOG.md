# Testing Guide - Enhanced Visit Dialog

## 🧪 Test Scenarios

### Scenario 1: Visual Inspection ✅

**Test:** Open the dialog and check visual improvements

**Steps:**
1. Navigate to any property page: `http://localhost:3001/properties/[any-property-id]`
2. Click "Schedule a Visit" button in the action card
3. Observe the dialog appearance

**Expected Results:**
- ✅ Gradient header with subtle color transition
- ✅ "Free Visit" badge in top-right corner with sparkles icon
- ✅ Larger, bold title "Schedule Your Visit"
- ✅ Location pin icon with property details
- ✅ Two clear sections with circular icon badges:
  - 👤 Your Information
  - 📅 Visit Schedule
- ✅ Input fields have left-aligned icons
- ✅ Helper text under phone field
- ✅ Business hours info box with clock icon
- ✅ Trust signal in footer with checkmark
- ✅ Enhanced "Confirm Visit" button with calendar icon

---

### Scenario 2: Form Interaction (Anonymous User) ✅

**Test:** Complete the form as a guest user

**Steps:**
1. Open dialog (not logged in)
2. Fill in Name: "Test User"
3. Fill in Email: "test@example.com"
4. Fill in Phone: "+256 700 123 456"
5. Select tomorrow's date
6. Select time: "10:00"
7. Add note: "Interested in viewing the balcony"
8. Click "Confirm Visit"

**Expected Results:**
- ✅ All input fields show icons on the left
- ✅ Phone field shows helper text below
- ✅ Date picker shows minimum date as tomorrow
- ✅ Time picker respects 08:00 - 18:00 range
- ✅ Button shows spinner during submission
- ✅ Button text changes to "Scheduling..."
- ✅ Success screen appears with:
  - Animated green checkmark
  - "Visit Scheduled!" message
  - Formatted date display
  - Time display
  - Confirmation message
- ✅ Dialog auto-closes after 3 seconds
- ✅ Toast notification appears

---

### Scenario 3: Form Interaction (Logged-In User) ✅

**Test:** Complete the form as authenticated user

**Steps:**
1. Login at `/auth/login`
2. Navigate to any property
3. Click "Schedule a Visit"
4. Observe pre-filled fields

**Expected Results:**
- ✅ Name field auto-filled from profile
- ✅ Email field auto-filled from account
- ✅ Phone field empty (needs to be filled)
- ✅ All other steps same as Scenario 2
- ✅ After success, shows "Redirecting to your dashboard..."
- ✅ Auto-redirects to `/tenant` after 3 seconds

---

### Scenario 4: Responsive Design (Mobile) 📱

**Test:** Check mobile responsiveness

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Open the dialog

**Expected Results:**
- ✅ Dialog fits mobile screen width
- ✅ Date and Time fields stack vertically
- ✅ All text is readable
- ✅ Buttons are thumb-friendly
- ✅ Scrolling works smoothly
- ✅ Icons maintain proper size
- ✅ Success screen fits perfectly

---

### Scenario 5: Loading State ⏳

**Test:** Verify loading indicators

**Steps:**
1. Open dialog and fill form
2. Click "Confirm Visit"
3. Observe during submission

**Expected Results:**
- ✅ Button shows animated spinner (rotating circle)
- ✅ Button text changes to "Scheduling..."
- ✅ Button is disabled during loading
- ✅ Cancel button is disabled during loading
- ✅ Form remains visible during loading
- ✅ No double-submission possible

---

### Scenario 6: Success Animation ✨

**Test:** Check success state animation

**Steps:**
1. Complete form submission successfully
2. Observe the success screen

**Expected Results:**
- ✅ Checkmark icon zooms in smoothly (animate-in)
- ✅ Icon is green color
- ✅ Success message appears
- ✅ Date shows full format (e.g., "Wednesday, January 22, 2026")
- ✅ Time shows in 12-hour format
- ✅ Background box highlights details
- ✅ Confirmation message appears
- ✅ Timer countdown visible (if logged in)

---

### Scenario 7: Error Handling ❌

**Test:** Test validation and error states

**Steps:**
1. **Test 1: Empty form**
   - Click "Confirm Visit" without filling anything
   - Expected: Browser validation prevents submission

2. **Test 2: Invalid email**
   - Fill name, enter "notanemail" in email field
   - Expected: Browser shows "Please enter a valid email"

3. **Test 3: Invalid phone**
   - Enter "123" in phone field
   - Expected: Custom validation shows error toast

4. **Test 4: Past date**
   - Try to select yesterday's date
   - Expected: Date picker prevents selection

5. **Test 5: Invalid time**
   - Try to select "7:00 AM" or "7:00 PM"
   - Expected: Time picker allows but validation might warn

---

### Scenario 8: Accessibility ♿

**Test:** Keyboard navigation and screen readers

**Steps:**
1. Open dialog
2. Press Tab repeatedly
3. Navigate through all fields
4. Press Enter on submit button

**Expected Results:**
- ✅ Tab order is logical (top to bottom)
- ✅ All form fields are reachable
- ✅ Focus indicators are visible
- ✅ Labels are associated with inputs
- ✅ Submit works with Enter key
- ✅ Escape closes dialog
- ✅ Focus returns to trigger button after close

---

### Scenario 9: Multiple Properties 🏘️

**Test:** Dialog context updates per property

**Steps:**
1. Open Property A, click "Schedule a Visit"
   - Note property name in dialog header
2. Close dialog
3. Navigate to Property B, click "Schedule a Visit"
   - Note property name changes

**Expected Results:**
- ✅ Property title updates correctly
- ✅ Property location updates correctly
- ✅ Dialog resets form fields
- ✅ No data persists from previous property

---

### Scenario 10: Network Issues 🌐

**Test:** Behavior with poor connectivity

**Steps:**
1. Open browser DevTools > Network tab
2. Set throttling to "Slow 3G"
3. Submit form

**Expected Results:**
- ✅ Loading spinner shows longer
- ✅ No timeout error (reasonable wait)
- ✅ Success or error handled properly
- ✅ User can retry if failed

---

## 📋 Visual Checklist

### Header Section
- [ ] Gradient background visible
- [ ] "Free Visit" badge in top-right
- [ ] Sparkles icon in badge
- [ ] Title is "Schedule Your Visit" (bold, 2xl)
- [ ] Location pin icon before description
- [ ] Property name in bold
- [ ] Property location shown

### Your Information Section
- [ ] User icon in circular badge
- [ ] Section title present
- [ ] Content indented (pl-10)
- [ ] User icon in name field
- [ ] Mail icon in email field
- [ ] Phone icon in phone field
- [ ] Helper text under phone field

### Visit Schedule Section
- [ ] Calendar icon in circular badge
- [ ] Section title present
- [ ] Content indented
- [ ] Calendar icon in date field
- [ ] Clock icon in time field
- [ ] Business hours info box with muted background
- [ ] Clock icon in info box

### Notes Section
- [ ] Label shows "(Optional)"
- [ ] Textarea has proper placeholder
- [ ] Min height 100px
- [ ] Resize disabled

### Footer Section
- [ ] Border-top separator
- [ ] Light background (muted/20)
- [ ] Checkmark icon
- [ ] Trust signal text
- [ ] Cancel button (outline)
- [ ] Confirm button (primary)
- [ ] Calendar icon in confirm button

### Success Screen
- [ ] Centered layout
- [ ] Large checkmark (16x16)
- [ ] Green circle background
- [ ] Zoom-in animation
- [ ] Success title
- [ ] Property name shown
- [ ] Details box with muted background
- [ ] Calendar icon with date
- [ ] Clock icon with time
- [ ] Confirmation message
- [ ] Redirect message (if logged in)

---

## 🐛 Known Issues / Edge Cases

### Potential Issues to Watch:
1. **Long property names** - May wrap in header
2. **Very long notes** - Check scroll behavior
3. **Timezone handling** - Time stored as-is
4. **Same-day bookings** - Currently blocked (min: tomorrow)
5. **Sunday bookings** - Helper text says "Monday-Saturday" but might allow

### Browser Compatibility:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 - Not supported (uses modern CSS)

---

## 🎯 Performance Checklist

- [ ] Dialog opens instantly (< 100ms)
- [ ] No layout shift during open
- [ ] Smooth animations (60fps)
- [ ] Form submission < 500ms
- [ ] Success animation smooth
- [ ] No console errors
- [ ] No console warnings
- [ ] Reasonable bundle size impact

---

## 📊 Success Criteria

### Must Have ✅
- [x] Dialog opens and closes properly
- [x] All fields are fillable
- [x] Form submits successfully
- [x] Success screen appears
- [x] Data saves to database
- [x] Mobile responsive
- [x] No console errors

### Nice to Have ✨
- [x] Gradient header looks professional
- [x] Icons enhance clarity
- [x] Animations are smooth
- [x] Trust signals build confidence
- [x] Success state is delightful
- [x] Loading states are clear

---

## 🚀 Ready for Production?

**Checklist:**
- [ ] All test scenarios pass
- [ ] Visual inspection complete
- [ ] Mobile testing done
- [ ] Accessibility verified
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Database integration works
- [ ] Documentation complete

**If all checked: ✅ READY TO DEPLOY!**

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies are active
4. Review database migration ran
5. Clear browser cache
6. Test in incognito mode

---

**Happy Testing!** 🎉
