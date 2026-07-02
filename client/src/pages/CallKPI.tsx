import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, FileText, Presentation, Clock, Target, Users } from "lucide-react";
import type { CallKPI } from "@shared/schema";

export default function CallKPIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch today's KPI
  const { data: todayKPI, isLoading } = useQuery<CallKPI>({
    queryKey: ["/api/kpis/today"],
    enabled: !!user,
  });

  // Fetch MTD KPI
  const { data: mtdKPI, isLoading: isLoadingMTD } = useQuery<CallKPI & { daysInMonth?: number }>({
    queryKey: ["/api/kpis/mtd"],
    enabled: !!user,
  });

  // Update KPI mutation
  const updateKPI = useMutation({
    mutationFn: async (data: Partial<CallKPI>) => {
      if (todayKPI?.id) {
        return apiRequest("PATCH", `/api/kpis/${todayKPI.id}`, data);
      } else {
        return apiRequest("POST", "/api/kpis", {
          ...data,
          date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpis/today"] });
      toast({
        title: "Success",
        description: "KPI updated successfully",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update KPI",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState({
    totalCallsDone: 0,
    totalPlannedCalls: 0,
    plannedCallsDone: 0,
    unplannedCallsDone: 0,
    totalEDAsViewed: 0,
    totalSlidesViewed: 0,
    avgTimePerCall: 0,
    avgTimePerEDA: 0,
    avgTimePerSlide: 0,
    targetDoctors: 0,
    plannedDoctors: 0,
    coveredDoctors: 0,
  });

  // Sync formData when todayKPI loads
  useEffect(() => {
    if (todayKPI) {
      setFormData({
        totalCallsDone: todayKPI.totalCallsDone || 0,
        totalPlannedCalls: todayKPI.totalPlannedCalls || 0,
        plannedCallsDone: todayKPI.plannedCallsDone || 0,
        unplannedCallsDone: todayKPI.unplannedCallsDone || 0,
        totalEDAsViewed: todayKPI.totalEDAsViewed || 0,
        totalSlidesViewed: todayKPI.totalSlidesViewed || 0,
        avgTimePerCall: todayKPI.avgTimePerCall || 0,
        avgTimePerEDA: todayKPI.avgTimePerEDA || 0,
        avgTimePerSlide: todayKPI.avgTimePerSlide || 0,
        targetDoctors: todayKPI.targetDoctors || 0,
        plannedDoctors: todayKPI.plannedDoctors || 0,
        coveredDoctors: todayKPI.coveredDoctors || 0,
      });
    }
  }, [todayKPI]);

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateKPI.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const coverage = formData.targetDoctors > 0 
    ? Math.round((formData.coveredDoctors / formData.targetDoctors) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Call KPI Tracking
          </h1>
          <p className="text-muted-foreground">
            Track daily call performance and productivity
          </p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
          data-testid="button-toggle-edit"
        >
          {isEditing ? "Cancel" : "Update KPI"}
        </Button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalCallsDone">Total Calls Done</Label>
                <Input
                  id="totalCallsDone"
                  type="number"
                  value={formData.totalCallsDone}
                  onChange={(e) => setFormData({ ...formData, totalCallsDone: parseInt(e.target.value) || 0 })}
                  data-testid="input-total-calls"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPlannedCalls">Total Planned Calls</Label>
                <Input
                  id="totalPlannedCalls"
                  type="number"
                  value={formData.totalPlannedCalls}
                  onChange={(e) => setFormData({ ...formData, totalPlannedCalls: parseInt(e.target.value) || 0 })}
                  data-testid="input-planned-calls"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedCallsDone">Planned Calls Done</Label>
                <Input
                  id="plannedCallsDone"
                  type="number"
                  value={formData.plannedCallsDone}
                  onChange={(e) => setFormData({ ...formData, plannedCallsDone: parseInt(e.target.value) || 0 })}
                  data-testid="input-planned-done"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unplannedCallsDone">Unplanned Calls Done</Label>
                <Input
                  id="unplannedCallsDone"
                  type="number"
                  value={formData.unplannedCallsDone}
                  onChange={(e) => setFormData({ ...formData, unplannedCallsDone: parseInt(e.target.value) || 0 })}
                  data-testid="input-unplanned-done"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="totalEDAsViewed">EDAs Viewed</Label>
                <Input
                  id="totalEDAsViewed"
                  type="number"
                  value={formData.totalEDAsViewed}
                  onChange={(e) => setFormData({ ...formData, totalEDAsViewed: parseInt(e.target.value) || 0 })}
                  data-testid="input-edas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSlidesViewed">Slides Viewed</Label>
                <Input
                  id="totalSlidesViewed"
                  type="number"
                  value={formData.totalSlidesViewed}
                  onChange={(e) => setFormData({ ...formData, totalSlidesViewed: parseInt(e.target.value) || 0 })}
                  data-testid="input-slides"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgTimePerCall">Avg Time Per Call (seconds)</Label>
                <Input
                  id="avgTimePerCall"
                  type="number"
                  value={formData.avgTimePerCall}
                  onChange={(e) => setFormData({ ...formData, avgTimePerCall: parseInt(e.target.value) || 0 })}
                  data-testid="input-avg-call-time"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doctor Coverage</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="targetDoctors">Target Doctors</Label>
                <Input
                  id="targetDoctors"
                  type="number"
                  value={formData.targetDoctors}
                  onChange={(e) => setFormData({ ...formData, targetDoctors: parseInt(e.target.value) || 0 })}
                  data-testid="input-target-doctors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedDoctors">Planned Doctors</Label>
                <Input
                  id="plannedDoctors"
                  type="number"
                  value={formData.plannedDoctors}
                  onChange={(e) => setFormData({ ...formData, plannedDoctors: parseInt(e.target.value) || 0 })}
                  data-testid="input-planned-doctors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coveredDoctors">Covered Doctors</Label>
                <Input
                  id="coveredDoctors"
                  type="number"
                  value={formData.coveredDoctors}
                  onChange={(e) => setFormData({ ...formData, coveredDoctors: parseInt(e.target.value) || 0 })}
                  data-testid="input-covered-doctors"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateKPI.isPending} data-testid="button-save-kpi">
            {updateKPI.isPending ? "Saving..." : "Save KPI"}
          </Button>
        </form>
      ) : (
        <>
          {/* Month-to-Date Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Month-to-Date Performance</span>
                <Badge variant="outline">{mtdKPI?.daysInMonth || 0} days</Badge>
              </CardTitle>
              <CardDescription>Cumulative metrics for the current month</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMTD ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : mtdKPI ? (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                    <p className="text-2xl font-bold text-primary">{mtdKPI.totalCallsDone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Planned Calls</p>
                    <p className="text-2xl font-bold text-primary">{mtdKPI.plannedCallsDone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EDAs Viewed</p>
                    <p className="text-2xl font-bold text-primary">{mtdKPI.totalEDAsViewed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Slides Viewed</p>
                    <p className="text-2xl font-bold text-primary">{mtdKPI.totalSlidesViewed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Time/Call</p>
                    <p className="text-2xl font-bold text-primary">{formatTime(mtdKPI.avgTimePerCall || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Doctors Covered</p>
                    <p className="text-2xl font-bold text-primary">{mtdKPI.coveredDoctors}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target Coverage</p>
                    <p className="text-2xl font-bold text-primary">
                      {(mtdKPI.targetDoctors || 0) > 0 
                        ? Math.round(((mtdKPI.coveredDoctors || 0) / (mtdKPI.targetDoctors || 1)) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unplanned Calls</p>
                    <p className="text-2xl font-bold text-primary">{mtdKPI.unplannedCallsDone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No MTD data available</p>
              )}
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Today's Performance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Call Metrics */}
          <Card data-testid="card-total-calls">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls Done</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.totalCallsDone}</div>
              <p className="text-xs text-muted-foreground">
                {formData.plannedCallsDone} planned, {formData.unplannedCallsDone} unplanned
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-planned-calls">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned Calls</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.totalPlannedCalls}</div>
              <p className="text-xs text-muted-foreground">
                {formData.plannedCallsDone} completed
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-edas">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">EDAs Viewed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.totalEDAsViewed}</div>
              <p className="text-xs text-muted-foreground">
                Electronic Detail Aids
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-slides">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Slides Viewed</CardTitle>
              <Presentation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.totalSlidesViewed}</div>
              <p className="text-xs text-muted-foreground">
                Presentation slides
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-time">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time Per Call</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(formData.avgTimePerCall)}</div>
              <p className="text-xs text-muted-foreground">
                mm:ss format
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-coverage">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doctor Coverage</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coverage}%</div>
              <p className="text-xs text-muted-foreground">
                {formData.coveredDoctors} of {formData.targetDoctors} doctors
              </p>
            </CardContent>
          </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
