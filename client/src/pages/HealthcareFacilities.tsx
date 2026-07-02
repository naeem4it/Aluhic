import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { insertHealthcareFacilitySchema, type HealthcareFacility, type InsertHealthcareFacility } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

export default function HealthcareFacilities() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<HealthcareFacility | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [sameAsFacilityName, setSameAsFacilityName] = useState<boolean>(true);
  const [organizationTypeId, setOrganizationTypeId] = useState<string>("");

  // Get current user to check if super admin - use useAuth hook for correct endpoint
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "super_admin" || user?.isSuperAdmin;

  // Fetch organization types for super admin
  const { data: organizationTypes = [] } = useQuery<{ id: string; name: string; code: string }[]>({
    queryKey: ["/api/admin/organization-types"],
    enabled: isSuperAdmin,
  });

  const { data: facilities = [], isLoading } = useQuery<HealthcareFacility[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  // Form schema - omit companyId since we handle it separately
  const formSchema = insertHealthcareFacilitySchema.omit({ companyId: true });
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      facilityType: "individual_clinic",
      address: "",
      phone: "",
      email: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // For super admin, include organization name and type to create both org and facility
      const orgName = sameAsFacilityName ? data.name : organizationName;
      const requestData = isSuperAdmin && orgName
        ? { ...data, organizationName: orgName, organizationTypeId: organizationTypeId || undefined } 
        : data;
      return await apiRequest("POST", "/api/healthcare/facilities", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ description: "Facility and organization created successfully" });
      setIsDialogOpen(false);
      setOrganizationName("");
      setOrganizationTypeId("");
      setSameAsFacilityName(true);
      form.reset();
    },
    onError: (error: any) => {
      // Testing phase: show full error details
      const errorMessage = error?.message || "Failed to create facility";
      const errorDetails = error?.error || error?.details || "";
      toast({ 
        title: "Failed to create facility",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage, 
        variant: "destructive" 
      });
      console.error("Create facility error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertHealthcareFacility> }) => {
      return await apiRequest("PATCH", `/api/healthcare/facilities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/facilities"] });
      toast({ description: "Facility updated successfully" });
      setIsDialogOpen(false);
      setEditingFacility(null);
      form.reset();
    },
    onError: (error: any) => {
      // Testing phase: show full error details
      const errorMessage = error?.message || "Failed to update facility";
      const errorDetails = error?.error || error?.details || "";
      toast({ 
        title: "Failed to update facility",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage, 
        variant: "destructive" 
      });
      console.error("Update facility error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/healthcare/facilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/facilities"] });
      toast({ description: "Facility deleted successfully" });
    },
    onError: (error: any) => {
      // Testing phase: show full error details
      const errorMessage = error?.message || "Failed to delete facility";
      const errorDetails = error?.error || error?.details || "";
      toast({ 
        title: "Failed to delete facility",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage, 
        variant: "destructive" 
      });
      console.error("Delete facility error:", error);
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingFacility) {
      updateMutation.mutate({ id: editingFacility.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (facility: HealthcareFacility) => {
    setEditingFacility(facility);
    form.reset({
      name: facility.name,
      facilityType: facility.facilityType,
      address: facility.address || "",
      phone: facility.phone || "",
      email: facility.email || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this facility?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
      setEditingFacility(null);
      setOrganizationName("");
      setSameAsFacilityName(true);
      form.reset();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Healthcare Facilities</h1>
          <p className="text-muted-foreground">Manage hospitals and clinics</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-facility">
              <Plus className="h-4 w-4 mr-2" />
              Add Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFacility ? "Edit Facility" : "Add New Facility"}</DialogTitle>
              <DialogDescription>
                {editingFacility ? "Update facility information" : "Create a new healthcare facility"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Organization details for super admin - create new org with facility */}
                {isSuperAdmin && !editingFacility && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Organization Settings</h4>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Organization Type</label>
                      <Select 
                        value={organizationTypeId} 
                        onValueChange={setOrganizationTypeId}
                      >
                        <SelectTrigger data-testid="select-organization-type">
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAsFacility"
                        checked={sameAsFacilityName}
                        onCheckedChange={(checked) => {
                          setSameAsFacilityName(checked === true);
                          if (checked) {
                            setOrganizationName("");
                          }
                        }}
                        data-testid="checkbox-same-facility-name"
                      />
                      <label 
                        htmlFor="sameAsFacility" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Same as facility name
                      </label>
                    </div>
                    {!sameAsFacilityName && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Organization Name</label>
                        <Input
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="Enter organization name"
                          data-testid="input-organization-name"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {sameAsFacilityName 
                        ? "Organization will be created with the same name as the facility"
                        : "Enter a different name for the organization"}
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City Hospital" data-testid="input-facility-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-facility-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual_clinic">Individual Clinic</SelectItem>
                          <SelectItem value="multi_doctor_clinic">Multi-Doctor Clinic</SelectItem>
                          <SelectItem value="hospital">Hospital</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Enter address" data-testid="input-facility-address" />
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
                          <Input {...field} value={field.value || ""} placeholder="03XX-XXXXXXX" data-testid="input-facility-phone" />
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
                          <Input {...field} value={field.value || ""} type="email" placeholder="contact@facility.com" data-testid="input-facility-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingFacility ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {facilities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">No facilities found</p>
            <p className="text-sm text-muted-foreground text-center">Get started by adding your first healthcare facility</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.id} className="hover-elevate" data-testid={`card-facility-${facility.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{facility.name}</CardTitle>
                    <CardDescription className="capitalize">{facility.facilityType.replace(/_/g, " ")}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(facility)}
                      data-testid={`button-edit-${facility.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(facility.id)}
                      data-testid={`button-delete-${facility.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {facility.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{facility.address}</p>
                )}
                {facility.phone && (
                  <p className="text-sm text-muted-foreground">{facility.phone}</p>
                )}
                {facility.email && (
                  <p className="text-sm text-muted-foreground">{facility.email}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
