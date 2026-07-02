import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { 
  Users, 
  Clock, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  FileText,
  Building2,
  Timer,
  Edit,
  Wifi,
  Smartphone,
  Fingerprint,
  CreditCard,
  Globe
} from "lucide-react";

const attendanceDeviceSchema = z.object({
  sourceName: z.string().min(1, "Device name is required"),
  sourceType: z.enum(["biometric", "rfid", "mobile_app", "web_punch", "third_party_api"]),
  deviceVendor: z.string().optional(),
  deviceModel: z.string().optional(),
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  isActive: z.boolean().default(true),
  connectionConfig: z.object({
    apiUrl: z.string().optional(),
    port: z.string().optional(),
    username: z.string().optional(),
    syncIntervalMinutes: z.number().default(15),
  }).optional(),
  fieldMapping: z.object({
    employeeIdField: z.string().default("employee_id"),
    timestampField: z.string().default("timestamp"),
    punchTypeField: z.string().default("punch_type"),
  }).optional(),
});

type AttendanceDeviceFormValues = z.infer<typeof attendanceDeviceSchema>;

const defaultDeviceConfig = {
  connectionConfig: {
    apiUrl: "",
    port: "",
    username: "",
    syncIntervalMinutes: 15,
  },
  fieldMapping: {
    employeeIdField: "employee_id",
    timestampField: "timestamp",
    punchTypeField: "punch_type",
  },
};

