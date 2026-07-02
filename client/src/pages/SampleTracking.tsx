import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Send, Search, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { ProductSample, SampleDistribution, Product, Doctor } from "@shared/schema";

export default function SampleTracking() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddSampleDialogOpen, setIsAddSampleDialogOpen] = useState(false);
  const [isDistributeDialogOpen, setIsDistributeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [sampleForm, setSampleForm] = useState({
    productId: "",
    batchNumber: "",
    quantity: "",
    expiryDate: "",
  });

  const [distributionForm, setDistributionForm] = useState({
    productSampleId: "",
    doctorId: "",
    quantity: "",
    notes: "",
  });

  const { data: samples = [], isLoading: samplesLoading } = useQuery<ProductSample[]>({
    queryKey: ["/api/product-samples"],
  });

  const { data: distributions = [], isLoading: distributionsLoading } = useQuery<SampleDistribution[]>({
    queryKey: ["/api/sample-distributions"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const createSampleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/product-samples", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-samples"] });
      toast({ title: "Sample added successfully" });
      setIsAddSampleDialogOpen(false);
      resetSampleForm();
    },
    onError: () => {
      toast({ title: "Failed to add sample", variant: "destructive" });
    },
  });

  const createDistributionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sample-distributions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sample-distributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-samples"] });
      toast({ title: "Sample distributed successfully" });
      setIsDistributeDialogOpen(false);
      resetDistributionForm();
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Failed to distribute sample", variant: "destructive" });
    },
  });

  const resetSampleForm = () => {
    setSampleForm({
      productId: "",
      batchNumber: "",
      quantity: "",
      expiryDate: "",
    });
  };

  const resetDistributionForm = () => {
    setDistributionForm({
      productSampleId: "",
      doctorId: "",
      quantity: "",
      notes: "",
    });
  };

  const handleSampleSubmit = () => {
    const data = {
      productId: sampleForm.productId,
      batchNumber: sampleForm.batchNumber || null,
      quantity: parseInt(sampleForm.quantity),
      expiryDate: sampleForm.expiryDate || null,
    };
    createSampleMutation.mutate(data);
  };

  const handleDistributionSubmit = () => {
    const data = {
      productSampleId: distributionForm.productSampleId,
      doctorId: distributionForm.doctorId,
      quantity: parseInt(distributionForm.quantity),
      notes: distributionForm.notes || null,
    };
    createDistributionMutation.mutate(data);
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor?.name || "Unknown Doctor";
  };

  const getSampleInfo = (sampleId: string) => {
    const sample = samples.find((s) => s.id === sampleId);
    if (!sample) return "Unknown Sample";
    const product = products.find((p) => p.id === sample.productId);
    return `${product?.name || "Unknown"} (Batch: ${sample.batchNumber || "N/A"})`;
  };

  const isExpiringSoon = (expiryDate: Date | null) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: Date | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filteredSamples = samples.filter((sample) => {
    if (!searchTerm) return true;
    const productName = getProductName(sample.productId);
    return productName.toLowerCase().includes(searchTerm.toLowerCase()) || sample.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const availableSamplesForDistribution = samples.filter((s) => s.quantity > 0 && !isExpired(s.expiryDate));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-7 w-7 text-primary" />
          Sample Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage product samples and track distributions to doctors
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{samples.length}</div>
            <p className="text-xs text-muted-foreground">Total Sample Batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{samples.reduce((sum, s) => sum + s.quantity, 0)}</div>
            <p className="text-xs text-muted-foreground">Total Samples in Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{distributions.length}</div>
            <p className="text-xs text-muted-foreground">Total Distributions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">{samples.filter((s) => isExpiringSoon(s.expiryDate)).length}</div>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="distributions" data-testid="tab-distributions">
            <Send className="h-4 w-4 mr-2" />
            Distributions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search samples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-samples"
              />
            </div>
            <div className="flex gap-2">
              <Dialog open={isDistributeDialogOpen} onOpenChange={setIsDistributeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => resetDistributionForm()} data-testid="button-distribute-sample">
                    <Send className="h-4 w-4 mr-2" />
                    Distribute
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Distribute Sample</DialogTitle>
                    <DialogDescription>Record a sample distribution to a doctor</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Sample *</Label>
                      <Select value={distributionForm.productSampleId} onValueChange={(v) => setDistributionForm({ ...distributionForm, productSampleId: v })}>
                        <SelectTrigger data-testid="select-distribution-sample">
                          <SelectValue placeholder="Select sample" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSamplesForDistribution.map((sample) => (
                            <SelectItem key={sample.id} value={sample.id}>
                              {getProductName(sample.productId)} - {sample.batchNumber || "No Batch"} (Qty: {sample.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Doctor *</Label>
                      <Select value={distributionForm.doctorId} onValueChange={(v) => setDistributionForm({ ...distributionForm, doctorId: v })}>
                        <SelectTrigger data-testid="select-distribution-doctor">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={distributionForm.quantity}
                        onChange={(e) => setDistributionForm({ ...distributionForm, quantity: e.target.value })}
                        placeholder="Enter quantity"
                        min="1"
                        data-testid="input-distribution-quantity"
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={distributionForm.notes}
                        onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                        placeholder="Additional notes..."
                        data-testid="input-distribution-notes"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsDistributeDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handleDistributionSubmit}
                      disabled={!distributionForm.productSampleId || !distributionForm.doctorId || !distributionForm.quantity}
                      data-testid="button-confirm-distribution"
                    >
                      Distribute
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddSampleDialogOpen} onOpenChange={setIsAddSampleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetSampleForm()} data-testid="button-add-sample">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sample
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Sample</DialogTitle>
                    <DialogDescription>Add new product samples to inventory</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Product *</Label>
                      <Select value={sampleForm.productId} onValueChange={(v) => setSampleForm({ ...sampleForm, productId: v })}>
                        <SelectTrigger data-testid="select-sample-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Batch Number</Label>
                      <Input
                        value={sampleForm.batchNumber}
                        onChange={(e) => setSampleForm({ ...sampleForm, batchNumber: e.target.value })}
                        placeholder="e.g., BATCH-2024-001"
                        data-testid="input-sample-batch"
                      />
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={sampleForm.quantity}
                        onChange={(e) => setSampleForm({ ...sampleForm, quantity: e.target.value })}
                        placeholder="Enter quantity"
                        min="1"
                        data-testid="input-sample-quantity"
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={sampleForm.expiryDate}
                        onChange={(e) => setSampleForm({ ...sampleForm, expiryDate: e.target.value })}
                        data-testid="input-sample-expiry"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddSampleDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handleSampleSubmit}
                      disabled={!sampleForm.productId || !sampleForm.quantity}
                      data-testid="button-save-sample"
                    >
                      Add Sample
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samplesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading samples...
                      </TableCell>
                    </TableRow>
                  ) : filteredSamples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No samples found. Add your first sample.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSamples.map((sample) => (
                      <TableRow key={sample.id} data-testid={`row-sample-${sample.id}`}>
                        <TableCell className="font-medium">{getProductName(sample.productId)}</TableCell>
                        <TableCell>{sample.batchNumber || "N/A"}</TableCell>
                        <TableCell className="text-right">{sample.quantity}</TableCell>
                        <TableCell>
                          {sample.expiryDate ? format(new Date(sample.expiryDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          {isExpired(sample.expiryDate) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : isExpiringSoon(sample.expiryDate) ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              Expiring Soon
                            </Badge>
                          ) : sample.quantity === 0 ? (
                            <Badge variant="secondary">Out of Stock</Badge>
                          ) : (
                            <Badge variant="default">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product/Batch</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading distributions...
                      </TableCell>
                    </TableRow>
                  ) : distributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No distributions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    distributions.map((dist) => (
                      <TableRow key={dist.id} data-testid={`row-distribution-${dist.id}`}>
                        <TableCell>
                          {dist.distributionDate ? format(new Date(dist.distributionDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>{getSampleInfo(dist.productSampleId)}</TableCell>
                        <TableCell>{getDoctorName(dist.doctorId)}</TableCell>
                        <TableCell className="text-right">{dist.quantity}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{dist.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
