import { useLocation } from "wouter";
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

  // Get menu items based on viewing role (supports "View As" feature)
  const navItems = getMenuForViewingRole(viewingRole, isSuperAdmin, isViewingAs);

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
                        <a href={item.path} data-testid={`link-sidebar-${item.label.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </a>
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