export default function HRDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd")
  });
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);

  const organizationId = user?.organizationId || user?.companyId;

  const deviceForm = useForm<AttendanceDeviceFormValues>({
    resolver: zodResolver(attendanceDeviceSchema),
    defaultValues: {
      sourceName: "",
      sourceType: "biometric",
      deviceVendor: "",
      deviceModel: "",
      location: "",
      ipAddress: "",
      isActive: true,
      ...defaultDeviceConfig,
    },
  });

  const { data: attendanceLogs = [], isLoading: attendanceLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/attendance", organizationId, dateRange.startDate, dateRange.endDate],
    enabled: !!organizationId
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/shifts", organizationId],
    enabled: !!organizationId
  });

  const { data: attendanceSources = [], isLoading: sourcesLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/attendance-sources", organizationId],
    enabled: !!organizationId
  });

  const { data: salaryStructures = [], isLoading: salariesLoading } = useQuery<any[]>({
    queryKey: ["/api/hr/salary-structures", organizationId],
    enabled: !!organizationId
  });

  const presentCount = attendanceLogs.filter(l => l.status === 'present').length;
  const lateCount = attendanceLogs.filter(l => l.isLate).length;
  const absentCount = attendanceLogs.filter(l => l.status === 'absent').length;
  const overtimeHours = attendanceLogs.reduce((sum, l) => sum + (l.overtimeMinutes || 0) / 60, 0);

  const createDeviceMutation = useMutation({
    mutationFn: async (data: AttendanceDeviceFormValues) => {
      return apiRequest("/api/hr/attendance-sources", {
        method: "POST",
        body: JSON.stringify({ ...data, organizationId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Device added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/attendance-sources", organizationId] });
      handleDeviceDialogChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to add device", description: error.message, variant: "destructive" });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AttendanceDeviceFormValues }) => {
      return apiRequest(`/api/hr/attendance-sources/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Device updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/attendance-sources", organizationId] });
      handleDeviceDialogChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update device", description: error.message, variant: "destructive" });
    },
  });

  const handleAddShift = () => {
    toast({ title: "Coming soon", description: "Shift creation will be available in the next update" });
  };

  const handleDeviceDialogChange = (open: boolean) => {
    if (open) {
      setIsDeviceDialogOpen(true);
    } else {
      setIsDeviceDialogOpen(false);
      setEditingDevice(null);
      deviceForm.reset({
        sourceName: "",
        sourceType: "biometric",
        deviceVendor: "",
        deviceModel: "",
        location: "",
        ipAddress: "",
        isActive: true,
        ...defaultDeviceConfig,
      });
    }
  };

  const handleEditDevice = (device: any) => {
    setEditingDevice(device);
    deviceForm.reset({
      sourceName: device.sourceName,
      sourceType: device.sourceType,
      deviceVendor: device.deviceVendor || "",
      deviceModel: device.deviceModel || "",
      location: device.location || "",
      ipAddress: device.ipAddress || "",
      isActive: device.isActive,
      connectionConfig: device.connectionConfig || defaultDeviceConfig.connectionConfig,
      fieldMapping: device.fieldMapping || defaultDeviceConfig.fieldMapping,
    });
    setIsDeviceDialogOpen(true);
  };

  const onDeviceSubmit = (data: AttendanceDeviceFormValues) => {
    if (editingDevice) {
      updateDeviceMutation.mutate({ id: editingDevice.id, data });
    } else {
      createDeviceMutation.mutate(data);
    }
  };

  const handleAddSalary = () => {
    toast({ title: "Coming soon", description: "Salary structure creation will be available in the next update" });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'biometric': return <Fingerprint className="h-4 w-4" />;
      case 'rfid': return <CreditCard className="h-4 w-4" />;
      case 'mobile_app': return <Smartphone className="h-4 w-4" />;
      case 'web_punch': return <Globe className="h-4 w-4" />;
      case 'third_party_api': return <Wifi className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'half_day':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Half Day</Badge>;
      case 'leave':
        return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-hr-title">HR Dashboard</h1>
          <p className="text-muted-foreground">Manage attendance, shifts, and employee records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Label>From:</Label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-40"
              data-testid="input-date-start"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>To:</Label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-40"
              data-testid="input-date-end"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-present-count">{presentCount}</div>
            <p className="text-xs text-muted-foreground">employees marked present</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-late-count">{lateCount}</div>
            <p className="text-xs text-muted-foreground">employees arrived late</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-absent-count">{absentCount}</div>
            <p className="text-xs text-muted-foreground">employees absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-overtime-hours">{overtimeHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">total overtime hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
          <TabsTrigger value="shifts" data-testid="tab-shifts">Shifts</TabsTrigger>
          <TabsTrigger value="devices" data-testid="tab-devices">Devices</TabsTrigger>
          <TabsTrigger value="salaries" data-testid="tab-salaries">Salary Structures</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Shifts
                </CardTitle>
                <CardDescription>Currently configured shift definitions</CardDescription>
              </CardHeader>
              <CardContent>
                {shiftsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : shifts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No shifts configured</div>
                ) : (
                  <div className="space-y-2">
                    {shifts.slice(0, 5).map((shift: any) => (
                      <div key={shift.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium">{shift.shiftName}</p>
                          <p className="text-sm text-muted-foreground">
                            {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                        <Badge variant={shift.isActive ? "default" : "secondary"}>
                          {shift.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Attendance Sources
                </CardTitle>
                <CardDescription>Connected attendance devices</CardDescription>
              </CardHeader>
              <CardContent>
                {sourcesLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : attendanceSources.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No devices configured</div>
                ) : (
                  <div className="space-y-2">
                    {attendanceSources.slice(0, 5).map((source: any) => (
                      <div key={source.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium">{source.sourceName}</p>
                          <p className="text-sm text-muted-foreground capitalize">{source.sourceType}</p>
                        </div>
                        <Badge variant={source.isActive ? "default" : "secondary"}>
                          {source.isActive ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Employee attendance for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading attendance data...</div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Work Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.attendanceDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{log.personId}</TableCell>
                        <TableCell>{log.checkIn || '-'}</TableCell>
                        <TableCell>{log.checkOut || '-'}</TableCell>
                        <TableCell>{log.totalWorkedMinutes ? `${(log.totalWorkedMinutes / 60).toFixed(1)}h` : '-'}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.overtimeMinutes > 0 && (
                            <Badge variant="outline" className="text-blue-600">
                              +{(log.overtimeMinutes / 60).toFixed(1)}h
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Shift Definitions</CardTitle>
                <CardDescription>Configure work shifts and schedules</CardDescription>
              </div>
              <Button onClick={handleAddShift} data-testid="button-add-shift">
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading shifts...</div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No shifts configured. Add your first shift to get started.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift Name</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Grace Period</TableHead>
                      <TableHead>Break Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift: any) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.shiftName}</TableCell>
                        <TableCell>{shift.startTime}</TableCell>
                        <TableCell>{shift.endTime}</TableCell>
                        <TableCell>{shift.gracePeriodMinutes || 0} min</TableCell>
                        <TableCell>{shift.breakDurationMinutes || 0} min</TableCell>
                        <TableCell>
                          <Badge variant={shift.isActive ? "default" : "secondary"}>
                            {shift.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Attendance Devices</CardTitle>
                <CardDescription>Configure biometric, RFID, and mobile attendance sources</CardDescription>
              </div>
              <Dialog open={isDeviceDialogOpen} onOpenChange={handleDeviceDialogChange}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-device">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Device
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDevice ? "Edit Device" : "Add New Device"}</DialogTitle>
                    <DialogDescription>
                      Configure attendance device connection and field mappings
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...deviceForm}>
                    <form onSubmit={deviceForm.handleSubmit(onDeviceSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={deviceForm.control}
                          name="sourceName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Device Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Main Entrance Biometric" {...field} data-testid="input-device-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deviceForm.control}
                          name="sourceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Device Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-device-type">
                                    <SelectValue placeholder="Select device type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="biometric">Biometric (Fingerprint)</SelectItem>
                                  <SelectItem value="rfid">RFID Card Reader</SelectItem>
                                  <SelectItem value="mobile_app">Mobile App</SelectItem>
                                  <SelectItem value="web_punch">Web Punch</SelectItem>
                                  <SelectItem value="third_party_api">Third-Party API</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={deviceForm.control}
                          name="deviceVendor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., ZKTeco" {...field} data-testid="input-device-vendor" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deviceForm.control}
                          name="deviceModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., K40" {...field} data-testid="input-device-model" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={deviceForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Building A - Main Entrance" {...field} data-testid="input-device-location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deviceForm.control}
                          name="ipAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IP Address</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 192.168.1.100" {...field} data-testid="input-device-ip" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Connection Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={deviceForm.control}
                            name="connectionConfig.apiUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., http://device.local/api" {...field} data-testid="input-api-url" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={deviceForm.control}
                            name="connectionConfig.port"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Port</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 4370" {...field} data-testid="input-port" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={deviceForm.control}
                            name="connectionConfig.username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Device username" {...field} data-testid="input-username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={deviceForm.control}
                            name="connectionConfig.syncIntervalMinutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sync Interval (minutes)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="15" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                                    data-testid="input-sync-interval" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Field Mapping</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={deviceForm.control}
                            name="fieldMapping.employeeIdField"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee ID Field</FormLabel>
                                <FormControl>
                                  <Input placeholder="employee_id" {...field} data-testid="input-employee-field" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={deviceForm.control}
                            name="fieldMapping.timestampField"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timestamp Field</FormLabel>
                                <FormControl>
                                  <Input placeholder="timestamp" {...field} data-testid="input-timestamp-field" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={deviceForm.control}
                            name="fieldMapping.punchTypeField"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Punch Type Field</FormLabel>
                                <FormControl>
                                  <Input placeholder="punch_type" {...field} data-testid="input-punch-field" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={deviceForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>Enable this device for attendance tracking</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-device-active" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleDeviceDialogChange(false)} data-testid="button-cancel-device">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending} data-testid="button-submit-device">
                          {createDeviceMutation.isPending || updateDeviceMutation.isPending ? "Saving..." : editingDevice ? "Update Device" : "Add Device"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading devices...</div>
              ) : attendanceSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No attendance devices configured. Add your first device to start tracking attendance.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceSources.map((source: any) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(source.sourceType)}
                            {source.sourceName}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{source.sourceType?.replace('_', ' ')}</TableCell>
                        <TableCell>{source.location || '-'}</TableCell>
                        <TableCell>{source.ipAddress || '-'}</TableCell>
                        <TableCell>
                          {source.lastSyncAt ? format(new Date(source.lastSyncAt), "MMM dd, HH:mm") : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => handleEditDevice(source)} data-testid={`button-edit-device-${source.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Salary Structures</CardTitle>
                <CardDescription>Define payment types and compensation packages</CardDescription>
              </div>
              <Button onClick={handleAddSalary} data-testid="button-add-salary">
                <Plus className="h-4 w-4 mr-2" />
                Add Structure
              </Button>
            </CardHeader>
            <CardContent>
              {salariesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading salary structures...</div>
              ) : salaryStructures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No salary structures defined.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Structure Name</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Base Amount</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryStructures.map((structure: any) => (
                      <TableRow key={structure.id}>
                        <TableCell className="font-medium">{structure.structureName}</TableCell>
                        <TableCell className="capitalize">{structure.paymentType?.replace('_', ' ')}</TableCell>
                        <TableCell>Rs. {parseFloat(structure.baseAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(structure.effectiveFrom), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={structure.isActive ? "default" : "secondary"}>
                            {structure.isActive ? "Active" : "Inactive"}
                          </Badge>
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
