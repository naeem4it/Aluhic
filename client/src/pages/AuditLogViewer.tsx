import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Search, Filter, Calendar, User, Building2, FileText, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  organizationId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

const actionCategories: Record<string, { label: string; color: "default" | "secondary" | "outline" | "destructive" }> = {
  create: { label: "Create", color: "default" },
  view: { label: "View", color: "secondary" },
  update: { label: "Update", color: "default" },
  delete: { label: "Delete", color: "destructive" },
  hire: { label: "Hire", color: "default" },
  terminate: { label: "Terminate", color: "destructive" },
  queue_issue: { label: "Queue Issue", color: "secondary" },
  queue_call: { label: "Queue Call", color: "secondary" },
  queue_serve: { label: "Queue Serve", color: "default" },
  report_generate: { label: "Report Gen", color: "outline" },
  export_request: { label: "Export Request", color: "outline" },
  export_approve: { label: "Export Approve", color: "default" },
  export_deny: { label: "Export Deny", color: "destructive" },
  login: { label: "Login", color: "secondary" },
  logout: { label: "Logout", color: "secondary" },
};

const entityTypes = [
  "person",
  "person_context",
  "queue_token",
  "queue_definition",
  "lab_order",
  "lab_result",
  "medicine",
  "stock_transaction",
  "prescription_fulfillment",
  "data_transfer_request",
  "user",
  "organization",
];

export default function AuditLogViewer() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const { data: auditLogs = [], isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.search) params.append("search", filters.search);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      params.append("limit", "100");
      
      const response = await fetch(`/api/audit-logs?${params.toString()}`, { credentials: "include" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch audit logs");
      }
      return response.json();
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    toast({ description: "Refreshing audit logs..." });
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      entityType: "",
      search: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const getActionBadge = (action: string) => {
    const category = actionCategories[action] || { label: action, color: "secondary" as const };
    return <Badge variant={category.color}>{category.label}</Badge>;
  };

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details) return null;
    const entries = Object.entries(details).slice(0, 3);
    return entries.map(([key, value]) => (
      <span key={key} className="text-xs text-muted-foreground">
        {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
      </span>
    ));
  };

  // Super admin has access via role or isSuperAdmin flag
  // System auditor and compliance officer also have access per menuConfig
  const allowedRoles = ["super_admin", "system_auditor", "compliance_officer"];
  const hasAccess = user && (user.isSuperAdmin || allowedRoles.includes(user.role));

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess || error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-2">
                You don't have permission to view audit logs. Super Admin, System Auditor, or Compliance Officer access required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Audit Log Viewer
          </h1>
          <p className="text-muted-foreground">Immutable system activity log - Super Admin only</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-logs">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Entity ID, User ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select 
                value={filters.action || "all"} 
                onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? "" : v })}
              >
                <SelectTrigger data-testid="select-action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionCategories).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Entity Type</label>
              <Select 
                value={filters.entityType || "all"} 
                onValueChange={(v) => setFilters({ ...filters, entityType: v === "all" ? "" : v })}
              >
                <SelectTrigger data-testid="select-entity-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                data-testid="input-date-from"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                data-testid="input-date-to"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={handleClearFilters} data-testid="button-clear-filters">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Activity Log
          </CardTitle>
          <CardDescription>
            {auditLogs.length} log entries {filters.action || filters.entityType || filters.search ? "(filtered)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  data-testid={`log-entry-${log.id}`}
                >
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">
                      {format(new Date(log.timestamp), "MMM dd HH:mm:ss")}
                    </span>
                  </div>

                  <div className="min-w-[100px]">
                    {getActionBadge(log.action)}
                  </div>

                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {log.entityType.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {log.entityId.substring(0, 8)}...
                      </span>
                    </div>
                    {log.details && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formatDetails(log.details)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-mono text-xs">
                      {log.userId.substring(0, 8)}...
                    </span>
                  </div>

                  {log.ipAddress && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
