-- ============================================================================
-- COMPREHENSIVE MAINTENANCE MANAGEMENT SCHEMA FOR SUPABASE
-- ============================================================================
-- This schema handles all maintenance and facility management aspects:
-- - Maintenance requests from tenants
-- - Work orders and task management
-- - Maintenance staff and assignments
-- - Asset and equipment tracking
-- - Preventive maintenance schedules
-- - Maintenance history and analytics
-- ============================================================================

-- ============================================================================
-- 1. MAINTENANCE STAFF TABLE - Track maintenance personnel
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Staff Information
  staff_name TEXT NOT NULL,
  staff_type TEXT NOT NULL CHECK (staff_type IN (
    'Plumber', 'Electrician', 'Carpenter', 'Painter', 'General Handyman',
    'HVAC Technician', 'Appliance Technician', 'Security Personnel', 'Cleaner', 'Other'
  )),
  specializations TEXT[],  -- Array of specializations
  
  -- Contact Information
  phone_number TEXT,
  email TEXT,
  home_address TEXT,
  
  -- Employment Status
  employment_status TEXT DEFAULT 'Active' CHECK (employment_status IN ('Active', 'Inactive', 'On Leave', 'Terminated')),
  employment_date DATE,
  termination_date DATE,
  
  -- Skills & Certifications
  certifications TEXT[],  -- Array of certification names
  hourly_rate_ugx BIGINT,
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_staff_user_id ON public.maintenance_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_staff_staff_type ON public.maintenance_staff(staff_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_staff_employment_status ON public.maintenance_staff(employment_status);

-- Enable RLS
ALTER TABLE public.maintenance_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_staff
CREATE POLICY "Maintenance staff can view their own profile" ON public.maintenance_staff
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all maintenance staff" ON public.maintenance_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage maintenance staff" ON public.maintenance_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 2. MAINTENANCE CATEGORIES TABLE - Types of maintenance work
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Category Information
  category_name TEXT NOT NULL UNIQUE,
  category_description TEXT,
  
  -- Category Details
  category_type TEXT CHECK (category_type IN ('Preventive', 'Corrective', 'Predictive', 'Routine')),
  estimated_duration_hours NUMERIC,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_categories_is_active ON public.maintenance_categories(is_active);

-- Enable RLS
ALTER TABLE public.maintenance_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_categories
CREATE POLICY "Anyone can view maintenance categories" ON public.maintenance_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.maintenance_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 3. MAINTENANCE REQUESTS TABLE - Tenant-initiated maintenance requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  
  -- References
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.maintenance_categories(id) ON DELETE SET NULL,
  
  -- Request Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Emergency')),
  
  -- Location
  location_in_property TEXT,  -- e.g., "Master Bedroom", "Kitchen"
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled', 'rejected'
  )),
  
  -- Dates
  request_date TIMESTAMPTZ NOT NULL,
  due_date DATE,
  started_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Attachments (array of URLs)
  attachments TEXT[],
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_booking_id ON public.maintenance_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_severity ON public.maintenance_requests(severity);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_request_date ON public.maintenance_requests(request_date);

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_requests
CREATE POLICY "Tenants can view their own requests" ON public.maintenance_requests
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all requests" ON public.maintenance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view requests for their properties" ON public.maintenance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = maintenance_requests.property_id 
      AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can create requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update their own requests" ON public.maintenance_requests
  FOR UPDATE USING (auth.uid() = tenant_id);

