import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Clock, CheckCircle, MapPin, DollarSign } from "lucide-react";

type VisitAnalytics = {
  summary: {
    totalVisits: number;
    completedVisits: number;
    agreementsReached: number;
    conversionRate: number;
    avgDuration: number;
  };
  topDoctors: Array<{
    doctorId: string;
    doctorName: string;
    visitCount: number;
    agreements: number;
    totalDuration: number;
  }>;
  visitTrend: Array<{
    date: string;
    count: number;
  }>;
};

type SalesPerformance = {
  summary: {
    totalSales: number;
    totalQuantity: number;
    totalAmount: number;
    avgSaleValue: number;
  };
  topProducts: Array<{
    productName: string;
    quantity: number;
    amount: number;
  }>;
  salesTrend: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
};

export default function MRAnalytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const buildVisitUrl = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return queryString ? `/api/mr/visit-analytics?${queryString}` : "/api/mr/visit-analytics";
  };

  const buildSalesUrl = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return queryString ? `/api/mr/sales-performance?${queryString}` : "/api/mr/sales-performance";
  };

  const { data: visitData, isLoading: loadingVisits } = useQuery<VisitAnalytics>({
    queryKey: [buildVisitUrl()],
  });

  const { data: salesData, isLoading: loadingSales } = useQuery<SalesPerformance>({
    queryKey: [buildSalesUrl()],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">MR Analytics</h1>
        <p className="text-muted-foreground">
          Doctor visit and sales performance analytics for Medical Representatives
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-visits">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-visits">
              {loadingVisits ? "..." : visitData?.summary?.totalVisits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {visitData?.summary?.completedVisits || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {loadingVisits ? "..." : `${visitData?.summary?.conversionRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {visitData?.summary?.agreementsReached || 0} agreements
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
              {loadingSales ? "..." : salesData?.summary?.totalSales || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesData?.summary?.totalQuantity || 0} units sold
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
              {loadingSales ? "..." : formatCurrency(salesData?.summary?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(salesData?.summary?.avgSaleValue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            data-testid="input-start-date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            data-testid="input-end-date"
          />
        </div>
      </div>

      <Tabs defaultValue="visits" className="w-full">
        <TabsList>
          <TabsTrigger value="visits" data-testid="tab-visits">Doctor Visits</TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">Sales Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Visited Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVisits ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : visitData?.topDoctors && visitData.topDoctors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor Name</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right">Agreements</TableHead>
                      <TableHead className="text-right">Total Duration</TableHead>
                      <TableHead className="text-right">Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitData.topDoctors.map((doctor) => (
                      <TableRow key={doctor.doctorId} data-testid={`row-doctor-${doctor.doctorId}`}>
                        <TableCell className="font-medium">{doctor.doctorName}</TableCell>
                        <TableCell className="text-right">{doctor.visitCount}</TableCell>
                        <TableCell className="text-right">{doctor.agreements}</TableCell>
                        <TableCell className="text-right">{doctor.totalDuration} min</TableCell>
                        <TableCell className="text-right">
                          {doctor.visitCount > 0 
                            ? `${Math.round((doctor.agreements / doctor.visitCount) * 100)}%`
                            : "0%"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No visit data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Visit Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Visit Duration</p>
                  <p className="text-xl font-semibold">
                    {visitData?.summary?.avgDuration || 0} minutes
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed Visits</p>
                  <p className="text-xl font-semibold">
                    {visitData?.summary?.completedVisits || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Agreements Reached</p>
                  <p className="text-xl font-semibold">
                    {visitData?.summary?.agreementsReached || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : salesData?.topProducts && salesData.topProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.topProducts.map((product, index) => (
                      <TableRow key={index} data-testid={`row-product-${index}`}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No sales data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sales Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-xl font-semibold">
                    {salesData?.summary?.totalSales || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Units Sold</p>
                  <p className="text-xl font-semibold">
                    {salesData?.summary?.totalQuantity || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Sale Value</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(salesData?.summary?.avgSaleValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
