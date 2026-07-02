import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Stethoscope,
  GraduationCap,
  Building2,
  Activity,
  TestTube,
  Pill,
  Users,
  Target,
  Calendar,
  CreditCard,
  Shield,
  FileCheck,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";

interface MasterDataCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint: string;
  columns: { key: string; label: string; type?: string }[];
}

const globalMasterCategories: MasterDataCategory[] = [
  {
    id: "professions",
    title: "Medical Professions",
    description: "Define medical professional categories and licensing requirements",
    icon: Stethoscope,
    endpoint: "/api/master/professions",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "requires_license", label: "Requires License", type: "boolean" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "qualifications",
    title: "Qualifications",
    description: "Medical degrees, certifications and qualifications",
    icon: GraduationCap,
    endpoint: "/api/master/qualifications",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "degree_type", label: "Type" },
      { key: "certifying_body", label: "Certifying Body" },
      { key: "country", label: "Country" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "vital-types",
    title: "Vital Signs",
    description: "Standard vital signs with normal and critical ranges",
    icon: Activity,
    endpoint: "/api/master/vital-types",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "unit", label: "Unit" },
      { key: "normal_min", label: "Normal Min" },
      { key: "normal_max", label: "Normal Max" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "sample-types",
    title: "Sample Types",
    description: "Laboratory sample collection types and handling instructions",
    icon: TestTube,
    endpoint: "/api/master/sample-types",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "container_type", label: "Container" },
      { key: "storage_temperature", label: "Storage Temp" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "diagnoses",
    title: "Diagnoses (ICD-10)",
    description: "Standard ICD-10 diagnosis codes for clinical documentation",
    icon: FileCheck,
    endpoint: "/api/master/diagnoses",
    columns: [
      { key: "icd_code", label: "ICD Code" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "is_chronic", label: "Chronic", type: "boolean" },
      { key: "severity", label: "Severity" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "payment-modes",
    title: "Payment Modes",
    description: "Accepted payment methods and processing configurations",
    icon: CreditCard,
    endpoint: "/api/master/payment-modes",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "payment_type", label: "Type" },
      { key: "requires_reference", label: "Ref Required", type: "boolean" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "insurance-companies",
    title: "Insurance Companies",
    description: "Insurance providers and TPA configurations",
    icon: Shield,
    endpoint: "/api/master/insurance-companies",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "company_type", label: "Type" },
      { key: "payment_terms_days", label: "Payment Terms" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "leave-types",
    title: "Leave Types",
    description: "Employee leave categories with policies",
    icon: Calendar,
    endpoint: "/api/master/leave-types",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "default_days", label: "Days" },
      { key: "carry_forward", label: "Carry Forward", type: "boolean" },
      { key: "requires_approval", label: "Approval Required", type: "boolean" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "permissions",
    title: "Permissions",
    description: "System permissions for role-based access control",
    icon: Shield,
    endpoint: "/api/master/permissions",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "module", label: "Module" },
      { key: "action", label: "Action" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "audit-events",
    title: "Audit Events",
    description: "Audit log event types and retention policies",
    icon: FileCheck,
    endpoint: "/api/master/audit-events",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "severity", label: "Severity" },
      { key: "retention_days", label: "Retention Days" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
];

const tenantMasterCategories: MasterDataCategory[] = [
  {
    id: "departments",
    title: "Departments",
    description: "Organization departments and cost centers",
    icon: Building2,
    endpoint: "/api/master/departments",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "department_type", label: "Type" },
      { key: "cost_center", label: "Cost Center" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "service-procedures",
    title: "Service Procedures",
    description: "Billable services with pricing and ICD codes",
    icon: FileCheck,
    endpoint: "/api/master/service-procedures",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "service_type", label: "Type" },
      { key: "base_price", label: "Base Price" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "lab-tests",
    title: "Lab Tests",
    description: "Laboratory test catalog with ranges and TAT",
    icon: TestTube,
    endpoint: "/api/master/lab-tests",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "turnaround_time", label: "TAT (hrs)" },
      { key: "price", label: "Price" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "clinical-templates",
    title: "Clinical Templates",
    description: "Customizable prescription and note templates",
    icon: FileCheck,
    endpoint: "/api/master/clinical-templates",
    columns: [
      { key: "name", label: "Name" },
      { key: "template_type", label: "Type" },
      { key: "specialty", label: "Specialty" },
      { key: "is_default", label: "Default", type: "boolean" },
      { key: "is_active", label: "Status", type: "status" },
    ],
  },
  {
    id: "sales-targets",
    title: "Sales Targets",
    description: "Period-based sales targets by role and territory",
    icon: Target,
    endpoint: "/api/master/sales-targets",
    columns: [
      { key: "target_type", label: "Target Type" },
      { key: "territory", label: "Territory" },
      { key: "target_value", label: "Target" },
      { key: "achieved_value", label: "Achieved" },
      { key: "period_type", label: "Period" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "promotions",
    title: "Product Promotions",
    description: "Campaign management with KPIs",
    icon: Target,
    endpoint: "/api/master/promotions",
    columns: [
      { key: "campaign_name", label: "Campaign" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "sample_limit", label: "Sample Limit" },
      { key: "status", label: "Status" },
    ],
  },
];

const masterDataCategories: MasterDataCategory[] = [...globalMasterCategories, ...tenantMasterCategories];

function MasterDataTable({ category }: { category: MasterDataCategory }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: [category.endpoint],
  });

  const records = Array.isArray(data) ? data : [];
  
  const filteredRecords = records.filter((record: Record<string, unknown>) => {
    const searchLower = searchTerm.toLowerCase();
    return category.columns.some(col => {
      const value = record[col.key];
      return value?.toString().toLowerCase().includes(searchLower);
    });
  });

  const renderCell = (record: Record<string, unknown>, column: { key: string; type?: string }) => {
    const value = record[column.key];
    
    if (column.type === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }
    
    if (column.type === "status") {
      return (
        <Badge variant={value ? "default" : "destructive"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      );
    }
    
    return value?.toString() || "-";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid={`input-search-${category.id}`}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid={`button-refresh-${category.id}`}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" data-testid={`button-add-${category.id}`}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {category.columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={category.columns.length + 1} className="text-center text-muted-foreground py-8">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record: Record<string, unknown>, index: number) => (
                <TableRow key={record.id?.toString() || index}>
                  {category.columns.map((col) => (
                    <TableCell key={col.key}>{renderCell(record, col)}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" data-testid={`button-edit-${category.id}-${index}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} of {records.length} records
      </p>
    </div>
  );
}

export default function MasterDataManagement() {
  const [activeCategory, setActiveCategory] = useState(masterDataCategories[0].id);
  
  const currentCategory = masterDataCategories.find(c => c.id === activeCategory)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Master Data Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure reference data used across the platform
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {masterDataCategories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover-elevate ${isActive ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                  {category.title}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <currentCategory.icon className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>{currentCategory.title}</CardTitle>
              <CardDescription>{currentCategory.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MasterDataTable category={currentCategory} />
        </CardContent>
      </Card>
    </div>
  );
}
