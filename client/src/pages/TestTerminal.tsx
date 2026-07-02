import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Beaker, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

const testReportSchema = z.object({
  patientId: z.string().min(1, "Patient required"),
  testName: z.string().min(1, "Test name required"),
  testType: z.string().optional(),
  labName: z.string().optional(),
  reportData: z.string().optional(),
  notes: z.string().optional(),
});

export default function TestTerminal() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");

  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/healthcare/facilities"],
  });

  const { data: patients = [] } = useQuery({
    queryKey: selectedFacilityId ? ["/api/healthcare/patients", selectedFacilityId] : ["disabled"],
    enabled: !!selectedFacilityId,
  });

  const { data: testReports = [] } = useQuery({
    queryKey: selectedFacilityId ? ["/api/healthcare/tests", selectedFacilityId] : ["disabled"],
    enabled: !!selectedFacilityId,
  });

  const form = useForm<z.infer<typeof testReportSchema>>({
    resolver: zodResolver(testReportSchema),
    defaultValues: {
      patientId: "",
      testName: "",
      testType: "blood",
      labName: "",
      reportData: "",
      notes: "",
    },
  });

  const uploadTestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testReportSchema>) => {
      return await apiRequest("POST", "/api/healthcare/tests", {
        ...data,
        reportData: data.reportData ? JSON.parse(data.reportData) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healthcare/tests", selectedFacilityId] });
      toast({ description: "Test report uploaded successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ description: "Failed to upload test report", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof testReportSchema>) => {
    uploadTestMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Terminal</h1>
          <p className="text-muted-foreground">Upload and manage test reports</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-report">
              <Upload className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Test Report</DialogTitle>
              <DialogDescription>Enter test details and upload report</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-patient">
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Blood Test, X-Ray, etc." data-testid="input-test-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-test-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blood">Blood</SelectItem>
                          <SelectItem value="urine">Urine</SelectItem>
                          <SelectItem value="x-ray">X-Ray</SelectItem>
                          <SelectItem value="mri">MRI</SelectItem>
                          <SelectItem value="ct_scan">CT Scan</SelectItem>
                          <SelectItem value="ultrasound">Ultrasound</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Laboratory name" data-testid="input-lab-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Data (JSON)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder='{"result": "Normal"}' data-testid="input-report-data" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes" data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadTestMutation.isPending} data-testid="button-submit">
                    {uploadTestMutation.isPending ? "Uploading..." : "Upload"}
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
          <h2 className="text-xl font-semibold">Recent Test Reports</h2>
          {testReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No test reports yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {testReports.map((report: any) => (
                <Card key={report.id} data-testid={`card-report-${report.id}`}>
                  <CardHeader>
                    <CardTitle className="text-base">{report.testName}</CardTitle>
                    <CardDescription>{report.testType}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {report.labName && <p className="text-sm text-muted-foreground">Lab: {report.labName}</p>}
                    {report.notes && <p className="text-sm">{report.notes}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
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
