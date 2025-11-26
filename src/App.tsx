import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import LessonDetail from "./pages/LessonDetail";
import SkillMuse from "./pages/SkillMuse";
import SkillMuseLesson from "./pages/SkillMuseLesson";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import CreateSkill from "./pages/CreateSkill";
import SkillDetail from "./pages/SkillDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/skills/create" element={
              <ProtectedRoute>
                <CreateSkill />
              </ProtectedRoute>
            } />
            <Route path="/skills/:id" element={
              <ProtectedRoute>
                <SkillDetail />
              </ProtectedRoute>
            } />
            <Route path="/lessons/:id" element={
              <ProtectedRoute>
                <LessonDetail />
              </ProtectedRoute>
            } />
            <Route path="/skillmuse" element={
              <ProtectedRoute>
                <SkillMuse />
              </ProtectedRoute>
            } />
            <Route path="/skillmuse/:id" element={
              <ProtectedRoute>
                <SkillMuseLesson />
              </ProtectedRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
