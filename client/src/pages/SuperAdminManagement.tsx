import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, CreditCard, Shield, Activity, Plus, Edit, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  organization_type_name: string;
  organization_type_code: string;
  email: string;
  phone: string;
  city: string;
  subscription_tier: string;
  subscription_end_date: string;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
}

interface OrganizationType {
  id: string;
  name: string;
  code: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  code: string;
  organization_type_code: string;
  price_monthly: string;
  max_employees: number;
  max_medical_reps: number;
  max_doctors: number;
  included_modules: string[];
}

interface PersonRole {
  roleType: string;
  organizationType: string;
  orgName: string;
  status: string;
  specialty?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  user_type: string;
  is_active: boolean;
  is_super_admin: boolean;
  organization_id: string;
  organization_name: string;
  created_at: string;
  last_login: string;
  person_roles: PersonRole[];
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_email: string;
  user_first_name: string;
  severity: string;
  created_at: string;
  metadata: any;
}

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  activeOrganizations: number;
  expiringSoon: number;
  organizationsByType: { name: string; count: number }[];
  subscriptionDistribution: { subscription_tier: string; count: number }[];
}

export default function SuperAdminManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isExtendSubOpen, setIsExtendSubOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [newOrg, setNewOrg] = useState({
    name: "",
    organizationTypeId: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    subscriptionTier: "basic",
    subscriptionMonths: 3
  });

  const [extensionMonths, setExtensionMonths] = useState(3);
  const [newTier, setNewTier] = useState("");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: organizationTypes } = useQuery<OrganizationType[]>({
    queryKey: ["/api/admin/organization-types"],
  });

  const { data: subscriptionTiers } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/admin/subscription-tiers"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof newOrg) => {
      return apiRequest("POST", "/api/admin/organizations", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Organization created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
      setIsCreateOrgOpen(false);
      setNewOrg({
        name: "",
        organizationTypeId: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        subscriptionTier: "basic",
        subscriptionMonths: 3
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const extendSubMutation = useMutation({
    mutationFn: async ({ orgId, months, tier }: { orgId: string; months: number; tier: string }) => {
      return apiRequest("POST", `/api/admin/organizations/${orgId}/extend-subscription`, { months, tier: tier || undefined });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subscription extended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
      setIsExtendSubOpen(false);
      setSelectedOrg(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const getSubscriptionStatus = (endDate: string) => {
    if (!endDate) return { status: "No Subscription", color: "secondary" as const };
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: "Expired", color: "destructive" as const };
    if (daysLeft <= 7) return { status: `${daysLeft}d left`, color: "destructive" as const };
    if (daysLeft <= 30) return { status: `${daysLeft}d left`, color: "secondary" as const };
    return { status: "Active", color: "default" as const };
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Super Admin Management</h1>
          <p className="text-muted-foreground">Manage organizations, subscriptions, users, and system settings</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Super Admin
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-dashboard">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2" data-testid="tab-organizations">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organizations</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2" data-testid="tab-subscriptions">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscriptions</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2" data-testid="tab-audit">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-orgs">{stats?.totalOrganizations || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-users">{stats?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-orgs">{stats?.activeOrganizations || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500" data-testid="stat-expiring">{stats?.expiringSoon || 0}</div>
                <p className="text-xs text-muted-foreground">Within 30 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organizations by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.organizationsByType?.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{item.name}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.subscriptionDistribution?.map((item) => (
                    <div key={item.subscription_tier} className="flex items-center justify-between">
                      <span className="text-muted-foreground capitalize">{item.subscription_tier || "None"}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Organizations</h2>
            <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-org">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>Add a new organization to the system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="Enter organization name"
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization Type *</Label>
                    <Select
                      value={newOrg.organizationTypeId}
                      onValueChange={(val) => setNewOrg({ ...newOrg, organizationTypeId: val })}
                    >
                      <SelectTrigger data-testid="select-org-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={newOrg.email}
                        onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                        placeholder="Email"
                        data-testid="input-org-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newOrg.phone}
                        onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                        placeholder="Phone"
                        data-testid="input-org-phone"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={newOrg.city}
                        onChange={(e) => setNewOrg({ ...newOrg, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={newOrg.state}
                        onChange={(e) => setNewOrg({ ...newOrg, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subscription Tier</Label>
                      <Select
                        value={newOrg.subscriptionTier}
                        onValueChange={(val) => setNewOrg({ ...newOrg, subscriptionTier: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="golden">Golden</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (months)</Label>
                      <Select
                        value={newOrg.subscriptionMonths.toString()}
                        onValueChange={(val) => setNewOrg({ ...newOrg, subscriptionMonths: parseInt(val) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Month</SelectItem>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOrgOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createOrgMutation.mutate(newOrg)}
                    disabled={!newOrg.name || !newOrg.organizationTypeId || createOrgMutation.isPending}
                    data-testid="button-submit-org"
                  >
                    {createOrgMutation.isPending ? "Creating..." : "Create"}
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
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                    </TableRow>
                  ) : organizations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations?.map((org) => {
                      const subStatus = getSubscriptionStatus(org.subscription_end_date);
                      return (
                        <TableRow key={org.id} data-testid={`row-org-${org.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-sm text-muted-foreground">{org.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{org.organization_type_name}</Badge>
                          </TableCell>
                          <TableCell>{org.city || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className="capitalize">{org.subscription_tier}</Badge>
                              <Badge variant={subStatus.color}>{subStatus.status}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {org.is_suspended ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : org.is_active ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setNewTier(org.subscription_tier);
                                  setIsExtendSubOpen(true);
                                }}
                                data-testid={`button-extend-${org.id}`}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Extend
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={isExtendSubOpen} onOpenChange={setIsExtendSubOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Extend Subscription</DialogTitle>
                <DialogDescription>
                  Extend subscription for {selectedOrg?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <div className="flex gap-2">
                    <Badge className="capitalize">{selectedOrg?.subscription_tier}</Badge>
                    <Badge variant={getSubscriptionStatus(selectedOrg?.subscription_end_date || "").color}>
                      {selectedOrg?.subscription_end_date
                        ? format(new Date(selectedOrg.subscription_end_date), "MMM d, yyyy")
                        : "No expiry"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Extension Duration</Label>
                  <Select
                    value={extensionMonths.toString()}
                    onValueChange={(val) => setExtensionMonths(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Change Tier (Optional)</Label>
                  <Select value={newTier} onValueChange={setNewTier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="golden">Golden</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsExtendSubOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (selectedOrg) {
                      extendSubMutation.mutate({
                        orgId: selectedOrg.id,
                        months: extensionMonths,
                        tier: newTier
                      });
                    }
                  }}
                  disabled={extendSubMutation.isPending}
                >
                  {extendSubMutation.isPending ? "Extending..." : "Extend Subscription"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-xl font-semibold">All Users</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                    </TableRow>
                  ) : users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                              {user.is_super_admin && (
                                <Badge variant="destructive" className="ml-2">Super Admin</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="capitalize">{user.role}</Badge>
                            {user.person_roles?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {user.person_roles.map((pr, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs capitalize">
                                    As {pr.roleType}{pr.specialty ? ` (${pr.specialty})` : ""}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{user.organization_name || "—"}</span>
                            {user.person_roles?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {user.person_roles.map((pr, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {pr.orgName} ({pr.organizationType})
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.last_login
                            ? format(new Date(user.last_login), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          {!user.is_super_admin && (
                            <Button
                              size="sm"
                              variant={user.is_active ? "destructive" : "default"}
                              onClick={() => toggleUserActiveMutation.mutate({
                                userId: user.id,
                                isActive: !user.is_active
                              })}
                              disabled={toggleUserActiveMutation.isPending}
                              data-testid={`button-toggle-user-${user.id}`}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {["pharma_company", "hospital", "clinic"].map((orgType) => (
              <Card key={orgType}>
                <CardHeader>
                  <CardTitle className="capitalize">{orgType.replace("_", " ")}</CardTitle>
                  <CardDescription>Available subscription tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptionTiers
                      ?.filter((t) => t.organization_type_code === orgType)
                      .map((tier) => (
                        <div key={tier.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{tier.name}</span>
                            <Badge variant="secondary">Rs {parseInt(tier.price_monthly).toLocaleString()}/mo</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {tier.max_employees && (
                              <div>Max Employees: {tier.max_employees}</div>
                            )}
                            {tier.max_medical_reps && (
                              <div>Max MRs: {tier.max_medical_reps}</div>
                            )}
                            {tier.max_doctors && (
                              <div>Max Doctors: {tier.max_doctors}</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tier.included_modules?.slice(0, 4).map((mod) => (
                                <Badge key={mod} variant="outline" className="text-xs">{mod}</Badge>
                              ))}
                              {tier.included_modules?.length > 4 && (
                                <Badge variant="outline" className="text-xs">+{tier.included_modules.length - 4}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-xl font-semibold">Audit Logs</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                    </TableRow>
                  ) : auditLogs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {log.created_at ? format(new Date(log.created_at), "MMM d, yyyy HH:mm") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.user_email || "System"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{log.action.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{log.entity_type}</span>
                          <span className="text-muted-foreground text-xs ml-1">#{log.entity_id?.slice(0, 8)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.severity === "error" ? "destructive" :
                              log.severity === "warning" ? "secondary" : "outline"
                            }
                          >
                            {log.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
