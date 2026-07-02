import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ShieldCheck, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  FileSearch
} from "lucide-react";

interface InsuranceClaim {
  id: string;
  patientName: string;
  insuranceProvider: string;
  claimAmount: number;
  submittedAt: string;
  status: 'pre_auth' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'partial';
  daysOld: number;
}

export default function InsuranceCoordinatorDashboard() {
  const { data: stats } = useQuery<{
    pendingPreAuth: number;
    claimsSubmitted: number;
    approvedThisMonth: number;
    rejectedClaims: number;
  }>({
    queryKey: ['/api/healthcare/insurance/stats'],
  });

  const { data: claims } = useQuery<InsuranceClaim[]>({
    queryKey: ['/api/healthcare/insurance/pending-claims'],
  });

  const statsData = stats || {
    pendingPreAuth: 5,
    claimsSubmitted: 23,
    approvedThisMonth: 18,
    rejectedClaims: 3
  };

  const mockClaims: InsuranceClaim[] = claims || [
    { id: '1', patientName: 'Mohammad Ali', insuranceProvider: 'State Life', claimAmount: 250000, submittedAt: '2 days ago', status: 'pre_auth', daysOld: 2 },
    { id: '2', patientName: 'Ayesha Khan', insuranceProvider: 'Jubilee', claimAmount: 85000, submittedAt: '5 days ago', status: 'under_review', daysOld: 5 },
    { id: '3', patientName: 'Hassan Raza', insuranceProvider: 'Adamjee', claimAmount: 120000, submittedAt: '1 week ago', status: 'partial', daysOld: 7 },
    { id: '4', patientName: 'Sadia Malik', insuranceProvider: 'EFU', claimAmount: 45000, submittedAt: '10 days ago', status: 'rejected', daysOld: 10 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pre_auth':
        return <Badge variant="secondary">Pre-Authorization</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'under_review':
        return <Badge className="bg-amber-500">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'partial':
        return <Badge className="bg-purple-500">Partial Approval</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="insurance-coordinator-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Insurance Claims Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/healthcare/insurance">
            <Button data-testid="button-claims-terminal">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Claims Terminal
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={statsData.pendingPreAuth > 0 ? "border-amber-500" : ""} data-testid="card-pending-preauth">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pre-Auth</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-preauth-count">{statsData.pendingPreAuth}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card data-testid="card-claims-submitted">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Submitted</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-submitted-count">{statsData.claimsSubmitted}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-approved">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-approved-count">{statsData.approvedThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className={statsData.rejectedClaims > 0 ? "border-red-500" : ""} data-testid="card-rejected">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-count">{statsData.rejectedClaims}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-claims-list">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Active Claims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockClaims.map((claim) => (
              <div 
                key={claim.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${claim.status === 'rejected' ? 'border-red-300 bg-red-50 dark:bg-red-950' : claim.daysOld > 7 ? 'border-amber-300' : ''}`}
                data-testid={`claim-row-${claim.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{claim.patientName}</span>
                    {getStatusBadge(claim.status)}
                    {claim.daysOld > 7 && (
                      <Badge variant="outline" className="text-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {claim.daysOld} days
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold text-primary mt-1">{formatCurrency(claim.claimAmount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {claim.insuranceProvider} • {claim.submittedAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-view-${claim.id}`}
                  >
                    View Details
                  </Button>
                  {claim.status === 'rejected' && (
                    <Button 
                      size="sm"
                      variant="destructive"
                      data-testid={`button-appeal-${claim.id}`}
                    >
                      Appeal
                    </Button>
                  )}
                  {claim.status === 'pre_auth' && (
                    <Button 
                      size="sm"
                      data-testid={`button-submit-${claim.id}`}
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" data-testid="button-new-preauth">
              <FileText className="h-6 w-6 mb-2" />
              New Pre-Auth
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-submit-claim">
              <Send className="h-6 w-6 mb-2" />
              Submit Claim
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-track-claims">
              <FileSearch className="h-6 w-6 mb-2" />
              Track Claims
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-settlement">
              <CheckCircle className="h-6 w-6 mb-2" />
              Record Settlement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
