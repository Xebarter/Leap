-- ============================================================================
-- ADD UNIQUE 10-DIGIT PROPERTY CODE TO PROPERTIES TABLE
-- ============================================================================
-- This migration adds a unique 10-digit code to identify each property listing.
-- The code is automatically generated when a property is created.
-- ============================================================================

-- Add the property_code column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS property_code VARCHAR(10) UNIQUE;

-- Create index for fast lookups by property_code
CREATE INDEX IF NOT EXISTS idx_properties_property_code ON public.properties(property_code);

-- Function to generate a unique 10-digit property code
CREATE OR REPLACE FUNCTION generate_property_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 10-digit numeric code
        new_code := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.properties WHERE property_code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate property_code on insert
CREATE OR REPLACE FUNCTION set_property_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate code if not provided
    IF NEW.property_code IS NULL OR NEW.property_code = '' THEN
        NEW.property_code := generate_property_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic code generation on insert
DROP TRIGGER IF EXISTS trigger_set_property_code ON public.properties;
CREATE TRIGGER trigger_set_property_code
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION set_property_code();

-- Generate codes for existing properties that don't have one
UPDATE public.properties 
SET property_code = generate_property_code() 
WHERE property_code IS NULL;

-- After populating, make the column NOT NULL for future inserts
-- (Optional: Uncomment the line below if you want to enforce NOT NULL)
-- ALTER TABLE public.properties ALTER COLUMN property_code SET NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================
-- Check if column was added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' AND column_name = 'property_code';

-- Check existing property codes:
-- SELECT id, title, property_code FROM public.properties LIMIT 10;

-- Test generating a new code:
-- SELECT generate_property_code();
