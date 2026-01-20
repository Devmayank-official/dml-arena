import { Pin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PinnedResponsesPanel } from '@/components/PinnedResponsesPanel';
import { usePinnedResponses } from '@/hooks/usePinnedResponses';

export default function Pinned() {
  const navigate = useNavigate();
  const { pinnedResponses, unpinResponse, clearAllPinned } = usePinnedResponses();

  const handleViewHistory = (historyId: string, historyType: 'comparison' | 'debate') => {
    navigate('/chat/history');
  };

  return (
    <AppLayout>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Pin className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Pinned Responses</h1>
          </div>

          <PinnedResponsesPanel
            pinnedResponses={pinnedResponses}
            onUnpin={unpinResponse}
            onClearAll={clearAllPinned}
            onViewHistory={handleViewHistory}
          />
        </motion.div>
      </main>
    </AppLayout>
  );
}
