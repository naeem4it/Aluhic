import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Brain, Calendar, Target, TrendingUp, Activity, Stethoscope, Pill, FlaskConical, Phone, CheckCircle2, AlertTriangle, Clock, MapPin, ArrowRight, Package, BarChart3, Users, MessageSquare, Megaphone, Eye, ShieldAlert, LineChart, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AIInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isDoctor = user?.role === "doctor" || user?.role === "front_desk";
  const isMR = user?.role === "user" || user?.role === "company_admin" || user?.role === "super_admin";
  const isCompanyAdmin = user?.role === "company_admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">AI-Powered Insights</h1>
          <p className="text-muted-foreground">Intelligent recommendations and predictions powered by machine learning</p>
        </div>
      </div>

      <Tabs defaultValue={isDoctor ? "healthcare" : "sales"} className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          {(isDoctor || isCompanyAdmin) && (
            <TabsTrigger value="healthcare" data-testid="tab-healthcare">
              <Stethoscope className="h-4 w-4 mr-2" />
              Healthcare AI
            </TabsTrigger>
          )}
          {isMR && (
            <TabsTrigger value="sales" data-testid="tab-sales">
              <TrendingUp className="h-4 w-4 mr-2" />
              Sales AI
            </TabsTrigger>
          )}
          {isCompanyAdmin && (
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory AI
            </TabsTrigger>
          )}
          {isMR && (
            <TabsTrigger value="marketing" data-testid="tab-marketing">
              <Megaphone className="h-4 w-4 mr-2" />
              Marketing AI
            </TabsTrigger>
          )}
          {isCompanyAdmin && (
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics AI
            </TabsTrigger>
          )}
        </TabsList>

        {(isDoctor || isCompanyAdmin) && (
          <TabsContent value="healthcare" className="space-y-6">
            <HealthcareAISection />
          </TabsContent>
        )}

        {isMR && (
          <TabsContent value="sales" className="space-y-6">
            <SalesAISection />
          </TabsContent>
        )}

        {isCompanyAdmin && (
          <TabsContent value="inventory" className="space-y-6">
            <InventoryAISection />
          </TabsContent>
        )}

        {isMR && (
          <TabsContent value="marketing" className="space-y-6">
            <MarketingAISection />
          </TabsContent>
        )}

        {isCompanyAdmin && (
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsAISection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function HealthcareAISection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TeleconsultTriageCard />
      <PatientRiskCard />
      <LabSuggestionsCard />
      <PrescriptionValidationCard />
      <AppointmentOptimizationCard />
    </div>
  );
}

function SalesAISection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CallPlanningCard />
      <PerformanceInsightsCard />
      <TargetAlertsCard />
      <SalesForecastCard />
      <SampleConversionCard />
    </div>
  );
}

function InventoryAISection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DemandForecastCard />
      <ExpiryPredictionCard />
      <ReorderSuggestionsCard />
    </div>
  );
}

function MarketingAISection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DoctorEngagementCard />
      <MarketSegmentationCard />
      <CampaignPredictionCard />
      <CompetitiveInsightsCard />
    </div>
  );
}

function AnalyticsAISection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AutomatedInsightsCard />
      <AnomalyDetectionCard />
      <PredictiveKPIsCard />
      <NaturalLanguageQueryCard />
    </div>
  );
}

