-- Add landlord_id to property_units to support unit-level assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='property_units' AND column_name='landlord_id'
  ) THEN
    ALTER TABLE public.property_units 
      ADD COLUMN landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_property_units_landlord_id ON public.property_units(landlord_id);
  END IF;
END $$;