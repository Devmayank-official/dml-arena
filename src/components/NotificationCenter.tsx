import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap = {
  success: 'text-green-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-destructive',
};

function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = iconMap[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
        !notification.read && 'bg-primary/5'
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', colorMap[notification.type])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium', !notification.read && 'text-foreground')}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.description}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMarkRead(notification.id)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(notification.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onRemove={removeNotification}
                />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
