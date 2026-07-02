import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertCompanySettingsSchema, type CompanySettings as CompanySettingsType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function CompanySettings() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery<CompanySettingsType>({
    queryKey: ["/api/company-settings"],
  });

  const form = useForm({
    resolver: zodResolver(insertCompanySettingsSchema),
    values: settings || {
      name: "",
      logoUrl: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof insertCompanySettingsSchema._type) => {
      return await apiRequest("PUT", "/api/company-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      window.dispatchEvent(new Event("companyConfigChanged"));
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: typeof insertCompanySettingsSchema._type) => {
    updateMutation.mutate(data);
  };

  // Only company_admin and super_admin can modify settings
  if (user?.role !== "company_admin" && user?.role !== "super_admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Only company administrators and super administrators can modify company settings.
          </p>
          {settings && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Company Name</p>
                <p className="text-muted-foreground">{settings.name || "Not set"}</p>
              </div>
              {settings.logoUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Company Logo</p>
                  <img
                    src={settings.logoUrl}
                    alt="Company logo"
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Branding</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter company name"
                      {...field}
                      data-testid="input-company-name"
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear in the header and throughout the application
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-logo-url"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a URL to your company logo image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("logoUrl") && (
              <div className="space-y-2">
                <FormLabel>Logo Preview</FormLabel>
                <div className="border rounded-md p-4 bg-muted/50">
                  <img
                    src={form.watch("logoUrl") || ""}
                    alt="Company logo preview"
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.alt = "Failed to load logo";
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending || isLoading}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
