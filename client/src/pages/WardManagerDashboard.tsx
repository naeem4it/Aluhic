import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BedDouble, 
  Users,
  Clock,
  AlertCircle,
  Activity,
  ClipboardList,
  UserCheck,
  Calendar
} from "lucide-react";

interface WardBed {
  id: string;
  bedNumber: string;
  patientName: string | null;
  admissionDate: string | null;
  status: 'occupied' | 'vacant' | 'reserved' | 'maintenance';
  wardType: string;
}

interface NurseShift {
  id: string;
  nurseName: string;
  shift: 'morning' | 'evening' | 'night';
  assignedBeds: number;
  status: 'on_duty' | 'break' | 'off_duty';
}

export default function WardManagerDashboard() {
  const { data: stats } = useQuery<{
    totalBeds: number;
    occupiedBeds: number;
    pendingDischarges: number;
    criticalPatients: number;
  }>({
    queryKey: ['/api/healthcare/ward/stats'],
  });

  const { data: beds } = useQuery<WardBed[]>({
    queryKey: ['/api/healthcare/ward/beds'],
  });

  const { data: nurses } = useQuery<NurseShift[]>({
    queryKey: ['/api/healthcare/ward/nurses'],
  });

  const statsData = stats || {
    totalBeds: 50,
    occupiedBeds: 38,
    pendingDischarges: 5,
    criticalPatients: 2
  };

  const mockBeds: WardBed[] = beds || [
    { id: '1', bedNumber: 'GW-01', patientName: 'Ahmed Khan', admissionDate: '3 days', status: 'occupied', wardType: 'General' },
    { id: '2', bedNumber: 'GW-02', patientName: null, status: 'vacant', admissionDate: null, wardType: 'General' },
    { id: '3', bedNumber: 'PW-01', patientName: 'Sara Malik', admissionDate: '5 days', status: 'occupied', wardType: 'Private' },
    { id: '4', bedNumber: 'ICU-01', patientName: 'Mohammad Ali', admissionDate: '1 day', status: 'occupied', wardType: 'ICU' },
    { id: '5', bedNumber: 'GW-03', patientName: null, status: 'reserved', admissionDate: null, wardType: 'General' },
  ];

  const mockNurses: NurseShift[] = nurses || [
    { id: '1', nurseName: 'Fatima Noor', shift: 'morning', assignedBeds: 8, status: 'on_duty' },
    { id: '2', nurseName: 'Ayesha Khan', shift: 'morning', assignedBeds: 7, status: 'on_duty' },
    { id: '3', nurseName: 'Zainab Ali', shift: 'morning', assignedBeds: 8, status: 'break' },
  ];

  const occupancyRate = Math.round((statsData.occupiedBeds / statsData.totalBeds) * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-blue-500">Occupied</Badge>;
      case 'vacant':
        return <Badge className="bg-green-500">Vacant</Badge>;
      case 'reserved':
        return <Badge className="bg-amber-500">Reserved</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case 'morning':
        return <Badge variant="outline">Morning</Badge>;
      case 'evening':
        return <Badge className="bg-orange-500">Evening</Badge>;
      case 'night':
        return <Badge className="bg-indigo-500">Night</Badge>;
      default:
        return <Badge>{shift}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="ward-manager-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Ward Management</h1>
        <div className="flex gap-2">
          <Link href="/healthcare/ipd">
            <Button data-testid="button-ipd-terminal">
              <BedDouble className="h-4 w-4 mr-2" />
              IPD Terminal
            </Button>
          </Link>
          <Link href="/healthcare/nursing">
            <Button variant="outline" data-testid="button-nursing">
              <Activity className="h-4 w-4 mr-2" />
              Nursing Station
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-occupancy">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bed Occupancy</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-occupancy">
              {statsData.occupiedBeds}/{statsData.totalBeds}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${occupancyRate > 90 ? 'bg-red-500' : occupancyRate > 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">{occupancyRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-nurses-on-duty">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nurses On Duty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-nurses-count">
              {mockNurses.filter(n => n.status === 'on_duty').length}
            </div>
            <p className="text-xs text-muted-foreground">Current shift</p>
          </CardContent>
        </Card>

        <Card className={statsData.pendingDischarges > 0 ? "border-amber-500" : ""} data-testid="card-pending-discharges">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Discharges</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-discharge-count">{statsData.pendingDischarges}</div>
            <p className="text-xs text-muted-foreground">Ready for discharge</p>
          </CardContent>
        </Card>

        <Card className={statsData.criticalPatients > 0 ? "border-red-500 bg-red-50 dark:bg-red-950" : ""} data-testid="card-critical">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Patients</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-critical-count">{statsData.criticalPatients}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-bed-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              Bed Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockBeds.map((bed) => (
                <div 
                  key={bed.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`bed-row-${bed.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bed.bedNumber}</span>
                      <Badge variant="outline">{bed.wardType}</Badge>
                      {getStatusBadge(bed.status)}
                    </div>
                    {bed.patientName && (
                      <p className="text-sm text-muted-foreground">
                        {bed.patientName} • {bed.admissionDate}
                      </p>
                    )}
                  </div>
                  {bed.status === 'occupied' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-view-patient-${bed.id}`}
                    >
                      View Patient
                    </Button>
                  )}
                  {bed.status === 'vacant' && (
                    <Button 
                      size="sm"
                      data-testid={`button-admit-${bed.id}`}
                    >
                      Admit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-nursing-staff">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Nursing Staff - Current Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockNurses.map((nurse) => (
                <div 
                  key={nurse.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`nurse-row-${nurse.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{nurse.nurseName}</span>
                      {getShiftBadge(nurse.shift)}
                      <Badge variant={nurse.status === 'on_duty' ? 'default' : 'secondary'}>
                        {nurse.status === 'on_duty' ? 'On Duty' : nurse.status === 'break' ? 'Break' : 'Off'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Assigned: {nurse.assignedBeds} beds
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-reassign-${nurse.id}`}
                  >
                    Reassign
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
            <Button variant="outline" className="h-20 flex-col" data-testid="button-new-admission">
              <BedDouble className="h-6 w-6 mb-2" />
              New Admission
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-shift-handover">
              <UserCheck className="h-6 w-6 mb-2" />
              Shift Handover
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-bed-transfer">
              <Activity className="h-6 w-6 mb-2" />
              Bed Transfer
            </Button>
            <Button variant="outline" className="h-20 flex-col" data-testid="button-schedule">
              <Calendar className="h-6 w-6 mb-2" />
              Staff Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
