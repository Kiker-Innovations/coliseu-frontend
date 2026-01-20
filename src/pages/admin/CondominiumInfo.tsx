import { useState, useEffect } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
	Building2,
	Users,
	MapPin,
	ChevronDown,
	Plus,
	Edit,
	Trash2,
	DollarSign,
	Search,
	ChevronLeft,
	ChevronRight,
	Check,
	UserCheck,
	Calendar,
	Clock,
	CalendarDays,
	Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { amenitySchema, type AmenitySchema } from "@/schemas/admin/condominiumInfo.schema";
import CondominiumInfoSkeleton from "@/skeleton/admin/CondominiumInfoSkeleton";
import { amenitiesService, type Amenity } from "@/services/api";
import { adminService } from "@/services/api";
import { apartmentsService } from "@/services/api";
import { bookingsService, type Booking } from "@/services/api";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CondominiumInfo() {
	const [isLoading, setIsLoading] = useState(true);
	const [isResidentsOpen, setIsResidentsOpen] = useState(false);
	const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
	const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
	const [isDeleteAreaDialogOpen, setIsDeleteAreaDialogOpen] = useState(false);
	const [areaToDelete, setAreaToDelete] = useState<{ id: string; name: string } | null>(null);
	const [amenities, setAmenities] = useState<Amenity[]>([]);
	const [totalApartments, setTotalApartments] = useState(0);
	const [totalResidents, setTotalResidents] = useState(0);
	const [totalAmenities, setTotalAmenities] = useState(0);
	const [residents, setResidents] = useState<
		Array<{
			apartment: string;
			name: string;
			email: string;
		}>
	>([]);
	const [buildingId, setBuildingId] = useState<string>("");
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [isLoadingBookings, setIsLoadingBookings] = useState(false);

	// Estados para modal de calendário de reservas
	const [isBookingsCalendarOpen, setIsBookingsCalendarOpen] = useState(false);
	const [selectedAmenityForBookings, setSelectedAmenityForBookings] = useState<Amenity | null>(null);
	const [amenityBookings, setAmenityBookings] = useState<Booking[]>([]);
	const [isLoadingAmenityBookings, setIsLoadingAmenityBookings] = useState(false);
	const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
	const [bookingDates, setBookingDates] = useState<Map<string, Booking[]>>(new Map());

	// Estados para itens da comodidade
	const [hasItems, setHasItems] = useState(false);
	const [amenityItems, setAmenityItems] = useState<{ name: string; quantity: number }[]>([]);
	const [newItemName, setNewItemName] = useState("");
	const [newItemQuantity, setNewItemQuantity] = useState<number>(1);

	// Estados para busca de condôminos
	const [searchTerm, setSearchTerm] = useState("");
	const [activeSearchTerm, setActiveSearchTerm] = useState("");
	const [filterBy, setFilterBy] = useState<"name" | "phone" | "email" | "apartment">("name");
	const [statusFilter, setStatusFilter] = useState<
		"A_CONFIRMACAO_EMAIL" | "A_VALIDACAO" | "REJEITADO" | "ATIVO" | "INATIVO" | undefined
	>(undefined);
	const [residentsList, setResidentsList] = useState<
		Array<{
			_id: string;
			name: string;
			email: string;
			phone?: string;
			apartmentNumber?: string;
			status: string;
		}>
	>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [totalResidentsList, setTotalResidentsList] = useState(0);
	const [isLoadingResidents, setIsLoadingResidents] = useState(false);
	const [isUsingLatestResidents, setIsUsingLatestResidents] = useState(false);

	// Estados para modal de detalhes
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedResident, setSelectedResident] = useState<{
		_id: string;
		name: string;
		email: string;
		phone?: string;
		apartmentId: string;
		apartmentNumber?: string;
		apartmentFloor?: number;
		apartmentBlock?: string;
		status?: string;
		photoUrl?: string | null;
		residentCode?: string;
		createdAt?: string;
		updatedAt?: string;
		rejectType?: string;
		rejectNote?: string;
		inactiveType?: string;
		inactiveNote?: string;
		activatedAt?: string;
		inactivatedAt?: string;
		rejectedAt?: string;
	} | null>(null);
	const [isLoadingResidentDetails, setIsLoadingResidentDetails] = useState(false);
	const [photoError, setPhotoError] = useState<string | null>(null);
	const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
	const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [residentToReject, setResidentToReject] = useState<{
		_id: string;
		name: string;
	} | null>(null);
	const [rejectType, setRejectType] = useState<string>("");
	const [rejectNote, setRejectNote] = useState<string>("");
	const [isRejecting, setIsRejecting] = useState(false);
	const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
	const [residentToDeactivate, setResidentToDeactivate] = useState<{
		_id: string;
		name: string;
	} | null>(null);
	const [inactiveType, setInactiveType] = useState<string>("");
	const [inactiveNote, setInactiveNote] = useState<string>("");
	const [isDeactivating, setIsDeactivating] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

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

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				const bid = getBuildingId();
				setBuildingId(bid);

				if (!bid) {
					toast.error("BuildingId não encontrado. Faça login novamente.");
					setIsLoading(false);
					return;
				}

				// Carregar dados
				const [amenitiesCountRes, amenitiesRes, apartmentsData] = await Promise.all([
					amenitiesService.countAmenitiesByBuilding(bid).catch((err) => {
						console.error("Erro ao contar comodidades:", err);
						return { success: false, data: 0, message: "Erro ao contar comodidades" };
					}),
					amenitiesService.getAmenitiesByBuildingId(bid).catch((err) => {
						console.error("Erro ao buscar comodidades:", err);
						return [];
					}),
					apartmentsService.getApartmentsByBuildingId(bid).catch((err) => {
						console.error("Erro ao buscar apartamentos:", err);
						return [];
					}),
				]);

				setTotalAmenities(amenitiesCountRes?.data ?? 0);
				setAmenities(Array.isArray(amenitiesRes) ? amenitiesRes : []);

				// Calcular totais a partir dos dados retornados
				setTotalApartments(Array.isArray(apartmentsData) ? apartmentsData.length : 0);

				// Carregar total de residentes
				try {
					const countResponse = await adminService.countResidents();
					setTotalResidents(countResponse.data ?? 0);
				} catch (error: any) {
					console.error("Erro ao contar residentes:", error);
					setTotalResidents(0);
				}

				setResidents([]);
			} catch (error: any) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados do condomínio");
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

	// Carregar reservas de comodidades
	useEffect(() => {
		const loadBookings = async () => {
			try {
				setIsLoadingBookings(true);
				const response = await bookingsService.getBookingsByBuilding();
				if (response.success && response.data) {
					setBookings(response.data.bookings || []);
				} else {
					setBookings([]);
				}
			} catch (error: any) {
				console.error("Erro ao carregar reservas:", error);
				setBookings([]);
			} finally {
				setIsLoadingBookings(false);
			}
		};
		loadBookings();
	}, []);

	// Carregar condôminos quando houver busca ativa, filtro de status ou quando não houver filtros (carregar todos)
	useEffect(() => {
		const loadResidents = async () => {
			if (!buildingId) {
				setResidentsList([]);
				setTotalResidentsList(0);
				setTotalPages(1);
				return;
			}

			try {
				setIsLoadingResidents(true);

				// Buscar condôminos usando adminService
				const response = await adminService.getResidents({
					page: currentPage,
					limit: itemsPerPage,
					search: activeSearchTerm || undefined,
					filterBy: activeSearchTerm
						? (filterBy as "name" | "phone" | "email" | "apartment")
						: undefined,
					status: statusFilter as
						| "A_CONFIRMACAO_EMAIL"
						| "A_VALIDACAO"
						| "REJEITADO"
						| "ATIVO"
						| "INATIVO"
						| undefined,
				});

				// A resposta pode vir em response.data.data ou response.data dependendo da estrutura
				const residentsData = response.data?.data || [];
				const total = response.data?.total || 0;
				const pages = response.data?.totalPages || 1;

				setResidentsList(residentsData);
				setTotalResidentsList(total);
				setTotalPages(pages);
				setIsUsingLatestResidents(false);
			} catch (error: any) {
				console.error("Erro ao carregar condôminos:", error);
				toast.error("Erro ao carregar condôminos");
				setResidentsList([]);
				setTotalResidentsList(0);
				setTotalPages(1);
				setIsUsingLatestResidents(false);
			} finally {
				setIsLoadingResidents(false);
			}
		};

		loadResidents();
	}, [currentPage, itemsPerPage, activeSearchTerm, filterBy, statusFilter, buildingId]);

	// Reset page when active search term, filter or status changes
	useEffect(() => {
		if (activeSearchTerm || statusFilter) {
			setCurrentPage(1);
		}
	}, [activeSearchTerm, filterBy, statusFilter]);

	const handleSearchResidents = () => {
		setActiveSearchTerm(searchTerm);
		if (searchTerm) {
			setCurrentPage(1);
		}
	};

	const handleViewResident = async (resident: {
		_id: string;
		name: string;
		email: string;
		phone?: string;
		apartmentNumber?: string;
		status: string;
	}) => {
		setIsViewDialogOpen(true);
		setIsLoadingResidentDetails(true);
		setPhotoError(null);
		setImageLoading({});

		try {
			// Buscar dados completos do resident por ID
			const response = await adminService.getResidentById(resident._id);
			const residentData = response.data;

			if (residentData) {
				setSelectedResident({
					_id: residentData._id,
					name: residentData.name,
					email: residentData.email,
					phone: residentData.phone,
					apartmentId: residentData.apartmentId,
					apartmentNumber: residentData.apartment?.number,
					apartmentBlock: residentData.apartment?.block,
					apartmentFloor: residentData.apartment?.floor,
					status: residentData.status,
					photoUrl: residentData.photoUrl,
					residentCode: residentData.residentCode,
					createdAt: residentData.createdAt,
					updatedAt: residentData.updatedAt,
				});

				// Iniciar loading da imagem se houver photoUrl
				if (residentData.photoUrl) {
					setImageLoading((prev) => ({ ...prev, [residentData._id]: true }));
				}
			} else {
				throw new Error("Dados do residente não encontrados");
			}
		} catch (error: any) {
			console.error("Erro ao buscar detalhes do condômino:", error);
			toast.error(
				error.response?.data?.message || "Erro ao carregar detalhes completos do condômino",
			);
			// Em caso de erro, usar os dados básicos que já temos
			setSelectedResident({
				_id: resident._id,
				name: resident.name,
				email: resident.email,
				phone: resident.phone,
				apartmentId: "",
				apartmentNumber: resident.apartmentNumber,
				status: resident.status,
			});
		} finally {
			setIsLoadingResidentDetails(false);
		}
	};

	const handleApproveResident = async () => {
		if (!selectedResident) return;

		try {
			setIsLoadingResidentDetails(true);
			await adminService.approveResident(selectedResident._id);

			toast.success("Condômino aprovado com sucesso!");

			// Atualizar o status do resident na lista
			setResidentsList((prev) =>
				prev.map((r) => (r._id === selectedResident._id ? { ...r, status: "ATIVO" } : r)),
			);

			// Atualizar o resident selecionado
			setSelectedResident((prev) => (prev ? { ...prev, status: "ATIVO" } : null));

			// Recarregar a lista
			const response = await adminService.getResidents({
				page: currentPage,
				limit: itemsPerPage,
				search: activeSearchTerm || undefined,
				filterBy: activeSearchTerm
					? (filterBy as "name" | "phone" | "email" | "apartment")
					: undefined,
				status: statusFilter as
					| "A_CONFIRMACAO_EMAIL"
					| "A_VALIDACAO"
					| "REJEITADO"
					| "ATIVO"
					| "INATIVO"
					| undefined,
			});
			const residentsData = response.data?.data || [];
			const total = response.data?.total || 0;
			const pages = response.data?.totalPages || 1;
			setResidentsList(residentsData);
			setTotalResidentsList(total);
			setTotalPages(pages);
		} catch (error: any) {
			console.error("Erro ao aprovar condômino:", error);
			toast.error(error.response?.data?.message || "Erro ao aprovar condômino");
		} finally {
			setIsLoadingResidentDetails(false);
		}
	};

	const handleOpenRejectDialog = (resident: {
		_id: string;
		name: string;
	}) => {
		setResidentToReject(resident);
		setRejectType("");
		setRejectNote("");
		setIsRejectDialogOpen(true);
	};

	const handleRejectResident = async () => {
		if (!residentToReject || !rejectType) {
			toast.error("Selecione um tipo de rejeição");
			return;
		}

		try {
			setIsRejecting(true);
			await adminService.rejectResident(residentToReject._id, rejectType, rejectNote || undefined);

			toast.success("Condômino rejeitado com sucesso!");

			// Fechar modal
			setIsRejectDialogOpen(false);
			setResidentToReject(null);
			setRejectType("");
			setRejectNote("");

			// Se o residente rejeitado estava no modal de visualização, fechar também
			if (selectedResident?._id === residentToReject._id) {
				setIsViewDialogOpen(false);
				setSelectedResident(null);
			}

			// Recarregar a lista
			const response = await adminService.getResidents({
				page: currentPage,
				limit: itemsPerPage,
				search: activeSearchTerm || undefined,
				filterBy: activeSearchTerm
					? (filterBy as "name" | "phone" | "email" | "apartment")
					: undefined,
				status: statusFilter as
					| "A_CONFIRMACAO_EMAIL"
					| "A_VALIDACAO"
					| "REJEITADO"
					| "ATIVO"
					| "INATIVO"
					| undefined,
			});
			const residentsData = response.data?.data || [];
			const total = response.data?.total || 0;
			const pages = response.data?.totalPages || 1;
			setResidentsList(residentsData);
			setTotalResidentsList(total);
			setTotalPages(pages);
		} catch (error: any) {
			console.error("Erro ao rejeitar condômino:", error);
			toast.error(error.response?.data?.message || "Erro ao rejeitar condômino");
		} finally {
			setIsRejecting(false);
		}
	};

	const handleOpenDeactivateDialog = (resident: {
		_id: string;
		name: string;
	}) => {
		setResidentToDeactivate(resident);
		setInactiveType("");
		setInactiveNote("");
		setIsDeactivateDialogOpen(true);
	};

	const handleDeactivateResident = async () => {
		if (!residentToDeactivate || !inactiveType) {
			toast.error("Selecione um tipo de inativação");
			return;
		}

		try {
			setIsDeactivating(true);
			await adminService.deactivateResident(
				residentToDeactivate._id,
				inactiveType,
				inactiveNote || undefined,
			);

			toast.success("Condômino inativado com sucesso!");

			// Fechar modal
			setIsDeactivateDialogOpen(false);
			setResidentToDeactivate(null);
			setInactiveType("");
			setInactiveNote("");

			// Se o residente inativado estava no modal de visualização, fechar também
			if (selectedResident?._id === residentToDeactivate._id) {
				setIsViewDialogOpen(false);
				setSelectedResident(null);
			}

			// Recarregar a lista
			const response = await adminService.getResidents({
				page: currentPage,
				limit: itemsPerPage,
				search: activeSearchTerm || undefined,
				filterBy: activeSearchTerm
					? (filterBy as "name" | "phone" | "email" | "apartment")
					: undefined,
				status: statusFilter as
					| "A_CONFIRMACAO_EMAIL"
					| "A_VALIDACAO"
					| "REJEITADO"
					| "ATIVO"
					| "INATIVO"
					| undefined,
			});
			const residentsData = response.data?.data || [];
			const total = response.data?.total || 0;
			const pages = response.data?.totalPages || 1;
			setResidentsList(residentsData);
			setTotalResidentsList(total);
			setTotalPages(pages);
		} catch (error: any) {
			console.error("Erro ao inativar condômino:", error);
			toast.error(error.response?.data?.message || "Erro ao inativar condômino");
		} finally {
			setIsDeactivating(false);
		}
	};

	const handleActivateResident = async () => {
		if (!selectedResident) return;

		try {
			setIsActivating(true);
			await adminService.activateResident(selectedResident._id);

			toast.success("Condômino ativado com sucesso!");

			// Atualizar o status do resident na lista
			setResidentsList((prev) =>
				prev.map((r) => (r._id === selectedResident._id ? { ...r, status: "ATIVO" } : r)),
			);

			// Atualizar o resident selecionado
			setSelectedResident((prev) =>
				prev
					? { ...prev, status: "ATIVO", inactiveType: undefined, inactiveNote: undefined }
					: null,
			);

			// Recarregar a lista
			const response = await adminService.getResidents({
				page: currentPage,
				limit: itemsPerPage,
				search: activeSearchTerm || undefined,
				filterBy: activeSearchTerm
					? (filterBy as "name" | "phone" | "email" | "apartment")
					: undefined,
				status: statusFilter as
					| "A_CONFIRMACAO_EMAIL"
					| "A_VALIDACAO"
					| "REJEITADO"
					| "ATIVO"
					| "INATIVO"
					| undefined,
			});
			const residentsData = response.data?.data || [];
			const total = response.data?.total || 0;
			const pages = response.data?.totalPages || 1;
			setResidentsList(residentsData);
			setTotalResidentsList(total);
			setTotalPages(pages);
		} catch (error: any) {
			console.error("Erro ao ativar condômino:", error);
			toast.error(error.response?.data?.message || "Erro ao ativar condômino");
		} finally {
			setIsActivating(false);
		}
	};

	const areaForm = useForm<AmenitySchema>({
		resolver: zodResolver(amenitySchema),
		defaultValues: {
			name: "",
			nonComplianceFine: undefined,
			usageRules: undefined,
			description: undefined,
			type: undefined,
			value: undefined,
			fineValue: undefined,
			maxResidents: undefined,
			maxHours: undefined,
			bookingType: undefined,
			openingTime: undefined,
			closingTime: undefined,
			status: "ATIVO",
		},
	});

	const onAreaSubmit = async (data: AmenitySchema) => {
		try {
			if (editingAreaId) {
				// Remover campos undefined para evitar problemas na validação
				const updateData: any = {};

				if (data.name) updateData.name = data.name;
				if (data.usageRules !== undefined && data.usageRules !== null) {
					updateData.usageRules = data.usageRules.trim() || undefined;
				}
				if (data.description !== undefined && data.description !== "")
					updateData.description = data.description;
				// Sempre enviar o tipo se estiver definido (importante para AREA_COMUM)
				if (data.type !== undefined && data.type !== null) {
					updateData.type = data.type;
					// Se for AREA_COMUM, remover value e fineValue explicitamente
					if (data.type === "AREA_COMUM") {
						updateData.value = undefined;
						updateData.fineValue = undefined;
					}
				}
				// Só enviar value e fineValue se não for AREA_COMUM
				if (data.type !== "AREA_COMUM") {
					if (data.value !== undefined) updateData.value = data.value;
					if (data.fineValue !== undefined) updateData.fineValue = data.fineValue;
				}
				// nonComplianceFine pode ser enviado para ambos os tipos (incluindo 0 ou null)
				if (data.nonComplianceFine !== undefined) {
					if (data.nonComplianceFine === null) {
						updateData.nonComplianceFine = null;
					} else {
						updateData.nonComplianceFine = Number(data.nonComplianceFine);
					}
				}
				if (data.maxResidents !== undefined) updateData.maxResidents = data.maxResidents;
				if (data.maxHours !== undefined) updateData.maxHours = data.maxHours;
				if (data.bookingType) updateData.bookingType = data.bookingType;
				if (data.openingTime !== undefined) updateData.openingTime = data.openingTime || undefined;
				if (data.closingTime !== undefined) updateData.closingTime = data.closingTime || undefined;
				// Incluir itens se hasItems estiver marcado
				updateData.items = hasItems && amenityItems.length > 0 ? amenityItems : undefined;
				if (data.status) updateData.status = data.status;

				try {
					const response = await amenitiesService.updateAmenity(editingAreaId, updateData);

					if (response.success) {
						toast.success("Comodidade atualizada com sucesso!");

						// Recarregar comodidades após atualização
						if (buildingId) {
							try {
								const [amenitiesCountRes, amenitiesRes] = await Promise.all([
									amenitiesService.countAmenitiesByBuilding(buildingId).catch((err) => {
										console.error("Erro ao contar comodidades:", err);
										return { success: false, data: 0, message: "Erro ao contar comodidades" };
									}),
									amenitiesService.getAmenitiesByBuildingId(buildingId).catch((err) => {
										console.error("Erro ao buscar comodidades:", err);
										return [];
									}),
								]);
								setTotalAmenities(amenitiesCountRes?.data ?? 0);
								setAmenities(Array.isArray(amenitiesRes) ? amenitiesRes : []);
							} catch (error) {
								console.error("Erro ao recarregar comodidades:", error);
							}
						}
					} else {
						toast.error(response.message || "Erro ao atualizar comodidade");
						return;
					}
				} catch (error: any) {
					console.error("Erro ao atualizar comodidade:", error);
					console.error("Erro completo:", error.response?.data || error);
					toast.error(
						error.response?.data?.message || error.message || "Erro ao atualizar comodidade",
					);
					return;
				}

				areaForm.reset();
				setIsAreaDialogOpen(false);
				setEditingAreaId(null);
			} else {
				if (!buildingId) {
					toast.error("BuildingId não encontrado");
					return;
				}
				if (!data.name) {
					toast.error("Nome é obrigatório");
					return;
				}
				if (!data.status) {
					toast.error("Status é obrigatório");
					return;
				}

				const createData: any = {
					buildingId,
					name: data.name,
					status: data.status,
				};

				// Adicionar apenas campos que foram preenchidos
				if (data.usageRules !== undefined && data.usageRules !== null) {
					createData.usageRules = data.usageRules.trim() || undefined;
				}
				if (data.description !== undefined && data.description !== "")
					createData.description = data.description;
				// Sempre enviar o tipo se estiver definido (importante para AREA_COMUM)
				if (data.type !== undefined && data.type !== null) {
					createData.type = data.type;
					// Se for AREA_COMUM, não incluir value e fineValue
					if (data.type === "AREA_COMUM") {
						// Não incluir value e fineValue para AREA_COMUM
					} else {
						if (data.value !== undefined) createData.value = data.value;
						if (data.fineValue !== undefined) createData.fineValue = data.fineValue;
					}
				} else {
					// Se não tiver tipo definido, pode incluir value e fineValue normalmente
					if (data.value !== undefined) createData.value = data.value;
					if (data.fineValue !== undefined) createData.fineValue = data.fineValue;
				}
				// nonComplianceFine pode ser enviado para ambos os tipos (incluindo 0)
				if (data.nonComplianceFine !== undefined && data.nonComplianceFine !== null) {
					createData.nonComplianceFine = Number(data.nonComplianceFine);
				}
				if (data.maxResidents !== undefined) createData.maxResidents = data.maxResidents;
				if (data.maxHours !== undefined) createData.maxHours = data.maxHours;
				if (data.bookingType) createData.bookingType = data.bookingType;
				if (data.openingTime) createData.openingTime = data.openingTime;
				if (data.closingTime) createData.closingTime = data.closingTime;
				// Incluir itens se hasItems estiver marcado
				if (hasItems && amenityItems.length > 0) {
					createData.items = amenityItems;
				}

				try {
					const response = await amenitiesService.createAmenity(createData);

					if (response.success) {
						toast.success("Comodidade cadastrada com sucesso!");
					} else {
						toast.error(response.message || "Erro ao cadastrar comodidade");
						return;
					}
				} catch (error: any) {
					console.error("Erro ao cadastrar comodidade:", error);
					toast.error(error.message || "Erro ao cadastrar comodidade");
					return;
				}
			}

			// Recarregar comodidades
			try {
				const [amenitiesCountRes, amenitiesRes] = await Promise.all([
					amenitiesService.countAmenitiesByBuilding(buildingId).catch((err) => {
						console.error("Erro ao contar comodidades:", err);
						return { success: false, data: 0, message: "Erro ao contar comodidades" };
					}),
					amenitiesService.getAmenitiesByBuildingId(buildingId).catch((err) => {
						console.error("Erro ao buscar comodidades:", err);
						return [];
					}),
				]);
				setTotalAmenities(amenitiesCountRes?.data ?? 0);
				setAmenities(Array.isArray(amenitiesRes) ? amenitiesRes : []);
			} catch (error) {
				console.error("Erro ao recarregar comodidades:", error);
			}

			areaForm.reset();
			setIsAreaDialogOpen(false);
			setEditingAreaId(null);
		} catch (error: any) {
			console.error("Erro completo ao salvar comodidade:", error);
			const errorMessage =
				error?.response?.data?.message ||
				error?.message ||
				error?.data?.message ||
				"Erro ao salvar comodidade";
			toast.error(errorMessage);
		}
	};

	const handleEditArea = (area: Amenity) => {
		setEditingAreaId(area._id);
		areaForm.reset({
			name: area.name || "",
			nonComplianceFine: area.nonComplianceFine ?? undefined,
			usageRules: area.usageRules || "",
			description: area.description || "",
			type: area.type ?? undefined,
			value: area.value ?? undefined,
			fineValue: area.fineValue ?? undefined,
			maxResidents: area.maxResidents ?? undefined,
			maxHours: area.maxHours ?? undefined,
			bookingType: area.bookingType ?? undefined,
			openingTime: area.openingTime ?? undefined,
			closingTime: area.closingTime ?? undefined,
			status: area.status || "ATIVO",
		});
		// Carregar itens da comodidade
		if (area.items && area.items.length > 0) {
			setHasItems(true);
			setAmenityItems(area.items);
		} else {
			setHasItems(false);
			setAmenityItems([]);
		}
		setIsAreaDialogOpen(true);
	};

	const handleDeleteAreaClick = (area: Amenity) => {
		setAreaToDelete({ id: area._id, name: area.name });
		setIsDeleteAreaDialogOpen(true);
	};

	const handleConfirmDeleteArea = async () => {
		if (!areaToDelete) return;

		try {
			await amenitiesService.deleteAmenity(areaToDelete.id);
			toast.success("Comodidade removida com sucesso!");

			// Recarregar comodidades
			if (buildingId) {
				try {
					const [amenitiesCountRes, amenitiesRes] = await Promise.all([
						amenitiesService.countAmenitiesByBuilding(buildingId).catch((err) => {
							console.error("Erro ao contar comodidades:", err);
							return { success: false, data: 0, message: "Erro ao contar comodidades" };
						}),
						amenitiesService.getAmenitiesByBuildingId(buildingId).catch((err) => {
							console.error("Erro ao buscar comodidades:", err);
							return [];
						}),
					]);
					setTotalAmenities(amenitiesCountRes?.data ?? 0);
					setAmenities(Array.isArray(amenitiesRes) ? amenitiesRes : []);
				} catch (error) {
					console.error("Erro ao recarregar comodidades:", error);
				}
			}

			setIsDeleteAreaDialogOpen(false);
			setAreaToDelete(null);
		} catch (error: any) {
			toast.error("Erro ao remover comodidade");
		}
	};

	const handleCloseAreaDialog = () => {
		setIsAreaDialogOpen(false);
		setEditingAreaId(null);
		areaForm.reset();
		// Limpar estados de itens
		setHasItems(false);
		setAmenityItems([]);
		setNewItemName("");
		setNewItemQuantity(1);
	};

	// Funções para gerenciar itens da comodidade
	const handleAddItem = () => {
		if (newItemName.trim() && newItemQuantity >= 1) {
			setAmenityItems([...amenityItems, { name: newItemName.trim(), quantity: newItemQuantity }]);
			setNewItemName("");
			setNewItemQuantity(1);
		}
	};

	const handleRemoveItem = (index: number) => {
		setAmenityItems(amenityItems.filter((_, i) => i !== index));
	};

	const handleUpdateItemQuantity = (index: number, quantity: number) => {
		if (quantity >= 1) {
			const updatedItems = [...amenityItems];
			updatedItems[index].quantity = quantity;
			setAmenityItems(updatedItems);
		}
	};

	// Função para abrir o calendário de reservas de uma comodidade
	const handleOpenBookingsCalendar = async (amenity: Amenity) => {
		console.log("Abrindo calendário de reservas para:", amenity.name, amenity._id);
		setSelectedAmenityForBookings(amenity);
		setIsBookingsCalendarOpen(true);
		setSelectedCalendarDate(undefined);
		setIsLoadingAmenityBookings(true);

		try {
			// Buscar reservas da comodidade usando endpoint de admin
			console.log("Buscando reservas...");
			const response = await bookingsService.getBookingsByBuilding(amenity._id);
			console.log("Resposta da API:", response);

			if (response.success && response.data) {
				console.log("Reservas recebidas:", response.data.bookings);
				// Usar todas as reservas retornadas (PENDENTE, AGENDADO, EM_ANDAMENTO)
				const filteredBookings = response.data.bookings;
				console.log("Reservas:", filteredBookings);
				setAmenityBookings(filteredBookings);

				// Agrupar reservas por data
				const dateMap = new Map<string, Booking[]>();
				filteredBookings.forEach((booking) => {
					const dateStr = format(new Date(booking.startDate), "yyyy-MM-dd");
					if (!dateMap.has(dateStr)) {
						dateMap.set(dateStr, []);
					}
					dateMap.get(dateStr)!.push(booking);
				});
				console.log("Mapa de datas:", dateMap);
				setBookingDates(dateMap);
			} else {
				console.log("Resposta sem sucesso ou sem dados:", response);
			}
		} catch (error) {
			console.error("Erro ao buscar reservas:", error);
			toast.error("Erro ao carregar reservas");
		} finally {
			setIsLoadingAmenityBookings(false);
		}
	};

	// Obter reservas do dia selecionado
	const getBookingsForSelectedDate = (): Booking[] => {
		if (!selectedCalendarDate) return [];
		const dateStr = format(selectedCalendarDate, "yyyy-MM-dd");
		return bookingDates.get(dateStr) || [];
	};

	// Formatar horário de uma reserva
	const formatBookingTime = (booking: Booking): string => {
		const start = new Date(booking.startDate);
		const end = new Date(booking.endDate);
		return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
	};

	if (isLoading) {
		return <CondominiumInfoSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Informações do Condomínio</h1>
				<p className="text-muted-foreground">
					Gerencie as informações e áreas comuns do condomínio
				</p>
			</div>

			<Tabs defaultValue="view" className="space-y-6">
				<TabsList>
					<TabsTrigger value="view">Informações</TabsTrigger>
					<TabsTrigger value="register">Comodidades</TabsTrigger>
					<TabsTrigger value="residents">Condôminos</TabsTrigger>
				</TabsList>

				{/* Aba de Visualização */}
				<TabsContent value="view" className="space-y-6">
					{/* Resumo Geral */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total de Apartamentos</CardTitle>
								<Building2 className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalApartments}</div>
								<p className="text-xs text-muted-foreground">Unidades residenciais</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total de Condôminos</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalResidents}</div>
								<p className="text-xs text-muted-foreground">Moradores cadastrados</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Comodidades</CardTitle>
								<MapPin className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalAmenities}</div>
								<p className="text-xs text-muted-foreground">Espaços disponíveis</p>
							</CardContent>
						</Card>
					</div>

					{/* Reservas de Comodidades */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CalendarDays className="w-5 h-5 text-primary" />
								Reservas de Comodidades
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Visualize as reservas das comodidades do condomínio
							</p>
						</CardHeader>
						<CardContent>
							{isLoadingBookings ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
								</div>
							) : (
								<div className="space-y-3">
									{bookings.length === 0 ? (
										<p className="text-sm text-muted-foreground text-center py-4">
											Nenhuma reserva encontrada
										</p>
									) : (
										bookings.map((booking, index) => {
											const startDate = booking.startDate ? new Date(booking.startDate) : null;
											const endDate = booking.endDate ? new Date(booking.endDate) : null;
											const apartmentNumber = booking.apartment?.number || "N/A";
											const residentName = booking.resident?.name || "N/A";
											const amenityName = booking.amenity?.name || "Comodidade";

											return (
												<div
													key={booking._id || `booking-${index}`}
													className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors border"
												>
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-2">
															<MapPin className="w-4 h-4 text-primary" />
															<span className="font-medium">{amenityName}</span>
															<Badge
																variant={
																	booking.status === "AGENDADO"
																		? "default"
																		: booking.status === "PENDENTE"
																			? "secondary"
																			: booking.status === "EM_ANDAMENTO"
																				? "default"
																				: "outline"
																}
																className="text-xs"
															>
																{booking.status === "AGENDADO"
																	? "Confirmado"
																	: booking.status === "PENDENTE"
																		? "Pendente"
																		: booking.status === "EM_ANDAMENTO"
																			? "Em Andamento"
																			: booking.status}
															</Badge>
														</div>
														<div className="flex items-center gap-4 text-sm text-muted-foreground">
															<div className="flex items-center gap-1">
																<Users className="w-3 h-3" />
																<span>{residentName}</span>
															</div>
															<span className="text-muted-foreground/50">•</span>
															<span>Apt {apartmentNumber}</span>
															{startDate && (
																<>
																	<span className="text-muted-foreground/50">•</span>
																	<div className="flex items-center gap-1">
																		<Calendar className="w-3 h-3" />
																		<span>
																			{startDate.toLocaleDateString("pt-BR", {
																				day: "2-digit",
																				month: "2-digit",
																				year: "numeric",
																			})}
																		</span>
																	</div>
																</>
															)}
															{startDate && endDate && (
																<>
																	<span className="text-muted-foreground/50">•</span>
																	<div className="flex items-center gap-1">
																		<Clock className="w-3 h-3" />
																		<span>
																			{startDate.toLocaleTimeString("pt-BR", {
																				hour: "2-digit",
																				minute: "2-digit",
																			})}{" "}
																			-{" "}
																			{endDate.toLocaleTimeString("pt-BR", {
																				hour: "2-digit",
																				minute: "2-digit",
																			})}
																		</span>
																	</div>
																</>
															)}
															{booking.totalValue !== undefined && booking.totalValue > 0 && (
																<>
																	<span className="text-muted-foreground/50">•</span>
																	<div className="flex items-center gap-1">
																		<DollarSign className="w-3 h-3" />
																		<span className="font-medium">
																			R${" "}
																			{booking.totalValue.toLocaleString("pt-BR", {
																				minimumFractionDigits: 2,
																				maximumFractionDigits: 2,
																			})}
																		</span>
																	</div>
																</>
															)}
														</div>
													</div>
												</div>
											);
										})
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Aba de Cadastro */}
				<TabsContent value="register" className="space-y-6">
					{/* Comodidades */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Comodidades</CardTitle>
									<p className="text-sm text-muted-foreground">
										Gerencie as comodidades do condomínio
									</p>
								</div>
								<Dialog
									open={isAreaDialogOpen}
									onOpenChange={(open) => {
										if (!open) handleCloseAreaDialog();
										else setIsAreaDialogOpen(true);
									}}
								>
									<DialogTrigger asChild>
										<Button>
											<Plus className="w-4 h-4 mr-2" />
											Nova Comodidade
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
										<DialogHeader className="flex-shrink-0">
											<DialogTitle>{editingAreaId ? "Editar" : "Cadastrar"} Comodidade</DialogTitle>
											<DialogDescription>
												Preencha as informações da comodidade do condomínio
											</DialogDescription>
										</DialogHeader>
										<form
											onSubmit={areaForm.handleSubmit(onAreaSubmit, (errors) => {
												console.error("Erros de validação:", errors);
												const errorMessages = Object.entries(errors)
													.map(([key, error]: [string, any]) => {
														return `${key}: ${error?.message || "erro"}`;
													})
													.join(", ");
												console.error("Detalhes dos erros:", errorMessages);
												toast.error(`Erros no formulário: ${errorMessages}`);
											})}
											className="space-y-4 overflow-y-auto flex-1 pr-2"
										>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="name">Nome da Comodidade *</Label>
													<Input
														id="name"
														placeholder="Ex: Piscina"
														{...areaForm.register("name")}
													/>
													{areaForm.formState.errors.name && (
														<p className="text-sm text-destructive">
															{areaForm.formState.errors.name.message}
														</p>
													)}
												</div>
											</div>

											<div className="space-y-2">
												<Label htmlFor="type">Tipo (Opcional)</Label>
												<Select
													value={areaForm.watch("type") || ""}
													onValueChange={(value) => {
														const typeValue =
															value === "" ? undefined : (value as "COMODIDADE" | "AREA_COMUM");
														areaForm.setValue("type", typeValue);
														// Limpar value, fineValue, bookingType e maxHours se mudar para AREA_COMUM
														if (value === "AREA_COMUM") {
															areaForm.setValue("value", undefined);
															areaForm.setValue("fineValue", undefined);
															areaForm.setValue("bookingType", undefined);
															areaForm.setValue("maxHours", undefined);
														}
													}}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o tipo (opcional)" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="COMODIDADE">Comodidade</SelectItem>
														<SelectItem value="AREA_COMUM">Área Comum</SelectItem>
													</SelectContent>
												</Select>
												{areaForm.formState.errors.type && (
													<p className="text-sm text-destructive">
														{areaForm.formState.errors.type.message}
													</p>
												)}
											</div>

											{areaForm.watch("type") !== "AREA_COMUM" && (
												<div className="space-y-2">
													<Label htmlFor="value">Valor de Uso (R$)</Label>
													<div className="relative">
														<DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
														<Input
															id="value"
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															{...areaForm.register("value", {
																valueAsNumber: true,
															})}
															className="pl-9"
														/>
													</div>
													{areaForm.formState.errors.value && (
														<p className="text-sm text-destructive">
															{areaForm.formState.errors.value.message}
														</p>
													)}
												</div>
											)}

											{areaForm.watch("type") !== "AREA_COMUM" && (
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="fineValue">Multa por Atraso (R$)</Label>
														<div className="relative">
															<DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
															<Input
																id="fineValue"
																type="number"
																step="0.01"
																min="0"
																placeholder="0.00"
																{...areaForm.register("fineValue", {
																	valueAsNumber: true,
																	setValueAs: (v) =>
																		v === "" || v === null || v === undefined ? undefined : Number(v),
																})}
																className="pl-9"
															/>
														</div>
														{areaForm.formState.errors.fineValue && (
															<p className="text-sm text-destructive">
																{areaForm.formState.errors.fineValue.message}
															</p>
														)}
													</div>

													<div className="space-y-2">
														<Label htmlFor="nonComplianceFine">
															Multa por Não Seguir as Conformidades (R$)
														</Label>
														<div className="relative">
															<DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
															<Input
																id="nonComplianceFine"
																type="number"
																step="0.01"
																min="0"
																placeholder="0.00"
																{...areaForm.register("nonComplianceFine", {
																	valueAsNumber: true,
																	setValueAs: (v) =>
																		v === "" || v === null || v === undefined ? undefined : Number(v),
																})}
																className="pl-9"
															/>
														</div>
														{areaForm.formState.errors.nonComplianceFine && (
															<p className="text-sm text-destructive">
																{areaForm.formState.errors.nonComplianceFine.message}
															</p>
														)}
													</div>
												</div>
											)}

											{areaForm.watch("type") === "AREA_COMUM" && (
												<div className="space-y-2">
													<Label htmlFor="nonComplianceFine">
														Multa por Não Seguir as Conformidades (R$)
													</Label>
													<div className="relative">
														<DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
														<Input
															id="nonComplianceFine"
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															{...areaForm.register("nonComplianceFine", {
																valueAsNumber: true,
																setValueAs: (v) =>
																	v === "" || v === null || v === undefined ? undefined : Number(v),
															})}
															className="pl-9"
														/>
													</div>
													{areaForm.formState.errors.nonComplianceFine && (
														<p className="text-sm text-destructive">
															{areaForm.formState.errors.nonComplianceFine.message}
														</p>
													)}
												</div>
											)}

											<div className="space-y-2">
												<Label htmlFor="maxResidents">Quantidade Máxima de Residentes</Label>
												<Input
													id="maxResidents"
													type="number"
													min="1"
													placeholder="Ex: 10"
													{...areaForm.register("maxResidents", {
														valueAsNumber: true,
													})}
												/>
												{areaForm.formState.errors.maxResidents && (
													<p className="text-sm text-destructive">
														{areaForm.formState.errors.maxResidents.message}
													</p>
												)}
											</div>

											{areaForm.watch("type") !== "AREA_COMUM" && (
												<div className="space-y-2">
													<Label htmlFor="bookingType">Tipo de Reserva</Label>
													<Select
														value={areaForm.watch("bookingType") || ""}
														onValueChange={(value) => {
															areaForm.setValue("bookingType", value as "DIARIO" | "POR_HORAS" | undefined);
															if (value === "DIARIO") {
																areaForm.setValue("maxHours", undefined);
															}
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder="Selecione o tipo" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="DIARIO">Diário</SelectItem>
															<SelectItem value="POR_HORAS">Por Horas</SelectItem>
														</SelectContent>
													</Select>
													{areaForm.formState.errors.bookingType && (
														<p className="text-sm text-destructive">
															{areaForm.formState.errors.bookingType.message}
														</p>
													)}
												</div>
											)}

											{											areaForm.watch("type") !== "AREA_COMUM" &&
												areaForm.watch("bookingType") === "POR_HORAS" && (
													<div className="space-y-2">
														<Label htmlFor="maxHours">Quantidade Máxima de Horas *</Label>
														<Input
															id="maxHours"
															type="number"
															min="1"
															max="24"
															placeholder="Ex: 4"
															{...areaForm.register("maxHours", {
																valueAsNumber: true,
																required: "Quantidade máxima de horas é obrigatória quando o tipo de reserva é por horas",
															})}
														/>
														{areaForm.formState.errors.maxHours && (
															<p className="text-sm text-destructive">
																{areaForm.formState.errors.maxHours.message}
															</p>
														)}
														<p className="text-xs text-muted-foreground">
															Defina o limite máximo de horas que podem ser agendadas (1 a 24 horas)
														</p>
													</div>
												)}

											<div className="space-y-4">
												<div className="flex items-center space-x-2">
													<Checkbox
														id="is24Hours"
														checked={
															areaForm.watch("openingTime") === "00:00" &&
															areaForm.watch("closingTime") === "23:59"
														}
														onCheckedChange={(checked) => {
															if (checked) {
																areaForm.setValue("openingTime", "00:00");
																areaForm.setValue("closingTime", "23:59");
															} else {
																areaForm.setValue("openingTime", undefined);
																areaForm.setValue("closingTime", undefined);
															}
														}}
													/>
													<Label htmlFor="is24Hours" className="text-sm font-normal cursor-pointer">
														Funciona 24 horas
													</Label>
												</div>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="openingTime">Horário de Abertura</Label>
														<div className="relative">
															<Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
															<Input
																id="openingTime"
																type="time"
																placeholder="08:00"
																value={areaForm.watch("openingTime") || ""}
																onChange={(e) => {
																	areaForm.setValue("openingTime", e.target.value || undefined);
																}}
																className="pl-9"
															/>
														</div>
														{areaForm.formState.errors.openingTime && (
															<p className="text-sm text-destructive">
																{areaForm.formState.errors.openingTime.message}
															</p>
														)}
														<p className="text-xs text-muted-foreground">
															Formato: HH:mm (ex: 08:00)
														</p>
													</div>
													<div className="space-y-2">
														<Label htmlFor="closingTime">Horário de Fechamento</Label>
														<div className="relative">
															<Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
															<Input
																id="closingTime"
																type="time"
																placeholder="22:00"
																value={areaForm.watch("closingTime") || ""}
																onChange={(e) => {
																	areaForm.setValue("closingTime", e.target.value || undefined);
																}}
																className="pl-9"
															/>
														</div>
														{areaForm.formState.errors.closingTime && (
															<p className="text-sm text-destructive">
																{areaForm.formState.errors.closingTime.message}
															</p>
														)}
														<p className="text-xs text-muted-foreground">
															Formato: HH:mm (ex: 22:00)
														</p>
													</div>
												</div>
											</div>

											{/* Seção de Itens da Comodidade */}
											<div className="space-y-4 border rounded-lg p-4 bg-muted/30">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<Package className="w-5 h-5 text-muted-foreground" />
														<Label className="text-base font-medium">Itens da Comodidade</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox
															id="hasItems"
															checked={hasItems}
															onCheckedChange={(checked) => {
																setHasItems(checked === true);
																if (!checked) {
																	setAmenityItems([]);
																}
															}}
														/>
														<Label htmlFor="hasItems" className="text-sm cursor-pointer">
															Esta comodidade possui itens
														</Label>
													</div>
												</div>

												{hasItems && (
													<div className="space-y-4">
														{/* Lista de itens existentes */}
														{amenityItems.length > 0 && (
															<div className="space-y-2">
																<Label className="text-sm text-muted-foreground">Itens cadastrados:</Label>
																<div className="space-y-2">
																	{amenityItems.map((item, index) => (
																		<div
																			key={index}
																			className="flex items-center gap-3 bg-background p-3 rounded-md border"
																		>
																			<span className="flex-1 font-medium">{item.name}</span>
																			<div className="flex items-center gap-2">
																				<Label className="text-sm text-muted-foreground">Qtd:</Label>
																				<Input
																					type="number"
																					min={1}
																					value={item.quantity}
																					onChange={(e) =>
																						handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)
																					}
																					className="w-20"
																				/>
																			</div>
																			<Button
																				type="button"
																				variant="ghost"
																				size="icon"
																				onClick={() => handleRemoveItem(index)}
																				className="text-destructive hover:text-destructive/80"
																			>
																				<Trash2 className="w-4 h-4" />
																			</Button>
																		</div>
																	))}
																</div>
															</div>
														)}

														{/* Adicionar novo item */}
														<div className="space-y-2">
															<Label className="text-sm text-muted-foreground">Adicionar item:</Label>
															<div className="flex items-end gap-2">
																<div className="flex-1 space-y-1">
																	<Label htmlFor="newItemName" className="text-xs">
																		Nome do item
																	</Label>
																	<Input
																		id="newItemName"
																		value={newItemName}
																		onChange={(e) => setNewItemName(e.target.value)}
																		placeholder="Ex: Cadeira, Mesa, etc."
																	/>
																</div>
																<div className="w-24 space-y-1">
																	<Label htmlFor="newItemQuantity" className="text-xs">
																		Quantidade
																	</Label>
																	<Input
																		id="newItemQuantity"
																		type="number"
																		min={1}
																		value={newItemQuantity}
																		onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
																	/>
																</div>
																<Button
																	type="button"
																	variant="outline"
																	onClick={handleAddItem}
																	disabled={!newItemName.trim()}
																>
																	<Plus className="w-4 h-4 mr-1" />
																	Adicionar
																</Button>
															</div>
														</div>
													</div>
												)}
											</div>

											<div className="space-y-2">
												<Label htmlFor="usageRules">Normas de Uso (Opcional)</Label>
												<RichTextEditor
													key={`usageRules-${editingAreaId || "new"}`}
													value={areaForm.watch("usageRules") || ""}
													onChange={(value) => areaForm.setValue("usageRules", value)}
													placeholder="Digite as normas de uso da comodidade..."
												/>
												{areaForm.formState.errors.usageRules && (
													<p className="text-sm text-destructive">
														{areaForm.formState.errors.usageRules.message}
													</p>
												)}
											</div>

											<div className="space-y-2">
												<Label htmlFor="status">Status *</Label>
												<Select
													value={areaForm.watch("status") || "ATIVO"}
													onValueChange={(value) => {
														areaForm.setValue("status", value as "ATIVO" | "INATIVO");
													}}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="ATIVO">Ativo</SelectItem>
														<SelectItem value="INATIVO">Inativo</SelectItem>
													</SelectContent>
												</Select>
												{areaForm.formState.errors.status && (
													<p className="text-sm text-destructive">
														{areaForm.formState.errors.status.message}
													</p>
												)}
											</div>

											<div className="flex gap-4 flex-shrink-0 pt-4 border-t">
												<Button
													type="submit"
													className="flex-1"
													disabled={areaForm.formState.isSubmitting}
												>
													{areaForm.formState.isSubmitting
														? "Salvando..."
														: editingAreaId
															? "Atualizar"
															: "Cadastrar"}
												</Button>
												<Button type="button" variant="outline" onClick={handleCloseAreaDialog}>
													Cancelar
												</Button>
											</div>
										</form>
									</DialogContent>
								</Dialog>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{amenities.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-4">
										Nenhuma comodidade cadastrada
									</p>
								) : (
									amenities.map((area) => (
										<Card key={area._id}>
											<CardHeader>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<CardTitle className="flex items-center gap-2">
															<MapPin className="w-5 h-5" />
															{area.name}
														</CardTitle>
														<div className="flex flex-wrap items-center gap-2 mt-2">
															<Badge variant="outline" className="text-xs">
																{area.type === "AREA_COMUM"
																	? "Área Comum"
																	: area.type === "COMODIDADE"
																		? "Comodidade"
																		: "Comodidade"}
															</Badge>
															{area.bookingType && (
																<Badge variant="secondary" className="text-xs">
																	{area.bookingType === "POR_HORAS" ? "Por Horas" : "Reserva Diária"}
																</Badge>
															)}
															<Badge
																variant={area.status === "ATIVO" ? "default" : "outline"}
																className="text-xs"
															>
																{area.status || "ATIVO"}
															</Badge>
														</div>
														<div className="flex flex-wrap items-center gap-2 mt-2">
															{area.value && area.value > 0 && (
																<span className="text-xs text-muted-foreground">
																	Valor: R${" "}
																	{area.value.toLocaleString("pt-BR", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
															)}
															{area.fineValue && area.fineValue > 0 && (
																<span className="text-xs text-muted-foreground">
																	Multa Atraso: R${" "}
																	{area.fineValue.toLocaleString("pt-BR", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
															)}
															{area.nonComplianceFine && area.nonComplianceFine > 0 && (
																<span className="text-xs text-muted-foreground">
																	Multa Conformidade: R${" "}
																	{area.nonComplianceFine.toLocaleString("pt-BR", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
															)}
															{area.maxResidents && (
																<span className="text-xs text-muted-foreground">
																	Máx. Residentes: {area.maxResidents}
																</span>
															)}
														</div>
														{area.openingTime && area.closingTime && (
															<div className="flex items-center gap-1 mt-2">
																<Clock className="w-3 h-3 text-muted-foreground" />
																<span className="text-xs text-muted-foreground">
																	Horário: {area.openingTime} - {area.closingTime}
																</span>
															</div>
														)}
														{area.items && area.items.length > 0 && (
															<div className="flex items-center gap-1 mt-2">
																<Package className="w-3 h-3 text-muted-foreground" />
																<span className="text-xs text-muted-foreground">
																	{area.items.length} {area.items.length === 1 ? "item" : "itens"}
																</span>
															</div>
														)}
													</div>
													<div className="flex gap-2">
														<Select
															value={area.status || "ATIVO"}
															onValueChange={async (value) => {
																try {
																	await amenitiesService.updateAmenity(area._id, {
																		status: value as "ATIVO" | "INATIVO",
																	});
																	toast.success("Status atualizado com sucesso!");
																	// Recarregar comodidades
																	if (buildingId) {
																		try {
																			const [amenitiesCountRes, amenitiesRes] = await Promise.all([
																				amenitiesService
																					.countAmenitiesByBuilding(buildingId)
																					.catch((err) => {
																						console.error("Erro ao contar comodidades:", err);
																						return {
																							success: false,
																							data: 0,
																							message: "Erro ao contar comodidades",
																						};
																					}),
																				amenitiesService
																					.getAmenitiesByBuildingId(buildingId)
																					.catch((err) => {
																						console.error("Erro ao buscar comodidades:", err);
																						return [];
																					}),
																			]);
																			setTotalAmenities(amenitiesCountRes?.data ?? 0);
																			setAmenities(Array.isArray(amenitiesRes) ? amenitiesRes : []);
																		} catch (error) {
																			console.error("Erro ao recarregar comodidades:", error);
																		}
																	}
																} catch (error: any) {
																	toast.error(error.message || "Erro ao atualizar status");
																}
															}}
														>
															<SelectTrigger className="w-[120px] h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="ATIVO">Ativo</SelectItem>
																<SelectItem value="INATIVO">Inativo</SelectItem>
															</SelectContent>
														</Select>
														{area.bookingType && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleOpenBookingsCalendar(area)}
																title="Ver reservas agendadas"
															>
																<CalendarDays className="w-4 h-4" />
															</Button>
														)}
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleEditArea(area)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleDeleteAreaClick(area)}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</div>
											</CardHeader>
										</Card>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Aba de Condôminos */}
				<TabsContent value="residents" className="space-y-6">
					<Card>
						<CardContent className="pt-6">
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
													handleSearchResidents();
												}
											}}
											className="pl-9 h-12 text-base"
										/>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" size="default" className="h-12">
												{filterBy === "name" && "Nome"}
												{filterBy === "phone" && "Telefone"}
												{filterBy === "email" && "Email"}
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
												onClick={() => setFilterBy("phone")}
												className="flex items-center justify-between"
											>
												<span>Telefone</span>
												{filterBy === "phone" && <Check className="h-4 w-4 ml-2" />}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setFilterBy("email")}
												className="flex items-center justify-between"
											>
												<span>Email</span>
												{filterBy === "email" && <Check className="h-4 w-4 ml-2" />}
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
									<Select
										value={statusFilter || "all"}
										onValueChange={(value) => {
											setStatusFilter(
												value === "all"
													? undefined
													: (value as
															| "A_CONFIRMACAO_EMAIL"
															| "A_VALIDACAO"
															| "REJEITADO"
															| "ATIVO"
															| "INATIVO"),
											);
											setCurrentPage(1);
										}}
									>
										<SelectTrigger className="h-12 w-[140px]">
											<SelectValue placeholder="Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos</SelectItem>
											<SelectItem value="A_CONFIRMACAO_EMAIL">
												Aguardando Confirmação Email
											</SelectItem>
											<SelectItem value="A_VALIDACAO">Aguardando Validação</SelectItem>
											<SelectItem value="REJEITADO">Rejeitado</SelectItem>
											<SelectItem value="INATIVO">Inativo</SelectItem>
											<SelectItem value="ATIVO">Ativo</SelectItem>
										</SelectContent>
									</Select>
									<Button onClick={handleSearchResidents} size="default" className="h-12">
										Buscar
									</Button>
								</div>
							</div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									{isUsingLatestResidents ? (
										<p className="text-sm text-muted-foreground">
											<span className="font-medium text-foreground">
												Últimos condôminos cadastrados
											</span>
											{" - "}
											Mostrando {residentsList.length} condômino(s)
										</p>
									) : (
										<p className="text-sm text-muted-foreground">
											Mostrando{" "}
											{residentsList.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
											{Math.min(currentPage * itemsPerPage, totalResidentsList)} de{" "}
											{totalResidentsList} condômino(s)
										</p>
									)}
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
								</div>

								{isLoadingResidents ? (
									<Card>
										<CardContent className="pt-6">
											<div className="flex items-center justify-center py-12">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
											</div>
										</CardContent>
									</Card>
								) : residentsList.length === 0 ? (
									<Card>
										<CardContent className="pt-6">
											<div className="flex flex-col items-center justify-center py-12 text-center">
												<Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
												<p className="text-sm text-muted-foreground">
													{activeSearchTerm || statusFilter
														? "Nenhum condômino encontrado"
														: "Nenhum condômino cadastrado"}
												</p>
											</div>
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardContent className="p-0">
											<div className="divide-y">
												{residentsList && residentsList.length > 0 ? (
													residentsList.map((resident) => (
														<div
															key={resident._id}
															className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
														>
															<div
																className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
																onClick={() => handleViewResident(resident)}
															>
																<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
																	<Users className="w-6 h-6 text-primary" />
																</div>
																<div className="flex-1 min-w-0">
																	<h3 className="font-semibold text-base mb-1 truncate">
																		{resident.name}
																	</h3>
																	<div className="flex flex-col gap-1">
																		<div className="flex items-center gap-2 flex-wrap">
																			{resident.status && (
																				<Badge
																					variant={
																						resident.status === "ATIVO"
																							? "default"
																							: resident.status === "A_VALIDACAO"
																								? "secondary"
																								: resident.status === "A_CONFIRMACAO_EMAIL"
																									? "outline"
																									: "outline"
																					}
																					className="text-xs"
																				>
																					{resident.status === "A_CONFIRMACAO_EMAIL"
																						? "Aguardando Confirmação Email"
																						: resident.status === "A_VALIDACAO"
																							? "Aguardando Validação"
																							: resident.status}
																				</Badge>
																			)}
																			{resident.apartmentNumber && (
																				<span className="text-xs text-muted-foreground">
																					Apt: {resident.apartmentNumber}
																				</span>
																			)}
																		</div>
																		<div className="flex items-center gap-2 text-xs text-muted-foreground">
																			{resident.email && (
																				<span className="truncate">{resident.email}</span>
																			)}
																			{resident.phone && (
																				<>
																					{resident.email && <span>•</span>}
																					<span>{resident.phone}</span>
																				</>
																			)}
																		</div>
																	</div>
																</div>
															</div>
															{resident.status === "A_VALIDACAO" && (
																<div className="flex items-center gap-2 flex-shrink-0">
																	<Button
																		size="sm"
																		variant="default"
																		onClick={async (e) => {
																			e.stopPropagation();
																			try {
																				await adminService.approveResident(resident._id);
																				toast.success("Condômino aprovado com sucesso!");

																				// Recarregar a lista
																				const response = await adminService.getResidents({
																					page: currentPage,
																					limit: itemsPerPage,
																					search: activeSearchTerm || undefined,
																					filterBy: activeSearchTerm
																						? (filterBy as "name" | "phone" | "email" | "apartment")
																						: undefined,
																					status: statusFilter as
																						| "A_CONFIRMACAO_EMAIL"
																						| "A_VALIDACAO"
																						| "REJEITADO"
																						| "ATIVO"
																						| "INATIVO"
																						| undefined,
																				});
																				const residentsData = response.data?.data || [];
																				const total = response.data?.total || 0;
																				const pages = response.data?.totalPages || 1;
																				setResidentsList(residentsData);
																				setTotalResidentsList(total);
																				setTotalPages(pages);
																			} catch (error: any) {
																				console.error("Erro ao aprovar condômino:", error);
																				toast.error(
																					error.response?.data?.message ||
																						"Erro ao aprovar condômino",
																				);
																			}
																		}}
																	>
																		<Check className="w-3 h-3 mr-1" />
																		Aprovar
																	</Button>
																	<Button
																		size="sm"
																		variant="destructive"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleOpenRejectDialog({
																				_id: resident._id,
																				name: resident.name,
																			});
																		}}
																	>
																		<Trash2 className="w-3 h-3 mr-1" />
																		Rejeitar
																	</Button>
																</div>
															)}
															{resident.status === "ATIVO" && (
																<div className="flex items-center gap-2 flex-shrink-0">
																	<Button
																		size="sm"
																		variant="destructive"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleOpenDeactivateDialog({
																				_id: resident._id,
																				name: resident.name,
																			});
																		}}
																	>
																		<Trash2 className="w-3 h-3 mr-1" />
																		Inativar
																	</Button>
																</div>
															)}
															{resident.status === "INATIVO" && (
																<div className="flex items-center gap-2 flex-shrink-0">
																	<Button
																		size="sm"
																		variant="default"
																		onClick={async (e) => {
																			e.stopPropagation();
																			try {
																				setIsActivating(true);
																				await adminService.activateResident(resident._id);
																				toast.success("Condômino ativado com sucesso!");
																				const response = await adminService.getResidents({
																					page: currentPage,
																					limit: itemsPerPage,
																					search: activeSearchTerm || undefined,
																					filterBy: activeSearchTerm
																						? (filterBy as "name" | "phone" | "email" | "apartment")
																						: undefined,
																					status: statusFilter as
																						| "A_CONFIRMACAO_EMAIL"
																						| "A_VALIDACAO"
																						| "REJEITADO"
																						| "ATIVO"
																						| "INATIVO"
																						| undefined,
																				});
																				const residentsData = response.data?.data || [];
																				const total = response.data?.total || 0;
																				const pages = response.data?.totalPages || 1;
																				setResidentsList(residentsData);
																				setTotalResidentsList(total);
																				setTotalPages(pages);
																			} catch (error: any) {
																				console.error("Erro ao ativar condômino:", error);
																				toast.error(
																					error.response?.data?.message ||
																						"Erro ao ativar condômino",
																				);
																			} finally {
																				setIsActivating(false);
																			}
																		}}
																		disabled={isActivating}
																	>
																		<Check className="w-3 h-3 mr-1" />
																		{isActivating ? "Ativando..." : "Ativar"}
																	</Button>
																</div>
															)}
														</div>
													))
												) : (
													<div className="flex flex-col items-center justify-center py-12 text-center">
														<Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
														<p className="text-sm text-muted-foreground">
															Nenhum condômino encontrado
														</p>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}

								{!isUsingLatestResidents && totalPages > 1 && (
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
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* View Resident Dialog */}
			<Dialog
				open={isViewDialogOpen}
				onOpenChange={(open) => {
					setIsViewDialogOpen(open);
					if (!open) {
						setSelectedResident(null);
						setPhotoError(null);
						setImageLoading({});
					}
				}}
			>
				<DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
					<DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
						<DialogTitle className="flex items-center gap-2">
							<UserCheck className="w-5 h-5 text-primary" />
							Detalhes do Condômino
						</DialogTitle>
					</DialogHeader>

					{isLoadingResidentDetails ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center space-y-2">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
								<p className="text-sm text-muted-foreground">Carregando detalhes...</p>
							</div>
						</div>
					) : selectedResident ? (
						<>
							{/* Resident Header */}
							<div className="flex flex-col items-center px-6 pb-4">
								{photoError || !selectedResident.photoUrl ? (
									<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
										<span className="text-3xl font-bold text-primary">
											{selectedResident.name.charAt(0).toUpperCase()}
										</span>
									</div>
								) : (
									<div className="relative w-24 h-24">
										{imageLoading[selectedResident._id] && (
											<div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full border-4 border-primary/20">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
											</div>
										)}
										<img
											src={selectedResident.photoUrl}
											alt={`Foto de ${selectedResident.name}`}
											className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
											style={{ display: imageLoading[selectedResident._id] ? "none" : "block" }}
											onError={() => {
												setPhotoError(selectedResident.photoUrl || null);
												setImageLoading((prev) => ({ ...prev, [selectedResident._id]: false }));
											}}
											onLoad={() => {
												setPhotoError(null);
												setImageLoading((prev) => ({ ...prev, [selectedResident._id]: false }));
											}}
										/>
									</div>
								)}
								<p className="font-semibold text-lg mt-3">{selectedResident.name}</p>
								{selectedResident.status && (
									<Badge
										variant={
											selectedResident.status === "ATIVO"
												? "default"
												: selectedResident.status === "A_VALIDACAO"
													? "secondary"
													: selectedResident.status === "A_CONFIRMACAO_EMAIL"
														? "outline"
														: "outline"
										}
										className="mt-2"
									>
										{selectedResident.status === "A_CONFIRMACAO_EMAIL"
											? "Aguardando Confirmação Email"
											: selectedResident.status === "A_VALIDACAO"
												? "Aguardando Validação"
												: selectedResident.status}
									</Badge>
								)}
							</div>

							{/* Action Buttons */}
							<div className="px-6 pb-3 flex-shrink-0 border-t pt-3">
								{selectedResident.status === "A_VALIDACAO" && (
									<div className="flex gap-2">
										<Button
											onClick={handleApproveResident}
											size="sm"
											className="flex-1"
											disabled={isLoadingResidentDetails}
										>
											<Check className="w-4 h-4 mr-2" />
											Aprovar
										</Button>
										<Button
											onClick={() =>
												handleOpenRejectDialog({
													_id: selectedResident._id,
													name: selectedResident.name,
												})
											}
											variant="destructive"
											size="sm"
											className="flex-1"
											disabled={isLoadingResidentDetails}
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Rejeitar
										</Button>
									</div>
								)}

								{selectedResident.status === "ATIVO" && (
									<Button
										onClick={() =>
											handleOpenDeactivateDialog({
												_id: selectedResident._id,
												name: selectedResident.name,
											})
										}
										variant="destructive"
										size="sm"
										className="w-full"
										disabled={isLoadingResidentDetails}
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Inativar
									</Button>
								)}

								{selectedResident.status === "INATIVO" && (
									<Button
										onClick={handleActivateResident}
										size="sm"
										className="w-full"
										disabled={isLoadingResidentDetails || isActivating}
									>
										<Check className="w-4 h-4 mr-2" />
										{isActivating ? "Ativando..." : "Ativar"}
									</Button>
								)}
							</div>

							{/* Details */}
							<div className="overflow-y-auto px-6 flex-1 min-h-0">
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

									{selectedResident.apartmentNumber && (
										<div>
											<Label className="text-muted-foreground">Apartamento</Label>
											<p className="font-medium">
												{selectedResident.apartmentBlock
													? `Bloco ${selectedResident.apartmentBlock} - `
													: ""}
												Apartamento {selectedResident.apartmentNumber}
												{selectedResident.apartmentFloor
													? ` (${selectedResident.apartmentFloor}º andar)`
													: ""}
											</p>
										</div>
									)}

									{selectedResident.createdAt && (
										<div>
											<Label className="text-muted-foreground">Data de Cadastro</Label>
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

									{selectedResident.updatedAt && (
										<div>
											<Label className="text-muted-foreground">Última Atualização</Label>
											<p className="font-medium">
												{new Date(selectedResident.updatedAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									)}

									{selectedResident.activatedAt && (
										<div>
											<Label className="text-muted-foreground">Data de Ativação</Label>
											<p className="font-medium">
												{new Date(selectedResident.activatedAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									)}

									{selectedResident.inactivatedAt && (
										<div>
											<Label className="text-muted-foreground">Data de Inativação</Label>
											<p className="font-medium">
												{new Date(selectedResident.inactivatedAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
											{selectedResident.inactiveType && (
												<p className="text-sm text-muted-foreground mt-1">
													Motivo:{" "}
													{selectedResident.inactiveType === "SOLICITACAO_DO_RESIDENTE"
														? "Solicitação do Residente"
														: selectedResident.inactiveType === "VIOLACAO_DE_REGULAMENTO"
															? "Violação de Regulamento"
															: selectedResident.inactiveType === "INADIMPLENCIA"
																? "Inadimplência"
																: selectedResident.inactiveType === "MUDANCA_DE_ENDERECO"
																	? "Mudança de Endereço"
																	: selectedResident.inactiveType === "OUTRO"
																		? "Outro"
																		: selectedResident.inactiveType}
												</p>
											)}
											{selectedResident.inactiveNote && (
												<p className="text-sm text-muted-foreground mt-1">
													Observação: {selectedResident.inactiveNote}
												</p>
											)}
										</div>
									)}

									{selectedResident.rejectedAt && (
										<div>
											<Label className="text-muted-foreground">Data de Rejeição</Label>
											<p className="font-medium">
												{new Date(selectedResident.rejectedAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
											{selectedResident.rejectType && (
												<p className="text-sm text-muted-foreground mt-1">
													Motivo:{" "}
													{selectedResident.rejectType === "DADOS_INCONSISTENTES"
														? "Dados Inconsistentes"
														: selectedResident.rejectType === "DOCUMENTO_INVALIDO"
															? "Documento Inválido"
															: selectedResident.rejectType === "INFORMACOES_INCOMPLETAS"
																? "Informações Incompletas"
																: selectedResident.rejectType === "NAO_PERTENCE_AO_CONDOMINIO"
																	? "Não Pertence ao Condomínio"
																	: selectedResident.rejectType === "OUTRO"
																		? "Outro"
																		: selectedResident.rejectType}
												</p>
											)}
											{selectedResident.rejectNote && (
												<p className="text-sm text-muted-foreground mt-1">
													Observação: {selectedResident.rejectNote}
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						</>
					) : null}
				</DialogContent>
			</Dialog>

			{/* Deactivate Resident Dialog */}
			<Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Inativar Condômino</DialogTitle>
						<DialogDescription>
							Selecione o motivo da inativação do cadastro de {residentToDeactivate?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="inactiveType">Tipo de Inativação *</Label>
							<Select value={inactiveType} onValueChange={setInactiveType}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione o tipo de inativação" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SOLICITACAO_DO_RESIDENTE">Solicitação do Residente</SelectItem>
									<SelectItem value="VIOLACAO_DE_REGULAMENTO">Violação de Regulamento</SelectItem>
									<SelectItem value="INADIMPLENCIA">Inadimplência</SelectItem>
									<SelectItem value="MUDANCA_DE_ENDERECO">Mudança de Endereço</SelectItem>
									<SelectItem value="OUTRO">Outro</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="inactiveNote">Anotação (Opcional)</Label>
							<Textarea
								id="inactiveNote"
								placeholder="Descreva o motivo da inativação..."
								value={inactiveNote}
								onChange={(e) => setInactiveNote(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setIsDeactivateDialogOpen(false);
								setResidentToDeactivate(null);
								setInactiveType("");
								setInactiveNote("");
							}}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeactivateResident}
							disabled={isDeactivating || !inactiveType}
						>
							{isDeactivating ? "Inativando..." : "Inativar"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Reject Resident Dialog */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Rejeitar Condômino</DialogTitle>
						<DialogDescription>
							Selecione o motivo da rejeição do cadastro de {residentToReject?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="rejectType">Tipo de Rejeição *</Label>
							<Select value={rejectType} onValueChange={setRejectType}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione o tipo de rejeição" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DADOS_INCONSISTENTES">Dados Inconsistentes</SelectItem>
									<SelectItem value="DOCUMENTO_INVALIDO">Documento Inválido</SelectItem>
									<SelectItem value="INFORMACOES_INCOMPLETAS">Informações Incompletas</SelectItem>
									<SelectItem value="NAO_PERTENCE_AO_CONDOMINIO">
										Não Pertence ao Condomínio
									</SelectItem>
									<SelectItem value="OUTRO">Outro</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="rejectNote">Anotação (Opcional)</Label>
							<Textarea
								id="rejectNote"
								placeholder="Descreva o motivo da rejeição..."
								value={rejectNote}
								onChange={(e) => setRejectNote(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setIsRejectDialogOpen(false);
								setResidentToReject(null);
								setRejectType("");
								setRejectNote("");
							}}
							disabled={isRejecting}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleRejectResident}
							disabled={isRejecting || !rejectType}
						>
							{isRejecting ? "Rejeitando..." : "Rejeitar"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* AlertDialog para confirmar exclusão de comodidade */}
			<AlertDialog open={isDeleteAreaDialogOpen} onOpenChange={setIsDeleteAreaDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja deletar a comodidade{" "}
							<strong>{areaToDelete?.name}</strong>? Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setAreaToDelete(null)}>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmDeleteArea} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Deletar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Modal de Calendário de Reservas */}
			<Dialog
				open={isBookingsCalendarOpen}
				onOpenChange={(open) => {
					setIsBookingsCalendarOpen(open);
					if (!open) {
						setSelectedAmenityForBookings(null);
						setAmenityBookings([]);
						setSelectedCalendarDate(undefined);
						setBookingDates(new Map());
					}
				}}
			>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CalendarDays className="w-5 h-5" />
							Reservas - {selectedAmenityForBookings?.name}
						</DialogTitle>
						<DialogDescription>
							{selectedAmenityForBookings?.bookingType === "POR_HORAS"
								? "Selecione um dia para ver os horários reservados"
								: "Visualize os dias com reservas agendadas"}
						</DialogDescription>
					</DialogHeader>

					{isLoadingAmenityBookings ? (
						<div className="flex items-center justify-center h-64">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Calendário */}
							<div className="space-y-4">
								<CalendarComponent
									mode="single"
									selected={selectedCalendarDate}
									onSelect={setSelectedCalendarDate}
									locale={ptBR}
									modifiers={{
										hasBooking: (date) => {
											const dateStr = format(date, "yyyy-MM-dd");
											return bookingDates.has(dateStr);
										},
										hasPendente: (date) => {
											const dateStr = format(date, "yyyy-MM-dd");
											const bookings = bookingDates.get(dateStr) || [];
											return bookings.some((b) => b.status === "PENDENTE");
										},
										hasAgendado: (date) => {
											const dateStr = format(date, "yyyy-MM-dd");
											const bookings = bookingDates.get(dateStr) || [];
											return bookings.some((b) => b.status === "AGENDADO");
										},
										hasEmAndamento: (date) => {
											const dateStr = format(date, "yyyy-MM-dd");
											const bookings = bookingDates.get(dateStr) || [];
											return bookings.some((b) => b.status === "EM_ANDAMENTO");
										},
										hasFinalizado: (date) => {
											const dateStr = format(date, "yyyy-MM-dd");
											const bookings = bookingDates.get(dateStr) || [];
											return bookings.some((b) => b.status === "FINALIZADO");
										},
									}}
									modifiersClassNames={{
										hasBooking: "bg-blue-100 text-blue-900 font-medium",
										hasPendente: "bg-yellow-100 text-yellow-900 font-medium border-2 border-yellow-400",
										hasAgendado: "bg-green-100 text-green-900 font-medium border-2 border-green-400",
										hasEmAndamento: "bg-orange-100 text-orange-900 font-medium border-2 border-orange-400",
										hasFinalizado: "bg-gray-100 text-gray-900 font-medium border-2 border-gray-400",
									}}
									className="rounded-md border"
								/>

								{/* Legenda */}
								<div className="flex flex-wrap gap-4 text-sm">
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
										<span>Pendente</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
										<span>Agendado</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-orange-100 border-2 border-orange-400 rounded"></div>
										<span>Em Andamento</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded"></div>
										<span>Finalizado</span>
									</div>
								</div>

								{/* Total de reservas */}
								<p className="text-sm text-muted-foreground">
									Total de reservas: {amenityBookings.length}
								</p>
							</div>

							{/* Lista de reservas do dia selecionado */}
							<div className="space-y-4">
								<h4 className="font-medium">
									{selectedCalendarDate
										? `Reservas em ${format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
										: "Todas as reservas"}
								</h4>

								{selectedCalendarDate ? (
									// Mostrar reservas do dia selecionado
									getBookingsForSelectedDate().length === 0 ? (
										<p className="text-sm text-muted-foreground py-4">
											Nenhuma reserva neste dia
										</p>
									) : (
										<div className="space-y-3 max-h-[400px] overflow-y-auto">
											{getBookingsForSelectedDate()
												.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
												.map((booking) => (
													<Card key={booking._id} className="p-3">
														<div className="flex items-start justify-between">
															<div className="space-y-1">
																{selectedAmenityForBookings?.bookingType === "POR_HORAS" && (
																	<div className="flex items-center gap-2">
																		<Clock className="w-4 h-4 text-muted-foreground" />
																		<span className="font-medium">
																			{formatBookingTime(booking)}
																		</span>
																	</div>
																)}
																{selectedAmenityForBookings?.bookingType === "DIARIO" && (
																	<div className="flex items-center gap-2">
																		<Calendar className="w-4 h-4 text-muted-foreground" />
																		<span className="font-medium">Dia inteiro</span>
																	</div>
																)}
																{booking.totalValue > 0 && (
																	<p className="text-sm text-muted-foreground">
																		Valor: R${" "}
																		{booking.totalValue.toLocaleString("pt-BR", {
																			minimumFractionDigits: 2,
																			maximumFractionDigits: 2,
																		})}
																	</p>
																)}
																{booking.observation && (
																	<p className="text-sm text-muted-foreground">
																		Obs: {booking.observation}
																	</p>
																)}
															</div>
														<Badge
															variant="secondary"
															className={
																booking.status === "EM_ANDAMENTO"
																	? "bg-orange-500 text-white"
																	: booking.status === "AGENDADO"
																		? "bg-green-500 text-white"
																		: booking.status === "PENDENTE"
																			? "bg-yellow-500 text-white"
																			: booking.status === "FINALIZADO"
																				? "bg-gray-500 text-white"
																				: ""
															}
														>
															{booking.status === "EM_ANDAMENTO"
																? "Em Andamento"
																: booking.status === "AGENDADO"
																	? "Agendado"
																	: booking.status === "PENDENTE"
																		? "Pendente"
																		: booking.status === "FINALIZADO"
																			? "Finalizado"
																			: booking.status}
														</Badge>
													</div>
												</Card>
											))}
										</div>
									)
								) : (
									// Mostrar todas as reservas quando nenhum dia está selecionado
									amenityBookings.length === 0 ? (
										<p className="text-sm text-muted-foreground py-4">
											Nenhuma reserva encontrada
										</p>
									) : (
										<div className="space-y-3 max-h-[400px] overflow-y-auto">
											{amenityBookings
												.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
												.map((booking) => (
													<Card key={booking._id} className="p-3">
														<div className="flex items-start justify-between">
															<div className="space-y-1">
																<p className="font-medium">
																	{format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })}
																</p>
																{selectedAmenityForBookings?.bookingType === "POR_HORAS" && (
																	<p className="text-sm text-muted-foreground">
																		{formatBookingTime(booking)}
																	</p>
																)}
																{selectedAmenityForBookings?.bookingType === "DIARIO" && (
																	<p className="text-sm text-muted-foreground">
																		Dia inteiro
																	</p>
																)}
															</div>
															<Badge
																variant="secondary"
																className={
																	booking.status === "EM_ANDAMENTO"
																		? "bg-orange-500 text-white"
																		: booking.status === "AGENDADO"
																			? "bg-green-500 text-white"
																			: booking.status === "PENDENTE"
																				? "bg-yellow-500 text-white"
																				: booking.status === "FINALIZADO"
																					? "bg-gray-500 text-white"
																					: ""
																}
															>
																{booking.status === "EM_ANDAMENTO"
																	? "Em Andamento"
																	: booking.status === "AGENDADO"
																		? "Agendado"
																		: booking.status === "PENDENTE"
																			? "Pendente"
																			: booking.status === "FINALIZADO"
																				? "Finalizado"
																				: booking.status}
															</Badge>
														</div>
													</Card>
												))}
										</div>
									)
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
