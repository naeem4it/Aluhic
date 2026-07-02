import { Link, useLocation } from "wouter";
import { useRole } from "@/context/RoleContext";
import { getMenuForViewingRole } from "@/config/menuConfig";
import type { NavItem } from "@/config/menuConfig";

export function MobileNav() {
  const [location] = useLocation();
  const { viewingRole, isSuperAdmin, isViewingAs } = useRole();

  // Get menu items based on viewing role (supports "View As" feature)
  const navItems = getMenuForViewingRole(viewingRole, isSuperAdmin, isViewingAs);

  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden overflow-x-auto">
      <div className="flex items-center h-16 px-2">
        {navItems.map((item: NavItem) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[70px] flex-shrink-0 hover-elevate active-elevate-2 rounded-md cursor-pointer ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
