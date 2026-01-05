import {
  LayoutDashboard,
  Package,
  // AlertTriangle, // Temporariamente desabilitado (Multas)
  LogOut,
  Shield,
  User,
  UserCheck,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { logout, user } = useAuth();
  const collapsed = state === "collapsed";

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

  // Dados do usuário (prioriza dados do contexto, fallback para mock)
  const userDisplayName = user?.name || "Porteiro";
  const userDisplayEmail = user?.email || "";

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

        <SidebarGroup className="flex-1 flex items-center">
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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-2 hover:bg-sidebar-accent"
            >
              <div className="flex items-center gap-2 w-full min-w-0">
                <User className="h-5 w-5 shrink-0 text-sidebar-foreground" />
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left flex flex-col">
                      <span className="text-sm font-medium text-sidebar-foreground truncate">
                        {userDisplayName}
                      </span>
                      {userDisplayEmail && (
                        <span className="text-xs text-sidebar-foreground/70 truncate">
                          {userDisplayEmail}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
                  </>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align={collapsed ? "start" : "end"}
            className="w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                {userDisplayEmail && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {userDisplayEmail}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBackToLogin} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Voltar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
