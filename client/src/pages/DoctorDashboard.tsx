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
  Stethoscope, Users, Calendar, Clock, 
  ClipboardList, Activity, UserCheck, Phone, 
  FileText, Thermometer, ChevronRight, Heart, Eye,
  ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { useRole } from "@/context/RoleContext";

interface DoctorStats {
  todayAppointments: number;
  pendingQueue: number;
  completedToday: number;
  totalPatients: number;
}

export default function DoctorDashboard() {
  const { isViewingAs } = useRole();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");

  const { data: stats, isLoading } = useQuery<DoctorStats>({
    queryKey: ["/api/healthcare/doctor-stats"],
  });

  const { data: queueEntries } = useQuery<any[]>({
    queryKey: ["/api/healthcare/queue"],
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: todayAppointments } = useQuery<any[]>({
    queryKey: [`/api/healthcare/appointments?startDate=${todayStr}&endDate=${todayStr}`],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, "yyyy-MM-dd");
  const monthEndStr = format(monthEnd, "yyyy-MM-dd");
  
  const { data: monthlyAppointments = [] } = useQuery<any[]>({
    queryKey: [`/api/healthcare/appointments?startDate=${monthStartStr}&endDate=${monthEndStr}`],
  });

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const getAppointmentsForDay = (date: Date) => {
    return monthlyAppointments.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDate);
      return isSameDay(aptDate, date);
    });
  };

  const selectedDayAppointments = selectedDate ? getAppointmentsForDay(selectedDate) : [];

  const { data: patients } = useQuery<any[]>({
    queryKey: ["/api/healthcare/patients"],
  });

  const { data: consultations } = useQuery<any[]>({
    queryKey: ["/api/healthcare/consultations"],
  });

  const waitingPatients = queueEntries?.filter((q: any) => q.status === "waiting") || [];
  const inProgressPatients = queueEntries?.filter((q: any) => q.status === "in_progress") || [];
  const completedPatients = queueEntries?.filter((q: any) => q.status === "completed") || [];

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  
  const thisWeekPatients = queueEntries?.filter(q => {
    const date = new Date(q.createdAt);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  }) || [];

  const recentPatients = patients?.slice(0, 10) || [];

  if (isLoading) {
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
            Viewing as <span className="font-semibold">Doctor</span> - This is a preview of how this role sees the dashboard
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1" data-testid="badge-doctor">
          <Stethoscope className="h-3 w-3" />
          Doctor
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-today-appointments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-waiting-queue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Waiting Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{waitingPatients.length}</div>
            <p className="text-xs text-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-in-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{inProgressPatients.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently consulting
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-today">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedPatients.length}</div>
            <p className="text-xs text-muted-foreground">
              Consultations done
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekPatients.length}</div>
            <p className="text-xs text-muted-foreground">patients seen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Consultations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">total records</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" data-testid="tab-queue">Patient Queue</TabsTrigger>
          <TabsTrigger value="appointments" data-testid="tab-appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients" data-testid="tab-patients">Patient Records</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-patient-queue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Waiting Patients
                </CardTitle>
                <CardDescription>Patients waiting to be seen</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {waitingPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No patients in queue</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {waitingPatients.map((entry: any, index: number) => (
                        <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {entry.queueNumber || index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{entry.patientName || "Patient"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Waiting since {entry.createdAt ? format(new Date(entry.createdAt), "h:mm a") : "N/A"}</span>
                                {entry.phone && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {entry.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant={entry.priority === "urgent" ? "destructive" : "secondary"}>
                            {entry.priority || "Normal"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card data-testid="card-in-progress-patients">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Currently In Progress
                </CardTitle>
                <CardDescription>Patients being seen now</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {inProgressPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No patients in progress</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inProgressPatients.map((entry: any) => (
                        <div key={entry.id} className="p-3 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{entry.patientName || "Patient"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>Started: {entry.startedAt ? format(new Date(entry.startedAt), "h:mm a") : "N/A"}</span>
                                {entry.phone && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {entry.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-blue-500">In Progress</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
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
            <Card data-testid="card-monthly-calendar">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly View
                </CardTitle>
                <CardDescription>Click on a day to see appointment details</CardDescription>
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
                    <div key={`empty-${i}`} className="h-20" />
                  ))}
                  {daysInMonth.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`h-20 p-1 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover-elevate"
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
                            {dayAppointments.length} apt{dayAppointments.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-daily-appointments">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a Day"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDayAppointments.length} appointment{selectedDayAppointments.length !== 1 ? "s" : ""} scheduled
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
                      {selectedDayAppointments.map((apt: any) => (
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
                                {apt.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {apt.phone}
                                  </span>
                                )}
                                {apt.notes && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {apt.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={apt.status === "completed" ? "default" : apt.status === "cancelled" ? "destructive" : "outline"}>
                              {apt.status || "Scheduled"}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card data-testid="card-patient-records">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Patient Records
                </CardTitle>
                <CardDescription>Complete patient details with contact information</CardDescription>
              </div>
              <Link href="/healthcare/patients">
                <Button variant="outline" size="sm" data-testid="button-view-all-patients">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {recentPatients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patient records</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPatients.map((patient: any) => (
                      <div key={patient.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {(patient.firstName?.[0] || "") + (patient.lastName?.[0] || "")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                              {patient.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {patient.phone}
                                </span>
                              )}
                              {patient.age && (
                                <span>{patient.age} yrs</span>
                              )}
                              {patient.gender && (
                                <span className="capitalize">{patient.gender}</span>
                              )}
                              {patient.bloodGroup && (
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {patient.bloodGroup}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.lastVisit && (
                            <span className="text-xs text-muted-foreground">
                              Last: {format(new Date(patient.lastVisit), "MMM d")}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Link href="/healthcare/doctor-terminal">
          <Button data-testid="button-start-consultations">
            <Stethoscope className="mr-2 h-4 w-4" />
            Start Consultations
          </Button>
        </Link>
        <Link href="/healthcare/patients">
          <Button variant="outline" data-testid="button-patient-records">
            <Users className="mr-2 h-4 w-4" />
            Patient Records
          </Button>
        </Link>
        <Link href="/healthcare/vitals">
          <Button variant="outline" data-testid="button-view-vitals">
            <Thermometer className="mr-2 h-4 w-4" />
            View Vitals
          </Button>
        </Link>
        <Link href="/healthcare/facilities">
          <Button variant="outline" data-testid="button-view-facilities">
            <ClipboardList className="mr-2 h-4 w-4" />
            View Facilities
          </Button>
        </Link>
      </div>
    </div>
  );
}
