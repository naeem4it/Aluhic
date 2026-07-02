import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Calendar, CreditCard, Search, UserPlus, Clock, CheckCircle, 
  Stethoscope, Users, ChevronRight, X
} from "lucide-react";
import { format } from "date-fns";

const patientSearchSchema = z.object({
  searchTerm: z.string().min(1, "Enter CNIC, phone, or name to search"),
});

const newPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().min(10, "Valid phone number required"),
  cnic: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

interface Doctor {
  id: string;
  name: string;
  personName?: string;
  specialty: string;
  consultationFee: number;
  facilityId: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  cnic?: string;
}

interface SearchDoctorsResponse {
  doctors: Doctor[];
  specialties: string[];
  totalCount: number;
}

export default function FrontDeskAppointmentBooking() {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "patient" | "payment" | "confirm">("select");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatientDialog, setIsNewPatientDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  // Doctor search state
  const [doctorNameSearch, setDoctorNameSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [searchedDoctors, setSearchedDoctors] = useState<Doctor[]>([]);

  // Fetch all specialties for dropdown
  const { data: allSpecialties = [] } = useQuery<string[]>({
    queryKey: ["/api/healthcare/specialties"],
  });

  // Search doctors by name
  const searchDoctorsByNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("GET", `/api/healthcare/doctors/search?name=${encodeURIComponent(name)}`);
      return response as SearchDoctorsResponse;
    },
    onSuccess: (data) => {
      setSearchedDoctors(data.doctors);
      
      // Auto-select specialty if only one doctor found
      if (data.doctors.length === 1) {
        const doctor = data.doctors[0];
        if (doctor.specialty) {
          setSelectedSpecialty(doctor.specialty);
          setSelectedDoctor(doctor);
          toast({ description: `Found Dr. ${doctor.personName || doctor.name} - ${doctor.specialty}` });
        }
      } else if (data.doctors.length === 0) {
        toast({ description: "No doctors found with that name", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ description: "Failed to search doctors", variant: "destructive" });
    },
  });

  // Search doctors by specialty
  const searchDoctorsBySpecialtyMutation = useMutation({
    mutationFn: async (specialty: string) => {
      const response = await apiRequest("GET", `/api/healthcare/doctors/search?specialty=${encodeURIComponent(specialty)}`);
      return response as SearchDoctorsResponse;
    },
    onSuccess: (data) => {
      setSearchedDoctors(data.doctors);
      if (data.doctors.length === 0) {
        toast({ description: "No doctors found for this specialty", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ description: "Failed to search doctors", variant: "destructive" });
    },
  });

  // Handle specialty change
  useEffect(() => {
    if (selectedSpecialty) {
      searchDoctorsBySpecialtyMutation.mutate(selectedSpecialty);
    } else {
      setSearchedDoctors([]);
    }
  }, [selectedSpecialty]);

  const { data: todayAppointments = [] } = useQuery<any[]>({
    queryKey: ["/api/healthcare/appointments", format(new Date(), "yyyy-MM-dd")],
  });

  const searchForm = useForm({
    resolver: zodResolver(patientSearchSchema),
    defaultValues: { searchTerm: "" },
  });

  const newPatientForm = useForm({
    resolver: zodResolver(newPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      cnic: "",
      gender: "",
      dateOfBirth: "",
    },
  });

  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: selectedDoctor?.consultationFee || 0,
      paymentMethod: "cash",
    },
  });

  const searchPatientMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const response = await apiRequest("GET", `/api/healthcare/patients/search?q=${encodeURIComponent(searchTerm)}`);
      return response;
    },
    onSuccess: (data: Patient[]) => {
      setSearchResults(data || []);
      if (data?.length === 0) {
        toast({ description: "No patients found. You can register a new patient." });
      }
    },
    onError: () => {
      toast({ description: "Failed to search patients", variant: "destructive" });
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/healthcare/patients", {
        ...data,
        facilityId: selectedDoctor?.facilityId,
      });
    },
    onSuccess: (patient: Patient) => {
      setSelectedPatient(patient);
      setIsNewPatientDialog(false);
      setStep("payment");
      toast({ description: "Patient registered successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/patients"] });
    },
    onError: () => {
      toast({ description: "Failed to register patient", variant: "destructive" });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/healthcare/payments", {
        ...data,
        facilityId: selectedDoctor?.facilityId,
        patientId: selectedPatient?.id,
        doctorId: selectedDoctor?.id,
        paymentType: "consultation_fee",
        paymentStatus: "completed",
      });
    },
    onSuccess: () => {
      setPaymentCompleted(true);
      toast({ description: "Payment processed successfully" });
    },
    onError: () => {
      toast({ description: "Failed to process payment", variant: "destructive" });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      return await apiRequest("POST", "/api/healthcare/appointments", {
        facilityId: selectedDoctor?.facilityId,
        patientId: selectedPatient?.id,
        doctorId: selectedDoctor?.id,
        appointmentDate: format(now, "yyyy-MM-dd"),
        appointmentTime: format(now, "HH:mm"),
        status: "scheduled",
        notes: "Walk-in appointment booked at front desk",
      });
    },
    onSuccess: async (appointment) => {
      await createQueueEntryMutation.mutateAsync(appointment.id);
    },
    onError: () => {
      toast({ description: "Failed to create appointment", variant: "destructive" });
    },
  });

  const createQueueEntryMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await apiRequest("POST", "/api/healthcare/queue", {
        facilityId: selectedDoctor?.facilityId,
        patientId: selectedPatient?.id,
        doctorId: selectedDoctor?.id,
        queueDate: new Date().toISOString(),
        status: "waiting",
      });
    },
    onSuccess: () => {
      setStep("confirm");
      toast({ description: "Appointment booked and patient added to queue!" });
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/queue"] });
    },
    onError: () => {
      toast({ description: "Failed to add to queue", variant: "destructive" });
    },
  });

  const handleDoctorNameSearch = () => {
    if (doctorNameSearch.trim()) {
      searchDoctorsByNameMutation.mutate(doctorNameSearch.trim());
    }
  };

  const handleSearch = (data: { searchTerm: string }) => {
    searchPatientMutation.mutate(data.searchTerm);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep("payment");
    paymentForm.setValue("amount", selectedDoctor?.consultationFee || 0);
  };

  const handlePayment = (data: { amount: number; paymentMethod: string }) => {
    createPaymentMutation.mutate(data);
  };

  const handleBookAppointment = () => {
    createAppointmentMutation.mutate();
  };

  const handleReset = () => {
    setStep("select");
    setSelectedDoctor(null);
    setSelectedPatient(null);
    setPaymentCompleted(false);
    setSearchResults([]);
    setDoctorNameSearch("");
    setSelectedSpecialty("");
    setSearchedDoctors([]);
    searchForm.reset();
    newPatientForm.reset();
    paymentForm.reset();
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    if (doctor.specialty && !selectedSpecialty) {
      setSelectedSpecialty(doctor.specialty);
    }
  };

  const clearDoctorSelection = () => {
    setSelectedDoctor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Book Appointment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Front Desk - {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-frontdesk-booking">
          <Calendar className="h-3 w-3" />
          Front Desk Booking
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center gap-2 ${step === "select" ? "text-primary" : "text-muted-foreground"}`}>
          <Badge variant={step === "select" ? "default" : "secondary"}>1</Badge>
          <span className="hidden sm:inline">Select Doctor</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === "patient" ? "text-primary" : "text-muted-foreground"}`}>
          <Badge variant={step === "patient" ? "default" : "secondary"}>2</Badge>
          <span className="hidden sm:inline">Patient</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
          <Badge variant={step === "payment" ? "default" : "secondary"}>3</Badge>
          <span className="hidden sm:inline">Payment</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === "confirm" ? "text-primary" : "text-muted-foreground"}`}>
          <Badge variant={step === "confirm" ? "default" : "secondary"}>4</Badge>
          <span className="hidden sm:inline">Done</span>
        </div>
      </div>

      {step === "select" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Find Doctor
              </CardTitle>
              <CardDescription>Search by doctor name or select specialty</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Doctor Name Search */}
              <div className="space-y-2">
                <Label>Search by Doctor Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={doctorNameSearch}
                    onChange={(e) => setDoctorNameSearch(e.target.value)}
                    placeholder="Enter doctor name..."
                    onKeyDown={(e) => e.key === "Enter" && handleDoctorNameSearch()}
                    data-testid="input-doctor-name-search"
                  />
                  <Button 
                    onClick={handleDoctorNameSearch}
                    disabled={searchDoctorsByNameMutation.isPending}
                    data-testid="button-search-doctor"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Specialty Dropdown */}
              <div className="space-y-2">
                <Label>Or Select Specialty</Label>
                <Select
                  value={selectedSpecialty}
                  onValueChange={(value) => {
                    setSelectedSpecialty(value);
                    setSelectedDoctor(null);
                  }}
                >
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue placeholder="Select specialty to see all doctors" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSpecialties.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Doctor List */}
              {searchedDoctors.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>Available Doctors ({searchedDoctors.length})</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchedDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedDoctor?.id === doctor.id 
                            ? "border-primary bg-primary/10" 
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleSelectDoctor(doctor)}
                        data-testid={`doctor-card-${doctor.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Dr. {doctor.personName || doctor.name}</p>
                            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                          </div>
                          <Badge variant="secondary">
                            Rs. {doctor.consultationFee || 0}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Doctor Card */}
              {selectedDoctor && (
                <Card className="bg-primary/5 border-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dr. {selectedDoctor.personName || selectedDoctor.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-lg">
                          Rs. {selectedDoctor.consultationFee || 0}
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={clearDoctorSelection}
                          data-testid="button-clear-doctor"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full"
                disabled={!selectedDoctor || !selectedDoctor.facilityId}
                onClick={() => {
                  if (!selectedDoctor || !selectedDoctor.facilityId) {
                    toast({ description: "Please select a valid doctor", variant: "destructive" });
                    return;
                  }
                  setStep("patient");
                }}
                data-testid="button-next-patient"
              >
                Next: Select Patient
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Queue
              </CardTitle>
              <CardDescription>Current appointments for selected doctor</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDoctor ? (
                <div className="space-y-2">
                  {todayAppointments
                    .filter((a: any) => a.doctorId === selectedDoctor.id)
                    .map((a: any, idx: number) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-2 rounded-lg border"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{idx + 1}</Badge>
                          <span className="text-sm">{a.patientName || "Patient"}</span>
                        </div>
                        <Badge
                          variant={a.status === "completed" ? "default" : "secondary"}
                        >
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  {todayAppointments.filter((a: any) => a.doctorId === selectedDoctor?.id).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No appointments yet today
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select a doctor to see their queue
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === "patient" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Find or Register Patient
            </CardTitle>
            <CardDescription>Search by CNIC, phone number, or name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(handleSearch)} className="flex gap-2">
                <FormField
                  control={searchForm.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter CNIC, phone, or patient name..."
                          data-testid="input-patient-search"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={searchPatientMutation.isPending} data-testid="button-search">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewPatientDialog(true)}
                  data-testid="button-new-patient"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Patient
                </Button>
              </form>
            </Form>

            {searchResults.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>CNIC</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((patient) => (
                    <TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                      <TableCell>
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.cnic || "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPatient(patient)}
                          data-testid={`button-select-patient-${patient.id}`}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "payment" && selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Collect Consultation Fee
            </CardTitle>
            <CardDescription>
              Patient: {selectedPatient.firstName} {selectedPatient.lastName} | 
              Doctor: Dr. {selectedDoctor?.personName || selectedDoctor?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p className="text-sm">{selectedPatient.phone}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Doctor</p>
                    <p className="font-medium">Dr. {selectedDoctor?.personName || selectedDoctor?.name}</p>
                    <p className="text-sm">{selectedDoctor?.specialty}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {!paymentCompleted ? (
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handlePayment)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (Rs.)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="upi">UPI/Online</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createPaymentMutation.isPending}
                    data-testid="button-process-payment"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {createPaymentMutation.isPending ? "Processing..." : "Process Payment"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Payment collected successfully!
                  </span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleBookAppointment}
                  disabled={createAppointmentMutation.isPending}
                  data-testid="button-book-appointment"
                >
                  {createAppointmentMutation.isPending ? "Booking..." : "Complete Booking & Add to Queue"}
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("patient")}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Appointment Booked Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">Dr. {selectedDoctor?.personName || selectedDoctor?.name}</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              Patient has been added to the doctor's queue.
            </p>
            <Button className="w-full" onClick={handleReset} data-testid="button-book-another">
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Patient Dialog */}
      <Dialog open={isNewPatientDialog} onOpenChange={setIsNewPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>
              Enter patient details to register them in the system.
            </DialogDescription>
          </DialogHeader>
          <Form {...newPatientForm}>
            <form onSubmit={newPatientForm.handleSubmit((data) => createPatientMutation.mutate(data))} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={newPatientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={newPatientForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                        <Input {...field} type="date" data-testid="input-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsNewPatientDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPatientMutation.isPending} data-testid="button-register-patient">
                  {createPatientMutation.isPending ? "Registering..." : "Register Patient"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
