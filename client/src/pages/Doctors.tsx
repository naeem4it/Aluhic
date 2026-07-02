import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Search, Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ComboboxWithAdd, type ComboboxOption } from "@/components/ui/combobox-with-add";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Doctor, Specialty } from "@shared/schema";

const doctorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.string().optional(),
  clinic: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

export default function Doctors() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: specialties = [], isLoading: isLoadingSpecialties } = useQuery<Specialty[]>({
    queryKey: ["/api/specialties"],
  });

  const specialtyOptions: ComboboxOption[] = specialties.map((s) => ({
    value: s.name,
    label: s.name,
  }));

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: "",
      specialty: "",
      clinic: "",
      phone: "",
      email: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DoctorFormValues) => {
      return await apiRequest("POST", "/api/doctors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Doctor added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add doctor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DoctorFormValues> }) => {
      return await apiRequest("PATCH", `/api/doctors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setEditingDoctor(null);
      form.reset();
      toast({
        title: "Success",
        description: "Doctor updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update doctor",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/doctors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setDeletingDoctor(null);
      toast({
        title: "Success",
        description: "Doctor deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete doctor",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, updateDuplicates }: { file: File; updateDuplicates: boolean }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (updateDuplicates) {
        formData.append("updateDuplicates", "true");
      }

      const endpoint = updateDuplicates ? "/api/doctors/upload-with-update" : "/api/doctors/upload";
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setUploadFile(null);
      setDuplicateData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      if (error.duplicates) {
        setDuplicateData(error);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to upload doctors",
          variant: "destructive",
        });
        setUploadFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
  });

  const handleAdd = () => {
    form.reset();
    setIsAddDialogOpen(true);
  };

  const handleAddSpecialty = async (name: string): Promise<ComboboxOption | null> => {
    try {
      const response = await apiRequest("POST", "/api/specialties", { name });
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({
        title: "Success",
        description: `Specialty "${data.name}" added successfully`,
      });
      return { value: data.name, label: data.name };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add specialty",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleEdit = (doctor: Doctor) => {
    form.reset({
      name: doctor.name,
      specialty: doctor.specialty || "",
      clinic: doctor.clinic || "",
      phone: doctor.phone || "",
      email: doctor.email || "",
      address: doctor.address || "",
      latitude: doctor.latitude ? parseFloat(doctor.latitude) : undefined,
      longitude: doctor.longitude ? parseFloat(doctor.longitude) : undefined,
      notes: doctor.notes || "",
    });
    setEditingDoctor(doctor);
  };

  const handleSubmit = (data: DoctorFormValues) => {
    if (editingDoctor) {
      updateMutation.mutate({ id: editingDoctor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/doctors/template", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "doctors_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({
          title: "Error",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setUploadFile(file);
      uploadMutation.mutate({ file, updateDuplicates: false });
    }
  };

  const handleConfirmUpdate = () => {
    if (uploadFile) {
      uploadMutation.mutate({ file: uploadFile, updateDuplicates: true });
    }
  };

  const handleCancelUpdate = () => {
    setDuplicateData(null);
    setUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query) ||
      doctor.clinic?.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-doctors">Doctor Information</h1>
          <p className="text-muted-foreground">Manage your doctor contacts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadTemplate} variant="outline" data-testid="button-download-template">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" data-testid="button-upload-excel">
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-excel-file"
          />
          <Button onClick={handleAdd} data-testid="button-add-doctor">
            <Plus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
          <CardDescription>View and manage all your doctor contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-doctors"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-doctors">
              <p className="text-muted-foreground">
                {searchQuery ? "No doctors found matching your search" : "No doctors added yet"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAdd} className="mt-4" variant="outline" data-testid="button-add-first-doctor">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Doctor
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Specialty</TableHead>
                    <TableHead className="hidden lg:table-cell">Clinic</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id} data-testid={`row-doctor-${doctor.id}`}>
                      <TableCell className="font-medium" data-testid={`text-doctor-name-${doctor.id}`}>
                        {doctor.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doctor.specialty || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {doctor.clinic || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          {doctor.phone && <div>{doctor.phone}</div>}
                          {doctor.email && <div className="text-muted-foreground">{doctor.email}</div>}
                          {!doctor.phone && !doctor.email && "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(doctor)}
                            data-testid={`button-edit-doctor-${doctor.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingDoctor(doctor)}
                            data-testid={`button-delete-doctor-${doctor.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen || !!editingDoctor} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingDoctor(null);
          form.reset();
        }
      }}>
        <DialogContent data-testid="dialog-doctor-form">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
            <DialogDescription>
              {editingDoctor ? "Update doctor information" : "Add a new doctor to your contacts"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dr. John Smith" data-testid="input-doctor-name" />
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
                    <FormControl>
                      <ComboboxWithAdd
                        options={specialtyOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onAddNew={handleAddSpecialty}
                        placeholder="Select specialty..."
                        searchPlaceholder="Search or add new..."
                        emptyMessage="No specialties found."
                        isLoading={isLoadingSpecialties}
                        data-testid="input-doctor-specialty"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clinic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic/Hospital</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City Hospital" data-testid="input-doctor-clinic" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 98765 43210" data-testid="input-doctor-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="doctor@example.com" data-testid="input-doctor-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main Street, City" data-testid="input-doctor-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude (GPS)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.00000001" placeholder="24.12345678" data-testid="input-doctor-latitude" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude (GPS)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.00000001" placeholder="67.12345678" data-testid="input-doctor-longitude" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Additional notes..." data-testid="input-doctor-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingDoctor(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-doctor"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-doctor"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingDoctor ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDoctor} onOpenChange={(open) => !open && setDeletingDoctor(null)}>
        <AlertDialogContent data-testid="dialog-delete-doctor">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingDoctor?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-doctor">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDoctor && deleteMutation.mutate(deletingDoctor.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-doctor"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!duplicateData} onOpenChange={(open) => !open && handleCancelUpdate()}>
        <AlertDialogContent data-testid="dialog-duplicate-doctors">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Doctors Found</AlertDialogTitle>
            <AlertDialogDescription>
              Found {duplicateData?.duplicates?.length || 0} duplicate doctor(s) in the file. 
              {duplicateData?.validRows > 0 && ` ${duplicateData.validRows} new doctor(s) can be imported.`}
              <br /><br />
              Do you want to update the existing doctors with the new data from the file?
              <br /><br />
              <strong>Duplicates:</strong>
              <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto">
                {duplicateData?.duplicates?.map((dup: any, idx: number) => (
                  <li key={idx}>{dup.name} ({dup.email})</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpdate} data-testid="button-cancel-update">
              No, Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              data-testid="button-confirm-update"
            >
              Yes, Update Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
