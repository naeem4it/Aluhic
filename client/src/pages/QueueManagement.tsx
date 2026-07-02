import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ListOrdered, Play, Hash, Clock, Users, Building2, RefreshCw, Shield } from "lucide-react";
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

const queueDefinitionSchema = z.object({
  name: z.string().min(1, "Queue name is required"),
  queueType: z.enum(["opd", "lab", "pharmacy", "billing", "emergency", "general"]),
  prefix: z.string().min(1, "Token prefix is required").max(5, "Prefix too long"),
  facilityId: z.string().optional(),
  description: z.string().optional(),
  avgServiceTimeMinutes: z.string().optional(),
  maxTokensPerDay: z.string().optional(),
});

type QueueDefinitionFormValues = z.infer<typeof queueDefinitionSchema>;

interface QueueDefinition {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  queueType: string;
  prefix: string;
  description: string | null;
  avgServiceTimeMinutes: number | null;
  maxTokensPerDay: number | null;
  isActive: boolean;
  createdAt: string;
}

interface QueueDayState {
  id: string;
  queueDefinitionId: string;
  queueDate: string;
  lastTokenNumber: number;
  currentServingNumber: number | null;
  totalIssued: number;
  totalServed: number;
  totalCancelled: number;
  totalNoShow: number;
}

interface QueueToken {
  id: string;
  queueDayStateId: string;
  tokenNumber: number;
  displayToken: string;
  personId: string | null;
  patientName: string | null;
  status: string;
  issuedAt: string;
  calledAt: string | null;
  servedAt: string | null;
  serviceDuration: number | null;
}

interface HealthcareFacility {
  id: string;
  name: string;
}

