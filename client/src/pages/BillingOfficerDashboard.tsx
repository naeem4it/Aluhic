import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Receipt, 
  CreditCard,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
  Calculator,
  Printer,
  RefreshCcw
} from "lucide-react";

interface PendingBill {
  id: string;
  patientName: string;
  amount: number;
  type: 'opd' | 'ipd' | 'lab' | 'pharmacy';
  createdAt: string;
  status: 'pending' | 'partial' | 'insurance_pending';
}

export default function BillingOfficerDashboard() {
  const { data: stats } = useQuery<{
    pendingBills: number;
    collectedToday: number;
    pendingAmount: number;
    insurancePending: number;
  }>({
    queryKey: ['/api/healthcare/billing/stats'],
  });

  const { data: bills } = useQuery<PendingBill[]>({
    queryKey: ['/api/healthcare/billing/pending'],
  });

  const statsData = stats || {
    pendingBills: 18,
    collectedToday: 125000,
    pendingAmount: 450000,
    insurancePending: 8
  };

  const mockBills: PendingBill[] = bills || [
    { id: '1', patientName: 'Ahmed Khan', amount: 15000, type: 'opd', createdAt: '10 mins ago', status: 'pending' },
    { id: '2', patientName: 'Sara Malik', amount: 85000, type: 'ipd', createdAt: '1 hour ago', status: 'partial' },
    { id: '3', patientName: 'Usman Ali', amount: 3500, type: 'lab', createdAt: '2 hours ago', status: 'pending' },
    { id: '4', patientName: 'Fatima Noor', amount: 120000, type: 'ipd', createdAt: '3 hours ago', status: 'insurance_pending' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'opd':
        return <Badge variant="outline">OPD</Badge>;
      case 'ipd':
        return <Badge className="bg-blue-500">IPD</Badge>;
      case 'lab':
        return <Badge className="bg-purple-500">Lab</Badge>;
      case 'pharmacy':
        return <Badge className="bg-green-500">Pharmacy</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'partial':
        return <Badge className="bg-amber-500">Partial</Badge>;
      case 'insurance_pending':
        return <Badge className="bg-blue-500">Insurance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="billing-officer-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Billing Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/healthcare/billing">
            <Button data-testid="button-billing-terminal">
              <Receipt className="h-4 w-4 mr-2" />
              Billing Terminal
            </Button>
          </Link>
          <Link href="/healthcare/insurance">
            <Button variant="outline" data-testid="button-insurance">
              <FileText className="h-4 w-4 mr-2" />
              Insurance Claims
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={statsData.pendingBills > 15 ? "border-amber-500" : ""} data-testid="card-pending-bills">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">{statsData.pendingBills}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card data-testid="card-collected-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Today</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-collected-amount">
              {formatCurrency(statsData.collectedToday)}
            </div>
            <p className="text-xs text-muted-foreground">Total collections</p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-amount">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-amount">
              {formatCurrency(statsData.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding receivables</p>
          </CardContent>
        </Card>

        <Card className={statsData.insurancePending > 5 ? "border-blue-500" : ""} data-testid="card-insurance-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Pending</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-insurance-count">{statsData.insurancePending}</div>
            <p className="text-xs text-muted-foreground">Claims awaiting</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-pending-bills-list">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pending Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockBills.map((bill) => (
              <div 
                key={bill.id} 
                className="flex items-center justify-between p-4 rounded-lg border"
                data-testid={`bill-row-${bill.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{bill.patientName}</span>
                    {getTypeBadge(bill.type)}
                    {getStatusBadge(bill.status)}
                  </div>
                  <p className="text-lg font-bold text-primary mt-1">{formatCurrency(bill.amount)}</p>
                  <p className="text-sm text-muted-foreground">{bill.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-view-${bill.id}`}
                  >
                    View
                  </Button>
                  <Button 
                    size="sm"
                    data-testid={`button-collect-${bill.id}`}
                  >
                    Collect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" data-testid="button-new-bill">
              <Receipt className="h-6 w-6 mb-2" />
              New Bill
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-collect-payment">
              <CreditCard className="h-6 w-6 mb-2" />
              Collect Payment
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-refund">
              <RefreshCcw className="h-6 w-6 mb-2" />
              Process Refund
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-day-report">
              <Calculator className="h-6 w-6 mb-2" />
              Day End Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
