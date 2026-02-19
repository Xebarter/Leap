-- ============================================================================
-- COMPLETE PROPERTIES MANAGEMENT SCHEMA FOR SUPABASE
-- ============================================================================
-- This comprehensive schema handles ALL property management aspects:
-- - User profiles with role management
-- - Properties with detailed metadata
-- - Property blocks/buildings with multiple units
-- - Property images (categorized by area)
-- - Property details (room-specific information)
-- - Property units within blocks
-- - Bookings and reservations
-- - Storage configuration for media
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - User roles and authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'tenant' CHECK (role IN ('admin', 'tenant', 'landlord')),
  phone_number TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 2. PROPERTY BLOCKS TABLE - Buildings/Residential complexes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  total_floors INTEGER DEFAULT 1,
  total_units INTEGER DEFAULT 1,
  block_image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_blocks_location ON public.property_blocks(location);
CREATE INDEX IF NOT EXISTS idx_property_blocks_created_by ON public.property_blocks(created_by);

-- Enable RLS
ALTER TABLE public.property_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_blocks
CREATE POLICY "Property blocks are viewable by everyone" ON public.property_blocks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage property blocks" ON public.property_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 3. PROPERTIES TABLE - Main properties/rental units
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  
  -- Pricing
  price_ugx BIGINT NOT NULL,  -- Price in Ugandan Shillings (in cents for precision)
  price_per_night NUMERIC,    -- Alternative pricing (for short-term rentals)
  minimum_initial_months INTEGER DEFAULT 1,
  
  -- Media
  image_url TEXT,  -- Primary/featured image
  video_url TEXT,  -- Video walkthrough URL
  
  -- Property Details
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  category TEXT DEFAULT 'Apartment' CHECK (category IN (
    'Apartment', 'House', 'Townhouse', 'Studio', 'Bedsitter', 
    'Villa', 'Condo', 'Cottage', 'Other'
  )),
  amenities TEXT[],  -- Array of amenities (e.g., {'WiFi', 'AC', 'Pool'})
  
  -- Building Structure
  total_floors INTEGER DEFAULT 1,
  square_feet INTEGER,
  
  -- Multi-unit Properties
  block_id UUID REFERENCES public.property_blocks(id) ON DELETE SET NULL,
  units_config TEXT,  -- JSON configuration for units
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_block_id ON public.properties(block_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON public.properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(category);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Active properties are viewable by everyone" ON public.properties
  FOR SELECT USING (is_active = true OR auth.uid() IN (
    SELECT host_id FROM public.properties WHERE id = properties.id
  ));

CREATE POLICY "Property hosts can view their own properties" ON public.properties
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can insert properties if they are admins or landlords" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() = host_id AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (is_admin = true OR role = 'landlord')
      )
    )
  );

-- ============================================================================
-- 4. PROPERTY IMAGES TABLE - Categorized images for each property
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Image Details
  image_url TEXT NOT NULL,
  image_storage_path TEXT,  -- Path in Supabase storage bucket
  area TEXT DEFAULT 'Interior' CHECK (area IN (
    'Exterior', 'Interior', 'Kitchen', 'Bedroom', 'Bathroom', 
    'Living Room', 'Dining Room', 'Garden', 'Pool', 'Parking', 
    'Entrance', 'Balcony', 'Terrace', 'Other'
  )),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  file_size INTEGER,  -- Size in bytes
  mime_type TEXT DEFAULT 'image/jpeg',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_area ON public.property_images(area);
CREATE INDEX IF NOT EXISTS idx_property_images_is_primary ON public.property_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON public.property_images(display_order);

-- Enable RLS
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_images
CREATE POLICY "Anyone can view images of active properties" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_images.property_id AND properties.is_active = true
    )
  );

CREATE POLICY "Property hosts and admins can manage property images" ON public.property_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.profiles pf ON pf.id = auth.uid()
      WHERE p.id = property_images.property_id 
      AND (p.host_id = auth.uid() OR pf.is_admin = true)
    )
  );

-- ============================================================================
-- 5. PROPERTY DETAILS TABLE - Room-specific details
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Detail Information
  detail_name TEXT NOT NULL,  -- e.g., "Master Bedroom", "Kitchen"
  detail_type TEXT NOT NULL CHECK (detail_type IN (
    'Bedroom', 'Bathroom', 'Kitchen', 'Living Room', 'Dining Room', 
    'Balcony', 'Garden', 'Pool', 'Garage', 'Office', 'Gym', 
    'Laundry Room', 'Storage', 'Terrace', 'Entrance', 'Other'
  )),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_details_property_id ON public.property_details(property_id);
CREATE INDEX IF NOT EXISTS idx_property_details_detail_type ON public.property_details(detail_type);

-- Enable RLS
ALTER TABLE public.property_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_details
CREATE POLICY "Anyone can view details of active properties" ON public.property_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_details.property_id AND properties.is_active = true
    )
  );

CREATE POLICY "Property hosts and admins can manage property details" ON public.property_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.profiles pf ON pf.id = auth.uid()
      WHERE p.id = property_details.property_id 
      AND (p.host_id = auth.uid() OR pf.is_admin = true)
    )
  );

