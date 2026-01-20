import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, User, ExternalLink, UserCheck, Calendar, Inbox, ChevronDown } from "lucide-react";
import DashboardSkeleton from "@/skeleton/concierge/DashboardSkeleton";
import { toast } from "sonner";
import { packageService, visitsService, type RecentVisit } from "@/services/api";
import { usePageRefresh } from "@/hooks/use-page-refresh";

interface PackageData {
	id: string;
	recipientName: string;
	description: string;
	apartmentNumber: string;
	apartmentFloor?: number;
	apartmentBlock?: string;
	arrivalDate: string;
}

export default function ConciergeDashboard() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [pendingPackages, setPendingPackages] = useState<PackageData[]>([]);
	const [apartmentWithMostPackages, setApartmentWithMostPackages] = useState<{
		apartment: string;
		packageCount: number;
	} | null>(null);
	const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
	const [packagesOpen, setPackagesOpen] = useState(true);
	const [visitsOpen, setVisitsOpen] = useState(true);

	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			const [pendingResponse, recentVisitsResponse] = await Promise.all([
				packageService.getPackages({ status: "PENDENTE" }),
				visitsService.getRecentVisits(3),
			]);

			const pending = pendingResponse.data || [];

			// Map pending packages
			const pendingMapped: PackageData[] = pending.map((pkg) => ({
				id: pkg._id,
				recipientName: pkg.ownerName,
				description: pkg.description,
				apartmentNumber: pkg.apartmentNumber,
				apartmentFloor: pkg.apartmentFloor,
				apartmentBlock: pkg.apartmentBlock,
				arrivalDate: pkg.receiverDate,
			}));

			// Calculate apartment with most packages
			const apartmentCounts: { [key: string]: number } = {};
			for (const pkg of pendingMapped) {
				apartmentCounts[pkg.apartmentNumber] = (apartmentCounts[pkg.apartmentNumber] || 0) + 1;
			}

			const sortedApartments = Object.entries(apartmentCounts).sort((a, b) => b[1] - a[1]);

			if (sortedApartments.length > 0) {
				const [apartment, count] = sortedApartments[0];
				setApartmentWithMostPackages({
					apartment,
					packageCount: count,
				});
			}

			setPendingPackages(pendingMapped);
			setRecentVisits(recentVisitsResponse.data || []);
		} catch (error: any) {
			toast.error(error.message || "Erro ao carregar dados do dashboard");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Register refresh function for pull-to-refresh
	usePageRefresh({ onRefresh: loadData });

	useEffect(() => {
		loadData();
	}, [loadData]);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold">Dashboard da Portaria</h1>
				<p className="text-sm sm:text-base text-muted-foreground">Visão geral das encomendas e atividades</p>
			</div>

			{/* Pending Packages List */}
			<Collapsible open={packagesOpen} onOpenChange={setPackagesOpen}>
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CollapsibleTrigger asChild>
								<div className="flex items-center gap-2 cursor-pointer">
									<CardTitle className="flex items-center gap-2">
										<Package className="w-5 h-5 text-primary" />
										Encomendas Pendentes
										{pendingPackages.length > 0 && (
											<span className="text-xs font-normal bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
												{pendingPackages.length}
											</span>
										)}
									</CardTitle>
									<ChevronDown
										className={`w-4 h-4 text-muted-foreground transition-transform ${packagesOpen ? "rotate-180" : ""}`}
									/>
								</div>
							</CollapsibleTrigger>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigate("/concierge/packages")}
								className="gap-2"
							>
								Ver todas
								<ExternalLink className="w-4 h-4" />
							</Button>
						</div>
					</CardHeader>
					<CollapsibleContent>
						<CardContent className="pt-0">
							<div className="space-y-2">
								{pendingPackages.length === 0 ? (
									<div className="p-4 border rounded-lg text-center text-muted-foreground">
										Nenhuma encomenda pendente encontrada
									</div>
								) : (
									pendingPackages.map((pkg) => (
										<div
											key={pkg.id}
											className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
										>
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
													<Inbox className="w-4 h-4 text-amber-600" />
												</div>
												<div className="min-w-0">
													<p className="font-medium text-sm truncate">{pkg.recipientName}</p>
													<p className="text-xs text-muted-foreground">
														{new Date(pkg.arrivalDate).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															hour: "2-digit",
															minute: "2-digit",
														})}
														{pkg.description ? ` • ${pkg.description}` : ""}
													</p>
												</div>
											</div>
											<div className="flex-shrink-0 ml-2">
												<span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
													{pkg.apartmentBlock ? `${pkg.apartmentBlock}-` : ""}
													{pkg.apartmentNumber}
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</CollapsibleContent>
				</Card>
			</Collapsible>

			{/* Recent Visits */}
			<Collapsible open={visitsOpen} onOpenChange={setVisitsOpen}>
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CollapsibleTrigger asChild>
								<div className="flex items-center gap-2 cursor-pointer">
									<CardTitle className="flex items-center gap-2">
										<UserCheck className="w-5 h-5 text-primary" />
										Visitas Recentes
										{recentVisits.length > 0 && (
											<span className="text-xs font-normal bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
												{recentVisits.length}
											</span>
										)}
									</CardTitle>
									<ChevronDown
										className={`w-4 h-4 text-muted-foreground transition-transform ${visitsOpen ? "rotate-180" : ""}`}
									/>
								</div>
							</CollapsibleTrigger>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigate("/concierge/visitors")}
								className="gap-2"
							>
								Ver todas
								<ExternalLink className="w-4 h-4" />
							</Button>
						</div>
					</CardHeader>
					<CollapsibleContent>
						<CardContent className="pt-0">
							<div className="space-y-2">
								{recentVisits.length === 0 ? (
									<div className="p-4 border rounded-lg text-center text-muted-foreground">
										Nenhuma visita registrada recentemente
									</div>
								) : (
									recentVisits.map((visit) => (
										<div
											key={visit._id}
											className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
										>
											<div className="flex items-center gap-3">
												{visit.visitor.photoUrl ? (
													<img
														src={visit.visitor.photoUrl}
														alt={visit.visitor.name}
														className="w-9 h-9 rounded-full object-cover border border-primary/20"
													/>
												) : (
													<div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
														<User className="w-4 h-4 text-primary" />
													</div>
												)}
												<div className="min-w-0">
													<p className="font-medium text-sm truncate">{visit.visitor.name}</p>
													<p className="text-xs text-muted-foreground">
														{new Date(visit.registeredAt).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															hour: "2-digit",
															minute: "2-digit",
														})}
														{visit.note ? ` • ${visit.note}` : ""}
													</p>
												</div>
											</div>
											{visit.apartment && (
												<div className="flex-shrink-0 ml-2">
													<span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
														{visit.apartment.block ? `${visit.apartment.block}-` : ""}
														{visit.apartment.number}
													</span>
												</div>
											)}
										</div>
									))
								)}
							</div>
						</CardContent>
					</CollapsibleContent>
				</Card>
			</Collapsible>

			{/* Apartment with Most Packages */}
			{apartmentWithMostPackages && (
				<Card className="border-2 border-primary/50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="w-5 h-5 text-primary" />
							Apartamento com Mais Encomendas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
								<div>
									<p className="text-2xl font-bold">
										Apartamento {apartmentWithMostPackages.apartment}
									</p>
									<p className="text-sm text-muted-foreground">
										{apartmentWithMostPackages.packageCount} encomenda(s) pendente(s)
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