function TeleconsultTriageCard() {
  const [complaint, setComplaint] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const { toast } = useToast();

  const { data: facilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const triageMutation = useMutation({
    mutationFn: async (data: { complaint: string; facilityId: string }) => {
      const res = await apiRequest("POST", "/api/ai/teleconsult/triage", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Triage Complete",
        description: `Urgency: ${data.urgencyLevel}, Specialty: ${data.suggestedSpecialty}`,
      });
    },
  });

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-blue-500" />
          Teleconsult Triage
        </CardTitle>
        <CardDescription>AI-powered patient complaint categorization and urgency assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={facilityId} onValueChange={setFacilityId}>
          <SelectTrigger data-testid="select-facility-triage">
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities?.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Enter patient complaint..."
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          className="min-h-[100px]"
          data-testid="input-complaint"
        />
        {triageMutation.data && (
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={triageMutation.data.urgencyLevel === "emergency" ? "destructive" : 
                triageMutation.data.urgencyLevel === "high" ? "destructive" : "secondary"}>
                {triageMutation.data.urgencyLevel?.toUpperCase()}
              </Badge>
              <span className="font-medium">{triageMutation.data.category}</span>
            </div>
            <p className="text-sm"><strong>Specialty:</strong> {triageMutation.data.suggestedSpecialty}</p>
            <p className="text-sm"><strong>Action:</strong> {triageMutation.data.suggestedAction}</p>
            {triageMutation.data.redFlags?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {triageMutation.data.redFlags.map((flag: string, i: number) => (
                  <Badge key={i} variant="destructive">{flag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => triageMutation.mutate({ complaint, facilityId })}
          disabled={!complaint || !facilityId || triageMutation.isPending}
          className="w-full"
          data-testid="button-triage"
        >
          {triageMutation.isPending ? "Analyzing..." : "Analyze Complaint"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PatientRiskCard() {
  const [patientId, setPatientId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const { toast } = useToast();

  const { data: facilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const riskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/ai/patients/${patientId}/risk?facilityId=${facilityId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Risk Score Calculated",
        description: `Risk Level: ${data.riskLevel} (${(data.riskScore * 100).toFixed(0)}%)`,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          Patient Risk Scoring
        </CardTitle>
        <CardDescription>Predictive analytics for chronic patient deterioration risk</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={facilityId} onValueChange={setFacilityId}>
          <SelectTrigger data-testid="select-facility-risk">
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities?.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Enter Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          data-testid="input-patient-id"
        />
        {riskMutation.data && (
          <div className="p-4 rounded-lg bg-muted space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {(riskMutation.data.riskScore * 100).toFixed(0)}%
              </span>
              <Badge variant={riskMutation.data.riskLevel === "high" ? "destructive" : 
                riskMutation.data.riskLevel === "medium" ? "secondary" : "default"}>
                {riskMutation.data.riskLevel?.toUpperCase()} RISK
              </Badge>
            </div>
            {riskMutation.data.recommendations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  {riskMutation.data.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => riskMutation.mutate()}
          disabled={!patientId || !facilityId || riskMutation.isPending}
          className="w-full"
          data-testid="button-calculate-risk"
        >
          {riskMutation.isPending ? "Calculating..." : "Calculate Risk Score"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function LabSuggestionsCard() {
  const [patientId, setPatientId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const { toast } = useToast();

  const labMutation = useMutation({
    mutationFn: async () => {
      const symptomList = symptoms.split(",").map(s => s.trim()).filter(Boolean);
      const res = await apiRequest("POST", "/api/ai/labs/suggestions", { patientId, symptoms: symptomList });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Lab Suggestions Ready",
        description: `${data.suggestedTests?.length || 0} tests recommended`,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-purple-500" />
          Lab & Imaging Suggestions
        </CardTitle>
        <CardDescription>ML-powered test recommendations based on symptoms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          data-testid="input-patient-lab"
        />
        <Textarea
          placeholder="Enter symptoms (comma-separated): fever, cough, headache..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          data-testid="input-symptoms"
        />
        {labMutation.data && (
          <div className="p-4 rounded-lg bg-muted space-y-3">
            <div className="flex items-center gap-2">
              <Badge>{labMutation.data.diagnosticPattern}</Badge>
              <span className="text-sm text-muted-foreground">
                Confidence: {(labMutation.data.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="space-y-2">
              {labMutation.data.suggestedTests?.map((test: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{test.testName}</span>
                  <Badge variant={test.priority === "high" ? "destructive" : "secondary"}>
                    {test.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => labMutation.mutate()}
          disabled={!patientId || !symptoms || labMutation.isPending}
          className="w-full"
          data-testid="button-suggest-labs"
        >
          {labMutation.isPending ? "Analyzing..." : "Get Suggestions"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PrescriptionValidationCard() {
  const [prescriptionId, setPrescriptionId] = useState("");
  const [patientId, setPatientId] = useState("");
  const { toast } = useToast();

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/prescriptions/validate", { prescriptionId, patientId });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Validation Complete",
        description: `Status: ${data.validationStatus}`,
        variant: data.overallRiskLevel === "high" ? "destructive" : "default",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-green-500" />
          Prescription Validation
        </CardTitle>
        <CardDescription>Drug interaction and dosage error detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Prescription ID"
          value={prescriptionId}
          onChange={(e) => setPrescriptionId(e.target.value)}
          data-testid="input-prescription-id"
        />
        <Input
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          data-testid="input-patient-prescription"
        />
        {validateMutation.data && (
          <div className="p-4 rounded-lg bg-muted space-y-3">
            <div className="flex items-center gap-2">
              {validateMutation.data.validationStatus === "valid" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">{validateMutation.data.validationStatus?.toUpperCase()}</span>
              <Badge variant={validateMutation.data.overallRiskLevel === "high" ? "destructive" : "secondary"}>
                {validateMutation.data.overallRiskLevel} risk
              </Badge>
            </div>
            {validateMutation.data.drugInteractions?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-500">Drug Interactions:</p>
                {validateMutation.data.drugInteractions.map((int: any, i: number) => (
                  <p key={i} className="text-sm">{int.drug1} + {int.drug2}: {int.severity}</p>
                ))}
              </div>
            )}
            {validateMutation.data.dosageWarnings?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-500">Dosage Warnings:</p>
                {validateMutation.data.dosageWarnings.map((warn: any, i: number) => (
                  <p key={i} className="text-sm">{warn.drug}: {warn.issue}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => validateMutation.mutate()}
          disabled={!prescriptionId || !patientId || validateMutation.isPending}
          className="w-full"
          data-testid="button-validate-prescription"
        >
          {validateMutation.isPending ? "Validating..." : "Validate Prescription"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AppointmentOptimizationCard() {
  const [facilityId, setFacilityId] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const { toast } = useToast();

  const { data: facilities } = useQuery<any[]>({
    queryKey: ["/api/healthcare/facilities"],
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/ai/appointments/suggestions?facilityId=${facilityId}&urgency=${urgency}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Suggestions Ready",
        description: `${data.suggestions?.length || 0} optimal slots found`,
      });
    },
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          Appointment Optimization
        </CardTitle>
        <CardDescription>ML-based scheduling suggestions for optimal patient flow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Select value={facilityId} onValueChange={setFacilityId}>
            <SelectTrigger className="w-[200px]" data-testid="select-facility-appt">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {facilities?.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="w-[150px]" data-testid="select-urgency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => optimizeMutation.mutate()}
            disabled={!facilityId || optimizeMutation.isPending}
            data-testid="button-get-slots"
          >
            {optimizeMutation.isPending ? "Finding..." : "Find Optimal Slots"}
          </Button>
        </div>
        {optimizeMutation.data?.suggestions && (
          <div className="grid gap-3 md:grid-cols-3">
            {optimizeMutation.data.suggestions.map((slot: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-muted flex items-center justify-between">
                <div>
                  <p className="font-medium">{format(new Date(slot.date), "MMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground">{slot.timeSlot}</p>
                </div>
                <Badge>{(slot.confidence * 100).toFixed(0)}%</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CallPlanningCard() {
  const [territory, setTerritory] = useState("");
  const { toast } = useToast();

  const planMutation = useMutation({
    mutationFn: async () => {
      const params = territory ? `?territory=${territory}` : "";
      const res = await apiRequest("GET", `/api/ai/mr/call-plan${params}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Call Plan Generated",
        description: `${data.suggestedDoctors?.length || 0} doctors to visit`,
      });
    },
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          Predictive Call Planning
        </CardTitle>
        <CardDescription>AI-optimized doctor visit routes and priorities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Territory (optional)"
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className="max-w-[200px]"
            data-testid="input-territory"
          />
          <Button 
            onClick={() => planMutation.mutate()}
            disabled={planMutation.isPending}
            data-testid="button-generate-plan"
          >
            {planMutation.isPending ? "Generating..." : "Generate Call Plan"}
          </Button>
        </div>
        {planMutation.data && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <span><strong>Est. Time:</strong> {planMutation.data.totalEstimatedTime || "N/A"}</span>
              <span><strong>Distance:</strong> {planMutation.data.totalTravelDistance || "N/A"}</span>
              <span><strong>Expected Conversions:</strong> {planMutation.data.expectedConversions || 0}</span>
            </div>
            <div className="space-y-2">
              {planMutation.data.suggestedDoctors?.map((doc: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{doc.name || doc.doctorId}</p>
                    <p className="text-sm text-muted-foreground">{doc.reason}</p>
                  </div>
                  <Badge variant={doc.priority === "high" ? "destructive" : "secondary"}>
                    {doc.priority}
                  </Badge>
                  {i < (planMutation.data.suggestedDoctors?.length - 1) && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceInsightsCard() {
  const { toast } = useToast();

  const insightsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/ai/mr/performance-insights");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Insights Generated" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-cyan-500" />
          Performance Insights
        </CardTitle>
        <CardDescription>AI-powered analysis of your sales performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insightsMutation.data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{insightsMutation.data.overallScore?.toFixed(0)}%</span>
              <Badge variant={insightsMutation.data.performanceTrend === "improving" ? "default" : "secondary"}>
                {insightsMutation.data.performanceTrend}
              </Badge>
            </div>
            {insightsMutation.data.strengths?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-500 mb-1">Strengths</p>
                <ul className="text-sm list-disc pl-4">
                  {insightsMutation.data.strengths.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {insightsMutation.data.improvements?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-500 mb-1">Areas to Improve</p>
                <ul className="text-sm list-disc pl-4">
                  {insightsMutation.data.improvements.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {insightsMutation.data.recommendations?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-500 mb-1">Recommendations</p>
                <ul className="text-sm list-disc pl-4">
                  {insightsMutation.data.recommendations.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Click below to generate AI insights about your performance</p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => insightsMutation.mutate()}
          disabled={insightsMutation.isPending}
          className="w-full"
          data-testid="button-get-insights"
        >
          {insightsMutation.isPending ? "Analyzing..." : "Generate Insights"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function TargetAlertsCard() {
  const { toast } = useToast();

  const alertsQuery = useQuery<any[]>({
    queryKey: ["/api/ai/mr/achievement-alerts/active"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest("POST", `/api/ai/mr/achievement-alerts/${alertId}/acknowledge`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Alert Acknowledged" });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/mr/achievement-alerts/active"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-red-500" />
          Target Achievement Alerts
        </CardTitle>
        <CardDescription>Real-time alerts for target tracking and anomalies</CardDescription>
      </CardHeader>
      <CardContent>
        {alertsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : alertsQuery.data?.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No active alerts - you're on track!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertsQuery.data?.map((alert: any) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  alert.severity === "critical" ? "text-red-500" : 
                  alert.severity === "warning" ? "text-yellow-500" : "text-blue-500"
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.details}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => acknowledgeMutation.mutate(alert.id)}
                  data-testid={`button-ack-${alert.id}`}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SalesForecastCard() {
  const [period, setPeriod] = useState("monthly");
  const { toast } = useToast();

  const forecastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/ai/sales/forecast?period=${period}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Forecast Generated",
        description: `Predicted sales: Rs. ${data.predictedSales?.toLocaleString()}`,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Sales Forecasting
        </CardTitle>
        <CardDescription>Time-series predictions for future sales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger data-testid="select-forecast-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
        {forecastMutation.data && (
          <div className="p-4 rounded-lg bg-muted space-y-3">
            <div className="text-center">
              <p className="text-3xl font-bold">Rs. {forecastMutation.data.predictedSales?.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                {forecastMutation.data.forecastPeriod} forecast
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span>Confidence: {(forecastMutation.data.confidenceScore * 100).toFixed(0)}%</span>
              <span>Qty: {forecastMutation.data.predictedQuantity}</span>
            </div>
            {forecastMutation.data.confidenceInterval && (
              <p className="text-xs text-center text-muted-foreground">
                Range: Rs. {forecastMutation.data.confidenceInterval.lower?.toLocaleString()} - 
                Rs. {forecastMutation.data.confidenceInterval.upper?.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => forecastMutation.mutate()}
          disabled={forecastMutation.isPending}
          className="w-full"
          data-testid="button-forecast"
        >
          {forecastMutation.isPending ? "Calculating..." : "Generate Forecast"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SampleConversionCard() {
  const [doctorId, setDoctorId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const { toast } = useToast();

  const { data: doctors } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const predictionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/samples/conversion", { 
        doctorId, 
        productId, 
        sampleQuantity: parseInt(quantity) 
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Prediction Ready",
        description: `Expected conversion: ${(data.conversionProbability * 100).toFixed(0)}%`,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-pink-500" />
          Sample Conversion Prediction
        </CardTitle>
        <CardDescription>Predict prescription conversion from sample distribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger data-testid="select-doctor-sample">
            <SelectValue placeholder="Select doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors?.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger data-testid="select-product-sample">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products?.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Sample quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          data-testid="input-sample-quantity"
        />
        {predictionMutation.data && (
          <div className="p-4 rounded-lg bg-muted space-y-2 text-center">
            <p className="text-3xl font-bold text-primary">
              {(predictionMutation.data.conversionProbability * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">Expected Conversion Rate</p>
            <div className="flex justify-between text-sm mt-2">
              <span>Est. Prescriptions: {predictionMutation.data.expectedPrescriptions}</span>
              <span>Est. Revenue: Rs. {predictionMutation.data.expectedRevenue?.toLocaleString()}</span>
            </div>
            {predictionMutation.data.recommendation && (
              <p className="text-sm text-blue-500 mt-2">{predictionMutation.data.recommendation}</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => predictionMutation.mutate()}
          disabled={!doctorId || !productId || !quantity || predictionMutation.isPending}
          className="w-full"
          data-testid="button-predict-conversion"
        >
          {predictionMutation.isPending ? "Predicting..." : "Predict Conversion"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ==========================================
// Inventory AI Cards
// ==========================================

function DemandForecastCard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("monthly");

  const forecastQuery = useQuery<any>({
    queryKey: ["/api/ai/inventory/demand-forecast", period],
    enabled: false,
  });

  const fetchForecast = async () => {
    try {
      const res = await fetch(`/api/ai/inventory/demand-forecast?period=${period}`, {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Forecast Generated",
        description: `Predicted demand for ${data.length || 0} products`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate forecast",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-blue-500" />
          Demand Forecasting
        </CardTitle>
        <CardDescription>Predict future product demand based on historical patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger data-testid="select-forecast-period">
            <SelectValue placeholder="Forecast period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Uses historical sales data, seasonality patterns, and market trends to predict future demand.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={fetchForecast} className="w-full" data-testid="button-demand-forecast">
          Generate Demand Forecast
        </Button>
      </CardFooter>
    </Card>
  );
}

function ExpiryPredictionCard() {
  const { toast } = useToast();

  const fetchPredictions = async () => {
    try {
      const res = await fetch("/api/ai/inventory/expiry-prediction", {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Predictions Ready",
        description: `Found ${data.length || 0} items at risk`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to predict expiry",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Expiry & Waste Prediction
        </CardTitle>
        <CardDescription>Identify products at risk of expiry before wastage occurs</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Analyzes stock levels, usage rates, and expiry dates to predict wastage risk and suggest redistribution.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={fetchPredictions} className="w-full" data-testid="button-expiry-prediction">
          Check Expiry Risks
        </Button>
      </CardFooter>
    </Card>
  );
}

function ReorderSuggestionsCard() {
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/ai/inventory/reorder-suggestions", {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Suggestions Ready",
        description: `${data.length || 0} reorder suggestions generated`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-500" />
          Smart Reorder Suggestions
        </CardTitle>
        <CardDescription>Optimal reorder timing and quantities based on usage patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Calculates optimal order quantities considering lead time, safety stock, and bulk discounts.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={fetchSuggestions} className="w-full" data-testid="button-reorder-suggestions">
          Get Reorder Suggestions
        </Button>
      </CardFooter>
    </Card>
  );
}

// ==========================================
// Marketing AI Cards
// ==========================================

function DoctorEngagementCard() {
  const [doctorId, setDoctorId] = useState("");
  const { toast } = useToast();

  const { data: doctors } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const fetchEngagement = async () => {
    if (!doctorId) return;
    try {
      const res = await fetch(`/api/ai/marketing/doctor-engagement?doctorId=${doctorId}`, {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Engagement Analysis",
        description: `Score: ${(data.engagementScore * 100).toFixed(0)}% - ${data.engagementLevel}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze engagement",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Doctor Engagement Analysis
        </CardTitle>
        <CardDescription>Analyze and score doctor engagement levels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger data-testid="select-doctor-engagement">
            <SelectValue placeholder="Select doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors?.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter>
        <Button onClick={fetchEngagement} disabled={!doctorId} className="w-full" data-testid="button-doctor-engagement">
          Analyze Engagement
        </Button>
      </CardFooter>
    </Card>
  );
}

function MarketSegmentationCard() {
  const [segmentType, setSegmentType] = useState("doctor");
  const { toast } = useToast();

  const fetchSegments = async () => {
    try {
      const res = await fetch(`/api/ai/marketing/segmentation?segmentType=${segmentType}`, {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Segmentation Complete",
        description: `Generated ${data.length || 0} market segments`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate segments",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Market Segmentation
        </CardTitle>
        <CardDescription>AI-driven clustering of doctors and territories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={segmentType} onValueChange={setSegmentType}>
          <SelectTrigger data-testid="select-segment-type">
            <SelectValue placeholder="Segment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="doctor">By Doctor</SelectItem>
            <SelectItem value="territory">By Territory</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter>
        <Button onClick={fetchSegments} className="w-full" data-testid="button-segmentation">
          Generate Segments
        </Button>
      </CardFooter>
    </Card>
  );
}

function CampaignPredictionCard() {
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("product_launch");
  const [budget, setBudget] = useState("50000");
  const { toast } = useToast();

  const predictCampaign = async () => {
    try {
      const res = await apiRequest("POST", "/api/ai/marketing/campaign-prediction", {
        campaignName: campaignName || "New Campaign",
        campaignType,
        budget: parseInt(budget),
        productIds: [],
      });
      const data = await res.json();
      toast({
        title: "Prediction Ready",
        description: `Predicted ROI: ${(data.predictedROI * 100).toFixed(0)}%`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to predict campaign",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-pink-500" />
          Campaign Effectiveness Prediction
        </CardTitle>
        <CardDescription>Predict ROI and reach before launching campaigns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Campaign name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          data-testid="input-campaign-name"
        />
        <Select value={campaignType} onValueChange={setCampaignType}>
          <SelectTrigger data-testid="select-campaign-type">
            <SelectValue placeholder="Campaign type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product_launch">Product Launch</SelectItem>
            <SelectItem value="awareness">Brand Awareness</SelectItem>
            <SelectItem value="promotion">Promotion</SelectItem>
            <SelectItem value="education">Medical Education</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Budget (Rs.)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          data-testid="input-campaign-budget"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={predictCampaign} className="w-full" data-testid="button-campaign-prediction">
          Predict Campaign ROI
        </Button>
      </CardFooter>
    </Card>
  );
}

function CompetitiveInsightsCard() {
  const [sourceText, setSourceText] = useState("");
  const { toast } = useToast();

  const analyzeInsights = async () => {
    if (!sourceText) return;
    try {
      const res = await apiRequest("POST", "/api/ai/marketing/competitive-insights", {
        sourceType: "dcr",
        sourceText,
      });
      const data = await res.json();
      toast({
        title: "Analysis Complete",
        description: `Found ${data.length || 0} competitive insights`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze insights",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-red-500" />
          Competitive Intelligence
        </CardTitle>
        <CardDescription>Extract competitor insights from DCR notes and market data</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Paste DCR notes or market feedback..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="min-h-[100px]"
          data-testid="textarea-competitive-source"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={analyzeInsights} disabled={!sourceText} className="w-full" data-testid="button-competitive-insights">
          Analyze for Insights
        </Button>
      </CardFooter>
    </Card>
  );
}

// ==========================================
// Analytics AI Cards
// ==========================================

function AutomatedInsightsCard() {
  const { toast } = useToast();

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/ai/analytics/insights", {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Insights Generated",
        description: `Found ${data.length || 0} actionable insights`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-500" />
          Automated Insights
        </CardTitle>
        <CardDescription>AI-generated business insights from your data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Automatically discovers trends, opportunities, and issues across sales, visits, and product performance.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={fetchInsights} className="w-full" data-testid="button-automated-insights">
          Generate Insights
        </Button>
      </CardFooter>
    </Card>
  );
}

function AnomalyDetectionCard() {
  const [dataType, setDataType] = useState("all");
  const { toast } = useToast();

  const detectAnomalies = async () => {
    try {
      const res = await fetch(`/api/ai/analytics/anomalies?dataType=${dataType}`, {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "Detection Complete",
        description: `Found ${data.length || 0} anomalies`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to detect anomalies",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          Anomaly Detection
        </CardTitle>
        <CardDescription>Detect unusual patterns in samples, expenses, and visits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={dataType} onValueChange={setDataType}>
          <SelectTrigger data-testid="select-anomaly-type">
            <SelectValue placeholder="Data type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sample_issuance">Sample Issuance</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="visit_frequency">Visit Frequency</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter>
        <Button onClick={detectAnomalies} className="w-full" data-testid="button-anomaly-detection">
          Detect Anomalies
        </Button>
      </CardFooter>
    </Card>
  );
}

function PredictiveKPIsCard() {
  const [kpiType, setKpiType] = useState("revenue");
  const [period, setPeriod] = useState("monthly");
  const { toast } = useToast();

  const predictKPIs = async () => {
    try {
      const res = await fetch(`/api/ai/analytics/predictive-kpis?kpiType=${kpiType}&period=${period}`, {
        credentials: "include",
      });
      const data = await res.json();
      toast({
        title: "KPI Forecast Ready",
        description: `Predicted ${kpiType}: Rs. ${Number(data.predictedValue).toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to predict KPIs",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-500" />
          Predictive KPIs
        </CardTitle>
        <CardDescription>Forecast key performance indicators with confidence intervals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={kpiType} onValueChange={setKpiType}>
          <SelectTrigger data-testid="select-kpi-type">
            <SelectValue placeholder="KPI type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="visits">Doctor Visits</SelectItem>
            <SelectItem value="conversions">Conversions</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger data-testid="select-kpi-period">
            <SelectValue placeholder="Forecast period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter>
        <Button onClick={predictKPIs} className="w-full" data-testid="button-predictive-kpis">
          Generate KPI Forecast
        </Button>
      </CardFooter>
    </Card>
  );
}

function NaturalLanguageQueryCard() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const processQuery = async () => {
    if (!query) return;
    try {
      const res = await apiRequest("POST", "/api/ai/analytics/nl-query", { query });
      const data = await res.json();
      setResult(data);
      toast({
        title: "Query Processed",
        description: "Results are ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process query",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-cyan-500" />
          Natural Language Query
        </CardTitle>
        <CardDescription>Ask questions about your data in plain English</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., What were my top selling products last month?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            data-testid="input-nl-query"
          />
          <Button onClick={processQuery} disabled={!query} data-testid="button-nl-query">
            Ask
          </Button>
        </div>
        {result && (
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <p className="font-medium">{result.interpretation}</p>
            <p className="text-sm">{result.answer}</p>
            {result.relatedQuestions && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Related questions:</p>
                <div className="flex flex-wrap gap-2">
                  {result.relatedQuestions.slice(0, 3).map((q: string, i: number) => (
                    <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setQuery(q)}>
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
