import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Pill, Search, Package, CheckCircle, Clock, AlertTriangle, User, Calendar, FileText, Send, Loader2 } from "lucide-react";
import type { PrescriptionOrder } from "@shared/schema";
import { PatientJourneyTracker } from "@/components/PatientJourneyTracker";

export default function PharmacyDispensing() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState<PrescriptionOrder | null>(null);
  const [dispenseNotes, setDispenseNotes] = useState("");

  const { data: pendingOrders = [], isLoading: loadingPending } = useQuery<PrescriptionOrder[]>({
    queryKey: ["/api/prescription-orders?status=pending"],
  });

  const { data: processingOrders = [], isLoading: loadingProcessing } = useQuery<PrescriptionOrder[]>({
    queryKey: ["/api/prescription-orders?status=processing"],
  });

  const { data: dispensedOrders = [], isLoading: loadingDispensed } = useQuery<PrescriptionOrder[]>({
    queryKey: ["/api/prescription-orders?status=dispensed"],
  });

  const invalidateAllOrders = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/prescription-orders?status=pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/prescription-orders?status=processing"] });
    queryClient.invalidateQueries({ queryKey: ["/api/prescription-orders?status=dispensed"] });
  };

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/prescription-orders/${id}`, { status, dispensedNotes: notes });
    },
    onSuccess: () => {
      invalidateAllOrders();
      toast({ title: "Order updated", description: "Prescription order status updated successfully" });
      setSelectedOrder(null);
      setDispenseNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update order", variant: "destructive" });
    },
  });

  const createDispenseEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/dispense-events", data);
    },
    onSuccess: () => {
      invalidateAllOrders();
      toast({ title: "Dispense recorded", description: "Medication dispensing has been recorded" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record dispense", variant: "destructive" });
    },
  });

  const handleStartProcessing = (order: PrescriptionOrder) => {
    updateOrderMutation.mutate({ id: order.id, status: "processing" });
  };

  const handleDispense = (order: PrescriptionOrder) => {
    setSelectedOrder(order);
  };

  const confirmDispense = () => {
    if (!selectedOrder) return;
    
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      status: "dispensed",
      notes: dispenseNotes,
    });

    createDispenseEventMutation.mutate({
      prescriptionOrderId: selectedOrder.id,
      dispensedQuantity: 1,
      dispensedBy: "current_user",
      notes: dispenseNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Package className="w-3 h-3 mr-1" /> Processing</Badge>;
      case "dispensed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Dispensed</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterOrders = (orders: PrescriptionOrder[]) => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(term) ||
        order.patientPersonId?.toLowerCase().includes(term) ||
        (order.items as any[])?.some((item: any) => item.name?.toLowerCase().includes(term))
    );
  };

  const OrderCard = ({ order, showActions = true }: { order: PrescriptionOrder; showActions?: boolean }) => {
    const items = (order.items || []) as any[];
    
    return (
      <Card className="hover-elevate" data-testid={`prescription-order-${order.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Order #{order.id.slice(-8)}</CardTitle>
            </div>
            {getStatusBadge(order.status)}
          </div>
          <CardDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Patient: {order.patientPersonId?.slice(-8) || "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Medications</Label>
              <div className="mt-1 space-y-1">
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                      <span className="flex items-center gap-2">
                        <Pill className="w-3 h-3 text-primary" />
                        {item.name || item.medication || "Unknown"}
                      </span>
                      <span className="text-muted-foreground">
                        {item.quantity || item.dosage || "1"} {item.unit || "unit(s)"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No items listed</p>
                )}
              </div>
            </div>

            {order.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1">{order.notes}</p>
              </div>
            )}

            {showActions && (
              <div className="flex gap-2 pt-2">
                {order.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleStartProcessing(order)}
                    disabled={updateOrderMutation.isPending}
                    data-testid={`btn-start-processing-${order.id}`}
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Start Processing
                  </Button>
                )}
                {order.status === "processing" && (
                  <Button
                    size="sm"
                    onClick={() => handleDispense(order)}
                    disabled={updateOrderMutation.isPending}
                    data-testid={`btn-dispense-${order.id}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Dispense
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = loadingPending || loadingProcessing || loadingDispensed;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" />
            Pharmacy Dispensing
          </h1>
          <p className="text-muted-foreground">Manage prescription orders and medication dispensing</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-orders"
            />
          </div>
        </div>
      </div>
      
      {/* Real-time Patient Journey Tracker filtering for patients ready for pharmacy */}
      <PatientJourneyTracker currentStage="prescription_given" facilityId="mock-facility-123" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-pending-orders">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">{pendingOrders.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-processing-orders">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-processing-count">{processingOrders.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-dispensed-orders">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dispensed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-dispensed-count">{dispensedOrders.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-orders">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">{pendingOrders.length + processingOrders.length + dispensedOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="w-4 h-4 mr-1" />
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="processing" data-testid="tab-processing">
            <Package className="w-4 h-4 mr-1" />
            Processing ({processingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="dispensed" data-testid="tab-dispensed">
            <CheckCircle className="w-4 h-4 mr-1" />
            Dispensed ({dispensedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filterOrders(pendingOrders).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOrders(pendingOrders).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending orders</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filterOrders(processingOrders).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOrders(processingOrders).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No orders being processed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dispensed" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filterOrders(dispensedOrders).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOrders(dispensedOrders).map((order) => (
                <OrderCard key={order.id} order={order} showActions={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No dispensed orders today</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Confirm Dispensing
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Order #{selectedOrder.id.slice(-8)}</p>
                <p className="text-xs text-muted-foreground">Patient: {selectedOrder.patientPersonId?.slice(-8) || "N/A"}</p>
              </div>
              
              <div>
                <Label className="text-sm">Medications to Dispense</Label>
                <div className="mt-2 space-y-1">
                  {((selectedOrder.items || []) as any[]).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                      <Pill className="w-4 h-4 text-primary" />
                      <span>{item.name || item.medication || "Unknown"}</span>
                      <span className="text-muted-foreground ml-auto">{item.quantity || "1"} {item.unit || "unit(s)"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="dispense-notes">Dispensing Notes (Optional)</Label>
                <Textarea
                  id="dispense-notes"
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder="Add any notes about this dispensing..."
                  className="mt-1"
                  data-testid="textarea-dispense-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" data-testid="btn-cancel-dispense">Cancel</Button>
            </DialogClose>
            <Button
              onClick={confirmDispense}
              disabled={updateOrderMutation.isPending}
              data-testid="btn-confirm-dispense"
            >
              {updateOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Confirm Dispense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
