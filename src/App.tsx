import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

import AuthCallback from "./pages/AuthCallback";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FoodDiary from "./pages/FoodDiary";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Onboarding, { ONBOARDING_SKIP_KEY } from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const skippedSetupThisSession = () => {
  try {
    return sessionStorage.getItem(ONBOARDING_SKIP_KEY) === "1";
  } catch {
    return false;
  }
};

// ✅ ProtectedRoute with spinner.
// With requireSetup, users who haven't finished setting up their profile are sent to /onboarding first.
const ProtectedRoute = ({ children, requireSetup = false }: { children: React.ReactNode; requireSetup?: boolean }) => {
  const { session, loading } = useAuth();
  const { profileComplete } = useAppContext();
  const waitingForProfile = requireSetup && !!session && profileComplete === null;

  if (loading || waitingForProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSetup && profileComplete === false && !skippedSetupThisSession()) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

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
                  <Route path="/auth/v1/callback" element={<AuthCallback />} />

                  {/* ✅ Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute requireSetup>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/food-diary"
                    element={
                      <ProtectedRoute requireSetup>
                        <FoodDiary />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/progress"
                    element={
                      <ProtectedRoute requireSetup>
                        <Progress />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <Onboarding />
                      </ProtectedRoute>
                    }
                  />
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
  // Trigger rebuild for Vercel
);

export default App;
