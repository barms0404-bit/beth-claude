import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StockDetail from "./pages/StockDetail";
import AnalystPage from "./pages/AnalystPage";
import CnbcNews from "./pages/CnbcNews";
import Performance from "./pages/Performance";
import ModelComparison from "./pages/ModelComparison";
import Backtesting from "./pages/Backtesting";
import Intelligence from "./pages/Intelligence";
import Team from "./pages/Team";
import OrgChart from "./pages/OrgChart";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/stock/:ticker"} component={StockDetail} />
      <Route path={"/analyst/:slug"} component={AnalystPage} />
      <Route path={"/cnbc"} component={CnbcNews} />
      <Route path={"/performance"} component={Performance} />
      <Route path={"/compare"} component={ModelComparison} />
      <Route path={"/backtesting"} component={Backtesting} />
      <Route path={"/intelligence"} component={Intelligence} />
      <Route path={"/team"} component={Team} />
      <Route path={"/org-chart"} component={OrgChart} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
