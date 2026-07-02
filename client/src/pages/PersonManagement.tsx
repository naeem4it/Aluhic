import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Edit, Search, UserCheck, Briefcase, Calendar, Phone, CreditCard, Shield, UserPlus, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const personFormSchema = z.object({
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC format must be XXXXX-XXXXXXX-X").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits").optional().or(z.literal("")),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

const userFormSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  userType: z.string().min(1, "User type is required"),
  companyId: z.string().optional(),
  organizationId: z.string().optional(),
  facilityId: z.string().optional(),
  isSuperAdmin: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface RoleOption {
  value: string;
  label: string;
  category: string;
}

interface Company {
  id: string;
  name: string;
}

interface Facility {
  id: string;
  name: string;
  facilityType: string;
}

interface Person {
  id: string;
  cnic: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  address: string | null;
  city: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PersonContext {
  id: string;
  personId: string;
  organizationId: string;
  facilityId: string | null;
  roleType: string;
  roleTitle: string | null;
  hireDate: string;
  terminatedAt: string | null;
  terminationReason: string | null;
  isActive: boolean;
  department: string | null;
  employeeId: string | null;
}

export default function PersonManagement() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personForUser, setPersonForUser] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Super admin has access via isSuperAdmin flag or role
  // Company admin, front desk, and hr_manager also have access per menuConfig
  const allowedRoles = ["company_admin", "super_admin", "front_desk", "hr_manager"];
  const hasAccess = user && (user.isSuperAdmin || allowedRoles.includes(user.role));

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-2">
                You don't have permission to access Person Management. Super Admin, Company Admin, HR Manager, or Front Desk access required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: persons = [], isLoading } = useQuery<Person[]>({
    queryKey: ["/api/persons", searchQuery],
    queryFn: async () => {
      const url = searchQuery ? `/api/persons?search=${encodeURIComponent(searchQuery)}` : "/api/persons";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch persons");
      return response.json();
    },
  });

  const { data: personContexts = [] } = useQuery<PersonContext[]>({
    queryKey: ["/api/person-contexts", selectedPerson?.id],
    enabled: !!selectedPerson,
    queryFn: async () => {
      const response = await fetch(`/api/person-contexts?personId=${selectedPerson?.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employment history");
      return response.json();
    },
  });

  // Super admin only: fetch roles, companies, facilities for user creation
  const isSuperAdmin = user?.isSuperAdmin || user?.role === "super_admin";

  // Fetch roles from database (accessible to all authenticated users)
  const { data: dbRoles = [], isLoading: rolesLoading } = useQuery<{ id: string; name: string; code: string; category: string }[]>({
    queryKey: ["/api/roles"],
  });

  // Convert database roles to options format
  const availableRoles: RoleOption[] = dbRoles.map(role => ({
    value: role.code,
    label: role.name,
    category: role.category || "General",
  }));

  // Map role code to name for display
  const getRoleName = (roleCode: string) => {
    const role = dbRoles.find(r => r.code === roleCode);
    return role?.name || roleCode;
  };

  const fallbackUserTypes = [
    { value: "individual", label: "Individual User" },
    { value: "company", label: "Company/Organization" },
    { value: "super_admin", label: "Super Admin" },
  ];

  const availableUserTypes = fallbackUserTypes;

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    enabled: isSuperAdmin,
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/healthcare/facilities"],
    enabled: isSuperAdmin,
  });

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      cnic: "",
      phone: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: undefined,
      bloodGroup: undefined,
      address: "",
      city: "",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PersonFormValues) => {
      const cleanData = {
        ...data,
        cnic: data.cnic || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
      };
      return await apiRequest("POST", "/api/persons", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/persons"] });
      toast({ description: "Person created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to create person", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PersonFormValues> }) => {
      const cleanData = {
        ...data,
        cnic: data.cnic || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
      };
      return await apiRequest("PATCH", `/api/persons/${id}`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/persons"] });
      toast({ description: "Person updated successfully" });
      setIsDialogOpen(false);
      setEditingPerson(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to update person", variant: "destructive" });
    },
  });

  const onSubmit = (data: PersonFormValues) => {
    if (editingPerson) {
      updateMutation.mutate({ id: editingPerson.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // User form for super admin
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "user",
      userType: "individual",
      companyId: "",
      organizationId: "",
      facilityId: "",
      isSuperAdmin: false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      // Convert "none" values to undefined
      const cleanCompanyId = data.companyId && data.companyId !== "none" ? data.companyId : undefined;
      const cleanFacilityId = data.facilityId && data.facilityId !== "none" ? data.facilityId : undefined;
      const cleanOrgId = data.organizationId && data.organizationId !== "none" ? data.organizationId : undefined;
      
      if (!personForUser) {
        throw new Error("No person selected for user creation");
      }
      
      return await apiRequest("POST", "/api/admin/users/create", {
        ...data,
        personId: personForUser.id,
        companyId: cleanCompanyId,
        organizationId: cleanOrgId,
        facilityId: cleanFacilityId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/persons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ description: "User created successfully" });
      setIsUserDialogOpen(false);
      setPersonForUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const handleCreateUser = (person: Person) => {
    setPersonForUser(person);
    userForm.reset({
      email: "",
      password: "",
      firstName: person.firstName,
      lastName: person.lastName || "",
      role: "user",
      userType: "individual",
      companyId: "",
      organizationId: "",
      facilityId: "",
      isSuperAdmin: false,
    });
    setIsUserDialogOpen(true);
  };

  const onUserSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    form.reset({
      cnic: person.cnic || "",
      phone: person.phone || "",
      firstName: person.firstName,
      lastName: person.lastName || "",
      dateOfBirth: person.dateOfBirth ? person.dateOfBirth.split("T")[0] : "",
      gender: person.gender as any,
      bloodGroup: person.bloodGroup as any,
      address: person.address || "",
      city: person.city || "",
      emergencyContact: person.emergencyContact || "",
      emergencyPhone: person.emergencyPhone || "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
      setEditingPerson(null);
      form.reset();
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchQuery(formData.get("search") as string);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading persons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Person Master</h1>
          <p className="text-muted-foreground">Centralized identity management with CNIC-based deduplication</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-person">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPerson ? "Edit Person" : "Add New Person"}</DialogTitle>
              <DialogDescription>
                {editingPerson ? "Update person information" : "Create a new person record"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNIC (Primary Identifier)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345-1234567-1" data-testid="input-cnic" />
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
                        <FormLabel>Phone (Fallback Identifier)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+92 300 1234567" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Doe" data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
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

                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-blood-group">
                              <SelectValue placeholder="Select blood group" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street address" data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Contact name" data-testid="input-emergency-contact" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+92 300 1234567" data-testid="input-emergency-phone" />
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
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-person"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingPerson ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              name="search"
              placeholder="Search by name, CNIC, or phone..." 
              defaultValue={searchQuery}
              data-testid="input-search-person"
            />
            <Button type="submit" variant="secondary" data-testid="button-search">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registered Persons
              </CardTitle>
              <CardDescription>
                {persons.length} person{persons.length !== 1 ? "s" : ""} in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {persons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No persons found</p>
                  <p className="text-sm">Add a new person to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {persons.map((person) => (
                    <div
                      key={person.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedPerson?.id === person.id 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedPerson(person)}
                      data-testid={`card-person-${person.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {person.firstName} {person.lastName}
                            </h3>
                            {person.linkedUserId && (
                              <Badge variant="secondary" className="text-xs">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Linked
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {person.cnic && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {person.cnic}
                              </span>
                            )}
                            {person.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {person.phone}
                              </span>
                            )}
                            {person.dateOfBirth && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(person.dateOfBirth), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {isSuperAdmin && !person.linkedUserId && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateUser(person);
                              }}
                              data-testid={`button-create-user-${person.id}`}
                              title="Create user account"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(person);
                            }}
                            data-testid={`button-edit-person-${person.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedPerson ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Person Details</CardTitle>
                <CardDescription>
                  {selectedPerson.firstName} {selectedPerson.lastName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info" data-testid="tab-info">Info</TabsTrigger>
                    <TabsTrigger value="employment" data-testid="tab-employment">Employment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-4 pt-4">
                    <div className="space-y-3">
                      {selectedPerson.cnic && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">CNIC</p>
                          <p className="font-mono">{selectedPerson.cnic}</p>
                        </div>
                      )}
                      {selectedPerson.phone && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Phone</p>
                          <p>{selectedPerson.phone}</p>
                        </div>
                      )}
                      {selectedPerson.dateOfBirth && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Date of Birth</p>
                          <p>{format(new Date(selectedPerson.dateOfBirth), "dd MMMM yyyy")}</p>
                        </div>
                      )}
                      {selectedPerson.gender && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Gender</p>
                          <p className="capitalize">{selectedPerson.gender}</p>
                        </div>
                      )}
                      {selectedPerson.bloodGroup && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Blood Group</p>
                          <Badge variant="outline">{selectedPerson.bloodGroup}</Badge>
                        </div>
                      )}
                      {selectedPerson.address && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Address</p>
                          <p>{selectedPerson.address}{selectedPerson.city ? `, ${selectedPerson.city}` : ""}</p>
                        </div>
                      )}
                      {selectedPerson.emergencyContact && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Emergency Contact</p>
                          <p>{selectedPerson.emergencyContact}</p>
                          {selectedPerson.emergencyPhone && (
                            <p className="text-sm text-muted-foreground">{selectedPerson.emergencyPhone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="employment" className="space-y-4 pt-4">
                    {personContexts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No employment records</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {personContexts.map((ctx) => (
                          <div key={ctx.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant={ctx.isActive ? "default" : "secondary"}>
                                {getRoleName(ctx.roleType)}
                              </Badge>
                              {!ctx.isActive && (
                                <Badge variant="outline" className="text-xs">Terminated</Badge>
                              )}
                            </div>
                            {ctx.roleTitle && (
                              <p className="font-medium">{ctx.roleTitle}</p>
                            )}
                            {ctx.department && (
                              <p className="text-sm text-muted-foreground">{ctx.department}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Since {format(new Date(ctx.hireDate), "dd MMM yyyy")}
                              {ctx.terminatedAt && (
                                <> - {format(new Date(ctx.terminatedAt), "dd MMM yyyy")}</>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a person to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create User Dialog - Super Admin Only */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create User Account
            </DialogTitle>
            <DialogDescription>
              {personForUser ? (
                <>Create a user account for <strong>{personForUser.firstName} {personForUser.lastName}</strong></>
              ) : (
                "Create a new user account linked to this person"
              )}
            </DialogDescription>
          </DialogHeader>
          {!personForUser ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No person selected</p>
              <p className="text-sm">Please select a person to create a user account</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsUserDialogOpen(false)}
                data-testid="button-close-user-dialog"
              >
                Close
              </Button>
            </div>
          ) : (
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-user-firstname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-user-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-user-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} data-testid="input-user-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUserTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label} <span className="text-muted-foreground text-xs">({role.category})</span>
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
                control={userForm.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user-company">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Company</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user-facility">
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Facility</SelectItem>
                        {facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {facility.name}
                              <Badge variant="outline" className="text-xs ml-1">
                                {facility.facilityType}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="isSuperAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-super-admin"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-destructive" />
                        Super Admin Access
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Grant full platform administrative privileges
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUserDialogOpen(false)}
                  data-testid="button-cancel-user"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || rolesLoading}
                  data-testid="button-submit-user"
                >
                  {createUserMutation.isPending ? "Creating..." : rolesLoading ? "Loading..." : "Create User"}
                </Button>
              </div>
            </form>
          </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
