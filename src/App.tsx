import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

import { ONBOARDING_SKIP_KEY } from "./lib/onboarding";
import { lazyPage } from "./lib/lazyPage";
import { PageMeta } from "./components/PageMeta";

// The landing page loads straight away; every other page is downloaded only when someone visits it.
import Index from "./pages/Index";
const AuthCallback = lazyPage(() => import("./pages/AuthCallback"));
const Auth = lazyPage(() => import("./pages/Auth"));
const Dashboard = lazyPage(() => import("./pages/Dashboard"));
const FoodDiary = lazyPage(() => import("./pages/FoodDiary"));
const Progress = lazyPage(() => import("./pages/Progress"));
const Profile = lazyPage(() => import("./pages/Profile"));
const Contact = lazyPage(() => import("./pages/Contact"));
const Privacy = lazyPage(() => import("./pages/Privacy"));
const Terms = lazyPage(() => import("./pages/Terms"));
const Onboarding = lazyPage(() => import("./pages/Onboarding"));
const NotFound = lazyPage(() => import("./pages/NotFound"));

const PageLoading = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
              <PageMeta />
              {/* Anonymous page-view counts in the Vercel dashboard (no cookies) */}
              <Analytics />
              <main className="flex-1">
                <Suspense fallback={<PageLoading />}>
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
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
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
