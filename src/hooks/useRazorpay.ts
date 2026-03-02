import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { logger } from '@/lib/logger';

export type BillingCycle = 'monthly' | 'yearly';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill: { email: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export const PRICING = {
  monthly: { amount: 1500, currency: 'INR', label: '₹1,500/mo', savings: null },
  yearly: { amount: 15300, currency: 'INR', label: '₹15,300/yr', savings: '15% off' },
} as const;

export const useRazorpay = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (
    billingCycle: BillingCycle,
    onSuccess?: () => void,
  ) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to upgrade', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('Loading payment gateway...');

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order via edge function
      setCurrentStep('Creating order...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ billing_cycle: billingCycle }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await response.json();
      setCurrentStep('Opening checkout...');

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AI Arena',
        description: orderData.description,
        order_id: orderData.orderId,
        handler: async (paymentResponse: RazorpayPaymentResponse) => {
          setCurrentStep('Verifying payment...');
          try {
            const verifyResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(paymentResponse),
              }
            );

            if (!verifyResponse.ok) {
              const errData = await verifyResponse.json();
              throw new Error(errData.error || 'Verification failed');
            }

            toast({
              title: '🎉 Welcome to Pro!',
              description: 'Your subscription is now active. Enjoy 1,000 credits/month!',
            });
            logger.logSubscription('Upgraded to Pro', billingCycle);
            onSuccess?.();
          } catch (err) {
            console.error('Payment verification error:', err);
            toast({
              title: 'Verification Issue',
              description: 'Payment received but verification pending. Please refresh.',
              variant: 'destructive',
            });
          } finally {
            setIsProcessing(false);
            setCurrentStep(null);
          }
        },
        prefill: { email: user.email || '' },
        theme: { color: '#00d4ff' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setCurrentStep(null);
            toast({ title: 'Payment cancelled', description: 'No charges were made.' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      setIsProcessing(false);
      setCurrentStep(null);
    }
  }, [user, toast, loadRazorpayScript]);

  const cancelSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cancellation failed');
      }

      toast({
        title: 'Subscription Cancelled',
        description: data.message,
      });

      return data;
    } catch (error) {
      console.error('Cancellation error:', error);
      toast({
        title: 'Cancellation Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  return {
    initiatePayment,
    cancelSubscription,
    isProcessing,
    currentStep,
    PRICING,
  };
};
