import {
  LayoutDashboard,
  Plus,
  BarChart3,
  FileText,
  Settings,
  Users,
  Package,
  Phone,
  Banknote,
  MapPin,
  Building2,
  Stethoscope,
  Thermometer,
  Microscope,
  CreditCard,
  Calendar,
  CalendarPlus,
  TestTube,
  Target,
  UserCircle,
  TrendingUp,
  Brain,
  Shield,
  UserPlus,
  Boxes,
  Receipt,
  Wallet,
  ListOrdered,
  Clock,
  Calculator,
  BookOpen,
  Pill,
  ClipboardList,
  Scissors,
  ShieldCheck,
  BedDouble,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  group?: string;
  roles?: string[];
  useCases?: string[];
}

const HEALTHCARE_ROLES = [
  "doctor", "nurse", "senior_nurse", "ward_manager", "icu_coordinator", 
  "ot_technician", "anesthetist", "front_desk", "billing_officer", 
  "insurance_coordinator", "pharmacist", "store_keeper", "inventory_manager",
  "lab_technician", "lab_supervisor", "pathologist", "quality_officer"
];

const PHARMA_ROLES = [
  "medical_rep", "area_sales_manager", "regional_sales_manager", 
  "zone_head", "sales_analyst"
];

const HR_FINANCE_ROLES = [
  "hr_manager", "payroll_officer", "accounts_officer", "finance_manager"
];

const IT_GOVERNANCE_ROLES = [
  "system_auditor", "support_agent", "compliance_officer"
];

const ADMIN_ROLES = ["company_admin", "super_admin"];

