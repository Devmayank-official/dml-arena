import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, History, Users, Settings, Lock } from 'lucide-react';
import { useSubscription } from '@/features/subscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPro?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/chat', icon: Home },
  { label: 'History', href: '/chat/history', icon: History },
  { label: 'Community', href: '/chat/community', icon: Users, requiresPro: true },
  { label: 'Settings', href: '/chat/settings', icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { canAccessCommunity } = useSubscription();
  const isMobile = useIsMobile();

  // Only show on mobile
  if (!isMobile) return null;

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const locked = item.requiresPro && !canAccessCommunity;
          const active = isActive(item.href);

          if (locked) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center flex-1 py-2 opacity-40"
              >
                <div className="relative">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] mt-1 text-muted-foreground">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 relative transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn('h-5 w-5 relative z-10', active && 'text-primary')} />
              </div>
              <span className={cn(
                'text-[10px] mt-1 relative z-10',
                active ? 'font-medium text-primary' : ''
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
