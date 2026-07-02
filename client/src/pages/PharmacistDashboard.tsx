import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Pill, 
  FileText, 
  AlertTriangle, 
  Package,
  Clock,
  CheckCircle,
  Search,
  BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface PendingPrescription {
  id: string;
  patientName: string;
  doctorName: string;
  medicines: number;
  createdAt: string;
  priority: 'normal' | 'urgent';
}

interface LowStockItem {
  id: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
}

export default function PharmacistDashboard() {
  const { data: stats } = useQuery<{
    pendingPrescriptions: number;
    dispensedToday: number;
    lowStockItems: number;
    expiringItems: number;
  }>({
    queryKey: ['/api/healthcare/pharmacy/stats'],
  });

  const { data: prescriptions } = useQuery<PendingPrescription[]>({
    queryKey: ['/api/healthcare/pharmacy/pending-prescriptions'],
  });

  const { data: lowStock } = useQuery<LowStockItem[]>({
    queryKey: ['/api/healthcare/pharmacy/low-stock'],
  });

  const statsData = stats || {
    pendingPrescriptions: 8,
    dispensedToday: 45,
    lowStockItems: 12,
    expiringItems: 3
  };

  const mockPrescriptions: PendingPrescription[] = prescriptions || [
    { id: '1', patientName: 'Fatima Khan', doctorName: 'Dr. Ahmed', medicines: 3, createdAt: '5 mins ago', priority: 'urgent' },
    { id: '2', patientName: 'Hassan Ali', doctorName: 'Dr. Sara', medicines: 2, createdAt: '15 mins ago', priority: 'normal' },
    { id: '3', patientName: 'Ayesha Malik', doctorName: 'Dr. Usman', medicines: 5, createdAt: '25 mins ago', priority: 'normal' },
  ];

  const mockLowStock: LowStockItem[] = lowStock || [
    { id: '1', medicineName: 'Paracetamol 500mg', currentStock: 50, reorderLevel: 100, unit: 'tablets' },
    { id: '2', medicineName: 'Amoxicillin 250mg', currentStock: 30, reorderLevel: 80, unit: 'capsules' },
    { id: '3', medicineName: 'Omeprazole 20mg', currentStock: 20, reorderLevel: 50, unit: 'capsules' },
  ];

  return (
    <div className="space-y-6" data-testid="pharmacist-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Pharmacy Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/healthcare/pharmacy">
            <Button data-testid="button-dispensary">
              <Pill className="h-4 w-4 mr-2" />
              Dispensary
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline" data-testid="button-inventory">
              <Package className="h-4 w-4 mr-2" />
              Stock Management
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search medicine by name or barcode..." 
            className="pl-10"
            data-testid="input-medicine-search"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={statsData.pendingPrescriptions > 0 ? "border-primary" : ""} data-testid="card-pending-rx">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-pending-count">{statsData.pendingPrescriptions}</div>
            <p className="text-xs text-muted-foreground">Awaiting dispensing</p>
          </CardContent>
        </Card>

        <Card data-testid="card-dispensed-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispensed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-dispensed-count">{statsData.dispensedToday}</div>
            <p className="text-xs text-muted-foreground">Prescriptions completed</p>
          </CardContent>
        </Card>

        <Card className={statsData.lowStockItems > 10 ? "border-amber-500" : ""} data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-lowstock-count">{statsData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Below reorder level</p>
          </CardContent>
        </Card>

        <Card className={statsData.expiringItems > 0 ? "border-red-500" : ""} data-testid="card-expiring">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-expiring-count">{statsData.expiringItems}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-pending-prescriptions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Pending Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPrescriptions.map((rx) => (
                <div 
                  key={rx.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`rx-row-${rx.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rx.patientName}</span>
                      {rx.priority === 'urgent' && (
                        <Badge variant="destructive" data-testid={`badge-urgent-${rx.id}`}>
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rx.doctorName} • {rx.medicines} items • {rx.createdAt}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={rx.priority === 'urgent' ? "destructive" : "default"}
                    data-testid={`button-dispense-${rx.id}`}
                  >
                    Dispense
                  </Button>
                </div>
              ))}
              <Link href="/healthcare/pharmacy">
                <Button variant="outline" className="w-full mt-2" data-testid="button-view-all-rx">
                  View All Prescriptions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock-items">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockLowStock.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`stock-row-${item.id}`}
                >
                  <div className="flex-1">
                    <span className="font-medium">{item.medicineName}</span>
                    <p className="text-sm text-muted-foreground">
                      Stock: {item.currentStock} {item.unit} (Reorder: {item.reorderLevel})
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-reorder-${item.id}`}
                  >
                    Reorder
                  </Button>
                </div>
              ))}
              <Link href="/inventory">
                <Button variant="outline" className="w-full mt-2" data-testid="button-view-all-stock">
                  View All Stock
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" data-testid="button-scan-rx">
              <Search className="h-6 w-6 mb-2" />
              Scan Prescription
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-drug-check">
              <AlertTriangle className="h-6 w-6 mb-2" />
              Drug Interaction
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-stock-receipt">
              <Package className="h-6 w-6 mb-2" />
              Receive Stock
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-sales-report">
              <BarChart3 className="h-6 w-6 mb-2" />
              Sales Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
