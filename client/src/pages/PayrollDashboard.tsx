import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { 
  Wallet,
  Calculator,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Play,
  Check,
  Lock,
  Eye,
  Download,
  Edit,
  Trash2
} from "lucide-react";

const payslipTemplateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  layoutConfig: z.object({
    headerSection: z.object({
      showLogo: z.boolean().default(true),
      showCompanyName: z.boolean().default(true),
      showCompanyAddress: z.boolean().default(true),
      title: z.string().default("Salary Slip"),
    }),
    employeeSection: z.object({
      showEmployeeId: z.boolean().default(true),
      showDepartment: z.boolean().default(true),
      showDesignation: z.boolean().default(true),
      showJoiningDate: z.boolean().default(false),
      showBankDetails: z.boolean().default(true),
    }),
    earningsSection: z.object({
      showBasicSalary: z.boolean().default(true),
      showHRA: z.boolean().default(true),
      showConveyance: z.boolean().default(true),
      showMedical: z.boolean().default(true),
      showSpecialAllowance: z.boolean().default(true),
      showOvertime: z.boolean().default(true),
    }),
    deductionsSection: z.object({
      showIncomeTax: z.boolean().default(true),
      showEOBI: z.boolean().default(true),
      showProvidentFund: z.boolean().default(false),
      showLoanDeductions: z.boolean().default(true),
      showAdvanceDeductions: z.boolean().default(true),
    }),
    footerSection: z.object({
      showNetPayWords: z.boolean().default(true),
      showSignatureLines: z.boolean().default(true),
      showPaymentDate: z.boolean().default(true),
    }),
  }),
});

type PayslipTemplateFormValues = z.infer<typeof payslipTemplateSchema>;

const defaultLayoutConfig = {
  headerSection: {
    showLogo: true,
    showCompanyName: true,
    showCompanyAddress: true,
    title: "Salary Slip",
  },
  employeeSection: {
    showEmployeeId: true,
    showDepartment: true,
    showDesignation: true,
    showJoiningDate: false,
    showBankDetails: true,
  },
  earningsSection: {
    showBasicSalary: true,
    showHRA: true,
    showConveyance: true,
    showMedical: true,
    showSpecialAllowance: true,
    showOvertime: true,
  },
  deductionsSection: {
    showIncomeTax: true,
    showEOBI: true,
    showProvidentFund: false,
    showLoanDeductions: true,
    showAdvanceDeductions: true,
  },
  footerSection: {
    showNetPayWords: true,
    showSignatureLines: true,
    showPaymentDate: true,
  },
};

