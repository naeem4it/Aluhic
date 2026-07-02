import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Search, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

type Product = {
  id: string;
  userId: string;
  organizationId: string | null;
  productCode: string | null;
  name: string;
  genericName: string | null;
  saltComposition: string | null;
  description: string | null;
  currentPrice: string;
  mrp: string | null;
  category: string | null;
  manufacturer: string | null;
  strength: string | null;
  packSize: string | null;
  dosageForm: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type PriceHistory = {
  id: string;
  productId: string;
  price: string;
  effectiveDate: string;
  notes: string | null;
};

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  genericName: z.string().optional(),
  saltComposition: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  currentPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
  mrp: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  strength: z.string().optional(),
  packSize: z.string().optional(),
  dosageForm: z.string().optional(),
  productCode: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function Products() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: priceHistory } = useQuery<PriceHistory[]>({
    queryKey: ["/api/products", viewingHistory?.id, "price-history"],
    enabled: !!viewingHistory,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      genericName: "",
      saltComposition: "",
      manufacturer: "",
      description: "",
      currentPrice: 0,
      mrp: 0,
      category: "",
      strength: "",
      packSize: "",
      dosageForm: "",
      productCode: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Check for duplicate product (same name + salt composition)
      const duplicate = products?.find(
        (p) => p.name.toLowerCase() === data.name.toLowerCase() && 
               (p.saltComposition?.toLowerCase() || "") === (data.saltComposition?.toLowerCase() || "")
      );
      if (duplicate) {
        throw new Error(`Product "${data.name}" with this salt composition already exists!`);
      }
      
      const payload = {
        name: data.name,
        genericName: data.genericName || null,
        saltComposition: data.saltComposition || null,
        manufacturer: data.manufacturer || null,
        description: data.description || null,
        currentPrice: data.currentPrice.toString(),
        mrp: data.mrp ? data.mrp.toString() : null,
        category: data.category || null,
        strength: data.strength || null,
        packSize: data.packSize || null,
        dosageForm: data.dosageForm || null,
        productCode: data.productCode || null,
      };
      return await apiRequest("POST", "/api/products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormValues> }) => {
      // Check for duplicate product when editing (exclude current product)
      if (data.name && data.saltComposition) {
        const name = data.name;
        const saltComposition = data.saltComposition;
        const duplicate = products?.find(
          (p) => p.id !== id && 
                 p.name.toLowerCase() === name.toLowerCase() && 
                 (p.saltComposition?.toLowerCase() || "") === saltComposition.toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Product "${name}" with this salt composition already exists!`);
        }
      }
      
      const payload = {
        ...data,
        ...(data.currentPrice !== undefined && { currentPrice: data.currentPrice.toString() }),
        ...(data.mrp !== undefined && { mrp: data.mrp.toString() }),
      };
      return await apiRequest("PATCH", `/api/products/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeletingProduct(null);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      genericName: product.genericName || "",
      saltComposition: product.saltComposition || "",
      manufacturer: product.manufacturer || "",
      description: product.description || "",
      currentPrice: parseFloat(product.currentPrice),
      mrp: product.mrp ? parseFloat(product.mrp) : 0,
      category: product.category || "",
      strength: product.strength || "",
      packSize: product.packSize || "",
      dosageForm: product.dosageForm || "",
      productCode: product.productCode || "",
    });
  };

  const handleViewHistory = (product: Product) => {
    setViewingHistory(product);
  };

  const handleCloseHistory = () => {
    setViewingHistory(null);
    queryClient.invalidateQueries({ queryKey: ["/api/products", viewingHistory?.id, "price-history"] });
  };

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.genericName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.saltComposition?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.manufacturer?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.productCode?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto p-4 space-y-4 pb-20 md:pb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Product Information</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-add-product">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Product name" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genericName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generic Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Paracetamol" data-testid="input-generic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="saltComposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salt Composition</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Paracetamol 500mg + Caffeine 30mg" data-testid="input-salt" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer / Company</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Company name" data-testid="input-manufacturer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="strength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strength</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 500mg" data-testid="input-strength" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pack Size</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 10 tablets" data-testid="input-pack-size" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (Rs.)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MRP (Rs.)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-mrp" />
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
                        <Textarea {...field} placeholder="Product description" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending} 
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-empty">
              {searchTerm ? "No products found" : "No products yet. Add your first product!"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="hidden lg:table-cell">Generic Name</TableHead>
                    <TableHead className="hidden md:table-cell">Salt Composition</TableHead>
                    <TableHead className="hidden sm:table-cell">Manufacturer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Strength</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${product.id}`}>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.productCode && (
                            <span className="text-xs text-muted-foreground">{product.productCode}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-testid={`text-generic-${product.id}`}>
                        {product.genericName || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate" data-testid={`text-salt-${product.id}`}>
                        {product.saltComposition || "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" data-testid={`text-manufacturer-${product.id}`}>
                        {product.manufacturer || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-price-${product.id}`}>
                        <div className="flex flex-col">
                          <span>Rs. {parseFloat(product.currentPrice).toFixed(2)}</span>
                          {product.mrp && (
                            <span className="text-xs text-muted-foreground">MRP: Rs. {parseFloat(product.mrp).toFixed(2)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-testid={`text-strength-${product.id}`}>
                        {product.strength || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewHistory(product)}
                            data-testid={`button-history-${product.id}`}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingProduct(product)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent data-testid="dialog-edit-product">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Product name" data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer / Company</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Company name" data-testid="input-edit-manufacturer" />
                    </FormControl>
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
                      <Textarea {...field} placeholder="Product description" data-testid="input-edit-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Rs.)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-edit-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null);
                    form.reset();
                  }}
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending} 
                  data-testid="button-edit-submit"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price History Dialog */}
      <Dialog open={!!viewingHistory} onOpenChange={(open) => !open && handleCloseHistory()}>
        <DialogContent data-testid="dialog-price-history">
          <DialogHeader>
            <DialogTitle>Price History - {viewingHistory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {priceHistory && priceHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((history) => (
                    <TableRow key={history.id} data-testid={`row-history-${history.id}`}>
                      <TableCell data-testid={`text-history-date-${history.id}`}>
                        {format(new Date(history.effectiveDate), "PPpp")}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-history-price-${history.id}`}>
                        Rs. {parseFloat(history.price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground" data-testid="text-no-history">
                No price history available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
