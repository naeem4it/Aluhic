import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  clinic: string | null;
};

type Product = {
  id: string;
  name: string;
  currentPrice: string;
  description: string | null;
};

const salesFormSchema = z.object({
  date: z.date(),
  repName: z.string().min(1, "Rep name is required"),
  territory: z.string().min(1, "Territory is required"),
  doctorId: z.string().min(1, "Please select a doctor"),
  productId: z.string().min(1, "Please select a product"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  priceOverride: z.coerce.number().min(0).optional().nullable(),
  paymentMode: z.enum(["cash", "credit", "pending"]),
  remarks: z.string().optional(),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export function SalesEntryForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [useOverride, setUseOverride] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      date: new Date(),
      repName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
      territory: user?.territory || "Not Specified",
      doctorId: "",
      productId: "",
      quantity: 1,
      priceOverride: null,
      paymentMode: "cash",
      remarks: "",
    },
  });

  const selectedProductId = form.watch("productId");
  const quantity = form.watch("quantity");
  const priceOverride = form.watch("priceOverride");

  const selectedProduct = products?.find(p => p.id === selectedProductId);
  const effectivePrice = useOverride && priceOverride ? priceOverride : (selectedProduct ? parseFloat(selectedProduct.currentPrice) : 0);
  const total = quantity && effectivePrice ? (quantity * effectivePrice).toFixed(2) : "0.00";

  const createMutation = useMutation({
    mutationFn: async (data: SalesFormValues) => {
      const payload = {
        ...data,
        date: data.date.toISOString(),
        priceOverride: useOverride && data.priceOverride ? data.priceOverride.toString() : null,
      };
      return await apiRequest("POST", "/api/sales", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales entry created successfully",
      });
      form.reset({
        date: new Date(),
        repName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
        territory: user?.territory || form.getValues("territory") || "Not Specified",
        doctorId: "",
        productId: "",
        quantity: 1,
        priceOverride: null,
        paymentMode: "cash",
        remarks: "",
      });
      setUseOverride(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sales entry",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, updateDuplicates }: { file: File; updateDuplicates: boolean }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (updateDuplicates) {
        formData.append("updateDuplicates", "true");
      }

      const endpoint = updateDuplicates ? "/api/sales/upload-with-update" : "/api/sales/upload";
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setUploadFile(null);
      setDuplicateData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      if (error.duplicates) {
        setDuplicateData(error);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to upload sales",
          variant: "destructive",
        });
        setUploadFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
  });

  const handleSubmit = (data: SalesFormValues) => {
    createMutation.mutate(data);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/sales/template", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({
          title: "Error",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setUploadFile(file);
      uploadMutation.mutate({ file, updateDuplicates: false });
    }
  };

  const handleConfirmUpdate = () => {
    if (uploadFile) {
      uploadMutation.mutate({ file: uploadFile, updateDuplicates: true });
    }
  };

  const handleCancelUpdate = () => {
    setDuplicateData(null);
    setUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={handleDownloadTemplate} variant="outline" data-testid="button-download-sales-template">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" data-testid="button-upload-sales-excel">
          <Upload className="w-4 h-4 mr-2" />
          Upload Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          data-testid="input-sales-excel-file"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Rep Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} data-testid="input-rep-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="territory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Territory / Area</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter territory" {...field} data-testid="input-territory" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-doctor">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors?.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id} data-testid={`option-doctor-${doctor.id}`}>
                            {doctor.name} {doctor.specialty ? `(${doctor.specialty})` : ""}
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
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                            {product.name} (Rs. {parseFloat(product.currentPrice).toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Sold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Price per Unit (Rs.)</FormLabel>
                <FormControl>
                  <Input
                    value={effectivePrice.toFixed(2)}
                    disabled
                    className="bg-muted font-mono"
                    data-testid="input-unit-price"
                  />
                </FormControl>
                {selectedProduct && (
                  <FormDescription className="text-xs">
                    Default price: Rs. {parseFloat(selectedProduct.currentPrice).toFixed(2)}
                  </FormDescription>
                )}
              </FormItem>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-override"
                checked={useOverride}
                onCheckedChange={(checked) => {
                  setUseOverride(checked as boolean);
                  if (!checked) {
                    form.setValue("priceOverride", null);
                  }
                }}
                data-testid="checkbox-price-override"
              />
              <label
                htmlFor="use-override"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use custom price (override default)
              </label>
            </div>

            {useOverride && (
              <FormField
                control={form.control}
                name="priceOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Price per Unit (Rs.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        data-testid="input-price-override"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormItem>
              <FormLabel>Total Amount (Rs.)</FormLabel>
              <FormControl>
                <Input
                  value={`Rs. ${total}`}
                  disabled
                  className="bg-muted font-mono font-semibold text-lg"
                  data-testid="input-total"
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="paymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-mode">
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks / Follow-up Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any notes or follow-up actions..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-remarks"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <Button
                type="submit"
                className="w-full h-12"
                disabled={createMutation.isPending}
                data-testid="button-submit-entry"
              >
                {createMutation.isPending ? "Submitting..." : "Submit Sales Entry"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={!!duplicateData} onOpenChange={(open) => !open && handleCancelUpdate()}>
        <AlertDialogContent data-testid="dialog-duplicate-sales">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Sales Entries Found</AlertDialogTitle>
            <AlertDialogDescription>
              Found {duplicateData?.duplicates?.length || 0} duplicate sales entry(s) in the file. 
              {duplicateData?.validRows > 0 && ` ${duplicateData.validRows} new entry(s) can be imported.`}
              <br /><br />
              Do you want to update the existing sales entries with the new data from the file?
              <br /><br />
              <strong>Duplicates:</strong>
              <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto">
                {duplicateData?.duplicates?.map((dup: any, idx: number) => (
                  <li key={idx}>{dup.date} - {dup.doctorEmail} - {dup.productName}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpdate} data-testid="button-cancel-update-sales">
              No, Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              data-testid="button-confirm-update-sales"
            >
              Yes, Update Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
