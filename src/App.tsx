import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TourProvider } from "@/contexts/TourContext";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

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
        <Route path="/chat/leaderboard" element={<Navigate to="/chat/community" replace />} />
        <Route path="/chat/share/:code" element={<ProtectedRoute><SharedResult /></ProtectedRoute>} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <KeyboardShortcutsModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        shortcuts={shortcuts} 
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TourProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TourProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
