import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { getRoleDisplay } from "@/config/menuConfig";
import { RoleSelector } from "@/components/RoleSelector";
import { AluhicLogo } from "@/components/AluhicLogo";

interface CompanyConfig {
  name: string;
  logoUrl: string;
}

export function AppHeader() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { toggleSidebar } = useSidebar();

  const [config, setConfig] = useState<CompanyConfig>({
    name: "Alhuic",
    logoUrl: "",
  });

  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem("companyConfig");
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    };

    loadConfig();

    const handleConfigChange = () => {
      loadConfig();
    };

    window.addEventListener("companyConfigChanged", handleConfigChange);
    return () => {
      window.removeEventListener("companyConfigChanged", handleConfigChange);
    };
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const getRoleDisplayText = () => {
    return getRoleDisplay(user?.role);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            data-testid="button-sidebar-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {config.logoUrl ? (
            <>
              <img
                src={config.logoUrl}
                alt="Company logo"
                className="h-8 object-contain"
                data-testid="img-company-logo"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <h1 className="text-lg font-bold" data-testid="text-company-name">
                {config.name}
              </h1>
            </>
          ) : (
            <AluhicLogo size="sm" showSlogan data-testid="logo-app" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <RoleSelector />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                      {user.email}
                    </p>
                    <div className="pt-1">
                      <Badge variant="secondary" className="text-xs" data-testid="badge-user-role">
                        {getRoleDisplayText()}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  disabled={logoutMutation.isPending}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
