import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ClipboardList, Stethoscope, Pill, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

const STAGE_ORDER = ["registered", "vitals_done", "in_consultation", "tests_ordered", "prescription_given", "payment_pending", "completed"];

const STAGE_ICONS: Record<string, any> = {
  registered: ClipboardList,
  vitals_done: Activity,
  in_consultation: Stethoscope,
  tests_ordered: Activity,
  prescription_given: Pill,
  payment_pending: CreditCard,
  completed: CheckCircle2,
};

const STAGE_LABELS: Record<string, string> = {
  registered: "Front Desk",
  vitals_done: "Triage",
  in_consultation: "Doctor",
  tests_ordered: "Lab",
  prescription_given: "Pharmacy",
  payment_pending: "Billing",
  completed: "Discharged",
};

export function PatientJourneyTracker({ facilityId, currentStage }: { facilityId?: string, currentStage?: string }) {
  // Use React Query polling to simulate real-time updates without WebSockets
  const { data: queueEntries = [], isLoading } = useQuery<any[]>({
    queryKey: facilityId ? ["/api/healthcare/queue", facilityId] : ["disabled"],
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
    enabled: !!facilityId,
  });

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded-md" />;
  }

  // Filter entries if we only want to see patients currently at our specific stage
  const relevantEntries = currentStage 
    ? queueEntries.filter((q: any) => q.status === currentStage) 
    : queueEntries;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Active Patient Flow</span>
          <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500">Live</Badge>
        </CardTitle>
        <CardDescription>Real-time queue tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {relevantEntries.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No patients currently in queue.
          </div>
        ) : (
          <div className="space-y-4">
            {relevantEntries.map((entry: any) => {
              const currentStepIndex = STAGE_ORDER.indexOf(entry.status);
              return (
                <div key={entry.id} className="flex items-center space-x-2 text-sm border p-3 rounded-lg bg-card">
                  <div className="font-bold w-12 text-center text-primary bg-primary/10 rounded p-1">
                    #{entry.queueNumber}
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between">
                    {STAGE_ORDER.map((stage, idx) => {
                      const Icon = STAGE_ICONS[stage] || Activity;
                      const isActive = idx === currentStepIndex;
                      const isPast = idx < currentStepIndex;
                      
                      // Skip some intermediate steps for brevity on small widgets
                      if (["vitals_done", "tests_ordered"].includes(stage) && !isActive) return null;

                      return (
                        <div key={stage} className={`flex items-center ${isActive ? "text-primary font-bold scale-110 transition-transform" : isPast ? "text-muted-foreground" : "text-muted opacity-50"}`}>
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="h-4 w-4" />
                            <span className="text-[10px] hidden sm:block">{STAGE_LABELS[stage]}</span>
                          </div>
                          {idx < STAGE_ORDER.length - 1 && (
                            <ArrowRight className="h-3 w-3 mx-1 opacity-50" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
