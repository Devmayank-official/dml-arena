import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Wifi, CloudOff, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineStatus } from './PWAInstallPrompt';
import { useState, useEffect } from 'react';
import { getOfflineCacheStats } from '@/hooks/useOfflineCache';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const isOnline = useOfflineStatus();
  const [cacheStats, setCacheStats] = useState({ itemCount: 0, totalSizeKB: 0 });
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Update cache stats periodically
    const updateStats = () => {
      setCacheStats(getOfflineCacheStats());
    };
    updateStats();
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Track when coming back online
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timeout = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/95 text-amber-950 rounded-full shadow-lg backdrop-blur-sm">
            <WifiOff className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">You're offline</span>
              {cacheStats.itemCount > 0 && (
                <span className="text-xs opacity-80">
                  {cacheStats.itemCount} cached items available
                </span>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-amber-950 hover:bg-amber-600/50"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Check connection and reload</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/95 text-white rounded-full shadow-lg backdrop-blur-sm">
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back online!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineCacheIndicator() {
  const [stats, setStats] = useState({ itemCount: 0, totalSizeKB: 0 });

  useEffect(() => {
    setStats(getOfflineCacheStats());
  }, []);

  if (stats.itemCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
            <Database className="h-3 w-3" />
            <span>{stats.itemCount} cached</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{stats.itemCount} items cached ({stats.totalSizeKB} KB)</p>
          <p className="text-xs text-muted-foreground">Available offline</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