const allMenuItems: NavItem[] = [
  { 
    path: "/", 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    group: "main", 
    roles: [...PHARMA_ROLES, ...HEALTHCARE_ROLES, ...HR_FINANCE_ROLES, ...ADMIN_ROLES, "user"],
    useCases: ["View role-specific KPIs", "Monitor pending tasks", "Track exceptions", "Navigate drill-downs"]
  },
  
  { 
    path: "/doctors", 
    label: "Doctors", 
    icon: Users, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["Add new doctor", "Update doctor details", "View doctor profile", "Categorize doctors", "Import doctor list"]
  },
  { 
    path: "/products", 
    label: "Products", 
    icon: Package, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["Add new product", "Update product price", "View product details", "Discontinue product", "Compare products"]
  },
  { 
    path: "/kpi", 
    label: "KPI", 
    icon: Phone, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["Set monthly targets", "View daily progress", "Review team KPI", "Export KPI report", "Track call quality"]
  },
  { 
    path: "/visits", 
    label: "Visits", 
    icon: MapPin, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "company_admin", "super_admin"],
    useCases: ["Log doctor visit", "Plan daily route", "View visit history", "Verify field activity", "Mark visit cancelled"]
  },
  { 
    path: "/expenses", 
    label: "Expenses", 
    icon: Banknote, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "company_admin", "super_admin"],
    useCases: ["Submit travel expense", "Approve expenses", "View expense status", "Bulk expense entry", "Expense report"]
  },
  { 
    path: "/reports", 
    label: "Reports", 
    icon: FileText, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["Generate sales report", "View territory analysis", "Compare period performance", "Doctor visit report", "Export to Excel"]
  },
  { 
    path: "/samples", 
    label: "Samples", 
    icon: TestTube, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "company_admin", "super_admin"],
    useCases: ["Record sample distribution", "Request sample stock", "View sample inventory", "Sample usage report", "Receive sample stock"]
  },
  { 
    path: "/visit-requests", 
    label: "Visit Requests", 
    icon: Calendar, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "doctor", "company_admin", "super_admin"],
    useCases: ["Request doctor meeting", "Respond to request", "Reschedule visit", "View scheduled visits", "Cancel appointment"]
  },
  { 
    path: "/sales-leads", 
    label: "Leads", 
    icon: Target, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["Capture new lead", "Follow up on lead", "Convert lead to sale", "View lead pipeline", "Lead analysis"]
  },
  { 
    path: "/mr-profiles", 
    label: "MR Profiles", 
    icon: UserCircle, 
    group: "sales", 
    roles: ["area_sales_manager", "regional_sales_manager", "zone_head", "company_admin", "super_admin"],
    useCases: ["Add new MR", "Update territory assignment", "View MR dashboard", "Deactivate MR", "MR training records"]
  },
  { 
    path: "/performance", 
    label: "Performance", 
    icon: TrendingUp, 
    group: "sales", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["View my performance", "Team performance review", "Set performance goals", "Performance trend analysis", "Export performance data"]
  },
  { 
    path: "/analytics", 
    label: "Analytics", 
    icon: BarChart3, 
    group: "analytics", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst", "company_admin", "super_admin"],
    useCases: ["View sales trends", "Quarterly comparison", "Product distribution", "Performance summary"]
  },
  { 
    path: "/ai-insights", 
    label: "AI Insights", 
    icon: Brain, 
    group: "analytics", 
    roles: [...PHARMA_ROLES, "doctor", "front_desk", "lab_supervisor", "pharmacist", "company_admin", "super_admin"],
    useCases: ["Get visit recommendations", "Product opportunity analysis", "Doctor potential scoring", "Predict sales trend", "Coverage gap analysis"]
  },
  { 
    path: "/admin/pharma-analytics", 
    label: "Pharma Analytics", 
    icon: TrendingUp, 
    group: "analytics", 
    roles: ["company_admin", "super_admin"],
    useCases: ["Cross-org prescription analytics", "Product sales performance", "Market share analysis", "Prescription trends"]
  },
  { 
    path: "/admin/mr-analytics", 
    label: "MR Analytics", 
    icon: TrendingUp, 
    group: "analytics", 
    roles: ["user", "medical_rep", "company_admin", "super_admin"],
    useCases: ["Doctor visit analytics", "Sales performance", "MR KPIs", "Conversion rates"]
  },
  
  { 
    path: "/inventory", 
    label: "Inventory", 
    icon: Boxes, 
    group: "inventory", 
    roles: ["medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "pharmacist", "store_keeper", "inventory_manager", "company_admin", "super_admin"],
    useCases: ["Check stock availability", "View low stock alerts", "Stock transfer request", "Expiry management", "Inventory valuation"]
  },
  { 
    path: "/healthcare/facilities", 
    label: "Facilities", 
    icon: Building2, 
    group: "healthcare", 
    roles: [...HEALTHCARE_ROLES, ...PHARMA_ROLES, "company_admin", "super_admin"],
    useCases: ["Add new facility", "Update facility details", "View facility dashboard", "Add department", "Facility comparison"]
  },
  { 
    path: "/healthcare/frontdesk", 
    label: "Front Desk", 
    icon: BarChart3, 
    group: "healthcare", 
    roles: ["front_desk", "billing_officer", "company_admin", "super_admin"],
    useCases: ["Register new patient", "Check-in existing patient", "Schedule appointment", "Add to doctor queue", "Collect payment", "Walk-in patient"]
  },
  { 
    path: "/healthcare/frontdesk/booking", 
    label: "Book Appointment", 
    icon: CalendarPlus, 
    group: "healthcare", 
    roles: ["front_desk", "billing_officer", "company_admin", "super_admin"],
    useCases: ["Book new appointment", "Walk-in patient registration", "Collect consultation fee", "Add to queue"]
  },
  { 
    path: "/healthcare/doctor-frontdesk", 
    label: "Doc Desk", 
    icon: Thermometer, 
    group: "healthcare", 
    roles: ["front_desk", "nurse", "company_admin", "super_admin"],
    useCases: ["Assist with doctor scheduling", "Manage patient flow", "Coordinate consultations"]
  },
  { 
    path: "/healthcare/doctor-terminal", 
    label: "Doctor", 
    icon: Stethoscope, 
    group: "healthcare", 
    roles: ["doctor", "anesthetist", "company_admin", "super_admin"],
    useCases: ["Start consultation", "Record vitals", "Document symptoms", "Write prescription", "Order lab tests", "Complete consultation", "Refer to specialist"]
  },
  { 
    path: "/healthcare/test-terminal", 
    label: "Tests", 
    icon: Microscope, 
    group: "healthcare", 
    roles: ["lab_technician", "lab_supervisor", "pathologist", "quality_officer", "front_desk", "company_admin", "super_admin"],
    useCases: ["View pending tests", "Collect sample", "Enter test results", "Verify results", "Print lab report", "Upload external report"]
  },
  { 
    path: "/healthcare/queue", 
    label: "Queue", 
    icon: ListOrdered, 
    group: "healthcare", 
    roles: ["front_desk", "nurse", "doctor", "lab_technician", "pharmacist", "company_admin", "super_admin"],
    useCases: ["Create queue", "Call next patient", "View queue status", "Skip patient", "Priority queue", "Transfer queue"]
  },
  { 
    path: "/healthcare/opd", 
    label: "OPD", 
    icon: ClipboardList, 
    group: "healthcare", 
    roles: ["front_desk", "nurse", "senior_nurse", "doctor", "company_admin", "super_admin"],
    useCases: ["View OPD dashboard", "Track patient status", "Complete OPD visit", "OPD analytics", "Follow-up reminder"]
  },
  { 
    path: "/healthcare/pharmacy", 
    label: "Pharmacy", 
    icon: Pill, 
    group: "healthcare", 
    roles: ["pharmacist", "store_keeper", "company_admin", "super_admin"],
    useCases: ["Dispense prescription", "Check drug interactions", "Substitute medicine", "Pharmacy inventory", "Return medicine", "Controlled drug dispensing"]
  },
  { 
    path: "/healthcare/billing", 
    label: "Billing", 
    icon: Receipt, 
    group: "healthcare", 
    roles: ["front_desk", "billing_officer", "company_admin", "super_admin"],
    useCases: ["Generate patient bill", "Apply discount", "Collect payment", "Partial payment", "Insurance billing", "Refund processing", "Bill inquiry"]
  },
  { 
    path: "/healthcare/ipd", 
    label: "IPD", 
    icon: BedDouble, 
    group: "healthcare", 
    roles: ["front_desk", "nurse", "senior_nurse", "ward_manager", "icu_coordinator", "doctor", "company_admin", "super_admin"],
    useCases: ["Admit patient", "Bed assignment", "Daily rounds", "Transfer ward", "Discharge planning", "Bed management dashboard", "Nurse handover"]
  },
  { 
    path: "/healthcare/ot", 
    label: "Operating Theatre", 
    icon: Scissors, 
    group: "healthcare", 
    roles: ["doctor", "anesthetist", "ot_technician", "nurse", "senior_nurse", "company_admin", "super_admin"],
    useCases: ["Schedule surgery", "Pre-operative assessment", "OT preparation", "Surgery case management", "Post-operative notes", "OT utilization report", "Emergency surgery"]
  },
  { 
    path: "/healthcare/insurance", 
    label: "Insurance", 
    icon: ShieldCheck, 
    group: "healthcare", 
    roles: ["front_desk", "billing_officer", "insurance_coordinator", "company_admin", "super_admin"],
    useCases: ["Verify insurance", "Pre-authorization request", "Submit claim", "Track claim status", "Handle claim rejection", "Insurance settlement", "Patient co-pay collection"]
  },
  { 
    path: "/healthcare/payroll", 
    label: "Healthcare Payroll", 
    icon: Wallet, 
    group: "healthcare", 
    roles: ["payroll_officer", "company_admin", "super_admin"],
    useCases: ["Process doctor payroll", "Track doctor consultations", "Calculate commissions"]
  },
  { 
    path: "/healthcare/expenditures", 
    label: "Expenditures", 
    icon: Receipt, 
    group: "healthcare", 
    roles: ["accounts_officer", "finance_manager", "company_admin", "super_admin"],
    useCases: ["Track operational expenses", "Approve expenditures", "Generate expense reports"]
  },
  { 
    path: "/healthcare/doctors-mgmt", 
    label: "Doctor Mgmt", 
    icon: Stethoscope, 
    group: "healthcare", 
    roles: ["hr_manager", "company_admin", "super_admin"],
    useCases: ["Onboard doctor", "Manage schedules", "Agreement management", "Doctor performance"]
  },

  { 
    path: "/hr", 
    label: "HR", 
    icon: Clock, 
    group: "hr", 
    roles: ["hr_manager", "company_admin", "super_admin"],
    useCases: ["Add new employee", "Mark attendance", "Apply for leave", "Approve leave", "Configure shifts", "Generate attendance report", "Employee offboarding"]
  },
  { 
    path: "/payroll", 
    label: "Payroll", 
    icon: Calculator, 
    group: "hr", 
    roles: ["payroll_officer", "hr_manager", "finance_manager", "company_admin", "super_admin"],
    useCases: ["Run monthly payroll", "Configure salary structure", "Process bonus", "Handle arrears", "Generate tax report", "Payslip distribution", "Salary advance"]
  },
  { 
    path: "/accounts", 
    label: "Accounts", 
    icon: BookOpen, 
    group: "accounts", 
    roles: ["accounts_officer", "finance_manager", "company_admin", "super_admin"],
    useCases: ["Create journal entry", "View ledger", "Reconcile bank", "Generate trial balance", "Expense tracking", "Generate financial statements", "Vendor payment", "Revenue recognition"]
  },
  { 
    path: "/master-data", 
    label: "Master Data", 
    icon: ClipboardList, 
    group: "admin", 
    roles: ["company_admin", "super_admin"],
    useCases: ["Manage reference data", "Configure professions", "Set up diagnoses", "Define leave types", "Configure payment modes"]
  },
  { 
    path: "/settings", 
    label: "Settings", 
    icon: Settings, 
    group: "admin", 
    roles: ["company_admin", "super_admin"],
    useCases: ["Configure company settings", "Manage preferences", "Update branding"]
  },
  { 
    path: "/admin/subscriptions", 
    label: "Subscriptions", 
    icon: CreditCard, 
    group: "admin", 
    roles: ["super_admin"],
    useCases: ["View all subscriptions", "Activate subscription", "Upgrade plan", "Extend trial", "Cancel subscription", "Subscription reports"]
  },
  { 
    path: "/admin/pharma-companies", 
    label: "Pharma Mgmt", 
    icon: Building2, 
    group: "admin", 
    roles: ["super_admin"],
    useCases: ["Add new pharma company", "View company dashboard", "Suspend company", "Reassign MR"]
  },
  { 
    path: "/admin/super-admin", 
    label: "Super Admin", 
    icon: Shield, 
    group: "admin", 
    roles: ["super_admin"],
    useCases: ["System health check", "User management", "Data governance", "Feature flags", "Module enable/disable", "Role management", "Use case configuration"]
  },
  { 
    path: "/admin/permissions", 
    label: "Permissions", 
    icon: Shield, 
    group: "admin", 
    roles: ["super_admin", "company_admin"],
    useCases: ["Manage role permissions", "Create user overrides", "Configure organization overrides", "View effective permissions", "Screen access management"]
  },
  { 
    path: "/admin/invitations", 
    label: "Invitations", 
    icon: UserPlus, 
    group: "admin", 
    roles: ["hr_manager", "company_admin", "super_admin"],
    useCases: ["Invite new employee", "Resend invitation", "Accept invitation", "Cancel invitation", "View invitation status", "Bulk invite"]
  },
  { 
    path: "/admin/person-master", 
    label: "Person Master", 
    icon: Users, 
    group: "admin", 
    roles: ["front_desk", "hr_manager", "company_admin", "super_admin"],
    useCases: ["Create new person", "Search person", "Merge duplicate persons", "Add person context", "Update person details", "View person history"]
  },
  { 
    path: "/admin/audit-logs", 
    label: "Audit Logs", 
    icon: FileText, 
    group: "admin", 
    roles: ["system_auditor", "compliance_officer", "super_admin"],
    useCases: ["View recent activity", "Investigate security incident", "Compliance audit", "Track data changes", "Export audit data"]
  },
];

