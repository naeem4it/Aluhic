import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Plus, Printer, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertPaymentSchema, type InsertPayment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FrontDeskTerminal() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");

  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: queueEntries = [] } = useQuery({
    queryKey: selectedFacilityId ? ["/api/healthcare/queue", selectedFacilityId] : ["disabled"],
    enabled: !!selectedFacilityId,
  });

  const form = useForm<Partial<InsertPayment>>({
    resolver: zodResolver(insertPaymentSchema.omit({ facilityId: true, companyId: true }).partial()),
    defaultValues: {
      paymentMethod: "cash",
      paymentStatus: "completed",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: Partial<InsertPayment>) => {
      return await apiRequest("POST", "/api/healthcare/payments", {
        ...data,
        facilityId: selectedFacilityId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/queue", selectedFacilityId] });
      toast({ description: "Payment processed successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ description: "Failed to process payment", variant: "destructive" });
    },
  });

  const onSubmit = (data: Partial<InsertPayment>) => {
    createPaymentMutation.mutate(data);
  };

  const handlePrintReceipt = (entry: any) => {
    const printContent = `
      QUEUE SLIP
      ========================
      Queue #: ${entry.queueNumber}
      Date: ${new Date(entry.queueDate).toLocaleDateString()}
      Time: ${new Date(entry.queueDate).toLocaleTimeString()}
      Status: ${entry.status}
      ========================
      Please keep this slip safe.
    `;
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Front Desk Terminal</h1>
          <p className="text-muted-foreground">Manage payments and queue</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-process-payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>Record a new payment for patient</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0.00" data-testid="input-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createPaymentMutation.isPending} data-testid="button-submit">
                  {createPaymentMutation.isPending ? "Processing..." : "Process"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facility Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
            <SelectTrigger data-testid="select-facility">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedFacilityId && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Today's Queue</h2>
          {queueEntries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No queue entries for today
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {queueEntries.map((entry: any) => (
                <Card key={entry.id} data-testid={`card-queue-${entry.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Queue #{entry.queueNumber}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        entry.status === "waiting" ? "bg-yellow-500/20 text-yellow-700" : 
                        entry.status === "completed" ? "bg-green-500/20 text-green-700" : 
                        "bg-blue-500/20 text-blue-700"
                      }`}>
                        {entry.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-2" />
                      {new Date(entry.queueDate).toLocaleTimeString()}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintReceipt(entry)}
                      data-testid={`button-print-${entry.id}`}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Slip
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
