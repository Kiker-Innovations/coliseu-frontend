import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarConcierge } from "./AppSidebarConcierge";

export function AppLayoutConcierge() {
	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<AppSidebarConcierge />
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background px-4 sm:h-14 sm:px-6 sm:gap-4 shrink-0">
						<SidebarTrigger />
					</div>
					<main className="flex-1 overflow-y-auto container mx-auto px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
