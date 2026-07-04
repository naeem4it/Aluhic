import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Building2, Server, Power, Layers, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Company, Module, CompanyModule } from "@shared/schema";

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/admin/modules"],
  });

  const { data: companyModules = [], isLoading: companyModulesLoading } = useQuery<CompanyModule[]>({
    queryKey: ["/api/admin/companies", selectedCompanyId, "modules"],
    enabled: !!selectedCompanyId,
  });

  const toggleModuleMutation = useMutation({
    mutationFn: ({ moduleId, status }: { moduleId: string; status: string }) =>
      apiRequest("POST", `/api/admin/companies/${selectedCompanyId}/modules`, { moduleId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", selectedCompanyId, "modules"] });
      toast({ title: "Module updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update module", description: error.message, variant: "destructive" });
    },
  });

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const isModuleActive = (moduleId: string) => {
    const mod = companyModules.find(m => m.moduleId === moduleId);
    return mod?.status === "active";
  };

  const handleToggle = (moduleId: string, currentActive: boolean) => {
    if (!selectedCompanyId) return;
    toggleModuleMutation.mutate({
      moduleId,
      status: currentActive ? "suspended" : "active"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-7 w-7 text-primary" />
          SaaS Module Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Super Admin Panel to enable or disable functional modules per client organization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Client List */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clients
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[600px] overflow-y-auto">
              {companiesLoading ? (
                <div className="p-4 text-center text-muted-foreground flex justify-center items-center h-20">
                  <Activity className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No clients found.</div>
              ) : (
                <div className="flex flex-col divide-y">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`text-left p-4 hover:bg-muted/50 transition-colors flex flex-col gap-1 ${
                        selectedCompanyId === company.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <span className="font-semibold">{company.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{company.email || 'No email provided'}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Module Toggles */}
        <div className="md:col-span-2">
          <Card className="h-full min-h-[600px]">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Client Subscriptions
                </div>
                {selectedCompanyId && (
                  <Badge variant="outline" className="text-primary bg-primary/10">
                    {companies.find(c => c.id === selectedCompanyId)?.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedCompanyId 
                  ? "Toggle the switches below to instantly provision or revoke access to SaaS modules for this client." 
                  : "Select a client from the left panel to manage their modules."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCompanyId ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Layers className="h-12 w-12 mb-4 opacity-20" />
                  <p>No client selected</p>
                </div>
              ) : modulesLoading || companyModulesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedModules).map(([category, catModules]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {catModules.map((module) => {
                          const isActive = isModuleActive(module.id);
                          return (
                            <Card key={module.id} className={`${isActive ? 'border-primary/50 bg-primary/5' : 'bg-muted/30'} transition-all`}>
                              <CardContent className="p-4 flex gap-4 items-start justify-between">
                                <div className="space-y-1 pr-4">
                                  <h4 className="font-semibold text-sm leading-none flex items-center gap-2">
                                    {module.name}
                                    {isActive && <Badge variant="default" className="text-[10px] px-1 py-0 h-4">Active</Badge>}
                                  </h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {module.description}
                                  </p>
                                  <p className="text-xs font-medium text-primary pt-1">
                                    Base Price: Rs. {module.basePrice}/mo
                                  </p>
                                </div>
                                <div className="flex flex-col items-center justify-center pt-2">
                                  <Checkbox 
                                    checked={isActive}
                                    onCheckedChange={() => handleToggle(module.id, isActive)}
                                    disabled={toggleModuleMutation.isPending}
                                    className="h-6 w-6"
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
