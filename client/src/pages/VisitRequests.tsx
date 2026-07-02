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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, User } from "lucide-react";
import { format } from "date-fns";
import type { VisitRequest, Doctor } from "@shared/schema";

export default function VisitRequests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VisitRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [requestForm, setRequestForm] = useState({
    doctorId: "",
    requestedDate: "",
    requestedTime: "",
    purpose: "",
  });

  const [responseForm, setResponseForm] = useState({
    status: "",
    doctorNotes: "",
  });

  const { data: requests = [], isLoading } = useQuery<VisitRequest[]>({
    queryKey: ["/api/visit-requests"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/visit-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests"] });
      toast({ title: "Visit request submitted successfully" });
      setIsNewRequestDialogOpen(false);
      resetRequestForm();
    },
    onError: () => {
      toast({ title: "Failed to submit request", variant: "destructive" });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/visit-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests"] });
      toast({ title: "Request updated successfully" });
      setIsResponseDialogOpen(false);
      setSelectedRequest(null);
      resetResponseForm();
    },
    onError: () => {
      toast({ title: "Failed to update request", variant: "destructive" });
    },
  });

  const resetRequestForm = () => {
    setRequestForm({
      doctorId: "",
      requestedDate: "",
      requestedTime: "",
      purpose: "",
    });
  };

  const resetResponseForm = () => {
    setResponseForm({
      status: "",
      doctorNotes: "",
    });
  };

  const handleRequestSubmit = () => {
    const data = {
      doctorId: requestForm.doctorId,
      requestedDate: requestForm.requestedDate,
      requestedTime: requestForm.requestedTime || null,
      purpose: requestForm.purpose || null,
    };
    createRequestMutation.mutate(data);
  };

  const handleResponseSubmit = () => {
    if (!selectedRequest) return;
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      data: {
        status: responseForm.status,
        doctorNotes: responseForm.doctorNotes || null,
      },
    });
  };

  const handleRespondToRequest = (request: VisitRequest) => {
    setSelectedRequest(request);
    setResponseForm({
      status: request.status,
      doctorNotes: request.doctorNotes || "",
    });
    setIsResponseDialogOpen(true);
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor?.name || "Unknown Doctor";
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: any }> = {
      pending: { label: "Pending", variant: "secondary", icon: AlertCircle },
      approved: { label: "Approved", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
      completed: { label: "Completed", variant: "default", icon: CheckCircle },
    };
    return config[status] || { label: status, variant: "secondary" as const, icon: AlertCircle };
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch = !searchTerm || getDoctorName(req.doctorId).toLowerCase().includes(searchTerm.toLowerCase()) || req.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const isMR = user?.role === "user" || user?.role === "company_admin";
  const canRespond = user?.role === "super_admin" || user?.role === "company_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" />
          Visit Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isMR ? "Request and track visits to doctors" : "Manage and respond to visit requests"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-requests"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isMR && (
          <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetRequestForm()} data-testid="button-new-request">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Visit Request</DialogTitle>
                <DialogDescription>Submit a request to visit a doctor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Doctor *</Label>
                  <Select value={requestForm.doctorId} onValueChange={(v) => setRequestForm({ ...requestForm, doctorId: v })}>
                    <SelectTrigger data-testid="select-request-doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Requested Date *</Label>
                  <Input
                    type="date"
                    value={requestForm.requestedDate}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    data-testid="input-request-date"
                  />
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={requestForm.requestedTime}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedTime: e.target.value })}
                    data-testid="input-request-time"
                  />
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Textarea
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                    placeholder="Reason for the visit..."
                    data-testid="input-request-purpose"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsNewRequestDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleRequestSubmit}
                  disabled={!requestForm.doctorId || !requestForm.requestedDate}
                  data-testid="button-submit-request"
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                {canRespond && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canRespond ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canRespond ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    No visit requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {getDoctorName(request.doctorId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.requestedDate ? format(new Date(request.requestedDate), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>{request.requestedTime || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.purpose || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      {canRespond && (
                        <TableCell>
                          {request.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRespondToRequest(request)}
                              data-testid={`button-respond-${request.id}`}
                            >
                              Respond
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Visit Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span>
                  Request from MR to visit {getDoctorName(selectedRequest.doctorId)} on{" "}
                  {selectedRequest.requestedDate ? format(new Date(selectedRequest.requestedDate), "MMM dd, yyyy") : "N/A"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Response *</Label>
              <Select value={responseForm.status} onValueChange={(v) => setResponseForm({ ...responseForm, status: v })}>
                <SelectTrigger data-testid="select-response-status">
                  <SelectValue placeholder="Select response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={responseForm.doctorNotes}
                onChange={(e) => setResponseForm({ ...responseForm, doctorNotes: e.target.value })}
                placeholder="Add notes about this decision..."
                data-testid="input-response-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleResponseSubmit}
              disabled={!responseForm.status}
              data-testid="button-submit-response"
            >
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
