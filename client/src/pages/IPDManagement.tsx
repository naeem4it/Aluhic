import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Bed, UserPlus, Users, Search, Plus, Calendar, User, ArrowRightLeft, LogOut, Loader2, Settings, Activity, Heart, AlertTriangle } from "lucide-react";
import type { Ward, Bed as BedType, IpdAdmission } from "@shared/schema";

const createWardSchema = z.object({
  name: z.string().min(1, "Ward name required"),
  code: z.string().min(1, "Ward code required"),
  wardType: z.enum(["general", "semi_private", "private", "icu", "nicu", "picu", "ccu", "emergency"]),
  floor: z.string().optional(),
  totalBeds: z.number().int().nonnegative().optional(),
  dailyRate: z.string().optional(),
});

const createBedSchema = z.object({
  wardId: z.string().min(1, "Ward required"),
  bedNumber: z.string().min(1, "Bed number required"),
  bedType: z.enum(["standard", "electric", "icu", "pediatric", "bariatric"]),
  dailyRateOverride: z.string().optional(),
});

const createAdmissionSchema = z.object({
  personId: z.string().min(1, "Patient ID required"),
  admissionType: z.enum(["emergency", "planned", "transfer"]),
  admissionReason: z.string().optional(),
  chiefComplaint: z.string().optional(),
  wardId: z.string().optional(),
  bedId: z.string().optional(),
  expectedDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

type CreateWardFormData = z.infer<typeof createWardSchema>;
type CreateBedFormData = z.infer<typeof createBedSchema>;
type CreateAdmissionFormData = z.infer<typeof createAdmissionSchema>;

export default function IPDManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("admissions");
  const [searchTerm, setSearchTerm] = useState("");
  const [showWardDialog, setShowWardDialog] = useState(false);
  const [showBedDialog, setShowBedDialog] = useState(false);
  const [showAdmissionDialog, setShowAdmissionDialog] = useState(false);
  const [selectedWardForBeds, setSelectedWardForBeds] = useState<string | undefined>();

  const { data: wards = [], isLoading: loadingWards } = useQuery<Ward[]>({
    queryKey: ["/api/ipd/wards"],
  });

  const { data: beds = [], isLoading: loadingBeds } = useQuery<BedType[]>({
    queryKey: selectedWardForBeds ? [`/api/ipd/beds?wardId=${selectedWardForBeds}`] : ["/api/ipd/beds"],
    enabled: !!selectedWardForBeds || activeTab === "beds",
  });

  const { data: admissions = [], isLoading: loadingAdmissions } = useQuery<IpdAdmission[]>({
    queryKey: ["/api/ipd/admissions"],
  });

  const { data: availableBeds = [] } = useQuery<BedType[]>({
    queryKey: selectedWardForBeds ? [`/api/ipd/wards/${selectedWardForBeds}/available-beds`] : ["/api/ipd/wards/none/available-beds"],
    enabled: !!selectedWardForBeds,
  });

  const wardForm = useForm<CreateWardFormData>({
    resolver: zodResolver(createWardSchema),
    defaultValues: {
      name: "",
      code: "",
      wardType: "general",
      floor: "",
      totalBeds: 0,
      dailyRate: "",
    },
  });

  const bedForm = useForm<CreateBedFormData>({
    resolver: zodResolver(createBedSchema),
    defaultValues: {
      wardId: "",
      bedNumber: "",
      bedType: "standard",
      dailyRateOverride: "",
    },
  });

  const admissionForm = useForm<CreateAdmissionFormData>({
    resolver: zodResolver(createAdmissionSchema),
    defaultValues: {
      personId: "",
      admissionType: "planned",
      admissionReason: "",
      chiefComplaint: "",
      wardId: "",
      bedId: "",
      notes: "",
    },
  });

  const selectedWard = admissionForm.watch("wardId");

  useEffect(() => {
    if (selectedWard) {
      setSelectedWardForBeds(selectedWard);
    }
  }, [selectedWard]);

  const createWardMutation = useMutation({
    mutationFn: async (data: CreateWardFormData) => {
      return apiRequest("POST", "/api/ipd/wards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipd/wards"] });
      toast({ title: "Ward created", description: "Ward has been added successfully" });
      setShowWardDialog(false);
      wardForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create ward", variant: "destructive" });
    },
  });

  const createBedMutation = useMutation({
    mutationFn: async (data: CreateBedFormData) => {
      return apiRequest("POST", "/api/ipd/beds", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipd/beds"] });
      toast({ title: "Bed added", description: "Bed has been added to the ward" });
      setShowBedDialog(false);
      bedForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add bed", variant: "destructive" });
    },
  });

  const createAdmissionMutation = useMutation({
    mutationFn: async (data: CreateAdmissionFormData) => {
      return apiRequest("POST", "/api/ipd/admissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipd/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ipd/beds"] });
      toast({ title: "Patient admitted", description: "Patient has been admitted successfully" });
      setShowAdmissionDialog(false);
      admissionForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to admit patient", variant: "destructive" });
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async ({ id, dischargeNotes }: { id: string; dischargeNotes?: string }) => {
      return apiRequest("PATCH", `/api/ipd/admissions/${id}`, {
        status: "discharged",
        dischargeNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipd/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ipd/beds"] });
      toast({ title: "Patient discharged", description: "Patient has been discharged successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to discharge patient", variant: "destructive" });
    },
  });

  const getWardTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      semi_private: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      private: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      icu: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      nicu: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      picu: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      ccu: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      emergency: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <Badge variant="secondary" className={colors[type] || ""}>{type.replace("_", " ").toUpperCase()}</Badge>;
  };

  const getBedStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</Badge>;
      case "occupied":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Occupied</Badge>;
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Maintenance</Badge>;
      case "reserved":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Reserved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAdmissionTypeBadge = (type: string) => {
    switch (type) {
      case "emergency":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Emergency</Badge>;
      case "planned":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Planned</Badge>;
      case "transfer":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"><ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const activeAdmissions = admissions.filter(a => a.status === "admitted");
  const occupiedBeds = beds.filter(b => b.status === "occupied").length;
  const availableBedsCount = beds.filter(b => b.status === "available").length;

  const filterAdmissions = (list: IpdAdmission[]) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(a => 
      a.admissionNumber?.toLowerCase().includes(term) ||
      a.personId?.toLowerCase().includes(term)
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            IPD Management
          </h1>
          <p className="text-muted-foreground">Manage wards, beds, and inpatient admissions</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowWardDialog(true)} data-testid="btn-add-ward">
            <Plus className="w-4 h-4 mr-1" />
            Add Ward
          </Button>
          <Button variant="outline" onClick={() => setShowBedDialog(true)} data-testid="btn-add-bed">
            <Bed className="w-4 h-4 mr-1" />
            Add Bed
          </Button>
          <Button onClick={() => setShowAdmissionDialog(true)} data-testid="btn-new-admission">
            <UserPlus className="w-4 h-4 mr-1" />
            New Admission
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-wards">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-wards">{wards.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-beds">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-beds">{beds.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-occupied-beds">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupied Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-occupied-beds">{occupiedBeds}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-active-admissions">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-admissions">{activeAdmissions.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search admissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="admissions" data-testid="tab-admissions">
            <Users className="w-4 h-4 mr-1" />
            Admissions ({activeAdmissions.length})
          </TabsTrigger>
          <TabsTrigger value="wards" data-testid="tab-wards">
            <Building2 className="w-4 h-4 mr-1" />
            Wards ({wards.length})
          </TabsTrigger>
          <TabsTrigger value="beds" data-testid="tab-beds">
            <Bed className="w-4 h-4 mr-1" />
            Beds ({beds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admissions" className="mt-4">
          {loadingAdmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filterAdmissions(activeAdmissions).length > 0 ? (
            <div className="space-y-3">
              {filterAdmissions(activeAdmissions).map((admission) => (
                <Card key={admission.id} className="hover-elevate" data-testid={`admission-${admission.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{admission.admissionNumber}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : "N/A"}
                            <span className="mx-1">•</span>
                            Patient: {admission.personId?.slice(-8)}
                          </p>
                          {admission.admissionReason && (
                            <p className="text-sm text-muted-foreground mt-1">Reason: {admission.admissionReason}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getAdmissionTypeBadge(admission.admissionType)}
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Activity className="w-3 h-3 mr-1" /> Admitted
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dischargeMutation.mutate({ id: admission.id })}
                          disabled={dischargeMutation.isPending}
                          data-testid={`btn-discharge-${admission.id}`}
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Discharge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No active admissions</p>
                <Button className="mt-4" onClick={() => setShowAdmissionDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Admit Patient
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wards" className="mt-4">
          {loadingWards ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : wards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wards.map((ward) => (
                <Card key={ward.id} className="hover-elevate" data-testid={`ward-${ward.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ward.name}</CardTitle>
                      {getWardTypeBadge(ward.wardType)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-medium">{ward.code}</span>
                      </div>
                      {ward.floor && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Floor:</span>
                          <span>{ward.floor}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Beds:</span>
                        <span>{ward.totalBeds || 0}</span>
                      </div>
                      {ward.dailyRate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Rate:</span>
                          <span>PKR {parseFloat(ward.dailyRate).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No wards configured</p>
                <Button className="mt-4" onClick={() => setShowWardDialog(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add First Ward
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beds" className="mt-4">
          <div className="mb-4">
            <Select value={selectedWardForBeds || ""} onValueChange={(val) => setSelectedWardForBeds(val || undefined)}>
              <SelectTrigger className="w-64" data-testid="select-ward-filter">
                <SelectValue placeholder="Filter by ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingBeds ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : beds.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {beds.map((bed) => (
                <Card 
                  key={bed.id} 
                  className={`hover-elevate cursor-pointer ${bed.status === 'available' ? 'border-green-500' : bed.status === 'occupied' ? 'border-red-500' : ''}`}
                  data-testid={`bed-${bed.id}`}
                >
                  <CardContent className="p-4 text-center">
                    <Bed className={`w-8 h-8 mx-auto mb-2 ${bed.status === 'available' ? 'text-green-500' : bed.status === 'occupied' ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <p className="font-medium">{bed.bedNumber}</p>
                    <p className="text-xs text-muted-foreground mb-2">{bed.bedType}</p>
                    {getBedStatusBadge(bed.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bed className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No beds configured</p>
                <Button className="mt-4" onClick={() => setShowBedDialog(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Beds
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showWardDialog} onOpenChange={setShowWardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Add New Ward
            </DialogTitle>
          </DialogHeader>
          
          <Form {...wardForm}>
            <form onSubmit={wardForm.handleSubmit((data) => createWardMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={wardForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Ward A" {...field} data-testid="input-ward-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wardForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., WA01" {...field} data-testid="input-ward-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={wardForm.control}
                name="wardType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ward-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="semi_private">Semi Private</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="icu">ICU</SelectItem>
                        <SelectItem value="nicu">NICU</SelectItem>
                        <SelectItem value="picu">PICU</SelectItem>
                        <SelectItem value="ccu">CCU</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={wardForm.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2nd Floor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wardForm.control}
                  name="dailyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Rate (PKR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createWardMutation.isPending} data-testid="btn-create-ward">
                  {createWardMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Create Ward
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showBedDialog} onOpenChange={setShowBedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bed className="w-5 h-5" />
              Add New Bed
            </DialogTitle>
          </DialogHeader>
          
          <Form {...bedForm}>
            <form onSubmit={bedForm.handleSubmit((data) => createBedMutation.mutate(data))} className="space-y-4">
              <FormField
                control={bedForm.control}
                name="wardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bed-ward">
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bedForm.control}
                  name="bedNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bed Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., B-101" {...field} data-testid="input-bed-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bedForm.control}
                  name="bedType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bed Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bed-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="icu">ICU</SelectItem>
                          <SelectItem value="pediatric">Pediatric</SelectItem>
                          <SelectItem value="bariatric">Bariatric</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={bedForm.control}
                name="dailyRateOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate Override (optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Leave empty to use ward rate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createBedMutation.isPending} data-testid="btn-create-bed">
                  {createBedMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Add Bed
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdmissionDialog} onOpenChange={setShowAdmissionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              New Patient Admission
            </DialogTitle>
          </DialogHeader>
          
          <Form {...admissionForm}>
            <form onSubmit={admissionForm.handleSubmit((data) => createAdmissionMutation.mutate(data))} className="space-y-4">
              <FormField
                control={admissionForm.control}
                name="personId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter patient UUID" {...field} data-testid="input-patient-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={admissionForm.control}
                name="admissionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-admission-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={admissionForm.control}
                name="admissionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Surgery, Treatment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={admissionForm.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint</FormLabel>
                    <FormControl>
                      <Input placeholder="Main symptoms or concerns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={admissionForm.control}
                  name="wardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-admission-ward">
                            <SelectValue placeholder="Select ward" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wards.map((ward) => (
                            <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={admissionForm.control}
                  name="bedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bed</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedWard}>
                        <FormControl>
                          <SelectTrigger data-testid="select-admission-bed">
                            <SelectValue placeholder={selectedWard ? "Select bed" : "Select ward first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableBeds.map((bed) => (
                            <SelectItem key={bed.id} value={bed.id}>{bed.bedNumber} ({bed.bedType})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={admissionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createAdmissionMutation.isPending} data-testid="btn-admit-patient">
                  {createAdmissionMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Admit Patient
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
