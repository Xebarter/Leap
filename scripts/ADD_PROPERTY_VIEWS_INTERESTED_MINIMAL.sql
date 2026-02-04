-- Minimal Property Views and Interested Tracking Schema
-- Run this if the full script has conflicts with existing policies

-- ============================================
-- 1. Property Views Table (Track every view)
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_property_views_viewer_id ON public.property_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_property_views_session_id ON public.property_views(session_id);

-- ============================================
-- 2. Property Interested Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_interested (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT,
  interested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'converted', 'not_interested')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'property_interested_property_id_user_id_key'
  ) THEN
    ALTER TABLE public.property_interested 
    ADD CONSTRAINT property_interested_property_id_user_id_key 
    UNIQUE(property_id, user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'property_interested_property_id_email_key'
  ) THEN
    ALTER TABLE public.property_interested 
    ADD CONSTRAINT property_interested_property_id_email_key 
    UNIQUE(property_id, email);
  END IF;
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_property_interested_property_id ON public.property_interested(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interested_user_id ON public.property_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interested_status ON public.property_interested(status);
CREATE INDEX IF NOT EXISTS idx_property_interested_at ON public.property_interested(interested_at);

-- ============================================
-- 3. Add daily views cache to properties table
-- ============================================
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS daily_views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interested_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_view_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS views_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 4. Function to update daily views count
-- ============================================
CREATE OR REPLACE FUNCTION update_property_daily_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.properties
  SET 
    daily_views_count = (
      SELECT COUNT(*)
      FROM public.property_views
      WHERE property_id = NEW.property_id
      AND viewed_at >= CURRENT_DATE
    ),
    total_views_count = COALESCE(total_views_count, 0) + 1,
    last_view_at = NEW.viewed_at,
    views_last_updated = NOW()
  WHERE id = NEW.property_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_daily_views ON public.property_views;
CREATE TRIGGER trigger_update_daily_views
  AFTER INSERT ON public.property_views
  FOR EACH ROW
  EXECUTE FUNCTION update_property_daily_views();

-- ============================================
-- 5. Function to update interested count
-- ============================================
CREATE OR REPLACE FUNCTION update_property_interested_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.properties
    SET interested_count = COALESCE(interested_count, 0) + 1
    WHERE id = NEW.property_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.properties
    SET interested_count = GREATEST(COALESCE(interested_count, 0) - 1, 0)
    WHERE id = OLD.property_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_interested_count ON public.property_interested;
CREATE TRIGGER trigger_update_interested_count
  AFTER INSERT OR DELETE ON public.property_interested
  FOR EACH ROW
  EXECUTE FUNCTION update_property_interested_count();

-- ============================================
-- 6. Enable RLS
-- ============================================
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interested ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies (with conflict handling)
-- ============================================

-- Property Views Policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can record property views" ON public.property_views;
  DROP POLICY IF EXISTS "Users can view their own views" ON public.property_views;
  DROP POLICY IF EXISTS "Admins can view all property views" ON public.property_views;
  
  -- Create policies
  CREATE POLICY "Anyone can record property views"
    ON public.property_views FOR INSERT TO public WITH CHECK (true);
    
  CREATE POLICY "Users can view their own views"
    ON public.property_views FOR SELECT TO authenticated 
    USING (viewer_id = auth.uid());
    
  CREATE POLICY "Admins can view all property views"
    ON public.property_views FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));
END $$;

-- Property Interested Policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can express interest in properties" ON public.property_interested;
  DROP POLICY IF EXISTS "Users can view their own interests" ON public.property_interested;
  DROP POLICY IF EXISTS "Users can update their own interests" ON public.property_interested;
  DROP POLICY IF EXISTS "Admins can view all interested users" ON public.property_interested;
  DROP POLICY IF EXISTS "Landlords can view interests for their properties" ON public.property_interested;
  
  -- Create policies
  CREATE POLICY "Anyone can express interest in properties"
    ON public.property_interested FOR INSERT TO public WITH CHECK (true);
    
  CREATE POLICY "Users can view their own interests"
    ON public.property_interested FOR SELECT TO authenticated 
    USING (user_id = auth.uid());
    
  CREATE POLICY "Users can update their own interests"
    ON public.property_interested FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());
    
  CREATE POLICY "Admins can view all interested users"
    ON public.property_interested FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));
    
  CREATE POLICY "Landlords can view interests for their properties"
    ON public.property_interested FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_interested.property_id
      AND properties.landlord_id = auth.uid()
    ));
END $$;

-- ============================================
-- 8. Grant permissions
-- ============================================
GRANT SELECT, INSERT ON public.property_views TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.property_interested TO authenticated;
GRANT INSERT ON public.property_views TO anon;
GRANT INSERT ON public.property_interested TO anon;

-- ============================================
-- DONE! 
-- ============================================
SELECT 'Property views and interested tracking setup complete!' as status;
