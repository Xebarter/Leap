-- ============================================================================
-- FIX PAYMENT TRANSACTIONS RLS POLICIES
-- ============================================================================
-- This script adds INSERT policies for payment_transactions table
-- The original schema only had SELECT policies which prevented creating transactions
-- ============================================================================

-- Add INSERT policy for tenants to create their own transactions
CREATE POLICY "Tenants can create their own transactions" ON public.payment_transactions
  FOR INSERT 
  WITH CHECK (auth.uid() = tenant_id);

-- Add INSERT policy for admins to create any transaction
CREATE POLICY "Admins can create all transactions" ON public.payment_transactions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add INSERT policy for property hosts to create transactions for their properties
CREATE POLICY "Property hosts can create transactions for their properties" ON public.payment_transactions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = payment_transactions.property_id 
      AND p.host_id = auth.uid()
    )
  );

-- Add UPDATE policy for updating transaction status
CREATE POLICY "System can update transaction status" ON public.payment_transactions
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✓ INSERT policies added for tenants, admins, and property hosts
-- ✓ UPDATE policy added for system operations (webhooks, etc.)
-- ============================================================================
