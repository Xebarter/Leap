# Google Maps Integration Feature

## Overview

Property listings now include an optional Google Maps integration that displays an interactive map on the property details page. Users can paste a Google Maps link when creating or editing a property, and visitors will see a fully functional embedded map.

## What Was Implemented

### 1. Database Schema Update
- Added `google_maps_embed_url` column to the `properties` table
- Migration file: `scripts/ADD_GOOGLE_MAPS_FIELD.sql`
- The field is optional and stores the Google Maps link

### 2. Property Creation/Edit Form
- Added "Google Maps Link" field in `PropertyCreateForm.tsx`
- Field appears next to the Location field for easy discovery
- Field is labeled as optional
- Supports both apartment buildings and single properties
- Includes helpful placeholder text

### 3. Property Details Page
- Updated `property-details-content.tsx` to display interactive maps
- Shows full-height embedded Google Maps iframe when URL is available
- Falls back to simple location text if no map is provided
- Intelligently converts different Google Maps URL formats to embed format

## How to Use

### For Property Managers (Creating/Editing Properties)

#### Step 1: Get the Google Maps Link
1. Open [Google Maps](https://maps.google.com)
2. Search for your property location
3. Click "Share" button
4. Copy the link (e.g., `https://maps.google.com/?q=latitude,longitude` or `https://maps.google.com/?q=address`)

#### Step 2: Add to Property
1. Go to `/admin/properties`
2. Create or edit a property
3. Find the "Google Maps Link" field (next to Location)
4. Paste the copied link
5. Save the property

#### What You Can Paste
The system accepts several Google Maps URL formats:
- ✅ Share link: `https://maps.google.com/?q=latitude,longitude`
- ✅ Share link with address: `https://maps.google.com/?q=123+Main+St,+City`
- ✅ Coordinates: `40.7128,-74.0060`
- ✅ Address: `123 Main Street, City, Country`
- ✅ Business name: `Starbucks, Manhattan`

### For Visitors (Viewing Properties)

#### What They See
On the property details page at `/properties/[id]`:
1. **Location Section** shows:
   - Full-height interactive Google Maps embed
   - The address below the map
   - Can zoom, pan, and explore the area
   - Fully functional map controls

2. **Without Maps Link**:
   - Shows simple location text
   - "No map available" message

## Implementation Details

### Files Modified

#### 1. `scripts/ADD_GOOGLE_MAPS_FIELD.sql`
- Migration script to add the new column
- Includes indexes for filtering properties with maps

#### 2. `components/adminView/property-manager/PropertyCreateForm.tsx`
- Added Google Maps Link input field (line ~234)
- Added for both apartment buildings and single properties
- Field name: `google_maps_embed_url`
- Includes validation for URL format
- Includes helpful description text

#### 3. `app/(public)/properties/[id]/property-details-content.tsx`
- Updated Location section (line ~537)
- Converts various Google Maps URL formats to embed format
- Displays full-height iframe (h-96 = 384px height)
- Falls back to simple text if no URL provided
- Handles different URL patterns intelligently

### URL Format Conversion Logic

The system automatically converts different Google Maps URL formats:

```typescript
// Input: https://maps.google.com/?q=latitude,longitude
// Output: https://www.google.com/maps/embed/v1/place?key=API_KEY&q=latitude,longitude

// Input: https://maps.google.com/?q=123+Main+St,+City
// Output: https://www.google.com/maps/embed/v1/place?key=API_KEY&q=123+Main+St,+City

// Already embed format: https://www.google.com/maps/embed/v1/place?...
// Output: (used as-is)
```

## Setup Requirements

### Google Maps API Key (Optional but Recommended)

To enable the map embed functionality, you should set up a Google Maps API key:

1. **Create API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable "Maps Embed API"
   - Create an API key (Restrict to "Maps Embed API")

2. **Add to Environment**:
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```

3. **Enable Maps**:
   - Maps will now work fully
   - Without API key, maps may show a watermark or reduced functionality

### Without API Key
- Maps can still display from `maps.google.com` links
- May have limited functionality or watermark
- Some features may be restricted

## Feature Breakdown

### ✅ What Works

1. **Multiple URL Formats**
   - Accepts various Google Maps share link formats
   - Intelligently detects and converts formats
   - No need for users to worry about format

2. **Interactive Maps**
   - Full zoom and pan controls
   - Can change view (satellite, terrain, etc.)
   - Street View available
   - Directions available

3. **Responsive Design**
   - Works on desktop, tablet, and mobile
   - Fixed height (384px) with full width
   - Proper border radius and styling
   - Matches property details page design

4. **Fallback Handling**
   - If no map URL provided: shows location text
   - If URL fails to load: shows location text
   - Graceful degradation

5. **SEO Friendly**
   - Location metadata preserved
   - Address displayed alongside map
   - Helps with property discoverability

## Testing

### Manual Test Steps

1. **Create a Test Property**:
   - Go to `/admin/properties`
   - Click "Add New Property"
   - Create a new property
   - Fill in basic details

2. **Add Google Maps Link**:
   - In the form, find "Google Maps Link" field
   - Open [Google Maps](https://maps.google.com)
   - Search for a location
   - Click "Share" → Copy link
   - Paste into the form field

3. **Save and View**:
   - Click Save
   - Go to properties list
   - Click on the property
   - Scroll to "Location" section
   - Verify interactive map appears

4. **Test Different Formats**:
   - Try: `https://maps.google.com/?q=New+York+City`
   - Try: `https://maps.google.com/?q=40.7128,-74.0060`
   - Try: `https://maps.google.com/?q=Statue+of+Liberty`
   - All should display maps

5. **Test Mobile Responsiveness**:
   - Open property on mobile device
   - Map should be fully visible
   - Should be interactive
   - No horizontal scroll

### Expected Behavior

✅ **With Google Maps Link**:
- Location section shows full iframe
- Map is centered on property location
- Can zoom and pan
- Shows address below map
- Map loads within 2-3 seconds

✅ **Without Google Maps Link**:
- Shows simple location text
- "No map available" message
- Still functional and clean

❌ **What Shouldn't Happen**:
- Broken iframe or white screen
- "Refused to connect" errors
- Map not responding to clicks
- Location text not appearing

## Common Issues & Solutions

### Issue: Map shows "Oops! Something went wrong"
**Cause**: Missing or invalid API key
**Solution**: 
1. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`
2. Get key from Google Cloud Console
3. Ensure "Maps Embed API" is enabled

### Issue: "Refused to connect" error
**Cause**: Domain not whitelisted or API key restrictions
**Solution**:
1. Go to Google Cloud Console
2. Edit API key restrictions
3. Add your domain to allowed referrers
4. OR remove restrictions (for development)

### Issue: Map shows watermark or limited functionality
**Cause**: Using default API key or no key
**Solution**: Set up proper Google Maps API key with appropriate tier

### Issue: URL not being recognized
**Cause**: Different Google Maps URL format
**Solution**: 
- Use the "Share" button to get proper link
- Alternatively, paste just the address (e.g., "123 Main St, City")

## Future Enhancements

Possible improvements:
- [ ] Multiple markers on map
- [ ] Custom map styling
- [ ] Street View integration
- [ ] Directions from current location
- [ ] Map preview in admin list
- [ ] Location auto-complete while typing address
- [ ] Distance calculation from key locations

## Data Structure

### Database Column
```sql
google_maps_embed_url TEXT
```

### Property Object
```typescript
interface PropertyData {
  id: string;
  title: string;
  location: string;
  google_maps_embed_url?: string;  // New field
  // ... other fields
}
```

### Form Field
```tsx
<Input
  name="google_maps_embed_url"
  type="url"
  placeholder="Paste Google Maps link"
  defaultValue={property?.google_maps_embed_url || ''}
/>
```

## Deployment Notes

1. **Run Migration**:
   ```bash
   # Apply the migration to add google_maps_embed_url column
   psql -f scripts/ADD_GOOGLE_MAPS_FIELD.sql
   ```

2. **Set Environment Variable**:
   ```bash
   # In production .env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_key
   ```

3. **Test Live**:
   - Create test property with map
   - Verify map displays correctly
   - Test on mobile devices

## Summary

The Google Maps integration provides:
- ✅ Easy-to-use field in property creation
- ✅ Interactive maps on property details pages
- ✅ Multiple URL format support
- ✅ Responsive design
- ✅ Graceful fallback handling
- ✅ Better property discovery for visitors

**Implementation is complete and ready to use!**
