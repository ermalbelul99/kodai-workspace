import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/AuthGuard";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { LanguageToggle } from "@/components/LanguageToggle";

const Landing = lazy(() => import('./pages/Landing'));
const AuthPage = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

const RouteSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="font-mono text-xs text-muted-foreground">Loading…</span>
    </div>
  </div>
);

const GlobalLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen">
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <GlobalLayout>
          <Suspense fallback={<RouteSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected: auth only */}
              <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />

              {/* Protected: auth + onboarding */}
              <Route path="/dashboard" element={<AuthGuard><OnboardingGuard><Dashboard /></OnboardingGuard></AuthGuard>} />
              <Route path="/workspace" element={<AuthGuard><OnboardingGuard><Workspace /></OnboardingGuard></AuthGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </GlobalLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
