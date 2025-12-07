import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  // AlertTriangle, // Temporariamente desabilitado (Multas)
  LogOut,
  Shield,
  User,
  UserCheck,
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
import coliseuIcon from "@/assets/coliseu-icon.png";

const menuItems = [
  { title: "Dashboard", url: "/concierge/dashboard", icon: LayoutDashboard },
  { title: "Encomendas", url: "/concierge/packages", icon: Package },
  // { title: "Multas", url: "/concierge/fines", icon: AlertTriangle }, // Temporariamente desabilitado
  { title: "Visitantes", url: "/concierge/visitors", icon: UserCheck },
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
    const loadConciergeName = () => {
      // Extract name from token (rota /concierges/me não existe mais)
      const token = localStorage.getItem("coliseu_access_token") || 
                    sessionStorage.getItem("coliseu_access_token") ||
                    localStorage.getItem("concierge_token") || 
                    sessionStorage.getItem("concierge_token") ||
                    localStorage.getItem("coliseu_access_token") ||
                    sessionStorage.getItem("coliseu_access_token");
      
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.name) {
              setConciergeName(payload.name);
              localStorage.setItem("concierge_name", payload.name);
              return;
            }
          }
        } catch (decodeError) {
          console.warn("Não foi possível decodificar token:", decodeError);
        }
      }
      
      // Fallback: tentar pegar do localStorage
      const storedName = localStorage.getItem("concierge_name");
      if (storedName) {
        setConciergeName(storedName);
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
