// Property service functions for API calls and data operations

import { createClient } from "@/lib/supabase/client"
import { FloorUnitTypeConfiguration } from "@/components/adminView/floor-unit-type-configurator"
import { extractUniqueUnitTypes, generateBlockName } from "./utils"
import { generateUnitNumber } from "@/lib/unit-number-generator"

/**
 * Get or create a property block
 */
export async function getOrCreateBlock(
  location: string,
  totalFloors: number,
  totalUnits: number,
  existingBlockId?: string,
  buildingName?: string
): Promise<string | null> {
  const supabase = createClient();

  if (existingBlockId) {
    // Update existing block
    console.log('Updating existing block:', existingBlockId);
    const updateData: { location: string; total_floors: number; total_units: number; name?: string } = {
      location: location,
      total_floors: totalFloors,
      total_units: totalUnits
    };
    
    // Update name if provided
    if (buildingName) {
      updateData.name = buildingName;
    }

    const { error } = await supabase
      .from("property_blocks")
      .update(updateData)
      .eq("id", existingBlockId);

    if (error) {
      console.error("Error updating block:", error);
      console.error("Update error details:", JSON.stringify(error, null, 2));
      return existingBlockId;
    }
    return existingBlockId;
  } else {
    // Use provided building name or generate one based on location
    const blockName = buildingName || generateBlockName(location);

    // Get the current user ID for created_by
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Creating new block with user:', user?.id);
    console.log('Block name:', blockName);
    console.log('Location:', location);
    console.log('Total floors:', totalFloors);
    console.log('Total units:', totalUnits);

    // Create new block
    const { data, error } = await supabase
      .from("property_blocks")
      .insert({
        name: blockName,
        location: location,
        total_floors: totalFloors,
        total_units: totalUnits,
        created_by: user?.id || null
      })
      .select();

    if (error) {
      console.error("=== Error creating block ===");
      console.error("Error object:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      return null;
    }

    console.log('Block created successfully:', data);
    return data && data.length > 0 ? data[0].id : null;
  }
}

/**
 * Create multiple properties from floor unit type configuration
 * Each unique unit type becomes its own property listing
 */
export async function createPropertiesFromFloorUnitConfig(
  supabase: any,
  basePropertyData: any,
  floorConfig: FloorUnitTypeConfiguration,
  buildingName: string,
  allImageUrls: string[]
): Promise<void> {
  console.log('Creating properties from floor unit config...');
  
  // Extract unique unit types
  const uniqueUnitTypes = extractUniqueUnitTypes(floorConfig);
  console.log('Unique unit types:', uniqueUnitTypes);

  if (uniqueUnitTypes.length === 0) {
    console.error('No unit types found in floor configuration');
    return;
  }

  // Calculate total units across all types
  const totalUnitsCount = uniqueUnitTypes.reduce((sum, ut) => sum + ut.totalUnits, 0);

  // Create or get the block for this building
  const blockId = await getOrCreateBlock(
    basePropertyData.location,
    floorConfig.totalFloors,
    totalUnitsCount,
    undefined,
    buildingName || undefined
  );

  if (!blockId) {
    console.error('Failed to create block for building');
    return;
  }

  console.log('Block created/retrieved:', blockId);

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  // Create a property for each unique unit type
  for (const unitType of uniqueUnitTypes) {
    console.log(`Creating property for unit type: ${unitType.type}`);

    // Create property title - use custom title if provided, otherwise combine building name and unit type
    const propertyTitle = unitType.customTitle 
      ? unitType.customTitle
      : buildingName 
        ? `${buildingName} - ${unitType.label}`
        : `${basePropertyData.title} - ${unitType.label}`;

    // Use custom description if provided, otherwise fall back to base property description
    const propertyDescription = unitType.description && unitType.description.trim() 
      ? unitType.description 
      : basePropertyData.description;

    // Use unit type specific image if provided, otherwise fall back to base property image
    const propertyImageUrl = unitType.imageUrl && unitType.imageUrl.trim()
      ? unitType.imageUrl
      : basePropertyData.image_url;

    // Create property data for this unit type
    const propertyData = {
      title: propertyTitle,
      location: basePropertyData.location,
      description: propertyDescription,
      price_ugx: unitType.monthlyFee * 100, // Convert to cents (stored as price_ugx)
      category: basePropertyData.category,
      bedrooms: unitType.bedrooms,
      bathrooms: unitType.bathrooms,
      image_url: propertyImageUrl,
      video_url: basePropertyData.video_url,
      minimum_initial_months: basePropertyData.minimum_initial_months || 1,
      total_floors: floorConfig.totalFloors,
      units_config: unitType.totalUnits.toString(),
      block_id: blockId,
      host_id: user?.id || null,
      is_active: true,
    };

    // Insert the property
    const { data: newProperty, error: propertyError } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (propertyError) {
      console.error(`Error creating property for ${unitType.type}:`, propertyError);
      continue;
    }

    console.log(`Property created for ${unitType.type}:`, newProperty.id);

    // Create units for this property based on floor configuration
    let unitCounter = 1;
    for (const floorInfo of unitType.unitsPerFloor) {
      for (let i = 0; i < floorInfo.count; i++) {
        // Generate unique 10-digit unit number
        const unitNumber = generateUnitNumber(blockId, floorInfo.floor, unitCounter);
        unitCounter++;

        const unitData = {
          property_id: newProperty.id,
          block_id: blockId,
          floor_number: floorInfo.floor,
          unit_number: unitNumber,
          unit_type: unitType.type,
          bedrooms: unitType.bedrooms,
          bathrooms: unitType.bathrooms,
          price_ugx: unitType.monthlyFee * 100,
          is_available: true,
          sync_with_template: true,
          template_name: `${unitType.type}_${buildingName || 'building'}`
        };

        const { error: unitError } = await supabase
          .from('property_units')
          .insert(unitData);

        if (unitError) {
          console.error(`Error creating unit ${unitNumber}:`, unitError);
        }
      }
    }

    // Store images for this property
    // First, add the unit type's main image as primary if it exists
    if (propertyImageUrl) {
      await supabase
        .from('property_images')
        .insert({
          property_id: newProperty.id,
          image_url: propertyImageUrl,
          is_primary: true
        });
    }
    
    // Then add any additional shared images (but not as primary)
    if (allImageUrls.length > 0) {
      for (const imageUrl of allImageUrls) {
        // Skip if this is already the main image for this unit type
        if (imageUrl === propertyImageUrl) continue;
        
        await supabase
          .from('property_images')
          .insert({
            property_id: newProperty.id,
            image_url: imageUrl,
            is_primary: false
          });
      }
    }
  }

  console.log('Finished creating properties from floor unit config');
}
