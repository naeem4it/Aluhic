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
import { Loader2, Plus, Package, AlertTriangle, Calendar } from "lucide-react";

const stockItemSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  itemCode: z.string().min(1, "Item code is required"),
  itemName: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  unitOfMeasure: z.string().min(1, "Unit is required"),
  currentQuantity: z.string().default("0"),
  minimumQuantity: z.string().default("0"),
  maximumQuantity: z.string().optional(),
  unitCost: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
});

type StockItem = z.infer<typeof stockItemSchema> & { id: string; isActive: boolean };

const movementSchema = z.object({
  stockItemId: z.string().min(1, "Item is required"),
  movementType: z.enum(["in", "out", "adjustment", "transfer", "return"]),
  quantity: z.string().min(1, "Quantity is required"),
  notes: z.string().optional(),
});

export default function Inventory() {
  const { toast } = useToast();
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: warehouses, isLoading: loadingWarehouses } = useQuery<any[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: stockItems, isLoading: loadingItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items", selectedWarehouse],
    enabled: true,
  });

  const { data: lowStockItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items/low-stock", selectedWarehouse],
  });

  const { data: expiringItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items/expiring", selectedWarehouse],
  });

  const itemForm = useForm<z.infer<typeof stockItemSchema>>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      warehouseId: "",
      itemCode: "",
      itemName: "",
      category: "",
      unitOfMeasure: "units",
      currentQuantity: "0",
      minimumQuantity: "0",
      maximumQuantity: "",
      unitCost: "",
      expiryDate: "",
      batchNumber: "",
    },
  });

  const movementForm = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      stockItemId: "",
      movementType: "in",
      quantity: "",
      notes: "",
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof stockItemSchema>) => {
      const res = await apiRequest("POST", "/api/stock-items", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Stock item created" });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      setIsItemDialogOpen(false);
      itemForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create item", description: error.message, variant: "destructive" });
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof movementSchema>) => {
      const res = await apiRequest("POST", "/api/stock-movements", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Stock movement recorded" });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      setIsMovementDialogOpen(false);
      movementForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to record movement", description: error.message, variant: "destructive" });
    },
  });

  const filteredItems = stockItems?.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (selectedWarehouse && item.warehouseId !== selectedWarehouse) return false;
    return true;
  });

  const categories = Array.from(new Set(stockItems?.map((item) => item.category) || []));

  if (loadingWarehouses || loadingItems) {
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
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage stock items and track movements</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Stock Item</DialogTitle>
              </DialogHeader>
              <Form {...itemForm}>
                <form onSubmit={itemForm.handleSubmit((data) => createItemMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={itemForm.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-warehouse">
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warehouses?.map((wh) => (
                              <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="itemCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-item-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-item-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="medicine">Medicine</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="supplies">Supplies</SelectItem>
                              <SelectItem value="consumables">Consumables</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="unitOfMeasure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="units">Units</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="packs">Packs</SelectItem>
                              <SelectItem value="bottles">Bottles</SelectItem>
                              <SelectItem value="strips">Strips</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="currentQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Qty</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="minimumQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Qty</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="unitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Cost</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createItemMutation.isPending} data-testid="button-submit-item">
                    {createItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Item"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-record-movement">
                <Package className="h-4 w-4 mr-2" />
                Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Movement</DialogTitle>
              </DialogHeader>
              <Form {...movementForm}>
                <form onSubmit={movementForm.handleSubmit((data) => createMovementMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={movementForm.control}
                    name="stockItemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-movement-item">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stockItems?.map((item) => (
                              <SelectItem key={item.id} value={item.id}>{item.itemName} ({item.itemCode})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={movementForm.control}
                    name="movementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Movement Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">Stock In</SelectItem>
                            <SelectItem value="out">Stock Out</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="return">Return</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={movementForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-movement-quantity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={movementForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMovementMutation.isPending} data-testid="button-submit-movement">
                    {createMovementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Movement"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">{stockItems?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className={lowStockItems && lowStockItems.length > 0 ? "border-orange-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500" data-testid="text-low-stock">{lowStockItems?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className={expiringItems && expiringItems.length > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500" data-testid="text-expiring">{expiringItems?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Stock Items</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[180px]" data-testid="filter-warehouse">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses?.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isLow = parseFloat(item.currentQuantity as any) <= parseFloat(item.minimumQuantity as any);
                  return (
                    <TableRow key={item.id} data-testid={`row-stock-item-${item.id}`}>
                      <TableCell className="font-mono">{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className={isLow ? "text-red-500 font-bold" : ""}>
                        {item.currentQuantity}
                      </TableCell>
                      <TableCell>{item.unitOfMeasure}</TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No stock items found. Add items to get started.
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
