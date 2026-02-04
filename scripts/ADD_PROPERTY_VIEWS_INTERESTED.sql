-- Property Views and Interested Tracking Schema
-- This adds functionality to track daily views and interested users for properties

-- ============================================
-- 1. Property Views Table (Track every view)
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous viewers
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT, -- For tracking anonymous users
  ip_address TEXT,
  user_agent TEXT,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL if user deletes account
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT,
  interested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'converted', 'not_interested')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate interests from same user
  UNIQUE(property_id, user_id),
  UNIQUE(property_id, email)
);

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
  -- Update the property's daily views count
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

-- Trigger to update views count on each new view
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
    -- Increment interested count
    UPDATE public.properties
    SET interested_count = COALESCE(interested_count, 0) + 1
    WHERE id = NEW.property_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement interested count
    UPDATE public.properties
    SET interested_count = GREATEST(COALESCE(interested_count, 0) - 1, 0)
    WHERE id = OLD.property_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update interested count
DROP TRIGGER IF EXISTS trigger_update_interested_count ON public.property_interested;
CREATE TRIGGER trigger_update_interested_count
  AFTER INSERT OR DELETE ON public.property_interested
  FOR EACH ROW
  EXECUTE FUNCTION update_property_interested_count();

-- ============================================
-- 6. Function to reset daily views at midnight
-- ============================================
CREATE OR REPLACE FUNCTION reset_daily_property_views()
RETURNS void AS $$
BEGIN
  UPDATE public.properties
  SET 
    daily_views_count = (
      SELECT COUNT(*)
      FROM public.property_views
      WHERE property_id = properties.id
      AND viewed_at >= CURRENT_DATE
    ),
    views_last_updated = NOW()
  WHERE views_last_updated < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interested ENABLE ROW LEVEL SECURITY;

-- Property Views Policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can record property views" ON public.property_views;
DROP POLICY IF EXISTS "Users can view their own views" ON public.property_views;
DROP POLICY IF EXISTS "Admins can view all property views" ON public.property_views;

-- Anyone can insert a view (public access)
CREATE POLICY "Anyone can record property views"
  ON public.property_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can see their own views
CREATE POLICY "Users can view their own views"
  ON public.property_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());

-- Admins can see all views
CREATE POLICY "Admins can view all property views"
  ON public.property_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Property Interested Policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can express interest in properties" ON public.property_interested;
DROP POLICY IF EXISTS "Users can view their own interests" ON public.property_interested;
DROP POLICY IF EXISTS "Users can update their own interests" ON public.property_interested;
DROP POLICY IF EXISTS "Admins can view all interested users" ON public.property_interested;
DROP POLICY IF EXISTS "Landlords can view interests for their properties" ON public.property_interested;

-- Anyone can express interest (public access for guest forms)
CREATE POLICY "Anyone can express interest in properties"
  ON public.property_interested
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own interests
CREATE POLICY "Users can view their own interests"
  ON public.property_interested
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own interests
CREATE POLICY "Users can update their own interests"
  ON public.property_interested
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all interested users
CREATE POLICY "Admins can view all interested users"
  ON public.property_interested
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Landlords can view interests for their properties
CREATE POLICY "Landlords can view interests for their properties"
  ON public.property_interested
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_interested.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

-- ============================================
-- 8. Helpful Views for Analytics
-- ============================================

-- View: Daily property stats
DROP VIEW IF EXISTS property_daily_stats CASCADE;
CREATE OR REPLACE VIEW property_daily_stats AS
SELECT 
  p.id as property_id,
  p.title,
  p.daily_views_count,
  p.total_views_count,
  p.interested_count,
  p.last_view_at,
  COUNT(DISTINCT pv.viewer_id) FILTER (WHERE pv.viewed_at >= CURRENT_DATE) as unique_viewers_today,
  COUNT(DISTINCT pv.session_id) FILTER (WHERE pv.viewed_at >= CURRENT_DATE) as unique_sessions_today
FROM public.properties p
LEFT JOIN public.property_views pv ON p.id = pv.property_id
GROUP BY p.id, p.title, p.daily_views_count, p.total_views_count, p.interested_count, p.last_view_at;

-- View: Property engagement summary
DROP VIEW IF EXISTS property_engagement_summary CASCADE;
CREATE OR REPLACE VIEW property_engagement_summary AS
SELECT 
  p.id as property_id,
  p.title,
  COALESCE(p.daily_views_count, 0) as views_today,
  COALESCE(p.total_views_count, 0) as total_views,
  COALESCE(p.interested_count, 0) as interested_users,
  COUNT(DISTINCT pv.viewer_id) as unique_viewers_all_time,
  MAX(pv.viewed_at) as last_viewed_at,
  COUNT(pi.id) FILTER (WHERE pi.status = 'active') as active_interests,
  COUNT(pi.id) FILTER (WHERE pi.status = 'contacted') as contacted_interests,
  COUNT(pi.id) FILTER (WHERE pi.status = 'converted') as converted_interests
FROM public.properties p
LEFT JOIN public.property_views pv ON p.id = pv.property_id
LEFT JOIN public.property_interested pi ON p.id = pi.property_id
GROUP BY p.id, p.title, p.daily_views_count, p.total_views_count, p.interested_count;

-- ============================================
-- 9. Comments
-- ============================================

COMMENT ON TABLE public.property_views IS 'Tracks every view of a property (for analytics)';
COMMENT ON TABLE public.property_interested IS 'Tracks users who express interest in a property';
COMMENT ON COLUMN public.properties.daily_views_count IS 'Number of views today (cached, resets daily)';
COMMENT ON COLUMN public.properties.total_views_count IS 'Total views all time';
COMMENT ON COLUMN public.properties.interested_count IS 'Number of users who expressed interest';

-- ============================================
-- 10. Grant permissions
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.property_views TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.property_interested TO authenticated;

-- Grant access to anonymous users (for public viewing)
GRANT INSERT ON public.property_views TO anon;
GRANT INSERT ON public.property_interested TO anon;

-- Grant view access
GRANT SELECT ON property_daily_stats TO authenticated;
GRANT SELECT ON property_engagement_summary TO authenticated;

-- ============================================
-- DONE! 
-- ============================================
-- Now you can:
-- 1. Track property views automatically
-- 2. Let users express interest
-- 3. See daily and total view counts
-- 4. See interested users count
-- 5. Use views for analytics and reporting