export default function QueueManagement() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<QueueDefinition | null>(null);
  const [issueTokenDialog, setIssueTokenDialog] = useState(false);

  const allowedRoles = ["doctor_frontdesk", "company_admin", "super_admin"];
  const hasAccess = user && allowedRoles.includes(user.role);

  const { data: facilities = [] } = useQuery<HealthcareFacility[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: queueDefinitions = [], isLoading } = useQuery<QueueDefinition[]>({
    queryKey: ["/api/queue-definitions"],
  });

  const { data: queueState } = useQuery<QueueDayState>({
    queryKey: ["/api/queue-day-states", selectedQueue?.id],
    enabled: !!selectedQueue,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/queue-day-states/${selectedQueue?.id}?date=${today}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch queue state");
      return response.json();
    },
  });

  const { data: tokens = [] } = useQuery<QueueToken[]>({
    queryKey: ["/api/queue-tokens", queueState?.id],
    enabled: !!queueState,
    queryFn: async () => {
      const response = await fetch(`/api/queue-tokens?queueDayStateId=${queueState?.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tokens");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const form = useForm<QueueDefinitionFormValues>({
    resolver: zodResolver(queueDefinitionSchema),
    defaultValues: {
      name: "",
      queueType: "opd",
      prefix: "",
      facilityId: "",
      description: "",
      avgServiceTimeMinutes: "",
      maxTokensPerDay: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: QueueDefinitionFormValues) => {
      const payload = {
        ...data,
        facilityId: data.facilityId || null,
        avgServiceTimeMinutes: data.avgServiceTimeMinutes ? parseInt(data.avgServiceTimeMinutes) : null,
        maxTokensPerDay: data.maxTokensPerDay ? parseInt(data.maxTokensPerDay) : null,
      };
      return await apiRequest("POST", "/api/queue-definitions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue-definitions"] });
      toast({ description: "Queue created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to create queue", variant: "destructive" });
    },
  });

  const issueTokenMutation = useMutation({
    mutationFn: async (data: { patientName?: string; personId?: string }): Promise<QueueToken> => {
      if (!queueState) throw new Error("No queue state available");
      const response = await apiRequest("POST", "/api/queue-tokens/issue", {
        queueDayStateId: queueState.id,
        patientName: data.patientName,
        personId: data.personId,
      });
      return response as unknown as QueueToken;
    },
    onSuccess: (token: QueueToken) => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue-day-states"] });
      toast({ description: `Token ${token.displayToken} issued successfully` });
      setIssueTokenDialog(false);
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to issue token", variant: "destructive" });
    },
  });

  const callNextMutation = useMutation({
    mutationFn: async (): Promise<QueueToken | null> => {
      if (!queueState) throw new Error("No queue state available");
      const response = await apiRequest("POST", "/api/queue-tokens/call-next", {
        queueDayStateId: queueState.id,
      });
      return response as unknown as QueueToken | null;
    },
    onSuccess: (token: QueueToken | null) => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue-day-states"] });
      if (token) {
        toast({ description: `Now serving ${token.displayToken}` });
      } else {
        toast({ description: "No more tokens in queue" });
      }
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to call next token", variant: "destructive" });
    },
  });

  const onSubmit = (data: QueueDefinitionFormValues) => {
    createMutation.mutate(data);
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
      form.reset();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      waiting: { variant: "secondary", label: "Waiting" },
      called: { variant: "default", label: "Called" },
      serving: { variant: "default", label: "Serving" },
      served: { variant: "outline", label: "Served" },
      no_show: { variant: "destructive", label: "No Show" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = statusConfig[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const waitingTokens = tokens.filter(t => t.status === "waiting");
  const servingToken = tokens.find(t => t.status === "serving" || t.status === "called");
  const servedTokens = tokens.filter(t => t.status === "served");

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
                You don't have permission to access Queue Management. Front Desk, Company Admin, or Super Admin access required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading queues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Token management with daily auto-reset</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-queue">
              <Plus className="h-4 w-4 mr-2" />
              New Queue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Queue</DialogTitle>
              <DialogDescription>
                Set up a new queue for token management
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Queue Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="OPD Queue" data-testid="input-queue-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="queueType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Queue Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-queue-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="opd">OPD</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Prefix *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="OPD" maxLength={5} data-testid="input-prefix" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility (Optional)</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(v === "none" ? "" : v)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-facility">
                            <SelectValue placeholder="All facilities" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">All Facilities</SelectItem>
                          {facilities.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Queue description" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="avgServiceTimeMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg Service Time (min)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="15" data-testid="input-avg-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxTokensPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens/Day</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="100" data-testid="input-max-tokens" />
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
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-queue">
                    {createMutation.isPending ? "Creating..." : "Create Queue"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-primary" />
                Queue Definitions
              </CardTitle>
              <CardDescription>
                {queueDefinitions.length} queue{queueDefinitions.length !== 1 ? "s" : ""} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueDefinitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListOrdered className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No queues configured</p>
                  <p className="text-sm">Create a queue to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queueDefinitions.map((queue) => (
                    <div
                      key={queue.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedQueue?.id === queue.id 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedQueue(queue)}
                      data-testid={`card-queue-${queue.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{queue.name}</h3>
                        <Badge variant="outline" className="text-xs uppercase">
                          {queue.queueType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span>Prefix: {queue.prefix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedQueue && queueState ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedQueue.name}</CardTitle>
                      <CardDescription>
                        {format(new Date(), "EEEE, dd MMMM yyyy")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/queue-tokens"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/queue-day-states"] });
                        }}
                        data-testid="button-refresh"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => setIssueTokenDialog(true)} data-testid="button-issue-token">
                        <Plus className="h-4 w-4 mr-2" />
                        Issue Token
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={() => callNextMutation.mutate()}
                        disabled={callNextMutation.isPending || waitingTokens.length === 0}
                        data-testid="button-call-next"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Call Next
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{queueState.totalIssued}</p>
                      <p className="text-xs text-muted-foreground">Total Issued</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{waitingTokens.length}</p>
                      <p className="text-xs text-muted-foreground">Waiting</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{queueState.totalServed}</p>
                      <p className="text-xs text-muted-foreground">Served</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-500">{queueState.totalNoShow}</p>
                      <p className="text-xs text-muted-foreground">No Show</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {servingToken && (
                <Card className="border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Now Serving
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-4xl font-bold text-primary">{servingToken.displayToken}</div>
                      <div className="text-right">
                        <p className="font-medium">{servingToken.patientName || "Walk-in"}</p>
                        {servingToken.calledAt && (
                          <p className="text-sm text-muted-foreground">
                            Called at {format(new Date(servingToken.calledAt), "HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="waiting">
                <TabsList>
                  <TabsTrigger value="waiting" data-testid="tab-waiting">
                    Waiting ({waitingTokens.length})
                  </TabsTrigger>
                  <TabsTrigger value="served" data-testid="tab-served">
                    Served ({servedTokens.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="waiting">
                  <Card>
                    <CardContent className="pt-4">
                      {waitingTokens.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No tokens waiting</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {waitingTokens.map((token) => (
                            <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center gap-4">
                                <div className="text-xl font-bold text-primary">{token.displayToken}</div>
                                <div>
                                  <p className="font-medium">{token.patientName || "Walk-in"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Issued: {format(new Date(token.issuedAt), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(token.status)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="served">
                  <Card>
                    <CardContent className="pt-4">
                      {servedTokens.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No tokens served yet today</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {servedTokens.slice(0, 20).map((token) => (
                            <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center gap-4">
                                <div className="text-xl font-bold opacity-50">{token.displayToken}</div>
                                <div>
                                  <p className="font-medium">{token.patientName || "Walk-in"}</p>
                                  {token.servedAt && (
                                    <p className="text-sm text-muted-foreground">
                                      Served: {format(new Date(token.servedAt), "HH:mm")}
                                      {token.serviceDuration && ` (${token.serviceDuration} min)`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {getStatusBadge(token.status)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <ListOrdered className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Select a queue to manage tokens</p>
                  <p className="text-sm">Choose from the list on the left or create a new queue</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={issueTokenDialog} onOpenChange={setIssueTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue New Token</DialogTitle>
            <DialogDescription>
              Issue a token for {selectedQueue?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient Name (Optional)</label>
              <Input 
                id="patientName"
                placeholder="Walk-in patient"
                data-testid="input-patient-name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIssueTokenDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const input = document.getElementById("patientName") as HTMLInputElement;
                  issueTokenMutation.mutate({ patientName: input?.value || undefined });
                }}
                disabled={issueTokenMutation.isPending}
                data-testid="button-confirm-issue"
              >
                {issueTokenMutation.isPending ? "Issuing..." : "Issue Token"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
