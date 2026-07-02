import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Microscope, 
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Printer
} from "lucide-react";

interface PendingTest {
  id: string;
  patientName: string;
  testName: string;
  sampleType: string;
  orderedBy: string;
  orderedAt: string;
  status: 'awaiting_sample' | 'sample_collected' | 'processing' | 'awaiting_validation';
  priority: 'normal' | 'urgent' | 'stat';
}

export default function LabTechnicianDashboard() {
  const { data: stats } = useQuery<{
    pendingTests: number;
    samplesPending: number;
    inProcessing: number;
    completedToday: number;
  }>({
    queryKey: ['/api/healthcare/lab/stats'],
  });

  const { data: tests } = useQuery<PendingTest[]>({
    queryKey: ['/api/healthcare/lab/pending-tests'],
  });

  const statsData = stats || {
    pendingTests: 15,
    samplesPending: 6,
    inProcessing: 5,
    completedToday: 23
  };

  const mockTests: PendingTest[] = tests || [
    { id: '1', patientName: 'Mohammad Khan', testName: 'CBC with ESR', sampleType: 'Blood', orderedBy: 'Dr. Ahmed', orderedAt: '10 mins ago', status: 'awaiting_sample', priority: 'stat' },
    { id: '2', patientName: 'Zainab Ali', testName: 'Liver Function Test', sampleType: 'Blood', orderedBy: 'Dr. Sara', orderedAt: '25 mins ago', status: 'sample_collected', priority: 'urgent' },
    { id: '3', patientName: 'Imran Hussain', testName: 'Urine R/E', sampleType: 'Urine', orderedBy: 'Dr. Usman', orderedAt: '45 mins ago', status: 'processing', priority: 'normal' },
    { id: '4', patientName: 'Amina Begum', testName: 'Thyroid Profile', sampleType: 'Blood', orderedBy: 'Dr. Ahmed', orderedAt: '1 hour ago', status: 'awaiting_validation', priority: 'normal' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_sample':
        return <Badge variant="secondary">Awaiting Sample</Badge>;
      case 'sample_collected':
        return <Badge variant="outline">Sample Ready</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'awaiting_validation':
        return <Badge className="bg-amber-500">Awaiting Validation</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'stat':
        return <Badge variant="destructive">STAT</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500">Urgent</Badge>;
      default:
        return null;
    }
  };

  const getActionButton = (test: PendingTest) => {
    switch (test.status) {
      case 'awaiting_sample':
        return (
          <Button size="sm" data-testid={`button-collect-${test.id}`}>
            Collect Sample
          </Button>
        );
      case 'sample_collected':
        return (
          <Button size="sm" data-testid={`button-start-${test.id}`}>
            Start Processing
          </Button>
        );
      case 'processing':
        return (
          <Button size="sm" variant="outline" data-testid={`button-enter-${test.id}`}>
            Enter Results
          </Button>
        );
      case 'awaiting_validation':
        return (
          <Button size="sm" variant="secondary" data-testid={`button-pending-${test.id}`}>
            Pending Validation
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="lab-technician-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Laboratory Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/healthcare/test-terminal">
            <Button data-testid="button-test-terminal">
              <Microscope className="h-4 w-4 mr-2" />
              Test Terminal
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-pending-tests">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">{statsData.pendingTests}</div>
            <p className="text-xs text-muted-foreground">Total in queue</p>
          </CardContent>
        </Card>

        <Card className={statsData.samplesPending > 5 ? "border-amber-500" : ""} data-testid="card-samples-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Samples Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-samples-count">{statsData.samplesPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting collection</p>
          </CardContent>
        </Card>

        <Card data-testid="card-in-processing">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Processing</CardTitle>
            <Microscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-processing-count">{statsData.inProcessing}</div>
            <p className="text-xs text-muted-foreground">Currently analyzing</p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">{statsData.completedToday}</div>
            <p className="text-xs text-muted-foreground">Reports finalized</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-test-queue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Test Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTests.map((test) => (
              <div 
                key={test.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${test.priority === 'stat' ? 'border-red-500 bg-red-50 dark:bg-red-950' : test.priority === 'urgent' ? 'border-orange-300' : ''}`}
                data-testid={`test-row-${test.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{test.patientName}</span>
                    {getPriorityBadge(test.priority)}
                    {getStatusBadge(test.status)}
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">{test.testName}</p>
                  <p className="text-sm text-muted-foreground">
                    {test.sampleType} • {test.orderedBy} • {test.orderedAt}
                  </p>
                </div>
                {getActionButton(test)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Microscope className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" data-testid="button-sample-collection">
              <TestTube className="h-6 w-6 mb-2" />
              Sample Collection
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-enter-results">
              <FileText className="h-6 w-6 mb-2" />
              Enter Results
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-upload-report">
              <Upload className="h-6 w-6 mb-2" />
              Upload Report
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-print-labels">
              <Printer className="h-6 w-6 mb-2" />
              Print Labels
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
