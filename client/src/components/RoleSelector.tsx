import { useRole, ViewAsRole, OrganizationType } from "@/context/RoleContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, Building2, Hospital, Stethoscope, Users, User, UserCog, EyeOff,
  Pill, TestTube, CreditCard, Shield, Activity, ClipboardList, Briefcase,
  Settings, HeadphonesIcon, FileCheck, Server
} from "lucide-react";

interface RoleOption {
  role: ViewAsRole;
  orgType?: OrganizationType;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

const roleOptions: RoleOption[] = [
  { role: "super_admin", label: "Super Admin", icon: <UserCog className="h-4 w-4" />, description: "Full system access", category: "Admin" },
  { role: "company_admin", orgType: "pharma", label: "Company Admin (Pharma)", icon: <Building2 className="h-4 w-4" />, description: "Pharma company admin", category: "Admin" },
  { role: "company_admin", orgType: "hospital", label: "Company Admin (Hospital)", icon: <Hospital className="h-4 w-4" />, description: "Hospital company admin", category: "Admin" },
  
  { role: "hospital_admin", orgType: "hospital", label: "Hospital Admin", icon: <Hospital className="h-4 w-4" />, description: "Hospital administrator", category: "Healthcare Admin" },
  { role: "clinic_admin", orgType: "clinic", label: "Clinic Admin", icon: <Stethoscope className="h-4 w-4" />, description: "Clinic administrator", category: "Healthcare Admin" },
  
  { role: "doctor", label: "Doctor", icon: <User className="h-4 w-4" />, description: "Physician", category: "Clinical Staff" },
  { role: "anesthetist", label: "Anesthetist", icon: <User className="h-4 w-4" />, description: "Anesthesiologist", category: "Clinical Staff" },
  { role: "nurse", label: "Nurse", icon: <Activity className="h-4 w-4" />, description: "Nursing staff", category: "Clinical Staff" },
  { role: "senior_nurse", label: "Senior Nurse", icon: <Activity className="h-4 w-4" />, description: "Senior nursing staff", category: "Clinical Staff" },
  { role: "front_desk", label: "Front Desk", icon: <Users className="h-4 w-4" />, description: "Reception staff", category: "Clinical Staff" },
  { role: "ward_manager", label: "Ward Manager", icon: <ClipboardList className="h-4 w-4" />, description: "Ward management", category: "Clinical Staff" },
  { role: "icu_coordinator", label: "ICU Coordinator", icon: <Activity className="h-4 w-4" />, description: "ICU management", category: "Clinical Staff" },
  { role: "ot_technician", label: "OT Technician", icon: <Stethoscope className="h-4 w-4" />, description: "Operating theatre tech", category: "Clinical Staff" },
  
  { role: "pharmacist", label: "Pharmacist", icon: <Pill className="h-4 w-4" />, description: "Pharmacy staff", category: "Support Staff" },
  { role: "store_keeper", label: "Store Keeper", icon: <Pill className="h-4 w-4" />, description: "Store/inventory", category: "Support Staff" },
  { role: "lab_technician", label: "Lab Technician", icon: <TestTube className="h-4 w-4" />, description: "Lab tech", category: "Support Staff" },
  { role: "lab_supervisor", label: "Lab Supervisor", icon: <TestTube className="h-4 w-4" />, description: "Lab supervision", category: "Support Staff" },
  { role: "pathologist", label: "Pathologist", icon: <TestTube className="h-4 w-4" />, description: "Pathology specialist", category: "Support Staff" },
  { role: "quality_officer", label: "Quality Officer", icon: <FileCheck className="h-4 w-4" />, description: "Quality assurance", category: "Support Staff" },
  
  { role: "billing_officer", label: "Billing Officer", icon: <CreditCard className="h-4 w-4" />, description: "Billing management", category: "Finance" },
  { role: "insurance_coordinator", label: "Insurance Coordinator", icon: <Shield className="h-4 w-4" />, description: "Insurance claims", category: "Finance" },
  { role: "accounts_officer", label: "Accounts Officer", icon: <CreditCard className="h-4 w-4" />, description: "Accounts management", category: "Finance" },
  { role: "finance_manager", label: "Finance Manager", icon: <CreditCard className="h-4 w-4" />, description: "Finance oversight", category: "Finance" },
  { role: "payroll_officer", label: "Payroll Officer", icon: <CreditCard className="h-4 w-4" />, description: "Payroll processing", category: "Finance" },
  { role: "payroll_admin", label: "Payroll Admin", icon: <CreditCard className="h-4 w-4" />, description: "Payroll administration", category: "Finance" },
  
  { role: "pharma_company", orgType: "pharma", label: "Pharma Company", icon: <Building2 className="h-4 w-4" />, description: "Pharma admin", category: "Sales" },
  { role: "medical_rep", orgType: "pharma", label: "Medical Rep", icon: <Briefcase className="h-4 w-4" />, description: "Field MR", category: "Sales" },
  { role: "area_sales_manager", orgType: "pharma", label: "Area Sales Manager", icon: <Users className="h-4 w-4" />, description: "ASM", category: "Sales" },
  { role: "regional_sales_manager", orgType: "pharma", label: "Regional Sales Manager", icon: <Users className="h-4 w-4" />, description: "RSM", category: "Sales" },
  { role: "zone_head", orgType: "pharma", label: "Zone Head", icon: <Users className="h-4 w-4" />, description: "Zone management", category: "Sales" },
  { role: "sales_analyst", orgType: "pharma", label: "Sales Analyst", icon: <Users className="h-4 w-4" />, description: "Sales analytics", category: "Sales" },
  
  { role: "hr_manager", label: "HR Manager", icon: <Users className="h-4 w-4" />, description: "HR management", category: "HR/Payroll" },
  
  { role: "system_admin", label: "System Admin", icon: <Server className="h-4 w-4" />, description: "IT administration", category: "IT/Governance" },
  { role: "system_auditor", label: "System Auditor", icon: <FileCheck className="h-4 w-4" />, description: "Audit trails", category: "IT/Governance" },
  { role: "support_agent", label: "Support Agent", icon: <HeadphonesIcon className="h-4 w-4" />, description: "User support", category: "IT/Governance" },
  { role: "compliance_officer", label: "Compliance Officer", icon: <Shield className="h-4 w-4" />, description: "Compliance oversight", category: "IT/Governance" },
];

const groupedOptions = roleOptions.reduce((acc, option) => {
  const category = option.category;
  if (!acc[category]) acc[category] = [];
  acc[category].push(option);
  return acc;
}, {} as Record<string, RoleOption[]>);

export function RoleSelector() {
  const { isSuperAdmin, isViewingAs, viewingRole, organizationType, setViewingRole, resetToActualRole } = useRole();

  if (!isSuperAdmin) return null;

  const currentOption = roleOptions.find((opt) => 
    opt.role === viewingRole && 
    (opt.orgType === organizationType || (!opt.orgType && !organizationType))
  ) || roleOptions[0];

  const handleRoleSelect = (option: RoleOption) => {
    if (option.role === "super_admin") {
      resetToActualRole();
    } else {
      setViewingRole(option.role, option.orgType);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isViewingAs ? "default" : "outline"}
          size="sm"
          className="gap-2"
          data-testid="button-role-selector"
        >
          {isViewingAs ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">View As:</span>
          <Badge variant={isViewingAs ? "secondary" : "outline"} className="font-normal">
            {currentOption.label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto" data-testid="menu-role-selector">
        <DropdownMenuLabel>Select View Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(groupedOptions).map(([category, options]) => (
          <DropdownMenuSub key={category}>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <span>{category}</span>
              <Badge variant="outline" className="ml-auto text-xs">{options.length}</Badge>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 max-h-[300px] overflow-y-auto">
              {options.map((option, idx) => (
                <DropdownMenuItem
                  key={`${option.role}-${option.orgType || "none"}-${idx}`}
                  onClick={() => handleRoleSelect(option)}
                  className="flex items-center gap-3 py-2"
                  data-testid={`menu-item-role-${option.role}-${option.orgType || "none"}`}
                >
                  {option.icon}
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                  {viewingRole === option.role && 
                   (organizationType === option.orgType || (!option.orgType && !organizationType)) && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        {isViewingAs && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={resetToActualRole}
              className="text-destructive"
              data-testid="menu-item-reset-role"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Exit View Mode
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
