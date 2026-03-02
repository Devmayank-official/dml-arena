
-- Create payments table for tracking all Razorpay transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  billing_cycle TEXT, -- 'monthly' or 'yearly'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add Razorpay columns to subscriptions table
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update payments (via edge functions)
CREATE POLICY "Service role can manage payments"
  ON public.payments FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Update trigger for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
