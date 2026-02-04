import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper function to generate block name
function generateBlockName(location: string): string {
  const now = new Date();
  return `${location.substring(0, 10).replace(/\s+/g, '')}-${now.getTime().toString().slice(-6)}`;
}

// Helper function to get bedrooms count from unit type
function getBedroomsForUnitType(unitType: string): number {
  const bedroomMap: Record<string, number> = {
    'Studio': 0,
    '1BR': 1,
    '2BR': 2,
    '3BR': 3,
    '4BR': 4,
    'Penthouse': 4
  };
  return bedroomMap[unitType] ?? 1;
}

// Helper function to get bathrooms count from unit type
function getBathroomsForUnitType(unitType: string): number {
  const bathroomMap: Record<string, number> = {
    'Studio': 1,
    '1BR': 1,
    '2BR': 2,
    '3BR': 2,
    '4BR': 3,
    'Penthouse': 3
  };
  return bathroomMap[unitType] ?? 1;
}

// Helper function to get unit type label
function getUnitTypeLabel(unitType: string): string {
  const labelMap: Record<string, string> = {
    'Studio': 'Studio',
    '1BR': '1 Bedroom',
    '2BR': '2 Bedroom',
    '3BR': '3 Bedroom',
    '4BR': '4 Bedroom',
    'Penthouse': 'Penthouse'
  };
  return labelMap[unitType] ?? unitType;
}

// Interface for unique unit type extracted from floor config
interface UniqueUnitType {
  type: string;
  label: string;
  monthlyFee: number;
  bedrooms: number;
  bathrooms: number;
  totalUnits: number;
  unitsPerFloor: Array<{ floor: number; count: number }>;
  description?: string;
  customTitle?: string;
  imageUrl?: string;
  images?: Array<{ id: string; url: string; category: string; isPrimary: boolean; displayOrder: number }>;
  videoUrl?: string;
  features?: string[];
  amenities?: string[];
  area?: number;
  minLeaseTerm?: number;
  petPolicy?: string;
  utilities?: string[];
  availableFrom?: string;
}

// Function to extract unique unit types from floor configuration
function extractUniqueUnitTypes(floorConfig: any): UniqueUnitType[] {
  const unitTypeMap = new Map<string, UniqueUnitType>();

  for (const floor of floorConfig.floors) {
    for (const ut of floor.unitTypes) {
      const existing = unitTypeMap.get(ut.type);
      if (existing) {
        existing.totalUnits += ut.count;
        existing.unitsPerFloor.push({ floor: floor.floorNumber, count: ut.count });
        if (ut.monthlyFee > existing.monthlyFee) {
          existing.monthlyFee = ut.monthlyFee;
        }
      } else {
        unitTypeMap.set(ut.type, {
          type: ut.type,
          label: getUnitTypeLabel(ut.type),
          monthlyFee: ut.monthlyFee || 0,
          bedrooms: getBedroomsForUnitType(ut.type),
          bathrooms: getBathroomsForUnitType(ut.type),
          totalUnits: ut.count,
          unitsPerFloor: [{ floor: floor.floorNumber, count: ut.count }]
        });
      }
    }
  }

  // Merge in unit type details if available
  if (floorConfig.unitTypeDetails) {
    for (const details of floorConfig.unitTypeDetails) {
      const unitType = unitTypeMap.get(details.type);
      if (unitType) {
        unitType.description = details.description;
        unitType.customTitle = details.title;
        
        // Use unit type price if set
        if (details.priceUgx && details.priceUgx > 0) {
          unitType.monthlyFee = details.priceUgx;
        }
        
        // Override bedrooms/bathrooms if specified
        if (details.bedrooms !== undefined) unitType.bedrooms = details.bedrooms;
        if (details.bathrooms !== undefined) unitType.bathrooms = details.bathrooms;
        
        // Images
        const primaryImage = details.images?.find((img: any) => img.isPrimary);
        unitType.imageUrl = primaryImage?.url || details.images?.[0]?.url || details.imageUrl;
        unitType.images = details.images || [];
        
        // Video
        unitType.videoUrl = details.videoUrl;
        
        // Features & amenities
        unitType.features = details.features || [];
        unitType.amenities = details.amenities || [];
        
        // Additional details
        unitType.area = details.area;
        unitType.minLeaseTerm = details.minLeaseTerm;
        unitType.petPolicy = details.petPolicy;
        unitType.utilities = details.utilities || [];
        unitType.availableFrom = details.availableFrom;
      }
    }
  }

  return Array.from(unitTypeMap.values());
}

