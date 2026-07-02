import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { 
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  RotateCcw,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText
} from "lucide-react";

export default function AccountsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("ledger");
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd")
  });

  const organizationId = user?.organizationId || user?.companyId;

  const { data: ledgerAccounts = [], isLoading: ledgerLoading } = useQuery<any[]>({
    queryKey: ["/api/accounts/ledger", organizationId],
    enabled: !!organizationId
  });

  const { data: journalEntries = [], isLoading: journalLoading } = useQuery<any[]>({
    queryKey: ["/api/accounts/journal-entries", organizationId, dateRange.startDate, dateRange.endDate],
    enabled: !!organizationId
  });

  const postMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return apiRequest(`/api/accounts/journal-entries/${entryId}/post`, { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Journal entry posted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/journal-entries", organizationId, dateRange.startDate, dateRange.endDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/ledger", organizationId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to post journal entry", description: error.message, variant: "destructive" });
    }
  });

  const reverseMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return apiRequest(`/api/accounts/journal-entries/${entryId}/reverse`, { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Journal entry reversed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/journal-entries", organizationId, dateRange.startDate, dateRange.endDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/ledger", organizationId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reverse journal entry", description: error.message, variant: "destructive" });
    }
  });

  const handleAddAccount = () => {
    toast({ title: "Coming soon", description: "Account creation will be available in the next update" });
  };

  const handleNewEntry = () => {
    toast({ title: "Coming soon", description: "Journal entry creation will be available in the next update" });
  };

  const assetAccounts = ledgerAccounts.filter(a => a.accountType === 'asset');
  const liabilityAccounts = ledgerAccounts.filter(a => a.accountType === 'liability');
  const expenseAccounts = ledgerAccounts.filter(a => a.accountType === 'expense');
  const revenueAccounts = ledgerAccounts.filter(a => a.accountType === 'revenue');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || 0), 0);
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'posted':
        return <Badge variant="default" className="bg-green-500">Posted</Badge>;
      case 'reversed':
        return <Badge variant="destructive">Reversed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'asset':
        return <Badge variant="outline" className="text-blue-600">Asset</Badge>;
      case 'liability':
        return <Badge variant="outline" className="text-red-600">Liability</Badge>;
      case 'equity':
        return <Badge variant="outline" className="text-purple-600">Equity</Badge>;
      case 'revenue':
        return <Badge variant="outline" className="text-green-600">Revenue</Badge>;
      case 'expense':
        return <Badge variant="outline" className="text-orange-600">Expense</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-accounts-title">Accounts Dashboard</h1>
          <p className="text-muted-foreground">Manage chart of accounts, journal entries, and ledger balances</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Label>From:</Label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-40"
              data-testid="input-date-start"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>To:</Label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-40"
              data-testid="input-date-end"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-total-assets">
              Rs. {totalAssets.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{assetAccounts.length} accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-total-liabilities">
              Rs. {totalLiabilities.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{liabilityAccounts.length} accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-revenue">
              Rs. {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{revenueAccounts.length} accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-total-expenses">
              Rs. {totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{expenseAccounts.length} accounts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="ledger" data-testid="tab-ledger">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal" data-testid="tab-journal">Journal Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>Manage ledger accounts and their balances</CardDescription>
              </div>
              <Button onClick={handleAddAccount} data-testid="button-add-account">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              {ledgerLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
              ) : ledgerAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No ledger accounts found. Add your first account to get started.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Parent Account</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerAccounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.accountCode}</TableCell>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell>{getAccountTypeBadge(account.accountType)}</TableCell>
                        <TableCell>{account.parentAccountId || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          Rs. {parseFloat(account.currentBalance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assetAccounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No asset accounts</p>
                ) : (
                  <div className="space-y-2">
                    {assetAccounts.map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{account.accountName}</p>
                          <p className="text-xs text-muted-foreground">{account.accountCode}</p>
                        </div>
                        <p className="font-medium text-blue-600">
                          Rs. {parseFloat(account.currentBalance || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-red-500" />
                  Liabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liabilityAccounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No liability accounts</p>
                ) : (
                  <div className="space-y-2">
                    {liabilityAccounts.map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{account.accountName}</p>
                          <p className="text-xs text-muted-foreground">{account.accountCode}</p>
                        </div>
                        <p className="font-medium text-red-600">
                          Rs. {parseFloat(account.currentBalance || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Journal Entries</CardTitle>
                <CardDescription>View and manage accounting journal entries</CardDescription>
              </div>
              <Button onClick={handleNewEntry} data-testid="button-add-entry">
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </CardHeader>
            <CardContent>
              {journalLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading journal entries...</div>
              ) : journalEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No journal entries found for this period.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                        <TableCell>{format(new Date(entry.entryDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                        <TableCell className="capitalize">{entry.sourceType?.replace('_', ' ') || '-'}</TableCell>
                        <TableCell className="text-right">Rs. {parseFloat(entry.totalDebit || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">Rs. {parseFloat(entry.totalCredit || 0).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {entry.status === 'draft' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => postMutation.mutate(entry.id)}
                                disabled={postMutation.isPending}
                                data-testid={`button-post-${entry.id}`}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Post
                              </Button>
                            )}
                            {entry.status === 'posted' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => reverseMutation.mutate(entry.id)}
                                disabled={reverseMutation.isPending}
                                data-testid={`button-reverse-${entry.id}`}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reverse
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" data-testid={`button-view-${entry.id}`}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