-- ============================================================================
-- 4. WORK ORDERS TABLE - Generated from maintenance requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_number TEXT UNIQUE NOT NULL,
  
  -- References
  maintenance_request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.maintenance_staff(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Work Order Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Emergency')),
  
  -- Estimated Details
  estimated_hours NUMERIC,
  estimated_cost_ugx BIGINT,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'
  )),
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE,
  started_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Actual Details
  actual_hours NUMERIC,
  actual_cost_ugx BIGINT,
  
  -- Notes & Sign-off
  notes TEXT,
  completion_notes TEXT,
  tenant_sign_off BOOLEAN DEFAULT FALSE,
  tenant_sign_off_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_maintenance_request_id ON public.work_orders(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_property_id ON public.work_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON public.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON public.work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON public.work_orders(due_date);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_orders
CREATE POLICY "Tenants can view work orders for their bookings" ON public.work_orders
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Maintenance staff can view assigned work orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_staff ms
      WHERE ms.id = work_orders.assigned_to 
      AND ms.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all work orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view work orders for their properties" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = work_orders.property_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. MAINTENANCE ASSETS/EQUIPMENT TABLE - Track property assets
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_tag TEXT UNIQUE NOT NULL,
  
  -- References
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Asset Information
  asset_name TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN (
    'HVAC', 'Plumbing', 'Electrical', 'Appliance', 'Door', 'Window',
    'Roof', 'Foundation', 'Generator', 'Water Tank', 'Solar Panel', 'Other'
  )),
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- Location in Property
  location_in_property TEXT,
  
  -- Age & Warranty
  purchase_date DATE,
  installation_date DATE,
  warranty_end_date DATE,
  expected_lifespan_years INTEGER,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'broken', 'retired')),
  last_maintenance_date DATE,
  
  -- Documentation
  documentation_url TEXT,  -- Link to manual/docs
  
  -- Cost Information
  purchase_cost_ugx BIGINT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_property_id ON public.maintenance_assets(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_status ON public.maintenance_assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_asset_type ON public.maintenance_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_last_maintenance_date ON public.maintenance_assets(last_maintenance_date);

-- Enable RLS
ALTER TABLE public.maintenance_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_assets
CREATE POLICY "Anyone can view assets of active properties" ON public.maintenance_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = maintenance_assets.property_id 
      AND properties.is_active = true
    )
  );

CREATE POLICY "Admins can manage assets" ON public.maintenance_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 6. PREVENTIVE MAINTENANCE SCHEDULE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.preventive_maintenance_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.maintenance_assets(id) ON DELETE SET NULL,
  
  -- Schedule Information
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT CHECK (task_type IN ('Inspection', 'Cleaning', 'Servicing', 'Replacement', 'Testing', 'Other')),
  
  -- Frequency
  frequency TEXT NOT NULL CHECK (frequency IN ('Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually', 'Custom')),
  custom_frequency_days INTEGER,
  
  -- Dates
  start_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Estimated Duration
  estimated_hours NUMERIC,
  
  -- Cost
  estimated_cost_ugx BIGINT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_property_id ON public.preventive_maintenance_schedule(property_id);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_asset_id ON public.preventive_maintenance_schedule(asset_id);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_next_due_date ON public.preventive_maintenance_schedule(next_due_date);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_is_active ON public.preventive_maintenance_schedule(is_active);

-- Enable RLS
ALTER TABLE public.preventive_maintenance_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preventive_maintenance_schedule
CREATE POLICY "Anyone can view schedules for active properties" ON public.preventive_maintenance_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = preventive_maintenance_schedule.property_id 
      AND properties.is_active = true
    )
  );

CREATE POLICY "Admins can manage schedules" ON public.preventive_maintenance_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 7. MAINTENANCE HISTORY TABLE - Track all maintenance activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.maintenance_assets(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES public.maintenance_staff(id) ON DELETE SET NULL,
  
  -- Maintenance Details
  maintenance_type TEXT CHECK (maintenance_type IN ('Preventive', 'Corrective', 'Predictive', 'Routine')),
  description TEXT NOT NULL,
  
  -- Work Details
  work_date DATE NOT NULL,
  duration_hours NUMERIC,
  cost_ugx BIGINT,
  
  -- Issues Found/Fixed
  issues_found TEXT,
  issues_fixed TEXT,
  
  -- Parts Used
  parts_used TEXT[],  -- Array of part names/descriptions
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_history_work_order_id ON public.maintenance_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_property_id ON public.maintenance_history(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_asset_id ON public.maintenance_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_performed_by ON public.maintenance_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_work_date ON public.maintenance_history(work_date);

-- Enable RLS
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_history
CREATE POLICY "Anyone can view history for active properties" ON public.maintenance_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = maintenance_history.property_id 
      AND properties.is_active = true
    )
  );

