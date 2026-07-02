import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, TrendingUp, Package, DollarSign, BarChart3 } from "lucide-react";

type PrescriptionAnalytics = {
  products: Array<{
    productId: string;
    productName: string;
    genericName: string | null;
    prescriptionCount: number;
    totalQuantity: number;
  }>;
  totalPrescriptions: number;
  totalQuantity: number;
};

type SalesAnalytics = {
  products: Array<{
    productId: string;
    productName: string;
    genericName: string | null;
    salesCount: number;
    totalQuantity: number;
    totalAmount: number;
  }>;
  totalSales: number;
  totalQuantity: number;
  totalAmount: number;
};

export default function PharmaAnalytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: prescriptionData, isLoading: loadingPrescriptions } = useQuery<PrescriptionAnalytics>({
    queryKey: ["/api/pharma/prescription-analytics"],
  });

  const buildSalesUrl = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return queryString ? `/api/pharma/sales-analytics?${queryString}` : "/api/pharma/sales-analytics";
  };

  const { data: salesData, isLoading: loadingSales } = useQuery<SalesAnalytics>({
    queryKey: [buildSalesUrl()],
  });

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Pharma Analytics</h1>
        <p className="text-muted-foreground">
          Cross-organization analytics for your pharmaceutical products
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-prescriptions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-prescriptions">
              {loadingPrescriptions ? "..." : prescriptionData?.totalPrescriptions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all facilities
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-prescription-quantity">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Prescribed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-prescription-quantity">
              {loadingPrescriptions ? "..." : prescriptionData?.totalQuantity || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total prescribed units
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-sales">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sales">
              {loadingSales ? "..." : salesData?.totalSales || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sales transactions
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              Rs. {loadingSales ? "..." : (salesData?.totalAmount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              From product sales
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prescriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
            <Pill className="h-4 w-4 mr-2" />
            Prescription Analytics
          </TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">
            <BarChart3 className="h-4 w-4 mr-2" />
            Sales Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Prescription Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrescriptions ? (
                <div className="text-center py-8 text-muted-foreground">Loading prescription data...</div>
              ) : !prescriptionData?.products?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No prescription data available for your products
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Generic Name</TableHead>
                      <TableHead className="text-right">Prescriptions</TableHead>
                      <TableHead className="text-right">Total Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptionData.products.map((product) => (
                      <TableRow key={product.productId} data-testid={`row-prescription-${product.productId}`}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.genericName || "-"}</TableCell>
                        <TableCell className="text-right">{product.prescriptionCount}</TableCell>
                        <TableCell className="text-right">{product.totalQuantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle>Product Sales Performance</CardTitle>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-[150px]"
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="endDate" className="text-xs">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-[150px]"
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <div className="text-center py-8 text-muted-foreground">Loading sales data...</div>
              ) : !salesData?.products?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available for your products
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Generic Name</TableHead>
                      <TableHead className="text-right">Sales Count</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.products.map((product) => (
                      <TableRow key={product.productId} data-testid={`row-sales-${product.productId}`}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.genericName || "-"}</TableCell>
                        <TableCell className="text-right">{product.salesCount}</TableCell>
                        <TableCell className="text-right">{product.totalQuantity}</TableCell>
                        <TableCell className="text-right">
                          Rs. {product.totalAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