export const menuByRole: Record<string, NavItem[]> = {
  user: allMenuItems.filter((item) => item.roles?.includes("user")),
  
  medical_rep: allMenuItems.filter((item) => item.roles?.includes("medical_rep")),
  area_sales_manager: allMenuItems.filter((item) => item.roles?.includes("area_sales_manager")),
  regional_sales_manager: allMenuItems.filter((item) => item.roles?.includes("regional_sales_manager")),
  zone_head: allMenuItems.filter((item) => item.roles?.includes("zone_head")),
  sales_analyst: allMenuItems.filter((item) => item.roles?.includes("sales_analyst")),
  
  doctor: allMenuItems.filter((item) => item.roles?.includes("doctor")),
  nurse: allMenuItems.filter((item) => item.roles?.includes("nurse")),
  senior_nurse: allMenuItems.filter((item) => item.roles?.includes("senior_nurse")),
  ward_manager: allMenuItems.filter((item) => item.roles?.includes("ward_manager")),
  icu_coordinator: allMenuItems.filter((item) => item.roles?.includes("icu_coordinator")),
  ot_technician: allMenuItems.filter((item) => item.roles?.includes("ot_technician")),
  anesthetist: allMenuItems.filter((item) => item.roles?.includes("anesthetist")),
  front_desk: allMenuItems.filter((item) => item.roles?.includes("front_desk")),
  billing_officer: allMenuItems.filter((item) => item.roles?.includes("billing_officer")),
  insurance_coordinator: allMenuItems.filter((item) => item.roles?.includes("insurance_coordinator")),
  
  pharmacist: allMenuItems.filter((item) => item.roles?.includes("pharmacist")),
  store_keeper: allMenuItems.filter((item) => item.roles?.includes("store_keeper")),
  inventory_manager: allMenuItems.filter((item) => item.roles?.includes("inventory_manager")),
  
  lab_technician: allMenuItems.filter((item) => item.roles?.includes("lab_technician")),
  lab_supervisor: allMenuItems.filter((item) => item.roles?.includes("lab_supervisor")),
  pathologist: allMenuItems.filter((item) => item.roles?.includes("pathologist")),
  quality_officer: allMenuItems.filter((item) => item.roles?.includes("quality_officer")),
  
  hr_manager: allMenuItems.filter((item) => item.roles?.includes("hr_manager")),
  payroll_officer: allMenuItems.filter((item) => item.roles?.includes("payroll_officer")),
  accounts_officer: allMenuItems.filter((item) => item.roles?.includes("accounts_officer")),
  finance_manager: allMenuItems.filter((item) => item.roles?.includes("finance_manager")),
  
  system_auditor: allMenuItems.filter((item) => item.roles?.includes("system_auditor")),
  support_agent: allMenuItems.filter((item) => item.roles?.includes("support_agent")),
  compliance_officer: allMenuItems.filter((item) => item.roles?.includes("compliance_officer")),
  
  company_admin: allMenuItems.filter((item) => item.roles?.includes("company_admin")),
  super_admin: allMenuItems,
  
  rep: allMenuItems.filter((item) => item.roles?.includes("medical_rep")),
  manager: allMenuItems.filter((item) => item.roles?.includes("area_sales_manager")),
  doctor_frontdesk: allMenuItems.filter((item) => item.roles?.includes("front_desk")),
};

