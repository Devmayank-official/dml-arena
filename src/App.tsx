import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TourProvider } from "@/contexts/TourContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { CommandPalette } from "@/components/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { logger } from "@/lib/logger";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SharedResult from "./pages/SharedResult";
import Community from "./pages/Community";
import CommunityComparison from "./pages/CommunityComparison";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Install from "./pages/Install";
import Pinned from "./pages/Pinned";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

// Initialize logger on app start
logger.info('user_action', 'Application initialized', { 
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
});

function AppContent() {
  const { shortcuts, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts();
  
  return (
    <>
      <Routes>
        {/* Landing page - public */}
        <Route path="/" element={<Landing />} />
        
        {/* Pricing page - public */}
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Auth page - public */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes under /chat */}
        <Route path="/chat" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/chat/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/chat/community/:id" element={<ProtectedRoute><CommunityComparison /></ProtectedRoute>} />
        <Route path="/chat/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/chat/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/chat/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chat/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
        <Route path="/chat/pinned" element={<ProtectedRoute><Pinned /></ProtectedRoute>} />
        <Route path="/chat/leaderboard" element={<Navigate to="/chat/community" replace />} />
        <Route path="/chat/share/:code" element={<ProtectedRoute><SharedResult /></ProtectedRoute>} />
        
        {/* Install page - public */}
        <Route path="/install" element={<Install />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <KeyboardShortcutsModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        shortcuts={shortcuts} 
      />
      <CommandPalette />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <TourProvider>
          <Toaster />
          <OfflineIndicator />
          <PWAInstallPrompt />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TourProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
