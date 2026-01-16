import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	AlertTriangle,
	Bell,
	DollarSign,
	Search,
	Plus,
	Edit,
	Trash2,
	Filter,
	Eye,
	CheckCircle2,
	XCircle,
	Download,
	FileText,
	Clock,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	fineCreateSchema,
	fineUpdateSchema,
	infractionFineSchema,
	infractionNotificationSchema,
	type FineCreateSchema,
	type FineUpdateSchema,
	type InfractionFineSchema,
	type InfractionNotificationSchema,
} from "@/schemas/admin/fines.schema";
import {
	finesService,
	infractionsService,
	apartmentsService,
	adminService,
	type BaseFine,
	type Infraction,
	type ApartmentWithInfractions,
	type Apartment,
	ApiClientError,
} from "@/services/api";
import FinesSkeleton from "@/skeleton/admin/FinesSkeleton";

interface ApartmentWithResidents extends Apartment {
	residents: Array<{
		_id: string;
		name: string;
		email: string;
		phone?: string;
	}>;
	pendingFines: number;
	finesInReview: number;
	notifications: Infraction[];
	fines: Infraction[];
}

export default function Fines() {
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"apartments" | "fines">("apartments");

	// Estados para Apartamentos
	const [apartments, setApartments] = useState<ApartmentWithResidents[]>([]);
	const [fines, setFines] = useState<BaseFine[]>([]);
	const [allInfractions, setAllInfractions] = useState<Infraction[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterPendingFines, setFilterPendingFines] = useState(true);
	const [filterFinesInReview, setFilterFinesInReview] = useState(true);
	const [finesViewType, setFinesViewType] = useState<"pending" | "inReview" | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	// Estados para Dialogs de Infraction
	const [isInfractionDialogOpen, setIsInfractionDialogOpen] = useState(false);
	const [isApartmentDetailsDialogOpen, setIsApartmentDetailsDialogOpen] = useState(false);
	const [isPendingFinesDialogOpen, setIsPendingFinesDialogOpen] = useState(false);
	const [isInReviewFinesDialogOpen, setIsInReviewFinesDialogOpen] = useState(false);
	const [selectedApartment, setSelectedApartment] = useState<ApartmentWithResidents | null>(null);
	const [selectedApartmentForFines, setSelectedApartmentForFines] =
		useState<ApartmentWithResidents | null>(null);
	const [infractionType, setInfractionType] = useState<"fine" | "notification">("fine");

	// Estados para Dialogs de Fine
	const [isFineDialogOpen, setIsFineDialogOpen] = useState(false);
	const [isDeleteFineDialogOpen, setIsDeleteFineDialogOpen] = useState(false);
	const [selectedFine, setSelectedFine] = useState<BaseFine | null>(null);
	const [isEditingFine, setIsEditingFine] = useState(false);

	// Estados para Dialog de Contestação
	const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
	const [selectedInfractionForAppeal, setSelectedInfractionForAppeal] = useState<Infraction | null>(
		null,
	);
	const [appealData, setAppealData] = useState<{
		text: string;
		fileName: string;
		fileSize: number;
		url: string;
		createdAt: string;
	} | null>(null);
	const [isLoadingAppeal, setIsLoadingAppeal] = useState(false);
	const [isProcessingAppeal, setIsProcessingAppeal] = useState(false);

	// Forms
	const infractionFineForm = useForm<InfractionFineSchema>({
		resolver: zodResolver(infractionFineSchema),
		defaultValues: {
			fineId: "",
			apartmentId: "",
			value: 0.01,
			occurrenceDate: new Date().toISOString(),
		},
	});

	const infractionNotificationForm = useForm<InfractionNotificationSchema>({
		resolver: zodResolver(infractionNotificationSchema),
		defaultValues: {
			fineId: "",
			apartmentId: "",
			description: "",
			occurrenceDate: new Date().toISOString(),
		},
	});

	const fineForm = useForm<FineCreateSchema | FineUpdateSchema>({
		resolver: zodResolver(isEditingFine ? fineUpdateSchema : fineCreateSchema),
		defaultValues: {
			name: "",
			description: "",
			value: 0,
		},
	});

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
			} catch (e) {
				// Erro ao decodificar token - ignorado
			}
		}
		return "";
	};

	// Função helper para construir apartments com residents e infractions
	const buildApartmentsWithResidents = async (buildingId: string) => {
		// Buscar todos os apartamentos
		const allApartments = await apartmentsService
			.getApartmentsByBuildingId(buildingId)
			.catch(() => []);

		// Buscar apartamentos com infractions
		const apartmentsWithInfractions = await infractionsService.getInfractions().catch(() => []);

		// Buscar todos os residents
		let allResidents: Array<any> = [];
		try {
			const residentsData = await adminService.getResidents({ page: 1, limit: 1000 });
			allResidents = residentsData.data?.data || [];
		} catch (err) {
			console.error("Erro ao buscar residents:", err);
		}

		// Criar um mapa de apartamentos com infractions para facilitar lookup
		const apartmentsWithInfractionsMap = new Map<string, ApartmentWithInfractions>();
		apartmentsWithInfractions.forEach((apt) => {
			apartmentsWithInfractionsMap.set(apt._id, apt);
		});

		// Criar um mapa de residents por apartmentId
		const residentsByApartmentId = new Map<
			string,
			Array<{ _id: string; name: string; email: string; phone?: string }>
		>();
		allResidents.forEach((resident: any) => {
			const apartmentId = resident.apartmentId ? String(resident.apartmentId) : null;
			if (apartmentId) {
				if (!residentsByApartmentId.has(apartmentId)) {
					residentsByApartmentId.set(apartmentId, []);
				}
				residentsByApartmentId.get(apartmentId)!.push({
					_id: String(resident._id),
					name: String(resident.name),
					email: String(resident.email),
					phone: resident.phone ? String(resident.phone) : undefined,
				});
			}
		});

		// Mapear todos os apartamentos, incluindo os sem infractions
		const apartmentsWithResidents: ApartmentWithResidents[] = allApartments.map(
			(apt: Apartment) => {
				const aptWithInfractions = apartmentsWithInfractionsMap.get(apt._id);
				const aptResidents =
					residentsByApartmentId.get(apt._id) || aptWithInfractions?.residents || [];

				if (aptWithInfractions) {
					// Apartamento com infractions
					const pendingCount = aptWithInfractions.infractions.filter(
						(inf) => inf.type === "MULTA" && inf.status === "PENDENTE",
					).length;
					const inReviewCount = aptWithInfractions.infractions.filter(
						(inf) => inf.type === "MULTA" && inf.status === "EM_REVISAO",
					).length;

					const aptNotifications = aptWithInfractions.infractions.filter(
						(inf) => inf.type === "NOTIFICACAO",
					);

					const aptFines = aptWithInfractions.infractions.filter((inf) => inf.type === "MULTA");

					return {
						_id: apt._id,
						buildingId: apt.buildingId,
						number: apt.number,
						block: apt.block || "",
						floor: apt.floor || 0,
						status: apt.status || "DESOCUPADO",
						createdAt: apt.createdAt || new Date().toISOString(),
						updatedAt: apt.updatedAt || new Date().toISOString(),
						residents: aptResidents,
						pendingFines: pendingCount,
						finesInReview: inReviewCount,
						notifications: aptNotifications,
						fines: aptFines,
					};
				} else {
					// Apartamento sem infractions
					return {
						_id: apt._id,
						buildingId: apt.buildingId,
						number: apt.number,
						block: apt.block || "",
						floor: apt.floor || 0,
						status: apt.status || "DESOCUPADO",
						createdAt: apt.createdAt || new Date().toISOString(),
						updatedAt: apt.updatedAt || new Date().toISOString(),
						residents: aptResidents,
						pendingFines: 0,
						finesInReview: 0,
						notifications: [],
						fines: [],
					};
				}
			},
		);

		// Flatten infractions para compatibilidade com código existente
		const allInfractions = apartmentsWithInfractions.flatMap((apt) => apt.infractions);

		return { apartmentsWithResidents, infractionsData: allInfractions };
	};

	// Carregar dados
	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			const buildingId = getBuildingId();
			if (!buildingId) {
				toast.error("BuildingId não encontrado. Faça login novamente.");
				return;
			}

			// Carregar multas base e infrações
			const [finesData, { apartmentsWithResidents, infractionsData }] = await Promise.all([
				finesService.getAllFines().catch(() => []),
				buildApartmentsWithResidents(buildingId),
			]);

			setFines(finesData);
			setAllInfractions(infractionsData);
			setApartments(apartmentsWithResidents);
		} catch (error: any) {
			toast.error("Erro ao carregar dados");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Filtrar apartamentos
	const filteredApartments = useMemo(() => {
		let filtered = apartments;

		// Filtro de busca
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(apt) =>
					apt.number.toLowerCase().includes(searchLower) ||
					apt.residents.some(
						(r) =>
							r.name.toLowerCase().includes(searchLower) ||
							r.email.toLowerCase().includes(searchLower),
					),
			);
		}

		// Filtro de multas pendentes
		if (filterPendingFines) {
			filtered = filtered.filter((apt) => apt.pendingFines > 0);
		}

		// Filtro de multas em análise
		if (filterFinesInReview) {
			filtered = filtered.filter((apt) => apt.finesInReview > 0);
		}

		return filtered;
	}, [apartments, searchTerm, filterPendingFines, filterFinesInReview]);

	// Paginação
	const totalPages = Math.ceil(filteredApartments.length / itemsPerPage);
	const paginatedApartments = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredApartments.slice(startIndex, endIndex);
	}, [filteredApartments, currentPage, itemsPerPage]);

	// Reset page quando filtros mudarem
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterPendingFines, filterFinesInReview]);

	// Handlers para Infractions
	const handleOpenInfractionDialog = (
		apartment: ApartmentWithResidents,
		type: "fine" | "notification",
	) => {
		setSelectedApartment(apartment);
		setInfractionType(type);
		const occurrenceDateISO = new Date().toISOString();

		if (type === "fine") {
			infractionFineForm.reset({
				fineId: fines[0]?._id || "",
				apartmentId: apartment._id,
				value: 0.01,
				occurrenceDate: occurrenceDateISO,
			});
		} else {
			infractionNotificationForm.reset({
				fineId: fines[0]?._id || "",
				apartmentId: apartment._id,
				description: "",
				occurrenceDate: occurrenceDateISO,
			});
		}
		setIsInfractionDialogOpen(true);
	};

	const handleCloseInfractionDialog = () => {
		setIsInfractionDialogOpen(false);
		setSelectedApartment(null);
		infractionFineForm.reset();
		infractionNotificationForm.reset();
	};

	// Handlers para Contestação
	const handleViewAppeal = async (infraction: Infraction) => {
		try {
			setIsLoadingAppeal(true);
			setSelectedInfractionForAppeal(infraction);
			const appeal = await infractionsService.getInfractionAppealForAdmin(infraction._id);
			setAppealData({
				text: appeal.text,
				fileName: appeal.fileName,
				fileSize: appeal.fileSize,
				url: appeal.url,
				createdAt: appeal.createdAt,
			});
			setIsAppealDialogOpen(true);
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao carregar contestação");
			} else {
				toast.error("Erro ao carregar contestação");
			}
		} finally {
			setIsLoadingAppeal(false);
		}
	};

	const handleCloseAppealDialog = () => {
		setIsAppealDialogOpen(false);
		setSelectedInfractionForAppeal(null);
		setAppealData(null);
	};

	const handleApproveAppeal = async () => {
		if (!selectedInfractionForAppeal) return;

		const apartmentToUpdate = selectedApartment || selectedApartmentForFines;
		if (!apartmentToUpdate) return;

		try {
			setIsProcessingAppeal(true);
			await infractionsService.approveAppeal(selectedInfractionForAppeal._id);
			toast.success("Contestação aprovada! A multa foi cancelada.");
			handleCloseAppealDialog();

			// Recarregar dados e atualizar selectedApartment e selectedApartmentForFines
			const buildingId = getBuildingId();
			if (buildingId) {
				const { apartmentsWithResidents, infractionsData } =
					await buildApartmentsWithResidents(buildingId);
				setAllInfractions(infractionsData);
				setApartments(apartmentsWithResidents);

				// Atualizar selectedApartment com os novos dados
				const updatedApartment = apartmentsWithResidents.find(
					(apt) => apt._id === apartmentToUpdate._id,
				);
				if (updatedApartment) {
					if (selectedApartment) {
						setSelectedApartment(updatedApartment);
					}
					if (selectedApartmentForFines) {
						setSelectedApartmentForFines(updatedApartment);
					}
				}
			}
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao aprovar contestação");
			} else {
				toast.error("Erro ao aprovar contestação");
			}
		} finally {
			setIsProcessingAppeal(false);
		}
	};

	const handleRejectAppeal = async () => {
		if (!selectedInfractionForAppeal) return;

		const apartmentToUpdate = selectedApartment || selectedApartmentForFines;
		if (!apartmentToUpdate) return;

		try {
			setIsProcessingAppeal(true);
			await infractionsService.rejectAppeal(selectedInfractionForAppeal._id);
			toast.success("Contestação reprovada! A multa voltou para pendente.");
			handleCloseAppealDialog();

			// Recarregar dados e atualizar selectedApartment e selectedApartmentForFines
			const buildingId = getBuildingId();
			if (buildingId) {
				const { apartmentsWithResidents, infractionsData } =
					await buildApartmentsWithResidents(buildingId);
				setAllInfractions(infractionsData);
				setApartments(apartmentsWithResidents);

				// Atualizar selectedApartment com os novos dados
				const updatedApartment = apartmentsWithResidents.find(
					(apt) => apt._id === apartmentToUpdate._id,
				);
				if (updatedApartment) {
					if (selectedApartment) {
						setSelectedApartment(updatedApartment);
					}
					if (selectedApartmentForFines) {
						setSelectedApartmentForFines(updatedApartment);
					}
				}
			}
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao reprovar contestação");
			} else {
				toast.error("Erro ao reprovar contestação");
			}
		} finally {
			setIsProcessingAppeal(false);
		}
	};

	const onSubmitInfractionFine = async (data: InfractionFineSchema) => {
		try {
			if (!data.fineId || !data.apartmentId) {
				toast.error("Selecione uma multa base");
				return;
			}
			// Converter datetime-local para ISO string
			const occurrenceDate = new Date(data.occurrenceDate).toISOString();
			await infractionsService.createFineInfraction({
				fineId: data.fineId,
				apartmentId: data.apartmentId,
				value: data.value,
				occurrenceDate,
			});
			toast.success("Multa aplicada com sucesso!");
			handleCloseInfractionDialog();
			loadData();
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao aplicar multa");
			} else {
				toast.error("Erro ao aplicar multa");
			}
		}
	};

	const onSubmitInfractionNotification = async (data: InfractionNotificationSchema) => {
		try {
			if (!data.fineId || !data.apartmentId) {
				toast.error("Selecione uma multa/notificação base");
				return;
			}
			// Converter datetime-local para ISO string
			const occurrenceDate = new Date(data.occurrenceDate).toISOString();
			await infractionsService.createNotificationInfraction({
				fineId: data.fineId,
				apartmentId: data.apartmentId,
				description: data.description,
				occurrenceDate,
			});
			toast.success("Notificação enviada com sucesso!");
			handleCloseInfractionDialog();
			loadData();
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao enviar notificação");
			} else {
				toast.error("Erro ao enviar notificação");
			}
		}
	};

	// Handlers para Fines
	const handleOpenFineDialog = (fine?: BaseFine) => {
		if (fine) {
			setSelectedFine(fine);
			setIsEditingFine(true);
			fineForm.reset({
				name: fine.name,
				description: fine.description,
				value: fine.value,
			});
		} else {
			setSelectedFine(null);
			setIsEditingFine(false);
			fineForm.reset({
				name: "",
				description: "",
				value: 0,
			});
		}
		setIsFineDialogOpen(true);
	};

	const handleCloseFineDialog = () => {
		setIsFineDialogOpen(false);
		setSelectedFine(null);
		setIsEditingFine(false);
		fineForm.reset();
	};

	const onSubmitFine = async (data: FineCreateSchema | FineUpdateSchema) => {
		try {
			if (isEditingFine && selectedFine) {
				await finesService.updateFine(selectedFine._id, data as FineUpdateSchema);
				toast.success("Multa atualizada com sucesso!");
			} else {
				if (!data.name || !data.description || !data.value) {
					toast.error("Preencha todos os campos obrigatórios");
					return;
				}
				await finesService.createFine({
					name: data.name,
					description: data.description,
					value: data.value,
				});
				toast.success("Multa criada com sucesso!");
			}
			handleCloseFineDialog();
			loadData();
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao salvar multa");
			} else {
				toast.error("Erro ao salvar multa");
			}
		}
	};

	const handleDeleteFine = async () => {
		if (!selectedFine) return;
		try {
			await finesService.deleteFine(selectedFine._id);
			toast.success("Multa deletada com sucesso!");
			setIsDeleteFineDialogOpen(false);
			setSelectedFine(null);
			loadData();
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response?.message || "Erro ao deletar multa");
			} else {
				toast.error("Erro ao deletar multa");
			}
		}
	};

	if (isLoading) {
		return <FinesSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Multas e Notificações</h1>
				<p className="text-muted-foreground">
					Gerencie multas base e aplique multas/notificações aos apartamentos
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "apartments" | "fines")}>
				<TabsList>
					<TabsTrigger value="apartments">Apartamentos</TabsTrigger>
					<TabsTrigger value="fines">Multas</TabsTrigger>
				</TabsList>

				{/* Tab: Apartamentos */}
				<TabsContent value="apartments" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Lista de Apartamentos</CardTitle>
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2">
											<Filter className="h-4 w-4 text-muted-foreground" />
											<label className="flex items-center gap-2 text-sm">
												<input
													type="checkbox"
													checked={filterPendingFines}
													onChange={(e) => setFilterPendingFines(e.target.checked)}
													className="rounded"
												/>
												Multas pendentes
											</label>
										</div>
										<div className="flex items-center gap-2">
											<Filter className="h-4 w-4 text-muted-foreground" />
											<label className="flex items-center gap-2 text-sm">
												<input
													type="checkbox"
													checked={filterFinesInReview}
													onChange={(e) => setFilterFinesInReview(e.target.checked)}
													className="rounded"
												/>
												Multas em análise
											</label>
										</div>
									</div>
									<div className="relative w-72">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Buscar por apartamento, nome ou email..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-9"
										/>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Apartamento</TableHead>
											<TableHead>Moradores</TableHead>
											<TableHead>Multas Pendentes</TableHead>
											<TableHead>Multas em Análise</TableHead>
											<TableHead className="text-right">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedApartments.length === 0 ? (
											<TableRow>
												<TableCell colSpan={5} className="text-center text-muted-foreground">
													Nenhum apartamento encontrado
												</TableCell>
											</TableRow>
										) : (
											paginatedApartments.map((apartment) => (
												<TableRow
													key={apartment._id}
													className="cursor-pointer hover:bg-muted/50"
													onClick={() => {
														setSelectedApartment(apartment);
														setFinesViewType(null);
														setIsApartmentDetailsDialogOpen(true);
													}}
												>
													<TableCell className="font-medium">{apartment.number}</TableCell>
													<TableCell>
														<div className="space-y-1">
															{apartment.residents.length === 0 ? (
																<span className="text-sm text-muted-foreground">Sem moradores</span>
															) : (
																apartment.residents.map((resident) => (
																	<div key={resident._id} className="text-sm">
																		<p className="font-medium">{resident.name}</p>
																	</div>
																))
															)}
														</div>
													</TableCell>
													<TableCell>
														{apartment.pendingFines > 0 ? (
															<Button
																size="sm"
																variant="outline"
																className="text-amber-600 hover:text-amber-700"
																onClick={(e) => {
																	e.stopPropagation();
																	setSelectedApartmentForFines(apartment);
																	setIsPendingFinesDialogOpen(true);
																}}
															>
																<AlertTriangle className="w-4 h-4 mr-2" />
																<span>{apartment.pendingFines} pendente(s)</span>
															</Button>
														) : (
															<span className="text-sm text-muted-foreground">-</span>
														)}
													</TableCell>
													<TableCell>
														{apartment.finesInReview > 0 ? (
															<Button
																size="sm"
																variant="outline"
																className="text-blue-600 hover:text-blue-700"
																onClick={(e) => {
																	e.stopPropagation();
																	setSelectedApartmentForFines(apartment);
																	setIsInReviewFinesDialogOpen(true);
																}}
															>
																<Clock className="w-4 h-4 mr-2" />
																<span>{apartment.finesInReview} em análise</span>
															</Button>
														) : (
															<span className="text-sm text-muted-foreground">-</span>
														)}
													</TableCell>
													<TableCell className="text-right">
														<div
															className="flex justify-end gap-2"
															onClick={(e) => e.stopPropagation()}
														>
															<Button
																size="sm"
																variant="outline"
																className="text-destructive hover:text-destructive"
																onClick={() => handleOpenInfractionDialog(apartment, "fine")}
															>
																<AlertTriangle className="w-4 h-4 mr-2" />
																Multar
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	handleOpenInfractionDialog(apartment, "notification")
																}
															>
																<Bell className="w-4 h-4 mr-2" />
																Notificar
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
							{/* Paginação */}
							{totalPages > 1 && (
								<div className="flex items-center justify-between px-4 py-4 border-t">
									<div className="text-sm text-muted-foreground">
										Mostrando{" "}
										{paginatedApartments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
										{Math.min(currentPage * itemsPerPage, filteredApartments.length)} de{" "}
										{filteredApartments.length} apartamentos
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											Anterior
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
												let pageNum: number;
												if (totalPages <= 5) {
													pageNum = i + 1;
												} else if (currentPage <= 3) {
													pageNum = i + 1;
												} else if (currentPage >= totalPages - 2) {
													pageNum = totalPages - 4 + i;
												} else {
													pageNum = currentPage - 2 + i;
												}
												return (
													<Button
														key={pageNum}
														variant={currentPage === pageNum ? "default" : "outline"}
														size="sm"
														onClick={() => setCurrentPage(pageNum)}
														className="w-8 h-8 p-0"
													>
														{pageNum}
													</Button>
												);
											})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
											disabled={currentPage === totalPages}
										>
											Próxima
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Multas */}
				<TabsContent value="fines" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Multas</CardTitle>
								<Button onClick={() => handleOpenFineDialog()}>
									<Plus className="w-4 h-4 mr-2" />
									Nova Multa
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Nome</TableHead>
											<TableHead>Descrição</TableHead>
											<TableHead>Valor</TableHead>
											<TableHead className="text-right">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{fines.length === 0 ? (
											<TableRow>
												<TableCell colSpan={4} className="text-center text-muted-foreground">
													Nenhuma multa base cadastrada
												</TableCell>
											</TableRow>
										) : (
											fines.map((fine) => (
												<TableRow key={fine._id}>
													<TableCell className="font-medium">{fine.name}</TableCell>
													<TableCell className="max-w-md truncate">{fine.description}</TableCell>
													<TableCell>
														R$ {fine.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleOpenFineDialog(fine)}
															>
																<Edit className="w-4 h-4 mr-2" />
																Editar
															</Button>
															<Button
																size="sm"
																variant="outline"
																className="text-destructive hover:text-destructive"
																onClick={() => {
																	setSelectedFine(fine);
																	setIsDeleteFineDialogOpen(true);
																}}
															>
																<Trash2 className="w-4 h-4 mr-2" />
																Deletar
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialog: Aplicar Multa/Notificação */}
			<Dialog open={isInfractionDialogOpen} onOpenChange={handleCloseInfractionDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{infractionType === "fine" ? (
								<span className="flex items-center gap-2 text-destructive">
									<AlertTriangle className="w-5 h-5" />
									Aplicar Multa
								</span>
							) : (
								<span className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
									<Bell className="w-5 h-5" />
									Enviar Notificação
								</span>
							)}
						</DialogTitle>
						<DialogDescription>
							{infractionType === "fine"
								? `Aplicar multa para o apartamento ${selectedApartment?.number}`
								: `Enviar notificação para o apartamento ${selectedApartment?.number}`}
							{selectedApartment && selectedApartment.residents.length > 0 && (
								<div className="mt-2 p-3 rounded-lg bg-muted/50">
									<p className="text-sm font-medium mb-2">Moradores:</p>
									{selectedApartment.residents.map((resident) => (
										<div key={resident._id} className="text-xs mb-1">
											<p className="font-medium">{resident.name}</p>
											<p className="text-muted-foreground">{resident.email}</p>
										</div>
									))}
								</div>
							)}
						</DialogDescription>
					</DialogHeader>

					{infractionType === "fine" ? (
						<form
							onSubmit={infractionFineForm.handleSubmit(onSubmitInfractionFine)}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="fineId">Multa *</Label>
								<Select
									value={infractionFineForm.watch("fineId")}
									onValueChange={(value) => infractionFineForm.setValue("fineId", value)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma multa base" />
									</SelectTrigger>
									<SelectContent>
										{fines.map((fine) => (
											<SelectItem key={fine._id} value={fine._id}>
												{fine.name} - R${" "}
												{fine.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{infractionFineForm.formState.errors.fineId && (
									<p className="text-sm text-destructive">
										{infractionFineForm.formState.errors.fineId.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="value">Valor (R$) *</Label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="value"
										type="number"
										step="0.01"
										min="0.01"
										placeholder="0.00"
										{...infractionFineForm.register("value", { valueAsNumber: true })}
										className="pl-9"
									/>
								</div>
								{infractionFineForm.formState.errors.value && (
									<p className="text-sm text-destructive">
										{infractionFineForm.formState.errors.value.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="occurrenceDate">Data da Ocorrência *</Label>
								<Input
									id="occurrenceDate"
									type="datetime-local"
									value={
										infractionFineForm.watch("occurrenceDate")
											? new Date(infractionFineForm.watch("occurrenceDate"))
													.toISOString()
													.slice(0, 16)
											: ""
									}
									onChange={(e) => {
										if (e.target.value) {
											const date = new Date(e.target.value);
											infractionFineForm.setValue("occurrenceDate", date.toISOString());
										}
									}}
								/>
								{infractionFineForm.formState.errors.occurrenceDate && (
									<p className="text-sm text-destructive">
										{infractionFineForm.formState.errors.occurrenceDate.message}
									</p>
								)}
							</div>

							<div className="flex gap-4 pt-4">
								<Button
									type="submit"
									className="flex-1"
									disabled={infractionFineForm.formState.isSubmitting}
									variant="destructive"
								>
									{infractionFineForm.formState.isSubmitting ? "Aplicando..." : "Aplicar Multa"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseInfractionDialog}
									disabled={infractionFineForm.formState.isSubmitting}
								>
									Cancelar
								</Button>
							</div>
						</form>
					) : (
						<form
							onSubmit={infractionNotificationForm.handleSubmit(onSubmitInfractionNotification)}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="fineId">Multa/Notificação Base *</Label>
								<Select
									value={infractionNotificationForm.watch("fineId")}
									onValueChange={(value) => infractionNotificationForm.setValue("fineId", value)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma multa/notificação base" />
									</SelectTrigger>
									<SelectContent>
										{fines.map((fine) => (
											<SelectItem key={fine._id} value={fine._id}>
												{fine.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{infractionNotificationForm.formState.errors.fineId && (
									<p className="text-sm text-destructive">
										{infractionNotificationForm.formState.errors.fineId.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Descrição *</Label>
								<Textarea
									id="description"
									placeholder="Descreva o ocorrido..."
									rows={4}
									{...infractionNotificationForm.register("description")}
								/>
								{infractionNotificationForm.formState.errors.description && (
									<p className="text-sm text-destructive">
										{infractionNotificationForm.formState.errors.description.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="occurrenceDate">Data da Ocorrência *</Label>
								<Input
									id="occurrenceDate"
									type="datetime-local"
									value={
										infractionNotificationForm.watch("occurrenceDate")
											? new Date(infractionNotificationForm.watch("occurrenceDate"))
													.toISOString()
													.slice(0, 16)
											: ""
									}
									onChange={(e) => {
										if (e.target.value) {
											const date = new Date(e.target.value);
											infractionNotificationForm.setValue("occurrenceDate", date.toISOString());
										}
									}}
								/>
								{infractionNotificationForm.formState.errors.occurrenceDate && (
									<p className="text-sm text-destructive">
										{infractionNotificationForm.formState.errors.occurrenceDate.message}
									</p>
								)}
							</div>

							<div className="flex gap-4 pt-4">
								<Button
									type="submit"
									className="flex-1"
									disabled={infractionNotificationForm.formState.isSubmitting}
								>
									{infractionNotificationForm.formState.isSubmitting
										? "Enviando..."
										: "Enviar Notificação"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseInfractionDialog}
									disabled={infractionNotificationForm.formState.isSubmitting}
								>
									Cancelar
								</Button>
							</div>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog: Criar/Editar Multa */}
			<Dialog open={isFineDialogOpen} onOpenChange={handleCloseFineDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{isEditingFine ? "Editar Multa" : "Nova Multa"}</DialogTitle>
						<DialogDescription>
							{isEditingFine
								? "Edite as informações da multa base"
								: "Crie uma nova multa base que pode ser aplicada aos apartamentos"}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={fineForm.handleSubmit(onSubmitFine)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nome *</Label>
							<Input
								id="name"
								placeholder="Ex: Barulho após às 22h"
								{...fineForm.register("name")}
							/>
							{fineForm.formState.errors.name && (
								<p className="text-sm text-destructive">{fineForm.formState.errors.name.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descrição *</Label>
							<Textarea
								id="description"
								placeholder="Descreva a multa..."
								rows={4}
								{...fineForm.register("description")}
							/>
							{fineForm.formState.errors.description && (
								<p className="text-sm text-destructive">
									{fineForm.formState.errors.description.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="value">Valor (R$) *</Label>
							<div className="relative">
								<DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="value"
									type="number"
									step="0.01"
									min="0.01"
									placeholder="0.00"
									{...fineForm.register("value", { valueAsNumber: true })}
									className="pl-9"
								/>
							</div>
							{fineForm.formState.errors.value && (
								<p className="text-sm text-destructive">
									{fineForm.formState.errors.value.message}
								</p>
							)}
						</div>

						<div className="flex gap-4 pt-4">
							<Button type="submit" className="flex-1" disabled={fineForm.formState.isSubmitting}>
								{fineForm.formState.isSubmitting
									? "Salvando..."
									: isEditingFine
										? "Atualizar"
										: "Criar"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseFineDialog}
								disabled={fineForm.formState.isSubmitting}
							>
								Cancelar
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog: Deletar Multa */}
			<AlertDialog open={isDeleteFineDialogOpen} onOpenChange={setIsDeleteFineDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja deletar a multa "{selectedFine?.name}"? Esta ação não pode ser
							desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteFine}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Deletar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog: Multas Pendentes */}
			<Dialog open={isPendingFinesDialogOpen} onOpenChange={setIsPendingFinesDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Multas Pendentes - Apartamento {selectedApartmentForFines?.number}
						</DialogTitle>
						<DialogDescription>
							Visualize todas as multas pendentes deste apartamento
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{selectedApartmentForFines &&
						selectedApartmentForFines.fines.filter((f) => f.status === "PENDENTE").length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhuma multa pendente para este apartamento.
							</p>
						) : (
							<div className="space-y-4">
								{selectedApartmentForFines?.fines
									.filter((f) => f.status === "PENDENTE")
									.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
									.map((fine) => (
										<Card key={fine._id}>
											<CardContent className="pt-6">
												<div className="flex items-start justify-between">
													<div className="space-y-1 flex-1">
														<p className="text-sm font-medium">
															{new Date(fine.createdAt).toLocaleDateString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															})}
														</p>
														<p className="text-xs text-muted-foreground">
															Data da ocorrência:{" "}
															{new Date(fine.occurrenceDate).toLocaleDateString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
															})}
														</p>
													</div>
													<div className="flex items-center gap-3">
														<div className="text-right">
															<p className="text-xl font-bold text-destructive">
																R${" "}
																{fine.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
															</p>
														</div>
														<Badge variant="secondary">Pendente</Badge>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog: Multas em Análise */}
			<Dialog open={isInReviewFinesDialogOpen} onOpenChange={setIsInReviewFinesDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Multas em Análise - Apartamento {selectedApartmentForFines?.number}
						</DialogTitle>
						<DialogDescription>
							Visualize todas as multas em análise deste apartamento
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{selectedApartmentForFines &&
						selectedApartmentForFines.fines.filter((f) => f.status === "EM_REVISAO").length ===
							0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhuma multa em análise para este apartamento.
							</p>
						) : (
							<div className="space-y-4">
								{selectedApartmentForFines?.fines
									.filter((f) => f.status === "EM_REVISAO")
									.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
									.map((fine) => (
										<Card key={fine._id}>
											<CardContent className="pt-6">
												<div className="flex items-start justify-between">
													<div className="space-y-1 flex-1">
														<p className="text-sm font-medium">
															{new Date(fine.createdAt).toLocaleDateString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															})}
														</p>
														<p className="text-xs text-muted-foreground">
															Data da ocorrência:{" "}
															{new Date(fine.occurrenceDate).toLocaleDateString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
															})}
														</p>
													</div>
													<div className="flex items-center gap-3">
														<div className="text-right">
															<p className="text-xl font-bold text-destructive">
																R${" "}
																{fine.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
															</p>
														</div>
														<Badge variant="outline">Em Análise</Badge>
													</div>
												</div>
												<div className="mt-4 pt-4 border-t">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleViewAppeal(fine)}
														disabled={isLoadingAppeal}
														className="w-full"
													>
														<Eye className="w-4 h-4 mr-2" />
														Ver Contestação
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog: Detalhes do Apartamento */}
			<Dialog
				open={isApartmentDetailsDialogOpen}
				onOpenChange={(open) => {
					setIsApartmentDetailsDialogOpen(open);
					if (!open) {
						setFinesViewType(null);
					}
				}}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Apartamento {selectedApartment?.number}</DialogTitle>
						<DialogDescription>
							Informações completas do apartamento, moradores e histórico
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						{/* Informações do Apartamento */}
						<Card>
							<CardHeader>
								<CardTitle>Informações do Apartamento</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-4">
									<div>
										<p className="text-sm font-medium text-muted-foreground">Número</p>
										<p className="text-lg font-semibold">{selectedApartment?.number}</p>
									</div>
									<div>
										<p className="text-sm font-medium text-muted-foreground">Multas Pendentes</p>
										<p className="text-lg font-semibold text-amber-600">
											{selectedApartment?.pendingFines || 0}
										</p>
									</div>
									<div>
										<p className="text-sm font-medium text-muted-foreground">Multas em Análise</p>
										<p className="text-lg font-semibold text-blue-600">
											{selectedApartment?.finesInReview || 0}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Moradores */}
						<Card>
							<CardHeader>
								<CardTitle>Moradores</CardTitle>
							</CardHeader>
							<CardContent>
								{selectedApartment && selectedApartment.residents.length === 0 ? (
									<p className="text-sm text-muted-foreground">Nenhum morador cadastrado</p>
								) : (
									<div className="space-y-4">
										{selectedApartment?.residents.map((resident) => (
											<div
												key={resident._id}
												className="flex items-start justify-between p-4 border rounded-lg"
											>
												<div className="space-y-1">
													<p className="font-medium">{resident.name}</p>
													<p className="text-sm text-muted-foreground">{resident.email}</p>
													{resident.phone && (
														<p className="text-sm text-muted-foreground">{resident.phone}</p>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Multas Pendentes */}
						{(finesViewType === "pending" || finesViewType === null) && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<AlertTriangle className="w-5 h-5 text-amber-600" />
										Multas Pendentes
									</CardTitle>
								</CardHeader>
								<CardContent>
									{selectedApartment &&
									selectedApartment.fines.filter((f) => f.status === "PENDENTE").length === 0 ? (
										<p className="text-sm text-muted-foreground">
											Nenhuma multa pendente para este apartamento.
										</p>
									) : (
										<div className="space-y-4">
											{selectedApartment?.fines
												.filter((f) => f.status === "PENDENTE")
												.sort(
													(a, b) =>
														new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
												)
												.map((fine) => (
													<div key={fine._id} className="p-4 border rounded-lg">
														<div className="flex items-start justify-between">
															<div className="space-y-1">
																<p className="text-sm font-medium">
																	{new Date(fine.createdAt).toLocaleDateString("pt-BR", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	})}
																</p>
																<p className="text-xs text-muted-foreground">
																	Data da ocorrência:{" "}
																	{new Date(fine.occurrenceDate).toLocaleDateString("pt-BR", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	})}
																</p>
															</div>
															<div className="flex items-center gap-3">
																<div className="text-right">
																	<p className="text-xl font-bold text-destructive">
																		R${" "}
																		{fine.value.toLocaleString("pt-BR", {
																			minimumFractionDigits: 2,
																		})}
																	</p>
																</div>
																<Badge variant="secondary">Pendente</Badge>
															</div>
														</div>
													</div>
												))}
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Multas em Análise */}
						{(finesViewType === "inReview" || finesViewType === null) && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Clock className="w-5 h-5 text-blue-600" />
										Multas em Análise
									</CardTitle>
								</CardHeader>
								<CardContent>
									{selectedApartment &&
									selectedApartment.fines.filter((f) => f.status === "EM_REVISAO").length === 0 ? (
										<p className="text-sm text-muted-foreground">
											Nenhuma multa em análise para este apartamento.
										</p>
									) : (
										<div className="space-y-4">
											{selectedApartment?.fines
												.filter((f) => f.status === "EM_REVISAO")
												.sort(
													(a, b) =>
														new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
												)
												.map((fine) => (
													<div key={fine._id} className="p-4 border rounded-lg">
														<div className="flex items-start justify-between">
															<div className="space-y-1">
																<p className="text-sm font-medium">
																	{new Date(fine.createdAt).toLocaleDateString("pt-BR", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	})}
																</p>
																<p className="text-xs text-muted-foreground">
																	Data da ocorrência:{" "}
																	{new Date(fine.occurrenceDate).toLocaleDateString("pt-BR", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	})}
																</p>
															</div>
															<div className="flex items-center gap-3">
																<div className="text-right">
																	<p className="text-xl font-bold text-destructive">
																		R${" "}
																		{fine.value.toLocaleString("pt-BR", {
																			minimumFractionDigits: 2,
																		})}
																	</p>
																</div>
																<Badge variant="outline">Em Análise</Badge>
															</div>
														</div>
														<div className="mt-3 pt-3 border-t">
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleViewAppeal(fine)}
																disabled={isLoadingAppeal}
																className="w-full"
															>
																<Eye className="w-4 h-4 mr-2" />
																Ver Contestação
															</Button>
														</div>
													</div>
												))}
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Histórico de Multas */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="w-5 h-5 text-destructive" />
									Histórico de Multas
								</CardTitle>
							</CardHeader>
							<CardContent>
								{selectedApartment &&
								selectedApartment.fines.filter(
									(f) => f.status === "CANCELADA" || f.status === "PAGO",
								).length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Nenhuma multa no histórico para este apartamento.
									</p>
								) : (
									<div className="space-y-4">
										{selectedApartment?.fines
											.filter((f) => f.status === "CANCELADA" || f.status === "PAGO")
											.sort(
												(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
											)
											.map((fine) => (
												<div key={fine._id} className="p-4 border rounded-lg">
													<div className="flex items-start justify-between">
														<div className="space-y-1">
															<p className="text-sm font-medium">
																{new Date(fine.createdAt).toLocaleDateString("pt-BR", {
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</p>
															<p className="text-xs text-muted-foreground">
																Data da ocorrência:{" "}
																{new Date(fine.occurrenceDate).toLocaleDateString("pt-BR", {
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																})}
															</p>
														</div>
														<div className="flex items-center gap-3">
															<div className="text-right">
																<p className="text-xl font-bold text-destructive">
																	R${" "}
																	{fine.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
																</p>
															</div>
															<Badge variant={fine.status === "PAGO" ? "default" : "destructive"}>
																{fine.status === "PAGO" ? "Paga" : "Cancelada"}
															</Badge>
														</div>
													</div>
													{fine.canceledNote && (
														<div className="mt-3 pt-3 border-t">
															<p className="text-sm text-muted-foreground mb-2">
																Motivo do cancelamento:
															</p>
															<p className="text-sm whitespace-pre-wrap text-destructive">
																{fine.canceledNote}
															</p>
														</div>
													)}
													{fine.status === "EM_REVISAO" && (
														<div className="mt-3 pt-3 border-t">
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleViewAppeal(fine)}
																disabled={isLoadingAppeal}
																className="w-full"
															>
																<Eye className="w-4 h-4 mr-2" />
																Ver Contestação
															</Button>
														</div>
													)}
												</div>
											))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Histórico de Notificações */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Bell className="w-5 h-5 text-blue-600 dark:text-blue-500" />
									Histórico de Notificações
								</CardTitle>
							</CardHeader>
							<CardContent>
								{selectedApartment &&
								(!selectedApartment.notifications ||
									selectedApartment.notifications.length === 0) ? (
									<p className="text-sm text-muted-foreground">
										Nenhuma notificação enviada para este apartamento.
									</p>
								) : (
									<div className="space-y-4">
										{selectedApartment?.notifications
											.sort(
												(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
											)
											.map((notification) => (
												<div key={notification._id} className="p-4 border rounded-lg">
													<div className="flex items-start justify-between">
														<div className="space-y-1">
															<p className="text-sm font-medium">
																{new Date(notification.createdAt).toLocaleDateString("pt-BR", {
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</p>
															<p className="text-xs text-muted-foreground">
																Data da ocorrência:{" "}
																{new Date(notification.occurrenceDate).toLocaleDateString("pt-BR", {
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																})}
															</p>
														</div>
														<Badge
															variant={notification.status === "ATIVO" ? "default" : "secondary"}
														>
															{notification.status === "ATIVO" ? "Ativo" : "Inativo"}
														</Badge>
													</div>
													<div className="mt-3 pt-3 border-t">
														<p className="text-sm text-muted-foreground mb-2">Descrição:</p>
														<p className="text-sm whitespace-pre-wrap">
															{notification.description}
														</p>
													</div>
												</div>
											))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setIsApartmentDetailsDialogOpen(false)}>
							Fechar
						</Button>
						<Button
							variant="outline"
							className="text-destructive hover:text-destructive"
							onClick={() => {
								setIsApartmentDetailsDialogOpen(false);
								if (selectedApartment) {
									handleOpenInfractionDialog(selectedApartment, "fine");
								}
							}}
						>
							<AlertTriangle className="w-4 h-4 mr-2" />
							Multar
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setIsApartmentDetailsDialogOpen(false);
								if (selectedApartment) {
									handleOpenInfractionDialog(selectedApartment, "notification");
								}
							}}
						>
							<Bell className="w-4 h-4 mr-2" />
							Notificar
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog: Visualização e Aprovação/Reprovação de Contestação */}
			<Dialog open={isAppealDialogOpen} onOpenChange={handleCloseAppealDialog}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-amber-600">
							<Eye className="w-5 h-5" />
							Contestação da Multa
						</DialogTitle>
						<DialogDescription>
							Revise a contestação e decida se aprova ou reprova
						</DialogDescription>
					</DialogHeader>

					{appealData && selectedInfractionForAppeal ? (
						<div className="space-y-6">
							{/* Informações da Multa */}
							<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
								<h3 className="font-semibold text-sm text-destructive mb-2">Multa Contestada</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-muted-foreground">Valor</p>
										<p className="text-xl font-bold text-destructive">
											R${" "}
											{selectedInfractionForAppeal.value.toLocaleString("pt-BR", {
												minimumFractionDigits: 2,
											})}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Data da Ocorrência</p>
										<p className="text-sm font-medium">
											{new Date(selectedInfractionForAppeal.occurrenceDate).toLocaleDateString(
												"pt-BR",
											)}
										</p>
									</div>
								</div>
							</div>

							{/* Data da Contestação */}
							<div className="p-3 bg-muted rounded-lg">
								<p className="text-sm text-muted-foreground">
									Contestação enviada em{" "}
									{new Date(appealData.createdAt).toLocaleString("pt-BR", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>

							{/* Texto da Contestação */}
							<div className="space-y-2">
								<Label>Descrição da Contestação</Label>
								<div className="p-4 bg-muted rounded-lg border min-h-[150px]">
									<p className="text-sm whitespace-pre-wrap">{appealData.text}</p>
								</div>
							</div>

							{/* Arquivo Anexado */}
							<div className="space-y-2">
								<Label>Arquivo Anexado</Label>
								<div className="p-4 bg-muted rounded-lg border">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">{appealData.fileName}</p>
												<p className="text-xs text-muted-foreground">
													{(appealData.fileSize / 1024).toFixed(2)} KB
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => window.open(appealData.url, "_blank")}
											asChild
										>
											<a href={appealData.url} target="_blank" rel="noopener noreferrer">
												<Download className="w-4 h-4 mr-2" />
												Abrir Arquivo
											</a>
										</Button>
									</div>
								</div>
							</div>

							{/* Botões de Ação */}
							<div className="flex gap-4 pt-4 border-t">
								<Button
									variant="outline"
									onClick={handleCloseAppealDialog}
									disabled={isProcessingAppeal}
									className="flex-1"
								>
									Cancelar
								</Button>
								<Button
									variant="outline"
									onClick={handleRejectAppeal}
									disabled={isProcessingAppeal}
									className="flex-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
								>
									<XCircle className="w-4 h-4 mr-2" />
									Reprovar Contestação
								</Button>
								<Button
									onClick={handleApproveAppeal}
									disabled={isProcessingAppeal}
									className="flex-1 bg-green-600 hover:bg-green-700"
								>
									<CheckCircle2 className="w-4 h-4 mr-2" />
									Aprovar Contestação
								</Button>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center py-8">
							<p className="text-sm text-muted-foreground">Carregando contestação...</p>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
