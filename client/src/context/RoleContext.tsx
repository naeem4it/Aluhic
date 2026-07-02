import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ViewAsRole = 
  | "super_admin"
  | "company_admin"
  | "pharma_company"
  | "hospital_admin"
  | "clinic_admin"
  | "doctor"
  | "doctor_frontdesk"
  | "front_desk"
  | "medical_rep"
  | "payroll_admin"
  | "nurse"
  | "senior_nurse"
  | "ward_manager"
  | "icu_coordinator"
  | "pharmacist"
  | "store_keeper"
  | "lab_technician"
  | "lab_supervisor"
  | "pathologist"
  | "billing_officer"
  | "insurance_coordinator"
  | "ot_technician"
  | "anesthetist"
  | "quality_officer"
  | "area_sales_manager"
  | "regional_sales_manager"
  | "zone_head"
  | "sales_analyst"
  | "hr_manager"
  | "payroll_officer"
  | "accounts_officer"
  | "finance_manager"
  | "system_admin"
  | "system_auditor"
  | "support_agent"
  | "compliance_officer"
  | "user";

export type OrganizationType = "pharma" | "hospital" | "clinic" | null;

interface RoleContextType {
  actualRole: string;
  viewingRole: ViewAsRole;
  organizationType: OrganizationType;
  isSuperAdmin: boolean;
  isViewingAs: boolean;
  setViewingRole: (role: ViewAsRole, orgType?: OrganizationType) => void;
  resetToActualRole: () => void;
  canAccess: (allowedRoles: ViewAsRole[]) => boolean;
  canAccessModule: (module: string) => boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  
  const actualRole = user?.role || "user";
  const isSuperAdmin = user?.isSuperAdmin || false;
  
  // Initialize viewing role - will be properly set once user data loads
  const [viewingRole, setViewingRoleState] = useState<ViewAsRole>("user");
  const [organizationType, setOrganizationType] = useState<OrganizationType>(null);
  const [isViewingAs, setIsViewingAs] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync viewing role with actual role when user changes (login/logout)
  // This ensures super admins always get super_admin role after auth loads
  useEffect(() => {
    if (!isLoading && user) {
      if (!isViewingAs || !isInitialized) {
        const newRole = isSuperAdmin ? "super_admin" : (actualRole as ViewAsRole);
        setViewingRoleState(newRole);
        setIsInitialized(true);
      }
    } else if (!isLoading && !user) {
      // Reset when logged out
      setViewingRoleState("user");
      setIsInitialized(false);
      setIsViewingAs(false);
    }
  }, [user, isLoading, actualRole, isSuperAdmin, isViewingAs, isInitialized]);

  const setViewingRole = useCallback((role: ViewAsRole, orgType?: OrganizationType) => {
    if (!isSuperAdmin) return;
    setViewingRoleState(role);
    setOrganizationType(orgType || null);
    setIsViewingAs(role !== "super_admin");
  }, [isSuperAdmin]);

  const resetToActualRole = useCallback(() => {
    // Super admins return to super_admin view, others return to their actual role
    const defaultRole = isSuperAdmin ? "super_admin" : (actualRole as ViewAsRole);
    setViewingRoleState(defaultRole);
    setOrganizationType(null);
    setIsViewingAs(false);
  }, [isSuperAdmin, actualRole]);

  const canAccess = useCallback((allowedRoles: ViewAsRole[]): boolean => {
    if (isSuperAdmin && !isViewingAs) return true;
    const roleToCheck = isViewingAs ? viewingRole : (actualRole as ViewAsRole);
    return allowedRoles.includes(roleToCheck);
  }, [isSuperAdmin, isViewingAs, viewingRole, actualRole]);

