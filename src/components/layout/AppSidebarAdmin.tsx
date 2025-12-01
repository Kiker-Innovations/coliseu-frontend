import {
  LayoutDashboard,
  DollarSign,
  Vote,
  LogOut,
  Shield,
  Building2,
  AlertTriangle,
  Megaphone,
  BarChart3,
  DoorOpen,
  FolderKanban,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import coliseuIcon from "@/assets/coliseu-icon.png";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Financeiro", url: "/admin/financial", icon: DollarSign },
  { title: "Projetos", url: "/admin/projects", icon: FolderKanban },
  { title: "Votações", url: "/admin/voting", icon: Vote },
  { title: "Enquetes", url: "/admin/polls", icon: BarChart3 },
  {
    title: "Informações do Condomínio",
    url: "/admin/condominium-info",
    icon: Building2,
  },
  { title: "Multas", url: "/admin/fines", icon: AlertTriangle },
  { title: "Avisos", url: "/admin/notices", icon: Megaphone },
  { title: "Portaria", url: "/admin/concierge", icon: DoorOpen },
];

export function AppSidebarAdmin() {
  const { state } = useSidebar();
  const location = useLocation();
  const { logout } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <img src={coliseuIcon} alt="Coliseu" className="w-8 h-8" />
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">
                COLISEU
              </h1>
              <div className="flex items-center gap-1 text-xs text-sidebar-foreground/70">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
