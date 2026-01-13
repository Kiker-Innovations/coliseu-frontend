import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const AppLayout = () => {
	return (
		<SidebarProvider>
			<div className="min-h-screen flex w-full">
				<AppSidebar />
				<div className="flex-1 flex flex-col">
					<header className="h-14 border-b border-border bg-card flex items-center px-4">
						<SidebarTrigger />
					</header>
					<main className="flex-1 p-6">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
};
