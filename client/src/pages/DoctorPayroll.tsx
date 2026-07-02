import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Calculator, Check, Wallet, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";

const generatePayrollSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

interface PayrollRecord {
  id: string;
  facilityId: string;
  doctorId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  agreementType: string;
  baseSalary: string;
  totalPatientsSeen: number;
  perPatientFee: string;
  patientFeeEarnings: string;
  totalConsultationRevenue: string;
  commissionPercentage: string;
  commissionEarnings: string;
  grossEarnings: string;
  netPayable: string;
  status: string;
  paymentDate?: string;
  paymentMethod?: string;
}

export default function DoctorPayroll() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [calculatedEarnings, setCalculatedEarnings] = useState<any>(null);

  const { data: facilities, isLoading: loadingFacilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: doctors, isLoading: loadingDoctors } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities", selectedFacility, "doctors"],
    enabled: !!selectedFacility,
  });

  const { data: payrollRecords, isLoading: loadingRecords } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/doctor-payroll", selectedFacility],
    enabled: true,
  });

  const form = useForm<z.infer<typeof generatePayrollSchema>>({
    resolver: zodResolver(generatePayrollSchema),
    defaultValues: {
      facilityId: "",
      doctorId: "",
      startDate: "",
      endDate: "",
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: { doctorId: string; startDate: string; endDate: string }) => {
      const res = await apiRequest("POST", "/api/doctor-payroll/calculate", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setCalculatedEarnings(data);
    },
    onError: (error: any) => {
      toast({ title: "Failed to calculate", description: error.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generatePayrollSchema>) => {
      const res = await apiRequest("POST", "/api/doctor-payroll/generate", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Payroll generated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-payroll"] });
      setIsDialogOpen(false);
      form.reset();
      setCalculatedEarnings(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to generate payroll", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/doctor-payroll/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Payroll approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-payroll"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    },
  });

  const payMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: string }) => {
      const res = await apiRequest("PATCH", `/api/doctor-payroll/${id}/pay`, { paymentMethod });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Payment recorded" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-payroll"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to record payment", description: error.message, variant: "destructive" });
    },
  });

  const handleCalculate = () => {
    const values = form.getValues();
    if (values.doctorId && values.startDate && values.endDate) {
      calculateMutation.mutate({
        doctorId: values.doctorId,
        startDate: values.startDate,
        endDate: values.endDate,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "approved":
        return <Badge variant="secondary">Approved</Badge>;
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPending = payrollRecords?.filter((r) => r.status === "draft" || r.status === "approved").reduce((sum, r) => sum + parseFloat(r.netPayable || "0"), 0) || 0;
  const totalPaid = payrollRecords?.filter((r) => r.status === "paid").reduce((sum, r) => sum + parseFloat(r.netPayable || "0"), 0) || 0;

  if (loadingFacilities || loadingRecords) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Doctor Payroll</h1>
          <p className="text-muted-foreground">Manage salary and commission payments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-payroll">
              <Plus className="h-4 w-4 mr-2" />
              Generate Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Payroll</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => generateMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedFacility(value);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-facility">
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facilities?.map((f) => (
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
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedFacility}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doctor">
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors?.map((d) => (
                            <SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="button" variant="outline" onClick={handleCalculate} disabled={calculateMutation.isPending} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  {calculateMutation.isPending ? "Calculating..." : "Calculate Earnings"}
                </Button>

                {calculatedEarnings && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Patients:</span>
                        <span className="font-medium">{calculatedEarnings.totalPatients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Patient Fee Earnings:</span>
                        <span className="font-medium">${calculatedEarnings.patientFeeEarnings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Consultation Revenue:</span>
                        <span className="font-medium">${calculatedEarnings.consultationRevenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Commission Earnings:</span>
                        <span className="font-medium">${calculatedEarnings.commissionEarnings}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total Earnings:</span>
                        <span className="font-bold text-green-600">${calculatedEarnings.totalEarnings}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button type="submit" className="w-full" disabled={generateMutation.isPending} data-testid="button-submit-payroll">
                  {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Payroll Record"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-records">{payrollRecords?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Wallet className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500" data-testid="text-pending-amount">${totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-paid-amount">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Payroll Records</CardTitle>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger className="w-[200px]" data-testid="filter-facility">
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords && payrollRecords.length > 0 ? (
                payrollRecords.map((record) => (
                  <TableRow key={record.id} data-testid={`row-payroll-${record.id}`}>
                    <TableCell className="text-sm">
                      {format(new Date(record.payPeriodStart), "MMM d")} - {format(new Date(record.payPeriodEnd), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>Dr. {record.doctorId.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.agreementType}</Badge>
                    </TableCell>
                    <TableCell>{record.totalPatientsSeen}</TableCell>
                    <TableCell className="font-medium">${parseFloat(record.netPayable).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {record.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveMutation.mutate(record.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${record.id}`}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        {record.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => payMutation.mutate({ id: record.id, paymentMethod: "bank_transfer" })}
                            disabled={payMutation.isPending}
                            data-testid={`button-pay-${record.id}`}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No payroll records found. Generate payroll to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
