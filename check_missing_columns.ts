import { createClient } from '@lib/supabase/server';

/**
 * Script to check if all required columns exist in the properties table
 * Run this script to identify missing columns that might cause save errors
 */
async function checkMissingColumns() {
  const supabase = createClient();
  
  // Query to check for specific columns in the properties table
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'properties')
    .in('column_name', [
      'google_maps_embed_url',
      'is_featured',
      'property_code',
      'floor_unit_config'
    ]);

  if (error) {
    console.error('Error checking columns:', error);
    return;
  }

  // List of required columns for PropertyEditor
  const requiredColumns = [
    'google_maps_embed_url',
    'is_featured',
    'property_code',
    'floor_unit_config'
  ];

  const existingColumns = data ? data.map(col => col.column_name) : [];
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

  if (missingColumns.length > 0) {
    console.log('Missing columns that may cause save errors:');
    missingColumns.forEach(col => console.log(`- ${col}`));
    
    console.log('\nTo fix this, run the following SQL migrations:');
    if (missingColumns.includes('google_maps_embed_url')) {
      console.log('- ADD_GOOGLE_MAPS_FIELD.sql');
    }
    if (missingColumns.includes('is_featured')) {
      console.log('- ADD_FEATURED_PROPERTY.sql');
    }
    if (missingColumns.includes('property_code')) {
      console.log('- ADD_PROPERTY_CODE.sql');
    }
    if (missingColumns.includes('floor_unit_config')) {
      console.log('- CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql');
    }
    
    console.log('\nRun these commands in your Supabase SQL editor or through the CLI.');
  } else {
    console.log('All required columns exist in the properties table!');
  }
}

// For testing purposes - this would normally be called from a server action or API route
// export { checkMissingColumns };