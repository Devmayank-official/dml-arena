import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SharedResult from "./pages/SharedResult";
import Community from "./pages/Community";
import CommunityComparison from "./pages/CommunityComparison";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to /chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          
          {/* Auth page - public */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes under /chat */}
          <Route path="/chat" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/chat/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/chat/community/:id" element={<ProtectedRoute><CommunityComparison /></ProtectedRoute>} />
          <Route path="/chat/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chat/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/chat/share/:code" element={<ProtectedRoute><SharedResult /></ProtectedRoute>} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
