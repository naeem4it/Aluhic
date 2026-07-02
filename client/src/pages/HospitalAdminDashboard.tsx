import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Building2, Users, Stethoscope, Calendar, 
  CreditCard, Activity, TrendingUp, Clock, Eye
} from "lucide-react";
import { format } from "date-fns";
import { useRole } from "@/context/RoleContext";

export default function HospitalAdminDashboard() {
  const { organizationType, isViewingAs, viewingRole } = useRole();
  const isClinic = organizationType === "clinic";

  const { data: facilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: doctors } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facility-doctors"],
  });

  const { data: queueEntries } = useQuery<any[]>({
    queryKey: ["/api/healthcare/queue"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/healthcare/payments?date=" + format(new Date(), "yyyy-MM-dd")],
  });

  const { data: appointments } = useQuery<any[]>({
    queryKey: ["/api/healthcare/appointments?date=" + format(new Date(), "yyyy-MM-dd")],
  });

  const todayRevenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const completedToday = queueEntries?.filter((q: any) => q.status === "completed").length || 0;
  const waitingNow = queueEntries?.filter((q: any) => q.status === "waiting").length || 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
    return `Rs. ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {isViewingAs && (
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" data-testid="alert-viewing-as">
          <Eye className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            Viewing as <span className="font-semibold">{isClinic ? "Clinic Admin" : "Hospital Admin"}</span> - This is a preview of how this role sees the dashboard
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isClinic ? "Clinic" : "Hospital"} Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1" data-testid="badge-admin">
          <Building2 className="h-3 w-3" />
          {isClinic ? "Clinic Admin" : "Hospital Admin"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-facilities">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered {isClinic ? "clinics" : "facilities"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-doctors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active doctors
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-today-patients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Today's Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueEntries?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {completedToday} completed, {waitingNow} waiting
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-today-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {payments?.length || 0} payments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-doctor-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Activity
            </CardTitle>
            <CardDescription>Active doctors and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {(!doctors || doctors.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No doctors registered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.slice(0, 5).map((doctor: any) => (
                  <div key={doctor.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">Dr. {doctor.name || doctor.firstName + " " + doctor.lastName}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialty || "General"}</p>
                    </div>
                    <Badge variant={doctor.isAvailable ? "default" : "secondary"}>
                      {doctor.isAvailable ? "Available" : "Busy"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-appointments-overview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Appointments
            </CardTitle>
            <CardDescription>Scheduled appointments overview</CardDescription>
          </CardHeader>
          <CardContent>
            {(!appointments || appointments.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{apt.patientName || "Patient"}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.scheduledTime ? format(new Date(apt.scheduledTime), "h:mm a") : "N/A"} - Dr. {apt.doctorName || "TBD"}
                      </p>
                    </div>
                    <Badge variant={apt.status === "confirmed" ? "default" : "outline"}>
                      {apt.status || "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-queue-status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Queue Status
          </CardTitle>
          <CardDescription>Real-time patient queue across all facilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-3xl font-bold text-orange-500">{waitingNow}</div>
              <p className="text-sm text-muted-foreground">Waiting</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-500">
                {queueEntries?.filter((q: any) => q.status === "in_progress").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-3xl font-bold text-green-500">{completedToday}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/healthcare/facilities">
          <Button data-testid="button-manage-facilities">
            <Building2 className="mr-2 h-4 w-4" />
            Manage Facilities
          </Button>
        </Link>
        <Link href="/healthcare/doctors-mgmt">
          <Button variant="outline" data-testid="button-manage-doctors">
            <Stethoscope className="mr-2 h-4 w-4" />
            Manage Doctors
          </Button>
        </Link>
        <Link href="/healthcare/payroll">
          <Button variant="outline" data-testid="button-payroll">
            <CreditCard className="mr-2 h-4 w-4" />
            Doctor Payroll
          </Button>
        </Link>
        <Link href="/ai-insights">
          <Button variant="outline" data-testid="button-ai-insights">
            <TrendingUp className="mr-2 h-4 w-4" />
            AI Insights
          </Button>
        </Link>
      </div>
    </div>
  );
}
