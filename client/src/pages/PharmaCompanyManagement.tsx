import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit2, Trash2, Building, Users, Package, Settings2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Company } from "@shared/schema";

interface PharmaCompanySettingsWithCompany {
  settings: {
    id: string;
    companyId: string;
    maxMRs: number;
    productCategories: string[] | null;
    regions: string[] | null;
    visitFrequencyDays: number;
    sampleQuotaPerMR: number;
    billingCycle: string;
    enabledFeatures: string[] | null;
    createdAt: string;
    updatedAt: string;
  };
  company: Company | null;
}

export default function PharmaCompanyManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState<PharmaCompanySettingsWithCompany | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("companies");

  const [settingsForm, setSettingsForm] = useState({
    companyId: "",
    maxMRs: "50",
    visitFrequencyDays: "7",
    sampleQuotaPerMR: "100",
    billingCycle: "monthly",
    productCategories: "",
    regions: "",
    enabledFeatures: "",
  });

  const { data: pharmaSettings = [], isLoading } = useQuery<PharmaCompanySettingsWithCompany[]>({
    queryKey: ["/api/pharma-company-settings"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/pharma-company-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharma-company-settings"] });
      toast({ title: "Company settings created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Failed to create company settings", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/pharma-company-settings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharma-company-settings"] });
      toast({ title: "Company settings updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedSettings(null);
    },
    onError: () => {
      toast({ title: "Failed to update company settings", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pharma-company-settings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharma-company-settings"] });
      toast({ title: "Company settings deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete company settings", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSettingsForm({
      companyId: "",
      maxMRs: "50",
      visitFrequencyDays: "7",
      sampleQuotaPerMR: "100",
      billingCycle: "monthly",
      productCategories: "",
      regions: "",
      enabledFeatures: "",
    });
  };

  const handleSubmit = () => {
    const data = {
      companyId: settingsForm.companyId,
      maxMRs: parseInt(settingsForm.maxMRs) || 50,
      visitFrequencyDays: parseInt(settingsForm.visitFrequencyDays) || 7,
      sampleQuotaPerMR: parseInt(settingsForm.sampleQuotaPerMR) || 100,
      billingCycle: settingsForm.billingCycle,
      productCategories: settingsForm.productCategories ? settingsForm.productCategories.split(",").map(s => s.trim()) : null,
      regions: settingsForm.regions ? settingsForm.regions.split(",").map(s => s.trim()) : null,
      enabledFeatures: settingsForm.enabledFeatures ? settingsForm.enabledFeatures.split(",").map(s => s.trim()) : null,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (item: PharmaCompanySettingsWithCompany) => {
    setSelectedSettings(item);
    setSettingsForm({
      companyId: item.settings.companyId,
      maxMRs: item.settings.maxMRs.toString(),
      visitFrequencyDays: item.settings.visitFrequencyDays.toString(),
      sampleQuotaPerMR: item.settings.sampleQuotaPerMR.toString(),
      billingCycle: item.settings.billingCycle,
      productCategories: item.settings.productCategories?.join(", ") || "",
      regions: item.settings.regions?.join(", ") || "",
      enabledFeatures: item.settings.enabledFeatures?.join(", ") || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSettings) return;
    const data = {
      maxMRs: parseInt(settingsForm.maxMRs) || 50,
      visitFrequencyDays: parseInt(settingsForm.visitFrequencyDays) || 7,
      sampleQuotaPerMR: parseInt(settingsForm.sampleQuotaPerMR) || 100,
      billingCycle: settingsForm.billingCycle,
      productCategories: settingsForm.productCategories ? settingsForm.productCategories.split(",").map(s => s.trim()) : null,
      regions: settingsForm.regions ? settingsForm.regions.split(",").map(s => s.trim()) : null,
      enabledFeatures: settingsForm.enabledFeatures ? settingsForm.enabledFeatures.split(",").map(s => s.trim()) : null,
    };
    updateMutation.mutate({ id: selectedSettings.settings.id, data });
  };

  const filteredSettings = pharmaSettings.filter((item) => {
    const companyName = item.company?.name?.toLowerCase() || "";
    return companyName.includes(searchTerm.toLowerCase());
  });

  const companiesWithoutSettings = companies.filter(
    (c) => !pharmaSettings.some((s) => s.settings.companyId === c.id)
  );

  const stats = {
    totalCompanies: pharmaSettings.length,
    totalMaxMRs: pharmaSettings.reduce((sum, s) => sum + s.settings.maxMRs, 0),
    avgSampleQuota: pharmaSettings.length > 0 
      ? Math.round(pharmaSettings.reduce((sum, s) => sum + s.settings.sampleQuotaPerMR, 0) / pharmaSettings.length)
      : 0,
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only Super Admins can access this page</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="pharma-company-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Pharma Company Management</h1>
          <p className="text-muted-foreground">Configure pharma company settings, MR limits, and features</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-settings">
          <Plus className="w-4 h-4 mr-2" />
          Configure Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Configured Companies</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2" data-testid="stat-companies">
              <Building className="w-5 h-5 text-primary" />
              {stats.totalCompanies}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total MR Capacity</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2" data-testid="stat-mrs">
              <Users className="w-5 h-5 text-blue-500" />
              {stats.totalMaxMRs}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Sample Quota/MR</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2" data-testid="stat-samples">
              <Package className="w-5 h-5 text-green-500" />
              {stats.avgSampleQuota}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Max MRs</TableHead>
                  <TableHead>Visit Frequency</TableHead>
                  <TableHead>Sample Quota/MR</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No pharma company settings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSettings.map((item) => (
                    <TableRow key={item.settings.id} data-testid={`row-settings-${item.settings.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{item.company?.name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.settings.regions?.join(", ") || "All regions"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.settings.maxMRs} MRs</Badge>
                      </TableCell>
                      <TableCell>Every {item.settings.visitFrequencyDays} days</TableCell>
                      <TableCell>{item.settings.sampleQuotaPerMR} samples</TableCell>
                      <TableCell>
                        <Badge>{item.settings.billingCycle}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.settings.productCategories?.slice(0, 2).map((cat, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {(item.settings.productCategories?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(item.settings.productCategories?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            data-testid={`button-edit-${item.settings.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete these settings?")) {
                                deleteMutation.mutate(item.settings.id);
                              }
                            }}
                            data-testid={`button-delete-${item.settings.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Pharma Company</DialogTitle>
            <DialogDescription>Set up MR limits, sample quotas, and features for a pharma company</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              <Label>Company</Label>
              <Select
                value={settingsForm.companyId}
                onValueChange={(value) => setSettingsForm({ ...settingsForm, companyId: value })}
              >
                <SelectTrigger data-testid="select-company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesWithoutSettings.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Max MRs</Label>
                <Input
                  type="number"
                  value={settingsForm.maxMRs}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxMRs: e.target.value })}
                  data-testid="input-max-mrs"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sample Quota/MR</Label>
                <Input
                  type="number"
                  value={settingsForm.sampleQuotaPerMR}
                  onChange={(e) => setSettingsForm({ ...settingsForm, sampleQuotaPerMR: e.target.value })}
                  data-testid="input-sample-quota"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Visit Frequency (days)</Label>
                <Input
                  type="number"
                  value={settingsForm.visitFrequencyDays}
                  onChange={(e) => setSettingsForm({ ...settingsForm, visitFrequencyDays: e.target.value })}
                  data-testid="input-visit-frequency"
                />
              </div>
              <div className="grid gap-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={settingsForm.billingCycle}
                  onValueChange={(value) => setSettingsForm({ ...settingsForm, billingCycle: value })}
                >
                  <SelectTrigger data-testid="select-billing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Product Categories (comma-separated)</Label>
              <Input
                value={settingsForm.productCategories}
                onChange={(e) => setSettingsForm({ ...settingsForm, productCategories: e.target.value })}
                placeholder="Cardiology, Neurology, Oncology"
                data-testid="input-categories"
              />
            </div>
            <div className="grid gap-2">
              <Label>Regions (comma-separated)</Label>
              <Input
                value={settingsForm.regions}
                onChange={(e) => setSettingsForm({ ...settingsForm, regions: e.target.value })}
                placeholder="North, South, East, West"
                data-testid="input-regions"
              />
            </div>
            <div className="grid gap-2">
              <Label>Enabled Features (comma-separated)</Label>
              <Input
                value={settingsForm.enabledFeatures}
                onChange={(e) => setSettingsForm({ ...settingsForm, enabledFeatures: e.target.value })}
                placeholder="visits, samples, kpi, reports"
                data-testid="input-features"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!settingsForm.companyId || createMutation.isPending}
              data-testid="button-submit-settings"
            >
              {createMutation.isPending ? "Creating..." : "Configure Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company Settings</DialogTitle>
            <DialogDescription>Update pharma company configuration</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              <Label>Company</Label>
              <Input value={selectedSettings?.company?.name || "Unknown"} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Max MRs</Label>
                <Input
                  type="number"
                  value={settingsForm.maxMRs}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxMRs: e.target.value })}
                  data-testid="edit-input-max-mrs"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sample Quota/MR</Label>
                <Input
                  type="number"
                  value={settingsForm.sampleQuotaPerMR}
                  onChange={(e) => setSettingsForm({ ...settingsForm, sampleQuotaPerMR: e.target.value })}
                  data-testid="edit-input-sample-quota"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Visit Frequency (days)</Label>
                <Input
                  type="number"
                  value={settingsForm.visitFrequencyDays}
                  onChange={(e) => setSettingsForm({ ...settingsForm, visitFrequencyDays: e.target.value })}
                  data-testid="edit-input-visit-frequency"
                />
              </div>
              <div className="grid gap-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={settingsForm.billingCycle}
                  onValueChange={(value) => setSettingsForm({ ...settingsForm, billingCycle: value })}
                >
                  <SelectTrigger data-testid="edit-select-billing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Product Categories (comma-separated)</Label>
              <Input
                value={settingsForm.productCategories}
                onChange={(e) => setSettingsForm({ ...settingsForm, productCategories: e.target.value })}
                data-testid="edit-input-categories"
              />
            </div>
            <div className="grid gap-2">
              <Label>Regions (comma-separated)</Label>
              <Input
                value={settingsForm.regions}
                onChange={(e) => setSettingsForm({ ...settingsForm, regions: e.target.value })}
                data-testid="edit-input-regions"
              />
            </div>
            <div className="grid gap-2">
              <Label>Enabled Features (comma-separated)</Label>
              <Input
                value={settingsForm.enabledFeatures}
                onChange={(e) => setSettingsForm({ ...settingsForm, enabledFeatures: e.target.value })}
                data-testid="edit-input-features"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-update-settings"
            >
              {updateMutation.isPending ? "Updating..." : "Update Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
