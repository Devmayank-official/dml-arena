import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TourProvider } from "@/contexts/TourContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { CommandPalette } from "@/components/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageSkeleton, LandingSkeleton } from "@/components/PageSkeleton";
import { logger } from "@/lib/logger";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { SkipToContent } from "@/components/a11y/SkipToContent";

// Lazy-loaded pages — each becomes its own chunk
const Landing = lazy(() => import("./pages/Landing"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const SharedResult = lazy(() => import("./pages/SharedResult"));
const Community = lazy(() => import("./pages/Community"));
const CommunityComparison = lazy(() => import("./pages/CommunityComparison"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const History = lazy(() => import("./pages/History"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Insights = lazy(() => import("./pages/Insights"));
const Install = lazy(() => import("./pages/Install"));
const Pinned = lazy(() => import("./pages/Pinned"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Initialize logger on app start
logger.info('user_action', 'Application initialized', { 
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
});

/** Wraps a page with route-level error boundary + suspense */
function RouteBoundary({ children, skeleton }: { children: React.ReactNode; skeleton?: React.ReactNode }) {
  return (
    <ErrorBoundary level="route">
      <Suspense fallback={skeleton ?? <PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { shortcuts, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts();
  
  return (
    <>
      <SkipToContent />
      <Routes>
        {/* Landing page - public */}
        <Route path="/" element={<RouteBoundary skeleton={<LandingSkeleton />}><Landing /></RouteBoundary>} />
        
        {/* Pricing page - public */}
        <Route path="/pricing" element={<RouteBoundary skeleton={<LandingSkeleton />}><Pricing /></RouteBoundary>} />
        
        {/* Auth page - public */}
        <Route path="/auth" element={<RouteBoundary><Auth /></RouteBoundary>} />
        
        {/* Protected routes under /chat */}
        <Route path="/chat" element={<RouteBoundary><ProtectedRoute><Index /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/community" element={<RouteBoundary><ProtectedRoute><Community /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/community/:id" element={<RouteBoundary><ProtectedRoute><CommunityComparison /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/profile/:userId" element={<RouteBoundary><ProtectedRoute><Profile /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/settings" element={<RouteBoundary><ProtectedRoute><Settings /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/history" element={<RouteBoundary><ProtectedRoute><History /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/dashboard" element={<RouteBoundary><ProtectedRoute><Dashboard /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/insights" element={<RouteBoundary><ProtectedRoute><Insights /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/pinned" element={<RouteBoundary><ProtectedRoute><Pinned /></ProtectedRoute></RouteBoundary>} />
        <Route path="/chat/leaderboard" element={<Navigate to="/chat/community" replace />} />
        <Route path="/chat/share/:code" element={<RouteBoundary><ProtectedRoute><SharedResult /></ProtectedRoute></RouteBoundary>} />
        
        {/* Install page - public */}
        <Route path="/install" element={<RouteBoundary><Install /></RouteBoundary>} />
        
        {/* Catch-all */}
        <Route path="*" element={<RouteBoundary><NotFound /></RouteBoundary>} />
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
          <ErrorBoundary level="root">
            <Toaster />
            <OfflineIndicator />
            <PWAInstallPrompt />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ErrorBoundary>
        </TourProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
