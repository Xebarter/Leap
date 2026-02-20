-- ============================================================================
-- ADD LANDLORD_ID TO PROPERTIES AND PROPERTY_UNITS TABLES
-- ============================================================================
-- This script adds landlord_id columns to both properties and property_units
-- tables to support landlord assignment functionality
-- ============================================================================

-- Add landlord_id to properties table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'landlord_id'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_properties_landlord_id 
        ON public.properties(landlord_id);
        
        RAISE NOTICE 'Added landlord_id column to properties table';
    ELSE
        RAISE NOTICE 'landlord_id column already exists in properties table';
    END IF;
END $$;

-- Add landlord_id to property_units table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'property_units' 
        AND column_name = 'landlord_id'
    ) THEN
        ALTER TABLE public.property_units 
        ADD COLUMN landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_property_units_landlord_id 
        ON public.property_units(landlord_id);
        
        RAISE NOTICE 'Added landlord_id column to property_units table';
    ELSE
        RAISE NOTICE 'landlord_id column already exists in property_units table';
    END IF;
END $$;

-- Add landlord_id to property_blocks table (for building-level assignment)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'property_blocks' 
        AND column_name = 'landlord_id'
    ) THEN
        ALTER TABLE public.property_blocks 
        ADD COLUMN landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_property_blocks_landlord_id 
        ON public.property_blocks(landlord_id);
        
        RAISE NOTICE 'Added landlord_id column to property_blocks table';
    ELSE
        RAISE NOTICE 'landlord_id column already exists in property_blocks table';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Check if the columns were added successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('properties', 'property_units', 'property_blocks')
    AND column_name = 'landlord_id'
ORDER BY table_name;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('properties', 'property_units', 'property_blocks')
    AND indexname LIKE '%landlord_id%'
ORDER BY tablename;
