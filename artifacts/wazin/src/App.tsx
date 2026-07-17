import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Simulation from '@/pages/Simulation';
import Events from '@/pages/Events';
import AIAdvisor from '@/pages/AIAdvisor';
import Rewards from '@/pages/Rewards';
import Leaderboard from '@/pages/Leaderboard';
import Profile from '@/pages/Profile';
import Scenarios from '@/pages/Scenarios';
import PersonalityAnalysis from '@/pages/PersonalityAnalysis';
import FinancialTwin from '@/pages/FinancialTwin';
import Login from '@/pages/Login';
import Register from '@/pages/Register';


function AuthGate() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route>
          <Login />
        </Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/simulation" component={Simulation} />
        <Route path="/events" component={Events} />
        <Route path="/ai-advisor" component={AIAdvisor} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/scenarios" component={Scenarios} />
        <Route path="/personality" component={PersonalityAnalysis} />
        <Route path="/financial-twin" component={FinancialTwin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <AuthProvider>
                <AuthGate />
              </AuthProvider>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
