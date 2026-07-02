import { StatCard } from "@/components/StatCard";
import { SalesTrendChart } from "@/components/SalesTrendChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { 
  Banknote, TrendingUp, Users, Package, AlertCircle, Crown, Shield, 
  User as UserIcon, Calendar, CalendarDays, MapPin, Stethoscope, 
  Clock, Target, CheckCircle2, ChevronRight, Activity, Briefcase, Eye
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface DashboardAnalytics {
  today: { total: number; percentChange: number };
  week: { total: number; percentChange: number };
  month: { total: number; percentChange: number };
  quarter: { total: number; percentChange: number };
  year: { total: number; percentChange: number };
}

const TERRITORY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

export default function SalesDashboard() {
  const { user } = useAuth();
  const { isViewingAs, viewingRole } = useRole();
  const [dateFilter, setDateFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: salesByTerritory } = useQuery<any[]>({
    queryKey: ["/api/reports/by-territory"],
  });

  const { data: salesByDoctor } = useQuery<any[]>({
    queryKey: ["/api/reports/by-doctor"],
  });

  const { data: doctors } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: visits } = useQuery<any[]>({
    queryKey: ["/api/doctor-visits"],
  });

  const { data: callKpis } = useQuery<any[]>({
    queryKey: ["/api/kpis"],
  });

  const calculateDays = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      if (start > end) return 30;
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    }
    return 30;
  };

  const days = calculateDays();
  const { data: trendData } = useQuery<Array<{ date: string; sales: number }>>({
    queryKey: [`/api/analytics/trend?days=${days}`],
    enabled: true,
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `Rs. ${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
    return `Rs. ${amount.toFixed(0)}`;
  };

  const formattedTrendData = trendData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: item.sales,
  })) || [];

  const territoryChartData = salesByTerritory?.slice(0, 8).map((t, idx) => ({
    name: t.territory || "Unknown",
    value: Number(t.totalAmount) || 0,
    color: TERRITORY_COLORS[idx % TERRITORY_COLORS.length]
  })) || [];

  const recentVisits = visits?.slice(0, 5) || [];
  const todayVisits = visits?.filter(v => {
    const visitDate = new Date(v.visitDate);
    const today = new Date();
    return visitDate.toDateString() === today.toDateString();
  }) || [];

  const topDoctors = salesByDoctor?.slice(0, 5) || [];
  const totalDoctors = doctors?.length || 0;

  const thisWeekKpis = callKpis?.filter(k => {
    const kpiDate = new Date(k.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return kpiDate >= weekAgo;
  }) || [];
  
  const totalCalls = thisWeekKpis.reduce((sum, k) => sum + (k.totalCalls || 0), 0);
  const totalEdas = thisWeekKpis.reduce((sum, k) => sum + (k.totalEdas || 0), 0);

  const isOnTrial = user?.subscriptionActive === "trial";
  const trialStartDate = user?.trialStartDate ? new Date(user.trialStartDate) : null;
  const trialEndDate = user?.trialEndDate ? new Date(user.trialEndDate) : null;
  const today = new Date();
  
  const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const totalTrialDays = (trialStartDate && trialEndDate) 
    ? Math.max(1, Math.ceil((trialEndDate.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 14;
  const daysElapsed = (trialStartDate && trialEndDate) 
    ? Math.max(0, totalTrialDays - daysRemaining)
    : 0;
  const trialProgress = totalTrialDays > 0 
    ? Math.max(0, Math.min(100, (daysElapsed / totalTrialDays) * 100)) 
    : 0;

  const roleConfig = {
    user: { label: "Medical Rep", icon: UserIcon, variant: "default" as const },
    medical_rep: { label: "Medical Rep", icon: Briefcase, variant: "default" as const },
    company_admin: { label: "Company Admin", icon: Shield, variant: "secondary" as const },
    super_admin: { label: "Super Admin", icon: Crown, variant: "default" as const },
  };
  const currentRole = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.user;

  const getRoleName = () => {
    switch (viewingRole) {
      case "pharma_company": return "Pharma Company";
      case "medical_rep": return "Medical Representative";
      case "company_admin": return "Company Admin";
      default: return "Sales User";
    }
  };

  return (
    <div className="space-y-6">
      {isViewingAs && (
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" data-testid="alert-viewing-as">
          <Eye className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            Viewing as <span className="font-semibold">{getRoleName()}</span> - This is a preview of how this role sees the dashboard
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your daily sales and performance
          </p>
        </div>
        <Badge variant={currentRole.variant} className="flex items-center gap-1" data-testid="badge-role">
          <currentRole.icon className="h-3 w-3" />
          {currentRole.label}
        </Badge>
      </div>

      {isOnTrial && trialEndDate && (
        <Alert data-testid="alert-trial-status" className={daysRemaining <= 3 ? "border-destructive" : ""}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {daysRemaining > 0 ? `Trial Period - ${daysRemaining} days remaining` : "Trial Expired"}
          </AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p className="text-sm">
              {daysRemaining > 0 
                ? `Your trial expires on ${trialEndDate.toLocaleDateString()}. Upgrade to continue accessing all features.`
                : "Your trial period has ended. Please upgrade to continue using the application."}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Trial Progress</span>
                <span>{Math.round(trialProgress)}%</span>
              </div>
              <Progress value={trialProgress} className="h-2" data-testid="progress-trial" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {user?.subscriptionActive === "active" && (
        <Alert data-testid="alert-subscription-active" className="border-green-500/50">
          <AlertCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Active Subscription</AlertTitle>
          <AlertDescription>
            Your subscription is active. Enjoy full access to all features.
          </AlertDescription>
        </Alert>
      )}

      {user?.subscriptionActive === "expired" && (
        <Alert data-testid="alert-subscription-expired" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subscription Expired</AlertTitle>
          <AlertDescription>
            Your subscription has expired. Please renew to continue accessing all features.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" data-testid={`skeleton-stat-${i}`} />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Today's Sales"
              value={formatCurrency(analytics?.today.total || 0)}
              comparison={{ label: "vs Yesterday", value: analytics?.today.percentChange || 0 }}
              icon={Banknote}
            />
            <StatCard
              title="This Week"
              value={formatCurrency(analytics?.week.total || 0)}
              comparison={{ label: "vs Last Week", value: analytics?.week.percentChange || 0 }}
              icon={CalendarDays}
            />
            <StatCard
              title="MTD (Month-to-Date)"
              value={formatCurrency(analytics?.month.total || 0)}
              comparison={{ label: "vs Last Month", value: analytics?.month.percentChange || 0 }}
              icon={TrendingUp}
            />
            <StatCard
              title="This Quarter"
              value={formatCurrency(analytics?.quarter.total || 0)}
              comparison={{ label: "vs Last Quarter", value: analytics?.quarter.percentChange || 0 }}
              icon={Package}
            />
            <StatCard
              title="This Year"
              value={formatCurrency(analytics?.year.total || 0)}
              comparison={{ label: "vs Last Year", value: analytics?.year.percentChange || 0 }}
              icon={Users}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-doctors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Doctors Covered</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDoctors}</div>
            <p className="text-xs text-muted-foreground">{topDoctors.length} with sales</p>
          </CardContent>
        </Card>

        <Card data-testid="card-today-visits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayVisits.length}</div>
            <p className="text-xs text-muted-foreground">{recentVisits.length} recent visits</p>
          </CardContent>
        </Card>

        <Card data-testid="card-weekly-calls">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Weekly Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">{totalEdas} EDAs completed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-territories">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active Territories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesByTerritory?.length || 0}</div>
            <p className="text-xs text-muted-foreground">zones with sales</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales" data-testid="tab-sales">Sales Trend</TabsTrigger>
          <TabsTrigger value="territory" data-testid="tab-territory">Territory Performance</TabsTrigger>
          <TabsTrigger value="doctors" data-testid="tab-doctors">Top Doctors</TabsTrigger>
          <TabsTrigger value="visits" data-testid="tab-visits">Recent Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filter by Date Range</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDateFilter(!showDateFilter)}
                data-testid="button-toggle-date-filter"
              >
                {showDateFilter ? "Hide" : "Show"} Filters
              </Button>
            </div>
            
            {showDateFilter && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      if (dateFilter.startDate && dateFilter.endDate) {
                        queryClient.invalidateQueries({ queryKey: ["/api/analytics/trend"] });
                      }
                    }}
                    disabled={!dateFilter.startDate || !dateFilter.endDate}
                    data-testid="button-apply-filter"
                  >
                    Apply Filter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateFilter({ startDate: "", endDate: "" });
                      queryClient.invalidateQueries({ queryKey: ["/api/analytics/trend"] });
                    }}
                    data-testid="button-clear-filter"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {formattedTrendData.length > 0 && <SalesTrendChart data={formattedTrendData} />}
        </TabsContent>

        <TabsContent value="territory" className="space-y-4">
          <Card data-testid="card-territory-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Sales by Territory
              </CardTitle>
              <CardDescription>Performance across different zones</CardDescription>
            </CardHeader>
            <CardContent>
              {territoryChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={territoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, "Sales"]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {territoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <MapPin className="h-12 w-12 mb-2 opacity-50" />
                  <p>No territory sales data yet</p>
                  <Link href="/sales-entry">
                    <Button variant="ghost" className="mt-2">Add your first sale</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-territory-list">
            <CardHeader>
              <CardTitle>Territory Rankings</CardTitle>
              <CardDescription>Top performing zones</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {salesByTerritory?.slice(0, 10).map((t: any, idx: number) => (
                    <div key={t.territory || idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{t.territory || "Unknown"}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(t.totalAmount) || 0)}</p>
                        <p className="text-xs text-muted-foreground">{t.count} sales</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">No territory data</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <Card data-testid="card-top-doctors">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Top Performing Doctors
                </CardTitle>
                <CardDescription>Doctors with highest sales contribution</CardDescription>
              </div>
              <Link href="/doctors">
                <Button variant="outline" size="sm" data-testid="button-view-all-doctors">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {topDoctors.length > 0 ? (
                  <div className="space-y-3">
                    {topDoctors.map((d: any, idx: number) => (
                      <div key={d.doctorName || idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <Stethoscope className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{d.doctorName}</p>
                            <p className="text-xs text-muted-foreground">{d.count} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(d.totalAmount) || 0)}</p>
                          <Badge variant="outline" className="text-xs">Rank #{idx + 1}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mb-2 opacity-50" />
                    <p>No doctor sales data yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <Card data-testid="card-recent-visits">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Doctor Visits
                </CardTitle>
                <CardDescription>Your latest field visits</CardDescription>
              </div>
              <Link href="/visits">
                <Button variant="outline" size="sm" data-testid="button-view-all-visits">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {recentVisits.length > 0 ? (
                  <div className="space-y-3">
                    {recentVisits.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{v.doctorName || "Doctor Visit"}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.visitDate ? format(new Date(v.visitDate), "MMM d, yyyy") : "No date"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={v.isVerified ? "default" : "secondary"}>
                            {v.isVerified ? "Verified" : "Pending"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <MapPin className="h-12 w-12 mb-2 opacity-50" />
                    <p>No visits recorded yet</p>
                    <Link href="/visits">
                      <Button variant="ghost" className="mt-2">Record your first visit</Button>
                    </Link>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card data-testid="card-today-schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Visits planned for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todayVisits.length > 0 ? (
                <div className="space-y-3">
                  {todayVisits.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 ${v.isVerified ? "text-green-500" : "text-muted-foreground"}`} />
                        <span>{v.doctorName || "Doctor Visit"}</span>
                      </div>
                      <Badge variant={v.isVerified ? "default" : "outline"}>
                        {v.isVerified ? "Completed" : "Scheduled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-2 opacity-50" />
                  <p>No visits scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Link href="/sales-entry">
          <Button data-testid="button-new-sale">
            <Banknote className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </Link>
        <Link href="/visits">
          <Button variant="outline" data-testid="button-record-visit">
            <MapPin className="mr-2 h-4 w-4" />
            Record Visit
          </Button>
        </Link>
        <Link href="/call-kpi">
          <Button variant="outline" data-testid="button-log-kpi">
            <Activity className="mr-2 h-4 w-4" />
            Log KPI
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" data-testid="button-reports">
            <TrendingUp className="mr-2 h-4 w-4" />
            Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
