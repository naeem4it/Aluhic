import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { MedicalInstruction, InsertMedicalInstruction } from "@shared/schema";
import { insertMedicalInstructionSchema } from "@shared/schema";

export function MedicalInstructionsDictionary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: instructions = [], isLoading } = useQuery<MedicalInstruction[]>({
    queryKey: ["/api/medical-instructions"],
  });

  const form = useForm<InsertMedicalInstruction>({
    resolver: zodResolver(insertMedicalInstructionSchema),
    defaultValues: {
      category: "instruction",
      englishText: "",
      urduText: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMedicalInstruction) => {
      const res = await fetch("/api/medical-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create instruction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-instructions"] });
      toast({ title: "Instruction added successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; payload: Partial<InsertMedicalInstruction> }) => {
      const res = await fetch(`/api/medical-instructions/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.payload),
      });
      if (!res.ok) throw new Error("Failed to update instruction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-instructions"] });
      toast({ title: "Instruction updated successfully" });
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/medical-instructions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete instruction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-instructions"] });
      toast({ title: "Instruction deleted successfully" });
    },
  });

  const onSubmit = (data: InsertMedicalInstruction) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (instruction: MedicalInstruction) => {
    setEditingId(instruction.id);
    form.reset({
      category: instruction.category,
      englishText: instruction.englishText,
      urduText: instruction.urduText,
      isActive: instruction.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset({
        category: "instruction",
        englishText: "",
        urduText: "",
        isActive: true,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Medical Instructions Dictionary</h3>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Phrase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Phrase" : "Add New Phrase"}</DialogTitle>
              <DialogDescription>
                Map English medical terms to their Urdu translations.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(val) => form.setValue("category", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dosage">Dosage (e.g., 500mg)</SelectItem>
                    <SelectItem value="frequency">Frequency (e.g., Twice daily)</SelectItem>
                    <SelectItem value="duration">Duration (e.g., 7 days)</SelectItem>
                    <SelectItem value="instruction">Instruction (e.g., After meals)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>English Text</Label>
                <Input {...form.register("englishText")} placeholder="e.g., 1 Tablet Morning" />
              </div>
              <div className="space-y-2">
                <Label>Urdu Text (Nastaliq)</Label>
                <Input
                  {...form.register("urduText")}
                  placeholder="e.g., ایک گولی صبح"
                  dir="rtl"
                  className="font-urdu text-lg"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>English</TableHead>
              <TableHead className="text-right">Urdu (اردو)</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : instructions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No translations found.</TableCell>
              </TableRow>
            ) : (
              instructions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>{item.englishText}</TableCell>
                  <TableCell className="text-right font-urdu text-lg">{item.urduText}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this translation?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
