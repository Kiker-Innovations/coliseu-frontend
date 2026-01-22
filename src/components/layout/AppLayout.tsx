import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const AppLayout = () => {
	return (
		<SidebarProvider>
			<div className="min-h-screen flex w-full">
				<AppSidebar />
				<div className="flex-1 flex flex-col">
					<header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center border-b border-border bg-card px-3 sm:h-14 sm:px-4 shrink-0">
						<SidebarTrigger />
					</header>
					<main className="flex-1 overflow-y-auto p-3 pt-[60px] sm:p-4 sm:pt-[72px] md:p-6 md:pt-[72px]">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
};
