import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, Calendar, Clock, CreditCard, 
  ClipboardList, Activity, UserPlus, Receipt, Eye,
  Stethoscope, ChevronLeft, ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { useRole } from "@/context/RoleContext";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  consultationFee: number;
}

export default function FrontDeskDashboard() {
  const { isViewingAs } = useRole();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");

  const { data: queueEntries } = useQuery<any[]>({
    queryKey: ["/api/healthcare/queue"],
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const { data: payments } = useQuery<any[]>({
    queryKey: [`/api/healthcare/payments?date=${todayStr}`],
  });

  const { data: todayAppointments } = useQuery<any[]>({
    queryKey: [`/api/healthcare/appointments?startDate=${todayStr}&endDate=${todayStr}`],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/healthcare/doctors"],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, "yyyy-MM-dd");
  const monthEndStr = format(monthEnd, "yyyy-MM-dd");

  const { data: monthlyAppointments = [] } = useQuery<any[]>({
    queryKey: [`/api/healthcare/appointments?startDate=${monthStartStr}&endDate=${monthEndStr}`],
  });

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDay = (date: Date, doctorId?: string) => {
    return monthlyAppointments.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDate);
      const sameDay = isSameDay(aptDate, date);
      if (doctorId) {
        return sameDay && apt.doctorId === doctorId;
      }
      return sameDay;
    });
  };

  const selectedDayAppointments = getAppointmentsForDay(selectedDate, selectedDoctor?.id);

  const getDoctorAppointmentsCount = (doctorId: string, date: Date) => {
    return getAppointmentsForDay(date, doctorId).length;
  };

  const waitingCount = queueEntries?.filter((q: any) => q.status === "waiting").length || 0;
  const inProgressCount = queueEntries?.filter((q: any) => q.status === "in_progress").length || 0;
  const completedCount = queueEntries?.filter((q: any) => q.status === "completed").length || 0;

  const todayRevenue = payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0;
  const pendingPayments = payments?.filter((p: any) => p.paymentStatus === "pending").length || 0;

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {isViewingAs && (
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" data-testid="alert-viewing-as">
          <Eye className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            Viewing as <span className="font-semibold">Front Desk Staff</span> - This is a preview of how this role sees the dashboard
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Front Desk Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/healthcare/frontdesk/booking">
            <Button data-testid="button-book-appointment">
              <UserPlus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-frontdesk">
            <ClipboardList className="h-3 w-3" />
            Front Desk
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-queue-waiting">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Queue - Waiting</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{waitingCount}</div>
            <p className="text-xs text-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-queue-in-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">In Consultation</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              With doctor now
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-today-appointments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled today
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
              {pendingPayments} pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="doctors" data-testid="tab-doctors">Doctors & Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-current-queue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Current Queue
                </CardTitle>
                <CardDescription>Patients in queue today</CardDescription>
              </CardHeader>
              <CardContent>
                {(!queueEntries || queueEntries.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patients in queue</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {queueEntries.filter((q: any) => q.status !== "completed").slice(0, 10).map((entry: any) => (
                        <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {entry.queueNumber}
                            </Badge>
                            <div>
                              <p className="font-medium">{entry.patientName || "Patient"}</p>
                              <p className="text-xs text-muted-foreground capitalize">{entry.status}</p>
                            </div>
                          </div>
                          <Badge variant={
                            entry.status === "waiting" ? "secondary" :
                            entry.status === "in_progress" ? "default" : "outline"
                          }>
                            {entry.status === "waiting" ? "Waiting" :
                             entry.status === "in_progress" ? "With Doctor" : entry.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-queue-summary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Today's Summary
                </CardTitle>
                <CardDescription>Quick overview of today's activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Patients Registered</span>
                    <span className="font-semibold">{queueEntries?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Consultations Completed</span>
                    <span className="font-semibold text-green-500">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Still Waiting</span>
                    <span className="font-semibold text-orange-500">{waitingCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payments Collected</span>
                    <span className="font-semibold text-green-500">{formatCurrency(todayRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("monthly")}
                data-testid="button-monthly-view"
              >
                Monthly
              </Button>
              <Button
                variant={viewMode === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("daily")}
                data-testid="button-daily-view"
              >
                Daily
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === "monthly" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1" data-testid="card-doctors-list">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Doctors
                  </CardTitle>
                  <CardDescription>Select doctor to view appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      <div
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          !selectedDoctor ? "border-primary bg-primary/5" : "hover-elevate"
                        }`}
                        onClick={() => setSelectedDoctor(null)}
                        data-testid="button-all-doctors"
                      >
                        <p className="font-medium">All Doctors</p>
                        <p className="text-xs text-muted-foreground">
                          {monthlyAppointments.length} total appointments
                        </p>
                      </div>
                      {doctors.map((doctor: any) => {
                        const docAppointments = monthlyAppointments.filter(
                          (a: any) => a.doctorId === doctor.id
                        );
                        return (
                          <div
                            key={doctor.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedDoctor?.id === doctor.id ? "border-primary bg-primary/5" : "hover-elevate"
                            }`}
                            onClick={() => setSelectedDoctor(doctor)}
                            data-testid={`button-doctor-${doctor.id}`}
                          >
                            <p className="font-medium">Dr. {doctor.name}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                              <Badge variant="secondary" className="text-xs">
                                {docAppointments.length} apt
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="md:col-span-2" data-testid="card-calendar">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {selectedDoctor ? `Dr. ${selectedDoctor.name}'s Schedule` : "All Appointments"}
                  </CardTitle>
                  <CardDescription>Click on a day to see details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-16" />
                    ))}
                    {daysInMonth.map((day) => {
                      const dayAppointments = getAppointmentsForDay(day, selectedDoctor?.id);
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentDay = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`h-16 p-1 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover-elevate"
                          } ${isCurrentDay ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                          onClick={() => {
                            setSelectedDate(day);
                            if (dayAppointments.length > 0) {
                              setViewMode("daily");
                            }
                          }}
                          data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                        >
                          <div className={`text-sm font-medium ${isCurrentDay ? "text-blue-600" : ""}`}>
                            {format(day, "d")}
                          </div>
                          {dayAppointments.length > 0 && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {dayAppointments.length}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card data-testid="card-daily-view">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    {selectedDoctor && ` - Dr. ${selectedDoctor.name}`}
                  </CardTitle>
                  <CardDescription>
                    {selectedDayAppointments.length} appointment{selectedDayAppointments.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewMode("monthly")} data-testid="button-back-to-calendar">
                  Back to Calendar
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {selectedDayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No appointments for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayAppointments.map((apt: any) => {
                        const doctor = doctors.find((d: any) => d.id === apt.doctorId);
                        return (
                          <div key={apt.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`appointment-item-${apt.id}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{apt.patientName || "Patient"}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {apt.appointmentTime || "Time not set"}
                                  </span>
                                  {doctor && (
                                    <span className="flex items-center gap-1">
                                      <Stethoscope className="h-3 w-3" />
                                      Dr. {doctor.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant={apt.status === "completed" ? "default" : apt.status === "cancelled" ? "destructive" : "outline"}>
                              {apt.status || "Scheduled"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Link href="/healthcare/frontdesk">
          <Button variant="outline" data-testid="button-manage-queue">
            <Users className="mr-2 h-4 w-4" />
            Manage Queue
          </Button>
        </Link>
        <Link href="/healthcare/doctor-frontdesk">
          <Button variant="outline" data-testid="button-record-vitals">
            <Activity className="mr-2 h-4 w-4" />
            Record Vitals
          </Button>
        </Link>
        <Link href="/healthcare/test-terminal">
          <Button variant="outline" data-testid="button-test-terminal">
            <ClipboardList className="mr-2 h-4 w-4" />
            Test Results
          </Button>
        </Link>
      </div>
    </div>
  );
}