  const canAccessModule = useCallback((module: string): boolean => {
    if (isSuperAdmin && !isViewingAs) return true;
    
    const roleToCheck = isViewingAs ? viewingRole : (actualRole as ViewAsRole);
    
    const healthcareRoles: ViewAsRole[] = ["super_admin", "company_admin", "hospital_admin", "clinic_admin", "doctor", "doctor_frontdesk", "front_desk", "nurse", "senior_nurse", "ward_manager", "icu_coordinator", "ot_technician", "anesthetist"];
    const labRoles: ViewAsRole[] = ["super_admin", "lab_technician", "lab_supervisor", "pathologist", "quality_officer", "hospital_admin", "clinic_admin"];
    const pharmacyRoles: ViewAsRole[] = ["super_admin", "pharmacist", "store_keeper", "hospital_admin", "clinic_admin"];
    const billingRoles: ViewAsRole[] = ["super_admin", "billing_officer", "insurance_coordinator", "hospital_admin", "clinic_admin", "finance_manager", "accounts_officer"];
    const salesRoles: ViewAsRole[] = ["super_admin", "company_admin", "pharma_company", "medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "user"];
    const hrRoles: ViewAsRole[] = ["super_admin", "hr_manager", "payroll_officer", "payroll_admin", "company_admin", "hospital_admin", "clinic_admin"];
    const adminRoles: ViewAsRole[] = ["super_admin", "system_admin", "system_auditor", "support_agent", "compliance_officer"];
    
    const moduleAccess: Record<string, ViewAsRole[]> = {
      sales_tracker: salesRoles,
      healthcare_facilities: healthcareRoles,
      doctor_terminal: ["super_admin", "doctor", "anesthetist", "hospital_admin", "clinic_admin"],
      frontdesk_terminal: ["super_admin", "doctor_frontdesk", "front_desk", "hospital_admin", "clinic_admin"],
      test_terminal: [...labRoles, "doctor_frontdesk", "front_desk"],
      nursing_station: ["super_admin", "nurse", "senior_nurse", "ward_manager", "icu_coordinator", "hospital_admin", "clinic_admin"],
      pharmacy: pharmacyRoles,
      billing: billingRoles,
      ipd: ["super_admin", "ward_manager", "icu_coordinator", "nurse", "senior_nurse", "doctor", "hospital_admin", "clinic_admin"],
      opd: healthcareRoles,
      ot: ["super_admin", "ot_technician", "anesthetist", "doctor", "hospital_admin", "clinic_admin"],
      insurance: ["super_admin", "insurance_coordinator", "billing_officer", "hospital_admin", "clinic_admin"],
      mr_profiles: ["super_admin", "company_admin", "pharma_company", "area_sales_manager", "regional_sales_manager", "zone_head"],
      ai_insights: [...healthcareRoles, ...salesRoles, ...adminRoles],
      hr: hrRoles,
      payroll: hrRoles,
      accounts: billingRoles,
      settings: ["super_admin", "company_admin", "pharma_company", "hospital_admin", "clinic_admin", "system_admin"],
      super_admin: adminRoles,
      invitations: ["super_admin", "company_admin", "pharma_company", "hospital_admin", "clinic_admin", "hr_manager"],
    };
    
    const allowedRoles = moduleAccess[module] || [];
    return allowedRoles.includes(roleToCheck);
  }, [isSuperAdmin, isViewingAs, viewingRole, actualRole]);

  return (
    <RoleContext.Provider
      value={{
        actualRole,
        viewingRole: isViewingAs ? viewingRole : (isSuperAdmin ? "super_admin" : (actualRole as ViewAsRole)),
        organizationType,
        isSuperAdmin,
        isViewingAs,
        setViewingRole,
        resetToActualRole,
        canAccess,
        canAccessModule,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    // Return safe defaults when used outside RoleProvider (e.g., during HMR or before auth)
    return {
      actualRole: "user",
      viewingRole: "user" as ViewAsRole,
      organizationType: null as OrganizationType,
      isSuperAdmin: false,
      isViewingAs: false,
      setViewingRole: () => {},
      resetToActualRole: () => {},
      canAccess: () => false,
      canAccessModule: () => false,
    };
  }
  return context;
}
