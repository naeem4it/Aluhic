import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  companyTypeId: string | null;
  company_type_name: string | null;
  isActive: boolean;
  createdAt: string;
}

const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export default function CompanyManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      logoUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return await apiRequest("POST", "/api/admin/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ description: "Company created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create company", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      return await apiRequest("PUT", `/api/admin/companies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ description: "Company updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update company", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ description: "Company deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete company", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
    form.reset();
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      name: company.name,
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      logoUrl: company.logoUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: CompanyFormData) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.phone?.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Management</h1>
          <p className="text-muted-foreground">Manage all companies/organizations in the system</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-company">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
              <DialogDescription>
                {editingCompany ? "Update company information" : "Create a new company/organization"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter company name" data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="company@example.com" data-testid="input-company-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="03XX-XXXXXXX" data-testid="input-company-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter company address" data-testid="input-company-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/logo.png" data-testid="input-company-logo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingCompany ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-companies"
          />
        </div>
        <Badge variant="secondary">{filteredCompanies.length} companies</Badge>
      </div>

      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "No companies match your search" : "No companies found"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground text-center">Get started by adding your first company</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover-elevate" data-testid={`card-company-${company.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-1">{company.name}</CardTitle>
                    <CardDescription>
                      {company.company_type_name || "General"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(company)}
                      data-testid={`button-edit-${company.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(company.id, company.name)}
                      data-testid={`button-delete-${company.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {company.email && (
                  <p className="text-sm text-muted-foreground">{company.email}</p>
                )}
                {company.phone && (
                  <p className="text-sm text-muted-foreground">{company.phone}</p>
                )}
                {company.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{company.address}</p>
                )}
                <div className="pt-2">
                  <Badge variant={company.isActive ? "default" : "secondary"}>
                    {company.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
