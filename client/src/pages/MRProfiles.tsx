import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit2, Trash2, User, FileCheck, MapPin, Target, Calendar, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { User as UserType } from "@shared/schema";

interface MRProfileWithUser {
  profile: {
    id: string;
    userId: string;
    companyId: string;
    employeeId: string | null;
    territory: string | null;
    region: string | null;
    kycVerified: boolean;
    kycDocuments: string[] | null;
    dailyVisitQuota: number;
    monthlyVisitQuota: number;
    targetDoctorIds: string[] | null;
    assignedDoctorCount: number;
    joinDate: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  user: UserType | null;
}

export default function MRProfiles() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<MRProfileWithUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [profileForm, setProfileForm] = useState({
    userId: "",
    employeeId: "",
    territory: "",
    region: "",
    dailyVisitQuota: "10",
    monthlyVisitQuota: "200",
    joinDate: "",
    status: "active",
  });

  const { data: profiles = [], isLoading } = useQuery<MRProfileWithUser[]>({
    queryKey: ["/api/mr-profiles"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mr-profiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mr-profiles"] });
      toast({ title: "MR profile created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create MR profile", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/mr-profiles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mr-profiles"] });
      toast({ title: "MR profile updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedProfile(null);
    },
    onError: () => {
      toast({ title: "Failed to update MR profile", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mr-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mr-profiles"] });
      toast({ title: "MR profile deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete MR profile", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setProfileForm({
      userId: "",
      employeeId: "",
      territory: "",
      region: "",
      dailyVisitQuota: "10",
      monthlyVisitQuota: "200",
      joinDate: "",
      status: "active",
    });
  };

  const handleSubmit = () => {
    const data = {
      userId: profileForm.userId,
      employeeId: profileForm.employeeId || null,
      territory: profileForm.territory || null,
      region: profileForm.region || null,
      dailyVisitQuota: parseInt(profileForm.dailyVisitQuota) || 10,
      monthlyVisitQuota: parseInt(profileForm.monthlyVisitQuota) || 200,
      joinDate: profileForm.joinDate || null,
      status: profileForm.status,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (item: MRProfileWithUser) => {
    setSelectedProfile(item);
    setProfileForm({
      userId: item.profile.userId,
      employeeId: item.profile.employeeId || "",
      territory: item.profile.territory || "",
      region: item.profile.region || "",
      dailyVisitQuota: item.profile.dailyVisitQuota.toString(),
      monthlyVisitQuota: item.profile.monthlyVisitQuota.toString(),
      joinDate: item.profile.joinDate ? item.profile.joinDate.split("T")[0] : "",
      status: item.profile.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedProfile) return;
    const data = {
      employeeId: profileForm.employeeId || null,
      territory: profileForm.territory || null,
      region: profileForm.region || null,
      dailyVisitQuota: parseInt(profileForm.dailyVisitQuota) || 10,
      monthlyVisitQuota: parseInt(profileForm.monthlyVisitQuota) || 200,
      joinDate: profileForm.joinDate || null,
      status: profileForm.status,
    };
    updateMutation.mutate({ id: selectedProfile.profile.id, data });
  };

  const handleKYCToggle = (profileId: string, currentStatus: boolean) => {
    updateMutation.mutate({ id: profileId, data: { kycVerified: !currentStatus } });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: "Active" },
      inactive: { variant: "secondary", label: "Inactive" },
      suspended: { variant: "destructive", label: "Suspended" },
    };
    const { variant, label } = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getUserName = (user: UserType | null) => {
    if (!user) return "Unknown";
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  };

  const filteredProfiles = profiles.filter((item) => {
    const userName = getUserName(item.user).toLowerCase();
    const userEmail = item.user?.email?.toLowerCase() || "";
    const territory = item.profile.territory?.toLowerCase() || "";
    return (
      userName.includes(searchTerm.toLowerCase()) ||
      userEmail.includes(searchTerm.toLowerCase()) ||
      territory.includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    total: profiles.length,
    active: profiles.filter((p) => p.profile.status === "active").length,
    kycVerified: profiles.filter((p) => p.profile.kycVerified).length,
    totalDoctorsAssigned: profiles.reduce((sum, p) => sum + (p.profile.assignedDoctorCount || 0), 0),
  };

  const availableUsers = users.filter(
    (u) => !profiles.some((p) => p.profile.userId === u.id) && u.role === "rep"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="mr-profiles-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">MR Profiles</h1>
          <p className="text-muted-foreground">Manage Medical Representative profiles, KYC, and quotas</p>
        </div>
        {(user?.role === "company_admin" || user?.role === "super_admin") && (
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-profile">
            <Plus className="w-4 h-4 mr-2" />
            Add Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total MRs</CardDescription>
            <CardTitle className="text-2xl" data-testid="stat-total">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="stat-active">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>KYC Verified</CardDescription>
            <CardTitle className="text-2xl text-blue-500" data-testid="stat-kyc">{stats.kycVerified}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Doctors Assigned</CardDescription>
            <CardTitle className="text-2xl" data-testid="stat-doctors">{stats.totalDoctorsAssigned}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search MR profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MR</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Daily Quota</TableHead>
                  <TableHead>Monthly Quota</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No MR profiles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((item) => (
                    <TableRow key={item.profile.id} data-testid={`row-profile-${item.profile.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{getUserName(item.user)}</div>
                            <div className="text-sm text-muted-foreground">{item.user?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.profile.employeeId || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <div>{item.profile.territory || "-"}</div>
                          <div className="text-sm text-muted-foreground">{item.profile.region || ""}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.profile.dailyVisitQuota}</TableCell>
                      <TableCell>{item.profile.monthlyVisitQuota}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={item.profile.kycVerified ? "default" : "outline"}
                          onClick={() => handleKYCToggle(item.profile.id, item.profile.kycVerified)}
                          className="gap-1"
                          data-testid={`button-kyc-${item.profile.id}`}
                        >
                          {item.profile.kycVerified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.profile.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            data-testid={`button-edit-${item.profile.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this MR profile?")) {
                                deleteMutation.mutate(item.profile.id);
                              }
                            }}
                            data-testid={`button-delete-${item.profile.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add MR Profile</DialogTitle>
            <DialogDescription>Create a new Medical Representative profile</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>User</Label>
              <Select
                value={profileForm.userId}
                onValueChange={(value) => setProfileForm({ ...profileForm, userId: value })}
              >
                <SelectTrigger data-testid="select-user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {getUserName(u)} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Employee ID</Label>
              <Input
                value={profileForm.employeeId}
                onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                placeholder="EMP-001"
                data-testid="input-employee-id"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Territory</Label>
                <Input
                  value={profileForm.territory}
                  onChange={(e) => setProfileForm({ ...profileForm, territory: e.target.value })}
                  placeholder="North Zone"
                  data-testid="input-territory"
                />
              </div>
              <div className="grid gap-2">
                <Label>Region</Label>
                <Input
                  value={profileForm.region}
                  onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                  placeholder="Punjab"
                  data-testid="input-region"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Daily Visit Quota</Label>
                <Input
                  type="number"
                  value={profileForm.dailyVisitQuota}
                  onChange={(e) => setProfileForm({ ...profileForm, dailyVisitQuota: e.target.value })}
                  data-testid="input-daily-quota"
                />
              </div>
              <div className="grid gap-2">
                <Label>Monthly Visit Quota</Label>
                <Input
                  type="number"
                  value={profileForm.monthlyVisitQuota}
                  onChange={(e) => setProfileForm({ ...profileForm, monthlyVisitQuota: e.target.value })}
                  data-testid="input-monthly-quota"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={profileForm.joinDate}
                  onChange={(e) => setProfileForm({ ...profileForm, joinDate: e.target.value })}
                  data-testid="input-join-date"
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={profileForm.status}
                  onValueChange={(value) => setProfileForm({ ...profileForm, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!profileForm.userId || createMutation.isPending}
              data-testid="button-submit-profile"
            >
              {createMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit MR Profile</DialogTitle>
            <DialogDescription>Update Medical Representative profile</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>MR</Label>
              <Input value={getUserName(selectedProfile?.user || null)} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Employee ID</Label>
              <Input
                value={profileForm.employeeId}
                onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                data-testid="edit-input-employee-id"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Territory</Label>
                <Input
                  value={profileForm.territory}
                  onChange={(e) => setProfileForm({ ...profileForm, territory: e.target.value })}
                  data-testid="edit-input-territory"
                />
              </div>
              <div className="grid gap-2">
                <Label>Region</Label>
                <Input
                  value={profileForm.region}
                  onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                  data-testid="edit-input-region"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Daily Visit Quota</Label>
                <Input
                  type="number"
                  value={profileForm.dailyVisitQuota}
                  onChange={(e) => setProfileForm({ ...profileForm, dailyVisitQuota: e.target.value })}
                  data-testid="edit-input-daily-quota"
                />
              </div>
              <div className="grid gap-2">
                <Label>Monthly Visit Quota</Label>
                <Input
                  type="number"
                  value={profileForm.monthlyVisitQuota}
                  onChange={(e) => setProfileForm({ ...profileForm, monthlyVisitQuota: e.target.value })}
                  data-testid="edit-input-monthly-quota"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={profileForm.joinDate}
                  onChange={(e) => setProfileForm({ ...profileForm, joinDate: e.target.value })}
                  data-testid="edit-input-join-date"
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={profileForm.status}
                  onValueChange={(value) => setProfileForm({ ...profileForm, status: value })}
                >
                  <SelectTrigger data-testid="edit-select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-update-profile"
            >
              {updateMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