-- ============================================================================
-- 6. PROPERTY DETAIL IMAGES TABLE - Images for each property detail
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_detail_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_detail_id UUID REFERENCES public.property_details(id) ON DELETE CASCADE NOT NULL,
  
  -- Image Details
  image_url TEXT NOT NULL,
  image_storage_path TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  file_size INTEGER,
  mime_type TEXT DEFAULT 'image/jpeg',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_detail_images_detail_id ON public.property_detail_images(property_detail_id);
CREATE INDEX IF NOT EXISTS idx_property_detail_images_display_order ON public.property_detail_images(display_order);

-- Enable RLS
ALTER TABLE public.property_detail_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_detail_images
CREATE POLICY "Anyone can view images of active property details" ON public.property_detail_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.property_details pd
      JOIN public.properties p ON p.id = pd.property_id
      WHERE pd.id = property_detail_images.property_detail_id AND p.is_active = true
    )
  );

CREATE POLICY "Property hosts and admins can manage detail images" ON public.property_detail_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.property_details pd
      JOIN public.properties p ON p.id = pd.property_id
      JOIN public.profiles pf ON pf.id = auth.uid()
      WHERE pd.id = property_detail_images.property_detail_id 
      AND (p.host_id = auth.uid() OR pf.is_admin = true)
    )
  );

-- ============================================================================
-- 7. PROPERTY UNITS TABLE - Individual units within a property block
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  block_id UUID REFERENCES public.property_blocks(id) ON DELETE CASCADE NOT NULL,
  
  -- Unit Information
  floor_number INTEGER NOT NULL,
  unit_number TEXT NOT NULL,
  unit_type TEXT DEFAULT 'Standard' CHECK (unit_type IN (
    'Standard', 'Deluxe', 'Penthouse', 'Studio', 'Bedsitter', 'Other'
  )),
  
  -- Unit Details
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  square_feet INTEGER,
  
  -- Status
  is_available BOOLEAN DEFAULT TRUE,
  reserved_until DATE,  -- When the unit is reserved until
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_units_property_id ON public.property_units(property_id);
CREATE INDEX IF NOT EXISTS idx_property_units_block_id ON public.property_units(block_id);
CREATE INDEX IF NOT EXISTS idx_property_units_floor_number ON public.property_units(floor_number);
CREATE INDEX IF NOT EXISTS idx_property_units_is_available ON public.property_units(is_available);
CREATE INDEX IF NOT EXISTS idx_property_units_unit_number ON public.property_units(unit_number);

-- Enable RLS
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_units
CREATE POLICY "Units of active properties are viewable by everyone" ON public.property_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_units.property_id AND properties.is_active = true
    )
  );

CREATE POLICY "Property hosts and admins can manage units" ON public.property_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.profiles pf ON pf.id = auth.uid()
      WHERE p.id = property_units.property_id 
      AND (p.host_id = auth.uid() OR pf.is_admin = true)
    )
  );

