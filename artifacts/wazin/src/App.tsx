import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/contexts/LanguageContext';

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

const queryClient = new QueryClient();

function Router() {
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
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
