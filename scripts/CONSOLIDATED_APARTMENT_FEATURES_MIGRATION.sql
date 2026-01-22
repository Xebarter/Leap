-- ============================================================================
-- CONSOLIDATED APARTMENT FEATURES MIGRATION
-- ============================================================================
-- Run this AFTER: COMPLETE_PROPERTIES_SCHEMA, MAINTENANCE_SCHEMA, 
--                 PAYMENTS_SCHEMA, TENANTS_SCHEMA
-- 
-- This consolidates all apartment-related enhancements:
-- 1. Floor unit type configuration (floor_unit_config JSONB)
-- 2. Individual unit pricing (price_ugx per unit)
-- 3. Unit templates and synchronization
-- 4. Updated unit type constraints (1BR, 2BR, 3BR, 4BR)
-- 5. Revenue calculation functions
-- 6. Helpful views for management
-- ============================================================================

-- ============================================================================
-- PART 1: SCHEMA ENHANCEMENTS
-- ============================================================================

-- 1.1 Add floor_unit_config to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS floor_unit_config JSONB;

COMMENT ON COLUMN public.properties.floor_unit_config IS 
'JSON configuration storing unit type distribution per floor. Format: {"totalFloors": 5, "floors": [{"floorNumber": 1, "unitTypes": [{"type": "1BR", "count": 2, "monthlyFee": 1000000}]}]}';

CREATE INDEX IF NOT EXISTS idx_properties_floor_unit_config 
ON public.properties USING GIN (floor_unit_config);

-- 1.2 Add columns to property_units table
ALTER TABLE public.property_units 
ADD COLUMN IF NOT EXISTS price_ugx BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS area_sqft INTEGER,
ADD COLUMN IF NOT EXISTS template_name TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS sync_with_template BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.property_units.price_ugx IS 
'Monthly rental fee in Ugandan Shillings (stored in cents for precision). Individual unit pricing.';

-- 1.3 Update unit_type constraint to include all modern apartment types
ALTER TABLE public.property_units
DROP CONSTRAINT IF EXISTS property_units_unit_type_check;

ALTER TABLE public.property_units
ADD CONSTRAINT property_units_unit_type_check 
CHECK (unit_type IN (
  'Standard', 'Deluxe', 'Penthouse', 'Studio', 'Bedsitter', 
  '1BR', '2BR', '3BR', '4BR', 'Other'
));

-- 1.4 Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_units_price_ugx ON public.property_units(price_ugx);
CREATE INDEX IF NOT EXISTS idx_property_units_template_name ON public.property_units(template_name);
CREATE INDEX IF NOT EXISTS idx_property_units_unit_type ON public.property_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_property_units_sync_template ON public.property_units(sync_with_template);

-- ============================================================================
-- PART 2: DATA MIGRATION
-- ============================================================================

-- 2.1 Update existing units to inherit price from parent property (if price_ugx is 0)
UPDATE public.property_units pu
SET price_ugx = COALESCE(
  (SELECT p.price_ugx FROM public.properties p WHERE p.id = pu.property_id LIMIT 1),
  0
)
WHERE pu.price_ugx = 0 OR pu.price_ugx IS NULL;

-- 2.2 Populate template_name for existing units based on characteristics
DO $$
DECLARE
  unit_record RECORD;
  template_name_var TEXT;
BEGIN
  FOR unit_record IN 
    SELECT DISTINCT 
      block_id,
      bedrooms,
      bathrooms,
      unit_type
    FROM public.property_units
    WHERE template_name IS NULL OR template_name = ''
  LOOP
    -- Generate a template name based on unit characteristics
    template_name_var := unit_record.unit_type || '_' || 
                         unit_record.bedrooms || 'BR_' || 
                         unit_record.bathrooms || 'BA';
    
    -- Update all units with these characteristics in the same block
    UPDATE public.property_units
    SET template_name = template_name_var
    WHERE 
      block_id = unit_record.block_id
      AND bedrooms = unit_record.bedrooms
      AND bathrooms = unit_record.bathrooms
      AND unit_type = unit_record.unit_type
      AND (template_name IS NULL OR template_name = '');
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: FUNCTIONS
-- ============================================================================

