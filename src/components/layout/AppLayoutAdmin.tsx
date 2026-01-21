import { Outlet } from "react-router-dom";
import { AppSidebarAdmin } from "./AppSidebarAdmin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RefreshProvider } from "@/contexts/RefreshContext";
import { PullToRefreshWrapper } from "@/components/ui/pull-to-refresh";

export const AppLayoutAdmin = () => {
	return (
		<RefreshProvider>
		<SidebarProvider>
			<div className="min-h-screen flex w-full">
				<AppSidebarAdmin />
					<div className="flex-1 flex flex-col overflow-hidden">
						<header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border bg-card px-3 sm:h-14 sm:px-4 sm:gap-4 shrink-0">
						<SidebarTrigger />
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="font-medium truncate">Painel Administrativo</span>
						</div>
					</header>
						<PullToRefreshWrapper className="flex-1 overflow-y-auto">
							<main className="flex-1 bg-background p-3 sm:p-4 md:p-6">
						<Outlet />
					</main>
						</PullToRefreshWrapper>
				</div>
			</div>
		</SidebarProvider>
		</RefreshProvider>
	);
};
