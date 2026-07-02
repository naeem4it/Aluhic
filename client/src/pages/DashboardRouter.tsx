import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/context/RoleContext";
import SalesDashboard from "./SalesDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";
import DoctorDashboard from "./DoctorDashboard";
import FrontDeskDashboard from "./FrontDeskDashboard";
import HospitalAdminDashboard from "./HospitalAdminDashboard";
import PayrollAdminDashboard from "./PayrollAdminDashboard";
import NurseDashboard from "./NurseDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import LabTechnicianDashboard from "./LabTechnicianDashboard";
import BillingOfficerDashboard from "./BillingOfficerDashboard";
import InsuranceCoordinatorDashboard from "./InsuranceCoordinatorDashboard";
import WardManagerDashboard from "./WardManagerDashboard";
import HRDashboard from "./HRDashboard";
import AccountsDashboard from "./AccountsDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const { viewingRole, organizationType, isSuperAdmin, isViewingAs } = useRole();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const effectiveRole = isViewingAs ? viewingRole : (isSuperAdmin ? "super_admin" : user?.role);
  const effectiveOrgType = isViewingAs ? organizationType : null;
  
  const dashboardKey = `${effectiveRole}-${effectiveOrgType || "none"}-${isViewingAs}`;

  if (effectiveRole === "super_admin" && !isViewingAs) {
    return <SuperAdminDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "doctor" || effectiveRole === "anesthetist") {
    return <DoctorDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "doctor_frontdesk" || effectiveRole === "front_desk") {
    return <FrontDeskDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "nurse" || effectiveRole === "senior_nurse") {
    return <NurseDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "ward_manager" || effectiveRole === "icu_coordinator") {
    return <WardManagerDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "ot_technician") {
    return <WardManagerDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "pharmacist" || effectiveRole === "store_keeper") {
    return <PharmacistDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "lab_technician" || effectiveRole === "lab_supervisor" || effectiveRole === "pathologist" || effectiveRole === "quality_officer") {
    return <LabTechnicianDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "billing_officer") {
    return <BillingOfficerDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "insurance_coordinator") {
    return <InsuranceCoordinatorDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "hr_manager") {
    return <HRDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "payroll_admin" || effectiveRole === "payroll_officer") {
    return <PayrollAdminDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "accounts_officer" || effectiveRole === "finance_manager") {
    return <AccountsDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "hospital_admin" || effectiveRole === "clinic_admin") {
    return <HospitalAdminDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "company_admin") {
    if (effectiveOrgType === "hospital" || effectiveOrgType === "clinic") {
      return <HospitalAdminDashboard key={dashboardKey} />;
    }
    return <SalesDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "system_admin" || effectiveRole === "system_auditor" || effectiveRole === "support_agent" || effectiveRole === "compliance_officer") {
    return <SuperAdminDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "pharma_company") {
    return <SalesDashboard key={dashboardKey} />;
  }

  if (effectiveRole === "medical_rep" || effectiveRole === "area_sales_manager" || 
      effectiveRole === "regional_sales_manager" || effectiveRole === "zone_head" || 
      effectiveRole === "sales_analyst") {
    return <SalesDashboard key={dashboardKey} />;
  }

  return <SalesDashboard key={dashboardKey} />;
}
