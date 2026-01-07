import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarConcierge } from "./AppSidebarConcierge";

export function AppLayoutConcierge() {
	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<AppSidebarConcierge />
				<main className="flex-1 overflow-y-auto">
					<div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
						<SidebarTrigger />
					</div>
					<div className="container mx-auto p-6">
						<Outlet />
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
