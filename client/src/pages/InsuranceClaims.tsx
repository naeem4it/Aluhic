import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Plus, FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Building2, User } from "lucide-react";
import { format } from "date-fns";

const providerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  website: z.string().optional()
});

const claimFormSchema = z.object({
  policyId: z.string().min(1, "Policy is required"),
  personId: z.string().optional(),
  claimType: z.enum(["opd", "ipd", "surgery", "diagnostic", "pharmacy"]),
  serviceDate: z.string().min(1, "Service date is required"),
  totalBillAmount: z.string().min(1, "Bill amount is required"),
  claimedAmount: z.string().min(1, "Claimed amount is required"),
  diagnosisCodes: z.string().optional(),
  procedureCodes: z.string().optional()
});

type ProviderFormData = z.infer<typeof providerFormSchema>;
type ClaimFormData = z.infer<typeof claimFormSchema>;

export default function InsuranceClaims() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("claims");
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const providerForm = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: "",
      code: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      website: ""
    }
  });

  const claimForm = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policyId: "",
      personId: "",
      claimType: "opd",
      serviceDate: new Date().toISOString().split("T")[0],
      totalBillAmount: "",
      claimedAmount: "",
      diagnosisCodes: "",
      procedureCodes: ""
    }
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery<any[]>({
    queryKey: ["/api/insurance/providers"]
  });

  const statusQuery = statusFilter === "all" ? "" : `?status=${statusFilter}`;
  const { data: claims = [], isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ["/api/insurance/claims" + statusQuery]
  });

  const { data: policies = [] } = useQuery<any[]>({
    queryKey: ["/api/insurance/policies"]
  });

  const { data: persons = [] } = useQuery<any[]>({
    queryKey: ["/api/persons"]
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: ProviderFormData) => {
      return apiRequest("/api/insurance/providers", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          email: data.email || null
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/providers"] });
      toast({ title: "Insurance provider added successfully" });
      setIsProviderDialogOpen(false);
      providerForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add provider", description: error.message, variant: "destructive" });
    }
  });

  const createClaimMutation = useMutation({
    mutationFn: async (data: ClaimFormData) => {
      const policy = policies.find((p: any) => p.id === data.policyId);
      return apiRequest("/api/insurance/claims", {
        method: "POST",
        body: JSON.stringify({
          organizationId: user?.organizationId,
          policyId: data.policyId,
          personId: policy?.personId || data.personId,
          claimType: data.claimType,
          serviceDate: data.serviceDate,
          totalBillAmount: data.totalBillAmount,
          claimedAmount: data.claimedAmount,
          diagnosisCodes: data.diagnosisCodes ? data.diagnosisCodes.split(",").map(c => c.trim()) : [],
          procedureCodes: data.procedureCodes ? data.procedureCodes.split(",").map(c => c.trim()) : []
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims"] });
      toast({ title: "Insurance claim created successfully" });
      setIsClaimDialogOpen(false);
      claimForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create claim", description: error.message, variant: "destructive" });
    }
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/insurance/claims/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims"] });
      toast({ title: "Claim updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update claim", description: error.message, variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/10 text-gray-500",
      submitted: "bg-blue-500/10 text-blue-500",
      under_review: "bg-yellow-500/10 text-yellow-500",
      approved: "bg-green-500/10 text-green-500",
      partially_approved: "bg-orange-500/10 text-orange-500",
      denied: "bg-red-500/10 text-red-500",
      paid: "bg-emerald-500/10 text-emerald-500"
    };
    return <Badge className={colors[status] || ""} data-testid={`badge-claim-status-${status}`}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const getClaimTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      opd: "bg-blue-500/10 text-blue-500",
      ipd: "bg-purple-500/10 text-purple-500",
      surgery: "bg-red-500/10 text-red-500",
      diagnostic: "bg-cyan-500/10 text-cyan-500",
      pharmacy: "bg-green-500/10 text-green-500"
    };
    return <Badge className={colors[type] || ""} data-testid={`badge-claim-type-${type}`}>{type.toUpperCase()}</Badge>;
  };

  const draftCount = claims.filter((c: any) => c.status === "draft").length;
  const submittedCount = claims.filter((c: any) => c.status === "submitted" || c.status === "under_review").length;
  const approvedCount = claims.filter((c: any) => c.status === "approved" || c.status === "partially_approved").length;
  const totalClaimedAmount = claims.reduce((sum: number, c: any) => sum + (parseFloat(c.claimedAmount) || 0), 0);

  const getPersonName = (personId: string) => {
    const person = persons.find((p: any) => p.id === personId);
    return person ? `${person.firstName} ${person.lastName}` : personId;
  };

  const getProviderName = (policyId: string) => {
    const policy = policies.find((p: any) => p.id === policyId);
    if (!policy) return "Unknown";
    const provider = providers.find((pr: any) => pr.id === policy.providerId);
    return provider?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6" data-testid="insurance-claims-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Insurance Claims</h1>
          <p className="text-muted-foreground">Manage insurance providers, policies, and claims</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-provider">
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Insurance Provider</DialogTitle>
              </DialogHeader>
              <Form {...providerForm}>
                <form onSubmit={providerForm.handleSubmit((data) => createProviderMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={providerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., State Life Insurance" data-testid="input-provider-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={providerForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., SLI" data-testid="input-provider-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={providerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Contact number" data-testid="input-provider-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={providerForm.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Name of contact person" data-testid="input-contact-person" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={providerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="claims@insurance.com" data-testid="input-provider-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={providerForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Office address" data-testid="input-provider-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createProviderMutation.isPending} data-testid="button-submit-provider">
                    {createProviderMutation.isPending ? "Adding..." : "Add Provider"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-claim">
                <FileText className="w-4 h-4 mr-2" />
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Insurance Claim</DialogTitle>
              </DialogHeader>
              <Form {...claimForm}>
                <form onSubmit={claimForm.handleSubmit((data) => createClaimMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={claimForm.control}
                      name="policyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Policy</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-policy">
                                <SelectValue placeholder="Select policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {policies.map((policy: any) => (
                                <SelectItem key={policy.id} value={policy.id}>
                                  {policy.policyNumber} - {getPersonName(policy.personId)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={claimForm.control}
                      name="claimType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Claim Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-claim-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="opd">OPD</SelectItem>
                              <SelectItem value="ipd">IPD</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="diagnostic">Diagnostic</SelectItem>
                              <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={claimForm.control}
                    name="serviceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-service-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={claimForm.control}
                      name="totalBillAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Bill Amount (PKR)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" data-testid="input-total-bill" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={claimForm.control}
                      name="claimedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Claimed Amount (PKR)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" data-testid="input-claimed-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={claimForm.control}
                    name="diagnosisCodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis Codes (comma-separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., K35.80, K65.0" data-testid="input-diagnosis-codes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={claimForm.control}
                    name="procedureCodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Codes (comma-separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 44960, 49000" data-testid="input-procedure-codes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createClaimMutation.isPending} data-testid="button-submit-claim">
                    {createClaimMutation.isPending ? "Creating..." : "Create Claim"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-draft-claims">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-count">{draftCount}</div>
            <p className="text-xs text-muted-foreground">pending submission</p>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-claims">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">awaiting decision</p>
          </CardContent>
        </Card>
        <Card data-testid="card-approved-claims">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-approved-count">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">claims approved</p>
          </CardContent>
        </Card>
        <Card data-testid="card-total-claimed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claimed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-claimed">PKR {totalClaimedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">all claims</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="claims" data-testid="tab-claims">Claims</TabsTrigger>
          <TabsTrigger value="providers" data-testid="tab-providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="partially_approved">Partially Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {claimsLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-claims">Loading claims...</div>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No insurance claims</h3>
                <p className="text-muted-foreground mb-4">Create your first claim to get started</p>
                <Button onClick={() => setIsClaimDialogOpen(true)} data-testid="button-create-first-claim">
                  <Plus className="w-4 h-4 mr-2" />
                  New Claim
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim: any) => (
                <Card key={claim.id} data-testid={`card-claim-${claim.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-muted-foreground" data-testid={`text-claim-number-${claim.id}`}>
                            {claim.claimNumber}
                          </span>
                          {getStatusBadge(claim.status)}
                          {getClaimTypeBadge(claim.claimType)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span data-testid={`text-patient-${claim.id}`}>{getPersonName(claim.personId)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{getProviderName(claim.policyId)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span data-testid={`text-date-${claim.id}`}>
                              {format(new Date(claim.serviceDate), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-6">
                          <div>
                            <span className="text-xs text-muted-foreground">Bill Amount</span>
                            <p className="font-semibold" data-testid={`text-bill-${claim.id}`}>PKR {parseFloat(claim.totalBillAmount || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Claimed</span>
                            <p className="font-semibold" data-testid={`text-claimed-${claim.id}`}>PKR {parseFloat(claim.claimedAmount || 0).toLocaleString()}</p>
                          </div>
                          {claim.approvedAmount && (
                            <div>
                              <span className="text-xs text-muted-foreground">Approved</span>
                              <p className="font-semibold text-green-600">PKR {parseFloat(claim.approvedAmount).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {claim.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => updateClaimMutation.mutate({ id: claim.id, data: { status: "submitted" } })}
                            disabled={updateClaimMutation.isPending}
                            data-testid={`button-submit-claim-${claim.id}`}
                          >
                            Submit
                          </Button>
                        )}
                        {claim.status === "submitted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateClaimMutation.mutate({ id: claim.id, data: { status: "under_review" } })}
                            disabled={updateClaimMutation.isPending}
                            data-testid={`button-review-${claim.id}`}
                          >
                            Mark Under Review
                          </Button>
                        )}
                        {claim.status === "under_review" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateClaimMutation.mutate({ 
                                id: claim.id, 
                                data: { status: "approved", approvedAmount: claim.claimedAmount } 
                              })}
                              disabled={updateClaimMutation.isPending}
                              data-testid={`button-approve-${claim.id}`}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateClaimMutation.mutate({ id: claim.id, data: { status: "denied" } })}
                              disabled={updateClaimMutation.isPending}
                              data-testid={`button-deny-${claim.id}`}
                            >
                              Deny
                            </Button>
                          </>
                        )}
                        {(claim.status === "approved" || claim.status === "partially_approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateClaimMutation.mutate({ 
                              id: claim.id, 
                              data: { status: "paid", paidAmount: claim.approvedAmount || claim.claimedAmount } 
                            })}
                            disabled={updateClaimMutation.isPending}
                            data-testid={`button-mark-paid-${claim.id}`}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          {providersLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-providers">Loading providers...</div>
          ) : providers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No insurance providers</h3>
                <p className="text-muted-foreground mb-4">Add your first insurance company to get started</p>
                <Button onClick={() => setIsProviderDialogOpen(true)} data-testid="button-add-first-provider">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Provider
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider: any) => (
                <Card key={provider.id} data-testid={`card-provider-${provider.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg" data-testid={`text-provider-name-${provider.id}`}>{provider.name}</CardTitle>
                      <Badge variant={provider.isActive ? "default" : "secondary"} data-testid={`badge-provider-status-${provider.id}`}>
                        {provider.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {provider.code && (
                      <span className="text-sm text-muted-foreground">Code: {provider.code}</span>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {provider.contactPerson && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{provider.contactPerson}</span>
                      </div>
                    )}
                    {provider.phone && (
                      <div className="text-sm text-muted-foreground">{provider.phone}</div>
                    )}
                    {provider.email && (
                      <div className="text-sm text-muted-foreground">{provider.email}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
