import { ReactNode } from "react";
import { useRole, ViewAsRole } from "@/context/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: ViewAsRole[];
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback,
  showAccessDenied = false,
}: RoleGuardProps) {
  const { canAccess, viewingRole } = useRole();

  if (!canAccess(allowedRoles)) {
    if (fallback) return <>{fallback}</>;
    if (showAccessDenied) {
      return (
        <Card className="max-w-md mx-auto mt-8" data-testid="card-access-denied">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access this content.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Current role: <span className="font-medium">{viewingRole}</span>
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return <>{children}</>;
}

interface ModuleGuardProps {
  module: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ModuleGuard({ module, children, fallback }: ModuleGuardProps) {
  const { canAccessModule } = useRole();

  if (!canAccessModule(module)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface SuperAdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuperAdminOnly({ children, fallback }: SuperAdminOnlyProps) {
  const { isSuperAdmin, isViewingAs } = useRole();

  if (!isSuperAdmin || isViewingAs) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface ViewingAsIndicatorProps {
  className?: string;
}

export function ViewingAsIndicator({ className = "" }: ViewingAsIndicatorProps) {
  const { isViewingAs, viewingRole, organizationType, resetToActualRole } = useRole();

  if (!isViewingAs) return null;

  return (
    <div
      className={`fixed bottom-20 md:bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      data-testid="viewing-as-indicator"
    >
      <Card className="bg-amber-500/90 border-amber-600 text-amber-950 shadow-lg">
        <CardContent className="py-2 px-4 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Viewing as: {viewingRole}
            {organizationType && ` (${organizationType})`}
          </span>
          <button
            onClick={resetToActualRole}
            className="text-xs underline hover:no-underline ml-2"
            data-testid="button-exit-view-as"
          >
            Exit
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
