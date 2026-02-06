import { useState, useEffect, useMemo } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
	UserCheck,
	ChevronLeft,
	ChevronRight,
	PlusCircle,
	Camera,
	X,
	ChevronDown,
	Check,
	Pencil,
	Calendar,
	Clock,
	FileText,
	UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
	visitorSchema,
	visitorEditSchema,
	type VisitorSchema,
	type VisitorEditSchema,
} from "@/schemas/concierge/visitor.schema";
import VisitorsSkeleton from "@/skeleton/concierge/VisitorsSkeleton";
import {
	visitorService,
	type Visitor,
	type CreateVisitorRequest,
	type UpdateVisitorRequest,
	ApiClientError,
	visitsService,
	type Visit,
} from "@/services/api";
import { apartmentsService, type Apartment } from "@/services/api";
import { CameraCapture } from "@/components/ui/camera-capture";
import { cn, formatNameToCamelCase } from "@/lib/utils";

export default function ConciergeVisitors() {
	const [isLoading, setIsLoading] = useState(true);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
	const [isLoadingVisitorDetails, setIsLoadingVisitorDetails] = useState(false);
	const [photoError, setPhotoError] = useState<string | null>(null);
	const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
	const [searchTerm, setSearchTerm] = useState("");
	const [activeSearchTerm, setActiveSearchTerm] = useState("");
	const [activeTab, setActiveTab] = useState("busca");
	const [filterBy, setFilterBy] = useState<"name" | "document" | "apartment">("name");
	const [visitors, setVisitors] = useState<Visitor[]>([]);
	const [apartments, setApartments] = useState<Apartment[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [totalVisitors, setTotalVisitors] = useState(0);
	const [showCamera, setShowCamera] = useState(false);
	const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
	const [isLoadingVisitorForEdit, setIsLoadingVisitorForEdit] = useState(false);
	const [initialEditData, setInitialEditData] = useState<any>(null);
	const [isUsingLatestVisitors, setIsUsingLatestVisitors] = useState(false);

	// Visit states
	const [visits, setVisits] = useState<Visit[]>([]);
	const [isLoadingVisits, setIsLoadingVisits] = useState(false);
	const [visitNote, setVisitNote] = useState("");
	const [visitApartmentId, setVisitApartmentId] = useState("");
	const [isRegisteringVisit, setIsRegisteringVisit] = useState(false);
	const [visitsPage, setVisitsPage] = useState(1);
	const [visitsTotalPages, setVisitsTotalPages] = useState(1);
	const [visitsTotal, setVisitsTotal] = useState(0);
	const [isVisitRegistrationMode, setIsVisitRegistrationMode] = useState(false);
	const [modalTab, setModalTab] = useState<"detalhes" | "historico">("detalhes");

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);

				// Get buildingId from token
				let buildingId = "";
				const token =
					localStorage.getItem("coliseu_access_token") ||
					sessionStorage.getItem("coliseu_access_token") ||
					localStorage.getItem("concierge_token") ||
					sessionStorage.getItem("concierge_token");

				if (token) {
					try {
						const tokenParts = token.split(".");
						if (tokenParts.length === 3) {
							const payload = JSON.parse(atob(tokenParts[1]));
							buildingId = payload.buildingId || payload.building_id || "";
						}
					} catch (e) {}
				}

				if (!buildingId) {
					toast.error("BuildingId não encontrado no token. Faça login novamente.");
					setIsLoading(false);
					return;
				}

				// Se não há busca ativa, usar getLatestVisitors (sempre 10 últimos)
				if (!activeSearchTerm) {
					const [latestVisitorsResponse, allApartments] = await Promise.all([
						visitorService.getLatestVisitors(10),
						apartmentsService.getApartmentsByBuildingId(buildingId),
					]);

					const visitorsData = latestVisitorsResponse.data || [];

					setVisitors(visitorsData);
					setTotalVisitors(visitorsData.length);
					setTotalPages(1);
					setIsUsingLatestVisitors(true);
					setApartments(allApartments);
				} else {
					// Se há busca, usar getVisitors com paginação
					const [visitorsResponse, allApartments] = await Promise.all([
						visitorService.getVisitors({
							page: currentPage,
							limit: itemsPerPage,
							search: activeSearchTerm,
							filterBy: filterBy,
						}),
						apartmentsService.getApartmentsByBuildingId(buildingId),
					]);

					const visitorsData = visitorsResponse.data?.data || [];
					const total = visitorsResponse.data?.total || 0;
					const pages = visitorsResponse.data?.totalPages || 1;

					setVisitors(visitorsData);
					setTotalVisitors(total);
					setTotalPages(pages);
					setIsUsingLatestVisitors(false);
					setApartments(allApartments);
				}
			} catch (error: any) {
				console.error("Erro ao carregar visitantes:", error);
				// Em caso de erro, limpar dados e mostrar mensagem
				setVisitors([]);
				setTotalVisitors(0);
				setTotalPages(0);
				setIsUsingLatestVisitors(false);
				toast.error("Erro ao carregar visitantes. Tente novamente.");
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, [currentPage, itemsPerPage, activeSearchTerm, filterBy]);

	const visitorForm = useForm<VisitorSchema>({
		resolver: zodResolver(visitorSchema),
		defaultValues: {
			name: "",
			document: "",
			phone: "",
			email: "",
			vehicleType: "",
			vehiclePlate: "",
			types: [],
			companyName: "",
			photo: undefined,
			note: "",
			visitApartmentId: "",
			visitNote: "",
		},
	});

	const editVisitorForm = useForm<VisitorEditSchema>({
		resolver: zodResolver(visitorEditSchema),
		defaultValues: {
			name: "",
			document: "",
			phone: "",
			email: "",
			vehicleType: "",
			vehiclePlate: "",
			types: [],
			companyName: "",
			note: "",
		},
	});

	const filterVisitors = (visitorsList: Visitor[]) => {
		// Se não há termo de busca, retornar lista completa
		if (!activeSearchTerm) return visitorsList;

		// Se o filtro é "document" ou "apartment", o backend já fez o filtro
		// Não aplicar filtro local, apenas retornar os dados do backend
		if (filterBy === "document" || filterBy === "apartment") {
			return visitorsList;
		}

		// Para "name", aplicar filtro local como fallback (caso o backend não tenha filtrado)
		if (filterBy === "name") {
			const searchLower = activeSearchTerm.toLowerCase();
			return visitorsList.filter((visitor) => {
				return visitor.name.toLowerCase().includes(searchLower);
			});
		}

		return visitorsList;
	};

	const filteredVisitors = filterVisitors(visitors);

	// Pagination logic - only apply when not using latest visitors
	const getPaginatedVisitors = (visitorsList: Visitor[]) => {
		if (isUsingLatestVisitors) {
			return visitorsList; // No pagination for latest visitors
		}
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return visitorsList.slice(startIndex, endIndex);
	};

	const paginatedVisitors = getPaginatedVisitors(filteredVisitors);

	// Reset page when active search term or filter changes
	useEffect(() => {
		if (activeSearchTerm) {
			setCurrentPage(1);
		}
	}, [activeSearchTerm, filterBy]);

	// When filter changes and there's an active search, refetch with new filter (dynamic update)
	useEffect(() => {
		// Only refetch if there's an active search term
		if (!activeSearchTerm) return;

		const refetchData = async () => {
			try {
				// Get buildingId from token
				let buildingId = "";
				const token =
					localStorage.getItem("coliseu_access_token") ||
					sessionStorage.getItem("coliseu_access_token") ||
					localStorage.getItem("concierge_token") ||
					sessionStorage.getItem("concierge_token");

				if (token) {
					try {
						const tokenParts = token.split(".");
						if (tokenParts.length === 3) {
							const payload = JSON.parse(atob(tokenParts[1]));
							buildingId = payload.buildingId || payload.building_id || "";
						}
					} catch (e) {}
				}

				if (!buildingId) return;

				const visitorsResponse = await visitorService.getVisitors({
					page: 1, // Reset to first page when filter changes
					limit: itemsPerPage,
					search: activeSearchTerm,
					filterBy: activeSearchTerm ? filterBy : undefined,
				});

				const visitorsData = visitorsResponse.data?.data || [];
				const total = visitorsResponse.data?.total || 0;
				const pages = visitorsResponse.data?.totalPages || 1;

				setVisitors(visitorsData);
				setTotalVisitors(total);
				setTotalPages(pages);
				setCurrentPage(1);
			} catch (error: any) {
				// Se a API falhar, apenas usar filtro local nos dados existentes
			}
		};

		refetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterBy]);

	const handleSearch = () => {
		setActiveSearchTerm(searchTerm);
		if (searchTerm) {
			setCurrentPage(1);
		}
	};

	const handleAddVisitor = async (data: VisitorSchema) => {
		try {
			// Validar que foto foi fornecida
			if (!capturedPhoto) {
				toast.error("Foto é obrigatória");
				return;
			}

			// Converter tipos para maiúsculas conforme API
			const typesUpperCase = data.types.map((type) => {
				if (type === "prestador_servico") return "PRESTADOR";
				return "CONVIDADO";
			}) as ("CONVIDADO" | "PRESTADOR")[];

			const payload: CreateVisitorRequest = {
				name: data.name.trim(),
				document: data.document?.trim() || undefined,
				phone: data.phone?.trim() || undefined,
				email: data.email?.trim() || undefined,
				vehicleType: data.vehicleType?.trim() ? data.vehicleType.trim().toUpperCase() : undefined,
				vehiclePlate: data.vehiclePlate?.trim() || undefined,
				types: typesUpperCase,
				companyName: data.companyName?.trim() || undefined,
				note: data.note?.trim() || undefined,
			};

			try {
				// Criar visitante e receber presignedUrl
				const response = await visitorService.createVisitor(payload);

				if (response.data?.presignedUrl && capturedPhoto) {
					// Fazer upload da foto usando presignedUrl
					await visitorService.uploadPhoto(response.data.presignedUrl, capturedPhoto);
				}

				// Se houver dados de visita preenchidos, criar a visita automaticamente
				const hasVisitData = data.visitApartmentId?.trim() || data.visitNote?.trim();
				if (hasVisitData && response.data?._id) {
					try {
						const visitPayload: { visitorId: string; apartmentId?: string; note?: string } = {
							visitorId: response.data._id,
						};

						if (data.visitApartmentId?.trim()) {
							visitPayload.apartmentId = data.visitApartmentId.trim();
						}

						if (data.visitNote?.trim()) {
							visitPayload.note = data.visitNote.trim();
						}

						await visitsService.createVisit(visitPayload);
						toast.success("Visitante e primeira visita cadastrados com sucesso!");
					} catch (visitError: any) {
						// Se a criação da visita falhar, ainda mostramos sucesso para o visitante
						console.error("Erro ao cadastrar visita:", visitError);
						if (visitError instanceof ApiClientError) {
							toast.warning(
								`Visitante cadastrado com sucesso, mas houve um erro ao registrar a visita: ${visitError.response.message || "Erro desconhecido"}`,
							);
						} else {
							toast.warning("Visitante cadastrado com sucesso, mas houve um erro ao registrar a visita.");
						}
					}
				} else {
					toast.success("Visitante cadastrado com sucesso!");
				}

				visitorForm.reset();
				setCapturedPhoto(null);
				setPhotoPreview(null);
				setShowCamera(false);

				// Reload visitors - use latest if no search, otherwise use paginated
				if (!activeSearchTerm) {
					const latestResponse = await visitorService.getLatestVisitors(10);
					const visitorsData = latestResponse.data || [];
					setVisitors(visitorsData);
					setTotalVisitors(visitorsData.length);
					setTotalPages(1);
					setIsUsingLatestVisitors(true);
				} else {
					const visitorsResponse = await visitorService.getVisitors({
						page: currentPage,
						limit: itemsPerPage,
						search: activeSearchTerm,
						filterBy: filterBy,
					});
					const visitorsData = visitorsResponse.data?.data || [];
					const total = visitorsResponse.data?.total || 0;
					const pages = visitorsResponse.data?.totalPages || 1;
					setVisitors(visitorsData);
					setTotalVisitors(total);
					setTotalPages(pages);
					setIsUsingLatestVisitors(false);
				}
			} catch (error: any) {
				if (error instanceof ApiClientError) {
					toast.error(error.response.message || "Erro ao cadastrar visitante");
				} else if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Erro ao cadastrar visitante");
				}
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao cadastrar visitante");
		}
	};

	const loadVisitorVisits = async (visitorId: string, page: number = 1) => {
		try {
			setIsLoadingVisits(true);
			const response = await visitsService.getVisitsByVisitorId(visitorId, {
				page,
				limit: 5,
			});
			if (response.data) {
				const visitsData = response.data.data || [];
				setVisits(visitsData);
				setVisitsTotalPages(response.data.totalPages || 1);
				setVisitsTotal(response.data.total || 0);
				setVisitsPage(page);
			} else {
				setVisits([]);
			}
		} catch (error: any) {
			console.error("Erro ao carregar visitas:", error);
			setVisits([]);
		} finally {
			setIsLoadingVisits(false);
		}
	};

	const handleRegisterVisit = async () => {
		if (!selectedVisitor) return;

		try {
			setIsRegisteringVisit(true);

			const payload: { visitorId: string; apartmentId?: string; note?: string } = {
				visitorId: selectedVisitor._id,
			};

			if (visitApartmentId && visitApartmentId.trim()) {
				payload.apartmentId = visitApartmentId.trim();
			}

			if (visitNote && visitNote.trim()) {
				payload.note = visitNote.trim();
			}

			await visitsService.createVisit(payload);
			toast.success("Visita registrada com sucesso!");

			// Reset form and go back to details view
			setVisitNote("");
			setVisitApartmentId("");
			setIsVisitRegistrationMode(false);

			// Reload visits
			await loadVisitorVisits(selectedVisitor._id, 1);
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response.message || "Erro ao registrar visita");
			} else {
				toast.error("Erro ao registrar visita");
			}
		} finally {
			setIsRegisteringVisit(false);
		}
	};

	const handleQuickConfirmVisit = async (visitor: Visitor, e?: React.MouseEvent) => {
		e?.stopPropagation();
		setSelectedVisitor(visitor);
		setIsViewDialogOpen(true);
		setIsLoadingVisitorDetails(false);
		setPhotoError(null);

		// Reset visit states and go directly to registration mode
		setVisits([]);
		setVisitNote("");
		setVisitApartmentId("");
		setVisitsPage(1);
		setVisitsTotalPages(1);
		setVisitsTotal(0);
		setIsVisitRegistrationMode(true);
		setModalTab("detalhes");
	};

	const handleViewVisitor = async (visitor: Visitor) => {
		setIsViewDialogOpen(true);
		setIsLoadingVisitorDetails(true);
		setPhotoError(null);

		// Reset visit states
		setVisits([]);
		setVisitNote("");
		setVisitApartmentId("");
		setVisitsPage(1);
		setVisitsTotalPages(1);
		setVisitsTotal(0);
		setIsVisitRegistrationMode(false);
		setModalTab("detalhes");

		// Iniciar loading da imagem
		if (visitor.photoUrl) {
			setImageLoading((prev) => ({ ...prev, [visitor._id]: true }));
		}

		try {
			// Buscar dados completos do visitante da API
			const response = await visitorService.getVisitorById(visitor._id);
			if (response.data) {
				setSelectedVisitor(response.data);
				// Iniciar loading da imagem se houver photoUrl
				if (response.data.photoUrl) {
					setImageLoading((prev) => ({ ...prev, [response.data._id]: true }));
				}
				// Carregar visitas do visitante
				loadVisitorVisits(response.data._id);
			} else {
				// Se a API não retornar, usar os dados que já temos
				setSelectedVisitor(visitor);
				loadVisitorVisits(visitor._id);
			}
		} catch (error: any) {
			// Em caso de erro, usar os dados que já temos
			setSelectedVisitor(visitor);
			loadVisitorVisits(visitor._id);
			toast.error("Erro ao carregar detalhes completos do visitante");
		} finally {
			setIsLoadingVisitorDetails(false);
		}
	};

	const handlePhotoCapture = (file: File) => {
		setCapturedPhoto(file);
		setPhotoPreview(URL.createObjectURL(file));
		visitorForm.setValue("photo", file);
		setShowCamera(false);
	};

	const handleRemovePhoto = () => {
		setCapturedPhoto(null);
		setPhotoPreview(null);
		visitorForm.setValue("photo", undefined);
	};

	const handleTypeChange = (type: "convidado" | "prestador_servico", checked: boolean) => {
		const currentTypes = visitorForm.watch("types") || [];
		if (checked) {
			visitorForm.setValue("types", [...currentTypes, type]);
		} else {
			const newTypes = currentTypes.filter((t) => t !== type);
			visitorForm.setValue("types", newTypes);
			// Limpar campo de empresa se não for mais prestador
			if (type === "prestador_servico" && !newTypes.includes("prestador_servico")) {
				visitorForm.setValue("companyName", "");
			}
		}
	};

	const handleEditVisitor = async (visitor: Visitor, e?: React.MouseEvent) => {
		e?.stopPropagation(); // Prevenir que o clique abra o modal de visualização
		setIsEditDialogOpen(true);
		setIsLoadingVisitorForEdit(true);
		setEditingVisitor(null);

		try {
			// Buscar dados completos do visitante da API
			const response = await visitorService.getVisitorById(visitor._id);
			const visitorData = response.data || visitor;
			setEditingVisitor(visitorData);

			// Converter tipos de maiúsculas para minúsculas para o formulário
			const typesForForm = visitorData.types.map((type) => {
				if (type === "PRESTADOR" || type === "prestador_servico") return "prestador_servico";
				return "convidado";
			}) as ("convidado" | "prestador_servico")[];

			// Preencher formulário com dados do visitante
			const formData = {
				name: visitorData.name || "",
				document: visitorData.document || "",
				phone: visitorData.phone || "",
				email: visitorData.email || "",
				vehicleType: visitorData.vehicleType
					? visitorData.vehicleType.toLowerCase() === "carro"
						? "CARRO"
						: visitorData.vehicleType.toUpperCase()
					: "none",
				vehiclePlate: visitorData.vehiclePlate || "",
				types: typesForForm,
				companyName: visitorData.companyName || "",
				note: visitorData.note || "",
			};
			editVisitorForm.reset(formData);
			// Salvar dados iniciais para comparação
			setInitialEditData({
				...formData,
				photoUrl: visitorData.photoUrl,
			});
		} catch (error: any) {
			setEditingVisitor(visitor);

			// Preencher formulário mesmo em caso de erro
			const typesForForm = visitor.types.map((type) => {
				if (type === "PRESTADOR" || type === "prestador_servico") return "prestador_servico";
				return "convidado";
			}) as ("convidado" | "prestador_servico")[];

			const formData = {
				name: visitor.name || "",
				document: visitor.document || "",
				phone: visitor.phone || "",
				email: visitor.email || "",
				vehicleType: visitor.vehicleType
					? visitor.vehicleType.toLowerCase() === "carro"
						? "CARRO"
						: visitor.vehicleType.toUpperCase()
					: "none",
				vehiclePlate: visitor.vehiclePlate || "",
				types: typesForForm,
				companyName: visitor.companyName || "",
				note: visitor.note || "",
			};
			editVisitorForm.reset(formData);
			// Salvar dados iniciais para comparação
			setInitialEditData({
				...formData,
				photoUrl: visitor.photoUrl,
			});

			toast.error("Erro ao carregar detalhes do visitante");
		} finally {
			setIsLoadingVisitorForEdit(false);
		}
	};

	const handleEditTypeChange = (type: "convidado" | "prestador_servico", checked: boolean) => {
		const currentTypes = editVisitorForm.watch("types") || [];
		if (checked) {
			editVisitorForm.setValue("types", [...currentTypes, type]);
		} else {
			const newTypes = currentTypes.filter((t) => t !== type);
			editVisitorForm.setValue("types", newTypes);
			// Limpar campo de empresa se não for mais prestador
			if (type === "prestador_servico" && !newTypes.includes("prestador_servico")) {
				editVisitorForm.setValue("companyName", "");
			}
		}
	};

	// Observar mudanças nos campos do formulário de edição para detectar alterações
	const watchedEditFields = editVisitorForm.watch([
		"name",
		"document",
		"phone",
		"email",
		"vehicleType",
		"vehiclePlate",
		"types",
		"companyName",
		"note",
	]);

	// Calcular se há mudanças (recalcula quando watchedEditFields mudam)
	const hasChanges = useMemo(() => {
		if (!editingVisitor || !initialEditData) return false;

		const currentData = editVisitorForm.getValues();

		// Normalizar valores para comparação (tratar strings vazias como undefined)
		const normalize = (value: any) => {
			if (value === "" || value === null || value === undefined) return "";
			if (typeof value === "string") return value.trim();
			return value;
		};

		// Normalizar vehicleType: "none" deve ser tratado como ""
		const normalizeVehicleType = (value: any) => {
			if (value === "none" || value === "" || value === null || value === undefined) return "";
			return String(value).trim();
		};

		const hasFormChanges =
			normalize(currentData.name) !== normalize(initialEditData.name) ||
			normalize(currentData.document) !== normalize(initialEditData.document) ||
			normalize(currentData.phone) !== normalize(initialEditData.phone) ||
			normalize(currentData.email) !== normalize(initialEditData.email) ||
			normalizeVehicleType(currentData.vehicleType) !==
				normalizeVehicleType(initialEditData.vehicleType) ||
			normalize(currentData.vehiclePlate) !== normalize(initialEditData.vehiclePlate) ||
			JSON.stringify((currentData.types || []).sort()) !==
				JSON.stringify((initialEditData.types || []).sort()) ||
			normalize(currentData.companyName) !== normalize(initialEditData.companyName || "") ||
			normalize(currentData.note) !== normalize(initialEditData.note);

		return hasFormChanges;
	}, [watchedEditFields, initialEditData, editingVisitor, editVisitorForm]);

	const handleUpdateVisitor = async (data: VisitorEditSchema) => {
		if (!editingVisitor) return;

		try {
			// Converter tipos para maiúsculas conforme API
			const typesUpperCase = data.types.map((type) => {
				if (type === "prestador_servico") return "PRESTADOR";
				return "CONVIDADO";
			}) as ("CONVIDADO" | "PRESTADOR")[];

			const payload: UpdateVisitorRequest = {
				name: data.name.trim(),
				document: data.document?.trim() || undefined,
				phone: data.phone?.trim() || undefined,
				email: data.email?.trim() || undefined,
				vehicleType: data.vehicleType?.trim() ? data.vehicleType.trim().toUpperCase() : undefined,
				vehiclePlate: data.vehiclePlate?.trim() || undefined,
				types: typesUpperCase,
				companyName: data.companyName?.trim() || undefined,
				note: data.note?.trim() || undefined,
				active: editingVisitor.active !== false, // Manter status atual ou true por padrão
			};

			// Atualizar visitante
			await visitorService.updateVisitor(editingVisitor._id, payload);

			toast.success("Visitante atualizado com sucesso!");
			setIsEditDialogOpen(false);
			setEditingVisitor(null);
			setInitialEditData(null);
			editVisitorForm.reset();

			// Reload visitors - use latest if no search, otherwise use paginated
			if (!activeSearchTerm) {
				const latestResponse = await visitorService.getLatestVisitors(10);
				const visitorsData = latestResponse.data || [];
				setVisitors(visitorsData);
				setTotalVisitors(visitorsData.length);
				setTotalPages(1);
				setIsUsingLatestVisitors(true);
			} else {
				const visitorsResponse = await visitorService.getVisitors({
					page: currentPage,
					limit: itemsPerPage,
					search: activeSearchTerm,
					filterBy: filterBy,
				});
				const visitorsData = visitorsResponse.data?.data || [];
				const total = visitorsResponse.data?.total || 0;
				const pages = visitorsResponse.data?.totalPages || 1;
				setVisitors(visitorsData);
				setTotalVisitors(total);
				setTotalPages(pages);
				setIsUsingLatestVisitors(false);
			}
		} catch (error: any) {
			if (error instanceof ApiClientError) {
				toast.error(error.response.message || "Erro ao atualizar visitante");
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Erro ao atualizar visitante");
			}
		}
	};

	if (isLoading) {
		return <VisitorsSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Visitantes</h1>
					<p className="text-muted-foreground">Gerencie e pesquise visitantes do condomínio</p>
				</div>
			</div>

			{/* Search and Tabs */}
			<Card>
				<CardContent className="pt-6">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="busca">Busca</TabsTrigger>
							<TabsTrigger value="cadastro">Cadastro</TabsTrigger>
						</TabsList>

						{/* Busca Tab */}
						<TabsContent value="busca" className="mt-6">
							{/* Search Field */}
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
												{filterBy === "name" && "Nome"}
												{filterBy === "document" && "Documento"}
												{filterBy === "apartment" && "Apartamento"}
												<ChevronDown className="ml-2 h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => setFilterBy("name")}
												className="flex items-center justify-between"
											>
												<span>Nome</span>
												{filterBy === "name" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setFilterBy("document")}
												className="flex items-center justify-between"
											>
												<span>Documento</span>
												{filterBy === "document" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setFilterBy("apartment")}
												className="flex items-center justify-between"
											>
												<span>Apartamento</span>
												{filterBy === "apartment" && <Check className="h-4 w-4 ml-2" />}
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
									{isUsingLatestVisitors ? (
										<p className="text-sm text-muted-foreground">
											<span className="font-medium text-foreground">
												Últimos visitantes cadastrados
											</span>
											{" - "}
											Mostrando {filteredVisitors.length} visitante(s)
										</p>
									) : (
										<>
											<p className="text-sm text-muted-foreground">
												Mostrando{" "}
												{paginatedVisitors.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
												{Math.min(currentPage * itemsPerPage, filteredVisitors.length)} de{" "}
												{filteredVisitors.length} visitante(s)
											</p>
											<div className="flex items-center gap-2">
												<Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
													Itens por página:
												</Label>
												<Select
													value={itemsPerPage.toString()}
													onValueChange={(value) => {
														setItemsPerPage(Number(value));
														setCurrentPage(1);
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
										</>
									)}
								</div>

								{filteredVisitors.length === 0 ? (
									<Card>
										<CardContent className="pt-6">
											<div className="flex flex-col items-center justify-center py-12 text-center">
												<UserCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
												<p className="text-sm text-muted-foreground">Nenhum visitante encontrado</p>
											</div>
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardContent className="p-0">
											<div className="divide-y">
												{paginatedVisitors.map((visitor) => (
													<div
														key={visitor._id}
														className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
													>
														<div
															className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
															onClick={() => handleViewVisitor(visitor)}
														>
															<div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
																<User className="w-7 h-7 text-primary" />
															</div>
															<div className="flex-1 min-w-0">
																<h3 className="font-semibold text-base mb-1 truncate">
																	{formatNameToCamelCase(visitor.name)}
																</h3>
																<div className="flex items-center gap-3 text-sm text-muted-foreground">
																	{visitor.apartmentNumber && (
																		<>
																			<span>Apt: {visitor.apartmentNumber}</span>
																			{(visitor.phone || visitor.vehiclePlate) && (
																				<span className="text-muted-foreground/50">•</span>
																			)}
																		</>
																	)}
																	{visitor.phone && (
																		<>
																			<span>{visitor.phone}</span>
																			{visitor.vehiclePlate && (
																				<span className="text-muted-foreground/50">•</span>
																			)}
																		</>
																	)}
																	{visitor.vehiclePlate && (
																		<span className="font-mono">{visitor.vehiclePlate}</span>
																	)}
																</div>
															</div>
														</div>
														<div className="flex items-center gap-2 flex-shrink-0">
															<div className="flex flex-wrap gap-1.5">
																{[...visitor.types]
																	.sort((a, b) => {
																		const aLabel =
																			a === "convidado" || a === "CONVIDADO"
																				? "Convidado"
																				: "Prestador";
																		const bLabel =
																			b === "convidado" || b === "CONVIDADO"
																				? "Convidado"
																				: "Prestador";
																		return aLabel.localeCompare(bLabel);
																	})
																	.map((type) => (
																		<Badge
																			key={type}
																			variant={
																				type === "convidado" || type === "CONVIDADO"
																					? "default"
																					: "secondary"
																			}
																			className="text-xs"
																		>
																			{type === "convidado" || type === "CONVIDADO"
																				? "Convidado"
																				: "Prestador"}
																		</Badge>
																	))}
															</div>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
																onClick={(e) => handleQuickConfirmVisit(visitor, e)}
																title="Confirmar visita"
															>
																<UserPlus className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																onClick={(e) => handleEditVisitor(visitor, e)}
																title="Editar visitante"
															>
																<Pencil className="h-4 w-4" />
															</Button>
														</div>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{!isUsingLatestVisitors && totalPages > 1 && (
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
													disabled={currentPage === 1}
													className="gap-1"
												>
													<ChevronLeft className="h-4 w-4" />
													Anterior
												</Button>
											</PaginationItem>
											{Array.from({ length: totalPages }, (_, i) => i + 1)
												.filter((page) => {
													if (totalPages <= 7) return true;
													if (page === 1 || page === totalPages) return true;
													if (Math.abs(page - currentPage) <= 1) return true;
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
																	variant={currentPage === page ? "default" : "outline"}
																	size="sm"
																	onClick={() => setCurrentPage(page)}
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
													onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
													disabled={currentPage === totalPages}
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

						{/* Cadastro Tab */}
						<TabsContent value="cadastro" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Cadastrar Novo Visitante</CardTitle>
								</CardHeader>
								<CardContent>
									<form
										onSubmit={(e) => {
											e.preventDefault();
											visitorForm.handleSubmit(
												(data) => {
													handleAddVisitor(data);
												},
												(errors) => {
													toast.error("Por favor, corrija os erros no formulário");
												},
											)();
										}}
										className="space-y-4"
									>
										<div className="space-y-2">
											<Label htmlFor="name">Nome Completo *</Label>
											<Input
												id="name"
												placeholder="Ex: João Silva Santos"
												{...visitorForm.register("name")}
											/>
											{visitorForm.formState.errors.name && (
												<p className="text-sm text-destructive">
													{visitorForm.formState.errors.name.message}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="document">Documento (Opcional)</Label>
											<Input
												id="document"
												placeholder="00000000000"
												maxLength={11}
												{...visitorForm.register("document")}
											/>
											{visitorForm.formState.errors.document && (
												<p className="text-sm text-destructive">
													{visitorForm.formState.errors.document.message}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="phone">Telefone (Opcional)</Label>
											<Input
												id="phone"
												placeholder="(11) 98765-4321"
												{...visitorForm.register("phone")}
											/>
											{visitorForm.formState.errors.phone && (
												<p className="text-sm text-destructive">
													{visitorForm.formState.errors.phone.message}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="email">Email (Opcional)</Label>
											<Input
												id="email"
												type="email"
												placeholder="exemplo@email.com"
												{...visitorForm.register("email")}
											/>
											{visitorForm.formState.errors.email && (
												<p className="text-sm text-destructive">
													{visitorForm.formState.errors.email.message}
												</p>
											)}
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="vehicleType">Tipo de Veículo (Opcional)</Label>
												<Select
													value={visitorForm.watch("vehicleType") || "none"}
													onValueChange={(value) =>
														visitorForm.setValue("vehicleType", value === "none" ? "" : value)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o tipo de veículo" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">Nenhum</SelectItem>
														<SelectItem value="CARRO">Carro</SelectItem>
														<SelectItem value="MOTO">Moto</SelectItem>
													</SelectContent>
												</Select>
												{visitorForm.formState.errors.vehicleType && (
													<p className="text-sm text-destructive">
														{visitorForm.formState.errors.vehicleType.message}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="vehiclePlate">Placa (Opcional)</Label>
												<Input
													id="vehiclePlate"
													placeholder="ABC1234 ou ABC1D23"
													{...visitorForm.register("vehiclePlate")}
												/>
												{visitorForm.formState.errors.vehiclePlate && (
													<p className="text-sm text-destructive">
														{visitorForm.formState.errors.vehiclePlate.message}
													</p>
												)}
											</div>
										</div>

										<div className="space-y-2">
											<Label>Tipo de Visitante *</Label>
											<div className="space-y-2">
												<div className="flex items-center space-x-2">
													<Checkbox
														id="convidado"
														checked={visitorForm.watch("types")?.includes("convidado")}
														onCheckedChange={(checked) =>
															handleTypeChange("convidado", checked as boolean)
														}
													/>
													<Label htmlFor="convidado" className="text-sm font-normal cursor-pointer">
														Convidado
													</Label>
												</div>
												<div className="flex items-center space-x-2">
													<Checkbox
														id="prestador_servico"
														checked={visitorForm.watch("types")?.includes("prestador_servico")}
														onCheckedChange={(checked) =>
															handleTypeChange("prestador_servico", checked as boolean)
														}
													/>
													<Label
														htmlFor="prestador_servico"
														className="text-sm font-normal cursor-pointer"
													>
														Prestador de Serviço
													</Label>
												</div>
											</div>
											{visitorForm.formState.errors.types && (
												<p className="text-sm text-destructive">
													{visitorForm.formState.errors.types.message}
												</p>
											)}
										</div>

										{/* Campo de empresa - aparece apenas se for prestador */}
										{visitorForm.watch("types")?.includes("prestador_servico") && (
											<div className="space-y-2">
												<Label htmlFor="companyName">Nome da Empresa (Opcional)</Label>
												<Input
													id="companyName"
													placeholder="Ex: Empresa ABC Ltda"
													{...visitorForm.register("companyName")}
												/>
												{visitorForm.formState.errors.companyName && (
													<p className="text-sm text-destructive">
														{visitorForm.formState.errors.companyName.message}
													</p>
												)}
												<p className="text-xs text-muted-foreground">
													Informe o nome da empresa caso o visitante seja um prestador de serviços
												</p>
											</div>
										)}

										<div className="space-y-2">
											<Label htmlFor="photo">Foto *</Label>
											{showCamera ? (
												<CameraCapture
													onCapture={handlePhotoCapture}
													onCancel={() => setShowCamera(false)}
												/>
											) : (
												<div className="space-y-2">
													{photoPreview ? (
														<div className="relative">
															<img
																src={photoPreview}
																alt="Preview"
																className="w-full h-48 object-cover rounded-lg border"
															/>
															<Button
																type="button"
																variant="destructive"
																size="icon"
																className="absolute top-2 right-2"
																onClick={handleRemovePhoto}
															>
																<X className="w-4 h-4" />
															</Button>
														</div>
													) : (
														<div className="flex gap-2">
															<Button
																type="button"
																variant="outline"
																onClick={() => setShowCamera(true)}
																className="flex-1"
															>
																<Camera className="w-4 h-4 mr-2" />
																Tirar Foto
															</Button>
														</div>
													)}
												</div>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="note">Observações (Opcional)</Label>
											<Textarea
												id="note"
												placeholder="Digite observações sobre o visitante..."
												rows={4}
												{...visitorForm.register("note")}
											/>
											{visitorForm.formState.errors.note && (
												<p className="text-sm text-destructive">
													{visitorForm.formState.errors.note.message}
												</p>
											)}
										</div>

										{/* Campos opcionais para cadastrar primeira visita */}
										<div className="border-t pt-4 mt-4 space-y-4">
											<div className="space-y-2">
												<Label className="text-base font-semibold">Cadastrar Primeira Visita (Opcional)</Label>
												<p className="text-sm text-muted-foreground">
													Preencha os campos abaixo se desejar cadastrar a primeira visita junto com o visitante
												</p>
											</div>

											<div className="space-y-2">
												<Label htmlFor="visit-apartment">Apartamento da Visita (Opcional)</Label>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															type="button"
															variant="outline"
															role="combobox"
															className="w-full justify-between"
														>
															{visitorForm.watch("visitApartmentId")
																? (() => {
																		const selectedApt = apartments.find(
																			(apt) => apt._id === visitorForm.watch("visitApartmentId"),
																		);
																		return selectedApt
																			? `${selectedApt.block ? `Bloco ${selectedApt.block} - ` : ""}Apartamento ${selectedApt.number}`
																			: "Selecione";
																	})()
																: "Selecione o apartamento"}
															<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-[var(--radix-popover-trigger-width)] p-0"
														align="start"
													>
														<Command>
															<CommandInput placeholder="Buscar apartamento..." />
															<CommandList>
																<CommandEmpty>Nenhum apartamento encontrado.</CommandEmpty>
																<CommandGroup>
																	<CommandItem
																		value="__none__"
																		onSelect={() => visitorForm.setValue("visitApartmentId", "")}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				!visitorForm.watch("visitApartmentId") ? "opacity-100" : "opacity-0",
																			)}
																		/>
																		Nenhum
																	</CommandItem>
																	{apartments
																		.sort((a, b) => {
																			if (a.block && b.block && a.block !== b.block) {
																				return a.block.localeCompare(b.block);
																			}
																			return a.number.localeCompare(b.number, undefined, {
																				numeric: true,
																				sensitivity: "base",
																			});
																		})
																		.map((apt) => {
																			const aptLabel = `${apt.block ? `Bloco ${apt.block} - ` : ""}Apartamento ${apt.number}${apt.floor ? ` (${apt.floor}º andar)` : ""}`;
																			return (
																				<CommandItem
																					key={apt._id}
																					value={`${apt.number} ${apt.block || ""} ${apt.floor || ""}`}
																					onSelect={() => visitorForm.setValue("visitApartmentId", apt._id)}
																				>
																					<Check
																						className={cn(
																							"mr-2 h-4 w-4",
																							visitorForm.watch("visitApartmentId") === apt._id
																								? "opacity-100"
																								: "opacity-0",
																						)}
																					/>
																					{aptLabel}
																				</CommandItem>
																			);
																		})}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
											</div>

											<div className="space-y-2">
												<Label htmlFor="visit-note">Anotação da Visita (Opcional)</Label>
												<Textarea
													id="visit-note"
													placeholder="Ex: Visita para piscina, entrega de documento, manutenção..."
													rows={4}
													{...visitorForm.register("visitNote")}
												/>
												{visitorForm.formState.errors.visitNote && (
													<p className="text-sm text-destructive">
														{visitorForm.formState.errors.visitNote.message}
													</p>
												)}
											</div>
										</div>

										<div className="flex gap-4 pt-4">
											<Button
												type="submit"
												className="flex-1"
												disabled={visitorForm.formState.isSubmitting}
											>
												{visitorForm.formState.isSubmitting
													? "Cadastrando..."
													: "Cadastrar Visitante"}
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													visitorForm.reset();
													setCapturedPhoto(null);
													setPhotoPreview(null);
													setShowCamera(false);
												}}
												disabled={visitorForm.formState.isSubmitting}
											>
												Limpar
											</Button>
										</div>
									</form>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* View Visitor Dialog */}
			<Dialog
				open={isViewDialogOpen}
				onOpenChange={(open) => {
					setIsViewDialogOpen(open);
					if (!open) {
						setSelectedVisitor(null);
						setPhotoError(null);
						// Limpar loading states
						setImageLoading({});
					}
				}}
			>
				<DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
					<DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
						<DialogTitle className="flex items-center gap-2">
							<UserCheck className="w-5 h-5 text-primary" />
							Detalhes do Visitante
						</DialogTitle>
					</DialogHeader>

					{isLoadingVisitorDetails ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						</div>
					) : selectedVisitor ? (
						<>
							{/* Visitor Header - Same for both views */}
							<div className="flex flex-col items-center px-6 pb-4">
								{photoError || !selectedVisitor.photoUrl ? (
									<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
										<span className="text-3xl font-bold text-primary">
											{selectedVisitor.name.charAt(0).toUpperCase()}
										</span>
									</div>
								) : (
									<div className="relative w-24 h-24">
										{imageLoading[selectedVisitor._id] && (
											<div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full border-4 border-primary/20">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
											</div>
										)}
										<img
											src={selectedVisitor.photoUrl}
											alt={`Foto de ${selectedVisitor.name}`}
											className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
											style={{ display: imageLoading[selectedVisitor._id] ? "none" : "block" }}
											onError={() => {
												setPhotoError(selectedVisitor.photoUrl || null);
												setImageLoading((prev) => ({ ...prev, [selectedVisitor._id]: false }));
											}}
											onLoad={() => {
												setPhotoError(null);
												setImageLoading((prev) => ({ ...prev, [selectedVisitor._id]: false }));
											}}
										/>
									</div>
								)}
								<p className="font-semibold text-lg mt-3">{formatNameToCamelCase(selectedVisitor.name)}</p>
							</div>

							{/* Details View */}
							{!isVisitRegistrationMode ? (
								<>
									<div className="overflow-y-auto px-6 flex-1 min-h-0">
										<Tabs
											value={modalTab}
											onValueChange={(value) => setModalTab(value as "detalhes" | "historico")}
										>
											<TabsList className="grid w-full grid-cols-2 mb-4">
												<TabsTrigger value="detalhes">Detalhes</TabsTrigger>
												<TabsTrigger value="historico">Histórico de Visitas</TabsTrigger>
											</TabsList>

											{/* Detalhes Tab */}
											<TabsContent value="detalhes" className="space-y-3 mt-0">
												<div className="space-y-3">
													{selectedVisitor.document && (
														<div>
															<Label className="text-muted-foreground">Documento</Label>
															<p className="font-medium">{selectedVisitor.document}</p>
														</div>
													)}

													{selectedVisitor.email && (
														<div>
															<Label className="text-muted-foreground">Email</Label>
															<p className="font-medium">{selectedVisitor.email}</p>
														</div>
													)}

													{selectedVisitor.phone && (
														<div>
															<Label className="text-muted-foreground">Telefone</Label>
															<p className="font-medium">{selectedVisitor.phone}</p>
														</div>
													)}

													{selectedVisitor.apartmentNumber && (
														<div>
															<Label className="text-muted-foreground">Apartamento</Label>
															<p className="font-medium">{selectedVisitor.apartmentNumber}</p>
														</div>
													)}

													<div>
														<Label className="text-muted-foreground">Tipos</Label>
														<div className="flex flex-wrap gap-2 mt-1">
															{[...selectedVisitor.types]
																.sort((a, b) => {
																	const aLabel =
																		a === "convidado" || a === "CONVIDADO"
																			? "Convidado"
																			: "Prestador de Serviço";
																	const bLabel =
																		b === "convidado" || b === "CONVIDADO"
																			? "Convidado"
																			: "Prestador de Serviço";
																	return aLabel.localeCompare(bLabel);
																})
																.map((type) => (
																	<Badge
																		key={type}
																		variant={
																			type === "convidado" || type === "CONVIDADO"
																				? "default"
																				: "secondary"
																		}
																	>
																		{type === "convidado" || type === "CONVIDADO"
																			? "Convidado"
																			: "Prestador de Serviço"}
																	</Badge>
																))}
														</div>
													</div>

													{selectedVisitor.companyName && (
														<div>
															<Label className="text-muted-foreground">Empresa</Label>
															<p className="font-medium">{selectedVisitor.companyName}</p>
														</div>
													)}

													{selectedVisitor.vehicleType && (
														<div>
															<Label className="text-muted-foreground">Tipo de Veículo</Label>
															<p className="font-medium">{selectedVisitor.vehicleType}</p>
														</div>
													)}

													{selectedVisitor.vehiclePlate && (
														<div>
															<Label className="text-muted-foreground">Placa</Label>
															<p className="font-medium">{selectedVisitor.vehiclePlate}</p>
														</div>
													)}

													{selectedVisitor.note && (
														<div>
															<Label className="text-muted-foreground">Observações</Label>
															<p className="font-medium whitespace-pre-wrap">
																{selectedVisitor.note}
															</p>
														</div>
													)}

													{selectedVisitor.registeredAt && (
														<div>
															<Label className="text-muted-foreground">Data de Registro</Label>
															<p className="font-medium">
																{new Date(selectedVisitor.registeredAt).toLocaleString("pt-BR", {
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</p>
														</div>
													)}

													{selectedVisitor.registeredBy && (
														<div>
															<Label className="text-muted-foreground">Registrado por</Label>
															<p className="font-medium">{selectedVisitor.registeredBy}</p>
														</div>
													)}

													{selectedVisitor.updatedBy && (
														<div>
															<Label className="text-muted-foreground">Editado por</Label>
															<p className="font-medium">{selectedVisitor.updatedBy}</p>
														</div>
													)}
												</div>
											</TabsContent>

											{/* Histórico de Visitas Tab */}
											<TabsContent value="historico" className="mt-0">
												{isLoadingVisits ? (
													<div className="flex items-center justify-center py-8">
														<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
													</div>
												) : visits.length === 0 ? (
													<div className="text-center py-8 text-muted-foreground text-sm">
														<Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
														Nenhuma visita registrada
													</div>
												) : (
													<div className="space-y-3">
														<p className="text-sm text-muted-foreground mb-3">
															Total de {visitsTotal} visita(s) registrada(s)
														</p>
														{visits.map((visit) => (
															<div key={visit._id} className="p-3 bg-accent/30 rounded-lg text-sm">
																<div className="flex items-center justify-between mb-1">
																	<div className="flex items-center gap-2 text-muted-foreground">
																		<Calendar className="w-3 h-3" />
																		<span>
																			{new Date(visit.registeredAt).toLocaleString("pt-BR", {
																				day: "2-digit",
																				month: "2-digit",
																				year: "numeric",
																				hour: "2-digit",
																				minute: "2-digit",
																			})}
																		</span>
																	</div>
																	{visit.apartmentNumber && (
																		<span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
																			{visit.apartmentBlock
																				? `Bloco ${visit.apartmentBlock} - `
																				: ""}
																			Apt {visit.apartmentNumber}
																			{visit.apartmentFloor ? ` (${visit.apartmentFloor}º)` : ""}
																		</span>
																	)}
																</div>
																{visit.registeredBy && (
																	<div className="text-xs text-muted-foreground mb-1">
																		Registrado por: {visit.registeredBy}
																	</div>
																)}
																{visit.note && (
																	<div className="flex items-start gap-2 mt-2">
																		<FileText className="w-3 h-3 text-muted-foreground mt-0.5" />
																		<span className="text-foreground">{visit.note}</span>
																	</div>
																)}
															</div>
														))}

														{/* Pagination for visits */}
														{visitsTotalPages > 1 && (
															<div className="flex items-center justify-center gap-2 pt-2">
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => {
																		if (selectedVisitor && visitsPage > 1) {
																			loadVisitorVisits(selectedVisitor._id, visitsPage - 1);
																		}
																	}}
																	disabled={visitsPage === 1}
																	className="h-7 px-2"
																>
																	<ChevronLeft className="h-4 w-4" />
																</Button>
																<span className="text-xs text-muted-foreground">
																	{visitsPage} / {visitsTotalPages}
																</span>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => {
																		if (selectedVisitor && visitsPage < visitsTotalPages) {
																			loadVisitorVisits(selectedVisitor._id, visitsPage + 1);
																		}
																	}}
																	disabled={visitsPage === visitsTotalPages}
																	className="h-7 px-2"
																>
																	<ChevronRight className="h-4 w-4" />
																</Button>
															</div>
														)}
													</div>
												)}
											</TabsContent>
										</Tabs>
									</div>

									<div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
										<Button onClick={() => setIsVisitRegistrationMode(true)} className="flex-1">
											Registrar Nova Visita
										</Button>
									</div>
								</>
							) : (
								/* Visit Registration View */
								<>
									<div className="space-y-6 overflow-y-auto px-6 flex-1 min-h-0">
										{/* Registration Form */}
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="visit-apartment">Apartamento (Opcional)</Label>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															role="combobox"
															className="w-full justify-between"
														>
															{visitApartmentId
																? (() => {
																		const selectedApt = apartments.find(
																			(apt) => apt._id === visitApartmentId,
																		);
																		return selectedApt
																			? `${selectedApt.block ? `Bloco ${selectedApt.block} - ` : ""}Apartamento ${selectedApt.number}`
																			: "Selecione";
																	})()
																: "Selecione o apartamento"}
															<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-[var(--radix-popover-trigger-width)] p-0"
														align="start"
													>
														<Command>
															<CommandInput placeholder="Buscar apartamento..." />
															<CommandList>
																<CommandEmpty>Nenhum apartamento encontrado.</CommandEmpty>
																<CommandGroup>
																	<CommandItem
																		value="__none__"
																		onSelect={() => setVisitApartmentId("")}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				!visitApartmentId ? "opacity-100" : "opacity-0",
																			)}
																		/>
																		Nenhum
																	</CommandItem>
																	{apartments
																		.sort((a, b) => {
																			if (a.block && b.block && a.block !== b.block) {
																				return a.block.localeCompare(b.block);
																			}
																			return a.number.localeCompare(b.number, undefined, {
																				numeric: true,
																				sensitivity: "base",
																			});
																		})
																		.map((apt) => {
																			const aptLabel = `${apt.block ? `Bloco ${apt.block} - ` : ""}Apartamento ${apt.number}${apt.floor ? ` (${apt.floor}º andar)` : ""}`;
																			return (
																				<CommandItem
																					key={apt._id}
																					value={`${apt.number} ${apt.block || ""} ${apt.floor || ""}`}
																					onSelect={() => setVisitApartmentId(apt._id)}
																				>
																					<Check
																						className={cn(
																							"mr-2 h-4 w-4",
																							visitApartmentId === apt._id
																								? "opacity-100"
																								: "opacity-0",
																						)}
																					/>
																					{aptLabel}
																				</CommandItem>
																			);
																		})}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
											</div>

											<div className="space-y-2">
												<Label htmlFor="visit-note">Anotação (Opcional)</Label>
												<Textarea
													id="visit-note"
													placeholder="Ex: Visita para piscina, entrega de documento, manutenção..."
													rows={4}
													value={visitNote}
													onChange={(e) => setVisitNote(e.target.value)}
												/>
											</div>
										</div>
									</div>

									<div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
										<Button
											variant="outline"
											onClick={() => {
												setIsVisitRegistrationMode(false);
												setVisitNote("");
												setVisitApartmentId("");
											}}
											disabled={isRegisteringVisit}
											className="flex-1"
										>
											Voltar
										</Button>
										<Button
											onClick={handleRegisterVisit}
											disabled={isRegisteringVisit}
											className="flex-1"
										>
											{isRegisteringVisit ? "Confirmando..." : "Confirmar Visita"}
										</Button>
									</div>
								</>
							)}
						</>
					) : null}
				</DialogContent>
			</Dialog>

			{/* Edit Visitor Dialog */}
			<Dialog
				open={isEditDialogOpen}
				onOpenChange={(open) => {
					setIsEditDialogOpen(open);
					if (!open) {
						setEditingVisitor(null);
						setInitialEditData(null);
						editVisitorForm.reset();
					}
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
					<DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
						<DialogTitle className="flex items-center gap-2">
							<Pencil className="w-5 h-5 text-primary" />
							Editar Visitante
						</DialogTitle>
					</DialogHeader>

					{isLoadingVisitorForEdit ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						</div>
					) : editingVisitor ? (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								editVisitorForm.handleSubmit(
									(data) => {
										handleUpdateVisitor(data);
									},
									(errors) => {
										console.error("Form validation errors:", errors);
										toast.error("Por favor, corrija os erros no formulário");
									},
								)();
							}}
							className="flex flex-col flex-1 min-h-0"
						>
							<div className="space-y-4 overflow-y-auto px-6 flex-1 min-h-0">
								<div className="space-y-2">
									<Label htmlFor="edit-name">Nome Completo *</Label>
									<Input
										id="edit-name"
										placeholder="Ex: João Silva Santos"
										{...editVisitorForm.register("name")}
									/>
									{editVisitorForm.formState.errors.name && (
										<p className="text-sm text-destructive">
											{editVisitorForm.formState.errors.name.message}
										</p>
									)}
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="edit-document">Documento (Opcional)</Label>
										<Input
											id="edit-document"
											placeholder="CPF ou RG"
											{...editVisitorForm.register("document")}
										/>
										{editVisitorForm.formState.errors.document && (
											<p className="text-sm text-destructive">
												{editVisitorForm.formState.errors.document.message}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="edit-phone">Telefone (Opcional)</Label>
										<Input
											id="edit-phone"
											placeholder="(00) 00000-0000"
											{...editVisitorForm.register("phone")}
										/>
										{editVisitorForm.formState.errors.phone && (
											<p className="text-sm text-destructive">
												{editVisitorForm.formState.errors.phone.message}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="edit-email">Email (Opcional)</Label>
									<Input
										id="edit-email"
										type="email"
										placeholder="email@example.com"
										{...editVisitorForm.register("email")}
									/>
									{editVisitorForm.formState.errors.email && (
										<p className="text-sm text-destructive">
											{editVisitorForm.formState.errors.email.message}
										</p>
									)}
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="edit-vehicleType">Tipo de Veículo (Opcional)</Label>
										<Select
											value={editVisitorForm.watch("vehicleType") || "none"}
											onValueChange={(value) =>
												editVisitorForm.setValue("vehicleType", value === "none" ? "" : value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o tipo de veículo" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">Nenhum</SelectItem>
												<SelectItem value="CARRO">Carro</SelectItem>
												<SelectItem value="MOTO">Moto</SelectItem>
											</SelectContent>
										</Select>
										{editVisitorForm.formState.errors.vehicleType && (
											<p className="text-sm text-destructive">
												{editVisitorForm.formState.errors.vehicleType.message}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-vehiclePlate">Placa (Opcional)</Label>
										<Input
											id="edit-vehiclePlate"
											placeholder="ABC1234 ou ABC1D23"
											{...editVisitorForm.register("vehiclePlate")}
										/>
										{editVisitorForm.formState.errors.vehiclePlate && (
											<p className="text-sm text-destructive">
												{editVisitorForm.formState.errors.vehiclePlate.message}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<Label>Tipos de Visitante *</Label>
									<div className="flex gap-6">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="edit-convidado"
												checked={editVisitorForm.watch("types")?.includes("convidado")}
												onCheckedChange={(checked) =>
													handleEditTypeChange("convidado", checked as boolean)
												}
											/>
											<Label
												htmlFor="edit-convidado"
												className="text-sm font-normal cursor-pointer"
											>
												Convidado
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="edit-prestador_servico"
												checked={editVisitorForm.watch("types")?.includes("prestador_servico")}
												onCheckedChange={(checked) =>
													handleEditTypeChange("prestador_servico", checked as boolean)
												}
											/>
											<Label
												htmlFor="edit-prestador_servico"
												className="text-sm font-normal cursor-pointer"
											>
												Prestador de Serviço
											</Label>
										</div>
									</div>
									{editVisitorForm.formState.errors.types && (
										<p className="text-sm text-destructive">
											{editVisitorForm.formState.errors.types.message}
										</p>
									)}
								</div>

								{/* Campo de empresa - aparece apenas se for prestador */}
								{editVisitorForm.watch("types")?.includes("prestador_servico") && (
									<div className="space-y-2">
										<Label htmlFor="edit-companyName">Nome da Empresa (Opcional)</Label>
										<Input
											id="edit-companyName"
											placeholder="Ex: Empresa ABC Ltda"
											{...editVisitorForm.register("companyName")}
										/>
										{editVisitorForm.formState.errors.companyName && (
											<p className="text-sm text-destructive">
												{editVisitorForm.formState.errors.companyName.message}
											</p>
										)}
										<p className="text-xs text-muted-foreground">
											Informe o nome da empresa caso o visitante seja um prestador de serviços
										</p>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="edit-note">Observações (Opcional)</Label>
									<Textarea
										id="edit-note"
										placeholder="Digite observações sobre o visitante..."
										rows={4}
										{...editVisitorForm.register("note")}
									/>
									{editVisitorForm.formState.errors.note && (
										<p className="text-sm text-destructive">
											{editVisitorForm.formState.errors.note.message}
										</p>
									)}
								</div>
							</div>

							<div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsEditDialogOpen(false);
										setEditingVisitor(null);
										setInitialEditData(null);
										editVisitorForm.reset();
									}}
									disabled={editVisitorForm.formState.isSubmitting}
									className="flex-1"
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									disabled={editVisitorForm.formState.isSubmitting || !hasChanges}
									className="flex-1"
								>
									{editVisitorForm.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
								</Button>
							</div>
						</form>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
