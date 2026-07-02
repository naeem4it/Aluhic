import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Printer, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { MedicalInstruction, Medicine } from "@shared/schema";
import { generateBilingualPrescription } from "@/lib/pdfGenerator";

export function PrescriptionComposer({ patientId, doctorId }: { patientId?: string; doctorId?: string }) {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch standard medicines (ideally this should be an autocomplete, but select works for POC)
  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  // Fetch translated instructions
  const { data: instructions = [] } = useQuery<MedicalInstruction[]>({
    queryKey: ["/api/medical-instructions"],
  });

  const getInstructionsByCategory = (category: string) =>
    instructions.filter((i) => i.category === category && i.isActive);

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      medications: [
        {
          medicineId: "",
          medicineName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  const onSave = (data: any) => {
    // Here we would typically submit to our backend to save the prescription
    console.log("Prescription data saved:", data);
    toast({ title: "Prescription Saved", description: "The prescription has been saved successfully." });
  };

  const onPrint = async (data: any) => {
    setIsPrinting(true);
    try {
      // Map the IDs back to the english and urdu strings for the PDF
      const mappedMedications = data.medications.map((med: any) => {
        const freqObj = instructions.find(i => i.id.toString() === med.frequency);
        const durObj = instructions.find(i => i.id.toString() === med.duration);
        const instObj = instructions.find(i => i.id.toString() === med.instructions);

        return {
          ...med,
          frequency: freqObj?.englishText || med.frequency,
          frequencyUrdu: freqObj?.urduText || "",
          duration: durObj?.englishText || med.duration,
          durationUrdu: durObj?.urduText || "",
          instructions: instObj?.englishText || med.instructions,
          instructionsUrdu: instObj?.urduText || "",
        };
      });

      // Mock patient and doctor data for PDF
      const patientData = { name: "John Doe", age: "35", gender: "Male" };
      const doctorData = { name: "Ahmed", clinicName: "Aluhic Clinic", specialty: "General Physician" };

      await generateBilingualPrescription(patientData, mappedMedications, doctorData);
      toast({ title: "PDF Generated", description: "Prescription is ready for printing." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Prescription Composer</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {fields.map((field, index) => {
            const medicineId = watch(`medications.${index}.medicineId`);
            
            // Auto-populate medicine name if a medicine is selected
            if (medicineId && medicineId !== "custom") {
              const selectedMed = medicines.find(m => m.id.toString() === medicineId);
              if (selectedMed && watch(`medications.${index}.medicineName`) !== selectedMed.name) {
                 setValue(`medications.${index}.medicineName`, selectedMed.name);
                 setValue(`medications.${index}.dosage`, selectedMed.strength || "");
              }
            }

            return (
              <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/20 relative">
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Medicine</Label>
                    <Select
                      onValueChange={(val) => {
                        setValue(`medications.${index}.medicineId`, val);
                      }}
                      defaultValue={field.medicineId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name} ({m.strength})
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">-- Custom Medicine --</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Medicine Name (If Custom)</Label>
                    <Input {...register(`medications.${index}.medicineName`)} placeholder="Enter name" />
                  </div>

                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input {...register(`medications.${index}.dosage`)} placeholder="e.g. 500mg" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      onValueChange={(val) => setValue(`medications.${index}.frequency`, val)}
                      defaultValue={field.frequency}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {getInstructionsByCategory("frequency").map(i => (
                          <SelectItem key={i.id} value={i.id.toString()}>{i.englishText}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      onValueChange={(val) => setValue(`medications.${index}.duration`, val)}
                      defaultValue={field.duration}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {getInstructionsByCategory("duration").map(i => (
                          <SelectItem key={i.id} value={i.id.toString()}>{i.englishText}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Select
                      onValueChange={(val) => setValue(`medications.${index}.instructions`, val)}
                      defaultValue={field.instructions}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {getInstructionsByCategory("instruction").map(i => (
                          <SelectItem key={i.id} value={i.id.toString()}>{i.englishText}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" {...register(`medications.${index}.quantity`)} min="1" />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  medicineId: "",
                  medicineName: "",
                  dosage: "",
                  frequency: "",
                  duration: "",
                  instructions: "",
                  quantity: 1,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Medicine
            </Button>
          </div>

          <div className="flex justify-end gap-4 border-t pt-4">
            <Button type="button" variant="secondary" onClick={handleSubmit(onSave)}>
              <Save className="mr-2 h-4 w-4" /> Save Prescription
            </Button>
            <Button type="button" onClick={handleSubmit(onPrint)} disabled={isPrinting}>
              <Printer className="mr-2 h-4 w-4" /> {isPrinting ? "Generating PDF..." : "Print Bilingual PDF"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
