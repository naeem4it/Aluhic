import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Monitor, Users, Building2, Plus, Edit, Trash2, Search, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

interface Screen {
  id: string;
  code: string;
  name: string;
  route: string;
  module: string;
  description: string | null;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  is_active: boolean;
}

interface ScreenPermission {
  id: string;
  roleId: string;
  screenId: string;
  accessLevel: string;
  isActive: boolean;
  role?: Role;
  screen?: Screen;
}

interface UserPermissionOverride {
  id: string;
  userId: string;
  screenId: string;
  organizationId: string | null;
  accessLevel: string;
  reason: string | null;
  createdBy: string | null;
  isActive: boolean;
}

interface OrganizationPermissionOverride {
  id: string;
  organizationId: string;
  roleId: string;
  screenId: string;
  accessLevel: string;
  reason: string | null;
  createdBy: string | null;
  isActive: boolean;
}

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  organizationId: string | null;
}

const ACCESS_LEVELS = [
  { value: "none", label: "No Access", color: "bg-destructive text-destructive-foreground" },
  { value: "view", label: "View Only", color: "bg-blue-500 text-white" },
  { value: "create", label: "Create", color: "bg-green-500 text-white" },
  { value: "edit", label: "Edit", color: "bg-yellow-500 text-black" },
  { value: "delete", label: "Delete", color: "bg-orange-500 text-white" },
  { value: "full", label: "Full Access", color: "bg-primary text-primary-foreground" }
];

const screenPermissionSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
  screenId: z.string().min(1, "Screen is required"),
  accessLevel: z.string().min(1, "Access level is required"),
});

const userOverrideSchema = z.object({
  userId: z.string().min(1, "User is required"),
  screenId: z.string().min(1, "Screen is required"),
  accessLevel: z.string().min(1, "Access level is required"),
  reason: z.string().optional(),
});

const orgOverrideSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  roleId: z.string().min(1, "Role is required"),
  screenId: z.string().min(1, "Screen is required"),
  accessLevel: z.string().min(1, "Access level is required"),
  reason: z.string().optional(),
});

type ScreenPermissionFormData = z.infer<typeof screenPermissionSchema>;
type UserOverrideFormData = z.infer<typeof userOverrideSchema>;
type OrgOverrideFormData = z.infer<typeof orgOverrideSchema>;

function getAccessLevelBadge(level: string) {
  const config = ACCESS_LEVELS.find(l => l.value === level) || ACCESS_LEVELS[0];
  return <Badge className={config.color}>{config.label}</Badge>;
}

