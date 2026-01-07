import { Outlet } from "react-router-dom";
import { AppSidebarAdmin } from "./AppSidebarAdmin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const AppLayoutAdmin = () => {
	return (
		<SidebarProvider>
			<div className="min-h-screen flex w-full">
				<AppSidebarAdmin />
				<div className="flex-1 flex flex-col">
					<header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
						<SidebarTrigger />
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="font-medium">Painel Administrativo</span>
						</div>
					</header>
					<main className="flex-1 p-6 bg-background">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
};
