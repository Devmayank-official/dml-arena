import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Crown, Zap, ArrowUpRight, Clock, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription, FREE_PLAN_LIMITS, PRO_PLAN_LIMITS, RateLimitInfo } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface RateLimitBarProps {
  label: string;
  shortLabel: string;
  limit: RateLimitInfo | null;
  planLimit: number;
  isPro: boolean;
}

function RateLimitBar({ label, shortLabel, limit, planLimit, isPro }: RateLimitBarProps) {
  const usage = limit?.usage || 0;
  const percentage = (usage / planLimit) * 100;
  const isExceeded = limit?.exceeded || false;
  const remaining = limit?.remaining ?? (planLimit - usage);

  // Calculate time until reset
  const getResetTime = () => {
    if (!limit?.resetAt) return null;
    const resetTime = new Date(limit.resetAt);
    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'now';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffMinutes < 60) return `${diffMinutes}m`;
    return `${diffHours}h`;
  };

  const resetTime = getResetTime();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
          {resetTime && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              <Timer className="h-2.5 w-2.5 mr-0.5" />
              {resetTime}
            </Badge>
          )}
        </span>
        <span className={`font-medium ${isExceeded ? 'text-destructive' : ''}`}>
          {usage} / {planLimit}
        </span>
      </div>
      <Progress 
        value={Math.min(percentage, 100)} 
        className={`h-1.5 ${
          isExceeded 
            ? '[&>div]:bg-destructive' 
            : percentage >= 80 
              ? '[&>div]:bg-yellow-500' 
              : ''
        }`}
      />
    </div>
  );
}

export function UsageAlert() {
  const navigate = useNavigate();
  const { 
    subscription, 
    isPro, 
    rateLimits, 
    isRateLimited, 
    exceededLimit,
    planLimits,
    hasReachedLimit 
  } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Calculate overall usage percentage based on monthly limit
  const monthlyUsage = rateLimits.perMonth?.usage || subscription?.monthly_usage || 0;
  const monthlyLimit = planLimits.perMonth;
  const usagePercentage = (monthlyUsage / monthlyLimit) * 100;

  useEffect(() => {
    // Show warning when any limit is near (80%+) or exceeded
    const hasHighUsage = Object.entries(rateLimits).some(([key, limit]) => {
      if (!limit) return false;
      const planLimit = planLimits[key as keyof typeof planLimits];
      if (typeof planLimit !== 'number') return false;
      return (limit.usage / planLimit) >= 0.6;
    });

    if (!isPro && (hasHighUsage || isRateLimited) && !isDismissed) {
      setShowWarning(true);
    }
  }, [rateLimits, isPro, isDismissed, isRateLimited, planLimits]);

  // Don't show for Pro users
  if (isPro) return null;

  // Don't show if dismissed or no warning needed
  if (isDismissed || (!showWarning && !hasReachedLimit)) return null;

  const alertLevel = isRateLimited || hasReachedLimit ? 'critical' : usagePercentage >= 80 ? 'warning' : 'info';

  const alertStyles = {
    critical: 'from-destructive/20 to-destructive/10 border-destructive/50',
    warning: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/50',
    info: 'from-primary/20 to-primary/10 border-primary/50',
  };

  const iconStyles = {
    critical: 'text-destructive',
    warning: 'text-yellow-500',
    info: 'text-primary',
  };

  const getAlertTitle = () => {
    if (!isRateLimited && !hasReachedLimit) return 'Usage Update';
    
    switch (exceededLimit) {
      case 'perMinute':
        return 'Slow Down!';
      case 'perHour':
        return 'Hourly Limit Reached';
      case 'perDay':
        return 'Daily Limit Reached';
      case 'perMonth':
        return 'Monthly Limit Reached';
      default:
        return 'Rate Limit Reached';
    }
  };

  const getAlertMessage = () => {
    if (!isRateLimited && !hasReachedLimit) {
      return `You're approaching your usage limits. Consider upgrading to Pro.`;
    }
    
    switch (exceededLimit) {
      case 'perMinute':
        return "You're making requests too quickly. Wait a moment before trying again.";
      case 'perHour':
        return "You've used all your hourly credits. Try again soon or upgrade to Pro.";
      case 'perDay':
        return "You've used all your daily credits. They'll reset at midnight or upgrade now.";
      case 'perMonth':
        return "You've used all your monthly credits. Upgrade to Pro for 1000 credits/month.";
      default:
        return "You've reached your usage limit. Upgrade to Pro for more.";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="overflow-hidden"
      >
        <div className={`p-4 rounded-xl bg-gradient-to-r ${alertStyles[alertLevel]} border mb-4`}>
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`p-2 rounded-lg bg-background/50 ${iconStyles[alertLevel]}`}>
              {isRateLimited || hasReachedLimit ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold">{getAlertTitle()}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getAlertMessage()}
                  </p>
                </div>
                
                {!hasReachedLimit && !isRateLimited && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => setIsDismissed(true)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Multi-tier progress bars */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <RateLimitBar
                  label="Per Minute"
                  shortLabel="Min"
                  limit={rateLimits.perMinute}
                  planLimit={planLimits.perMinute}
                  isPro={isPro}
                />
                <RateLimitBar
                  label="Per Hour"
                  shortLabel="Hour"
                  limit={rateLimits.perHour}
                  planLimit={planLimits.perHour}
                  isPro={isPro}
                />
                <RateLimitBar
                  label="Per Day"
                  shortLabel="Day"
                  limit={rateLimits.perDay}
                  planLimit={planLimits.perDay}
                  isPro={isPro}
                />
                <RateLimitBar
                  label="Per Month"
                  shortLabel="Month"
                  limit={rateLimits.perMonth}
                  planLimit={planLimits.perMonth}
                  isPro={isPro}
                />
              </div>

              {/* Action */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pro: {PRO_PLAN_LIMITS.perMonth}/month
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Toast-style alert for immediate feedback
export function UsageToast({ 
  exceededWindow, 
  error 
}: { 
  exceededWindow?: string; 
  error?: string;
}) {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (exceededWindow) {
      case 'perMinute':
        return <Timer className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (exceededWindow) {
      case 'perMinute':
        return 'Too many requests';
      case 'perHour':
        return 'Hourly limit reached';
      case 'perDay':
        return 'Daily limit reached';
      case 'perMonth':
        return 'Monthly limit reached';
      default:
        return 'Limit reached';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="p-4 rounded-xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            exceededWindow === 'perMinute' 
              ? 'bg-yellow-500/20 text-yellow-500' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{getTitle()}</p>
            {error && (
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            )}
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="p-0 h-auto text-primary text-xs"
            >
              Upgrade for more →
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
