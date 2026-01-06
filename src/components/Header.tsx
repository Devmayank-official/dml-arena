import { Link } from 'react-router-dom';
import { Sparkles, Users, LogIn, Lock, Crown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { HelpButton } from '@/components/tour/HelpButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTourContext } from '@/contexts/TourContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  const { startTour } = useTourContext();
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const { canAccessCommunity, isPro, remainingQueries } = useSubscription();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/chat" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity min-w-0" data-tour="logo">
            <div className="relative shrink-0">
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full" />
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">CompareAI</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Multi-Model AI Comparison</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            {user && !isPro && (
              <span className="text-xs text-muted-foreground hidden md:block">
                {remainingQueries} queries left
              </span>
            )}
            {isPro && (
              <Badge variant="secondary" className="gap-1 hidden sm:flex">
                <Crown className="h-3 w-3 text-yellow-500" />
                Pro
              </Badge>
            )}
            <span className="text-xs text-muted-foreground hidden lg:block">
              7 AI Models • Real-time Comparison
            </span>
            
            {/* History Link */}
            <Link to="/chat/history">
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </Link>
            
            <ThemeToggle />
            <HelpButton onClick={startTour} />
            {canAccessCommunity ? (
              <Link to="/chat/community" data-tour="community">
                <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">Community</span>
                </Button>
              </Link>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 opacity-50">
                      <Lock className="h-4 w-4" />
                      <span className="hidden sm:inline">Community</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 hidden sm:inline-flex">
                        Pro
                      </Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade to Pro for Community access</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {!loading && (
              user ? (
                <ProfileDropdown user={user} onSignOut={handleSignOut} />
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-primary to-accent">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
