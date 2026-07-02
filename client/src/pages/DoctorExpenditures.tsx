import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Check, X, Receipt, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

const expenditureSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  expenditureDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

interface Expenditure {
  id: string;
  userId: string;
  doctorId: string;
  organizationId: string;
  category: string;
  amount: string;
  description?: string;
  expenditureDate: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

const categories = [
  { value: "gift", label: "Gifts" },
  { value: "meal", label: "Meals & Entertainment" },
  { value: "sample", label: "Product Samples" },
  { value: "travel", label: "Travel" },
  { value: "conference", label: "Conference/CME" },
  { value: "marketing", label: "Marketing Materials" },
  { value: "other", label: "Other" },
];

export default function DoctorExpenditures() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: doctors } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: expenditures, isLoading } = useQuery<Expenditure[]>({
    queryKey: ["/api/doctor-expenditures"],
  });

  const { data: summary } = useQuery<any>({
    queryKey: ["/api/doctor-expenditures/summary"],
  });

  const form = useForm<z.infer<typeof expenditureSchema>>({
    resolver: zodResolver(expenditureSchema),
    defaultValues: {
      doctorId: "",
      category: "",
      amount: "",
      description: "",
      expenditureDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenditureSchema>) => {
      const res = await apiRequest("POST", "/api/doctor-expenditures", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Expenditure recorded" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-expenditures"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to record expenditure", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/doctor-expenditures/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Expenditure approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-expenditures"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/doctor-expenditures/${id}/reject`, { rejectionReason: reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Expenditure rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-expenditures"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (value: string) => {
    return categories.find((c) => c.value === value)?.label || value;
  };

  const filteredExpenditures = expenditures?.filter((exp) => {
    if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;
    if (statusFilter !== "all" && exp.status !== statusFilter) return false;
    return true;
  });

  const totalPending = expenditures?.filter((e) => e.status === "pending").reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const totalApproved = expenditures?.filter((e) => e.status === "approved").reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">Doctor Expenditures</h1>
          <p className="text-muted-foreground">Track expenses related to doctor visits and engagement</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expenditure">
              <Plus className="h-4 w-4 mr-2" />
              Add Expenditure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Expenditure</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expenditureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the expenditure..." data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-expenditure">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Expenditure"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenditures</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-expenditures">{expenditures?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500" data-testid="text-pending-total">${totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-approved-total">${totalApproved.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Expenditure Records</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]" data-testid="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]" data-testid="filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenditures && filteredExpenditures.length > 0 ? (
                filteredExpenditures.map((exp) => (
                  <TableRow key={exp.id} data-testid={`row-expenditure-${exp.id}`}>
                    <TableCell>{format(new Date(exp.expenditureDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(exp.category)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{exp.description || "-"}</TableCell>
                    <TableCell className="font-medium">${parseFloat(exp.amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(exp.status)}</TableCell>
                    <TableCell>
                      {exp.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => approveMutation.mutate(exp.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${exp.id}`}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => rejectMutation.mutate({ id: exp.id, reason: "Not approved" })}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${exp.id}`}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No expenditure records found. Add an expenditure to get started.
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
