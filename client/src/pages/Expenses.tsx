import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type Expense, type InsertExpense } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Banknote, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema.omit({ userId: true })),
    defaultValues: {
      date: new Date(),
      category: "travel",
      amount: "0",
      description: "",
      territory: user?.territory || "",
      paymentMode: "cash",
      status: "pending",
      remarks: "",
    },
  });

  const createExpense = useMutation({
    mutationFn: (data: InsertExpense) => apiRequest("POST", "/api/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Success", description: "Expense created successfully" });
      setIsOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create expense", variant: "destructive" });
    },
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertExpense> }) =>
      apiRequest("PATCH", `/api/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Success", description: "Expense updated successfully" });
      setIsOpen(false);
      setEditingExpense(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/expenses/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Success", description: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" });
    },
  });

  const handleSubmit = (data: InsertExpense) => {
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, data });
    } else {
      createExpense.mutate(data);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      date: new Date(expense.date),
      category: expense.category as any,
      amount: expense.amount,
      description: expense.description || "",
      territory: expense.territory || "",
      paymentMode: expense.paymentMode as any,
      status: expense.status as any,
      remarks: expense.remarks || "",
    });
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingExpense(null);
      form.reset();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Expenses
          </h1>
          <p className="text-muted-foreground">Track and manage your expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingExpense(null);
              setIsOpen(true);
            }} data-testid="button-add-expense">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-expense-date"
                        />
                      </FormControl>
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
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="accommodation">Accommodation</SelectItem>
                          <SelectItem value="fuel">Fuel</SelectItem>
                          <SelectItem value="parking">Parking</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-mode">
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="company_paid">Company Paid</SelectItem>
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
                        <Textarea {...field} value={field.value || ""} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="territory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Territory</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-territory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createExpense.isPending || updateExpense.isPending}
                  data-testid="button-submit-expense"
                >
                  {editingExpense ? "Update" : "Create"} Expense
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">Rs. {totalExpenses.toFixed(2)}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map((expense) => (
          <Card key={expense.id} data-testid={`card-expense-${expense.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{expense.category}</CardTitle>
                <Badge variant={getStatusColor(expense.status)}>{expense.status}</Badge>
              </div>
              <CardDescription>
                {format(new Date(expense.date), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">Rs. {parseFloat(expense.amount).toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {expense.paymentMode.replace("_", " ")}
              </p>
              {expense.description && (
                <p className="text-sm mt-2">{expense.description}</p>
              )}
              {expense.territory && (
                <p className="text-xs text-muted-foreground mt-1">
                  Territory: {expense.territory}
                </p>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(expense)}
                data-testid={`button-edit-${expense.id}`}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteExpense.mutate(expense.id)}
                disabled={deleteExpense.isPending}
                data-testid={`button-delete-${expense.id}`}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No expenses recorded yet.
              <br />
              Click "Add Expense" to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
