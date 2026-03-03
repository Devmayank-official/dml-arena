import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  History,
  LayoutDashboard,
  BarChart3,
  Users,
  Lock,
  Crown,
  Settings,
  CreditCard,
  Pin,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { usePinnedResponses } from '@/hooks/usePinnedResponses';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPro?: boolean;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/chat', icon: Home },
  { label: 'Dashboard', href: '/chat/dashboard', icon: LayoutDashboard },
  { label: 'Insights', href: '/chat/insights', icon: BarChart3 },
  { label: 'History', href: '/chat/history', icon: History },
  { label: 'Community', href: '/chat/community', icon: Users, requiresPro: true },
];

const settingsNavItems: NavItem[] = [
  { label: 'Settings', href: '/chat/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { canAccessCommunity, isPro, remainingQueries } = useSubscription();
  const { user } = useAuth();
  const { pinnedCount } = usePinnedResponses();

  const isActive = (href: string) => location.pathname === href;

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const locked = item.requiresPro && !canAccessCommunity;

    if (locked) {
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton disabled className="opacity-50 cursor-not-allowed">
            <Lock className="h-4 w-4" />
            <span>{item.label}</span>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5">
              Pro
            </Badge>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive(item.href)}>
          <Link to={item.href}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-5 min-w-5 flex items-center justify-center">
                {item.badge}
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary-foreground">AI</span>
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm gradient-text">DML Arena</span>
            <span className="text-[10px] text-muted-foreground">Navigation</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
              {renderNavItem({ 
                label: 'Pinned', 
                href: '/chat/pinned', 
                icon: Pin, 
                badge: pinnedCount 
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map(renderNavItem)}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/pricing">
                    <CreditCard className="h-4 w-4" />
                    <span>Pricing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {isPro ? (
          <Badge variant="secondary" className="gap-1 w-full justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0">
            <Crown className="h-3 w-3 text-yellow-500" />
            <span className="group-data-[collapsible=icon]:hidden">Pro Member</span>
          </Badge>
        ) : user ? (
          <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
            {remainingQueries} queries left
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