CREATE POLICY "Admins can manage history" ON public.maintenance_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 8. MAINTENANCE INVOICES TABLE - Invoices for maintenance work
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  
  -- References
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  maintenance_staff_id UUID REFERENCES public.maintenance_staff(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Invoice Details
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Financial Details
  labor_cost_ugx BIGINT,
  materials_cost_ugx BIGINT,
  other_cost_ugx BIGINT,
  subtotal_ugx BIGINT NOT NULL,
  tax_amount_ugx BIGINT DEFAULT 0,
  discount_amount_ugx BIGINT DEFAULT 0,
  total_amount_ugx BIGINT NOT NULL,
  amount_paid_ugx BIGINT DEFAULT 0,
  amount_balance_ugx BIGINT GENERATED ALWAYS AS (total_amount_ugx - amount_paid_ugx) STORED,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'overdue', 'paid', 'partially_paid', 'cancelled'
  )),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_invoices_work_order_id ON public.maintenance_invoices(work_order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_invoices_maintenance_staff_id ON public.maintenance_invoices(maintenance_staff_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_invoices_property_id ON public.maintenance_invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_invoices_status ON public.maintenance_invoices(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_invoices_due_date ON public.maintenance_invoices(due_date);

-- Enable RLS
ALTER TABLE public.maintenance_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_invoices
CREATE POLICY "Admins can view all maintenance invoices" ON public.maintenance_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view invoices for their properties" ON public.maintenance_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = maintenance_invoices.property_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. TRIGGER FUNCTIONS - Automatic management
-- ============================================================================

-- Function to update maintenance_staff timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_staff_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_staff_timestamp
  BEFORE UPDATE ON public.maintenance_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maintenance_staff_timestamp();

-- Function to update maintenance_categories timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_categories_timestamp
  BEFORE UPDATE ON public.maintenance_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maintenance_categories_timestamp();

-- Function to update maintenance_requests timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_requests_timestamp
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maintenance_requests_timestamp();

-- Function to update work_orders timestamp
CREATE OR REPLACE FUNCTION public.update_work_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_orders_timestamp
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_work_orders_timestamp();

-- Function to update maintenance_assets timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_assets_timestamp
  BEFORE UPDATE ON public.maintenance_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maintenance_assets_timestamp();

-- Function to update preventive_maintenance_schedule timestamp
CREATE OR REPLACE FUNCTION public.update_preventive_maintenance_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_preventive_maintenance_schedule_timestamp
  BEFORE UPDATE ON public.preventive_maintenance_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_preventive_maintenance_schedule_timestamp();

-- Function to update maintenance_history timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_history_timestamp
  BEFORE UPDATE ON public.maintenance_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maintenance_history_timestamp();

-- Function to update maintenance_invoices timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_invoices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_invoices_timestamp
  BEFORE UPDATE ON public.maintenance_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maintenance_invoices_timestamp();

-- ============================================================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Open Maintenance Requests
DROP VIEW IF EXISTS public.open_maintenance_requests;
CREATE VIEW public.open_maintenance_requests AS
SELECT 
  mr.id,
  mr.request_number,
  mr.tenant_id,
  mr.property_id,
  mr.title,
  mr.severity,
  mr.status,
  mr.request_date,
  mr.due_date,
  (CURRENT_DATE - mr.due_date)::INTEGER as days_overdue
FROM public.maintenance_requests mr
WHERE mr.status IN ('open', 'assigned', 'on_hold')
ORDER BY mr.severity DESC, mr.due_date ASC;

-- View: Pending Work Orders
DROP VIEW IF EXISTS public.pending_work_orders;
CREATE VIEW public.pending_work_orders AS
SELECT 
  wo.id,
  wo.work_order_number,
  wo.property_id,
  wo.assigned_to,
  wo.title,
  wo.priority,
  wo.status,
  wo.due_date,
  wo.estimated_cost_ugx,
  (CURRENT_DATE - wo.due_date)::INTEGER as days_overdue
FROM public.work_orders wo
WHERE wo.status IN ('open', 'assigned', 'in_progress')
ORDER BY wo.priority DESC, wo.due_date ASC;

-- View: Upcoming Preventive Maintenance
DROP VIEW IF EXISTS public.upcoming_preventive_maintenance;
CREATE VIEW public.upcoming_preventive_maintenance AS
SELECT 
  pm.id,
  pm.property_id,
  pm.task_name,
  pm.task_type,
  pm.frequency,
  pm.next_due_date,
  pm.estimated_hours,
  pm.estimated_cost_ugx,
  (pm.next_due_date - CURRENT_DATE)::INTEGER as days_until_due
FROM public.preventive_maintenance_schedule pm
WHERE pm.is_active = true
AND pm.next_due_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY pm.next_due_date ASC;

-- View: Maintenance Staff Performance
DROP VIEW IF EXISTS public.maintenance_staff_performance;
CREATE VIEW public.maintenance_staff_performance AS
SELECT 
  ms.id,
  ms.staff_name,
  ms.staff_type,
  COUNT(wo.id) as total_work_orders,
  COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_work_orders,
  AVG(wo.actual_hours) as avg_hours_per_job,
  SUM(wo.actual_cost_ugx) as total_work_cost_ugx,
  MAX(wo.completed_date) as last_job_completed
FROM public.maintenance_staff ms
LEFT JOIN public.work_orders wo ON ms.id = wo.assigned_to
GROUP BY ms.id, ms.staff_name, ms.staff_type;

-- View: Asset Maintenance Status
DROP VIEW IF EXISTS public.asset_maintenance_status;
CREATE VIEW public.asset_maintenance_status AS
SELECT 
  ma.id,
  ma.asset_tag,
  ma.asset_name,
  ma.asset_type,
  ma.property_id,
  ma.status,
  ma.last_maintenance_date,
  (CURRENT_DATE - ma.last_maintenance_date)::INTEGER as days_since_maintenance,
  ma.expected_lifespan_years,
  (CURRENT_DATE - ma.installation_date)::INTEGER / 365 as age_years
FROM public.maintenance_assets ma
ORDER BY ma.last_maintenance_date ASC;

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.update_maintenance_staff_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_categories_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_requests_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_work_orders_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_assets_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_preventive_maintenance_schedule_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_history_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_invoices_timestamp() TO authenticated;

GRANT SELECT ON public.maintenance_staff TO authenticated;
GRANT SELECT ON public.maintenance_categories TO authenticated;
GRANT SELECT ON public.maintenance_requests TO authenticated;
GRANT SELECT ON public.work_orders TO authenticated;
GRANT SELECT ON public.maintenance_assets TO authenticated;
GRANT SELECT ON public.preventive_maintenance_schedule TO authenticated;
GRANT SELECT ON public.maintenance_history TO authenticated;
GRANT SELECT ON public.maintenance_invoices TO authenticated;

GRANT SELECT ON public.open_maintenance_requests TO authenticated;
GRANT SELECT ON public.pending_work_orders TO authenticated;
GRANT SELECT ON public.upcoming_preventive_maintenance TO authenticated;
GRANT SELECT ON public.maintenance_staff_performance TO authenticated;
GRANT SELECT ON public.asset_maintenance_status TO authenticated;

-- ============================================================================
-- MAINTENANCE SCHEMA COMPLETE
-- ============================================================================
-- This comprehensive schema provides:
-- ✓ Maintenance staff management and tracking
-- ✓ Maintenance request creation and tracking
-- ✓ Work order generation and assignment
-- ✓ Asset and equipment tracking
-- ✓ Preventive maintenance scheduling
-- ✓ Maintenance history and documentation
-- ✓ Maintenance invoicing
-- ✓ Row Level Security (RLS) for data protection
-- ✓ Automatic timestamp management
-- ✓ Optimized indexes for query performance
-- ✓ Ready-to-use views for maintenance analytics
-- ============================================================================
