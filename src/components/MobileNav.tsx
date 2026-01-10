import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPro?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/chat', icon: Home },
  { label: 'Dashboard', href: '/chat/dashboard', icon: LayoutDashboard },
  { label: 'Insights', href: '/chat/insights', icon: BarChart3 },
  { label: 'History', href: '/chat/history', icon: History },
  { label: 'Community', href: '/chat/community', icon: Users, requiresPro: true },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { canAccessCommunity, isPro } = useSubscription();
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => location.pathname === href;

  // Handle swipe gesture to close menu
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -500) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Slide-out Menu with Swipe Gesture */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 md:hidden shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">AI</span>
                </div>
                <span className="font-semibold gradient-text">CompareAI</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Pro Badge */}
            {isPro && (
              <div className="px-4 py-2">
                <Badge variant="secondary" className="gap-1 w-full justify-center">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  Pro Member
                </Badge>
              </div>
            )}

            {/* Navigation Items */}
            <nav className="p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const locked = item.requiresPro && !canAccessCommunity;

                if (locked) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground opacity-50 cursor-not-allowed"
                    >
                      <Lock className="h-5 w-5" />
                      <span>{item.label}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5">
                        Pro
                      </Badge>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="active-nav"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Multi-Model AI Comparison
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
