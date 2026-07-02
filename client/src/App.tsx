import { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { RoleProvider } from "@/context/RoleContext";
import { ViewingAsIndicator } from "@/components/RoleGuard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import DashboardRouter from "@/pages/DashboardRouter";
import Entry from "@/pages/Entry";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Doctors from "@/pages/Doctors";
import Products from "@/pages/Products";
import CallKPI from "@/pages/CallKPI";
import Expenses from "@/pages/Expenses";
import DoctorVisits from "@/pages/DoctorVisits";
import HealthcareFacilities from "@/pages/HealthcareFacilities";
import FrontDeskTerminal from "@/pages/FrontDeskTerminal";
import FrontDeskAppointmentBooking from "@/pages/FrontDeskAppointmentBooking";
import DoctorFrontDeskTerminal from "@/pages/DoctorFrontDeskTerminal";
import DoctorTerminal from "@/pages/DoctorTerminal";
import TestTerminal from "@/pages/TestTerminal";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import SampleTracking from "@/pages/SampleTracking";
import VisitRequests from "@/pages/VisitRequests";
import SalesLeads from "@/pages/SalesLeads";
import MRProfiles from "@/pages/MRProfiles";
import PharmaCompanyManagement from "@/pages/PharmaCompanyManagement";
import MRPerformance from "@/pages/MRPerformance";
import AIInsights from "@/pages/AIInsights";
import SuperAdminManagement from "@/pages/SuperAdminManagement";
import EmployeeInvitations from "@/pages/EmployeeInvitations";
import AcceptInvitation from "@/pages/AcceptInvitation";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import Inventory from "@/pages/Inventory";
import DoctorPayroll from "@/pages/DoctorPayroll";
import DoctorExpenditures from "@/pages/DoctorExpenditures";
import HospitalDoctorsManagement from "@/pages/HospitalDoctorsManagement";
import DesignSystemLanding from "@/pages/DesignSystemLanding";
import PersonManagement from "@/pages/PersonManagement";
import QueueManagement from "@/pages/QueueManagement";
import AuditLogViewer from "@/pages/AuditLogViewer";
import HRDashboard from "@/pages/HRDashboard";
import PayrollDashboard from "@/pages/PayrollDashboard";
import AccountsDashboard from "@/pages/AccountsDashboard";
import OPDWorkflow from "@/pages/OPDWorkflow";
import PharmacyDispensing from "@/pages/PharmacyDispensing";
import BillingManagement from "@/pages/BillingManagement";
import IPDManagement from "@/pages/IPDManagement";
import OTManagement from "@/pages/OTManagement";
import FastOPDWorkflow from "@/pages/FastOPDWorkflow";
import InsuranceClaims from "@/pages/InsuranceClaims";
import MasterDataManagement from "@/pages/MasterDataManagement";
import PermissionManagement from "@/pages/admin/PermissionManagement";
import PharmaAnalytics from "@/pages/admin/PharmaAnalytics";
import MRAnalytics from "@/pages/admin/MRAnalytics";
import { useOfflineSync } from "@/hooks/useOfflineSync";

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={DesignSystemLanding} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/">
        {() => <ProtectedRoute component={DashboardRouter} />}
      </Route>
      <Route path="/entry">
        {() => <ProtectedRoute component={Entry} />}
      </Route>
      <Route path="/doctors">
        {() => <ProtectedRoute component={Doctors} />}
      </Route>
      <Route path="/products">
        {() => <ProtectedRoute component={Products} />}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute component={Analytics} />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={Reports} />}
      </Route>
      <Route path="/kpi">
        {() => <ProtectedRoute component={CallKPI} />}
      </Route>
      <Route path="/expenses">
        {() => <ProtectedRoute component={Expenses} />}
      </Route>
      <Route path="/visits">
        {() => <ProtectedRoute component={DoctorVisits} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/master-data">
        {() => <ProtectedRoute component={MasterDataManagement} />}
      </Route>
      <Route path="/healthcare/facilities">
        {() => <ProtectedRoute component={HealthcareFacilities} />}
      </Route>
      <Route path="/healthcare/frontdesk">
        {() => <ProtectedRoute component={FrontDeskTerminal} />}
      </Route>
      <Route path="/healthcare/frontdesk/booking">
        {() => <ProtectedRoute component={FrontDeskAppointmentBooking} />}
      </Route>
      <Route path="/healthcare/doctor-frontdesk">
        {() => <ProtectedRoute component={DoctorFrontDeskTerminal} />}
      </Route>
      <Route path="/healthcare/doctor-terminal">
        {() => <ProtectedRoute component={DoctorTerminal} />}
      </Route>
      <Route path="/healthcare/fast-opd">
        {() => <ProtectedRoute component={FastOPDWorkflow} />}
      </Route>
      <Route path="/healthcare/test-terminal">
        {() => <ProtectedRoute component={TestTerminal} />}
      </Route>
      <Route path="/admin/subscriptions">
        {() => <ProtectedRoute component={SubscriptionManagement} />}
      </Route>
      <Route path="/samples">
        {() => <ProtectedRoute component={SampleTracking} />}
      </Route>
      <Route path="/visit-requests">
        {() => <ProtectedRoute component={VisitRequests} />}
      </Route>
      <Route path="/sales-leads">
        {() => <ProtectedRoute component={SalesLeads} />}
      </Route>
      <Route path="/mr-profiles">
        {() => <ProtectedRoute component={MRProfiles} />}
      </Route>
      <Route path="/admin/pharma-companies">
        {() => <ProtectedRoute component={PharmaCompanyManagement} />}
      </Route>
      <Route path="/performance">
        {() => <ProtectedRoute component={MRPerformance} />}
      </Route>
      <Route path="/ai-insights">
        {() => <ProtectedRoute component={AIInsights} />}
      </Route>
      <Route path="/admin/super-admin">
        {() => <ProtectedRoute component={SuperAdminManagement} />}
      </Route>
      <Route path="/admin/permissions">
        {() => <ProtectedRoute component={PermissionManagement} />}
      </Route>
      <Route path="/admin/pharma-analytics">
        {() => <ProtectedRoute component={PharmaAnalytics} />}
      </Route>
      <Route path="/admin/mr-analytics">
        {() => <ProtectedRoute component={MRAnalytics} />}
      </Route>
      <Route path="/admin/invitations">
        {() => <ProtectedRoute component={EmployeeInvitations} />}
      </Route>
      <Route path="/accept-invitation">
        {() => <AcceptInvitation />}
      </Route>
      <Route path="/inventory">
        {() => <ProtectedRoute component={Inventory} />}
      </Route>
      <Route path="/healthcare/payroll">
        {() => <ProtectedRoute component={DoctorPayroll} />}
      </Route>
      <Route path="/healthcare/expenditures">
        {() => <ProtectedRoute component={DoctorExpenditures} />}
      </Route>
      <Route path="/healthcare/doctors-mgmt">
        {() => <ProtectedRoute component={HospitalDoctorsManagement} />}
      </Route>
      <Route path="/admin/person-master">
        {() => <ProtectedRoute component={PersonManagement} />}
      </Route>
      <Route path="/healthcare/queue">
        {() => <ProtectedRoute component={QueueManagement} />}
      </Route>
      <Route path="/admin/audit-logs">
        {() => <ProtectedRoute component={AuditLogViewer} />}
      </Route>
      <Route path="/hr">
        {() => <ProtectedRoute component={HRDashboard} />}
      </Route>
      <Route path="/payroll">
        {() => <ProtectedRoute component={PayrollDashboard} />}
      </Route>
      <Route path="/accounts">
        {() => <ProtectedRoute component={AccountsDashboard} />}
      </Route>
      <Route path="/healthcare/opd">
        {() => <ProtectedRoute component={OPDWorkflow} />}
      </Route>
      <Route path="/healthcare/pharmacy">
        {() => <ProtectedRoute component={PharmacyDispensing} />}
      </Route>
      <Route path="/healthcare/billing">
        {() => <ProtectedRoute component={BillingManagement} />}
      </Route>
      <Route path="/healthcare/ipd">
        {() => <ProtectedRoute component={IPDManagement} />}
      </Route>
      <Route path="/healthcare/ot">
        {() => <ProtectedRoute component={OTManagement} />}
      </Route>
      <Route path="/healthcare/insurance">
        {() => <ProtectedRoute component={InsuranceClaims} />}
      </Route>
    </Switch>
  );
}

function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Router />;
  }

  return (
    <RoleProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <AppHeader />
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 md:pb-6">
            <Router />
          </main>
          <MobileNav />
        </div>
        <ViewingAsIndicator />
      </SidebarProvider>
    </RoleProvider>
  );
}

function App() {
  useOfflineSync();
  
  // Force light mode on app initialization
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
