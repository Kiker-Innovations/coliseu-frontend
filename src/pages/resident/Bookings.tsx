import { useState, useEffect, useCallback } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
	Calendar as CalendarIcon,
	Clock,
	MapPin,
	Users,
	Plus,
	CheckCircle,
	XCircle,
	AlertCircle,
	Search,
	QrCode,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	amenitiesService,
	amenityBookingsService,
	type Amenity,
	type AmenityBooking,
	type CreateAmenityBookingRequest,
	type GetAmenityBookingsParams,
} from "@/services/api";
import { useAuth } from "@/hooks/use-auth";

const bookingSchema = z.object({
	amenityId: z.string().uuid("Selecione uma comodidade"),
	date: z.string().min(1, "Data é obrigatória"),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	endDate: z.string().min(1, "Data de término é obrigatória"),
	numberOfResidents: z
		.number()
		.int("Deve ser um número inteiro")
		.min(1, "Deve ser pelo menos 1")
		.optional(),
	observation: z.string().max(500, "Observação deve ter no máximo 500 caracteres").optional(),
	acceptedTerms: z.boolean().refine((val) => val === true, {
		message: "Você deve aceitar os termos de uso",
	}),
});

type BookingFormData = z.infer<typeof bookingSchema>;

// Componente para exibir detalhes da reserva no dialog
function BookingDetails({
	booking,
	amenities,
	amenityCache,
	setAmenityCache,
	getStatusBadge,
	onCancel,
	onShowQRCode,
}: {
	booking: AmenityBooking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	getStatusBadge: (status: string) => React.ReactNode;
	onCancel: (bookingId: string) => void;
	onShowQRCode: (booking: AmenityBooking) => void;
}) {
	const [amenityName, setAmenityName] = useState<string>("Carregando...");
	const [amenityData, setAmenityData] = useState<Amenity | null>(null);

	useEffect(() => {
		const loadAmenityData = async () => {
			// Verifica se amenityId existe e é válido
			if (!booking.amenityId || booking.amenityId === "undefined") {
				setAmenityName("Comodidade não encontrada");
				setAmenityData(null);
				return;
			}

			// Primeiro, tenta encontrar no array de amenities
			let amenity = amenities.find((a) => a._id === booking.amenityId);
			
			// Se não encontrou, tenta no cache
			if (!amenity) {
				amenity = amenityCache.get(booking.amenityId);
			}
			
			// Se encontrou, atualiza o nome e os dados
			if (amenity) {
				setAmenityName(amenity.name);
				setAmenityData(amenity);
				return;
			}
			
			// Se ainda não encontrou, busca da API
			try {
				const fetchedAmenity = await amenitiesService.getAmenityById(booking.amenityId);
				if (fetchedAmenity) {
					setAmenityName(fetchedAmenity.name);
					setAmenityData(fetchedAmenity);
					// Adiciona ao cache
					setAmenityCache((prev) => new Map(prev).set(booking.amenityId, fetchedAmenity));
				} else {
					setAmenityName("Comodidade não encontrada");
					setAmenityData(null);
				}
			} catch (error) {
				// Trata erro 404 silenciosamente
				console.error("Erro ao buscar comodidade:", error);
				setAmenityName("Comodidade não encontrada");
				setAmenityData(null);
			}
		};

		loadAmenityData();
	}, [booking.amenityId, amenities, amenityCache, setAmenityCache]);

	const formatDateTime = (dateString: string): string => {
		if (!dateString) return "-";
		
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleString("pt-BR", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			console.error("Erro ao formatar data:", error);
			return "-";
		}
	};

	const formatDate = (dateString: string): string => {
		if (!dateString) return "-";
		
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleDateString("pt-BR", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		} catch (error) {
			console.error("Erro ao formatar data:", error);
			return "-";
		}
	};

	const formatTime = (dateString: string): string => {
		if (!dateString) return "-";
		
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleTimeString("pt-BR", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			console.error("Erro ao formatar hora:", error);
			return "-";
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<Label className="text-muted-foreground">Comodidade</Label>
				<p className="font-medium">{amenityName}</p>
			</div>

			<div>
				<Label className="text-muted-foreground">Data de Início</Label>
				<p className="font-medium">{formatDate(booking.startDate)}</p>
			</div>

			{booking.startTime && booking.endTime ? (
				<>
					<div>
						<Label className="text-muted-foreground">Horário</Label>
						<p className="font-medium">{booking.startTime} - {booking.endTime}</p>
					</div>
					{booking.numberOfHours && (
						<div>
							<Label className="text-muted-foreground">Duração</Label>
							<p className="font-medium">{booking.numberOfHours} hora(s)</p>
						</div>
					)}
				</>
			) : (
				<>
					<div>
						<Label className="text-muted-foreground">Data de Término</Label>
						<p className="font-medium">{formatDate(booking.endDate)}</p>
					</div>
					{booking.numberOfDays && (
						<div>
							<Label className="text-muted-foreground">Duração</Label>
							<p className="font-medium">{booking.numberOfDays} dia(s)</p>
						</div>
					)}
				</>
			)}

			{booking.totalValue > 0 && (
				<div>
					<Label className="text-muted-foreground">Valor Total</Label>
					<p className="font-medium">
						R$ {booking.totalValue.toLocaleString("pt-BR", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			)}

			<div>
				<Label className="text-muted-foreground">Status</Label>
				<div className="mt-1">
					{getStatusBadge(booking.status)}
				</div>
			</div>

			{booking.observation && (
				<div className="pt-4 border-t">
					<Label className="text-muted-foreground">Observação</Label>
					<p className="text-sm mt-1 whitespace-pre-wrap">{booking.observation}</p>
				</div>
			)}

			{amenityData && (
				<>
					{amenityData.fineValue && amenityData.fineValue > 0 && (
						<div className="pt-4 border-t">
							<Label className="text-muted-foreground">Multa por Atraso</Label>
							<p className="text-sm font-medium text-destructive mt-1">
								R$ {amenityData.fineValue.toLocaleString("pt-BR", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>
					)}

					{amenityData.nonComplianceFine && amenityData.nonComplianceFine > 0 && (
						<div className="pt-4 border-t">
							<Label className="text-muted-foreground">Multa por Descumprimento de Normas</Label>
							<p className="text-sm font-medium text-destructive mt-1">
								R$ {amenityData.nonComplianceFine.toLocaleString("pt-BR", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>
					)}

					{amenityData.usageRules && (
						<div className="pt-4 border-t">
							<Label className="text-muted-foreground">Normas de Uso</Label>
							<div 
								className="text-sm mt-1 prose prose-sm max-w-none"
								dangerouslySetInnerHTML={{ __html: amenityData.usageRules }}
							/>
						</div>
					)}
				</>
			)}

			{booking.qrCode && booking.totalValue > 0 && (
				<div className="pt-4 border-t">
					<Button
						variant="outline"
						type="button"
						onClick={() => onShowQRCode(booking)}
						className="w-full"
					>
						<QrCode className="w-4 h-4 mr-2" />
						Ver QR Code PIX
					</Button>
				</div>
			)}

			<div className="flex gap-2 pt-4 border-t">
				{booking.status !== "CANCELADO" && 
				 booking.status !== "FINALIZADO" && (
					<Button
						variant="destructive"
						type="button"
						onClick={() => onCancel(booking._id)}
						className="flex-1"
					>
						<XCircle className="w-4 h-4 mr-2" />
						Cancelar
					</Button>
				)}
			</div>
		</div>
	);
}

// Componente para renderizar uma linha de reserva
function BookingRow({
	booking,
	amenities,
	amenityCache,
	setAmenityCache,
	onViewBooking,
	getStatusBadge,
	onShowQRCode,
}: {
	booking: AmenityBooking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	onViewBooking: (booking: AmenityBooking) => void;
	getStatusBadge: (status: string) => React.ReactNode;
	onShowQRCode: (booking: AmenityBooking) => void;
}) {
	const [amenityName, setAmenityName] = useState<string>("Carregando...");

	useEffect(() => {
		const loadAmenityName = async () => {
			// Verifica se amenityId existe e é válido
			if (!booking.amenityId || booking.amenityId === "undefined") {
				setAmenityName("Comodidade não encontrada");
				return;
			}

			// Primeiro, tenta encontrar no array de amenities
			let amenity = amenities.find((a) => a._id === booking.amenityId);
			
			// Se não encontrou, tenta no cache
			if (!amenity) {
				amenity = amenityCache.get(booking.amenityId);
			}
			
			// Se encontrou, atualiza o nome
			if (amenity) {
				setAmenityName(amenity.name);
				return;
			}
			
			// Se ainda não encontrou, busca da API
			try {
				const fetchedAmenity = await amenitiesService.getAmenityById(booking.amenityId);
				if (fetchedAmenity) {
					setAmenityName(fetchedAmenity.name);
					// Adiciona ao cache
					setAmenityCache((prev) => new Map(prev).set(booking.amenityId, fetchedAmenity));
				} else {
					setAmenityName("Comodidade não encontrada");
				}
			} catch (error) {
				console.error("Erro ao buscar comodidade:", error);
				setAmenityName("Comodidade não encontrada");
			}
		};

		loadAmenityName();
	}, [booking.amenityId, amenities, amenityCache, setAmenityCache]);

	const formatDate = (dateString: string): string => {
		if (!dateString) return "-";
		
		try {
			// Se já está no formato YYYY-MM-DD, converte diretamente
			if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
				const date = new Date(dateString + "T00:00:00");
				if (isNaN(date.getTime())) {
					return "-";
				}
				return date.toLocaleDateString("pt-BR");
			}
			
			// Tenta converter como Date ISO
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleDateString("pt-BR");
		} catch (error) {
			console.error("Erro ao formatar data:", error);
			return "-";
		}
	};

	const formatTime = (dateString: string): string => {
		if (!dateString) return "-";
		
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleTimeString("pt-BR", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			console.error("Erro ao formatar hora:", error);
			return "-";
		}
	};

	const formatTimeRange = (startTime?: string, endTime?: string): string => {
		if (!startTime || !endTime) return "-";
		return `${startTime} - ${endTime}`;
	};

	return (
		<TableRow
			className="cursor-pointer"
			onClick={(e) => {
				// Não abrir modal se clicar em um botão
				if ((e.target as HTMLElement).closest('button')) {
					return;
				}
				onViewBooking(booking);
			}}
		>
			<TableCell className="font-medium">
				{amenityName}
			</TableCell>
			<TableCell>
				{formatDate(booking.startDate)}
			</TableCell>
			<TableCell>
				{booking.endDate ? formatDate(booking.endDate) : "-"}
			</TableCell>
			<TableCell>
				{booking.totalValue > 0
					? `R$ ${booking.totalValue.toLocaleString("pt-BR", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}`
					: "-"}
			</TableCell>
			<TableCell>{getStatusBadge(booking.status)}</TableCell>
			<TableCell onClick={(e) => e.stopPropagation()}>
				<div className="flex gap-2">
					{booking.qrCode && booking.totalValue > 0 && (
						<Button
							size="sm"
							variant="outline"
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onShowQRCode(booking);
							}}
						>
							<QrCode className="w-4 h-4 mr-1" />
							QR Code
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onViewBooking(booking);
						}}
					>
						Ver Detalhes
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}

export default function Bookings() {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [amenities, setAmenities] = useState<Amenity[]>([]);
	const [bookings, setBookings] = useState<AmenityBooking[]>([]);
	const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedStartTime, setSelectedStartTime] = useState<string>("");
	const [selectedEndTime, setSelectedEndTime] = useState<string>("");
	const [availableSlots, setAvailableSlots] = useState<string[]>([]);
	const [isLoadingSlots, setIsLoadingSlots] = useState(false);
	const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [viewingBooking, setViewingBooking] = useState<AmenityBooking | null>(null);
	const [activeTab, setActiveTab] = useState("amenities");
	const [amenityCache, setAmenityCache] = useState<Map<string, Amenity>>(new Map());
	const [createdBooking, setCreatedBooking] = useState<AmenityBooking | null>(null);
	const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
	const [qrBookingToShow, setQrBookingToShow] = useState<AmenityBooking | null>(null);
	const [isAmenityDetailsDialogOpen, setIsAmenityDetailsDialogOpen] = useState(false);
	const [amenityToView, setAmenityToView] = useState<Amenity | null>(null);
	const [bookingStep, setBookingStep] = useState(1); // 1: Data, 2: Horário, 3: Confirmar, 4: Instruções
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	const bookingForm = useForm<BookingFormData>({
		resolver: zodResolver(bookingSchema),
		defaultValues: {
			amenityId: "",
			date: "",
			startTime: "",
			endTime: "",
			numberOfResidents: 1,
			observation: "",
			acceptedTerms: false,
		},
	});

	const loadAmenities = useCallback(async () => {
		try {
			console.log("Carregando comodidades ativas para residente");
			// Retorna todas as comodidades ativas (COMODIDADE e AREA_COMUM)
			const amenitiesList = await amenitiesService.getActiveCommoditiesForResident();

			console.log("Comodidades ativas recebidas (total):", amenitiesList.length);
			console.log("Comodidades ativas recebidas (detalhes):", amenitiesList);

			// Ordenar: primeiro COMODIDADE, depois AREA_COMUM
			const sortedAmenities = [...amenitiesList].sort((a, b) => {
				if (a.type === "COMODIDADE" && b.type === "AREA_COMUM") return -1;
				if (a.type === "AREA_COMUM" && b.type === "COMODIDADE") return 1;
				return 0;
			});

			// Mostrar todas as comodidades ativas ordenadas
			setAmenities(sortedAmenities);
		} catch (error: any) {
			console.error("Erro ao carregar comodidades:", error);
			toast.error(error.message || "Erro ao carregar comodidades");
		}
	}, [user?.buildingId]);

	const loadBookings = useCallback(async () => {
		try {
			// Buscar TODAS as reservas do apartmentId do resident logado
			const params: GetAmenityBookingsParams = {
				page: 1,
				limit: 100,
			};

			const response = await amenityBookingsService.getBookings(params);
			console.log("Resposta completa de bookings:", response);

			if (response.success && response.data) {
				// A API retorna { bookings: [], total: number, page: number, limit: number }
				// Retornar TODAS as reservas (sem filtrar por status)
				const allBookings = response.data.bookings || [];

				// Ordenar por data (mais recentes primeiro)
				const sortedBookings = allBookings.sort((a, b) => {
					const dateA = new Date(a.startDate).getTime();
					const dateB = new Date(b.startDate).getTime();
					return dateB - dateA;
				});

				console.log("Todos os bookings do resident:", sortedBookings);
				setBookings(sortedBookings);
			} else {
				console.warn("Resposta sem sucesso ou sem data:", response);
				setBookings([]);
			}
		} catch (error: any) {
			console.error("Erro ao carregar reservas:", error);
			toast.error("Erro ao carregar reservas");
			setBookings([]);
		}
	}, []);

	// Removido loadAvailableSlots - não mais necessário com a nova API

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await Promise.all([loadAmenities(), loadBookings()]);
			setIsLoading(false);
		};
		loadData();
	}, [loadAmenities, loadBookings]);

	const handleSelectAmenity = (amenity: Amenity) => {
		// Verificar se a comodidade permite reserva
		// AREA_COMUM não permite reserva, apenas COMODIDADE com bookingType
		if (amenity.type === "AREA_COMUM") {
			toast.error("Áreas comuns não permitem reserva");
			return;
		}
		
		if (!amenity.bookingType) {
			toast.error("Esta comodidade não permite reserva");
			return;
		}

		setSelectedAmenity(amenity);
		setIsBookingDialogOpen(true);
		setBookingStep(1);
		setAcceptedTerms(false);
		setSelectedDate(undefined);
		setSelectedStartTime("");
		setSelectedEndTime("");
		setAvailableSlots([]);
		bookingForm.reset({
			amenityId: amenity._id,
			date: "",
			startTime: "",
			endTime: "",
			numberOfResidents: 1,
			observation: "",
			acceptedTerms: false,
		});
	};

	const handleDateChange = async (date: Date | undefined) => {
		setSelectedDate(date);
		if (date) {
			const dateStr = format(date, "yyyy-MM-dd");
			bookingForm.setValue("date", dateStr);

			// Se for POR_HORAS, buscar horários disponíveis
			if (selectedAmenity?.bookingType === "POR_HORAS") {
				setIsLoadingSlots(true);
				try {
					const response = await amenityBookingsService.getAvailableTimeSlots(
						selectedAmenity._id,
						date,
					);
					if (response.success && response.data) {
						setAvailableSlots(response.data.availableSlots || []);
					}
				} catch (error: any) {
					console.error("Erro ao buscar horários disponíveis:", error);
					toast.error("Erro ao buscar horários disponíveis");
				} finally {
					setIsLoadingSlots(false);
				}
			}
		} else {
			setAvailableSlots([]);
		}
	};

	// Para DIARIO, pular etapa 2 automaticamente
	useEffect(() => {
		if (bookingStep === 2 && selectedAmenity?.bookingType === "DIARIO") {
			setBookingStep(3);
		}
	}, [bookingStep, selectedAmenity?.bookingType]);

	const handleBookingSubmit = async (data: BookingFormData) => {
		try {
			if (!selectedDate) {
				toast.error("Selecione uma data");
				bookingForm.setError("date", { message: "Data é obrigatória" });
				return;
			}

			// Validação específica para POR_HORAS
			if (selectedAmenity?.bookingType === "POR_HORAS") {
				if (!data.startTime || !data.endTime) {
					toast.error("Selecione horário de início e término");
					if (!data.startTime) {
						bookingForm.setError("startTime", { message: "Horário de início é obrigatório" });
					}
					if (!data.endTime) {
						bookingForm.setError("endTime", { message: "Horário de término é obrigatório" });
					}
					return;
				}

				// Validar que endTime é depois de startTime
				const start = data.startTime.split(":").map(Number);
				const end = data.endTime.split(":").map(Number);
				const startMinutes = start[0] * 60 + start[1];
				const endMinutes = end[0] * 60 + end[1];
				if (endMinutes <= startMinutes) {
					toast.error("Horário de término deve ser posterior ao horário de início");
					bookingForm.setError("endTime", { message: "Horário de término deve ser posterior ao horário de início" });
					return;
				}
			}

			// Preparar dados baseado no tipo de reserva
			const bookingData: CreateAmenityBookingRequest = {
				amenityId: data.amenityId,
				startDate: selectedDate.toISOString(),
				observation: data.observation || undefined,
			};

			if (selectedAmenity?.bookingType === "POR_HORAS") {
				bookingData.startTime = data.startTime!;
				bookingData.endTime = data.endTime!;
			} else {
				// DIARIO - endDate é obrigatório
				if (!data.endDate) {
					toast.error("Data de término é obrigatória");
					bookingForm.setError("endDate", { message: "Data de término é obrigatória" });
					return;
				}
				bookingData.endDate = new Date(data.endDate).toISOString();
			}

			const response = await amenityBookingsService.createBooking(bookingData);

			if (response.success && response.data) {
				toast.success("Reserva criada com sucesso!");
				setCreatedBooking(response.data);
				setIsBookingDialogOpen(false);
				setBookingStep(1);
				setAcceptedTerms(false);
				bookingForm.reset();
				setSelectedDate(undefined);
				setSelectedStartTime("");
				setSelectedEndTime("");
				setAvailableSlots([]);

				// Mudar para aba de reservas
				setActiveTab("bookings");
				await loadBookings();

				// Se tem QR code (comodidade paga), mostrar dialog automaticamente
				if (response.data.qrCode && response.data.totalValue > 0) {
					setTimeout(() => {
						setQrBookingToShow(response.data);
						setIsQRDialogOpen(true);
					}, 300);
				}
			} else {
				toast.error(response.message || "Erro ao criar reserva");
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao criar reserva");
			console.error("Erro ao criar reserva:", error);
		}
	};

	const handleViewBooking = (booking: AmenityBooking) => {
		setViewingBooking(booking);
		setIsViewDialogOpen(true);
	};

	const handleCancelBooking = async (bookingId: string) => {
		try {
			const response = await amenityBookingsService.cancelBooking(bookingId);

			if (response.success) {
				toast.success("Reserva cancelada com sucesso!");
				await loadBookings();
				setIsViewDialogOpen(false);
			} else {
				toast.error(response.message || "Erro ao cancelar reserva");
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao cancelar reserva");
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "CONFIRMADO":
				return (
					<Badge variant="default" className="bg-green-500">
						<CheckCircle className="w-3 h-3 mr-1" />
						Confirmado
					</Badge>
				);
			case "PENDENTE":
				return (
					<Badge variant="secondary">
						<AlertCircle className="w-3 h-3 mr-1" />
						Pendente
					</Badge>
				);
			case "CANCELADO":
				return (
					<Badge variant="outline">
						<XCircle className="w-3 h-3 mr-1" />
						Cancelado
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	const getAmenityName = (amenityId: string): string => {
		// Primeiro, tenta encontrar no array de amenities
		let amenity = amenities.find((a) => a._id === amenityId);
		
		// Se não encontrou, tenta no cache
		if (!amenity) {
			amenity = amenityCache.get(amenityId);
		}
		
		return amenity?.name || "Comodidade não encontrada";
	};

	const formatDate = (dateString: string): string => {
		if (!dateString) return "-";
		
		try {
			// Se já está no formato YYYY-MM-DD, converte diretamente
			if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
				const date = new Date(dateString + "T00:00:00");
				if (isNaN(date.getTime())) {
					return "-";
				}
				return date.toLocaleDateString("pt-BR");
			}
			
			// Tenta converter como Date ISO
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleDateString("pt-BR");
		} catch (error) {
			console.error("Erro ao formatar data:", error);
			return "-";
		}
	};

	const formatTimeRange = (startTime?: string, endTime?: string): string => {
		if (!startTime || !endTime) return "-";
		return `${startTime} - ${endTime}`;
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-muted rounded w-1/4"></div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-32 bg-muted rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Reservas</h1>
				<p className="text-muted-foreground">
					Reserve comodidades do condomínio
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList>
					<TabsTrigger value="amenities">Comodidades</TabsTrigger>
					<TabsTrigger value="bookings">Minhas Reservas</TabsTrigger>
				</TabsList>

				<TabsContent value="amenities" className="space-y-6">
					{amenities.length === 0 ? (
						<Card>
							<CardContent className="flex items-center justify-center h-32">
								<p className="text-muted-foreground">
									Nenhuma comodidade disponível para reserva
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{amenities.map((amenity) => {
								// AREA_COMUM não permite reserva, apenas COMODIDADE com bookingType pode reservar
								const canBook = amenity.type === "COMODIDADE" && amenity.bookingType && (amenity.bookingType === "DIARIO" || amenity.bookingType === "POR_HORAS");
								return (
									<Card
										key={amenity._id}
										className={`transition-all h-full flex flex-col ${
											canBook
												? "hover:shadow-lg hover:border-primary"
												: ""
										}`}
									>
										<CardHeader className="pb-3">
											<CardTitle className="flex items-center gap-2 text-base">
												<MapPin className="w-4 h-4 text-primary flex-shrink-0" />
												<span className="line-clamp-2">{amenity.name}</span>
											</CardTitle>
										</CardHeader>
										<CardContent className="flex-1 flex flex-col space-y-3">
											<div className="flex flex-wrap items-center gap-2">
												{amenity.type && (
													<Badge variant="secondary" className="text-xs">
														{amenity.type === "AREA_COMUM" ? "Área Comum" : "Comodidade"}
													</Badge>
												)}
												{amenity.bookingType && (
													<Badge variant="outline" className="text-xs">
														{amenity.bookingType === "DIARIO"
															? "Reserva Diária"
															: "Reserva por Horas"}
													</Badge>
												)}
												{amenity.bookingType === "POR_HORAS" && amenity.maxHours && (
													<Badge variant="outline" className="text-xs">
														Máx. {amenity.maxHours}h
													</Badge>
												)}
											</div>

											{amenity.type === "AREA_COMUM" ? (
												<div className="pt-2 border-t">
													<p className="text-sm text-muted-foreground italic">
														Não é necessário reserva
													</p>
												</div>
											) : amenity.value && amenity.value > 0 ? (
												<div className="pt-2 border-t">
													<p className="text-xs text-muted-foreground mb-1">Valor</p>
													<p className="text-lg font-bold text-primary">
														R$ {amenity.value.toLocaleString("pt-BR", {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
														{amenity.bookingType === "POR_HORAS" && (
															<span className="text-sm font-normal text-muted-foreground">/hora</span>
														)}
														{amenity.bookingType === "DIARIO" && (
															<span className="text-sm font-normal text-muted-foreground">/dia</span>
														)}
													</p>
												</div>
											) : (
												<div className="pt-2 border-t">
													<p className="text-xs text-muted-foreground mb-1">Valor</p>
													<p className="text-sm text-muted-foreground">-</p>
												</div>
											)}

											{/* Botões de Ação */}
											<div className="flex gap-2 pt-3 border-t mt-auto" onClick={(e) => e.stopPropagation()}>
												{canBook && (
													<Button
														type="button"
														className="flex-1"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															handleSelectAmenity(amenity);
														}}
													>
														<Plus className="w-4 h-4 mr-2" />
														Nova Reserva
													</Button>
												)}
												<Button
													type="button"
													variant="outline"
													className={canBook ? "flex-1" : "w-full"}
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setAmenityToView(amenity);
														setIsAmenityDetailsDialogOpen(true);
													}}
												>
													Detalhes
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="bookings" className="space-y-6">
					{!bookings || bookings.length === 0 ? (
						<Card>
							<CardContent className="flex items-center justify-center h-32">
								<p className="text-muted-foreground">
									Nenhuma reserva encontrada
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
									<TableHead>Comodidade</TableHead>
									<TableHead>Data Início</TableHead>
									<TableHead>Data Fim</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(bookings || []).map((booking, index) => (
										<BookingRow
											key={booking._id || `booking-${index}`}
											booking={booking}
											amenities={amenities}
											amenityCache={amenityCache}
											setAmenityCache={setAmenityCache}
											onViewBooking={handleViewBooking}
											getStatusBadge={getStatusBadge}
											onShowQRCode={(booking) => {
												setQrBookingToShow(booking);
												setIsQRDialogOpen(true);
											}}
										/>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Dialog de Criar Reserva com Stepper */}
			<Dialog
				open={isBookingDialogOpen}
				onOpenChange={(open) => {
					setIsBookingDialogOpen(open);
					if (!open) {
						bookingForm.reset();
						setSelectedAmenity(null);
						setSelectedDate(undefined);
						setSelectedStartTime("");
						setSelectedEndTime("");
						setBookingStep(1);
						setAcceptedTerms(false);
					}
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Agendar {selectedAmenity?.name || "Comodidade"}
						</DialogTitle>
						<DialogDescription>
							{bookingStep === 1 && "Escolha o dia da reserva"}
							{bookingStep === 2 && "Escolha o horário da reserva"}
							{bookingStep === 3 && "Confirme os dados da reserva"}
							{bookingStep === 4 && "Leia as instruções de uso"}
						</DialogDescription>
					</DialogHeader>

					{/* Stepper */}
					<div className="flex items-center justify-between mb-6">
						{[1, 2, 3, 4].map((step) => (
							<React.Fragment key={step}>
								<div className="flex items-center">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
											bookingStep >= step
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground"
										}`}
									>
										{step}
									</div>
									{step < 4 && (
										<div
											className={`w-16 h-1 mx-2 ${
												bookingStep > step ? "bg-primary" : "bg-muted"
											}`}
										/>
									)}
								</div>
							</React.Fragment>
						))}
					</div>

					<form
						onSubmit={bookingForm.handleSubmit(handleBookingSubmit)}
						className="space-y-4"
					>
						{/* Etapa 1: Escolher Dia */}
						{bookingStep === 1 && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Escolha o dia</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												type="button"
												className="w-full justify-start text-left font-normal"
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{selectedDate ? (
													format(selectedDate, "PPP", { locale: ptBR })
												) : (
													<span>Selecione uma data</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={selectedDate}
												onSelect={(date) => {
													if (date) {
														setSelectedDate(date);
														bookingForm.setValue("date", format(date, "yyyy-MM-dd"));
													}
												}}
												disabled={(date) => date < new Date()}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<input
										type="hidden"
										{...bookingForm.register("date")}
									/>
									{bookingForm.formState.errors.date && (
										<p className="text-sm text-destructive">
											{bookingForm.formState.errors.date.message}
										</p>
									)}
								</div>
								<div className="flex justify-end">
									<Button
										type="button"
										onClick={() => {
											if (selectedDate) {
												setBookingStep(2);
												if (selectedAmenity?.bookingType === "POR_HORAS") {
													handleDateChange(selectedDate);
												}
											} else {
												toast.error("Selecione uma data para continuar");
											}
										}}
									>
										Próximo
									</Button>
								</div>
							</div>
						)}

						{/* Etapa 2: Escolher Horário */}
						{bookingStep === 2 && selectedAmenity?.bookingType === "POR_HORAS" && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Escolha o horário</Label>
									{isLoadingSlots ? (
										<div className="flex items-center justify-center py-4">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
										</div>
									) : availableSlots.length > 0 ? (
										<div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-md">
											{availableSlots
												.filter((slot) => {
													// Filtrar apenas horários inteiros (minutos = 00)
													const [, minutes] = slot.split(":").map(Number);
													return minutes === 0;
												})
												.map((slot) => {
													// Calcular horário de término baseado em maxHours
													const [hour] = slot.split(":").map(Number);
													const endHour = hour + (selectedAmenity.maxHours || 1);
													const endTime = endHour < 24 ? `${endHour.toString().padStart(2, "0")}:00` : null;
													
													return (
														<Button
															key={slot}
															type="button"
															variant={
																selectedStartTime === slot ? "default" : "outline"
															}
															size="sm"
															onClick={() => {
																if (endTime) {
																	setSelectedStartTime(slot);
																	setSelectedEndTime(endTime);
																	bookingForm.setValue("startTime", slot);
																	bookingForm.setValue("endTime", endTime);
																}
															}}
														>
															{slot} - {endTime}
														</Button>
													);
												})}
										</div>
									) : (
										<p className="text-sm text-muted-foreground text-center py-4">
											Nenhum horário disponível para esta data
										</p>
									)}
								</div>
								{selectedStartTime && selectedEndTime && (
									<div className="p-3 bg-muted rounded-md">
										<p className="text-sm">
											<strong>Horário selecionado:</strong> {selectedStartTime} às {selectedEndTime}
										</p>
									</div>
								)}
								<div className="flex justify-between">
									<Button
										type="button"
										variant="outline"
										onClick={() => setBookingStep(1)}
									>
										Voltar
									</Button>
									<Button
										type="button"
										onClick={() => {
											if (selectedStartTime && selectedEndTime) {
												setBookingStep(3);
											} else {
												toast.error("Selecione um horário para continuar");
											}
										}}
									>
										Próximo
									</Button>
								</div>
							</div>
						)}

						{/* Etapa 3: Confirmar */}
						{bookingStep === 3 && (
							<div className="space-y-4">
								<div className="space-y-3 p-4 border rounded-md">
									<div>
										<Label className="text-muted-foreground">Comodidade</Label>
										<p className="font-medium">{selectedAmenity?.name}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Data de Início</Label>
										<p className="font-medium">
											{selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "-"}
										</p>
									</div>
									{selectedAmenity?.bookingType === "POR_HORAS" && (
										<div>
											<Label className="text-muted-foreground">Horário</Label>
											<p className="font-medium">
												{selectedStartTime} - {selectedEndTime}
											</p>
										</div>
									)}
									{selectedAmenity?.bookingType === "DIARIO" && (
										<div className="space-y-2">
											<Label htmlFor="endDate">Data de Término</Label>
											<Input
												id="endDate"
												type="date"
												min={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
												required
												{...bookingForm.register("endDate")}
											/>
											{bookingForm.formState.errors.endDate && (
												<p className="text-sm text-destructive">
													{bookingForm.formState.errors.endDate.message}
												</p>
											)}
										</div>
									)}
									<div className="space-y-2">
										<Label htmlFor="observation">Observação (opcional)</Label>
										<Textarea
											id="observation"
											placeholder="Adicione uma observação sobre sua reserva..."
											{...bookingForm.register("observation")}
											rows={3}
										/>
									</div>
								</div>
								<div className="flex justify-between">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											if (selectedAmenity?.bookingType === "POR_HORAS") {
												setBookingStep(2);
											} else {
												setBookingStep(1);
											}
										}}
									>
										Voltar
									</Button>
									<Button
										type="button"
										onClick={() => {
											// Validar endDate para DIARIO
											if (selectedAmenity?.bookingType === "DIARIO") {
												const endDate = bookingForm.watch("endDate");
												if (!endDate) {
													toast.error("Data de término é obrigatória");
													bookingForm.setError("endDate", { message: "Data de término é obrigatória" });
													return;
												}
											}
											
											if (selectedAmenity?.usageRules) {
												setBookingStep(4);
											} else {
												// Se não tem usageRules, criar direto
												bookingForm.setValue("acceptedTerms", true);
												bookingForm.handleSubmit(handleBookingSubmit)();
											}
										}}
									>
										Próximo
									</Button>
								</div>
							</div>
						)}

						{/* Etapa 4: Instruções de Uso */}
						{bookingStep === 4 && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Instruções de Uso da Reserva</Label>
									{selectedAmenity?.usageRules ? (
										<div
											className="p-4 border rounded-md prose prose-sm max-w-none"
											dangerouslySetInnerHTML={{ __html: selectedAmenity.usageRules }}
										/>
									) : (
										<p className="text-sm text-muted-foreground p-4 border rounded-md">
											Não há instruções de uso disponíveis para esta comodidade.
										</p>
									)}
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="acceptedTerms"
										checked={acceptedTerms}
										onCheckedChange={(checked) => {
											const isChecked = checked === true;
											setAcceptedTerms(isChecked);
											bookingForm.setValue("acceptedTerms", isChecked);
										}}
									/>
									<Label
										htmlFor="acceptedTerms"
										className="text-sm font-normal cursor-pointer"
									>
										Li e concordo com as instruções de uso
									</Label>
								</div>
								{bookingForm.formState.errors.acceptedTerms && (
									<p className="text-sm text-destructive">
										{bookingForm.formState.errors.acceptedTerms.message}
									</p>
								)}
								<div className="flex justify-between">
									<Button
										type="button"
										variant="outline"
										onClick={() => setBookingStep(3)}
									>
										Voltar
									</Button>
									<Button
										type="submit"
										disabled={!acceptedTerms || bookingForm.formState.isSubmitting}
									>
										{bookingForm.formState.isSubmitting
											? "Criando..."
											: "Confirmar Reserva"}
									</Button>
								</div>
							</div>
						)}
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog de Visualizar Reserva */}
			<Dialog
				open={isViewDialogOpen}
				onOpenChange={(open) => {
					setIsViewDialogOpen(open);
					if (!open) {
						setViewingBooking(null);
					}
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Detalhes da Reserva</DialogTitle>
					</DialogHeader>

					{viewingBooking && (
						<BookingDetails
							booking={viewingBooking}
							amenities={amenities}
							amenityCache={amenityCache}
							setAmenityCache={setAmenityCache}
							getStatusBadge={getStatusBadge}
							onCancel={handleCancelBooking}
							onShowQRCode={(booking) => {
								setQrBookingToShow(booking);
								setIsViewDialogOpen(false);
								setIsQRDialogOpen(true);
							}}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de QR Code PIX */}
			<Dialog 
				open={isQRDialogOpen} 
				onOpenChange={(open) => {
					setIsQRDialogOpen(open);
					if (!open) {
						setQrBookingToShow(null);
					}
				}}
			>
				<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
					<DialogHeader className="flex-shrink-0">
						<DialogTitle className="flex items-center gap-2">
							<QrCode className="w-5 h-5" />
							Pagamento via PIX
						</DialogTitle>
						<DialogDescription>
							Escaneie o QR code com o aplicativo do seu banco para realizar o pagamento
						</DialogDescription>
					</DialogHeader>
					{qrBookingToShow?.qrCode ? (
						<div className="space-y-4">
							{/* QR Code */}
							<div className="flex flex-col items-center gap-3">
								<div className="flex items-center justify-center p-4 bg-white rounded-lg border-2 border-dashed border-primary/20 w-full max-w-[280px] mx-auto">
									<div className="flex flex-col items-center gap-2 w-full">
										<QrCode className="w-40 h-40 text-primary flex-shrink-0" />
										<p className="text-xs text-muted-foreground text-center break-all px-2">
											{qrBookingToShow.qrCode}
										</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground text-center">
									Escaneie este código com o app do seu banco
								</p>
							</div>

							{/* Informações do Pagamento */}
							<div className="space-y-2 p-3 bg-muted rounded-lg">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Valor a pagar</span>
									<span className="text-xl font-bold text-primary">
										R$ {qrBookingToShow.totalValue.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
								{qrBookingToShow.amenity && (
									<div className="flex justify-between items-center pt-2 border-t">
										<span className="text-sm text-muted-foreground">Comodidade</span>
										<span className="text-sm font-medium text-right max-w-[60%] truncate">
											{qrBookingToShow.amenity.name}
										</span>
									</div>
								)}
								{qrBookingToShow.startDate && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">Data da reserva</span>
										<span className="text-sm font-medium">
											{new Date(qrBookingToShow.startDate).toLocaleDateString("pt-BR")}
										</span>
									</div>
								)}
								{qrBookingToShow.qrCodeExpiry && (
									<div className="flex justify-between items-center pt-2 border-t">
										<span className="text-xs text-muted-foreground">QR Code válido até</span>
										<span className="text-xs font-medium text-destructive text-right">
											{new Date(qrBookingToShow.qrCodeExpiry).toLocaleString("pt-BR", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
								)}
							</div>

							{/* Instruções */}
							<div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
								<p className="text-sm font-medium text-blue-900 dark:text-blue-100">
									Como pagar:
								</p>
								<ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
									<li>Abra o app do seu banco</li>
									<li>Escolha a opção PIX</li>
									<li>Escaneie o QR code acima</li>
									<li>Confirme o pagamento</li>
								</ol>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center py-8">
							<p className="text-sm text-muted-foreground">Carregando QR code...</p>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de Detalhes da Comodidade */}
			<Dialog
				open={isAmenityDetailsDialogOpen}
				onOpenChange={(open) => {
					setIsAmenityDetailsDialogOpen(open);
					if (!open) {
						setAmenityToView(null);
					}
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<MapPin className="w-5 h-5 text-primary" />
							{amenityToView?.name || "Detalhes da Comodidade"}
						</DialogTitle>
						<DialogDescription>
							Informações completas sobre a comodidade
						</DialogDescription>
					</DialogHeader>
					{amenityToView && (
						<div className="space-y-4">
							{amenityToView.description && (
								<div>
									<Label className="text-muted-foreground">Descrição</Label>
									<p className="text-sm mt-1">{amenityToView.description}</p>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-muted-foreground">Tipo</Label>
									<p className="text-sm font-medium mt-1">
										{amenityToView.type === "AREA_COMUM" ? "Área Comum" : "Comodidade"}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Tipo de Reserva</Label>
									<p className="text-sm font-medium mt-1">
										{amenityToView.bookingType === "DIARIO"
											? "Reserva Diária"
											: amenityToView.bookingType === "POR_HORAS"
											? "Reserva por Horas"
											: "Não definido"}
									</p>
								</div>
								{amenityToView.maxResidents && (
									<div>
										<Label className="text-muted-foreground">Máximo de Residentes</Label>
										<p className="text-sm font-medium mt-1">
											{amenityToView.maxResidents}
										</p>
									</div>
								)}
								{amenityToView.bookingType === "POR_HORAS" && amenityToView.maxHours && (
									<div>
										<Label className="text-muted-foreground">Máximo de Horas</Label>
										<p className="text-sm font-medium mt-1">
											{amenityToView.maxHours} hora(s)
										</p>
									</div>
								)}
							</div>

							{amenityToView.value && amenityToView.value > 0 && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Valor</Label>
									<p className="text-2xl font-bold text-primary mt-1">
										R$ {amenityToView.value.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
										{amenityToView.bookingType === "POR_HORAS" && (
											<span className="text-sm font-normal text-muted-foreground">/hora</span>
										)}
										{amenityToView.bookingType === "DIARIO" && (
											<span className="text-sm font-normal text-muted-foreground">/dia</span>
										)}
									</p>
								</div>
							)}

							{amenityToView.fineValue && amenityToView.fineValue > 0 && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Multa por Atraso</Label>
									<p className="text-lg font-medium text-destructive mt-1">
										R$ {amenityToView.fineValue.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</p>
								</div>
							)}

							{amenityToView.nonComplianceFine && amenityToView.nonComplianceFine > 0 && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Multa por Descumprimento de Normas</Label>
									<p className="text-lg font-medium text-destructive mt-1">
										R$ {amenityToView.nonComplianceFine.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</p>
								</div>
							)}

							{amenityToView.usageRules && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Normas de Uso</Label>
									<div 
										className="text-sm mt-1 prose prose-sm max-w-none"
										dangerouslySetInnerHTML={{ __html: amenityToView.usageRules }}
									/>
								</div>
							)}

							<div className="flex gap-2 pt-4 border-t">
								{amenityToView.bookingType && (
									<Button
										type="button"
										className="flex-1"
										onClick={() => {
											setIsAmenityDetailsDialogOpen(false);
											setAmenityToView(null);
											handleSelectAmenity(amenityToView);
										}}
									>
										<Plus className="w-4 h-4 mr-2" />
										Nova Reserva
									</Button>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}


