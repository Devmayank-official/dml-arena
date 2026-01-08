import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineStatus } from './PWAInstallPrompt';

export function OfflineIndicator() {
  const isOnline = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/90 text-yellow-950 rounded-full shadow-lg">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-yellow-950 hover:bg-yellow-600/50"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
