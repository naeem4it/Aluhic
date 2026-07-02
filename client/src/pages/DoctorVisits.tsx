import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, CheckCircle2, XCircle, Navigation, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import type { Doctor } from "@shared/schema";

interface DoctorVisit {
  id: string;
  userId: string;
  doctorId: string;
  punchInTime: string;
  punchOutTime: string | null;
  punchInLatitude: string | null;
  punchInLongitude: string | null;
  punchOutLatitude: string | null;
  punchOutLongitude: string | null;
  visitNotes: string | null;
  saleAgreement: boolean;
  saleAgreementDetails: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

interface EnrichedVisit {
  visit: DoctorVisit;
  doctor: Doctor;
}

export default function DoctorVisitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [visitNotes, setVisitNotes] = useState("");
  const [saleAgreement, setSaleAgreement] = useState(false);
  const [saleAgreementDetails, setSaleAgreementDetails] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Fetch doctors
  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
    enabled: !!user,
  });

  // Fetch active visit
  const { data: activeVisit, isLoading: isLoadingActive } = useQuery<DoctorVisit | null>({
    queryKey: ["/api/doctor-visits/active"],
    enabled: !!user,
  });

  // Fetch visit history
  const { data: visitHistory = [], isLoading: isLoadingHistory } = useQuery<EnrichedVisit[]>({
    queryKey: ["/api/doctor-visits"],
    enabled: !!user,
  });

  // Get current location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGettingLocation(false);
          toast({
            title: "Location captured",
            description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
          });
        },
        (error) => {
          setGettingLocation(false);
          toast({
            title: "Location error",
            description: error.message,
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGettingLocation(false);
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  // Auto-capture location after active visit query settles (only if no active visit and no location)
  useEffect(() => {
    if (!activeVisit && !isLoadingActive && !location) {
      getCurrentLocation();
    }
  }, [activeVisit, isLoadingActive, location]); // Re-run when active visit query settles

  // Punch In mutation
  const punchInMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoctorId) {
        throw new Error("Please select a doctor");
      }
      return apiRequest("POST", "/api/doctor-visits", {
        doctorId: selectedDoctorId,
        punchInLatitude: location?.latitude?.toString() || null,
        punchInLongitude: location?.longitude?.toString() || null,
        visitNotes: visitNotes || null,
        saleAgreement,
        saleAgreementDetails: saleAgreement ? saleAgreementDetails : null,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-visits/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-visits"] });
      
      // Show location verification result
      if (data._locationVerification) {
        const { withinRadius, distance } = data._locationVerification;
        if (withinRadius) {
          toast({
            title: "Success",
            description: `Punched in successfully. Distance: ${distance}m (verified ✓)`,
          });
        } else {
          toast({
            title: "Punched in with warning",
            description: `Location verification: You are ${distance}m away from doctor's location (expected within 100m)`,
            variant: "destructive",
          });
        }
      } else {
        // No verification data - either missing GPS or location not captured
        const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
        const hasGPS = selectedDoctor?.latitude && selectedDoctor?.longitude;
        const message = !hasGPS
          ? "Punched in successfully (location verification skipped - doctor has no GPS coordinates)"
          : location
          ? "Punched in successfully"
          : "Punched in successfully (location verification skipped - no GPS captured)";
        toast({ title: "Success", description: message });
      }
      
      // Reset form
      setSelectedDoctorId("");
      setVisitNotes("");
      setSaleAgreement(false);
      setSaleAgreementDetails("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to punch in",
        variant: "destructive",
      });
    },
  });

  // Punch Out mutation
  const punchOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeVisit) return;
      // Get current location for punch out
      return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve(
                apiRequest("PATCH", `/api/doctor-visits/${activeVisit.id}/punch-out`, {
                  punchOutLatitude: position.coords.latitude.toString(),
                  punchOutLongitude: position.coords.longitude.toString(),
                })
              );
            },
            () => {
              // Punch out without location if geolocation fails
              resolve(
                apiRequest("PATCH", `/api/doctor-visits/${activeVisit.id}/punch-out`, {
                  punchOutLatitude: null,
                  punchOutLongitude: null,
                })
              );
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          resolve(
            apiRequest("PATCH", `/api/doctor-visits/${activeVisit.id}/punch-out`, {
              punchOutLatitude: null,
              punchOutLongitude: null,
            })
          );
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-visits/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-visits"] });
      toast({ title: "Success", description: "Punched out successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to punch out",
        variant: "destructive",
      });
    },
  });

  const handlePunchIn = () => {
    punchInMutation.mutate();
  };

  const handlePunchOut = () => {
    punchOutMutation.mutate();
  };

  const getActiveVisitDoctor = () => {
    if (!activeVisit) return null;
    return doctors.find((d) => d.id === activeVisit.doctorId);
  };

  const activeDoctor = getActiveVisitDoctor();
  const activeDuration = activeVisit
    ? Math.floor((new Date().getTime() - new Date(activeVisit.punchInTime).getTime()) / 60000)
    : 0;

  if (isLoadingActive) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Doctor Visits
        </h1>
        <p className="text-muted-foreground">Track your doctor visits with punch in/out</p>
      </div>

      {/* Active Visit Card */}
      {activeVisit && activeDoctor && (
        <Card className="border-primary" data-testid="card-active-visit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Active Visit
            </CardTitle>
            <CardDescription>Currently visiting {activeDoctor.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Doctor</Label>
                <p className="font-semibold" data-testid="text-active-doctor">
                  {activeDoctor.name}
                </p>
                {activeDoctor.specialty && (
                  <p className="text-sm text-muted-foreground">{activeDoctor.specialty}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Punch In Time</Label>
                <p className="font-semibold" data-testid="text-punch-in-time">
                  {format(new Date(activeVisit.punchInTime), "MMM dd, yyyy hh:mm a")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-semibold text-primary" data-testid="text-duration">
                  {activeDuration} minutes
                </p>
              </div>
              {activeVisit.punchInLatitude && activeVisit.punchInLongitude && (
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {parseFloat(activeVisit.punchInLatitude).toFixed(6)},{" "}
                    {parseFloat(activeVisit.punchInLongitude).toFixed(6)}
                  </p>
                </div>
              )}
            </div>
            {activeVisit.visitNotes && (
              <div>
                <Label className="text-muted-foreground">Visit Notes</Label>
                <p className="text-sm">{activeVisit.visitNotes}</p>
              </div>
            )}
            {activeVisit.saleAgreement && (
              <div>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Sale Agreement
                </Badge>
                {activeVisit.saleAgreementDetails && (
                  <p className="text-sm mt-1">{activeVisit.saleAgreementDetails}</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePunchOut}
              disabled={punchOutMutation.isPending}
              variant="destructive"
              className="w-full"
              data-testid="button-punch-out"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {punchOutMutation.isPending ? "Punching Out..." : "Punch Out"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Punch In Form */}
      {!activeVisit && (
        <Card data-testid="card-punch-in">
          <CardHeader>
            <CardTitle>Punch In to Doctor Visit</CardTitle>
            <CardDescription>Start a new visit by selecting a doctor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor-select">Select Doctor *</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger id="doctor-select" data-testid="select-doctor">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.specialty && `- ${doctor.specialty}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  data-testid="button-get-location"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  {gettingLocation ? "Getting Location..." : "Capture Location"}
                </Button>
                {location && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Badge>
                )}
              </div>
              {!location && (
                <p className="text-xs text-muted-foreground">
                  Location is recommended for verification (100m radius check)
                </p>
              )}
              {selectedDoctorId && (() => {
                const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
                if (!selectedDoctor?.latitude || !selectedDoctor?.longitude) {
                  return (
                    <Alert variant="destructive">
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        Warning: This doctor has no GPS coordinates on file. Location verification will be
                        skipped. Please update doctor's location in the Doctors page.
                      </AlertDescription>
                    </Alert>
                  );
                }
                if (location) {
                  // Calculate distance client-side for preview
                  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                    const R = 6371000;
                    const φ1 = (lat1 * Math.PI) / 180;
                    const φ2 = (lat2 * Math.PI) / 180;
                    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
                    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return Math.round(R * c);
                  };
                  const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    parseFloat(selectedDoctor.latitude),
                    parseFloat(selectedDoctor.longitude)
                  );
                  const withinRadius = distance <= 100;
                  return (
                    <Alert variant={withinRadius ? "default" : "destructive"}>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        {withinRadius ? (
                          <>Distance: {distance}m (within 100m radius ✓)</>
                        ) : (
                          <>Warning: {distance}m away from doctor's location (expected within 100m)</>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-notes">Visit Notes</Label>
              <Textarea
                id="visit-notes"
                placeholder="Add any notes about this visit..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                data-testid="input-visit-notes"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sale-agreement"
                  checked={saleAgreement}
                  onCheckedChange={(checked) => setSaleAgreement(checked as boolean)}
                  data-testid="checkbox-sale-agreement"
                />
                <Label htmlFor="sale-agreement" className="cursor-pointer">
                  Sale Agreement Reached
                </Label>
              </div>
              {saleAgreement && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="agreement-details">Agreement Details</Label>
                  <Textarea
                    id="agreement-details"
                    placeholder="Describe the sale agreement..."
                    value={saleAgreementDetails}
                    onChange={(e) => setSaleAgreementDetails(e.target.value)}
                    data-testid="input-agreement-details"
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePunchIn}
              disabled={!selectedDoctorId || punchInMutation.isPending}
              className="w-full"
              data-testid="button-punch-in"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {punchInMutation.isPending ? "Punching In..." : "Punch In"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
          <CardDescription>Your recent doctor visits</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : visitHistory.length === 0 ? (
            <Alert>
              <AlertDescription>No visits recorded yet. Punch in to start tracking!</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sale</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitHistory.map((item) => {
                    const visit = item.visit || item;
                    const doctor = item.doctor || doctors.find((d) => d.id === visit.doctorId);
                    return (
                      <TableRow key={visit.id} data-testid={`row-visit-${visit.id}`}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{doctor?.name || "Unknown"}</p>
                            {doctor?.specialty && (
                              <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(new Date(visit.punchInTime), "MMM dd, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(visit.punchInTime), "hh:mm a")}
                          </p>
                        </TableCell>
                        <TableCell>
                          {visit.punchOutTime ? (
                            <>
                              <p className="text-sm">
                                {format(new Date(visit.punchOutTime), "MMM dd, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(visit.punchOutTime), "hh:mm a")}
                              </p>
                            </>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {visit.duration ? `${visit.duration} min` : "-"}
                        </TableCell>
                        <TableCell>
                          {visit.saleAgreement ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {visit.punchOutTime ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <Badge variant="default">In Progress</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
