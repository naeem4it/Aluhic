import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Heart, 
  Users, 
  Clock, 
  AlertCircle, 
  Pill, 
  Thermometer,
  Activity,
  BedDouble,
  ClipboardList
} from "lucide-react";

interface PatientVital {
  id: string;
  patientName: string;
  bedNumber: string;
  wardName: string;
  lastVitalsTime: string;
  isOverdue: boolean;
  alertLevel: 'normal' | 'warning' | 'critical';
}

interface MedicationDue {
  id: string;
  patientName: string;
  medication: string;
  dosage: string;
  dueTime: string;
  isOverdue: boolean;
}

export default function NurseDashboard() {
  const { data: stats } = useQuery<{
    assignedPatients: number;
    pendingVitals: number;
    medicationsDue: number;
    criticalAlerts: number;
  }>({
    queryKey: ['/api/healthcare/nurse/stats'],
  });

  const { data: vitalsDue } = useQuery<PatientVital[]>({
    queryKey: ['/api/healthcare/nurse/vitals-due'],
  });

  const { data: medications } = useQuery<MedicationDue[]>({
    queryKey: ['/api/healthcare/nurse/medications-due'],
  });

  const statsData = stats || {
    assignedPatients: 12,
    pendingVitals: 4,
    medicationsDue: 7,
    criticalAlerts: 1
  };

  const mockVitals: PatientVital[] = vitalsDue || [
    { id: '1', patientName: 'Ahmed Khan', bedNumber: 'ICU-01', wardName: 'ICU', lastVitalsTime: '2 hours ago', isOverdue: true, alertLevel: 'critical' },
    { id: '2', patientName: 'Sara Malik', bedNumber: 'W1-05', wardName: 'General Ward', lastVitalsTime: '1 hour ago', isOverdue: true, alertLevel: 'warning' },
    { id: '3', patientName: 'Usman Ali', bedNumber: 'W2-03', wardName: 'Private Ward', lastVitalsTime: '45 mins ago', isOverdue: false, alertLevel: 'normal' },
  ];

  const mockMedications: MedicationDue[] = medications || [
    { id: '1', patientName: 'Ahmed Khan', medication: 'Amlodipine 5mg', dosage: '1 tablet', dueTime: '10:00 AM', isOverdue: true },
    { id: '2', patientName: 'Fatima Noor', medication: 'Metformin 500mg', dosage: '1 tablet', dueTime: '10:30 AM', isOverdue: false },
    { id: '3', patientName: 'Usman Ali', medication: 'Insulin', dosage: '10 units', dueTime: '11:00 AM', isOverdue: false },
  ];

  return (
    <div className="space-y-6" data-testid="nurse-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Nursing Station</h1>
        <div className="flex gap-2">
          <Link href="/healthcare/nursing">
            <Button variant="outline" data-testid="button-nursing-station">
              <Activity className="h-4 w-4 mr-2" />
              Nursing Station
            </Button>
          </Link>
          <Link href="/healthcare/ipd">
            <Button data-testid="button-view-ipd">
              <BedDouble className="h-4 w-4 mr-2" />
              IPD Patients
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-assigned-patients">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-assigned-count">{statsData.assignedPatients}</div>
            <p className="text-xs text-muted-foreground">Currently under your care</p>
          </CardContent>
        </Card>

        <Card className={statsData.pendingVitals > 0 ? "border-amber-500" : ""} data-testid="card-pending-vitals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vitals</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-vitals-count">{statsData.pendingVitals}</div>
            <p className="text-xs text-muted-foreground">Need recording now</p>
          </CardContent>
        </Card>

        <Card className={statsData.medicationsDue > 0 ? "border-blue-500" : ""} data-testid="card-medications-due">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medications Due</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-meds-count">{statsData.medicationsDue}</div>
            <p className="text-xs text-muted-foreground">Within next hour</p>
          </CardContent>
        </Card>

        <Card className={statsData.criticalAlerts > 0 ? "border-red-500 bg-red-50 dark:bg-red-950" : ""} data-testid="card-critical-alerts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-alerts-count">{statsData.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-vitals-schedule">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Vitals Check Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockVitals.map((vital) => (
                <div 
                  key={vital.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`vital-row-${vital.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vital.patientName}</span>
                      <Badge 
                        variant={vital.alertLevel === 'critical' ? 'destructive' : vital.alertLevel === 'warning' ? 'secondary' : 'outline'}
                        data-testid={`badge-alert-${vital.id}`}
                      >
                        {vital.alertLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vital.wardName} • {vital.bedNumber} • Last: {vital.lastVitalsTime}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={vital.isOverdue ? "destructive" : "default"}
                    data-testid={`button-record-vitals-${vital.id}`}
                  >
                    Record Vitals
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-medications-schedule">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              Medication Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockMedications.map((med) => (
                <div 
                  key={med.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`medication-row-${med.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{med.patientName}</span>
                      {med.isOverdue && (
                        <Badge variant="destructive" data-testid={`badge-overdue-${med.id}`}>
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {med.medication} - {med.dosage} • Due: {med.dueTime}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={med.isOverdue ? "destructive" : "outline"}
                    data-testid={`button-administer-${med.id}`}
                  >
                    Administer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" data-testid="button-shift-handover">
              <Clock className="h-6 w-6 mb-2" />
              Shift Handover
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-nursing-notes">
              <ClipboardList className="h-6 w-6 mb-2" />
              Nursing Notes
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-critical-report">
              <AlertCircle className="h-6 w-6 mb-2" />
              Report Critical
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-view-schedule">
              <Clock className="h-6 w-6 mb-2" />
              My Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