export function getMenuForRole(role: string | undefined): NavItem[] {
  if (!role) return [];
  return menuByRole[role] || [];
}

const viewAsRoleMap: Record<string, string> = {
  super_admin: "super_admin",
  company_admin: "company_admin",
  pharma_company: "company_admin",
  hospital_admin: "company_admin",
  clinic_admin: "company_admin",
  doctor: "doctor",
  doctor_frontdesk: "front_desk",
  front_desk: "front_desk",
  medical_rep: "medical_rep",
  area_sales_manager: "area_sales_manager",
  regional_sales_manager: "regional_sales_manager",
  zone_head: "zone_head",
  sales_analyst: "sales_analyst",
  nurse: "nurse",
  senior_nurse: "senior_nurse",
  ward_manager: "ward_manager",
  icu_coordinator: "icu_coordinator",
  ot_technician: "ot_technician",
  anesthetist: "anesthetist",
  billing_officer: "billing_officer",
  insurance_coordinator: "insurance_coordinator",
  pharmacist: "pharmacist",
  store_keeper: "store_keeper",
  inventory_manager: "inventory_manager",
  lab_technician: "lab_technician",
  lab_supervisor: "lab_supervisor",
  pathologist: "pathologist",
  quality_officer: "quality_officer",
  hr_manager: "hr_manager",
  payroll_officer: "payroll_officer",
  accounts_officer: "accounts_officer",
  finance_manager: "finance_manager",
  system_auditor: "system_auditor",
  support_agent: "support_agent",
  compliance_officer: "compliance_officer",
  user: "user",
  rep: "medical_rep",
  manager: "area_sales_manager",
};