export default function PermissionManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("screens");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [isRolePermissionDialogOpen, setIsRolePermissionDialogOpen] = useState(false);
  const [isUserOverrideDialogOpen, setIsUserOverrideDialogOpen] = useState(false);
  const [isOrgOverrideDialogOpen, setIsOrgOverrideDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<ScreenPermission | null>(null);
  const [editingUserOverride, setEditingUserOverride] = useState<UserPermissionOverride | null>(null);
  const [editingOrgOverride, setEditingOrgOverride] = useState<OrganizationPermissionOverride | null>(null);

  const { data: screens = [], isLoading: screensLoading } = useQuery<Screen[]>({
    queryKey: ["/api/admin/screens"],
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles-for-permissions"],
  });

  const { data: screenPermissions = [], isLoading: permissionsLoading } = useQuery<ScreenPermission[]>({
    queryKey: ["/api/admin/screen-permissions"],
  });

  const { data: userOverrides = [], isLoading: userOverridesLoading } = useQuery<UserPermissionOverride[]>({
    queryKey: ["/api/admin/user-permission-overrides"],
  });

  const { data: orgOverrides = [], isLoading: orgOverridesLoading } = useQuery<OrganizationPermissionOverride[]>({
    queryKey: ["/api/admin/organization-permission-overrides"],
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const rolePermissionForm = useForm<ScreenPermissionFormData>({
    resolver: zodResolver(screenPermissionSchema),
    defaultValues: { roleId: "", screenId: "", accessLevel: "view" },
  });

  const userOverrideForm = useForm<UserOverrideFormData>({
    resolver: zodResolver(userOverrideSchema),
    defaultValues: { userId: "", screenId: "", accessLevel: "view", reason: "" },
  });

  const orgOverrideForm = useForm<OrgOverrideFormData>({
    resolver: zodResolver(orgOverrideSchema),
    defaultValues: { organizationId: "", roleId: "", screenId: "", accessLevel: "view", reason: "" },
  });

  const createScreenPermissionMutation = useMutation({
    mutationFn: async (data: ScreenPermissionFormData) => {
      return await apiRequest("POST", "/api/admin/screen-permissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/screen-permissions"] });
      toast({ description: "Role permission created successfully" });
      handleCloseRolePermissionDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create permission", variant: "destructive" });
    },
  });

  const updateScreenPermissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScreenPermissionFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/screen-permissions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/screen-permissions"] });
      toast({ description: "Role permission updated successfully" });
      handleCloseRolePermissionDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update permission", variant: "destructive" });
    },
  });

  const deleteScreenPermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/screen-permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/screen-permissions"] });
      toast({ description: "Role permission deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete permission", variant: "destructive" });
    },
  });

  const createUserOverrideMutation = useMutation({
    mutationFn: async (data: UserOverrideFormData) => {
      return await apiRequest("POST", "/api/admin/user-permission-overrides", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permission-overrides"] });
      toast({ description: "User override created successfully" });
      handleCloseUserOverrideDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create override", variant: "destructive" });
    },
  });

  const updateUserOverrideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserOverrideFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/user-permission-overrides/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permission-overrides"] });
      toast({ description: "User override updated successfully" });
      handleCloseUserOverrideDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update override", variant: "destructive" });
    },
  });

  const deleteUserOverrideMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/user-permission-overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permission-overrides"] });
      toast({ description: "User override deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete override", variant: "destructive" });
    },
  });

  const createOrgOverrideMutation = useMutation({
    mutationFn: async (data: OrgOverrideFormData) => {
      return await apiRequest("POST", "/api/admin/organization-permission-overrides", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization-permission-overrides"] });
      toast({ description: "Organization override created successfully" });
      handleCloseOrgOverrideDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create override", variant: "destructive" });
    },
  });

  const updateOrgOverrideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrgOverrideFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/organization-permission-overrides/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization-permission-overrides"] });
      toast({ description: "Organization override updated successfully" });
      handleCloseOrgOverrideDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update override", variant: "destructive" });
    },
  });

  const deleteOrgOverrideMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/organization-permission-overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization-permission-overrides"] });
      toast({ description: "Organization override deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete override", variant: "destructive" });
    },
  });

  function handleCloseRolePermissionDialog() {
    setIsRolePermissionDialogOpen(false);
    setEditingPermission(null);
    rolePermissionForm.reset({ roleId: "", screenId: "", accessLevel: "view" });
  }

  function handleCloseUserOverrideDialog() {
    setIsUserOverrideDialogOpen(false);
    setEditingUserOverride(null);
    userOverrideForm.reset({ userId: "", screenId: "", accessLevel: "view", reason: "" });
  }

  function handleCloseOrgOverrideDialog() {
    setIsOrgOverrideDialogOpen(false);
    setEditingOrgOverride(null);
    orgOverrideForm.reset({ organizationId: "", roleId: "", screenId: "", accessLevel: "view", reason: "" });
  }

  function handleEditPermission(permission: ScreenPermission) {
    setEditingPermission(permission);
    rolePermissionForm.reset({
      roleId: permission.roleId,
      screenId: permission.screenId,
      accessLevel: permission.accessLevel,
    });
    setIsRolePermissionDialogOpen(true);
  }

  function handleEditUserOverride(override: UserPermissionOverride) {
    setEditingUserOverride(override);
    userOverrideForm.reset({
      userId: override.userId,
      screenId: override.screenId,
      accessLevel: override.accessLevel,
      reason: override.reason || "",
    });
    setIsUserOverrideDialogOpen(true);
  }

  function handleEditOrgOverride(override: OrganizationPermissionOverride) {
    setEditingOrgOverride(override);
    orgOverrideForm.reset({
      organizationId: override.organizationId,
      roleId: override.roleId,
      screenId: override.screenId,
      accessLevel: override.accessLevel,
      reason: override.reason || "",
    });
    setIsOrgOverrideDialogOpen(true);
  }

  function onSubmitRolePermission(data: ScreenPermissionFormData) {
    if (editingPermission) {
      updateScreenPermissionMutation.mutate({ id: editingPermission.id, data });
    } else {
      createScreenPermissionMutation.mutate(data);
    }
  }

  function onSubmitUserOverride(data: UserOverrideFormData) {
    if (editingUserOverride) {
      updateUserOverrideMutation.mutate({ id: editingUserOverride.id, data });
    } else {
      createUserOverrideMutation.mutate(data);
    }
  }

  function onSubmitOrgOverride(data: OrgOverrideFormData) {
    if (editingOrgOverride) {
      updateOrgOverrideMutation.mutate({ id: editingOrgOverride.id, data });
    } else {
      createOrgOverrideMutation.mutate(data);
    }
  }

  function toggleModule(module: string) {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  }

  const modules = Array.from(new Set(screens.map(s => s.module))).sort();

  const filteredScreens = screens.filter(screen => {
    const matchesSearch = screen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         screen.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === "all" || screen.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const screensByModule = filteredScreens.reduce((acc, screen) => {
    if (!acc[screen.module]) acc[screen.module] = [];
    acc[screen.module].push(screen);
    return acc;
  }, {} as Record<string, Screen[]>);

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || "Unknown Role";
  const getScreenName = (screenId: string) => screens.find(s => s.id === screenId)?.name || "Unknown Screen";
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""} (${user.email})`.trim() : "Unknown User";
  };
  const getOrgName = (orgId: string) => organizations.find(o => o.id === orgId)?.name || "Unknown Organization";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Shield className="h-8 w-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage role-based screen permissions with organization and user-level overrides
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="screens" className="flex items-center gap-2" data-testid="tab-screens">
            <Monitor className="h-4 w-4" />
            Screens ({screens.length})
          </TabsTrigger>
          <TabsTrigger value="role-permissions" className="flex items-center gap-2" data-testid="tab-role-permissions">
            <Shield className="h-4 w-4" />
            Role Permissions ({screenPermissions.length})
          </TabsTrigger>
          <TabsTrigger value="org-overrides" className="flex items-center gap-2" data-testid="tab-org-overrides">
            <Building2 className="h-4 w-4" />
            Org Overrides ({orgOverrides.length})
          </TabsTrigger>
          <TabsTrigger value="user-overrides" className="flex items-center gap-2" data-testid="tab-user-overrides">
            <Users className="h-4 w-4" />
            User Overrides ({userOverrides.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Screens</CardTitle>
              <CardDescription>All screens/pages available in the application organized by module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search screens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-screens"
                  />
                </div>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-module-filter">
                    <SelectValue placeholder="Filter by module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {modules.map(mod => (
                      <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {screensLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(screensByModule).map(([module, moduleScreens]) => (
                    <div key={module} className="border rounded-lg">
                      <button
                        className="w-full flex items-center justify-between p-3 hover-elevate"
                        onClick={() => toggleModule(module)}
                        data-testid={`button-toggle-module-${module}`}
                      >
                        <div className="flex items-center gap-2">
                          {expandedModules.has(module) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{module}</span>
                          <Badge variant="secondary">{moduleScreens.length} screens</Badge>
                        </div>
                      </button>
                      {expandedModules.has(module) && (
                        <div className="border-t divide-y">
                          {moduleScreens.map(screen => (
                            <div key={screen.id} className="p-3 pl-10 flex items-center justify-between">
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {screen.name}
                                  {screen.isActive ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-500/10 text-red-700">Inactive</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Code: {screen.code} | Route: {screen.route}
                                </div>
                                {screen.description && (
                                  <div className="text-sm text-muted-foreground mt-1">{screen.description}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-permissions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Role Default Permissions</CardTitle>
                <CardDescription>Base access levels for each role on each screen</CardDescription>
              </div>
              <Dialog open={isRolePermissionDialogOpen} onOpenChange={setIsRolePermissionDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingPermission(null); rolePermissionForm.reset(); }} data-testid="button-add-role-permission">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role Permission
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingPermission ? "Edit" : "Add"} Role Permission</DialogTitle>
                    <DialogDescription>Set the default access level for a role on a screen</DialogDescription>
                  </DialogHeader>
                  <Form {...rolePermissionForm}>
                    <form onSubmit={rolePermissionForm.handleSubmit(onSubmitRolePermission)} className="space-y-4">
                      <FormField
                        control={rolePermissionForm.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!!editingPermission}>
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map(role => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name} ({role.category})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={rolePermissionForm.control}
                        name="screenId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Screen</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!!editingPermission}>
                              <FormControl>
                                <SelectTrigger data-testid="select-screen">
                                  <SelectValue placeholder="Select screen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {screens.map(screen => (
                                  <SelectItem key={screen.id} value={screen.id}>
                                    {screen.name} ({screen.module})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={rolePermissionForm.control}
                        name="accessLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-access-level">
                                  <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACCESS_LEVELS.map(level => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCloseRolePermissionDialog} data-testid="button-cancel">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createScreenPermissionMutation.isPending || updateScreenPermissionMutation.isPending} data-testid="button-save">
                          {editingPermission ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : screenPermissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No role permissions configured yet</p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {screenPermissions.map(perm => (
                    <div key={perm.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{getRoleName(perm.roleId)}</div>
                          <div className="text-sm text-muted-foreground">{getScreenName(perm.screenId)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getAccessLevelBadge(perm.accessLevel)}
                        <Button size="icon" variant="ghost" onClick={() => handleEditPermission(perm)} data-testid={`button-edit-permission-${perm.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteScreenPermissionMutation.mutate(perm.id)}
                          disabled={deleteScreenPermissionMutation.isPending}
                          data-testid={`button-delete-permission-${perm.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org-overrides" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Organization Permission Overrides</CardTitle>
                <CardDescription>Override role defaults for specific organizations (Level 2 priority)</CardDescription>
              </div>
              <Dialog open={isOrgOverrideDialogOpen} onOpenChange={setIsOrgOverrideDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingOrgOverride(null); orgOverrideForm.reset(); }} data-testid="button-add-org-override">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Org Override
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingOrgOverride ? "Edit" : "Add"} Organization Override</DialogTitle>
                    <DialogDescription>Override role permissions for a specific organization</DialogDescription>
                  </DialogHeader>
                  <Form {...orgOverrideForm}>
                    <form onSubmit={orgOverrideForm.handleSubmit(onSubmitOrgOverride)} className="space-y-4">
                      <FormField
                        control={orgOverrideForm.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-org">
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {organizations.map(org => (
                                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgOverrideForm.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map(role => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name} ({role.category})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgOverrideForm.control}
                        name="screenId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Screen</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-screen">
                                  <SelectValue placeholder="Select screen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {screens.map(screen => (
                                  <SelectItem key={screen.id} value={screen.id}>
                                    {screen.name} ({screen.module})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgOverrideForm.control}
                        name="accessLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-access-level">
                                  <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACCESS_LEVELS.map(level => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgOverrideForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Why this override is needed" data-testid="input-reason" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCloseOrgOverrideDialog}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createOrgOverrideMutation.isPending || updateOrgOverrideMutation.isPending}>
                          {editingOrgOverride ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {orgOverridesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : orgOverrides.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No organization overrides configured</p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {orgOverrides.map(override => (
                    <div key={override.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{getOrgName(override.organizationId)} - {getRoleName(override.roleId)}</div>
                        <div className="text-sm text-muted-foreground">{getScreenName(override.screenId)}</div>
                        {override.reason && <div className="text-xs text-muted-foreground mt-1">Reason: {override.reason}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        {getAccessLevelBadge(override.accessLevel)}
                        <Button size="icon" variant="ghost" onClick={() => handleEditOrgOverride(override)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteOrgOverrideMutation.mutate(override.id)}
                          disabled={deleteOrgOverrideMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-overrides" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>User Permission Overrides</CardTitle>
                <CardDescription>Override permissions for specific users (Highest priority - Level 3)</CardDescription>
              </div>
              <Dialog open={isUserOverrideDialogOpen} onOpenChange={setIsUserOverrideDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingUserOverride(null); userOverrideForm.reset(); }} data-testid="button-add-user-override">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User Override
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingUserOverride ? "Edit" : "Add"} User Override</DialogTitle>
                    <DialogDescription>Override permissions for a specific user</DialogDescription>
                  </DialogHeader>
                  <Form {...userOverrideForm}>
                    <form onSubmit={userOverrideForm.handleSubmit(onSubmitUserOverride)} className="space-y-4">
                      <FormField
                        control={userOverrideForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-user">
                                  <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userOverrideForm.control}
                        name="screenId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Screen</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-screen">
                                  <SelectValue placeholder="Select screen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {screens.map(screen => (
                                  <SelectItem key={screen.id} value={screen.id}>
                                    {screen.name} ({screen.module})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userOverrideForm.control}
                        name="accessLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-access-level">
                                  <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACCESS_LEVELS.map(level => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userOverrideForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Why this override is needed" data-testid="input-reason" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCloseUserOverrideDialog}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createUserOverrideMutation.isPending || updateUserOverrideMutation.isPending}>
                          {editingUserOverride ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {userOverridesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : userOverrides.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No user overrides configured</p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {userOverrides.map(override => (
                    <div key={override.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{getUserName(override.userId)}</div>
                        <div className="text-sm text-muted-foreground">{getScreenName(override.screenId)}</div>
                        {override.reason && <div className="text-xs text-muted-foreground mt-1">Reason: {override.reason}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        {getAccessLevelBadge(override.accessLevel)}
                        <Button size="icon" variant="ghost" onClick={() => handleEditUserOverride(override)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteUserOverrideMutation.mutate(override.id)}
                          disabled={deleteUserOverrideMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
