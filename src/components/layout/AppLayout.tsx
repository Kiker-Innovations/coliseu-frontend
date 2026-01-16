import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const AppLayout = () => {
	return (
		<SidebarProvider>
			<div className="min-h-screen flex w-full">
				<AppSidebar />
				<div className="flex-1 flex flex-col">
					<header className="flex h-12 items-center border-b border-border bg-card px-3 sm:h-14 sm:px-4">
						<SidebarTrigger />
					</header>
					<main className="flex-1 p-4 sm:p-5 md:p-6">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
};
