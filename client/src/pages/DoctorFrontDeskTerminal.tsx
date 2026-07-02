import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Thermometer, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertPatientVitalsSchema, type InsertPatientVitals } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function DoctorFrontDeskTerminal() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("");

  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: queueEntries = [] } = useQuery({
    queryKey: selectedFacilityId ? ["/api/healthcare/queue", selectedFacilityId] : ["disabled"],
    enabled: !!selectedFacilityId,
  });

  const form = useForm<InsertPatientVitals>({
    resolver: zodResolver(insertPatientVitalsSchema.omit({ patientId: true, recordedBy: true, companyId: true }).partial()),
    defaultValues: {
      temperature: undefined,
      bloodPressureSystolic: undefined,
      bloodPressureDiastolic: undefined,
      pulseRate: undefined,
      oxygenLevel: undefined,
      sugarLevel: undefined,
    },
  });

  const recordVitalsMutation = useMutation({
    mutationFn: async (data: InsertPatientVitals) => {
      const queueEntry = queueEntries.find((q: any) => q.id === selectedQueueId);
      return await apiRequest("POST", "/api/healthcare/vitals", {
        ...data,
        patientId: queueEntry?.patientId,
        queueEntryId: selectedQueueId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/queue", selectedFacilityId] });
      toast({ description: "Vitals recorded successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ description: "Failed to record vitals", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertPatientVitals) => {
    recordVitalsMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Front Desk</h1>
          <p className="text-muted-foreground">Record patient vitals and information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedQueueId} data-testid="button-record-vitals">
              <Thermometer className="h-4 w-4 mr-2" />
              Record Vitals
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Patient Vitals</DialogTitle>
              <DialogDescription>Enter patient medical measurements</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°F)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" placeholder="98.6" data-testid="input-temperature" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pulseRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pulse Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="72" data-testid="input-pulse" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloodPressureSystolic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BP Systolic</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="120" data-testid="input-bp-sys" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloodPressureDiastolic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BP Diastolic</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="80" data-testid="input-bp-dia" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="oxygenLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>O2 Level (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="98.50" data-testid="input-o2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sugarLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sugar Level (mg/dL)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="100" data-testid="input-sugar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="70" data-testid="input-weight" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="175" data-testid="input-height" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional observations" data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={recordVitalsMutation.isPending} data-testid="button-submit">
                    {recordVitalsMutation.isPending ? "Recording..." : "Record"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Facility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {facilities.map((f: any) => (
              <Button
                key={f.id}
                variant={selectedFacilityId === f.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedFacilityId(f.id)}
                data-testid={`button-facility-${f.id}`}
              >
                {f.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedFacilityId && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Today's Queue</h2>
          {queueEntries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No queue entries
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {queueEntries.map((entry: any) => (
                <Card
                  key={entry.id}
                  className={`cursor-pointer hover-elevate ${selectedQueueId === entry.id ? "border-primary border-2" : ""}`}
                  onClick={() => setSelectedQueueId(entry.id)}
                  data-testid={`card-queue-${entry.id}`}
                >
                  <CardHeader>
                    <CardTitle>Queue #{entry.queueNumber}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Status: {entry.status}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
