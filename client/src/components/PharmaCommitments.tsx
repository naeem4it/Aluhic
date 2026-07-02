import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Calendar, Target, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const commitmentSchema = z.object({
  pharmaCompanyId: z.string().min(1, "Pharma Company is required"),
  targetQuantity: z.coerce.number().min(1, "Target quantity must be at least 1"),
  period: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  notes: z.string().optional(),
});

type CommitmentFormData = z.infer<typeof commitmentSchema>;

export function PharmaCommitments({ doctorId }: { doctorId: string }) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  // Use a query specifically for organizations of type "pharma" if we had one, but we'll use a mocked/general query for now.
  const { data: pharmaCompanies = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: commitments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor-pharma-commitments", { doctorId }],
    enabled: !!doctorId,
  });

  const form = useForm<CommitmentFormData>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      pharmaCompanyId: "",
      targetQuantity: 100,
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString()
        .split("T")[0],
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CommitmentFormData) => {
      const res = await apiRequest("POST", "/api/doctor-pharma-commitments", {
        ...data,
        doctorId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-pharma-commitments"] });
      toast({ title: "Commitment Added", description: "Your pharma commitment has been logged." });
      setIsAdding(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add commitment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommitmentFormData) => {
    createMutation.mutate(data);
  };

  const getCompanyName = (id: string) => {
    return pharmaCompanies.find((c) => c.id === id)?.name || "Unknown Company";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sales Commitments</h3>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancel" : <><Plus className="h-4 w-4 mr-2" /> Add Commitment</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-md">New Pharma Commitment</CardTitle>
            <CardDescription>Log a new sales target agreement with a pharma company.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pharmaCompanyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pharma Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pharmaCompanies.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Quantity (Units)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes / Details</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Target for specific drug class" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Commitment
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : commitments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active commitments found.
                  </TableCell>
                </TableRow>
              ) : (
                commitments.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {getCompanyName(c.pharmaCompanyId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-primary font-bold">
                        <Target className="h-4 w-4 mr-1" />
                        {c.targetQuantity} units
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{c.period}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
