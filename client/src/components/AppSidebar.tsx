import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/context/RoleContext";
import { getMenuForViewingRole } from "@/config/menuConfig";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AluhicLogo } from "@/components/AluhicLogo";
import type { NavItem } from "@/config/menuConfig";

export function AppSidebar() {
  const [location] = useLocation();
  const { viewingRole, isSuperAdmin, isViewingAs } = useRole();

  // Fetch active modules for the current user's company
  const { data: activeModules = [] } = useQuery<{ moduleId: string, status: string }[]>({
    queryKey: ["/api/modules"],
  });

  // Map of sidebar groups to their required module IDs
  // If a group requires a module, it will only show if that module is active
  const groupModuleRequirements: Record<string, string> = {
    sales: "sales_tracking",
    healthcare: "opd_management",
    analytics: "sales_tracking", // Assuming analytics needs sales module for now
    inventory: "inventory_management",
    hr: "hr_core",
    accounts: "finance_accounting",
  };

  // Get menu items based on viewing role (supports "View As" feature)
  let navItems = getMenuForViewingRole(viewingRole, isSuperAdmin, isViewingAs);

  // Filter items based on active modules if not super admin
  if (!isSuperAdmin || isViewingAs) {
    navItems = navItems.filter((item) => {
      const group = item.group || "other";
      const requiredModule = groupModuleRequirements[group];
      
      // If no module is required for this group, show it
      if (!requiredModule) return true;
      
      // Otherwise, check if the required module is active
      return activeModules.some(m => m.moduleId === requiredModule && m.status === 'active');
    });
  }

  // Group items by their group property
  const groupedItems = navItems.reduce(
    (acc, item) => {
      const group = item.group || "other";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  const groupLabels: Record<string, string> = {
    main: "Overview",
    sales: "Sales",
    healthcare: "Healthcare",
    analytics: "Analytics",
    inventory: "Inventory",
    hr: "HR & Payroll",
    accounts: "Accounts",
    admin: "Administration",
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <AluhicLogo variant="icon" size="md" />
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupKey, items]) => (
          <SidebarGroup key={groupKey}>
            <div className="px-2 py-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {groupLabels[groupKey] || groupKey}
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item: NavItem) => {
                  const isActive = location === item.path;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.path} data-testid={`link-sidebar-${item.label.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
