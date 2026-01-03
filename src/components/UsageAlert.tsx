import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Crown, Zap, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription, FREE_PLAN_LIMITS } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export function UsageAlert() {
  const navigate = useNavigate();
  const { subscription, isPro, remainingQueries, hasReachedLimit } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Determine alert level
  const usagePercentage = subscription 
    ? ((subscription.monthly_usage || 0) / FREE_PLAN_LIMITS.monthlyQueries) * 100 
    : 0;

  useEffect(() => {
    // Show warning when usage is 60% or more
    if (!isPro && usagePercentage >= 60 && !isDismissed) {
      setShowWarning(true);
    }
  }, [usagePercentage, isPro, isDismissed]);

  // Don't show for Pro users
  if (isPro) return null;

  // Don't show if dismissed or usage is low
  if (isDismissed || (!showWarning && !hasReachedLimit)) return null;

  const alertLevel = hasReachedLimit ? 'critical' : usagePercentage >= 80 ? 'warning' : 'info';

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
              {hasReachedLimit ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold">
                    {hasReachedLimit 
                      ? 'Monthly Limit Reached' 
                      : usagePercentage >= 80 
                        ? 'Running Low on Queries'
                        : 'Usage Update'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasReachedLimit
                      ? "You've used all your free queries this month. Upgrade to Pro for unlimited access."
                      : `You have ${remainingQueries} ${remainingQueries === 1 ? 'query' : 'queries'} remaining this month.`}
                  </p>
                </div>
                
                {!hasReachedLimit && (
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

              {/* Progress bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Monthly Usage</span>
                  <span className="font-medium">
                    {subscription?.monthly_usage || 0} / {FREE_PLAN_LIMITS.monthlyQueries}
                  </span>
                </div>
                <Progress 
                  value={Math.min(usagePercentage, 100)} 
                  className={`h-2 ${hasReachedLimit ? '[&>div]:bg-destructive' : usagePercentage >= 80 ? '[&>div]:bg-yellow-500' : ''}`}
                />
              </div>

              {/* Action */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
                {subscription?.usage_reset_at && (
                  <Badge variant="outline" className="text-xs">
                    Resets {new Date(subscription.usage_reset_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Toast-style alert for immediate feedback
export function UsageToast({ remainingAfter }: { remainingAfter: number }) {
  const navigate = useNavigate();

  if (remainingAfter > 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="p-4 rounded-xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${remainingAfter === 0 ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-500'}`}>
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {remainingAfter === 0 
                ? 'No queries remaining!'
                : `${remainingAfter} ${remainingAfter === 1 ? 'query' : 'queries'} left`}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="p-0 h-auto text-primary text-xs"
            >
              Upgrade for unlimited →
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
