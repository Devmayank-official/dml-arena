import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  History,
  LayoutDashboard,
  BarChart3,
  Users,
  Lock,
  Crown,
  Settings,
  Pin,
  Sparkles,
  ChevronRight,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPro?: boolean;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/chat', icon: Home },
  { label: 'Dashboard', href: '/chat/dashboard', icon: LayoutDashboard },
  { label: 'Insights', href: '/chat/insights', icon: BarChart3 },
  { label: 'History', href: '/chat/history', icon: History },
  { label: 'Pinned', href: '/chat/pinned', icon: Pin },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Community', href: '/chat/community', icon: Users, requiresPro: true },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { canAccessCommunity, isPro, remainingQueries, rateLimits, planLimits } = useSubscription();
  const menuRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const menuOpacity = useTransform(dragX, [-300, 0], [0, 1]);

  const isActive = (href: string) => location.pathname === href;

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe gesture to close menu
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) {
      setIsOpen(false);
    }
    dragX.set(0);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const monthlyUsage = rateLimits?.perMonth?.usage ?? 0;
  const monthlyLimit = planLimits?.perMonth ?? 5;
  const usagePercentage = Math.min((monthlyUsage / monthlyLimit) * 100, 100);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const locked = item.requiresPro && !canAccessCommunity;

    if (locked) {
      return (
        <div
          key={item.href}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground/50 cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="font-medium">{item.label}</span>
            <p className="text-xs text-muted-foreground/50">Pro feature</p>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 opacity-50">
            <Crown className="h-2.5 w-2.5 mr-0.5 text-yellow-500" />
            Pro
          </Badge>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          isActive(item.href)
            ? 'bg-primary/10 shadow-sm'
            : 'hover:bg-muted/50 active:scale-[0.98]'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
          isActive(item.href)
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50'
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <span className={cn(
            'font-medium',
            isActive(item.href) && 'text-primary'
          )}>
            {item.label}
          </span>
        </div>
        {isActive(item.href) && (
          <motion.div
            layoutId="mobile-nav-active"
            className="w-1.5 h-8 rounded-full bg-primary"
          />
        )}
        {item.badge && (
          <Badge variant="secondary" className="text-[10px]">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger Button - Modern Design */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="relative h-10 w-10 rounded-xl bg-primary/80 hover:bg-primary flex items-center justify-center md:hidden transition-colors z-40"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <div className="flex flex-col gap-1.5">
          <motion.span 
            className="w-5 h-0.5 bg-primary-foreground rounded-full origin-center"
            animate={isOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
          />
          <motion.span 
            className="w-3.5 h-0.5 bg-primary-foreground rounded-full"
            animate={isOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
          />
          <motion.span 
            className="w-5 h-0.5 bg-primary-foreground rounded-full origin-center"
            animate={isOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
          />
        </div>
      </motion.button>

      {/* Menu + overlay are portaled to <body> to avoid being clipped by parents */}
      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Overlay with blur */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-md z-[100] md:hidden"
                onClick={() => setIsOpen(false)}
              />
            </AnimatePresence>

            {/* Modern Slide-out Menu */}
            <AnimatePresence>
              <motion.div
                ref={menuRef}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{ x: dragX }}
                drag="x"
                dragConstraints={{ left: -300, right: 0 }}
                dragElastic={0.05}
                onDragEnd={handleDragEnd}
                className="fixed inset-y-0 left-0 w-[85vw] max-w-[320px] z-[110] md:hidden"
              >
                <div className="h-full flex flex-col bg-card border-r border-border shadow-2xl rounded-r-3xl overflow-hidden">
                  {/* Header with gradient */}
                  <div className="relative px-5 pt-6 pb-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

                    <div className="relative flex items-center justify-between">
                      <Link to="/chat" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 blur-lg bg-primary/40 rounded-xl" />
                          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <Sparkles className="h-6 w-6 text-primary-foreground" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold gradient-text">CompareAI</h2>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            55+ AI Models
                          </p>
                        </div>
                      </Link>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* User Profile Section */}
                  {user && (
                    <div className="px-5 pb-4">
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-medium">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">
                              {user.user_metadata?.display_name || user.email?.split('@')[0]}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {isPro ? (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-[10px] px-1.5 py-0">
                                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                                  Pro
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Free
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Usage Bar */}
                        {!isPro && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Credits</span>
                              <span className="font-medium">{monthlyUsage}/{monthlyLimit}</span>
                            </div>
                            <Progress value={usagePercentage} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    {/* Main Navigation */}
                    <div className="space-y-1">
                      {mainNavItems.map(renderNavItem)}
                    </div>

                    <Separator className="my-4" />

                    {/* Secondary Navigation */}
                    <div className="space-y-1">
                      <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Features
                      </p>
                      {secondaryNavItems.map(renderNavItem)}
                    </div>

                    <Separator className="my-4" />

                    {/* Settings & Account */}
                    <div className="space-y-1">
                      <Link
                        to="/chat/settings"
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                          isActive('/chat/settings')
                            ? 'bg-primary/10'
                            : 'hover:bg-muted/50 active:scale-[0.98]'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          isActive('/chat/settings') ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                        )}>
                          <Settings className="h-5 w-5" />
                        </div>
                        <span className="font-medium">Settings</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </Link>

                      {!isPro && (
                        <Link
                          to="/pricing"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 hover:from-yellow-500/20 hover:to-amber-500/20 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">Upgrade to Pro</span>
                            <p className="text-xs text-muted-foreground">1000 credits/month</p>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Footer with Sign Out */}
                  {user && (
                    <div className="p-4 border-t border-border">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
