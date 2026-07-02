import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Mail, UserPlus, Trash2, RefreshCw, Copy, Clock, CheckCircle, XCircle } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  organization_name: string;
  created_at: string;
  expires_at: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function EmployeeInvitations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    role: "user",
    organizationId: "",
  });

  const isSuperAdmin = user?.isSuperAdmin || user?.role === "super_admin";

  const { data: invitations, isLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: isSuperAdmin,
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data: typeof newInvitation) => {
      if (!data.email || !data.email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }
      if (isSuperAdmin && !data.organizationId) {
        throw new Error("Please select an organization");
      }
      return apiRequest("POST", "/api/invitations", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invitation sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setDialogOpen(false);
      setNewInvitation({ email: "", role: "user", organizationId: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/invitations/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invitation cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/invitations/${id}/resend`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invitation resent" });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const copyInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied", description: "Invitation link copied to clipboard" });
  };

  const roleOptions = [
    { value: "user", label: "User" },
    { value: "rep", label: "Medical Representative" },
    { value: "manager", label: "Manager" },
    { value: "doctor", label: "Doctor" },
    { value: "doctor_frontdesk", label: "Doctor's Front Desk" },
    { value: "company_admin", label: "Company Admin" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "accepted":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Accepted</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleDisplay = (role: string) => {
    const option = roleOptions.find((r) => r.value === role);
    return option?.label || role;
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Invitations</h1>
          <p className="text-muted-foreground">Invite new team members to join your organization</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-invitation">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Employee</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="employee@example.com"
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  data-testid="input-invitation-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newInvitation.role}
                  onValueChange={(value) => setNewInvitation({ ...newInvitation, role: value })}
                >
                  <SelectTrigger data-testid="select-invitation-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={newInvitation.organizationId}
                    onValueChange={(value) => setNewInvitation({ ...newInvitation, organizationId: value })}
                  >
                    <SelectTrigger data-testid="select-invitation-org">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createInvitationMutation.mutate(newInvitation)}
                disabled={createInvitationMutation.isPending}
                data-testid="button-send-invitation"
              >
                <Mail className="mr-2 h-4 w-4" />
                {createInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage invitations for new team members</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {isSuperAdmin && <TableHead>Organization</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id} data-testid={`row-invitation-${inv.id}`}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{getRoleDisplay(inv.role)}</TableCell>
                    {isSuperAdmin && <TableCell>{inv.organization_name}</TableCell>}
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell>
                      {inv.expires_at ? format(new Date(inv.expires_at), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyInviteLink(inv.token)}
                          title="Copy invitation link"
                          data-testid={`button-copy-${inv.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => resendInvitationMutation.mutate(inv.id)}
                          disabled={resendInvitationMutation.isPending}
                          title="Resend invitation"
                          data-testid={`button-resend-${inv.id}`}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => cancelInvitationMutation.mutate(inv.id)}
                          disabled={cancelInvitationMutation.isPending}
                          title="Cancel invitation"
                          data-testid={`button-cancel-${inv.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending invitations</p>
              <p className="text-sm">Click "Invite Employee" to add new team members</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
