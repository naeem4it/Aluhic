import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stethoscope, Plus, Pill } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertConsultationSchema, type InsertConsultation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const prescriptionSchema = z.object({
  medications: z.string(),
  instructions: z.string().optional(),
});

export default function DoctorTerminal() {
  const { toast } = useToast();
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [selectedConsultationId, setSelectedConsultationId] = useState("");

  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: queueEntries = [] } = useQuery({
    queryKey: selectedFacilityId ? ["/api/healthcare/queue", selectedFacilityId] : ["disabled"],
    enabled: !!selectedFacilityId,
  });

  const { data: vitals = [] } = useQuery({
    queryKey: selectedQueueId ? ["/api/healthcare/vitals", selectedQueueId] : ["disabled"],
    enabled: !!selectedQueueId,
  });

  const consultationForm = useForm<InsertConsultation>({
    resolver: zodResolver(insertConsultationSchema.omit({ patientId: true, doctorId: true, facilityId: true, companyId: true }).partial()),
    defaultValues: {
      chiefComplaint: "",
      observations: "",
      diagnosis: "",
      treatmentPlan: "",
    },
  });

  const prescriptionForm = useForm<z.infer<typeof prescriptionSchema>>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medications: "",
      instructions: "",
    },
  });

  const createConsultationMutation = useMutation({
    mutationFn: async (data: any) => {
      const queueEntry = queueEntries.find((q: any) => q.id === selectedQueueId);
      return await apiRequest("POST", "/api/healthcare/consultations", {
        ...data,
        facilityId: selectedFacilityId,
        patientId: queueEntry?.patientId,
        doctorId: queueEntry?.doctorId,
        queueEntryId: selectedQueueId,
      });
    },
    onSuccess: (result) => {
      setSelectedConsultationId(result.id);
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/queue", selectedFacilityId] });
      toast({ description: "Consultation recorded" });
      setIsConsultationOpen(false);
    },
    onError: () => {
      toast({ description: "Failed to record consultation", variant: "destructive" });
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const queueEntry = queueEntries.find((q: any) => q.id === selectedQueueId);
      const medicationsArray = data.medications.split(",").map((m: string) => ({
        name: m.trim(),
        dosage: "As prescribed",
        frequency: "As directed",
        duration: "As advised",
      }));
      return await apiRequest("POST", "/api/healthcare/prescriptions", {
        consultationId: selectedConsultationId,
        patientId: queueEntry?.patientId,
        doctorId: queueEntry?.doctorId,
        medications: medicationsArray,
        instructions: data.instructions,
      });
    },
    onSuccess: () => {
      toast({ description: "Prescription created" });
      setIsPrescriptionOpen(false);
      prescriptionForm.reset();
    },
    onError: () => {
      toast({ description: "Failed to create prescription", variant: "destructive" });
    },
  });

  const onConsultationSubmit = (data: any) => {
    createConsultationMutation.mutate(data);
  };

  const onPrescriptionSubmit = (data: z.infer<typeof prescriptionSchema>) => {
    createPrescriptionMutation.mutate(data);
  };

  const queueEntry = queueEntries.find((q: any) => q.id === selectedQueueId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Terminal</h1>
          <p className="text-muted-foreground">Manage consultations and prescriptions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Dialog open={isConsultationOpen} onOpenChange={setIsConsultationOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedQueueId} data-testid="button-add-consultation">
              <Stethoscope className="h-4 w-4 mr-2" />
              Add Consultation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Consultation</DialogTitle>
            </DialogHeader>
            <Form {...consultationForm}>
              <form onSubmit={consultationForm.handleSubmit(onConsultationSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto">
                <FormField
                  control={consultationForm.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Patient's main complaint" data-testid="input-complaint" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={consultationForm.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observations</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Physical examination findings" data-testid="input-observations" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={consultationForm.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Medical diagnosis" data-testid="input-diagnosis" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={consultationForm.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Plan</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Treatment recommendations" data-testid="input-treatment" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsConsultationOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createConsultationMutation.isPending} data-testid="button-submit">
                    {createConsultationMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedConsultationId} data-testid="button-add-prescription">
              <Pill className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Prescription</DialogTitle>
            </DialogHeader>
            <Form {...prescriptionForm}>
              <form onSubmit={prescriptionForm.handleSubmit(onPrescriptionSubmit)} className="space-y-4">
                <FormField
                  control={prescriptionForm.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medications (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Paracetamol, Amoxicillin" data-testid="input-medications" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={prescriptionForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Usage instructions" data-testid="input-instructions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsPrescriptionOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPrescriptionMutation.isPending} data-testid="button-submit">
                    {createPrescriptionMutation.isPending ? "Creating..." : "Create"}
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
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Queue</h2>
            {queueEntries.length === 0 ? (
              <Card>
                <CardContent className="py-4 text-sm text-muted-foreground">
                  No queue entries
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {queueEntries.map((entry: any) => (
                  <Card
                    key={entry.id}
                    className={`cursor-pointer hover-elevate ${selectedQueueId === entry.id ? "border-primary border-2" : ""}`}
                    onClick={() => setSelectedQueueId(entry.id)}
                    data-testid={`card-queue-${entry.id}`}
                  >
                    <CardContent className="p-4">
                      <p className="font-semibold">#{entry.queueNumber}</p>
                      <p className="text-xs text-muted-foreground">{entry.status}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {queueEntry && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Vitals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vitals.length === 0 ? (
                      <p className="text-muted-foreground">No vitals recorded</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {vitals.map((v: any) => (
                          <div key={v.id} className="space-y-2">
                            {v.temperature && <p className="text-sm">Temp: {v.temperature}°F</p>}
                            {v.pulseRate && <p className="text-sm">Pulse: {v.pulseRate} bpm</p>}
                            {v.bloodPressureSystolic && <p className="text-sm">BP: {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</p>}
                            {v.oxygenLevel && <p className="text-sm">O2: {v.oxygenLevel}%</p>}
                            {v.sugarLevel && <p className="text-sm">Sugar: {v.sugarLevel} mg/dL</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
