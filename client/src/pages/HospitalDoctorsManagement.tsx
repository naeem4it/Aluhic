import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Users, Stethoscope, Building2, Pencil, Trash2 } from "lucide-react";
import PersonSearch, { type PersonSearchResult } from "@/components/PersonSearch";
import { useAuth } from "@/hooks/useAuth";

const doctorSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  personId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  cnic: z.string().optional(),
  specialty: z.string().min(1, "Specialty is required"),
  qualification: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  agreementType: z.enum(["permanent", "on_call"]),
  monthlySalary: z.string().optional(),
  perPatientFee: z.string().optional(),
  percentageShare: z.string().optional(),
});

interface Doctor {
  id: string;
  facilityId: string;
  name: string;
  specialty: string;
  qualification?: string;
  email?: string;
  phone?: string;
  agreementType: string;
  monthlySalary?: string;
  perPatientFee?: string;
  percentageShare?: string;
  isActive: boolean;
  createdAt: string;
  // Person Master fields
  personId?: string;
  displayName?: string;
  personCnic?: string;
  personPhone?: string;
  personEmail?: string;
  person?: {
    id: string;
    firstName: string;
    lastName?: string;
    cnic?: string;
    phone?: string;
    email?: string;
  };
}

const specialties = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "Gynecologist",
  "Ophthalmologist",
  "ENT Specialist",
  "Psychiatrist",
  "Urologist",
  "Oncologist",
  "Radiologist",
  "Anesthesiologist",
  "Surgeon",
];

export default function HospitalDoctorsManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonSearchResult | null>(null);

  const { data: facilities, isLoading: loadingFacilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: doctors, isLoading: loadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/healthcare/doctors", selectedFacility],
    queryFn: async () => {
      const res = await fetch(`/api/healthcare/doctors?facilityId=${selectedFacility}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const form = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      facilityId: "",
      name: "",
      cnic: "",
      specialty: "",
      qualification: "",
      email: "",
      phone: "",
      agreementType: "permanent",
      monthlySalary: "",
      perPatientFee: "",
      percentageShare: "",
    },
  });

  const agreementType = form.watch("agreementType");

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof doctorSchema>) => {
      if (editingDoctor) {
        const res = await apiRequest("PATCH", `/api/healthcare/doctors/${editingDoctor.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", `/api/healthcare/doctors`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: editingDoctor ? "Doctor updated" : "Doctor added" });
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/doctors", selectedFacility] });
      setIsDialogOpen(false);
      setEditingDoctor(null);
      setSelectedPerson(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to save doctor", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ doctorId }: { doctorId: string }) => {
      const res = await apiRequest("DELETE", `/api/healthcare/doctors/${doctorId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Doctor removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/doctors", selectedFacility] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove doctor", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.reset({
      facilityId: doctor.facilityId,
      name: doctor.name,
      cnic: doctor.personCnic || "",
      specialty: doctor.specialty,
      qualification: (doctor as any).qualification || "",
      email: doctor.email || "",
      phone: doctor.phone || "",
      agreementType: doctor.agreementType as "permanent" | "on_call",
      monthlySalary: doctor.monthlySalary || "",
      perPatientFee: doctor.perPatientFee || "",
      percentageShare: doctor.percentageShare || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingDoctor(null);
    setSelectedPerson(null);
    form.reset({
      facilityId: selectedFacility,
      personId: "",
      name: "",
      cnic: "",
      specialty: "",
      qualification: "",
      email: "",
      phone: "",
      agreementType: "permanent",
      monthlySalary: "",
      perPatientFee: "",
      percentageShare: "",
    });
    setIsDialogOpen(true);
  };

  // Handle person selection from search
  const handlePersonSelect = (person: PersonSearchResult) => {
    setSelectedPerson(person);
    const fullName = `${person.firstName} ${person.lastName || ''}`.trim();
    form.setValue("personId", person.id);
    form.setValue("name", fullName);
    form.setValue("cnic", (person as any).cnic || "");
    form.setValue("email", person.email || "");
    form.setValue("phone", person.phone || "");
  };

  const handleClearPerson = () => {
    setSelectedPerson(null);
    form.setValue("personId", "");
    form.setValue("name", "");
    form.setValue("cnic", "");
    form.setValue("email", "");
    form.setValue("phone", "");
  };

  const permanentDoctors = doctors?.filter((d) => d.agreementType === "permanent").length || 0;
  const onCallDoctors = doctors?.filter((d) => d.agreementType === "on_call").length || 0;

  if (loadingFacilities) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hospital Doctors Management</h1>
          <p className="text-muted-foreground">Manage doctors and their agreements</p>
        </div>
        <Button onClick={handleAddNew} disabled={!selectedFacility} data-testid="button-add-doctor">
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedFacility} onValueChange={setSelectedFacility}>
          <SelectTrigger className="w-[300px]" data-testid="select-facility">
            <SelectValue placeholder="Select a facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities?.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {f.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFacility && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-doctors">{doctors?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Permanent</CardTitle>
                <Stethoscope className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500" data-testid="text-permanent-doctors">{permanentDoctors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">On-Call</CardTitle>
                <Stethoscope className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500" data-testid="text-oncall-doctors">{onCallDoctors}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Doctors List</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Agreement</TableHead>
                      <TableHead>Compensation</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors && doctors.length > 0 ? (
                      doctors.map((doctor) => (
                        <TableRow key={doctor.id} data-testid={`row-doctor-${doctor.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>Dr. {doctor.displayName || doctor.name}</span>
                              {doctor.personCnic && (
                                <span className="text-xs text-muted-foreground">CNIC: {doctor.personCnic}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{doctor.specialty}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={doctor.agreementType === "permanent" ? "bg-blue-500" : "bg-green-500"}>
                              {doctor.agreementType === "permanent" ? "Permanent" : "On-Call"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doctor.agreementType === "permanent" ? (
                              <span>${doctor.monthlySalary || "0"}/mo</span>
                            ) : (
                              <span>
                                ${doctor.perPatientFee || "0"}/patient + {doctor.percentageShare || "0"}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doctor.personEmail || doctor.email || doctor.personPhone || doctor.phone || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleEdit(doctor)}
                                data-testid={`button-edit-${doctor.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => deleteMutation.mutate({ doctorId: doctor.id })}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-${doctor.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No doctors found. Add a doctor to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedFacility && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Select a Facility</h3>
            <p className="text-muted-foreground">Choose a healthcare facility to manage its doctors</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setSelectedPerson(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              {/* Person Search - only show when adding new doctor */}
              {!editingDoctor && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Existing Person</label>
                  <PersonSearch
                    onSelect={handlePersonSelect}
                    onClear={handleClearPerson}
                    selectedPerson={selectedPerson}
                    placeholder="Search by name, phone, or CNIC..."
                    organizationId={user?.companyId || undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Search for an existing person in the system, or enter details manually below.
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dr. John Smith" data-testid="input-doctor-name" disabled={!!selectedPerson} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-specialty">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled={!!selectedPerson} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!!selectedPerson} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNIC Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 35202-1234567-1" data-testid="input-doctor-cnic" disabled={!!selectedPerson} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agreementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-agreement-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent (Monthly Salary)</SelectItem>
                        <SelectItem value="on_call">On-Call (Per Patient + Commission)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {agreementType === "permanent" ? (
                <FormField
                  control={form.control}
                  name="monthlySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Salary ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-monthly-salary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="perPatientFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Per Patient Fee ($)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-per-patient-fee" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="percentageShare"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission (%)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-percentage-share" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-doctor">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDoctor ? "Update Doctor" : "Add Doctor"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
