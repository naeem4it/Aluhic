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
import { Plus, Search, Edit2, Trash2, Phone, Mail, TrendingUp, Target, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Product, Doctor } from "@shared/schema";

interface SalesLeadWithRelations {
  lead: {
    id: string;
    userId: string;
    companyId: string | null;
    doctorId: string;
    productId: string;
    quantity: number;
    estimatedValue: string;
    status: string;
    priority: string;
    source: string | null;
    notes: string | null;
    followUpDate: string | null;
    convertedToSaleId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  doctor: Doctor | null;
  product: Product | null;
}

export default function SalesLeads() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SalesLeadWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [leadForm, setLeadForm] = useState({
    doctorId: "",
    productId: "",
    quantity: "",
    estimatedValue: "",
    priority: "medium",
    source: "",
    notes: "",
    followUpDate: "",
  });

  const { data: leads = [], isLoading } = useQuery<SalesLeadWithRelations[]>({
    queryKey: ["/api/sales-leads"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sales-leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-leads"] });
      toast({ title: "Sales lead created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create sales lead", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/sales-leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-leads"] });
      toast({ title: "Sales lead updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedLead(null);
    },
    onError: () => {
      toast({ title: "Failed to update sales lead", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sales-leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-leads"] });
      toast({ title: "Sales lead deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete sales lead", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setLeadForm({
      doctorId: "",
      productId: "",
      quantity: "",
      estimatedValue: "",
      priority: "medium",
      source: "",
      notes: "",
      followUpDate: "",
    });
  };

  const handleSubmit = () => {
    const data = {
      doctorId: leadForm.doctorId,
      productId: leadForm.productId,
      quantity: parseInt(leadForm.quantity) || 1,
      estimatedValue: leadForm.estimatedValue || "0",
      priority: leadForm.priority,
      source: leadForm.source || null,
      notes: leadForm.notes || null,
      followUpDate: leadForm.followUpDate || null,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (lead: SalesLeadWithRelations) => {
    setSelectedLead(lead);
    setLeadForm({
      doctorId: lead.lead.doctorId,
      productId: lead.lead.productId,
      quantity: lead.lead.quantity.toString(),
      estimatedValue: lead.lead.estimatedValue,
      priority: lead.lead.priority,
      source: lead.lead.source || "",
      notes: lead.lead.notes || "",
      followUpDate: lead.lead.followUpDate ? lead.lead.followUpDate.split("T")[0] : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedLead) return;
    const data = {
      doctorId: leadForm.doctorId,
      productId: leadForm.productId,
      quantity: parseInt(leadForm.quantity) || 1,
      estimatedValue: leadForm.estimatedValue || "0",
      priority: leadForm.priority,
      source: leadForm.source || null,
      notes: leadForm.notes || null,
      followUpDate: leadForm.followUpDate || null,
    };
    updateMutation.mutate({ id: selectedLead.lead.id, data });
  };

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateMutation.mutate({ id: leadId, data: { status: newStatus } });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      new: { variant: "default", icon: <AlertCircle className="w-3 h-3" /> },
      contacted: { variant: "secondary", icon: <Phone className="w-3 h-3" /> },
      confirmed: { variant: "outline", icon: <CheckCircle2 className="w-3 h-3" /> },
      fulfilled: { variant: "default", icon: <TrendingUp className="w-3 h-3" /> },
      lost: { variant: "destructive", icon: <AlertCircle className="w-3 h-3" /> },
    };
    const { variant, icon } = variants[status] || { variant: "default", icon: null };
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      low: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return (
      <Badge variant="outline" className={colors[priority] || colors.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.lead.status === "new").length,
    contacted: leads.filter((l) => l.lead.status === "contacted").length,
    confirmed: leads.filter((l) => l.lead.status === "confirmed").length,
    fulfilled: leads.filter((l) => l.lead.status === "fulfilled").length,
    totalValue: leads.reduce((sum, l) => sum + parseFloat(l.lead.estimatedValue || "0"), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="sales-leads-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Sales Leads</h1>
          <p className="text-muted-foreground">Track and manage sales opportunities</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-lead">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-2xl" data-testid="stat-total">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New</CardDescription>
            <CardTitle className="text-2xl text-blue-500" data-testid="stat-new">{stats.new}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contacted</CardDescription>
            <CardTitle className="text-2xl text-yellow-500" data-testid="stat-contacted">{stats.contacted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="stat-confirmed">{stats.confirmed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fulfilled</CardDescription>
            <CardTitle className="text-2xl text-emerald-500" data-testid="stat-fulfilled">{stats.fulfilled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-xl" data-testid="stat-value">Rs. {stats.totalValue.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((item) => (
                    <TableRow key={item.lead.id} data-testid={`row-lead-${item.lead.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.doctor?.name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{item.doctor?.specialty}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.product?.name || "Unknown"}</TableCell>
                      <TableCell>{item.lead.quantity}</TableCell>
                      <TableCell>Rs. {parseFloat(item.lead.estimatedValue).toLocaleString()}</TableCell>
                      <TableCell>
                        <Select
                          value={item.lead.status}
                          onValueChange={(value) => handleStatusChange(item.lead.id, value)}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-status-${item.lead.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getPriorityBadge(item.lead.priority)}</TableCell>
                      <TableCell>
                        {item.lead.followUpDate
                          ? format(new Date(item.lead.followUpDate), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            data-testid={`button-edit-${item.lead.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this lead?")) {
                                deleteMutation.mutate(item.lead.id);
                              }
                            }}
                            data-testid={`button-delete-${item.lead.id}`}
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
            <DialogTitle>Add Sales Lead</DialogTitle>
            <DialogDescription>Create a new sales opportunity</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Doctor</Label>
              <Select
                value={leadForm.doctorId}
                onValueChange={(value) => setLeadForm({ ...leadForm, doctorId: value })}
              >
                <SelectTrigger data-testid="select-doctor">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={leadForm.productId}
                onValueChange={(value) => setLeadForm({ ...leadForm, productId: value })}
              >
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={leadForm.quantity}
                  onChange={(e) => setLeadForm({ ...leadForm, quantity: e.target.value })}
                  placeholder="1"
                  data-testid="input-quantity"
                />
              </div>
              <div className="grid gap-2">
                <Label>Estimated Value (Rs.)</Label>
                <Input
                  type="number"
                  value={leadForm.estimatedValue}
                  onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })}
                  placeholder="0"
                  data-testid="input-value"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={leadForm.priority}
                  onValueChange={(value) => setLeadForm({ ...leadForm, priority: value })}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={leadForm.followUpDate}
                  onChange={(e) => setLeadForm({ ...leadForm, followUpDate: e.target.value })}
                  data-testid="input-followup"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Input
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                placeholder="e.g., Conference, Referral, Cold Call"
                data-testid="input-source"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                placeholder="Additional notes..."
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!leadForm.doctorId || !leadForm.productId || createMutation.isPending}
              data-testid="button-submit-lead"
            >
              {createMutation.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Sales Lead</DialogTitle>
            <DialogDescription>Update sales opportunity details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Doctor</Label>
              <Select
                value={leadForm.doctorId}
                onValueChange={(value) => setLeadForm({ ...leadForm, doctorId: value })}
              >
                <SelectTrigger data-testid="edit-select-doctor">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={leadForm.productId}
                onValueChange={(value) => setLeadForm({ ...leadForm, productId: value })}
              >
                <SelectTrigger data-testid="edit-select-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={leadForm.quantity}
                  onChange={(e) => setLeadForm({ ...leadForm, quantity: e.target.value })}
                  data-testid="edit-input-quantity"
                />
              </div>
              <div className="grid gap-2">
                <Label>Estimated Value (Rs.)</Label>
                <Input
                  type="number"
                  value={leadForm.estimatedValue}
                  onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })}
                  data-testid="edit-input-value"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={leadForm.priority}
                  onValueChange={(value) => setLeadForm({ ...leadForm, priority: value })}
                >
                  <SelectTrigger data-testid="edit-select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={leadForm.followUpDate}
                  onChange={(e) => setLeadForm({ ...leadForm, followUpDate: e.target.value })}
                  data-testid="edit-input-followup"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Input
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                data-testid="edit-input-source"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                data-testid="edit-input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!leadForm.doctorId || !leadForm.productId || updateMutation.isPending}
              data-testid="button-update-lead"
            >
              {updateMutation.isPending ? "Updating..." : "Update Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
