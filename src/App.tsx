
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DemoProvider } from "@/contexts/DemoContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import CaseManagementPage from "./pages/CaseManagement";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import NotFound from "./pages/NotFound";
import ApiDocs from "./pages/ApiDocs";
import BulkAnalysis from "./pages/BulkAnalysis";
import AllRecords from "./pages/AllRecords";
import AuditLogs from "./pages/AuditLogs";
import WalletTransactionFlow from "./pages/WalletTransactionFlow";
import Safe, { SafeCheckPage } from "./pages/Safe";
import Health from "./pages/Health";
import HealthReportPage from "./pages/HealthReport";
import Methodology from "./pages/Methodology";
import SecurityPolicy from "./pages/SecurityPolicy";
import Terms from "./pages/Terms";

import { AuthPage } from "./components/auth/AuthPage";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/record/:recordId" element={<Index />} />
                <Route path="/wallets/:recordId/flow" element={<WalletTransactionFlow />} />
                <Route path="/cases" element={<CaseManagementPage />} />
                <Route path="/compliance" element={<ComplianceDashboard />} />
                <Route path="/all-records" element={<AllRecords />} />
                <Route path="/bulk-analysis" element={<BulkAnalysis />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/safe" element={<Safe />} />
                <Route path="/health" element={<Health />} />
                <Route path="/health/report/:id" element={<HealthReportPage />} />
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/security-policy" element={<SecurityPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/safe/check/:address" element={<SafeCheckPage />} />

                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
