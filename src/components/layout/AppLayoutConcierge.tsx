import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarConcierge } from "./AppSidebarConcierge";

export function AppLayoutConcierge() {
	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<AppSidebarConcierge />
				<main className="flex-1 overflow-y-auto">
					<div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background px-4 sm:h-14 sm:px-6 sm:gap-4">
						<SidebarTrigger />
					</div>
					<div className="container mx-auto px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
						<Outlet />
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
