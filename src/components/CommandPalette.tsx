import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  History,
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  Pin,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useTourContext } from '@/contexts/TourContext';
import { useTheme } from '@/components/ThemeProvider';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  group: 'navigation' | 'actions' | 'settings';
  requiresPro?: boolean;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { canAccessCommunity } = useSubscription();
  const { startTour } = useTourContext();
  const { theme, setTheme } = useTheme();

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigationItems: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: Home,
      action: () => navigate('/chat'),
      shortcut: 'G H',
      group: 'navigation',
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: LayoutDashboard,
      action: () => navigate('/chat/dashboard'),
      shortcut: 'G D',
      group: 'navigation',
    },
    {
      id: 'insights',
      label: 'Go to Insights',
      icon: BarChart3,
      action: () => navigate('/chat/insights'),
      shortcut: 'G I',
      group: 'navigation',
    },
    {
      id: 'history',
      label: 'Go to History',
      icon: History,
      action: () => navigate('/chat/history'),
      shortcut: 'G R',
      group: 'navigation',
    },
    {
      id: 'community',
      label: 'Go to Community',
      icon: Users,
      action: () => navigate('/chat/community'),
      shortcut: 'G C',
      group: 'navigation',
      requiresPro: true,
    },
    {
      id: 'pinned',
      label: 'Go to Pinned',
      icon: Pin,
      action: () => navigate('/chat/pinned'),
      shortcut: 'G P',
      group: 'navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: Settings,
      action: () => navigate('/chat/settings'),
      shortcut: 'G S',
      group: 'navigation',
    },
    {
      id: 'pricing',
      label: 'View Pricing',
      icon: CreditCard,
      action: () => navigate('/pricing'),
      group: 'navigation',
    },
  ];

  const actionItems: CommandItem[] = [
    {
      id: 'new-comparison',
      label: 'New Comparison',
      icon: Sparkles,
      action: () => navigate('/chat'),
      shortcut: 'N',
      group: 'actions',
    },
    {
      id: 'help',
      label: 'Start Tour',
      icon: HelpCircle,
      action: () => startTour(),
      shortcut: '?',
      group: 'actions',
    },
  ];

  const settingsItems: CommandItem[] = [
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      shortcut: 'T',
      group: 'settings',
    },
  ];

  if (user) {
    settingsItems.push({
      id: 'sign-out',
      label: 'Sign Out',
      icon: LogOut,
      action: () => signOut(),
      group: 'settings',
    });
  }

  const filterItems = (items: CommandItem[]) => {
    return items.filter((item) => {
      if (item.requiresPro && !canAccessCommunity) return false;
      return true;
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {filterItems(navigationItems).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {filterItems(actionItems).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
