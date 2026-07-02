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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Plus, Clock, Calendar, AlertCircle, CheckCircle, Activity, User } from "lucide-react";
import { format } from "date-fns";

const theatreFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  theatreType: z.enum(["major", "minor", "cardiac", "ortho", "neuro", "ophthalmic", "ent"]),
  capacity: z.string().optional(),
  hourlyRate: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

const caseFormSchema = z.object({
  personId: z.string().min(1, "Patient is required"),
  theatreId: z.string().optional(),
  procedureName: z.string().min(1, "Procedure is required"),
  procedureCode: z.string().optional(),
  surgeryType: z.enum(["elective", "emergency", "day_case"]),
  priority: z.enum(["routine", "urgent", "emergency"]).optional().default("routine"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledStartTime: z.string().optional(),
  estimatedDuration: z.string().optional(),
  preOpDiagnosis: z.string().optional(),
  anesthesiaType: z.enum(["general", "spinal", "epidural", "local"]).optional()
});

type TheatreFormData = z.infer<typeof theatreFormSchema>;
type CaseFormData = z.infer<typeof caseFormSchema>;

export default function OTManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("schedule");
  const [isTheatreDialogOpen, setIsTheatreDialogOpen] = useState(false);
  const [isCaseDialogOpen, setIsCaseDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const theatreForm = useForm<TheatreFormData>({
    resolver: zodResolver(theatreFormSchema),
    defaultValues: {
      name: "",
      code: "",
      theatreType: "major",
      capacity: "",
      hourlyRate: "",
      isActive: true
    }
  });

  const caseForm = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      personId: "",
      theatreId: "",
      procedureName: "",
      procedureCode: "",
      surgeryType: "elective",
      priority: "routine",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledStartTime: "08:00",
      estimatedDuration: "60",
      preOpDiagnosis: "",
      anesthesiaType: undefined
    }
  });

  const { data: theatres = [], isLoading: theatresLoading } = useQuery<any[]>({
    queryKey: ["/api/ot/theatres"]
  });

  const statusQuery = statusFilter === "all" ? "" : `?status=${statusFilter}`;
  const { data: cases = [], isLoading: casesLoading } = useQuery<any[]>({
    queryKey: ["/api/ot/cases" + statusQuery]
  });

  const { data: persons = [] } = useQuery<any[]>({
    queryKey: ["/api/persons"]
  });

  const createTheatreMutation = useMutation({
    mutationFn: async (data: TheatreFormData) => {
      return apiRequest("/api/ot/theatres", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          organizationId: user?.organizationId
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot/theatres"] });
      toast({ title: "Theatre created successfully" });
      setIsTheatreDialogOpen(false);
      theatreForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create theatre", description: error.message, variant: "destructive" });
    }
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      return apiRequest("/api/ot/cases", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          organizationId: user?.organizationId,
          estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration) : undefined
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot/cases"] });
      toast({ title: "Surgical case scheduled successfully" });
      setIsCaseDialogOpen(false);
      caseForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to schedule case", description: error.message, variant: "destructive" });
    }
  });

  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/ot/cases/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot/cases"] });
      toast({ title: "Case updated successfully" });
      setSelectedCase(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update case", description: error.message, variant: "destructive" });
    }
  });

  const getTheatreTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      major: "bg-purple-500/10 text-purple-500",
      minor: "bg-blue-500/10 text-blue-500",
      cardiac: "bg-red-500/10 text-red-500",
      ortho: "bg-green-500/10 text-green-500",
      neuro: "bg-indigo-500/10 text-indigo-500",
      ophthalmic: "bg-cyan-500/10 text-cyan-500",
      ent: "bg-orange-500/10 text-orange-500"
    };
    return <Badge className={colors[type] || ""} data-testid={`badge-theatre-type-${type}`}>{type.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/10 text-blue-500",
      in_progress: "bg-yellow-500/10 text-yellow-500",
      completed: "bg-green-500/10 text-green-500",
      cancelled: "bg-red-500/10 text-red-500",
      postponed: "bg-gray-500/10 text-gray-500"
    };
    return <Badge className={colors[status] || ""} data-testid={`badge-case-status-${status}`}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      routine: "bg-green-500/10 text-green-500",
      urgent: "bg-orange-500/10 text-orange-500",
      emergency: "bg-red-500/10 text-red-500"
    };
    return <Badge className={colors[priority] || ""} data-testid={`badge-priority-${priority}`}>{priority.toUpperCase()}</Badge>;
  };

  const scheduledCount = cases.filter((c: any) => c.status === "scheduled").length;
  const inProgressCount = cases.filter((c: any) => c.status === "in_progress").length;
  const completedTodayCount = cases.filter((c: any) => 
    c.status === "completed" && 
    new Date(c.actualEndTime).toDateString() === new Date().toDateString()
  ).length;

  const getPersonName = (personId: string) => {
    const person = persons.find((p: any) => p.id === personId);
    return person ? `${person.firstName} ${person.lastName}` : personId;
  };

  const getTheatreName = (theatreId: string) => {
    const theatre = theatres.find((t: any) => t.id === theatreId);
    return theatre?.name || "Not assigned";
  };

  return (
    <div className="p-6 space-y-6" data-testid="ot-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Operating Theatre Management</h1>
          <p className="text-muted-foreground">Schedule and manage surgical cases</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTheatreDialogOpen} onOpenChange={setIsTheatreDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-theatre">
                <Plus className="w-4 h-4 mr-2" />
                Add Theatre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Operating Theatre</DialogTitle>
              </DialogHeader>
              <Form {...theatreForm}>
                <form onSubmit={theatreForm.handleSubmit((data) => createTheatreMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={theatreForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theatre Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., OT Room 1" data-testid="input-theatre-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={theatreForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., OT1" data-testid="input-theatre-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={theatreForm.control}
                    name="theatreType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theatre Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-theatre-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="cardiac">Cardiac</SelectItem>
                            <SelectItem value="ortho">Orthopedic</SelectItem>
                            <SelectItem value="neuro">Neurosurgery</SelectItem>
                            <SelectItem value="ophthalmic">Ophthalmic</SelectItem>
                            <SelectItem value="ent">ENT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={theatreForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment/Capacity</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe equipment and capacity" data-testid="input-theatre-capacity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={theatreForm.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate (PKR)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0.00" data-testid="input-theatre-rate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createTheatreMutation.isPending} data-testid="button-submit-theatre">
                    {createTheatreMutation.isPending ? "Creating..." : "Create Theatre"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCaseDialogOpen} onOpenChange={setIsCaseDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-schedule-surgery">
                <Scissors className="w-4 h-4 mr-2" />
                Schedule Surgery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Surgical Case</DialogTitle>
              </DialogHeader>
              <Form {...caseForm}>
                <form onSubmit={caseForm.handleSubmit((data) => createCaseMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={caseForm.control}
                      name="personId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-patient">
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {persons.map((person: any) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.firstName} {person.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={caseForm.control}
                      name="theatreId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theatre</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-theatre">
                                <SelectValue placeholder="Select theatre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {theatres.filter((t: any) => t.isActive).map((theatre: any) => (
                                <SelectItem key={theatre.id} value={theatre.id}>
                                  {theatre.name} ({theatre.theatreType})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={caseForm.control}
                    name="procedureName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Appendectomy" data-testid="input-procedure-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={caseForm.control}
                      name="surgeryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surgery Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-surgery-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="elective">Elective</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="day_case">Day Case</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={caseForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={caseForm.control}
                      name="anesthesiaType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anesthesia</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-anesthesia">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="spinal">Spinal</SelectItem>
                              <SelectItem value="epidural">Epidural</SelectItem>
                              <SelectItem value="local">Local</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={caseForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-scheduled-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={caseForm.control}
                      name="scheduledStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" data-testid="input-start-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={caseForm.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="60" data-testid="input-duration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={caseForm.control}
                    name="preOpDiagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-Op Diagnosis</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the diagnosis" data-testid="input-diagnosis" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createCaseMutation.isPending} data-testid="button-submit-case">
                    {createCaseMutation.isPending ? "Scheduling..." : "Schedule Surgery"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-theatres">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Theatres</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-theatre-count">{theatres.length}</div>
            <p className="text-xs text-muted-foreground">{theatres.filter((t: any) => t.isActive).length} active</p>
          </CardContent>
        </Card>
        <Card data-testid="card-scheduled">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scheduled-count">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">upcoming surgeries</p>
          </CardContent>
        </Card>
        <Card data-testid="card-in-progress">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-in-progress-count">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">ongoing surgeries</p>
          </CardContent>
        </Card>
        <Card data-testid="card-completed-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-count">{completedTodayCount}</div>
            <p className="text-xs text-muted-foreground">successful surgeries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedule" data-testid="tab-schedule">Surgery Schedule</TabsTrigger>
          <TabsTrigger value="theatres" data-testid="tab-theatres">Theatres</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {casesLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-cases">Loading surgical cases...</div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No surgical cases</h3>
                <p className="text-muted-foreground mb-4">Schedule your first surgery to get started</p>
                <Button onClick={() => setIsCaseDialogOpen(true)} data-testid="button-schedule-first">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Surgery
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cases.map((surgicalCase: any) => (
                <Card key={surgicalCase.id} data-testid={`card-case-${surgicalCase.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-muted-foreground" data-testid={`text-case-number-${surgicalCase.id}`}>
                            {surgicalCase.caseNumber}
                          </span>
                          {getStatusBadge(surgicalCase.status)}
                          {getPriorityBadge(surgicalCase.priority)}
                        </div>
                        <h3 className="font-semibold text-lg" data-testid={`text-procedure-${surgicalCase.id}`}>
                          {surgicalCase.procedureName}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span data-testid={`text-patient-${surgicalCase.id}`}>{getPersonName(surgicalCase.personId)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-date-${surgicalCase.id}`}>
                              {format(new Date(surgicalCase.scheduledDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{surgicalCase.scheduledStartTime || "TBD"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Scissors className="w-4 h-4" />
                            <span>{getTheatreName(surgicalCase.theatreId)}</span>
                          </div>
                        </div>
                        {surgicalCase.preOpDiagnosis && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Diagnosis:</span> {surgicalCase.preOpDiagnosis}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {surgicalCase.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => updateCaseMutation.mutate({ id: surgicalCase.id, data: { status: "in_progress" } })}
                            disabled={updateCaseMutation.isPending}
                            data-testid={`button-start-${surgicalCase.id}`}
                          >
                            Start Surgery
                          </Button>
                        )}
                        {surgicalCase.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCaseMutation.mutate({ id: surgicalCase.id, data: { status: "completed" } })}
                            disabled={updateCaseMutation.isPending}
                            data-testid={`button-complete-${surgicalCase.id}`}
                          >
                            Complete
                          </Button>
                        )}
                        {surgicalCase.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateCaseMutation.mutate({ id: surgicalCase.id, data: { status: "cancelled" } })}
                            disabled={updateCaseMutation.isPending}
                            data-testid={`button-cancel-${surgicalCase.id}`}
                          >
                            Cancel
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

        <TabsContent value="theatres" className="space-y-4">
          {theatresLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-theatres">Loading theatres...</div>
          ) : theatres.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No operating theatres</h3>
                <p className="text-muted-foreground mb-4">Add your first operating theatre to get started</p>
                <Button onClick={() => setIsTheatreDialogOpen(true)} data-testid="button-add-first-theatre">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Theatre
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {theatres.map((theatre: any) => (
                <Card key={theatre.id} data-testid={`card-theatre-${theatre.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg" data-testid={`text-theatre-name-${theatre.id}`}>{theatre.name}</CardTitle>
                      {getTheatreTypeBadge(theatre.theatreType)}
                    </div>
                    {theatre.code && (
                      <span className="text-sm text-muted-foreground">Code: {theatre.code}</span>
                    )}
                  </CardHeader>
                  <CardContent>
                    {theatre.capacity && (
                      <p className="text-sm text-muted-foreground mb-2">{theatre.capacity}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {theatre.hourlyRate && (
                        <span className="text-sm font-medium">PKR {parseFloat(theatre.hourlyRate).toLocaleString()}/hr</span>
                      )}
                      <Badge variant={theatre.isActive ? "default" : "secondary"} data-testid={`badge-theatre-status-${theatre.id}`}>
                        {theatre.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
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
