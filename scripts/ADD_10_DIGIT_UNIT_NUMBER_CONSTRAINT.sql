-- ============================================================================
-- Migration: Add 10-digit unit number constraint
-- Description: Updates property_units table to enforce 10-digit unique unit numbers
-- ============================================================================

-- Step 1: Add a check constraint to ensure unit_number is exactly 10 digits
-- Note: This constraint allows both old format (for existing data) and new 10-digit format
-- You may want to migrate existing data first before enforcing strict 10-digit constraint

ALTER TABLE public.property_units 
DROP CONSTRAINT IF EXISTS unit_number_format_check;

-- Add constraint that allows either old format or new 10-digit format
-- This is lenient to allow gradual migration
ALTER TABLE public.property_units 
ADD CONSTRAINT unit_number_format_check 
CHECK (
  unit_number ~ '^\d+$' -- Must be all digits
  AND length(unit_number) >= 3 -- At least 3 characters
  AND length(unit_number) <= 10 -- Max 10 characters
);

-- Step 2: Add a unique constraint on unit_number within a block
-- This ensures no duplicate unit numbers within the same building block
DROP INDEX IF EXISTS idx_property_units_unique_number_per_block;

CREATE UNIQUE INDEX idx_property_units_unique_number_per_block 
ON public.property_units(block_id, unit_number);

-- Step 3: Add index for better query performance on unit_number
DROP INDEX IF EXISTS idx_property_units_unit_number;

CREATE INDEX idx_property_units_unit_number 
ON public.property_units(unit_number);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.property_units.unit_number IS 
'Unique 10-digit unit identifier. Format: PPPPFUUUCC where PPPP=property hash, F=floor, UUU=unit index, CC=check digits';

-- ============================================================================
-- Optional: Function to validate 10-digit unit numbers using check digits
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_unit_number_check_digits(unit_num TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  base_number TEXT;
  provided_check TEXT;
  calculated_check TEXT;
  digit_sum INTEGER := 0;
  current_digit INTEGER;
  is_even BOOLEAN := FALSE;
  i INTEGER;
  check_digit_1 INTEGER;
  check_digit_2 INTEGER;
BEGIN
  -- Only validate if it's a 10-digit number
  IF length(unit_num) != 10 OR unit_num !~ '^\d{10}$' THEN
    RETURN TRUE; -- Allow non-10-digit numbers for backwards compatibility
  END IF;
  
  -- Extract base number and check digits
  base_number := substring(unit_num, 1, 8);
  provided_check := substring(unit_num, 9, 2);
  
  -- Calculate check digits using Luhn algorithm variant
  FOR i IN REVERSE length(base_number)..1 LOOP
    current_digit := substring(base_number, i, 1)::INTEGER;
    
    IF is_even THEN
      current_digit := current_digit * 2;
      IF current_digit > 9 THEN
        current_digit := current_digit - 9;
      END IF;
    END IF;
    
    digit_sum := digit_sum + current_digit;
    is_even := NOT is_even;
  END LOOP;
  
  -- Calculate first check digit
  check_digit_1 := (10 - (digit_sum % 10)) % 10;
  
  -- Calculate second check digit (sum of all base digits mod 10)
  digit_sum := 0;
  FOR i IN 1..length(base_number) LOOP
    digit_sum := digit_sum + substring(base_number, i, 1)::INTEGER;
  END LOOP;
  check_digit_2 := digit_sum % 10;
  
  -- Construct expected check digits
  calculated_check := check_digit_1::TEXT || check_digit_2::TEXT;
  
  -- Return true if they match
  RETURN calculated_check = provided_check;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_unit_number_check_digits(TEXT) IS
'Validates the check digits of a 10-digit unit number using Luhn algorithm variant';

-- ============================================================================
-- Optional: Add trigger to validate check digits on insert/update
-- Uncomment the following to enforce strict validation
-- ============================================================================

/*
CREATE OR REPLACE FUNCTION check_unit_number_validity()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validate_unit_number_check_digits(NEW.unit_number) THEN
    RAISE EXCEPTION 'Invalid unit number check digits: %', NEW.unit_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_unit_number_trigger ON public.property_units;

CREATE TRIGGER validate_unit_number_trigger
  BEFORE INSERT OR UPDATE ON public.property_units
  FOR EACH ROW
  EXECUTE FUNCTION check_unit_number_validity();
*/

-- ============================================================================
-- Migration Notes
-- ============================================================================

/*
To migrate existing unit numbers to the new 10-digit format, you can run:

UPDATE public.property_units
SET unit_number = [generated 10-digit number]
WHERE length(unit_number) < 10;

The 10-digit generation should be done in your application code using the
generateUnitNumber() function from lib/unit-number-generator.ts
*/

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check for any invalid unit numbers
-- SELECT id, unit_number, length(unit_number) as num_length
-- FROM public.property_units
-- WHERE length(unit_number) != 10 OR unit_number !~ '^\d{10}$';

-- Check for duplicate unit numbers within blocks
-- SELECT block_id, unit_number, COUNT(*) as duplicate_count
-- FROM public.property_units
-- GROUP BY block_id, unit_number
-- HAVING COUNT(*) > 1;

-- Test the validation function
-- SELECT unit_number, validate_unit_number_check_digits(unit_number) as is_valid
-- FROM public.property_units
-- WHERE length(unit_number) = 10;
