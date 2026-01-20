import { useState, useEffect, useMemo } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
	Search,
	User,
	Building2,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Check,
	Eye,
	Home,
} from "lucide-react";
import { toast } from "sonner";
import ResidentsAndApartmentsSkeleton from "@/skeleton/admin/ResidentsAndApartmentsSkeleton";
import { apartmentsService, adminService, type Apartment } from "@/services/api";
import { cn } from "@/lib/utils";

// Tipos
interface Resident {
	_id: string;
	name: string;
	email: string;
	phone?: string;
	apartmentId: string;
	apartmentNumber?: string;
	apartmentFloor?: number;
	apartmentBlock?: string;
	createdAt?: string;
	updatedAt?: string;
}

type ViewMode = "residents" | "apartments";
type ResidentFilterBy = "name" | "phone" | "email";
type ApartmentFilterBy = "number" | "floor" | "block";

export default function ResidentsAndApartments() {
	const [isLoading, setIsLoading] = useState(true);
	const [viewMode, setViewMode] = useState<ViewMode>("residents");
	const [searchTerm, setSearchTerm] = useState("");
	const [activeSearchTerm, setActiveSearchTerm] = useState("");
	const [residentFilterBy, setResidentFilterBy] = useState<ResidentFilterBy>("name");
	const [apartmentFilterBy, setApartmentFilterBy] = useState<ApartmentFilterBy>("number");

	// Estados para condôminos
	const [residents, setResidents] = useState<Resident[]>([]);
	const [currentResidentsPage, setCurrentResidentsPage] = useState(1);
	const [residentsItemsPerPage, setResidentsItemsPerPage] = useState(10);
	const [residentsTotalPages, setResidentsTotalPages] = useState(1);
	const [residentsTotal, setResidentsTotal] = useState(0);

	// Estados para apartamentos
	const [apartments, setApartments] = useState<Apartment[]>([]);
	const [currentApartmentsPage, setCurrentApartmentsPage] = useState(1);
	const [apartmentsItemsPerPage, setApartmentsItemsPerPage] = useState(10);
	const [apartmentsTotalPages, setApartmentsTotalPages] = useState(1);
	const [apartmentsTotal, setApartmentsTotal] = useState(0);

	// Estados para modal
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
	const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
	const [isLoadingDetails, setIsLoadingDetails] = useState(false);

	// Obter buildingId do token
	const getBuildingId = (): string => {
		const token =
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token");

		if (token) {
			try {
				const tokenParts = token.split(".");
				if (tokenParts.length === 3) {
					const payload = JSON.parse(atob(tokenParts[1]));
					return payload.buildingId || payload.building_id || "";
				}
			} catch (e) {}
		}
		return "";
	};

	// Carregar apartamentos
	const loadApartments = async () => {
		try {
			const buildingId = getBuildingId();
			if (!buildingId) {
				toast.error("BuildingId não encontrado. Faça login novamente.");
				return;
			}

			const allApartments = await apartmentsService.getApartmentsByBuildingId(buildingId);
			setApartments(allApartments);
			setApartmentsTotal(allApartments.length);
		} catch (error: any) {
			console.error("Erro ao carregar apartamentos:", error);
			toast.error("Erro ao carregar apartamentos");
		}
	};

	// Carregar condôminos
	const loadResidents = async () => {
		try {
			const buildingId = getBuildingId();
			if (!buildingId) {
				toast.error("BuildingId não encontrado. Faça login novamente.");
				return;
			}

			// Se há busca ativa, usar API com filtros
			if (activeSearchTerm) {
				try {
					const response = await adminService.getResidents({
						page: currentResidentsPage,
						limit: residentsItemsPerPage,
						search: activeSearchTerm,
						filterBy: residentFilterBy,
					});

					const residentsData = response.data?.data || [];
					const total = response.data?.total || 0;
					const pages = response.data?.totalPages || 1;

					setResidents(residentsData);
					setResidentsTotal(total);
					setResidentsTotalPages(pages);
				} catch (error: any) {
					// Fallback: usar dados locais se API não disponível
					setResidents([]);
					setResidentsTotal(0);
					setResidentsTotalPages(1);
				}
			} else {
				// Sem busca, carregar todos (ou últimos)
				try {
					const response = await adminService.getResidents({
						page: 1,
						limit: 100, // Carregar mais para ter dados iniciais
					});

					const residentsData = response.data?.data || [];
					setResidents(residentsData);
					setResidentsTotal(residentsData.length);
					setResidentsTotalPages(1);
				} catch (error: any) {
					setResidents([]);
					setResidentsTotal(0);
					setResidentsTotalPages(1);
				}
			}
		} catch (error: any) {
			console.error("Erro ao carregar condôminos:", error);
			toast.error("Erro ao carregar condôminos");
		}
	};

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				await loadApartments();
				await loadResidents();
			} catch (error: any) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados");
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

	// Recarregar quando filtros ou busca mudarem
	useEffect(() => {
		if (!isLoading) {
			loadResidents();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSearchTerm, residentFilterBy, currentResidentsPage, residentsItemsPerPage]);

	// Filtrar condôminos
	const filteredResidents = useMemo(() => {
		if (!activeSearchTerm) return residents;

		const searchLower = activeSearchTerm.toLowerCase();
		return residents.filter((resident) => {
			if (residentFilterBy === "name") {
				return resident.name.toLowerCase().includes(searchLower);
			} else if (residentFilterBy === "phone") {
				return resident.phone?.toLowerCase().includes(searchLower) || false;
			} else if (residentFilterBy === "email") {
				return resident.email.toLowerCase().includes(searchLower);
			}
			return false;
		});
	}, [residents, activeSearchTerm, residentFilterBy]);

	// Filtrar apartamentos
	const filteredApartments = useMemo(() => {
		if (!activeSearchTerm) return apartments;

		const searchLower = activeSearchTerm.toLowerCase();
		return apartments.filter((apartment) => {
			if (apartmentFilterBy === "number") {
				return apartment.number.toLowerCase().includes(searchLower);
			} else if (apartmentFilterBy === "floor") {
				return apartment.floor?.toString().includes(searchLower) || false;
			} else if (apartmentFilterBy === "block") {
				return apartment.block?.toLowerCase().includes(searchLower) || false;
			}
			return false;
		});
	}, [apartments, activeSearchTerm, apartmentFilterBy]);

	// Paginação de condôminos
	const paginatedResidents = useMemo(() => {
		const startIndex = (currentResidentsPage - 1) * residentsItemsPerPage;
		const endIndex = startIndex + residentsItemsPerPage;
		return filteredResidents.slice(startIndex, endIndex);
	}, [filteredResidents, currentResidentsPage, residentsItemsPerPage]);

	// Paginação de apartamentos
	const paginatedApartments = useMemo(() => {
		const startIndex = (currentApartmentsPage - 1) * apartmentsItemsPerPage;
		const endIndex = startIndex + apartmentsItemsPerPage;
		return filteredApartments.slice(startIndex, endIndex);
	}, [filteredApartments, currentApartmentsPage, apartmentsItemsPerPage]);

	// Calcular total de páginas
	useEffect(() => {
		setResidentsTotalPages(Math.ceil(filteredResidents.length / residentsItemsPerPage) || 1);
		setApartmentsTotalPages(Math.ceil(filteredApartments.length / apartmentsItemsPerPage) || 1);
	}, [
		filteredResidents.length,
		filteredApartments.length,
		residentsItemsPerPage,
		apartmentsItemsPerPage,
	]);

	// Resetar página quando busca muda
	useEffect(() => {
		if (activeSearchTerm) {
			setCurrentResidentsPage(1);
			setCurrentApartmentsPage(1);
		}
	}, [activeSearchTerm]);

	const handleSearch = () => {
		setActiveSearchTerm(searchTerm);
		if (searchTerm) {
			setCurrentResidentsPage(1);
			setCurrentApartmentsPage(1);
		}
	};

	const handleViewResident = async (resident: Resident) => {
		setIsViewDialogOpen(true);
		setIsLoadingDetails(true);
		setSelectedResident(resident);
		setSelectedApartment(null);

		// Buscar dados do apartamento se disponível
		if (resident.apartmentId) {
			try {
				const apt = apartments.find((a) => a._id === resident.apartmentId);
				if (apt) {
					setSelectedApartment(apt);
				}
			} catch (error) {}
		}

		setIsLoadingDetails(false);
	};

	const handleViewApartment = async (apartment: Apartment) => {
		setIsViewDialogOpen(true);
		setIsLoadingDetails(true);
		setSelectedApartment(apartment);
		setSelectedResident(null);

		// Buscar condôminos do apartamento se disponível
		try {
			const aptResidents = residents.filter((r) => r.apartmentId === apartment._id);
			// Por enquanto, apenas definir o primeiro residente se houver
			if (aptResidents.length > 0) {
				// Não vamos definir selectedResident aqui, apenas mostrar no modal
			}
		} catch (error) {}

		setIsLoadingDetails(false);
	};

	if (isLoading) {
		return <ResidentsAndApartmentsSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Condôminos e Apartamentos</h1>
					<p className="text-muted-foreground">
						Visualize e pesquise condôminos e apartamentos registrados
					</p>
				</div>
			</div>

			{/* Tabs para alternar entre condôminos e apartamentos */}
			<Card>
				<CardContent className="pt-6">
					<Tabs
						value={viewMode}
						onValueChange={(value) => {
							setViewMode(value as ViewMode);
							setSearchTerm("");
							setActiveSearchTerm("");
							setCurrentResidentsPage(1);
							setCurrentApartmentsPage(1);
						}}
					>
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="residents">Condôminos</TabsTrigger>
							<TabsTrigger value="apartments">Apartamentos</TabsTrigger>
						</TabsList>

						{/* Tab de Condôminos */}
						<TabsContent value="residents" className="mt-6">
							<div className="mb-6 space-y-4">
								<div className="flex items-center gap-2">
									<div className="relative flex-1">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Digite para buscar..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													handleSearch();
												}
											}}
											className="pl-9 h-12 text-base"
										/>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" size="default" className="h-12">
												{residentFilterBy === "name" && "Nome"}
												{residentFilterBy === "phone" && "Telefone"}
												{residentFilterBy === "email" && "Email"}
												<ChevronDown className="ml-2 h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => setResidentFilterBy("name")}
												className="flex items-center justify-between"
											>
												<span>Nome</span>
												{residentFilterBy === "name" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setResidentFilterBy("phone")}
												className="flex items-center justify-between"
											>
												<span>Telefone</span>
												{residentFilterBy === "phone" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setResidentFilterBy("email")}
												className="flex items-center justify-between"
											>
												<span>Email</span>
												{residentFilterBy === "email" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
									<Button onClick={handleSearch} size="default" className="h-12">
										Buscar
									</Button>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<p className="text-sm text-muted-foreground">
										Mostrando{" "}
										{paginatedResidents.length > 0
											? (currentResidentsPage - 1) * residentsItemsPerPage + 1
											: 0}{" "}
										a{" "}
										{Math.min(
											currentResidentsPage * residentsItemsPerPage,
											filteredResidents.length,
										)}{" "}
										de {filteredResidents.length} condômino(s)
									</p>
									<div className="flex items-center gap-2">
										<Label
											htmlFor="residentsItemsPerPage"
											className="text-sm text-muted-foreground"
										>
											Itens por página:
										</Label>
										<Select
											value={residentsItemsPerPage.toString()}
											onValueChange={(value) => {
												setResidentsItemsPerPage(Number(value));
												setCurrentResidentsPage(1);
											}}
										>
											<SelectTrigger className="w-20">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="5">5</SelectItem>
												<SelectItem value="10">10</SelectItem>
												<SelectItem value="20">20</SelectItem>
												<SelectItem value="50">50</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								{filteredResidents.length === 0 ? (
									<Card>
										<CardContent className="pt-6">
											<div className="flex flex-col items-center justify-center py-12 text-center">
												<User className="w-16 h-16 text-muted-foreground/30 mb-4" />
												<p className="text-sm text-muted-foreground">Nenhum condômino encontrado</p>
											</div>
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardContent className="p-0">
											<div className="divide-y">
												{paginatedResidents.map((resident) => (
													<div
														key={resident._id}
														className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer"
														onClick={() => handleViewResident(resident)}
													>
														<div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
															<User className="w-7 h-7 text-primary" />
														</div>
														<div className="flex-1 min-w-0">
															<h3 className="font-semibold text-base mb-1 truncate">
																{resident.name}
															</h3>
															<div className="flex items-center gap-3 text-sm text-muted-foreground">
																{resident.apartmentNumber && (
																	<>
																		<span>Apt: {resident.apartmentNumber}</span>
																		{(resident.phone || resident.email) && (
																			<span className="text-muted-foreground/50">•</span>
																		)}
																	</>
																)}
																{resident.phone && (
																	<>
																		<span>{resident.phone}</span>
																		{resident.email && (
																			<span className="text-muted-foreground/50">•</span>
																		)}
																	</>
																)}
																{resident.email && <span>{resident.email}</span>}
															</div>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={(e) => {
																e.stopPropagation();
																handleViewResident(resident);
															}}
															title="Ver detalhes"
														>
															<Eye className="h-4 w-4" />
														</Button>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{residentsTotalPages > 1 && (
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setCurrentResidentsPage((prev) => Math.max(1, prev - 1))}
													disabled={currentResidentsPage === 1}
													className="gap-1"
												>
													<ChevronLeft className="h-4 w-4" />
													Anterior
												</Button>
											</PaginationItem>
											{Array.from({ length: residentsTotalPages }, (_, i) => i + 1)
												.filter((page) => {
													if (residentsTotalPages <= 7) return true;
													if (page === 1 || page === residentsTotalPages) return true;
													if (Math.abs(page - currentResidentsPage) <= 1) return true;
													return false;
												})
												.map((page, index, array) => {
													const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
													return (
														<React.Fragment key={page}>
															{showEllipsisBefore && (
																<PaginationItem>
																	<span className="px-3 py-1">...</span>
																</PaginationItem>
															)}
															<PaginationItem>
																<Button
																	variant={currentResidentsPage === page ? "default" : "outline"}
																	size="sm"
																	onClick={() => setCurrentResidentsPage(page)}
																	className="min-w-[2.5rem]"
																>
																	{page}
																</Button>
															</PaginationItem>
														</React.Fragment>
													);
												})}
											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setCurrentResidentsPage((prev) =>
															Math.min(residentsTotalPages, prev + 1),
														)
													}
													disabled={currentResidentsPage === residentsTotalPages}
													className="gap-1"
												>
													Próxima
													<ChevronRight className="h-4 w-4" />
												</Button>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								)}
							</div>
						</TabsContent>

						{/* Tab de Apartamentos */}
						<TabsContent value="apartments" className="mt-6">
							<div className="mb-6 space-y-4">
								<div className="flex items-center gap-2">
									<div className="relative flex-1">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Digite para buscar..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													handleSearch();
												}
											}}
											className="pl-9 h-12 text-base"
										/>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" size="default" className="h-12">
												{apartmentFilterBy === "number" && "Número"}
												{apartmentFilterBy === "floor" && "Andar"}
												{apartmentFilterBy === "block" && "Bloco"}
												<ChevronDown className="ml-2 h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => setApartmentFilterBy("number")}
												className="flex items-center justify-between"
											>
												<span>Número</span>
												{apartmentFilterBy === "number" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setApartmentFilterBy("floor")}
												className="flex items-center justify-between"
											>
												<span>Andar</span>
												{apartmentFilterBy === "floor" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setApartmentFilterBy("block")}
												className="flex items-center justify-between"
											>
												<span>Bloco</span>
												{apartmentFilterBy === "block" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
									<Button onClick={handleSearch} size="default" className="h-12">
										Buscar
									</Button>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<p className="text-sm text-muted-foreground">
										Mostrando{" "}
										{paginatedApartments.length > 0
											? (currentApartmentsPage - 1) * apartmentsItemsPerPage + 1
											: 0}{" "}
										a{" "}
										{Math.min(
											currentApartmentsPage * apartmentsItemsPerPage,
											filteredApartments.length,
										)}{" "}
										de {filteredApartments.length} apartamento(s)
									</p>
									<div className="flex items-center gap-2">
										<Label
											htmlFor="apartmentsItemsPerPage"
											className="text-sm text-muted-foreground"
										>
											Itens por página:
										</Label>
										<Select
											value={apartmentsItemsPerPage.toString()}
											onValueChange={(value) => {
												setApartmentsItemsPerPage(Number(value));
												setCurrentApartmentsPage(1);
											}}
										>
											<SelectTrigger className="w-20">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="5">5</SelectItem>
												<SelectItem value="10">10</SelectItem>
												<SelectItem value="20">20</SelectItem>
												<SelectItem value="50">50</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								{filteredApartments.length === 0 ? (
									<Card>
										<CardContent className="pt-6">
											<div className="flex flex-col items-center justify-center py-12 text-center">
												<Home className="w-16 h-16 text-muted-foreground/30 mb-4" />
												<p className="text-sm text-muted-foreground">
													Nenhum apartamento encontrado
												</p>
											</div>
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardContent className="p-0">
											<div className="divide-y">
												{paginatedApartments.map((apartment) => (
													<div
														key={apartment._id}
														className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer"
														onClick={() => handleViewApartment(apartment)}
													>
														<div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
															<Home className="w-7 h-7 text-primary" />
														</div>
														<div className="flex-1 min-w-0">
															<h3 className="font-semibold text-base mb-1 truncate">
																Apartamento {apartment.number}
															</h3>
															<div className="flex items-center gap-3 text-sm text-muted-foreground">
																{apartment.block && (
																	<>
																		<span>Bloco: {apartment.block}</span>
																		{apartment.floor && (
																			<span className="text-muted-foreground/50">•</span>
																		)}
																	</>
																)}
																{apartment.floor && <span>{apartment.floor}º andar</span>}
															</div>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={(e) => {
																e.stopPropagation();
																handleViewApartment(apartment);
															}}
															title="Ver detalhes"
														>
															<Eye className="h-4 w-4" />
														</Button>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{apartmentsTotalPages > 1 && (
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setCurrentApartmentsPage((prev) => Math.max(1, prev - 1))}
													disabled={currentApartmentsPage === 1}
													className="gap-1"
												>
													<ChevronLeft className="h-4 w-4" />
													Anterior
												</Button>
											</PaginationItem>
											{Array.from({ length: apartmentsTotalPages }, (_, i) => i + 1)
												.filter((page) => {
													if (apartmentsTotalPages <= 7) return true;
													if (page === 1 || page === apartmentsTotalPages) return true;
													if (Math.abs(page - currentApartmentsPage) <= 1) return true;
													return false;
												})
												.map((page, index, array) => {
													const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
													return (
														<React.Fragment key={page}>
															{showEllipsisBefore && (
																<PaginationItem>
																	<span className="px-3 py-1">...</span>
																</PaginationItem>
															)}
															<PaginationItem>
																<Button
																	variant={currentApartmentsPage === page ? "default" : "outline"}
																	size="sm"
																	onClick={() => setCurrentApartmentsPage(page)}
																	className="min-w-[2.5rem]"
																>
																	{page}
																</Button>
															</PaginationItem>
														</React.Fragment>
													);
												})}
											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setCurrentApartmentsPage((prev) =>
															Math.min(apartmentsTotalPages, prev + 1),
														)
													}
													disabled={currentApartmentsPage === apartmentsTotalPages}
													className="gap-1"
												>
													Próxima
													<ChevronRight className="h-4 w-4" />
												</Button>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Modal de Detalhes */}
			<Dialog
				open={isViewDialogOpen}
				onOpenChange={(open) => {
					setIsViewDialogOpen(open);
					if (!open) {
						setSelectedResident(null);
						setSelectedApartment(null);
					}
				}}
			>
				<DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
					<DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
						<DialogTitle className="flex items-center gap-2">
							{selectedResident ? (
								<>
									<User className="w-5 h-5 text-primary" />
									Detalhes do Condômino
								</>
							) : (
								<>
									<Home className="w-5 h-5 text-primary" />
									Detalhes do Apartamento
								</>
							)}
						</DialogTitle>
					</DialogHeader>

					{isLoadingDetails ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						</div>
					) : selectedResident ? (
						<div className="overflow-y-auto px-6 flex-1 min-h-0">
							<div className="space-y-4">
								<div className="flex flex-col items-center">
									<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
										<span className="text-3xl font-bold text-primary">
											{selectedResident.name.charAt(0).toUpperCase()}
										</span>
									</div>
									<p className="font-semibold text-lg mt-3">{selectedResident.name}</p>
								</div>

								<div className="space-y-3">
									{selectedResident.email && (
										<div>
											<Label className="text-muted-foreground">Email</Label>
											<p className="font-medium">{selectedResident.email}</p>
										</div>
									)}

									{selectedResident.phone && (
										<div>
											<Label className="text-muted-foreground">Telefone</Label>
											<p className="font-medium">{selectedResident.phone}</p>
										</div>
									)}

									{selectedApartment && (
										<div>
											<Label className="text-muted-foreground">Apartamento</Label>
											<p className="font-medium">
												{selectedApartment.block && `Bloco ${selectedApartment.block} - `}
												Apartamento {selectedApartment.number}
												{selectedApartment.floor && ` (${selectedApartment.floor}º andar)`}
											</p>
										</div>
									)}

									{selectedResident.createdAt && (
										<div>
											<Label className="text-muted-foreground">Data de Registro</Label>
											<p className="font-medium">
												{new Date(selectedResident.createdAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					) : selectedApartment ? (
						<div className="overflow-y-auto px-6 flex-1 min-h-0">
							<div className="space-y-4">
								<div className="flex flex-col items-center">
									<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
										<Home className="w-12 h-12 text-primary" />
									</div>
									<p className="font-semibold text-lg mt-3">
										Apartamento {selectedApartment.number}
									</p>
								</div>

								<div className="space-y-3">
									{selectedApartment.block && (
										<div>
											<Label className="text-muted-foreground">Bloco</Label>
											<p className="font-medium">{selectedApartment.block}</p>
										</div>
									)}

									{selectedApartment.floor && (
										<div>
											<Label className="text-muted-foreground">Andar</Label>
											<p className="font-medium">{selectedApartment.floor}º andar</p>
										</div>
									)}

									{selectedApartment.status && (
										<div>
											<Label className="text-muted-foreground">Status</Label>
											<p className="font-medium">{selectedApartment.status}</p>
										</div>
									)}

									{selectedApartment.createdAt && (
										<div>
											<Label className="text-muted-foreground">Data de Registro</Label>
											<p className="font-medium">
												{new Date(selectedApartment.createdAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									)}

									{/* Lista de condôminos do apartamento */}
									{(() => {
										const aptResidents = residents.filter(
											(r) => r.apartmentId === selectedApartment._id,
										);
										if (aptResidents.length > 0) {
											return (
												<div>
													<Label className="text-muted-foreground">Condôminos</Label>
													<div className="space-y-2 mt-2">
														{aptResidents.map((resident) => (
															<div key={resident._id} className="p-2 bg-accent/30 rounded-lg">
																<p className="font-medium">{resident.name}</p>
																{resident.email && (
																	<p className="text-sm text-muted-foreground">{resident.email}</p>
																)}
																{resident.phone && (
																	<p className="text-sm text-muted-foreground">{resident.phone}</p>
																)}
															</div>
														))}
													</div>
												</div>
											);
										}
										return null;
									})()}
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
