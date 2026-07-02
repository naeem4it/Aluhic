import { CompanySettings } from "@/components/CompanySettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { User, Crown, Shield, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const roleConfig = {
    user: { label: "Medical Representative", icon: User, variant: "default" as const, description: "Standard user access" },
    company_admin: { label: "Company Administrator", icon: Shield, variant: "secondary" as const, description: "Can manage company-wide data and settings" },
    super_admin: { label: "Super Administrator", icon: Crown, variant: "default" as const, description: "Full system access across all companies" },
  };

  const currentRole = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.user;

  const subscriptionConfig = {
    trial: { label: "Trial Period", icon: Clock, variant: "default" as const, color: "text-blue-500" },
    active: { label: "Active", icon: CheckCircle2, variant: "default" as const, color: "text-green-500" },
    expired: { label: "Expired", icon: XCircle, variant: "destructive" as const, color: "text-destructive" },
  };

  const subscriptionStatus = subscriptionConfig[user?.subscriptionActive as keyof typeof subscriptionConfig] || subscriptionConfig.trial;

  const trialEndDate = user?.trialEndDate ? new Date(user.trialEndDate) : null;
  const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile and subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Info */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                <p className="text-base" data-testid="text-user-name">
                  {user?.firstName || user?.lastName 
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                <p className="text-base" data-testid="text-user-email">{user?.email || "Not set"}</p>
              </div>
              {user?.territory && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Territory</p>
                  <p className="text-base" data-testid="text-user-territory">{user.territory}</p>
                </div>
              )}
            </div>

            {/* Role and Subscription */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Role</p>
                <Badge variant={currentRole.variant} className="flex items-center gap-1 w-fit" data-testid="badge-user-role">
                  <currentRole.icon className="h-3 w-3" />
                  {currentRole.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{currentRole.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Subscription Status</p>
                <div className="flex items-center gap-2">
                  <subscriptionStatus.icon className={`h-4 w-4 ${subscriptionStatus.color}`} />
                  <Badge variant={subscriptionStatus.variant} data-testid="badge-subscription-status">
                    {subscriptionStatus.label}
                  </Badge>
                </div>
                {user?.subscriptionActive === "trial" && trialEndDate && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span data-testid="text-trial-days-remaining">
                      {daysRemaining > 0 
                        ? `${daysRemaining} days remaining (expires ${trialEndDate.toLocaleDateString()})`
                        : `Expired on ${trialEndDate.toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CompanySettings />
    </div>
  );
}
