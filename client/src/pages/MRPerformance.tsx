import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, TrendingUp, TrendingDown, Target, MapPin, Phone, Clock, 
  CheckCircle2, AlertTriangle, XCircle, Calendar, BarChart3, Users,
  ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import type { User as UserType, DoctorVisit, CallKPI } from "@shared/schema";

interface PerformanceMetrics {
  visitsCompleted: number;
  visitsTarget: number;
  callsMade: number;
  callsTarget: number;
  salesAmount: number;
  salesTarget: number;
  conversionRate: number;
  avgTimePerVisit: number;
  kpiCompliance: number;
  lastWeekVisits: number;
  thisWeekVisits: number;
  trend: "up" | "down" | "stable";
}

export default function MRPerformance() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: visits = [], isLoading: visitsLoading } = useQuery<DoctorVisit[]>({
    queryKey: ["/api/doctor-visits"],
  });

  const { data: kpis = [], isLoading: kpisLoading } = useQuery<CallKPI[]>({
    queryKey: ["/api/call-kpis"],
  });

  const { data: salesEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/sales-entries"],
  });

  const { data: mrProfiles = [] } = useQuery<any[]>({
    queryKey: ["/api/mr-profiles"],
  });

  const calculateMetrics = (): PerformanceMetrics => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const lastWeekStart = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    const monthVisits = visits.filter(v => new Date(v.punchInTime) >= monthStart);
    const thisWeekVisits = visits.filter(v => new Date(v.punchInTime) >= lastWeekStart);
    const lastWeekVisits = visits.filter(v => {
      const date = new Date(v.punchInTime);
      return date >= twoWeeksAgo && date < lastWeekStart;
    });

    const monthKPIs = kpis.filter(k => new Date(k.date) >= monthStart);
    const totalCalls = monthKPIs.reduce((sum, k) => sum + (k.totalCallsDone || 0), 0);

    const totalSales = salesEntries
      .filter((s: any) => new Date(s.date) >= monthStart)
      .reduce((sum: number, s: any) => sum + parseFloat(s.total || "0"), 0);

    const conversionRate = monthVisits.length > 0 
      ? (salesEntries.filter((s: any) => new Date(s.date) >= monthStart).length / monthVisits.length) * 100 
      : 0;

    const trend = thisWeekVisits.length > lastWeekVisits.length 
      ? "up" 
      : thisWeekVisits.length < lastWeekVisits.length 
        ? "down" 
        : "stable";

    return {
      visitsCompleted: monthVisits.length,
      visitsTarget: 200,
      callsMade: totalCalls,
      callsTarget: 500,
      salesAmount: totalSales,
      salesTarget: 1000000,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgTimePerVisit: 25,
      kpiCompliance: Math.round((totalCalls / 500) * 100),
      lastWeekVisits: lastWeekVisits.length,
      thisWeekVisits: thisWeekVisits.length,
      trend,
    };
  };

  const metrics = calculateMetrics();

  const visitTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayVisits = visits.filter(v => 
      format(new Date(v.punchInTime), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    ).length;
    return {
      date: format(date, "EEE"),
      visits: dayVisits,
    };
  });

  const statusDistribution = [
    { name: "Completed", value: visits.filter(v => v.punchOutTime !== null).length, color: "#22c55e" },
    { name: "In Progress", value: visits.filter(v => v.punchOutTime === null).length, color: "#eab308" },
  ];

  const getComplianceStatus = (value: number) => {
    if (value >= 80) return { status: "Excellent", color: "text-green-500", icon: CheckCircle2 };
    if (value >= 60) return { status: "Good", color: "text-yellow-500", icon: AlertTriangle };
    return { status: "Needs Improvement", color: "text-red-500", icon: XCircle };
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const compliance = getComplianceStatus(metrics.kpiCompliance);

  if (visitsLoading || kpisLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="mr-performance-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">MR Performance Dashboard</h1>
          <p className="text-muted-foreground">Track visits, conversions, and KPI compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Visits Completed
            </CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2" data-testid="stat-visits">
              {metrics.visitsCompleted}
              <span className="text-sm text-muted-foreground">/ {metrics.visitsTarget}</span>
              {getTrendIcon(metrics.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(metrics.visitsCompleted / metrics.visitsTarget) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Calls Made
            </CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2" data-testid="stat-calls">
              {metrics.callsMade}
              <span className="text-sm text-muted-foreground">/ {metrics.callsTarget}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(metrics.callsMade / metrics.callsTarget) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion Rate
            </CardDescription>
            <CardTitle className="text-2xl" data-testid="stat-conversion">
              {metrics.conversionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={metrics.conversionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <compliance.icon className={`w-4 h-4 ${compliance.color}`} />
              KPI Compliance
            </CardDescription>
            <CardTitle className={`text-2xl ${compliance.color}`} data-testid="stat-compliance">
              {compliance.status}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={metrics.kpiCompliance} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">{metrics.kpiCompliance}% of target</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="visits" data-testid="tab-visits">Visit Analysis</TabsTrigger>
          <TabsTrigger value="kpi" data-testid="tab-kpi">KPI Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Visit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={visitTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {statusDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">{metrics.thisWeekVisits}</div>
                  <div className="text-sm text-muted-foreground">This Week Visits</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-blue-500">{metrics.avgTimePerVisit}</div>
                  <div className="text-sm text-muted-foreground">Avg Minutes/Visit</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-green-500">Rs. {Math.round(metrics.salesAmount / 1000)}K</div>
                  <div className="text-sm text-muted-foreground">Monthly Sales</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-purple-500">{visits.filter(v => v.punchOutTime !== null).length}</div>
                  <div className="text-sm text-muted-foreground">Completed Visits</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.slice(0, 10).map((visit) => (
                      <TableRow key={visit.id} data-testid={`row-visit-${visit.id}`}>
                        <TableCell>{format(new Date(visit.punchInTime), "MMM dd, yyyy")}</TableCell>
                        <TableCell>Doctor #{visit.doctorId.slice(-4)}</TableCell>
                        <TableCell>
                          {visit.punchInTime && visit.punchOutTime
                            ? `${Math.round((new Date(visit.punchOutTime).getTime() - new Date(visit.punchInTime).getTime()) / 60000)} min`
                            : visit.duration ? `${visit.duration} min` : "-"}
                        </TableCell>
                        <TableCell>
                          {visit.punchOutTime !== null ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" /> In Progress
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{visit.saleAgreementDetails || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KPI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Calls Done</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Samples</TableHead>
                      <TableHead>Travel</TableHead>
                      <TableHead>Planned Calls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.slice(0, 10).map((kpi) => (
                      <TableRow key={kpi.id} data-testid={`row-kpi-${kpi.id}`}>
                        <TableCell>{format(new Date(kpi.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{kpi.totalCallsDone}</TableCell>
                        <TableCell>{kpi.productsCovered || 0}</TableCell>
                        <TableCell>{kpi.samplesDistributed || 0}</TableCell>
                        <TableCell>{kpi.travelHours || 0} hrs</TableCell>
                        <TableCell>{kpi.totalPlannedCalls}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
