import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getCurrentConcierge } from "@/services/concierge.service";
import coliseuIcon from "@/assets/coliseu-icon.png";

const menuItems = [
  { title: "Dashboard", url: "/concierge/dashboard", icon: LayoutDashboard },
  { title: "Encomendas", url: "/concierge/packages", icon: Package },
  { title: "Multas", url: "/concierge/fines", icon: AlertTriangle },
];

export function AppSidebarConcierge() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const collapsed = state === "collapsed";
  const [conciergeName, setConciergeName] = useState<string>("Porteiro");

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const loadConciergeName = async () => {
      try {
        const concierge = await getCurrentConcierge();
        if (concierge.name) {
          setConciergeName(concierge.name);
        }
      } catch (error) {
        // Tentar pegar do localStorage como fallback
        const storedName = localStorage.getItem("concierge_name");
        if (storedName) {
          setConciergeName(storedName);
        }
      }
    };

    loadConciergeName();
  }, []);

  const handleBackToLogin = async () => {
    await logout();
    navigate("/concierge/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={coliseuIcon} alt="Coliseu" className="w-8 h-8" />
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  PORTARIA
                </h1>
              </div>
            )}
          </div>
        </div>
        {!collapsed && (
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <User className="w-3 h-3" />
              <span className="truncate">{conciergeName}</span>
            </div>
          </div>
        )}

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

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleBackToLogin}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Voltar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
