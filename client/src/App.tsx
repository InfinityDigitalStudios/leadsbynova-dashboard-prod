import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfigurationProvider } from "@/hooks/useConfiguration";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import SubmissionForm from "@/pages/submission-form";
import Chat from "@/pages/chat";
import Chat2 from "@/pages/chat2";
import Dashboard from "@/pages/dashboard";
import Configuration from "@/pages/configuration";
import ConfigurationForm from "@/pages/configuration-form";
import DashboardConfig from "@/pages/dashboard-config";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Guide from "@/pages/guide";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/guide" component={Guide} />
      <Route path="/submission-form" component={SubmissionForm} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat2" component={Chat2} />
      <Route path="/configuration">
        <ProtectedRoute>
          <Configuration />
        </ProtectedRoute>
      </Route>
      <Route path="/config">
        <ProtectedRoute>
          <DashboardConfig />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfigurationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ConfigurationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
