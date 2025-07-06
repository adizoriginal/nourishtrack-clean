
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FoodDiary from "./pages/FoodDiary";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { useAuth } from "./contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/food-diary" element={<ProtectedRoute><FoodDiary /></ProtectedRoute>} />
                  <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