// Define which menu groups each role category can see
const CATEGORY_ALLOWED_GROUPS: Record<string, string[]> = {
  healthcare: ["main", "healthcare", "inventory", "analytics"], // Healthcare staff see healthcare + inventory + analytics for AI insights
  pharma: ["main", "sales", "analytics", "inventory"], // Pharma/Sales see sales-related groups
  hr_finance: ["main", "hr", "accounts", "admin"], // HR and finance see their specific groups + admin for invitations
  it_governance: ["main", "admin"], // IT governance see admin tools
  admin: ["main", "sales", "healthcare", "analytics", "inventory", "hr", "accounts", "admin"], // Admins see everything
};

// Determine which category a role belongs to
function getRoleCategory(role: string): string {
  if (HEALTHCARE_ROLES.includes(role)) return "healthcare";
  if (PHARMA_ROLES.includes(role)) return "pharma";
  if (HR_FINANCE_ROLES.includes(role)) return "hr_finance";
  if (IT_GOVERNANCE_ROLES.includes(role)) return "it_governance";
  if (ADMIN_ROLES.includes(role)) return "admin";
  return "admin"; // Default to admin for unknown roles
}

export function getMenuForViewingRole(viewingRole: string, isSuperAdmin: boolean, isViewingAs: boolean): NavItem[] {
  // Super admin not viewing as another role - show all menu items
  if (isSuperAdmin && !isViewingAs) {
    return menuByRole["super_admin"];
  }
  
  const menuRole = viewAsRoleMap[viewingRole] || viewingRole;
  const roleMenuItems = menuByRole[menuRole] || [];
  
  // When viewing as a specific role, filter to only show domain-relevant groups
  if (isViewingAs || !isSuperAdmin) {
    const category = getRoleCategory(menuRole);
    const allowedGroups = CATEGORY_ALLOWED_GROUPS[category] || CATEGORY_ALLOWED_GROUPS["admin"];
    
    return roleMenuItems.filter(item => {
      const itemGroup = item.group || "main";
      return allowedGroups.includes(itemGroup);
    });
  }
  
  return roleMenuItems;
}

