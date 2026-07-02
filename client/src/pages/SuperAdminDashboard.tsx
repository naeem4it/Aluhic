import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { 
  Building2, Users, Crown, CreditCard, AlertTriangle, 
  Activity, TrendingUp, Calendar, Shield, Clock,
  DollarSign, MapPin, Briefcase, UserCheck, Package,
  ChevronRight, Target, BarChart3, Pill
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSubscriptions: number;
  trialAccounts: number;
  expiringSoon: number;
  recentSignups: number;
  tierDistribution: { tier: string; count: number }[];
  orgTypeDistribution: { type: string; count: number }[];
}

const TIER_COLORS = {
  basic: "#94a3b8",
  silver: "#a1a1aa",
  golden: "#fbbf24",
  custom: "#8b5cf6"
};

const ORG_TYPE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/dashboard-stats"],
  });

  const { data: organizations } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: salesByTerritory } = useQuery<any[]>({
    queryKey: ["/api/reports/by-territory"],
  });

  const { data: salesByProduct } = useQuery<any[]>({
    queryKey: ["/api/reports/by-product"],
  });

  const now = new Date();
  const expiringOrgs = organizations?.filter((org: any) => {
    if (!org.subscription_end_date) return false;
    const endDate = new Date(org.subscription_end_date);
    const daysUntilExpiry = differenceInDays(endDate, now);
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).sort((a: any, b: any) => {
    return new Date(a.subscription_end_date).getTime() - new Date(b.subscription_end_date).getTime();
  }) || [];

  const expiredOrgs = organizations?.filter((org: any) => {
    if (!org.subscription_end_date) return false;
    return isBefore(new Date(org.subscription_end_date), now);
  }) || [];

  const pharmaOrgs = organizations?.filter((org: any) => 
    org.organization_type_code === "pharma" || org.organization_type_name?.toLowerCase().includes("pharma")
  ) || [];

  const hospitalOrgs = organizations?.filter((org: any) => 
    org.organization_type_code === "hospital" || org.organization_type_name?.toLowerCase().includes("hospital")
  ) || [];

  const clinicOrgs = organizations?.filter((org: any) => 
    org.organization_type_code === "clinic" || org.organization_type_name?.toLowerCase().includes("clinic")
  ) || [];

  const medicalReps = users?.filter((u: any) => u.role === "medical_rep") || [];
  const doctors = users?.filter((u: any) => u.role === "doctor") || [];
  const companyAdmins = users?.filter((u: any) => u.role === "company_admin") || [];

  const tierData = stats?.subscriptionDistribution?.map((t: any) => ({
    name: (t.subscription_tier || "basic").charAt(0).toUpperCase() + (t.subscription_tier || "basic").slice(1),
    value: Number(t.count),
    color: TIER_COLORS[t.subscription_tier as keyof typeof TIER_COLORS] || TIER_COLORS.basic
  })) || [];

  const orgTypeData = stats?.organizationsByType?.map((o: any, idx: number) => ({
    name: o.name.charAt(0).toUpperCase() + o.name.slice(1),
    value: Number(o.count),
    color: ORG_TYPE_COLORS[idx % ORG_TYPE_COLORS.length]
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage the entire Alhuic platform
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1" data-testid="badge-super-admin">
          <Crown className="h-3 w-3" />
          Super Admin
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-organizations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" /> {pharmaOrgs.length} Pharma
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {hospitalOrgs.length} Hospitals
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {clinicOrgs.length} Clinics
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span>{medicalReps.length} MRs</span>
              <span>{doctors.length} Doctors</span>
              <span>{companyAdmins.length} Admins</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.trialAccounts || 0} on trial
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-expiring-soon" className={expiringOrgs.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${expiringOrgs.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${expiringOrgs.length > 0 ? "text-destructive" : ""}`}>
              {expiringOrgs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {expiredOrgs.length} already expired
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="pharma" data-testid="tab-pharma">Pharma Sales</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-subscription-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Subscription Tiers
                </CardTitle>
                <CardDescription>Distribution of subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                {tierData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tierData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {tierData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No subscription data</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-organization-types">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Types
                </CardTitle>
                <CardDescription>Breakdown by organization type</CardDescription>
              </CardHeader>
              <CardContent>
                {orgTypeData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orgTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {orgTypeData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No organization data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-recent-organizations">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Organizations
                  </CardTitle>
                  <CardDescription>Newly registered organizations</CardDescription>
                </div>
                <Link href="/admin/super-admin">
                  <Button variant="outline" size="sm" data-testid="button-view-all-orgs">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {organizations?.slice(0, 5).map((org: any) => (
                      <div key={org.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{org.organization_type_name || org.type}</p>
                        </div>
                        <Badge variant="outline">{org.subscription_tier || "basic"}</Badge>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-sm">No recent organizations</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-users">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Users
                  </CardTitle>
                  <CardDescription>Newly registered users</CardDescription>
                </div>
                <Link href="/admin/super-admin">
                  <Button variant="outline" size="sm" data-testid="button-view-all-users">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {users?.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-sm">No recent users</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-expiring-subscriptions" className={expiringOrgs.length > 0 ? "border-amber-500/50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Expiring Within 30 Days
                </CardTitle>
                <CardDescription>Organizations needing subscription renewal</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {expiringOrgs.length > 0 ? (
                    <div className="space-y-3">
                      {expiringOrgs.map((org: any) => {
                        const endDate = new Date(org.subscription_end_date);
                        const daysLeft = differenceInDays(endDate, now);
                        return (
                          <div key={org.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Expires: {format(endDate, "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"}>
                                {daysLeft} days
                              </Badge>
                              <Link href={`/admin/super-admin`}>
                                <Button size="icon" variant="ghost">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-2 opacity-50" />
                      <p>No subscriptions expiring soon</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card data-testid="card-expired-subscriptions" className={expiredOrgs.length > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Expired Subscriptions
                </CardTitle>
                <CardDescription>Organizations with expired subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {expiredOrgs.length > 0 ? (
                    <div className="space-y-3">
                      {expiredOrgs.map((org: any) => {
                        const endDate = new Date(org.subscription_end_date);
                        const daysAgo = Math.abs(differenceInDays(now, endDate));
                        return (
                          <div key={org.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Expired: {format(endDate, "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">
                                {daysAgo} days ago
                              </Badge>
                              <Link href={`/admin/super-admin`}>
                                <Button size="icon" variant="ghost">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <UserCheck className="h-12 w-12 mb-2 opacity-50" />
                      <p>All subscriptions are active</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-tier-breakdown">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Tier Details
              </CardTitle>
              <CardDescription>All organizations by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {["basic", "silver", "golden", "custom"].map((tier) => {
                  const tierOrgs = organizations?.filter((o: any) => (o.subscription_tier || "basic") === tier) || [];
                  return (
                    <div key={tier} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={tier === "custom" ? "default" : tier === "golden" ? "secondary" : "outline"}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Badge>
                        <span className="text-2xl font-bold">{tierOrgs.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tierOrgs.length === 1 ? "organization" : "organizations"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharma" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-sales-by-territory">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Sales by Territory
                </CardTitle>
                <CardDescription>MR zone performance</CardDescription>
              </CardHeader>
              <CardContent>
                {salesByTerritory && salesByTerritory.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesByTerritory.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="territory" fontSize={12} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                        />
                        <Bar dataKey="totalAmount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <MapPin className="h-12 w-12 mb-2 opacity-50" />
                    <p>No territory sales data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-sales-by-product">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top Products
                </CardTitle>
                <CardDescription>Best performing products</CardDescription>
              </CardHeader>
              <CardContent>
                {salesByProduct && salesByProduct.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {salesByProduct.slice(0, 10).map((product: any, idx: number) => (
                        <div key={product.productName || idx} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${Number(product.totalAmount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-50" />
                    <p>No product sales data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-pharma-companies">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Pharma Companies
              </CardTitle>
              <CardDescription>All registered pharmaceutical companies</CardDescription>
            </CardHeader>
            <CardContent>
              {pharmaOrgs.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {pharmaOrgs.map((org: any) => (
                      <div key={org.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.city || org.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{org.subscription_tier || "basic"}</Badge>
                          {org.subscription_end_date && (
                            <span className="text-xs text-muted-foreground">
                              Exp: {format(new Date(org.subscription_end_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[150px] text-muted-foreground">
                  <Pill className="h-12 w-12 mb-2 opacity-50" />
                  <p>No pharma companies registered</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Medical Reps</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medicalReps.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{doctors.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Company Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyAdmins.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-user-roles">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users by Role
              </CardTitle>
              <CardDescription>All platform users grouped by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {users?.slice(0, 20).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                          {user.role?.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant={user.isActive ? "outline" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/super-admin">
          <Button data-testid="button-manage-platform">
            <Shield className="mr-2 h-4 w-4" />
            Manage Platform
          </Button>
        </Link>
        <Link href="/admin/invitations">
          <Button variant="outline" data-testid="button-invitations">
            <Users className="mr-2 h-4 w-4" />
            Invitations
          </Button>
        </Link>
        <Link href="/admin/accounts">
          <Button variant="outline" data-testid="button-accounts">
            <Activity className="mr-2 h-4 w-4" />
            Account Lifecycle
          </Button>
        </Link>
      </div>
    </div>
  );
}