// Helper function to get or create a block
async function getOrCreateBlock(
  supabase: any,
  location: string,
  totalFloors: number,
  totalUnits: number,
  userId: string,
  buildingName?: string
) {
  const blockName = buildingName || generateBlockName(location);

  const { data, error } = await supabase
    .from("property_blocks")
    .insert({
      name: blockName,
      location: location,
      total_floors: totalFloors,
      total_units: totalUnits,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating block:", error);
    return null;
  }

  return data?.id || null;
}

// Helper function to validate and format video URL
function formatVideoUrl(url: string): string | null {
  if (!url) return null;

  // Check if it's a YouTube URL
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/watch?v=${match[2]}`;
    }
  }

  // Check if it's a TikTok URL
  if (url.includes('tiktok.com')) {
    const tiktokRegex = /tiktok\.com\/[^/]*\/video\/(\d+)/;
    if (tiktokRegex.test(url)) {
      return url;
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY, // Service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse URL parameters
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('block_id')

    // Build query with optional block_id filter
    let query = supabaseAdmin
      .from('properties')
      .select(`
        *,
        property_blocks (
          id,
          name,
          location,
          total_floors,
          total_units
        ),
        property_units!left (
          id,
          block_id,
          floor_number,
          unit_number,
          bedrooms,
          bathrooms,
          is_available
        )
      `)

    // Apply filters
    if (blockId) {
      // If block_id is provided, fetch properties for that specific block (for editing)
      query = query.eq('block_id', blockId)
    } else {
      // Otherwise, only fetch active properties for public view
      query = query.eq('is_active', true)
    }

    const { data: properties, error: propertiesError } = await query.order('created_at', { ascending: false });
    
    // Note: google_maps_embed_url is included in the * select, so it's already fetched

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: propertiesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ properties });

  } catch (error) {
    console.error('Error in GET /api/properties:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      );
    }

    console.log('=== Property API called ===');
    
    // Create Supabase client with service role (bypasses RLS for database operations)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create SSR client for reading auth from cookies (the proper way in Next.js App Router)
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore - cookies can't be set in API routes after response starts
            }
          },
        },
      }
    );

    // Get authenticated user using the SSR client (reads from cookies)
    const { data: { user }, error: userError } = await supabaseSSR.auth.getUser();
    
    console.log('Auth check result:', {
      hasUser: !!user,
      userEmail: user?.email,
      error: userError?.message
    });

    if (userError || !user) {
      console.error('⚠️ No authenticated user found');
      console.error('Error:', userError?.message);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first' },
        { status: 401 }
      );
    }

    // Verify user has admin role by checking their profile (using admin client)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'Unable to verify user permissions - profile not found' },
        { status: 403 }
      );
    }

    if (!profile?.is_admin) {
      console.error('User does not have admin privileges:', user.email);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('✓ Request authenticated for admin user:', user.id, user.email);

    // Parse the request body
    const body = await request.json();

    // Optional: assign property to a landlord (landlord_profiles.id)
    // If provided, we set:
    // - properties.landlord_id = landlord_profiles.id
    // - properties.host_id = landlord_profiles.user_id (so landlord access works under existing RLS)
    let assignedLandlordId: string | null = body?.landlord_id || null;
    let assignedHostId: string | null = null;

    if (assignedLandlordId) {
      const { data: landlordProfile, error: landlordError } = await supabaseAdmin
        .from('landlord_profiles')
        .select('id,user_id,status')
        .eq('id', assignedLandlordId)
        .maybeSingle();

      if (landlordError) {
        console.error('Error loading landlord profile:', landlordError);
        return NextResponse.json(
          { error: 'Failed to resolve selected landlord' },
          { status: 400 }
        );
      }

      if (!landlordProfile?.user_id) {
        return NextResponse.json(
          { error: 'Selected landlord could not be resolved. Please select a valid landlord.' },
          { status: 400 }
        );
      }

      assignedHostId = landlordProfile.user_id;
    }

    const {
      title,
      location,
      description,
      price,
      category,
      bedrooms,
      bathrooms,
      image_url,
      video_url,
      minimum_initial_months,
      total_floors,
      units_config,
      floor_unit_config,
      all_image_urls,
      add_to_existing_block,
      existing_block_id,
      editingPropertyId,
      building_name,
      google_maps_embed_url
    } = body;

    // Normalize category to valid constraint value
    const validCategories = ['Apartment', 'House', 'Townhouse', 'Studio', 'Bedsitter', 'Villa', 'Condo', 'Cottage', 'Other'];
    let normalizedCategory = category || 'Apartment';
    
    // Case-insensitive match
    const categoryMatch = validCategories.find(cat => cat.toLowerCase() === (category?.toLowerCase() || 'apartment'));
    if (categoryMatch) {
      normalizedCategory = categoryMatch;
    } else {
      console.warn(`Invalid category "${category}", defaulting to "Apartment"`);
      normalizedCategory = 'Apartment';
    }

    console.log('Category validation:', {
      received: category,
      normalized: normalizedCategory,
      isValid: validCategories.includes(normalizedCategory)
    });

    // Check if this is an apartment with floor unit configuration
    // If so, create separate properties for each unit type
    const isApartmentWithUnitTypes = normalizedCategory === 'Apartment' && floor_unit_config;
    
    // Check if we're updating an existing apartment building (edit mode)
    const isEditingApartment = body.block_id && body.existing_property_ids;

    if (isApartmentWithUnitTypes && (isEditingApartment || !editingPropertyId)) {
      console.log('=== Creating apartment with multiple unit type properties ===');
      
      // Parse the floor unit configuration
      const config = typeof floor_unit_config === 'string' ? JSON.parse(floor_unit_config) : floor_unit_config;
      
      // Extract unique unit types
      const uniqueUnitTypes = extractUniqueUnitTypes(config);
      console.log('Unique unit types found:', uniqueUnitTypes.length);

      if (uniqueUnitTypes.length === 0) {
        return NextResponse.json(
          { error: 'No unit types found in floor configuration' },
          { status: 400 }
        );
      }

      // Calculate total units
      const totalUnitsCount = uniqueUnitTypes.reduce((sum, ut) => sum + ut.totalUnits, 0);
      const buildingNameToUse = building_name || title || 'Apartment Building';

      // Create block for the building OR use existing block in edit mode
      let blockId = null;
      
      if (isEditingApartment && body.block_id) {
        // Edit mode: use existing block and update it
        blockId = body.block_id;
        await supabaseAdmin
          .from("property_blocks")
          .update({
            name: buildingNameToUse,
            location: location,
            total_floors: parseInt(total_floors) || config.totalFloors,
            total_units: totalUnitsCount
          })
          .eq("id", blockId);
        
        console.log('Updating existing apartment block:', blockId);
        
        // Delete existing units for this block (will be recreated)
        await supabaseAdmin
          .from('property_units')
          .delete()
          .eq('block_id', blockId);
        
        // Delete existing property images for existing properties
        for (const propId of (body.existing_property_ids || [])) {
          await supabaseAdmin
            .from('property_images')
            .delete()
            .eq('property_id', propId);
        }
        
        // Delete existing properties (will be recreated)
        for (const propId of (body.existing_property_ids || [])) {
          await supabaseAdmin
            .from('properties')
            .delete()
            .eq('id', propId);
        }
        
        console.log('Cleared existing properties and units for block:', blockId);
      } else if (add_to_existing_block && existing_block_id) {
        blockId = existing_block_id;
        await supabaseAdmin
          .from("property_blocks")
          .update({
            name: buildingNameToUse,
            location: location,
            total_floors: parseInt(total_floors) || config.totalFloors,
            total_units: totalUnitsCount
          })
          .eq("id", existing_block_id);
      } else {
        blockId = await getOrCreateBlock(
          supabaseAdmin,
          location,
          parseInt(total_floors) || config.totalFloors,
          totalUnitsCount,
          user.id,
          buildingNameToUse
        );

        if (!blockId) {
          throw new Error('Failed to create property block for apartment building');
        }
      }

      console.log('Block created/updated:', blockId);

      const createdProperties: any[] = [];

      // Create a property for each unique unit type
      for (const unitType of uniqueUnitTypes) {
        console.log(`Creating property for unit type: ${unitType.type}`);

        // Create property title
        const propertyTitle = unitType.customTitle || `${buildingNameToUse} - ${unitType.label}`;
        
        // Use custom description or generate one
        const propertyDescription = unitType.description?.trim() || 
          `${unitType.label} unit at ${buildingNameToUse}, ${location}. ${unitType.totalUnits} units available.`;
        
        // Get image URL for this unit type
        const propertyImageUrl = unitType.imageUrl || image_url || all_image_urls?.[0] || null;
        
        // Validate video URL for this unit type
        const unitVideoUrl = unitType.videoUrl ? formatVideoUrl(unitType.videoUrl) : (video_url ? formatVideoUrl(video_url) : null);

        // Prepare property data for this unit type
        // Note: unit_type is stored in property_units table, not properties table
        const propertyData: Record<string, any> = {
          title: propertyTitle,
          location: location?.trim(),
          description: propertyDescription,
          price_ugx: Math.round((unitType.monthlyFee || 0) * 100), // Convert to cents
          category: normalizedCategory,
          bedrooms: unitType.bedrooms,
          bathrooms: unitType.bathrooms,
          image_url: propertyImageUrl,
          video_url: unitVideoUrl,
          minimum_initial_months: unitType.minLeaseTerm || Math.max(1, parseInt(minimum_initial_months) || 1),
          total_floors: parseInt(total_floors) || config.totalFloors,
          units_config: unitType.totalUnits.toString(),
          block_id: blockId,
          host_id: assignedHostId || user.id,
          landlord_id: assignedLandlordId,
          is_active: true,
          google_maps_embed_url: google_maps_embed_url || null,
        };

        // Add optional fields that exist in properties table schema
        if (unitType.amenities && unitType.amenities.length > 0) propertyData.amenities = unitType.amenities;

        console.log('Property data for', unitType.type, ':', propertyData);

        // Insert the property
        const { data: newProperty, error: propertyError } = await supabaseAdmin
          .from('properties')
          .insert(propertyData)
          .select()
          .single();

        if (propertyError) {
          console.error(`Error creating property for ${unitType.type}:`, propertyError);
          continue; // Skip to next unit type but don't fail entirely
        }

        console.log(`Property created for ${unitType.type}:`, newProperty.id);
        createdProperties.push(newProperty);

        // Create units for this property
        let unitCounter = 1;
        for (const floorInfo of unitType.unitsPerFloor) {
          for (let i = 0; i < floorInfo.count; i++) {
            const unitNumber = `${floorInfo.floor}${String(unitCounter).padStart(2, '0')}`;
            unitCounter++;

            const { error: unitError } = await supabaseAdmin
              .from('property_units')
              .insert({
                property_id: newProperty.id,
                block_id: blockId,
                floor_number: floorInfo.floor,
                unit_number: unitNumber,
                unit_type: unitType.type,
                bedrooms: unitType.bedrooms,
                bathrooms: unitType.bathrooms,
                price_ugx: Math.round((unitType.monthlyFee || 0) * 100),
                is_available: true,
              });

            if (unitError) {
              console.error(`Error creating unit ${unitNumber}:`, unitError);
            }
          }
        }

        // Store images for this property
        if (unitType.images && unitType.images.length > 0) {
          for (const image of unitType.images) {
            await supabaseAdmin
              .from('property_images')
              .insert({
                property_id: newProperty.id,
                image_url: image.url,
                area: image.category || 'Interior',
                is_primary: image.isPrimary,
                display_order: image.displayOrder
              });
          }
        } else if (propertyImageUrl) {
          // Fallback for single image
          await supabaseAdmin
            .from('property_images')
            .insert({
              property_id: newProperty.id,
              image_url: propertyImageUrl,
              area: 'Interior',
              is_primary: true,
              display_order: 0
            });
        }
      }

      console.log('=== Apartment creation complete! Created', createdProperties.length, 'properties ===');

      return NextResponse.json({
        success: true,
        message: `Created ${createdProperties.length} property listings for apartment building`,
        properties: createdProperties,
        block_id: blockId
      });
    }

    // For non-apartment properties OR when editing, use the original single-property logic
    // Validate required fields
    if (!title || !location || price === undefined || price === null || price === '') {
      return NextResponse.json(
        { error: 'Missing required fields: title, location, and price are required' },
        { status: 400 }
      );
    }

    // Validate and parse price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      console.error('Invalid price value:', price, 'parsed as:', priceNum);
      return NextResponse.json(
        { error: `Invalid price value: ${price}. Price must be a positive number.` },
        { status: 400 }
      );
    }

    // Validate video URL
    const validatedVideoUrl = video_url ? formatVideoUrl(video_url) : null;

    // Parse units configuration
    let unitsPerFloor: number[] = [];
    if (units_config) {
      unitsPerFloor = units_config
        .split(',')
        .map((item: string) => parseInt(item.trim(), 10))
        .filter((num: number) => !isNaN(num) && num > 0);
    }

    // Default to 1 unit per floor if not specified
    if (unitsPerFloor.length === 0 && total_floors > 0) {
      unitsPerFloor = Array(total_floors).fill(1);
    }

    // Prepare property data with validated values
    const propertyData = {
      title: title?.trim(),
      location: location?.trim(),
      description: description?.trim() || null,
      price_ugx: Math.round(priceNum * 100), // Convert to cents and round to avoid decimals
      category: normalizedCategory, // Use normalized category
      bedrooms: Math.max(1, parseInt(bedrooms) || 1), // Ensure at least 1
      bathrooms: Math.max(1, parseInt(bathrooms) || 1), // Ensure at least 1
      image_url: image_url || all_image_urls?.[0] || null,
      video_url: validatedVideoUrl,
      minimum_initial_months: Math.max(1, parseInt(minimum_initial_months) || 1), // Ensure at least 1
      total_floors: Math.max(1, parseInt(total_floors) || 1), // Ensure at least 1
      units_config: units_config,
      host_id: assignedHostId || user.id,
      landlord_id: assignedLandlordId,
      google_maps_embed_url: google_maps_embed_url || null,
    };

    console.log('Property data to insert:', propertyData);

    // Create or update property
    let propertyResult;
    if (editingPropertyId) {
      const { data, error } = await supabaseAdmin
        .from("properties")
        .update(propertyData)
        .eq("id", editingPropertyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        throw error;
      }
      propertyResult = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("properties")
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting property:', error);
        throw error;
      }
      propertyResult = data;
    }

    // Handle block creation/assignment
    let blockId = null;

    if (add_to_existing_block && existing_block_id) {
      blockId = existing_block_id;
      
      // Update existing block
      await supabaseAdmin
        .from("property_blocks")
        .update({
          location: propertyResult.location,
          total_floors: parseInt(total_floors),
          total_units: unitsPerFloor.reduce((sum: number, units: number) => sum + units, 0)
        })
        .eq("id", existing_block_id);
    } else {
      // Create new block
      blockId = await getOrCreateBlock(
        supabaseAdmin,
        propertyResult.location,
        parseInt(total_floors),
        unitsPerFloor.reduce((sum: number, units: number) => sum + units, 0),
        user.id
      );

      if (!blockId) {
        throw new Error('Failed to create property block');
      }
    }

    // Update property with block_id
    if (blockId) {
      await supabaseAdmin
        .from("properties")
        .update({ block_id: blockId })
        .eq("id", propertyResult.id);

      // Delete existing units if editing
      if (editingPropertyId) {
        await supabaseAdmin
          .from("property_units")
          .delete()
          .eq("property_id", propertyResult.id);
      }

      // Create units based on configuration
      if (floor_unit_config) {
        // Advanced floor unit configuration
        const config = typeof floor_unit_config === 'string' ? JSON.parse(floor_unit_config) : floor_unit_config;
        for (const floor of config.floors) {
          let unitIndexOnFloor = 1;
          
          for (const unitType of floor.unitTypes) {
            const bedroomsVal = unitType.type === 'Studio' ? 0 : 
                           unitType.type === '1BR' ? 1 :
                           unitType.type === '2BR' ? 2 :
                           unitType.type === '3BR' ? 3 :
                           unitType.type === '4BR' ? 4 :
                           unitType.type === 'Penthouse' ? 4 :
                           propertyResult.bedrooms;
            
            const bathroomsVal = Math.max(1, Math.ceil(bedroomsVal / 2));
            
            for (let i = 0; i < unitType.count; i++) {
              const unitNumber = `${floor.floorNumber}${String(unitIndexOnFloor).padStart(2, '0')}`;
              
              const { error: unitError } = await supabaseAdmin
                .from("property_units")
                .insert({
                  property_id: propertyResult.id,
                  block_id: blockId,
                  floor_number: floor.floorNumber,
                  unit_number: unitNumber,
                  unit_type: unitType.type,
                  bedrooms: bedroomsVal,
                  bathrooms: bathroomsVal,
                  is_available: true
                });
              
              if (unitError) {
                console.error('Error creating unit:', unitError);
                throw unitError;
              }
              
              unitIndexOnFloor++;
            }
          }
        }
      } else {
        // Simple configuration
        for (let floor = 1; floor <= parseInt(total_floors); floor++) {
          const unitsOnThisFloor = floor <= unitsPerFloor.length ? unitsPerFloor[floor - 1] : 1;

          for (let unit = 1; unit <= unitsOnThisFloor; unit++) {
            const unitNumber = `${floor}${String(unit).padStart(2, '0')}`;

            const { error: unitError } = await supabaseAdmin
              .from('property_units')
              .insert({
                property_id: propertyResult.id,
                block_id: blockId,
                floor_number: floor,
                unit_number: unitNumber,
                unit_type: 'Standard',
                bedrooms: propertyResult.bedrooms,
                bathrooms: propertyResult.bathrooms,
                is_available: true
              });
              
            if (unitError) {
              console.error('Error creating simple unit:', unitError);
              throw unitError;
            }
          }
        }
      }
    }

    // Store all image URLs in property_images table if provided
    if (all_image_urls && Array.isArray(all_image_urls) && all_image_urls.length > 0) {
      for (const imageUrl of all_image_urls) {
        const { error: imageError } = await supabaseAdmin
          .from("property_images")
          .insert({
            property_id: propertyResult.id,
            image_url: imageUrl,
            is_primary: imageUrl === propertyResult.image_url
          });
          
        if (imageError) {
          console.error('Error inserting property image:', imageError);
          throw imageError;
        }
      }
    }

    // Return success response with updated property
    return NextResponse.json({
      success: true,
      property: { ...propertyResult, block_id: blockId }
    });

  } catch (error) {
    console.error('=== Error in property API ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create property',
        details: error
      },
      { status: 500 }
    );
  }
}

// PUT route for updating properties
export async function PUT(request: Request) {
  // Reuse POST logic since both handle property creation/update
  return await POST(request);
}

// DELETE route for removing properties
export async function DELETE(request: Request) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create Supabase client with service role (bypasses RLS for database operations)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create SSR client for reading auth from cookies
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    // Get authenticated user using the SSR client
    const { data: { user }, error: userError } = await supabaseSSR.auth.getUser();

    if (userError || !user) {
      console.error('⚠️ No authenticated user found for DELETE request');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first' },
        { status: 401 }
      );
    }

    // Verify user has admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.error('User does not have admin privileges for DELETE:', user.email);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse the request body to get property ID
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required for deletion' },
        { status: 400 }
      );
    }

    // Delete the property and related records
    const { error } = await supabaseAdmin
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Error deleting property:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/properties:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete property' },
      { status: 500 }
    );
  }
}