export function getRoleDisplay(role: string | undefined): string {
  if (!role) return "User";
  const roleMap: Record<string, string> = {
    super_admin: "Super Admin",
    company_admin: "Company Admin",
    manager: "Manager",
    rep: "Representative",
    medical_rep: "Medical Representative",
    area_sales_manager: "Area Sales Manager",
    regional_sales_manager: "Regional Sales Manager",
    zone_head: "Zone Head",
    sales_analyst: "Sales Analyst",
    doctor: "Doctor",
    nurse: "Nurse",
    senior_nurse: "Senior Nurse",
    ward_manager: "Ward Manager",
    icu_coordinator: "ICU Coordinator",
    ot_technician: "OT Technician",
    anesthetist: "Anesthetist",
    front_desk: "Front Desk",
    doctor_frontdesk: "Doctor's Front Desk",
    billing_officer: "Billing Officer",
    insurance_coordinator: "Insurance Coordinator",
    pharmacist: "Pharmacist",
    store_keeper: "Store Keeper",
    inventory_manager: "Inventory Manager",
    lab_technician: "Lab Technician",
    lab_supervisor: "Lab Supervisor",
    pathologist: "Pathologist",
    quality_officer: "Quality Officer",
    hr_manager: "HR Manager",
    payroll_officer: "Payroll Officer",
    accounts_officer: "Accounts Officer",
    finance_manager: "Finance Manager",
    system_auditor: "System Auditor",
    support_agent: "Support Agent",
    compliance_officer: "Compliance Officer",
    user: "User",
  };
  return roleMap[role] || role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function getUseCasesForRole(role: string): string[] {
  const menuItems = getMenuForRole(role);
  return menuItems.flatMap(item => item.useCases || []);
}

export function getMenuGroupsForRole(role: string): Record<string, NavItem[]> {
  const menuItems = getMenuForRole(role);
  const groups: Record<string, NavItem[]> = {};
  menuItems.forEach(item => {
    const group = item.group || "main";
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });
  return groups;
}

export const ROLE_CATEGORIES = {
  healthcare: HEALTHCARE_ROLES,
  pharma: PHARMA_ROLES,
  hr_finance: HR_FINANCE_ROLES,
  it_governance: IT_GOVERNANCE_ROLES,
  admin: ADMIN_ROLES,
};

export const ALL_ROLES = [...HEALTHCARE_ROLES, ...PHARMA_ROLES, ...HR_FINANCE_ROLES, ...IT_GOVERNANCE_ROLES, ...ADMIN_ROLES];