-- 3.1 Function to generate units from floor_unit_config
CREATE OR REPLACE FUNCTION public.generate_units_from_floor_config(
  p_property_id UUID,
  p_block_id UUID,
  p_floor_config JSONB,
  p_base_bedrooms INTEGER DEFAULT 1,
  p_base_bathrooms INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  floor_record JSONB;
  unit_type_record JSONB;
  floor_number INTEGER;
  unit_type TEXT;
  unit_count INTEGER;
  monthly_fee BIGINT;
  unit_idx INTEGER;
  unit_number TEXT;
  bedrooms INTEGER;
  bathrooms INTEGER;
  total_units_created INTEGER := 0;
  unit_index_on_floor INTEGER;
BEGIN
  -- Loop through each floor in the configuration
  FOR floor_record IN SELECT * FROM jsonb_array_elements(p_floor_config->'floors')
  LOOP
    floor_number := (floor_record->>'floorNumber')::INTEGER;
    unit_index_on_floor := 1;
    
    -- Loop through each unit type on this floor
    FOR unit_type_record IN SELECT * FROM jsonb_array_elements(floor_record->'unitTypes')
    LOOP
      unit_type := unit_type_record->>'type';
      unit_count := (unit_type_record->>'count')::INTEGER;
      monthly_fee := COALESCE((unit_type_record->>'monthlyFee')::BIGINT, 0) * 100; -- Convert to cents
      
      -- Determine bedrooms based on unit type
      bedrooms := CASE unit_type
        WHEN 'Studio' THEN 0
        WHEN '1BR' THEN 1
        WHEN '2BR' THEN 2
        WHEN '3BR' THEN 3
        WHEN '4BR' THEN 4
        WHEN 'Penthouse' THEN 4
        ELSE p_base_bedrooms
      END;
      
      -- Determine bathrooms (typically half the bedrooms rounded up, minimum 1)
      bathrooms := GREATEST(1, CEIL(bedrooms::NUMERIC / 2));
      
      -- Create the specified number of units of this type
      FOR unit_idx IN 1..unit_count
      LOOP
        -- Generate unit number (e.g., 101, 102, 201, etc.)
        unit_number := floor_number::TEXT || LPAD(unit_index_on_floor::TEXT, 2, '0');
        
        -- Insert the unit
        INSERT INTO public.property_units (
          property_id,
          block_id,
          floor_number,
          unit_number,
          unit_type,
          bedrooms,
          bathrooms,
          price_ugx,
          template_name,
          is_available
        ) VALUES (
          p_property_id,
          p_block_id,
          floor_number,
          unit_number,
          unit_type,
          bedrooms,
          bathrooms,
          monthly_fee,
          unit_type || '_' || bedrooms || 'BR_' || bathrooms || 'BA',
          TRUE
        )
        ON CONFLICT DO NOTHING;
        
        total_units_created := total_units_created + 1;
        unit_index_on_floor := unit_index_on_floor + 1;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN total_units_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_units_from_floor_config(UUID, UUID, JSONB, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.generate_units_from_floor_config IS 
'Generates property units from a floor configuration JSON. Used when creating apartment properties with floor unit type configuration.';

-- 3.2 Function to sync similar units (template-based)
CREATE OR REPLACE FUNCTION public.sync_similar_units()
RETURNS TRIGGER AS $$
BEGIN
  -- When a unit with a template_name is updated, sync other units with same template
  -- BUT only if those units have sync_with_template = TRUE
  IF NEW.template_name IS NOT NULL AND NEW.template_name != '' AND NEW.sync_with_template = TRUE THEN
    UPDATE public.property_units
    SET 
      bedrooms = NEW.bedrooms,
      bathrooms = NEW.bathrooms,
      price_ugx = NEW.price_ugx,
      area_sqft = NEW.area_sqft,
      unit_type = NEW.unit_type,
      features = NEW.features,
      updated_at = NOW()
    WHERE 
      block_id = NEW.block_id 
      AND template_name = NEW.template_name
      AND sync_with_template = TRUE
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.sync_similar_units() TO authenticated;

-- 3.3 Create trigger for automatic unit synchronization
DROP TRIGGER IF EXISTS trigger_sync_similar_units ON public.property_units;
CREATE TRIGGER trigger_sync_similar_units
  AFTER UPDATE ON public.property_units
  FOR EACH ROW
  WHEN (
    NEW.template_name IS NOT NULL AND 
    (OLD.bedrooms IS DISTINCT FROM NEW.bedrooms OR
     OLD.bathrooms IS DISTINCT FROM NEW.bathrooms OR
     OLD.price_ugx IS DISTINCT FROM NEW.price_ugx OR
     OLD.area_sqft IS DISTINCT FROM NEW.area_sqft OR
     OLD.unit_type IS DISTINCT FROM NEW.unit_type OR
     OLD.features IS DISTINCT FROM NEW.features)
  )
  EXECUTE FUNCTION public.sync_similar_units();

-- 3.4 Function to calculate block revenue potential
CREATE OR REPLACE FUNCTION public.calculate_block_revenue_potential(block_uuid UUID)
RETURNS TABLE (
  block_id UUID,
  block_name TEXT,
  total_units INTEGER,
  occupied_units INTEGER,
  available_units INTEGER,
  potential_monthly_revenue BIGINT,
  current_monthly_revenue BIGINT,
  potential_monthly_revenue_formatted NUMERIC,
  current_monthly_revenue_formatted NUMERIC,
  occupancy_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id,
    pb.name,
    COUNT(pu.id)::INTEGER as total_units,
    COUNT(pu.id) FILTER (WHERE pu.is_available = false)::INTEGER as occupied_units,
    COUNT(pu.id) FILTER (WHERE pu.is_available = true)::INTEGER as available_units,
    COALESCE(SUM(pu.price_ugx), 0)::BIGINT as potential_monthly_revenue,
    COALESCE(SUM(CASE WHEN pu.is_available = false THEN pu.price_ugx ELSE 0 END), 0)::BIGINT as current_monthly_revenue,
    COALESCE(SUM(pu.price_ugx), 0)::NUMERIC / 100 as potential_monthly_revenue_formatted,
    COALESCE(SUM(CASE WHEN pu.is_available = false THEN pu.price_ugx ELSE 0 END), 0)::NUMERIC / 100 as current_monthly_revenue_formatted,
    CASE 
      WHEN COUNT(pu.id) > 0 THEN 
        (COUNT(pu.id) FILTER (WHERE pu.is_available = false)::NUMERIC / COUNT(pu.id)::NUMERIC) * 100
      ELSE 0
    END as occupancy_rate
  FROM public.property_blocks pb
  LEFT JOIN public.property_units pu ON pu.block_id = pb.id
  WHERE pb.id = block_uuid
  GROUP BY pb.id, pb.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_block_revenue_potential(UUID) TO authenticated;

-- 3.5 Function to calculate property revenue potential
CREATE OR REPLACE FUNCTION public.calculate_property_revenue_potential(property_uuid UUID)
RETURNS TABLE (
  property_id UUID,
  property_title TEXT,
  total_blocks INTEGER,
  total_units INTEGER,
  occupied_units INTEGER,
  available_units INTEGER,
  potential_monthly_revenue BIGINT,
  current_monthly_revenue BIGINT,
  potential_monthly_revenue_formatted NUMERIC,
  current_monthly_revenue_formatted NUMERIC,
  occupancy_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    COUNT(DISTINCT pb.id)::INTEGER as total_blocks,
    COUNT(pu.id)::INTEGER as total_units,
    COUNT(pu.id) FILTER (WHERE pu.is_available = false)::INTEGER as occupied_units,
    COUNT(pu.id) FILTER (WHERE pu.is_available = true)::INTEGER as available_units,
    COALESCE(SUM(pu.price_ugx), 0)::BIGINT as potential_monthly_revenue,
    COALESCE(SUM(CASE WHEN pu.is_available = false THEN pu.price_ugx ELSE 0 END), 0)::BIGINT as current_monthly_revenue,
    COALESCE(SUM(pu.price_ugx), 0)::NUMERIC / 100 as potential_monthly_revenue_formatted,
    COALESCE(SUM(CASE WHEN pu.is_available = false THEN pu.price_ugx ELSE 0 END), 0)::NUMERIC / 100 as current_monthly_revenue_formatted,
    CASE 
      WHEN COUNT(pu.id) > 0 THEN 
        (COUNT(pu.id) FILTER (WHERE pu.is_available = false)::NUMERIC / COUNT(pu.id)::NUMERIC) * 100
      ELSE 0
    END as occupancy_rate
  FROM public.properties p
  LEFT JOIN public.property_blocks pb ON pb.property_id = p.id
  LEFT JOIN public.property_units pu ON pu.property_id = p.id
  WHERE p.id = property_uuid
  GROUP BY p.id, p.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_property_revenue_potential(UUID) TO authenticated;

-- ============================================================================
-- PART 4: VIEWS
-- ============================================================================

-- 4.1 Unit pricing summary view
CREATE OR REPLACE VIEW public.unit_pricing_summary AS
SELECT 
  pu.id as unit_id,
  pu.unit_number,
  pu.unit_type,
  pu.floor_number,
  pu.bedrooms,
  pu.bathrooms,
  pu.price_ugx,
  pu.price_ugx / 100 as monthly_fee_ugx,
  pu.area_sqft,
  pu.template_name,
  pu.sync_with_template,
  pu.is_available,
  p.id as property_id,
  p.title as property_title,
  p.location,
  pb.id as block_id,
  pb.name as block_name
FROM public.property_units pu
LEFT JOIN public.properties p ON p.id = pu.property_id
LEFT JOIN public.property_blocks pb ON pb.id = pu.block_id
ORDER BY p.title, pb.name, pu.floor_number, pu.unit_number;

GRANT SELECT ON public.unit_pricing_summary TO authenticated;
GRANT SELECT ON public.unit_pricing_summary TO anon;

-- 4.2 Floor configuration summary view
CREATE OR REPLACE VIEW public.property_floor_config_summary AS
SELECT 
  p.id as property_id,
  p.title,
  p.location,
  p.total_floors,
  p.floor_unit_config,
  CASE 
    WHEN p.floor_unit_config IS NOT NULL THEN 
      (
        SELECT SUM((unit_type->>'count')::INTEGER)
        FROM jsonb_array_elements(p.floor_unit_config->'floors') AS floor,
             jsonb_array_elements(floor->'unitTypes') AS unit_type
      )
    ELSE 
      (SELECT COUNT(*) FROM public.property_units WHERE property_id = p.id)
  END as total_configured_units,
  (SELECT COUNT(*) FROM public.property_units WHERE property_id = p.id) as actual_units_created,
  CASE 
    WHEN p.floor_unit_config IS NOT NULL THEN
      (
        SELECT jsonb_agg(DISTINCT unit_type->>'type')
        FROM jsonb_array_elements(p.floor_unit_config->'floors') AS floor,
             jsonb_array_elements(floor->'unitTypes') AS unit_type
      )
    ELSE NULL
  END as configured_unit_types
FROM public.properties p
WHERE p.category = 'Apartment' OR p.floor_unit_config IS NOT NULL;

GRANT SELECT ON public.property_floor_config_summary TO authenticated;

COMMENT ON VIEW public.property_floor_config_summary IS 
'Summary view showing properties with floor unit type configuration and comparing configured vs actual units';

-- 4.3 Unit templates summary view
CREATE OR REPLACE VIEW public.unit_templates_summary AS
SELECT 
  pu.block_id,
  pu.template_name,
  pu.unit_type,
  pu.bedrooms,
  pu.bathrooms,
  pu.price_ugx,
  pu.price_ugx / 100 as monthly_fee_ugx,
  pu.area_sqft,
  COUNT(*) as total_units,
  SUM(CASE WHEN pu.is_available = true THEN 1 ELSE 0 END) as available_units,
  SUM(CASE WHEN pu.sync_with_template = true THEN 1 ELSE 0 END) as synced_units,
  ARRAY_AGG(pu.unit_number ORDER BY pu.floor_number, pu.unit_number) as unit_numbers
FROM public.property_units pu
WHERE pu.template_name IS NOT NULL
GROUP BY 
  pu.block_id, 
  pu.template_name, 
  pu.unit_type, 
  pu.bedrooms, 
  pu.bathrooms, 
  pu.price_ugx, 
  pu.area_sqft;

GRANT SELECT ON public.unit_templates_summary TO authenticated;

-- 4.4 Individual (non-synced) units view
CREATE OR REPLACE VIEW public.individual_units_summary AS
SELECT 
  pu.id,
  pu.block_id,
  pu.property_id,
  pu.unit_number,
  pu.floor_number,
  pu.unit_type,
  pu.bedrooms,
  pu.bathrooms,
  pu.price_ugx,
  pu.price_ugx / 100 as monthly_fee_ugx,
  pu.area_sqft,
  pu.is_available,
  pu.template_name,
  pb.name as block_name,
  pb.location as block_location
FROM public.property_units pu
LEFT JOIN public.property_blocks pb ON pb.id = pu.block_id
WHERE pu.sync_with_template = FALSE OR pu.template_name IS NULL;

GRANT SELECT ON public.individual_units_summary TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This consolidated migration provides:
-- ✓ Floor unit type configuration (floor_unit_config JSONB)
-- ✓ Individual unit pricing (price_ugx per unit)
-- ✓ Updated unit type constraints (Studio, 1BR, 2BR, 3BR, 4BR, Penthouse)
-- ✓ Unit templates with automatic synchronization
-- ✓ Revenue calculation functions (block and property level)
-- ✓ Helpful views for property management
-- ✓ Performance indexes on all relevant columns
-- ✓ Backward compatibility with existing data
-- ============================================================================

-- Example queries to test:
-- SELECT * FROM unit_pricing_summary LIMIT 10;
-- SELECT * FROM property_floor_config_summary;
-- SELECT * FROM calculate_property_revenue_potential('your-property-uuid');
-- SELECT * FROM calculate_block_revenue_potential('your-block-uuid');
-- SELECT * FROM unit_templates_summary;