export default function PayrollDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("runs");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2025-2026");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const organizationId = user?.organizationId || user?.companyId;

  const templateForm = useForm<PayslipTemplateFormValues>({
    resolver: zodResolver(payslipTemplateSchema),
    defaultValues: {
      templateName: "",
      description: "",
      isDefault: false,
      isActive: true,
      layoutConfig: defaultLayoutConfig,
    },
  });

  const { data: payrollRuns = [], isLoading: runsLoading } = useQuery<any[]>({
    queryKey: ["/api/payroll/runs", organizationId, selectedFiscalYear],
    enabled: !!organizationId
  });

  const { data: payslipTemplates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/payslip-templates", organizationId],
    enabled: !!organizationId
  });

  const { data: taxSlabs = [], isLoading: taxLoading } = useQuery<any[]>({
    queryKey: ["/api/tax/slabs", selectedFiscalYear],
    enabled: true
  });

  const calculateMutation = useMutation({
    mutationFn: async (runId: string) => {
      return apiRequest(`/api/payroll/runs/${runId}/calculate`, { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Payroll calculated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/runs", organizationId, selectedFiscalYear] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to calculate payroll", description: error.message, variant: "destructive" });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (runId: string) => {
      return apiRequest(`/api/payroll/runs/${runId}/approve`, { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Payroll approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/runs", organizationId, selectedFiscalYear] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve payroll", description: error.message, variant: "destructive" });
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: async (runId: string) => {
      return apiRequest(`/api/payroll/runs/${runId}/finalize`, { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Payroll finalized successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/runs", organizationId, selectedFiscalYear] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to finalize payroll", description: error.message, variant: "destructive" });
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: PayslipTemplateFormValues) => {
      return apiRequest("/api/hr/payslip-templates", {
        method: "POST",
        body: JSON.stringify({ ...data, organizationId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Template created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payslip-templates", organizationId] });
      handleTemplateDialogChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PayslipTemplateFormValues }) => {
      return apiRequest(`/api/hr/payslip-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Template updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payslip-templates", organizationId] });
      handleTemplateDialogChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update template", description: error.message, variant: "destructive" });
    },
  });

  const handleNewPayrollRun = () => {
    toast({ title: "Coming soon", description: "Payroll run creation will be available in the next update" });
  };

  const handleTemplateDialogChange = (open: boolean) => {
    if (open) {
      setIsTemplateDialogOpen(true);
    } else {
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset({
        templateName: "",
        description: "",
        isDefault: false,
        isActive: true,
        layoutConfig: defaultLayoutConfig,
      });
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset({
      templateName: template.templateName,
      description: template.description || "",
      isDefault: template.isDefault,
      isActive: template.isActive,
      layoutConfig: template.layoutConfig || defaultLayoutConfig,
    });
    setIsTemplateDialogOpen(true);
  };

  const onTemplateSubmit = (data: PayslipTemplateFormValues) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const draftRuns = payrollRuns.filter(r => r.status === 'draft');
  const pendingRuns = payrollRuns.filter(r => ['calculating', 'review'].includes(r.status));
  const completedRuns = payrollRuns.filter(r => ['approved', 'finalized', 'paid'].includes(r.status));
  const totalPayroll = payrollRuns.reduce((sum, r) => sum + parseFloat(r.totalNetPay || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'calculating':
        return <Badge variant="outline" className="text-yellow-600"><Calculator className="h-3 w-3 mr-1" />Calculating</Badge>;
      case 'review':
        return <Badge variant="outline" className="text-blue-600"><Eye className="h-3 w-3 mr-1" />Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'finalized':
        return <Badge variant="default" className="bg-purple-500"><Lock className="h-3 w-3 mr-1" />Finalized</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const fiscalYears = ["2024-2025", "2025-2026", "2026-2027"];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-payroll-title">Payroll Dashboard</h1>
          <p className="text-muted-foreground">Manage payroll runs, payslips, and tax compliance</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Label>Fiscal Year:</Label>
          <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
            <SelectTrigger className="w-36" data-testid="select-fiscal-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fiscalYears.map(fy => (
                <SelectItem key={fy} value={fy}>{fy}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleNewPayrollRun} data-testid="button-new-payroll">
            <Plus className="h-4 w-4 mr-2" />
            New Payroll Run
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Runs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-count">{draftRuns.length}</div>
            <p className="text-xs text-muted-foreground">pending calculation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calculator className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">{pendingRuns.length}</div>
            <p className="text-xs text-muted-foreground">awaiting review/approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-count">{completedRuns.length}</div>
            <p className="text-xs text-muted-foreground">finalized runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payroll">Rs. {totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">this fiscal year</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs" data-testid="tab-runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Payslip Templates</TabsTrigger>
          <TabsTrigger value="tax" data-testid="tab-tax">Tax Slabs</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Runs</CardTitle>
              <CardDescription>View and manage payroll processing</CardDescription>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading payroll runs...</div>
              ) : payrollRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payroll runs found. Create your first payroll run to get started.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Total Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((run: any) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.runName}</TableCell>
                        <TableCell>
                          {format(new Date(run.periodStart), "MMM dd")} - {format(new Date(run.periodEnd), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{run.employeeCount || 0}</TableCell>
                        <TableCell>Rs. {parseFloat(run.totalGrossPay || 0).toLocaleString()}</TableCell>
                        <TableCell>Rs. {parseFloat(run.totalDeductions || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">Rs. {parseFloat(run.totalNetPay || 0).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {run.status === 'draft' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => calculateMutation.mutate(run.id)}
                                disabled={calculateMutation.isPending}
                                data-testid={`button-calculate-${run.id}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Calculate
                              </Button>
                            )}
                            {run.status === 'review' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => approveMutation.mutate(run.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${run.id}`}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            {run.status === 'approved' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => finalizeMutation.mutate(run.id)}
                                disabled={finalizeMutation.isPending}
                                data-testid={`button-finalize-${run.id}`}
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                Finalize
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" data-testid={`button-view-${run.id}`}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Payslip Templates</CardTitle>
                <CardDescription>Configure payslip layouts and components</CardDescription>
              </div>
              <Dialog open={isTemplateDialogOpen} onOpenChange={handleTemplateDialogChange}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-template">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
                    <DialogDescription>
                      Configure payslip layout sections and fields
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="templateName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Standard Payslip" {...field} data-testid="input-template-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="layoutConfig.headerSection.title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payslip Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Salary Slip" {...field} data-testid="input-payslip-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={templateForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Template description..." {...field} data-testid="input-template-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Default Template</FormLabel>
                                <FormDescription>Use this template for new payroll runs</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-default" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Active</FormLabel>
                                <FormDescription>Template is available for use</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Header Section</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <FormField control={templateForm.control} name="layoutConfig.headerSection.showLogo" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-logo" /></FormControl>
                              <FormLabel className="font-normal">Show Logo</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.headerSection.showCompanyName" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-company-name" /></FormControl>
                              <FormLabel className="font-normal">Company Name</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.headerSection.showCompanyAddress" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-company-address" /></FormControl>
                              <FormLabel className="font-normal">Company Address</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Employee Details Section</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <FormField control={templateForm.control} name="layoutConfig.employeeSection.showEmployeeId" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-employee-id" /></FormControl>
                              <FormLabel className="font-normal">Employee ID</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.employeeSection.showDepartment" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-department" /></FormControl>
                              <FormLabel className="font-normal">Department</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.employeeSection.showDesignation" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-designation" /></FormControl>
                              <FormLabel className="font-normal">Designation</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.employeeSection.showJoiningDate" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-joining-date" /></FormControl>
                              <FormLabel className="font-normal">Joining Date</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.employeeSection.showBankDetails" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-bank-details" /></FormControl>
                              <FormLabel className="font-normal">Bank Details</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Earnings Section</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <FormField control={templateForm.control} name="layoutConfig.earningsSection.showBasicSalary" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-basic-salary" /></FormControl>
                              <FormLabel className="font-normal">Basic Salary</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.earningsSection.showHRA" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-hra" /></FormControl>
                              <FormLabel className="font-normal">House Rent Allowance</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.earningsSection.showConveyance" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-conveyance" /></FormControl>
                              <FormLabel className="font-normal">Conveyance</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.earningsSection.showMedical" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-medical" /></FormControl>
                              <FormLabel className="font-normal">Medical Allowance</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.earningsSection.showSpecialAllowance" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-special-allowance" /></FormControl>
                              <FormLabel className="font-normal">Special Allowance</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.earningsSection.showOvertime" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-overtime" /></FormControl>
                              <FormLabel className="font-normal">Overtime</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Deductions Section</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <FormField control={templateForm.control} name="layoutConfig.deductionsSection.showIncomeTax" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-income-tax" /></FormControl>
                              <FormLabel className="font-normal">Income Tax</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.deductionsSection.showEOBI" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-eobi" /></FormControl>
                              <FormLabel className="font-normal">EOBI</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.deductionsSection.showProvidentFund" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-pf" /></FormControl>
                              <FormLabel className="font-normal">Provident Fund</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.deductionsSection.showLoanDeductions" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-loan" /></FormControl>
                              <FormLabel className="font-normal">Loan Deductions</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.deductionsSection.showAdvanceDeductions" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-advance" /></FormControl>
                              <FormLabel className="font-normal">Advance Deductions</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Footer Section</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <FormField control={templateForm.control} name="layoutConfig.footerSection.showNetPayWords" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-net-pay-words" /></FormControl>
                              <FormLabel className="font-normal">Net Pay in Words</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.footerSection.showSignatureLines" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-signature" /></FormControl>
                              <FormLabel className="font-normal">Signature Lines</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={templateForm.control} name="layoutConfig.footerSection.showPaymentDate" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-payment-date" /></FormControl>
                              <FormLabel className="font-normal">Payment Date</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleTemplateDialogChange(false)} data-testid="button-cancel-template">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending} data-testid="button-submit-template">
                          {createTemplateMutation.isPending || updateTemplateMutation.isPending ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
              ) : payslipTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payslip templates configured. Create your first template to get started.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslipTemplates.map((template: any) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.templateName}</TableCell>
                        <TableCell>v{template.version}</TableCell>
                        <TableCell>
                          {template.isDefault && <Badge variant="outline">Default</Badge>}
                        </TableCell>
                        <TableCell>{template.updatedAt ? format(new Date(template.updatedAt), "MMM dd, yyyy") : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(template)} data-testid={`button-edit-template-${template.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pakistan Tax Slabs (FY {selectedFiscalYear})</CardTitle>
              <CardDescription>Progressive income tax calculation slabs</CardDescription>
            </CardHeader>
            <CardContent>
              {taxLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading tax slabs...</div>
              ) : taxSlabs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No tax slabs configured for this fiscal year.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Income From</TableHead>
                      <TableHead>Income To</TableHead>
                      <TableHead>Fixed Tax</TableHead>
                      <TableHead>Rate %</TableHead>
                      <TableHead>Excess Over</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxSlabs.map((slab: any, index: number) => (
                      <TableRow key={slab.id || index}>
                        <TableCell>Rs. {parseFloat(slab.incomeFrom).toLocaleString()}</TableCell>
                        <TableCell>Rs. {parseFloat(slab.incomeTo).toLocaleString()}</TableCell>
                        <TableCell>Rs. {parseFloat(slab.fixedTax).toLocaleString()}</TableCell>
                        <TableCell>{parseFloat(slab.ratePercent)}%</TableCell>
                        <TableCell>Rs. {parseFloat(slab.excessOver).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Calculator</CardTitle>
              <CardDescription>Calculate income tax based on annual income</CardDescription>
            </CardHeader>
            <CardContent>
              <TaxCalculator fiscalYear={selectedFiscalYear} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaxCalculator({ fiscalYear }: { fiscalYear: string }) {
  const { toast } = useToast();
  const [annualIncome, setAnnualIncome] = useState("");
  const [calculatedTax, setCalculatedTax] = useState<number | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/tax/calculate", {
        method: "POST",
        body: JSON.stringify({ annualIncome: parseFloat(annualIncome), fiscalYear })
      });
    },
    onSuccess: (data: any) => {
      setCalculatedTax(data.calculatedTax);
    },
    onError: (error: any) => {
      toast({ title: "Failed to calculate tax", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="annual-income">Annual Income (Rs.)</Label>
        <Input
          id="annual-income"
          type="number"
          placeholder="Enter annual income"
          value={annualIncome}
          onChange={(e) => setAnnualIncome(e.target.value)}
          data-testid="input-annual-income"
        />
      </div>
      <Button 
        onClick={() => calculateMutation.mutate()}
        disabled={!annualIncome || calculateMutation.isPending}
        data-testid="button-calculate-tax"
      >
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Tax
      </Button>
      {calculatedTax !== null && (
        <Card className="flex-1">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Calculated Annual Tax</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-calculated-tax">
              Rs. {calculatedTax.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Monthly: Rs. {(calculatedTax / 12).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
