-- ============================================================================
-- COMPREHENSIVE PAYMENTS MANAGEMENT SCHEMA FOR SUPABASE
-- ============================================================================
-- This schema handles all payment-related aspects:
-- - Invoices generation and tracking
-- - Payment transactions
-- - Payment methods and processing
-- - Receipts and proof of payment
-- - Payment reconciliation
-- - Financial reports and analytics
-- ============================================================================

-- ============================================================================
-- 1. PAYMENT METHODS TABLE - Store tenant's preferred payment methods
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Method Information
  method_type TEXT NOT NULL CHECK (method_type IN (
    'Bank Account', 'Mobile Money', 'Credit Card', 'Debit Card', 
    'Check', 'Cash', 'E-Wallet', 'Other'
  )),
  
  -- Bank Account Details (if applicable)
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  swift_code TEXT,
  iban TEXT,
  
  -- Mobile Money Details (if applicable)
  mobile_provider TEXT,  -- e.g., MTN, Airtel, Uganda Telecom
  mobile_number TEXT,
  
  -- Card Details (encrypted - don't store raw card numbers)
  card_last_four TEXT,
  card_expiry TEXT,
  card_holder_name TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'failed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON public.payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Tenants can view their own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all payment methods" ON public.payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Tenants can manage their own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = tenant_id);

-- ============================================================================
-- 2. INVOICES TABLE - Track all invoices issued
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  
  -- References
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Invoice Dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Financial Details
  subtotal_ugx BIGINT NOT NULL,
  tax_amount_ugx BIGINT DEFAULT 0,
  discount_amount_ugx BIGINT DEFAULT 0,
  total_amount_ugx BIGINT NOT NULL,
  amount_paid_ugx BIGINT DEFAULT 0,
  amount_balance_ugx BIGINT GENERATED ALWAYS AS (total_amount_ugx - amount_paid_ugx) STORED,
  
  -- Invoice Items (stored as JSON for flexibility)
  items JSONB,  -- Array of {description, quantity, unit_price_ugx, amount_ugx}
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'overdue', 'paid', 'partially_paid', 'cancelled', 'refunded'
  )),
  
  -- Notes
  invoice_notes TEXT,
  payment_terms TEXT,  -- e.g., "Net 30", "Due on receipt"
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON public.invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Tenants can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view invoices for their properties" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = invoices.property_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. PAYMENT TRANSACTIONS TABLE - Track all payment transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  
  -- References
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  
  -- Payment Details
  amount_paid_ugx BIGINT NOT NULL,
  currency TEXT DEFAULT 'UGX',
  payment_date TIMESTAMPTZ NOT NULL,
  
  -- Payment Method
  payment_method TEXT CHECK (payment_method IN (
    'Bank Transfer', 'Mobile Money', 'Credit Card', 'Debit Card',
    'Check', 'Cash', 'E-Wallet', 'Other'
  )),
  
  -- Provider Details (for third-party payments)
  provider TEXT,  -- e.g., 'Flutterwave', 'Pesapal', 'MTN Mobile Money'
  provider_transaction_id TEXT,
  provider_reference TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  )),
  
  -- Description
  description TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON public.payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON public.payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_date ON public.payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Tenants can view their own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view transactions for their properties" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.properties p ON p.id = b.property_id
      WHERE b.id = payment_transactions.booking_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. RECEIPTS TABLE - Track payment receipts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  
  -- References
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Receipt Details
  receipt_date TIMESTAMPTZ NOT NULL,
  amount_received_ugx BIGINT NOT NULL,
  payment_method TEXT,
  
  -- Cheque Details (if applicable)
  cheque_number TEXT,
  cheque_date DATE,
  cheque_bank TEXT,
  
  -- Receipt Status
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'cancelled', 'refunded')),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_payment_transaction_id ON public.receipts(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON public.receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON public.receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(receipt_number);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receipts
CREATE POLICY "Tenants can view their own receipts" ON public.receipts
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all receipts" ON public.receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 5. REFUNDS TABLE - Track refund transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  refund_id TEXT UNIQUE NOT NULL,
  
  -- References
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Refund Details
  refund_amount_ugx BIGINT NOT NULL,
  refund_date DATE NOT NULL,
  reason TEXT NOT NULL,
  
  -- Refund Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refunds_payment_transaction_id ON public.refunds(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant_id ON public.refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_date ON public.refunds(refund_date);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refunds
CREATE POLICY "Tenants can view their own refunds" ON public.refunds
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all refunds" ON public.refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 6. PAYMENT RECONCILIATION TABLE - Track reconciliation entries
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_reconciliations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  
  -- Reconciliation Details
  reconciliation_date DATE NOT NULL,
  bank_amount_ugx BIGINT,
  system_amount_ugx BIGINT,
  variance_ugx BIGINT GENERATED ALWAYS AS (bank_amount_ugx - system_amount_ugx) STORED,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'variance', 'resolved')),
  
  -- Notes
  notes TEXT,
  reconciled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_payment_transaction_id ON public.payment_reconciliations(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_invoice_id ON public.payment_reconciliations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_reconciliation_date ON public.payment_reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_status ON public.payment_reconciliations(status);

-- Enable RLS
ALTER TABLE public.payment_reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_reconciliations
CREATE POLICY "Admins can view reconciliations" ON public.payment_reconciliations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 7. PAYMENT SCHEDULES TABLE - Track recurring payment schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Schedule Information
  schedule_name TEXT NOT NULL,  -- e.g., "Monthly Rent"
  description TEXT,
  
  -- Amount Details
  amount_ugx BIGINT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Annually', 'One-time')),
  
  -- Date Information
  start_date DATE NOT NULL,
  end_date DATE,
  next_payment_date DATE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  auto_payment_enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_schedules_booking_id ON public.payment_schedules(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_tenant_id ON public.payment_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_property_id ON public.payment_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_is_active ON public.payment_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_next_payment_date ON public.payment_schedules(next_payment_date);

-- Enable RLS
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_schedules
CREATE POLICY "Tenants can view their own schedules" ON public.payment_schedules
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all schedules" ON public.payment_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 8. TRIGGER FUNCTIONS - Automatic management
-- ============================================================================

-- Function to update payment_methods timestamp
CREATE OR REPLACE FUNCTION public.update_payment_methods_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_timestamp
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_methods_timestamp();

-- Function to update invoices timestamp
CREATE OR REPLACE FUNCTION public.update_invoices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_timestamp
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoices_timestamp();

-- Function to update payment_transactions timestamp
CREATE OR REPLACE FUNCTION public.update_payment_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_transactions_timestamp
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_transactions_timestamp();

-- Function to update receipts timestamp
CREATE OR REPLACE FUNCTION public.update_receipts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receipts_timestamp
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipts_timestamp();

-- Function to update refunds timestamp
CREATE OR REPLACE FUNCTION public.update_refunds_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_refunds_timestamp
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_refunds_timestamp();

-- Function to update payment_reconciliations timestamp
CREATE OR REPLACE FUNCTION public.update_payment_reconciliations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_reconciliations_timestamp
  BEFORE UPDATE ON public.payment_reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_reconciliations_timestamp();

-- Function to update payment_schedules timestamp
CREATE OR REPLACE FUNCTION public.update_payment_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_schedules_timestamp
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_schedules_timestamp();

-- ============================================================================
-- 9. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Invoice Summary
DROP VIEW IF EXISTS public.invoice_summary;
CREATE VIEW public.invoice_summary AS
SELECT 
  i.id,
  i.invoice_number,
  i.tenant_id,
  i.property_id,
  i.booking_id,
  i.invoice_date,
  i.due_date,
  i.total_amount_ugx,
  i.amount_paid_ugx,
  i.amount_balance_ugx,
  i.status,
  COUNT(pt.id) as payment_count,
  MAX(pt.payment_date) as last_payment_date
FROM public.invoices i
LEFT JOIN public.payment_transactions pt ON i.id = pt.invoice_id
GROUP BY i.id, i.invoice_number, i.tenant_id, i.property_id, i.booking_id, 
         i.invoice_date, i.due_date, i.total_amount_ugx, i.amount_paid_ugx, 
         i.amount_balance_ugx, i.status;

-- View: Tenant Payment Summary
DROP VIEW IF EXISTS public.tenant_payment_summary;
CREATE VIEW public.tenant_payment_summary AS
SELECT 
  pt.tenant_id,
  COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_payments,
  COUNT(CASE WHEN pt.status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_payments,
  COALESCE(SUM(CASE WHEN pt.status = 'completed' THEN pt.amount_paid_ugx ELSE 0 END), 0) as total_paid_ugx,
  MAX(pt.payment_date) as last_payment_date
FROM public.payment_transactions pt
GROUP BY pt.tenant_id;

-- View: Overdue Invoices
DROP VIEW IF EXISTS public.overdue_invoices;
CREATE VIEW public.overdue_invoices AS
SELECT 
  i.id,
  i.invoice_number,
  i.tenant_id,
  i.property_id,
  i.due_date,
  i.total_amount_ugx,
  i.amount_balance_ugx,
  (CURRENT_DATE - i.due_date)::INTEGER as days_overdue,
  i.status
FROM public.invoices i
WHERE i.status IN ('overdue', 'partially_paid')
AND i.due_date < CURRENT_DATE;

-- View: Monthly Revenue Summary
DROP VIEW IF EXISTS public.monthly_revenue_summary;
CREATE VIEW public.monthly_revenue_summary AS
SELECT 
  DATE_TRUNC('month', pt.payment_date)::DATE as month,
  p.location as property_location,
  p.title as property_title,
  COUNT(pt.id) as transaction_count,
  COALESCE(SUM(pt.amount_paid_ugx), 0) as total_revenue_ugx
FROM public.payment_transactions pt
JOIN public.invoices i ON pt.invoice_id = i.id
JOIN public.properties p ON i.property_id = p.id
WHERE pt.status = 'completed'
GROUP BY DATE_TRUNC('month', pt.payment_date), p.location, p.title;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.update_payment_methods_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_invoices_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_transactions_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_receipts_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_refunds_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_reconciliations_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_schedules_timestamp() TO authenticated;

GRANT SELECT ON public.payment_methods TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT SELECT ON public.receipts TO authenticated;
GRANT SELECT ON public.refunds TO authenticated;
GRANT SELECT ON public.payment_reconciliations TO authenticated;
GRANT SELECT ON public.payment_schedules TO authenticated;

GRANT SELECT ON public.invoice_summary TO authenticated;
GRANT SELECT ON public.tenant_payment_summary TO authenticated;
GRANT SELECT ON public.overdue_invoices TO authenticated;
GRANT SELECT ON public.monthly_revenue_summary TO authenticated;

-- ============================================================================
-- PAYMENTS SCHEMA COMPLETE
-- ============================================================================
-- This comprehensive schema provides:
-- ✓ Payment method management (Bank, Mobile Money, Cards, etc.)
-- ✓ Invoice generation and tracking
-- ✓ Payment transaction processing
-- ✓ Receipt generation
-- ✓ Refund management
-- ✓ Payment reconciliation
-- ✓ Recurring payment schedules
-- ✓ Row Level Security (RLS) for data protection
-- ✓ Automatic timestamp management
-- ✓ Optimized indexes for query performance
-- ✓ Ready-to-use views for financial reports
-- ============================================================================
