import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/AuthGuard";
import { LanguageToggle } from "@/components/LanguageToggle";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GlobalLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen">
    <div className="fixed top-3 right-3 z-[100]">
      <LanguageToggle />
    </div>
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthGuard>
          <GlobalLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workspace" element={<Workspace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalLayout>
        </AuthGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
