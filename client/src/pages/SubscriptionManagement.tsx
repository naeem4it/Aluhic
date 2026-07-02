import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, CreditCard, Users, Building2, Crown, Calendar, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import type { Subscription, SubscriptionPlan, User, Company } from "@shared/schema";

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const [isPlansDialogOpen, setIsPlansDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    priceMonthly: "",
    priceYearly: "",
    maxUsers: "",
    maxFacilities: "",
    isActive: true,
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    userId: "",
    companyId: "",
    planId: "",
    status: "active",
    billingCycle: "monthly",
    amount: "",
    notes: "",
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/subscription-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Plan created successfully" });
      setIsPlansDialogOpen(false);
      resetPlanForm();
    },
    onError: () => {
      toast({ title: "Failed to create plan", variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/subscription-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Plan updated successfully" });
      setIsPlansDialogOpen(false);
      setEditingPlan(null);
      resetPlanForm();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/subscription-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Plan deleted successfully" });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/subscriptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({ title: "Subscription created successfully" });
      setIsSubscriptionDialogOpen(false);
      resetSubscriptionForm();
    },
    onError: () => {
      toast({ title: "Failed to create subscription", variant: "destructive" });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/subscriptions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({ title: "Subscription updated successfully" });
      setIsSubscriptionDialogOpen(false);
      setEditingSubscription(null);
      resetSubscriptionForm();
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({ title: "Subscription deleted successfully" });
    },
  });

  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      description: "",
      priceMonthly: "",
      priceYearly: "",
      maxUsers: "",
      maxFacilities: "",
      isActive: true,
    });
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      userId: "",
      companyId: "",
      planId: "",
      status: "active",
      billingCycle: "monthly",
      amount: "",
      notes: "",
    });
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      priceMonthly: plan.priceMonthly || "",
      priceYearly: plan.priceYearly || "",
      maxUsers: plan.maxUsers?.toString() || "",
      maxFacilities: plan.maxFacilities?.toString() || "",
      isActive: plan.isActive,
    });
    setIsPlansDialogOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      userId: subscription.userId || "",
      companyId: subscription.companyId || "",
      planId: subscription.planId,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      amount: subscription.amount || "",
      notes: subscription.notes || "",
    });
    setIsSubscriptionDialogOpen(true);
  };

  const handlePlanSubmit = () => {
    const data = {
      ...planForm,
      priceMonthly: planForm.priceMonthly,
      priceYearly: planForm.priceYearly || null,
      maxUsers: planForm.maxUsers ? parseInt(planForm.maxUsers) : null,
      maxFacilities: planForm.maxFacilities ? parseInt(planForm.maxFacilities) : null,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleSubscriptionSubmit = () => {
    const data = {
      ...subscriptionForm,
      userId: subscriptionForm.userId || null,
      companyId: subscriptionForm.companyId || null,
    };

    if (editingSubscription) {
      updateSubscriptionMutation.mutate({ id: editingSubscription.id, data });
    } else {
      createSubscriptionMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      active: { label: "Active", variant: "default" },
      trial: { label: "Trial", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      expired: { label: "Expired", variant: "destructive" },
    };
    const { label, variant } = config[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getUserDisplay = (userId: string | null) => {
    if (!userId) return "N/A";
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : userId;
  };

  const getCompanyDisplay = (companyId: string | null) => {
    if (!companyId) return "N/A";
    const company = companies.find((c) => c.id === companyId);
    return company?.name || companyId;
  };

  const getPlanDisplay = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || planId;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchTerm) return true;
    const userDisplay = getUserDisplay(sub.userId);
    const companyDisplay = getCompanyDisplay(sub.companyId);
    const planDisplay = getPlanDisplay(sub.planId);
    return (
      userDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companyDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planDisplay.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Crown className="h-7 w-7 text-primary" />
          Subscription Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage subscription plans and user subscriptions
        </p>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">
            <Crown className="h-4 w-4 mr-2" />
            Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-subscriptions"
              />
            </div>
            <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingSubscription(null); resetSubscriptionForm(); }} data-testid="button-add-subscription">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingSubscription ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
                  <DialogDescription>
                    {editingSubscription ? "Update subscription details" : "Create a new subscription"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>User (Optional)</Label>
                    <Select value={subscriptionForm.userId} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, userId: v })}>
                      <SelectTrigger data-testid="select-subscription-user">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Company (Optional)</Label>
                    <Select value={subscriptionForm.companyId} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, companyId: v })}>
                      <SelectTrigger data-testid="select-subscription-company">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Plan *</Label>
                    <Select value={subscriptionForm.planId} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, planId: v })}>
                      <SelectTrigger data-testid="select-subscription-plan">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - Rs. {plan.priceMonthly}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select value={subscriptionForm.status} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, status: v })}>
                        <SelectTrigger data-testid="select-subscription-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Billing Cycle</Label>
                      <Select value={subscriptionForm.billingCycle} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, billingCycle: v })}>
                        <SelectTrigger data-testid="select-subscription-billing">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Amount (Rs.)</Label>
                    <Input
                      type="number"
                      value={subscriptionForm.amount}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-subscription-amount"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={subscriptionForm.notes}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })}
                      placeholder="Additional notes..."
                      data-testid="input-subscription-notes"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubscriptionSubmit} disabled={!subscriptionForm.planId || !subscriptionForm.amount} data-testid="button-save-subscription">
                    {editingSubscription ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User/Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading subscriptions...
                      </TableCell>
                    </TableRow>
                  ) : filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            {sub.userId && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{getUserDisplay(sub.userId)}</span>}
                            {sub.companyId && <span className="flex items-center gap-1 text-muted-foreground text-sm"><Building2 className="h-3 w-3" />{getCompanyDisplay(sub.companyId)}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getPlanDisplay(sub.planId)}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="capitalize">{sub.billingCycle}</TableCell>
                        <TableCell className="text-right font-medium">Rs. {sub.amount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSubscription(sub)} data-testid={`button-edit-subscription-${sub.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteSubscriptionMutation.mutate(sub.id)} data-testid={`button-delete-subscription-${sub.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPlansDialogOpen} onOpenChange={setIsPlansDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingPlan(null); resetPlanForm(); }} data-testid="button-add-plan">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit Plan" : "Add Plan"}</DialogTitle>
                  <DialogDescription>
                    {editingPlan ? "Update subscription plan details" : "Create a new subscription plan"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Plan Name *</Label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g., Professional"
                      data-testid="input-plan-name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Plan description..."
                      data-testid="input-plan-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monthly Price (Rs.) *</Label>
                      <Input
                        type="number"
                        value={planForm.priceMonthly}
                        onChange={(e) => setPlanForm({ ...planForm, priceMonthly: e.target.value })}
                        placeholder="0.00"
                        data-testid="input-plan-price-monthly"
                      />
                    </div>
                    <div>
                      <Label>Yearly Price (Rs.)</Label>
                      <Input
                        type="number"
                        value={planForm.priceYearly}
                        onChange={(e) => setPlanForm({ ...planForm, priceYearly: e.target.value })}
                        placeholder="0.00"
                        data-testid="input-plan-price-yearly"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Users</Label>
                      <Input
                        type="number"
                        value={planForm.maxUsers}
                        onChange={(e) => setPlanForm({ ...planForm, maxUsers: e.target.value })}
                        placeholder="Unlimited"
                        data-testid="input-plan-max-users"
                      />
                    </div>
                    <div>
                      <Label>Max Facilities</Label>
                      <Input
                        type="number"
                        value={planForm.maxFacilities}
                        onChange={(e) => setPlanForm({ ...planForm, maxFacilities: e.target.value })}
                        placeholder="Unlimited"
                        data-testid="input-plan-max-facilities"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsPlansDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePlanSubmit} disabled={!planForm.name || !planForm.priceMonthly} data-testid="button-save-plan">
                    {editingPlan ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plansLoading ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading plans...
                </CardContent>
              </Card>
            ) : plans.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No subscription plans found. Create your first plan.
                </CardContent>
              </Card>
            ) : (
              plans.map((plan) => (
                <Card key={plan.id} className={!plan.isActive ? "opacity-50" : ""} data-testid={`card-plan-${plan.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-primary" />
                          {plan.name}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      Rs. {plan.priceMonthly}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    {plan.priceYearly && (
                      <p className="text-sm text-muted-foreground">
                        Rs. {plan.priceYearly}/year
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.maxUsers ? `${plan.maxUsers} users` : "Unlimited users"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.maxFacilities ? `${plan.maxFacilities} facilities` : "Unlimited facilities"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)} className="flex-1" data-testid={`button-edit-plan-${plan.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deletePlanMutation.mutate(plan.id)} data-testid={`button-delete-plan-${plan.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