-- ============================================================================
-- 8. BOOKINGS TABLE - Property reservations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.property_units(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Booking Details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price_ugx BIGINT NOT NULL,
  deposit_amount_ugx BIGINT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'active', 'completed', 'cancelled'
  )),
  
  -- Additional Info
  notes TEXT,
  number_of_guests INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_unit_id ON public.bookings(unit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON public.bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON public.bookings(check_out);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Tenants can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Property hosts can view bookings for their properties" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = bookings.property_id AND properties.host_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Tenants can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = tenant_id);

CREATE POLICY "Property hosts can update bookings for their properties" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = bookings.property_id AND properties.host_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 9. TRIGGER FUNCTIONS - Automatic data management
-- ============================================================================

-- Function to update properties' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_properties_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for properties table
CREATE TRIGGER trigger_update_properties_timestamp
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_properties_timestamp();

-- Function to update property_blocks' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_blocks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_blocks table
CREATE TRIGGER trigger_update_property_blocks_timestamp
  BEFORE UPDATE ON public.property_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_blocks_timestamp();

-- Function to update property_images' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_images_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_images table
CREATE TRIGGER trigger_update_property_images_timestamp
  BEFORE UPDATE ON public.property_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_images_timestamp();

-- Function to update property_details' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_details table
CREATE TRIGGER trigger_update_property_details_timestamp
  BEFORE UPDATE ON public.property_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_details_timestamp();

-- Function to update property_detail_images' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_detail_images_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_detail_images table
CREATE TRIGGER trigger_update_property_detail_images_timestamp
  BEFORE UPDATE ON public.property_detail_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_detail_images_timestamp();

-- Function to update property_units' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_units_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_units table
CREATE TRIGGER trigger_update_property_units_timestamp
  BEFORE UPDATE ON public.property_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_units_timestamp();

-- Function to update bookings' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_bookings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bookings table
CREATE TRIGGER trigger_update_bookings_timestamp
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bookings_timestamp();

-- Function to update profiles' updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER trigger_update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_timestamp();

-- Function to update block unit counts when units change
CREATE OR REPLACE FUNCTION public.update_block_unit_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.property_blocks
  SET 
    total_units = (
      SELECT COUNT(*) FROM public.property_units
      WHERE block_id = COALESCE(NEW.block_id, OLD.block_id)
    ),
    total_floors = (
      SELECT COALESCE(MAX(floor_number), 1) FROM public.property_units
      WHERE block_id = COALESCE(NEW.block_id, OLD.block_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.block_id, OLD.block_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update block counts when units change
CREATE TRIGGER trigger_update_block_unit_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.property_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_block_unit_counts();

-- Function to update property's primary image from property_images
CREATE OR REPLACE FUNCTION public.update_property_primary_image()
RETURNS TRIGGER AS $$
DECLARE
  primary_image_url TEXT;
BEGIN
  -- Get the primary image URL for the property
  SELECT image_url INTO primary_image_url
  FROM public.property_images
  WHERE property_id = NEW.property_id
  AND is_primary = TRUE
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no primary image was explicitly set, get the most recent image
  IF primary_image_url IS NULL THEN
    SELECT image_url INTO primary_image_url
    FROM public.property_images
    WHERE property_id = NEW.property_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Update the properties table with the primary image
  UPDATE public.properties
  SET image_url = primary_image_url, updated_at = NOW()
  WHERE id = NEW.property_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the primary image when property_images changes
CREATE TRIGGER trigger_update_property_primary_image
  AFTER INSERT OR UPDATE OR DELETE ON public.property_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_primary_image();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_admin, role, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false) THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
    END,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. STORAGE CONFIGURATION (OPTIONAL)
-- ============================================================================
-- Note: Storage buckets should be created via Supabase Dashboard first.
-- Run the policies below AFTER creating the 'property-images' bucket in the Storage section
-- of your Supabase dashboard.
-- 
-- To create the bucket:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name it "property-images"
-- 4. Make it PUBLIC
-- 5. Then run the policies below

-- Storage policies for property-images bucket
-- Uncomment and run these after creating the bucket:

-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-images') THEN
--     INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
--   END IF;
-- END $$;

-- Policy to allow public access to property images
-- CREATE POLICY "Public Access to Property Images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'property-images');

-- Policy to allow authenticated users to upload property images
-- CREATE POLICY "Authenticated Upload to Property Images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'property-images' 
--     AND auth.role() = 'authenticated'
--   );

-- Policy to allow users to delete their own property images
-- CREATE POLICY "User Delete of Own Property Images" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'property-images' 
--     AND auth.role() = 'authenticated'
--   );

-- ============================================================================
-- 11. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Properties with booking availability
CREATE OR REPLACE VIEW public.properties_with_availability AS
SELECT 
  p.*,
  (SELECT COUNT(*) FROM public.bookings 
   WHERE property_id = p.id AND status IN ('confirmed', 'active')) as active_bookings,
  (SELECT COUNT(*) FROM public.property_units 
   WHERE property_id = p.id AND is_available = true) as available_units
FROM public.properties p;

-- View: Property details with image counts
CREATE OR REPLACE VIEW public.property_details_summary AS
SELECT 
  pd.*,
  (SELECT COUNT(*) FROM public.property_detail_images 
   WHERE property_detail_id = pd.id) as image_count
FROM public.property_details pd;

-- View: Block units summary
CREATE OR REPLACE VIEW public.block_units_summary AS
SELECT 
  pb.id,
  pb.name,
  pb.location,
  pb.total_floors,
  pb.total_units,
  COUNT(DISTINCT pu.id) as actual_unit_count,
  SUM(CASE WHEN pu.is_available = true THEN 1 ELSE 0 END) as available_units
FROM public.property_blocks pb
LEFT JOIN public.property_units pu ON pb.id = pu.block_id
GROUP BY pb.id, pb.name, pb.location, pb.total_floors, pb.total_units;

-- ============================================================================
-- 12. GRANT PERMISSIONS
-- ============================================================================
-- Grant appropriate permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_properties_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_images_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_details_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_blocks_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_units_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_bookings_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profiles_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_block_unit_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_primary_image() TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.property_blocks TO authenticated;
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.property_images TO authenticated;
GRANT SELECT ON public.property_details TO authenticated;
GRANT SELECT ON public.property_detail_images TO authenticated;
GRANT SELECT ON public.property_units TO authenticated;
GRANT SELECT ON public.bookings TO authenticated;

-- Grant view permissions
GRANT SELECT ON public.properties_with_availability TO authenticated;
GRANT SELECT ON public.property_details_summary TO authenticated;
GRANT SELECT ON public.block_units_summary TO authenticated;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- This comprehensive schema provides:
-- ✓ User authentication and role management
-- ✓ Property information storage with metadata
-- ✓ Multi-unit property support via blocks and units
-- ✓ Categorized image management for properties and details
-- ✓ Room/detail-specific information
-- ✓ Booking and reservation system
-- ✓ Row Level Security (RLS) for data protection
-- ✓ Automatic timestamp and data integrity management
-- ✓ Optimized indexes for query performance
-- ✓ Ready-to-use views for common queries
-- ============================================================================
