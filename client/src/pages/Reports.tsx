import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterPanel } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Package, Users, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface EnrichedSalesEntry {
  id: string;
  date: Date;
  userId: string;
  repName: string;
  territory: string;
  doctorId: string;
  doctorName: string;
  productId: string;
  productName: string;
  quantity: number;
  rate: string;
  priceOverride: string | null;
  totalAmount: string;
  paymentMode: string;
  remarks: string | null;
  createdAt: Date;
}

interface ProductReport {
  productName: string;
  totalQuantity: number;
  totalAmount: number;
  orderCount: number;
}

interface DoctorReport {
  doctorName: string;
  totalQuantity: number;
  totalAmount: number;
  orderCount: number;
  productCount: number;
}

interface TerritoryReport {
  territory: string;
  totalQuantity: number;
  totalAmount: number;
  orderCount: number;
  doctorCount: number;
  productCount: number;
}

export default function Reports() {
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({});
  const [activeTab, setActiveTab] = useState("details");

  const queryParams = new URLSearchParams();
  if (filters.dateFrom) queryParams.append("startDate", filters.dateFrom);
  if (filters.dateTo) queryParams.append("endDate", filters.dateTo);
  const queryString = queryParams.toString();

  const { data: salesEntries, isLoading: isLoadingDetails } = useQuery<EnrichedSalesEntry[]>({
    queryKey: ["/api/sales", filters],
    queryFn: async ({ queryKey }) => {
      const [base, filterParams] = queryKey as [string, typeof filters];
      const params = new URLSearchParams();
      if (filterParams.dateFrom) params.append("startDate", filterParams.dateFrom);
      if (filterParams.dateTo) params.append("endDate", filterParams.dateTo);
      const url = params.toString() ? `${base}?${params}` : base;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { data: productReport, isLoading: isLoadingProduct } = useQuery<ProductReport[]>({
    queryKey: [`/api/reports/by-product?${queryString}`],
    enabled: activeTab === "products",
  });

  const { data: doctorReport, isLoading: isLoadingDoctor } = useQuery<DoctorReport[]>({
    queryKey: [`/api/reports/by-doctor?${queryString}`],
    enabled: activeTab === "doctors",
  });

  const { data: territoryReport, isLoading: isLoadingTerritory } = useQuery<TerritoryReport[]>({
    queryKey: [`/api/reports/by-territory?${queryString}`],
    enabled: activeTab === "territory",
  });

  const handleExportPDF = () => {
    if (!salesEntries || salesEntries.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sales Report", 14, 20);
    doc.setFontSize(10);

    let y = 35;
    salesEntries.forEach((entry, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${entry.doctorName} - ${entry.productName}`, 14, y);
      doc.text(`Qty: ${entry.quantity} | Rate: Rs.${entry.rate} | Total: Rs.${entry.totalAmount}`, 20, y + 5);
      y += 12;
    });

    doc.save(`sales-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const handleExportExcel = () => {
    if (!salesEntries || salesEntries.length === 0) return;

    const data = salesEntries.map(entry => ({
      Date: format(new Date(entry.date), "yyyy-MM-dd"),
      "Rep Name": entry.repName,
      Territory: entry.territory,
      "Doctor Name": entry.doctorName,
      "Product Name": entry.productName,
      Quantity: entry.quantity,
      "Rate (Rs.)": entry.rate,
      "Total Amount (Rs.)": entry.totalAmount,
      "Payment Mode": entry.paymentMode,
      Remarks: entry.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `sales-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sales Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze sales data by product, doctor, and territory
        </p>
      </div>

      <FilterPanel onFilterChange={setFilters} />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Export Detailed Report</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={handleExportPDF}
                disabled={!salesEntries || salesEntries.length === 0}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={handleExportExcel}
                disabled={!salesEntries || salesEntries.length === 0}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="h-4 w-4 mr-2" />
            By Product
          </TabsTrigger>
          <TabsTrigger value="doctors" data-testid="tab-doctors">
            <Users className="h-4 w-4 mr-2" />
            By Doctor
          </TabsTrigger>
          <TabsTrigger value="territory" data-testid="tab-territory">
            <MapPin className="h-4 w-4 mr-2" />
            By Territory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDetails ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : !salesEntries || salesEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No sales entries found. {filters.dateFrom || filters.dateTo ? "Try different filters." : "Create your first sales entry!"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{entry.doctorName}</TableCell>
                          <TableCell>{entry.productName}</TableCell>
                          <TableCell className="text-right">{entry.quantity}</TableCell>
                          <TableCell className="text-right font-mono">Rs. {entry.rate}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">Rs. {entry.totalAmount}</TableCell>
                          <TableCell className="capitalize">{entry.paymentMode}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product-wise Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProduct ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : !productReport || productReport.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productReport.map((item) => (
                        <TableRow key={item.productName}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.orderCount}</TableCell>
                          <TableCell className="text-right">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doctor-wise Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDoctor ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : !doctorReport || doctorReport.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor Name</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctorReport.map((item) => (
                        <TableRow key={item.doctorName}>
                          <TableCell className="font-medium">{item.doctorName}</TableCell>
                          <TableCell className="text-right">{item.orderCount}</TableCell>
                          <TableCell className="text-right">{item.productCount}</TableCell>
                          <TableCell className="text-right">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="territory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Territory-wise Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTerritory ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : !territoryReport || territoryReport.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Territory</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Doctors</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {territoryReport.map((item) => (
                        <TableRow key={item.territory}>
                          <TableCell className="font-medium">{item.territory}</TableCell>
                          <TableCell className="text-right">{item.orderCount}</TableCell>
                          <TableCell className="text-right">{item.doctorCount}</TableCell>
                          <TableCell className="text-right">{item.productCount}</TableCell>
                          <TableCell className="text-right">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
