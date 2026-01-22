# Google Maps Integration - Quick Start Guide

## What Was Added

A complete Google Maps integration for property listings that allows property managers to add location maps and visitors to view them.

## Files Modified

1. **Database Migration**
   - `scripts/ADD_GOOGLE_MAPS_FIELD.sql` - Adds `google_maps_embed_url` column

2. **Property Form** 
   - `components/adminView/property-manager/PropertyCreateForm.tsx` - Added Google Maps link input field (2 locations: apartment buildings and single properties)

3. **Property Details Page**
   - `app/(public)/properties/[id]/property-details-content.tsx` - Displays embedded Google Maps

4. **Type Definitions**
   - `lib/properties.ts` - Updated PropertyData interface and Supabase queries

## Quick Setup

### Step 1: Apply Database Migration
```bash
# Run the migration to add the column
psql -f scripts/ADD_GOOGLE_MAPS_FIELD.sql

# Or manually in Supabase dashboard:
# ALTER TABLE properties ADD COLUMN google_maps_embed_url TEXT;
```

### Step 2: Set Environment Variable (Optional but Recommended)
```bash
# In .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Get API key from: https://console.cloud.google.com
# Enable "Maps Embed API"
```

### Step 3: Test the Feature

**Create/Edit a Property:**
1. Go to `/admin/properties`
2. Create or edit a property
3. Find "Google Maps Link" field (next to Location)
4. Get a Google Maps link:
   - Open https://maps.google.com
   - Search for your location
   - Click Share → Copy link
5. Paste the link in the form
6. Save property

**View on Public Page:**
1. Go to `/properties` 
2. Click on a property
3. Scroll to "Location" section
4. See the interactive map

## Usage

### For Property Managers

**Adding a Map to a Property:**

1. Open Google Maps: https://maps.google.com
2. Search for the property location
3. Click the **Share** button
4. Select **Copy link**
5. Paste into the **Google Maps Link** field in the property form
6. Save

**Supported Link Formats:**
- Share links: `https://maps.google.com/?q=latitude,longitude`
- Address-based: `https://maps.google.com/?q=123+Main+St,+City`
- Simple addresses: Just paste the address text
- Coordinates: `40.7128,-74.0060`

### For Visitors

**Viewing Maps:**
- Interactive Google Maps embedded on property details page
- Full zoom, pan, and navigation controls
- Can view satellite imagery, terrain, street view
- Shows the property address below the map

## Features

✅ **Easy to Use**
- Simple URL paste - no technical knowledge needed
- Works with multiple Google Maps URL formats
- Automatic format conversion

✅ **Interactive Maps**
- Full zoom and pan controls
- Street View available
- Get directions feature
- Satellite and terrain view options

✅ **Responsive Design**
- Works on desktop, tablet, mobile
- Auto-scales with screen size
- Touch-friendly controls

✅ **Graceful Fallback**
- Shows address text if map unavailable
- No broken UI or errors
- Maintains page layout

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Google Maps API key configured (or working without it)
- [ ] Create a test property with Google Maps link
- [ ] Verify map displays on property details page
- [ ] Test map zoom and pan controls
- [ ] Test on mobile device
- [ ] Verify graceful fallback (no map link case)
- [ ] Test different Google Maps URL formats

## Common Issues

| Issue | Solution |
|-------|----------|
| Map shows "Oops! Something went wrong" | Add Google Maps API key to `.env.local` |
| "Refused to connect" error | Add your domain to API key restrictions |
| Map shows watermark | Set up Google Maps API key with proper tier |
| URL not recognized | Use the Share button to get proper format |

## API Key Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Maps Embed API"
4. Create API key
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

## Location Section Display

### With Google Maps Link
```
┌─────────────────────────────────┐
│          Location               │
├─────────────────────────────────┤
│                                 │
│    [Interactive Google Map]     │  ← h-96 (384px)
│    [Full zoom, pan controls]    │
│                                 │
├─────────────────────────────────┤
│ 📍 123 Main Street, City        │
└─────────────────────────────────┘
```

### Without Google Maps Link
```
┌─────────────────────────────────┐
│          Location               │
├─────────────────────────────────┤
│                                 │
│         📍 Location              │
│    123 Main Street, City         │
│      No map available            │
│                                 │
└─────────────────────────────────┘
```

## Next Steps

1. Apply the database migration
2. Set up Google Maps API key (optional)
3. Test with a property
4. Deploy to production

---

**That's it! The feature is ready to use.**

For detailed documentation, see `GOOGLE_MAPS_INTEGRATION.md`
