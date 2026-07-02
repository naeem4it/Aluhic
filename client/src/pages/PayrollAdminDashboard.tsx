import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  DollarSign, Users, Calendar, TrendingUp, 
  FileText, CreditCard, Building2, UserCheck, Clock, Eye
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useRole } from "@/context/RoleContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface PayrollStats {
  totalPayroll: number;
  employeeCount: number;
  pendingPayments: number;
  processedThisMonth: number;
}

const PAYMENT_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

export default function PayrollAdminDashboard() {
  const { isViewingAs } = useRole();
  const { data: doctors, isLoading: loadingDoctors } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facility-doctors"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/healthcare/payments"],
  });

  const { data: facilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const permanentDoctors = doctors?.filter((d: any) => d.agreementType === "permanent_salary") || [];
  const onCallDoctors = doctors?.filter((d: any) => d.agreementType === "on_call") || [];

  const monthlyPayments = payments?.filter((p: any) => {
    const paymentDate = new Date(p.createdAt || p.paymentDate);
    return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
  }) || [];

  const totalMonthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const doctorEarnings = onCallDoctors.map((d: any) => {
    const doctorPayments = monthlyPayments.filter(p => p.doctorId === d.id);
    const totalPatients = doctorPayments.length;
    const feePerPatient = d.feePerPatient || 0;
    const percentageShare = d.percentageShare || 0;
    const totalEarnings = totalPatients * feePerPatient + (totalMonthlyRevenue * (percentageShare / 100));
    return {
      id: d.id,
      name: d.name || `${d.firstName} ${d.lastName}`,
      type: "on_call",
      specialty: d.specialty,
      patientsServed: totalPatients,
      feePerPatient,
      percentageShare,
      earnings: totalEarnings
    };
  });

  const permanentSalaries = permanentDoctors.map((d: any) => ({
    id: d.id,
    name: d.name || `${d.firstName} ${d.lastName}`,
    type: "permanent",
    specialty: d.specialty,
    monthlySalary: d.monthlySalary || 0,
    earnings: d.monthlySalary || 0
  }));

  const allPayrollData = [...doctorEarnings, ...permanentSalaries];
  const totalPayrollAmount = allPayrollData.reduce((sum, d) => sum + d.earnings, 0);

  const payrollByType = [
    { name: "Permanent Salaries", value: permanentSalaries.reduce((s, d) => s + d.earnings, 0), color: "#3b82f6" },
    { name: "On-Call Fees", value: doctorEarnings.reduce((s, d) => s + d.earnings, 0), color: "#10b981" }
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
    return `Rs. ${amount.toLocaleString()}`;
  };

  if (loadingDoctors) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isViewingAs && (
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" data-testid="alert-viewing-as">
          <Eye className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            Viewing as <span className="font-semibold">Payroll Admin</span> - This is a preview of how this role sees the dashboard
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Payroll Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(now, "MMMM yyyy")} Payroll Overview
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1" data-testid="badge-payroll-admin">
          <DollarSign className="h-3 w-3" />
          Payroll Admin
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-payroll">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPayrollAmount)}</div>
            <p className="text-xs text-muted-foreground">
              For {format(now, "MMMM")}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-doctors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {permanentDoctors.length} permanent, {onCallDoctors.length} on-call
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-monthly-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {monthlyPayments.length} payments
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-facilities">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active facilities
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="permanent" data-testid="tab-permanent">Permanent Staff</TabsTrigger>
          <TabsTrigger value="oncall" data-testid="tab-oncall">On-Call Doctors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-payroll-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payroll Distribution
                </CardTitle>
                <CardDescription>Breakdown by doctor type</CardDescription>
              </CardHeader>
              <CardContent>
                {payrollByType.some(p => p.value > 0) ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={payrollByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        >
                          {payrollByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <CreditCard className="h-12 w-12 mb-2 opacity-50" />
                    <p>No payroll data this month</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-top-earners">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Earners
                </CardTitle>
                <CardDescription>Highest earning doctors this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  {allPayrollData.length > 0 ? (
                    <div className="space-y-3">
                      {allPayrollData
                        .sort((a, b) => b.earnings - a.earnings)
                        .slice(0, 5)
                        .map((doctor, idx) => (
                          <div key={doctor.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium">Dr. {doctor.name}</p>
                                <p className="text-xs text-muted-foreground">{doctor.specialty || "General"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(doctor.earnings)}</p>
                              <Badge variant="outline" className="text-xs">
                                {doctor.type === "permanent" ? "Permanent" : "On-Call"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <Users className="h-12 w-12 mb-2 opacity-50" />
                      <p>No doctors registered</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permanent" className="space-y-4">
          <Card data-testid="card-permanent-doctors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Permanent Staff Salaries
              </CardTitle>
              <CardDescription>Monthly salary breakdown for permanent doctors</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {permanentSalaries.length > 0 ? (
                  <div className="space-y-3">
                    {permanentSalaries.map((doctor) => (
                      <div key={doctor.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">Dr. {doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.specialty || "General"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">{formatCurrency(doctor.monthlySalary)}</p>
                          <p className="text-xs text-muted-foreground">Monthly Salary</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <UserCheck className="h-12 w-12 mb-2 opacity-50" />
                    <p>No permanent doctors registered</p>
                    <Link href="/healthcare/doctors-mgmt">
                      <Button variant="ghost" className="mt-2">Add Doctors</Button>
                    </Link>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oncall" className="space-y-4">
          <Card data-testid="card-oncall-doctors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                On-Call Doctor Earnings
              </CardTitle>
              <CardDescription>Per-patient fees and percentage shares</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {doctorEarnings.length > 0 ? (
                  <div className="space-y-3">
                    {doctorEarnings.map((doctor) => (
                      <div key={doctor.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium">Dr. {doctor.name}</p>
                              <p className="text-xs text-muted-foreground">{doctor.specialty || "General"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-500">{formatCurrency(doctor.earnings)}</p>
                            <p className="text-xs text-muted-foreground">Total Earnings</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-muted-foreground text-xs">Patients</p>
                            <p className="font-semibold">{doctor.patientsServed}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-muted-foreground text-xs">Per Patient</p>
                            <p className="font-semibold">{formatCurrency(doctor.feePerPatient)}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-muted-foreground text-xs">Share %</p>
                            <p className="font-semibold">{doctor.percentageShare}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Clock className="h-12 w-12 mb-2 opacity-50" />
                    <p>No on-call doctors registered</p>
                    <Link href="/healthcare/doctors-mgmt">
                      <Button variant="ghost" className="mt-2">Add Doctors</Button>
                    </Link>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Link href="/healthcare/payroll">
          <Button data-testid="button-manage-payroll">
            <DollarSign className="mr-2 h-4 w-4" />
            Manage Payroll
          </Button>
        </Link>
        <Link href="/healthcare/doctors-mgmt">
          <Button variant="outline" data-testid="button-manage-doctors">
            <Users className="mr-2 h-4 w-4" />
            Manage Doctors
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" data-testid="button-reports">
            <FileText className="mr-2 h-4 w-4" />
            Financial Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
