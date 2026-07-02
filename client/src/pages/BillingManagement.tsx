import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Receipt, Search, Settings, FileText, Plus, DollarSign, CreditCard, Clock, CheckCircle, AlertTriangle, User, Calendar, Loader2, Trash2 } from "lucide-react";
import type { PatientInvoice, FacilityBillingConfig } from "@shared/schema";

const billingConfigSchema = z.object({
  invoicePrefix: z.string().max(10).optional(),
  receiptPrefix: z.string().max(10).optional(),
  currency: z.string().max(3).optional(),
  enableGST: z.boolean().optional(),
  gstPercentage: z.string().optional(),
  acceptCash: z.boolean().optional(),
  acceptCard: z.boolean().optional(),
  acceptOnlinePayment: z.boolean().optional(),
  acceptInsurance: z.boolean().optional(),
});

type BillingConfigFormData = z.infer<typeof billingConfigSchema>;

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Price must be positive"),
  amount: z.number().nonnegative(),
  category: z.string().optional(),
});

const createInvoiceSchema = z.object({
  personId: z.string().min(1, "Patient ID required"),
  visitType: z.enum(["opd", "ipd", "lab", "pharmacy", "emergency"]).optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
  notes: z.string().optional(),
});

type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export default function BillingManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);

  const { data: billingConfig, isLoading: loadingConfig } = useQuery<FacilityBillingConfig>({
    queryKey: ["/api/billing/config"],
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<PatientInvoice[]>({
    queryKey: ["/api/invoices"],
  });

  const pendingInvoices = invoices.filter((inv) => inv.status === "pending");
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");

  const configForm = useForm<BillingConfigFormData>({
    resolver: zodResolver(billingConfigSchema),
    defaultValues: {
      invoicePrefix: "INV",
      receiptPrefix: "RCP",
      currency: "PKR",
      enableGST: false,
      gstPercentage: "0",
      acceptCash: true,
      acceptCard: true,
      acceptOnlinePayment: false,
      acceptInsurance: false,
    },
  });

  useEffect(() => {
    if (billingConfig) {
      configForm.reset({
        invoicePrefix: billingConfig.invoicePrefix || "INV",
        receiptPrefix: billingConfig.receiptPrefix || "RCP",
        currency: billingConfig.currency || "PKR",
        enableGST: billingConfig.enableGST ?? false,
        gstPercentage: billingConfig.gstPercentage || "0",
        acceptCash: billingConfig.acceptCash ?? true,
        acceptCard: billingConfig.acceptCard ?? true,
        acceptOnlinePayment: billingConfig.acceptOnlinePayment ?? false,
        acceptInsurance: billingConfig.acceptInsurance ?? false,
      });
    }
  }, [billingConfig, configForm]);

  const invoiceForm = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      personId: "",
      visitType: "opd",
      lineItems: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: invoiceForm.control,
    name: "lineItems",
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (config: BillingConfigFormData) => {
      return apiRequest("POST", "/api/billing/config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/config"] });
      toast({ title: "Settings saved", description: "Billing configuration updated successfully" });
      setShowConfigDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save settings", variant: "destructive" });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: CreateInvoiceFormData) => {
      return apiRequest("POST", "/api/invoices", invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice created", description: "New invoice has been created successfully" });
      setShowNewInvoiceDialog(false);
      invoiceForm.reset({ personId: "", visitType: "opd", lineItems: [], notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create invoice", variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      return apiRequest("PATCH", `/api/invoices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice updated", description: "Invoice has been updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update invoice", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "partial":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><DollarSign className="w-3 h-3 mr-1" /> Partial</Badge>;
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterInvoices = (list: PatientInvoice[]) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.personId?.toLowerCase().includes(term)
    );
  };

  const addLineItem = () => {
    append({ description: "", quantity: 1, unitPrice: 0, amount: 0, category: "service" });
  };

  const watchLineItems = invoiceForm.watch("lineItems");

  const handleMarkAsPaid = (invoice: PatientInvoice) => {
    updateInvoiceMutation.mutate({
      id: invoice.id,
      paidAmount: invoice.totalAmount,
      status: "paid",
      paymentMethod: "cash",
    });
  };

  const onConfigSubmit = (data: BillingConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  const onInvoiceSubmit = (data: CreateInvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);
  const pendingAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.balanceAmount || "0"), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Billing & Invoices
          </h1>
          <p className="text-muted-foreground">Manage facility billing and patient invoices</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowConfigDialog(true)} data-testid="btn-billing-settings">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <Button onClick={() => setShowNewInvoiceDialog(true)} data-testid="btn-new-invoice">
            <Plus className="w-4 h-4 mr-1" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-invoices">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-invoices">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-pending-invoices">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">{pendingInvoices.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-revenue">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-revenue">
              {billingConfig?.currency || "PKR"} {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-pending-amount">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-amount">
              {billingConfig?.currency || "PKR"} {pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-invoices"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" data-testid="tab-all-invoices">
            <FileText className="w-4 h-4 mr-1" />
            All Invoices
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="w-4 h-4 mr-1" />
            Pending ({pendingInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="paid" data-testid="tab-paid">
            <CheckCircle className="w-4 h-4 mr-1" />
            Paid ({paidInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filterInvoices(invoices).length > 0 ? (
            <div className="space-y-3">
              {filterInvoices(invoices).map((invoice) => (
                <Card key={invoice.id} className="hover-elevate" data-testid={`invoice-${invoice.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" />
                            Patient: {invoice.personId?.slice(-8)}
                            <span className="mx-1">•</span>
                            <Calendar className="w-3 h-3" />
                            {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{billingConfig?.currency || "PKR"} {parseFloat(invoice.totalAmount || "0").toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid: {parseFloat(invoice.paidAmount || "0").toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                        {invoice.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice)}
                            disabled={updateInvoiceMutation.isPending}
                            data-testid={`btn-mark-paid-${invoice.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Receipt className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No invoices found</p>
                <Button className="mt-4" onClick={() => setShowNewInvoiceDialog(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Invoice
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {filterInvoices(pendingInvoices).length > 0 ? (
            <div className="space-y-3">
              {filterInvoices(pendingInvoices).map((invoice) => (
                <Card key={invoice.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">Patient: {invoice.personId?.slice(-8)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{billingConfig?.currency || "PKR"} {parseFloat(invoice.totalAmount || "0").toLocaleString()}</p>
                        </div>
                        <Button size="sm" onClick={() => handleMarkAsPaid(invoice)}>
                          <CreditCard className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                <p className="text-muted-foreground">No pending invoices</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          {filterInvoices(paidInvoices).length > 0 ? (
            <div className="space-y-3">
              {filterInvoices(paidInvoices).map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">Patient: {invoice.personId?.slice(-8)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-green-600">{billingConfig?.currency || "PKR"} {parseFloat(invoice.totalAmount || "0").toLocaleString()}</p>
                        {getStatusBadge("paid")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Receipt className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No paid invoices</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Billing Settings
            </DialogTitle>
          </DialogHeader>
          
          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={configForm.control}
                  name="invoicePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Prefix</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-invoice-prefix" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="receiptPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Prefix</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-receipt-prefix" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={configForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-currency" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={configForm.control}
                name="enableGST"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Enable GST</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enable-gst"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={configForm.control}
                name="gstPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Percentage</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-gst-percentage" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Payment Methods</FormLabel>
                <FormField
                  control={configForm.control}
                  name="acceptCash"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <span className="text-sm">Accept Cash</span>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="acceptCard"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <span className="text-sm">Accept Card</span>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="acceptOnlinePayment"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <span className="text-sm">Accept Online Payment</span>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="acceptInsurance"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <span className="text-sm">Accept Insurance</span>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={updateConfigMutation.isPending} data-testid="btn-save-settings">
                  {updateConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Save Settings
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Invoice
            </DialogTitle>
          </DialogHeader>
          
          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(onInvoiceSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient ID" {...field} data-testid="input-patient-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={invoiceForm.control}
                  name="visitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-visit-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="opd">OPD</SelectItem>
                          <SelectItem value="ipd">IPD</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Line Items</FormLabel>
                  <Button type="button" size="sm" variant="outline" onClick={addLineItem} data-testid="btn-add-line-item">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {fields.length > 0 ? (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Input
                          placeholder="Description"
                          {...invoiceForm.register(`lineItems.${index}.description`)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          defaultValue={1}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            const price = watchLineItems[index]?.unitPrice || 0;
                            invoiceForm.setValue(`lineItems.${index}.quantity`, qty);
                            invoiceForm.setValue(`lineItems.${index}.amount`, qty * price);
                          }}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          defaultValue={0}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            const qty = watchLineItems[index]?.quantity || 0;
                            invoiceForm.setValue(`lineItems.${index}.unitPrice`, price);
                            invoiceForm.setValue(`lineItems.${index}.amount`, qty * price);
                          }}
                          className="w-24"
                        />
                        <input type="hidden" {...invoiceForm.register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
                        <input type="hidden" {...invoiceForm.register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                        <input type="hidden" {...invoiceForm.register(`lineItems.${index}.amount`, { valueAsNumber: true })} />
                        <div className="w-24 text-right font-medium">
                          {(watchLineItems[index]?.amount || 0).toLocaleString()}
                        </div>
                        <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end p-2 border-t">
                      <span className="font-bold">
                        Total: {billingConfig?.currency || "PKR"} {watchLineItems.reduce((sum, item) => sum + (item?.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground bg-muted/50 rounded">
                    No items added yet. Click "Add Item" to start.
                  </div>
                )}
                {invoiceForm.formState.errors.lineItems && (
                  <p className="text-sm text-destructive mt-1">{invoiceForm.formState.errors.lineItems.message}</p>
                )}
              </div>
              
              <FormField
                control={invoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional notes..." {...field} data-testid="input-invoice-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createInvoiceMutation.isPending} data-testid="btn-create-invoice">
                  {createInvoiceMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Create Invoice
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
