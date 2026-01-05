import {
  LayoutDashboard,
  Lightbulb,
  Vote,
  TrendingUp,
  MessageSquare,
  FileText,
  AlertTriangle,
  Package,
  Calendar,
  LogOut,
  Megaphone,
  User,
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
  { title: "Painel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Sugestão", url: "/suggestions", icon: Lightbulb },
  { title: "Votar", url: "/vote", icon: Vote },
  { title: "Progresso", url: "/progress", icon: TrendingUp },
  { title: "Enquete", url: "/poll", icon: MessageSquare },
  { title: "Multas", url: "/fines", icon: AlertTriangle },
  { title: "Documentos", url: "/documents", icon: FileText },
  { title: "Avisos", url: "/notices", icon: Megaphone },
  { title: "Encomendas", url: "/packages", icon: Package },
  { title: "Reservas", url: "/bookings", icon: Calendar },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  // Dados do usuário (prioriza dados do contexto, fallback para mock)
  const userDisplayName = user?.name || "Morador";
  const userDisplayEmail = user?.email || "";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <img src={coliseuIcon} alt="Coliseu" className="w-8 h-8" />
          {!collapsed && (
            <h1 className="text-xl font-bold text-sidebar-foreground">
              COLISEU
            </h1>
          )}
        </div>

        <SidebarGroup className="flex-1 flex items-center">
          <SidebarGroupContent className="w-full">
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
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
