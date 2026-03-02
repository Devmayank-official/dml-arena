import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2, Sparkles } from 'lucide-react';
import { useRazorpay, BillingCycle, PRICING } from '@/hooks/useRazorpay';
import { cn } from '@/lib/utils';

interface PaymentButtonProps {
  billingCycle?: BillingCycle;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showPrice?: boolean;
  children?: React.ReactNode;
}

export const PaymentButton = ({
  billingCycle = 'monthly',
  onSuccess,
  className,
  variant = 'default',
  size = 'default',
  showPrice = true,
  children,
}: PaymentButtonProps) => {
  const { initiatePayment, isProcessing, currentStep } = useRazorpay();
  const pricing = PRICING[billingCycle];

  const handleClick = () => {
    initiatePayment(billingCycle, onSuccess);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        onClick={handleClick}
        disabled={isProcessing}
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {currentStep || 'Processing...'}
          </>
        ) : (
          <>
            {children || (
              <>
                <Crown className="h-4 w-4" />
                Upgrade to Pro
                {showPrice && (
                  <span className="text-xs opacity-80">
                    {pricing.label}
                  </span>
                )}
              </>
            )}
          </>
        )}
      </Button>
      {pricing.savings && !isProcessing && (
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          {pricing.savings}
        </Badge>
      )}
    </div>
  );
};
