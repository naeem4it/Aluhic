import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  UserPlus,
  ClipboardList,
  Stethoscope,
  TestTube,
  Pill,
  CreditCard,
  CheckCircle,
  Clock,
  User,
  Phone,
  Hash,
  Calendar,
  Building,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const personSearchSchema = z.object({
  searchType: z.enum(["cnic", "phone", "name"]),
  searchValue: z.string().min(1, "Search value is required"),
});

const newPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC format must be XXXXX-XXXXXXX-X").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

const visitRegistrationSchema = z.object({
  personId: z.string().min(1, "Person is required"),
  organizationId: z.string().min(1, "Organization is required"),
  doctorContextId: z.string().optional(),
  visitType: z.enum(["consultation", "follow_up", "procedure", "emergency"]),
  chiefComplaint: z.string().optional(),
});

type PersonSearchForm = z.infer<typeof personSearchSchema>;
type NewPatientForm = z.infer<typeof newPatientSchema>;
type VisitRegistrationForm = z.infer<typeof visitRegistrationSchema>;

const statusSteps = [
  { key: "registered", label: "Registered", icon: ClipboardList },
  { key: "vitals_done", label: "Vitals", icon: User },
  { key: "in_consultation", label: "Consultation", icon: Stethoscope },
  { key: "tests_ordered", label: "Tests", icon: TestTube },
  { key: "prescription_given", label: "Prescription", icon: Pill },
  { key: "payment_pending", label: "Payment", icon: CreditCard },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

function getStatusIndex(status: string): number {
  return statusSteps.findIndex(s => s.key === status);
}

export default function OPDWorkflow() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("register");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [foundPerson, setFoundPerson] = useState<any>(null);
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: selectedOrganization ? ["/api/person-contexts", { organizationId: selectedOrganization, roleType: "doctor" }] : ["disabled"],
    enabled: !!selectedOrganization,
  });

  const { data: todayVisits = [], isLoading: visitsLoading } = useQuery<any[]>({
    queryKey: selectedOrganization ? ["/api/opd-visits", { organizationId: selectedOrganization, date: new Date().toISOString().split("T")[0] }] : ["disabled"],
    enabled: !!selectedOrganization,
  });

  const searchForm = useForm<PersonSearchForm>({
    resolver: zodResolver(personSearchSchema),
    defaultValues: {
      searchType: "phone",
      searchValue: "",
    },
  });

  const newPatientForm = useForm<NewPatientForm>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: {
      gender: "male",
    },
  });

  const visitForm = useForm<VisitRegistrationForm>({
    resolver: zodResolver(visitRegistrationSchema),
    defaultValues: {
      visitType: "consultation",
      organizationId: selectedOrganization,
    },
  });

  const searchPersonMutation = useMutation({
    mutationFn: async (data: PersonSearchForm) => {
      const response = await apiRequest("GET", `/api/persons/search?type=${data.searchType}&value=${encodeURIComponent(data.searchValue)}`);
      return response;
    },
    onSuccess: (data: any) => {
      if (data && data.id) {
        setFoundPerson(data);
        toast({ description: "Person found in system" });
      } else {
        setFoundPerson(null);
        toast({ description: "No person found. You can register a new patient.", variant: "default" });
      }
    },
    onError: () => {
      setFoundPerson(null);
      toast({ description: "No person found. You can register a new patient.", variant: "default" });
    },
  });

  const createPersonMutation = useMutation({
    mutationFn: async (data: NewPatientForm) => {
      return await apiRequest("POST", "/api/persons", {
        ...data,
        cnic: data.cnic || null,
      });
    },
    onSuccess: (data: any) => {
      setFoundPerson(data);
      queryClient.invalidateQueries({ queryKey: ["/api/persons"] });
      toast({ description: "New patient registered successfully" });
      setIsNewPatientDialogOpen(false);
      newPatientForm.reset();
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to register patient", variant: "destructive" });
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: async (data: VisitRegistrationForm) => {
      return await apiRequest("POST", "/api/opd-visits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opd-visits"] });
      toast({ description: "OPD visit registered and token issued" });
      setIsVisitDialogOpen(false);
      setFoundPerson(null);
      visitForm.reset();
      searchForm.reset();
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to register visit", variant: "destructive" });
    },
  });

  const onSearchPerson = (data: PersonSearchForm) => {
    searchPersonMutation.mutate(data);
  };

  const onCreatePatient = (data: NewPatientForm) => {
    createPersonMutation.mutate(data);
  };

  const onRegisterVisit = (data: VisitRegistrationForm) => {
    createVisitMutation.mutate({
      ...data,
      personId: foundPerson.id,
      organizationId: selectedOrganization,
    });
  };

  const handleStartVisit = () => {
    if (!foundPerson || !selectedOrganization) {
      toast({ description: "Please select an organization and find a patient first", variant: "destructive" });
      return;
    }
    visitForm.setValue("personId", foundPerson.id);
    visitForm.setValue("organizationId", selectedOrganization);
    setIsVisitDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OPD Workflow</h1>
          <p className="text-muted-foreground">Outpatient Department - Patient Journey Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
            <SelectTrigger className="w-[250px]" data-testid="select-organization">
              <Building className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Facility" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="register" data-testid="tab-register">
            <UserPlus className="h-4 w-4 mr-2" />
            Patient Registration
          </TabsTrigger>
          <TabsTrigger value="queue" data-testid="tab-queue">
            <Clock className="h-4 w-4 mr-2" />
            Today's Queue
          </TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">
            <ClipboardList className="h-4 w-4 mr-2" />
            Visit Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find or Register Patient
              </CardTitle>
              <CardDescription>
                Search for existing patient using CNIC, Phone or Name. If not found, register new patient.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(onSearchPerson)} className="flex flex-wrap gap-4">
                  <FormField
                    control={searchForm.control}
                    name="searchType"
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <FormLabel>Search By</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-search-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cnic">CNIC</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={searchForm.control}
                    name="searchValue"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[200px]">
                        <FormLabel>Search Value</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter CNIC, Phone or Name" data-testid="input-search-value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end gap-2">
                    <Button type="submit" disabled={searchPersonMutation.isPending} data-testid="button-search">
                      <Search className="h-4 w-4 mr-2" />
                      {searchPersonMutation.isPending ? "Searching..." : "Search"}
                    </Button>
                    <Dialog open={isNewPatientDialogOpen} onOpenChange={setIsNewPatientDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" data-testid="button-new-patient">
                          <UserPlus className="h-4 w-4 mr-2" />
                          New Patient
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Register New Patient</DialogTitle>
                          <DialogDescription>Enter patient details to create a new record in Person Master</DialogDescription>
                        </DialogHeader>
                        <Form {...newPatientForm}>
                          <form onSubmit={newPatientForm.handleSubmit(onCreatePatient)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={newPatientForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-first-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newPatientForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-last-name" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={newPatientForm.control}
                                name="cnic"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CNIC</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="XXXXX-XXXXXXX-X" data-testid="input-cnic" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newPatientForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone *</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={newPatientForm.control}
                                name="gender"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Gender</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-gender">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newPatientForm.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date of Birth</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} data-testid="input-dob" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newPatientForm.control}
                                name="bloodGroup"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Blood Group</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-blood-group">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="AB+">AB+</SelectItem>
                                        <SelectItem value="AB-">AB-</SelectItem>
                                        <SelectItem value="O+">O+</SelectItem>
                                        <SelectItem value="O-">O-</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={newPatientForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-address" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={newPatientForm.control}
                                name="emergencyContactName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Emergency Contact Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-emergency-name" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newPatientForm.control}
                                name="emergencyContactPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Emergency Contact Phone</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-emergency-phone" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsNewPatientDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createPersonMutation.isPending} data-testid="button-save-patient">
                                {createPersonMutation.isPending ? "Saving..." : "Register Patient"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </form>
              </Form>

              {foundPerson && (
                <Card className="mt-6 border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Patient Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{foundPerson.firstName} {foundPerson.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CNIC</p>
                        <p className="font-medium">{foundPerson.cnic || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{foundPerson.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{foundPerson.gender || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleStartVisit} disabled={!selectedOrganization} data-testid="button-start-visit">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Start OPD Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Patient Queue
              </CardTitle>
              <CardDescription>
                {todayVisits.length} patients in queue today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visitsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading queue...</div>
              ) : todayVisits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedOrganization ? "No patients in queue today" : "Please select a facility first"}
                </div>
              ) : (
                <div className="space-y-3">
                  {todayVisits.map((visit: any) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold">
                          {visit.visitNumber?.split("-").pop() || "?"}
                        </div>
                        <div>
                          <p className="font-medium">{visit.personName || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {visit.visitType} • {visit.doctorName || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            visit.status === "completed" ? "default" :
                            visit.status === "in_consultation" ? "secondary" :
                            "outline"
                          }
                        >
                          {visit.status?.replace(/_/g, " ")}
                        </Badge>
                        <Button size="sm" variant="outline" data-testid={`button-view-visit-${visit.id}`}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                OPD Visit Status Workflow
              </CardTitle>
              <CardDescription>
                Track patient journey through OPD stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[80px]">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-xs mt-2 text-center">{step.label}</p>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusSteps.slice(0, -1).map((step) => {
                  const visitsInStep = todayVisits.filter((v: any) => v.status === step.key);
                  return (
                    <Card key={step.key} className="border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <step.icon className="h-4 w-4" />
                          {step.label}
                          <Badge variant="secondary" className="ml-auto">{visitsInStep.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {visitsInStep.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No patients</p>
                        ) : (
                          <div className="space-y-2">
                            {visitsInStep.slice(0, 3).map((visit: any) => (
                              <div key={visit.id} className="text-sm p-2 rounded bg-muted/50">
                                <p className="font-medium">{visit.personName}</p>
                                <p className="text-xs text-muted-foreground">{visit.visitNumber}</p>
                              </div>
                            ))}
                            {visitsInStep.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{visitsInStep.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register OPD Visit</DialogTitle>
            <DialogDescription>
              Create a new visit record and issue queue token for {foundPerson?.firstName} {foundPerson?.lastName}
            </DialogDescription>
          </DialogHeader>
          <Form {...visitForm}>
            <form onSubmit={visitForm.handleSubmit(onRegisterVisit)} className="space-y-4">
              <FormField
                control={visitForm.control}
                name="visitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-visit-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={visitForm.control}
                name="doctorContextId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Doctor (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-doctor">
                          <SelectValue placeholder="Select doctor or leave for walk-in" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doc: any) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            Dr. {doc.personName} - {doc.specialty || "General"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={visitForm.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of patient's complaint" data-testid="input-chief-complaint" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsVisitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createVisitMutation.isPending} data-testid="button-issue-token">
                  {createVisitMutation.isPending ? "Issuing..." : "Issue Token & Register"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}