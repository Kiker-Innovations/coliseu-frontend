import { useState, useEffect, useCallback } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
	Calendar,
	Clock,
	MapPin,
	Users,
	Plus,
	CheckCircle,
	XCircle,
	AlertCircle,
	Search,
} from "lucide-react";
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
	startTime: z.string().min(1, "Horário de início é obrigatório"),
	endTime: z.string().min(1, "Horário de término é obrigatório"),
	numberOfResidents: z
		.number()
		.int("Deve ser um número inteiro")
		.min(1, "Deve ser pelo menos 1"),
}).refine((data) => {
	if (data.startTime && data.endTime) {
		const start = data.startTime.split(":").map(Number);
		const end = data.endTime.split(":").map(Number);
		const startMinutes = start[0] * 60 + start[1];
		const endMinutes = end[0] * 60 + end[1];
		return endMinutes > startMinutes;
	}
	return true;
}, {
	message: "Horário de término deve ser posterior ao horário de início",
	path: ["endTime"],
});

type BookingFormData = z.infer<typeof bookingSchema>;

// Componente para exibir detalhes do agendamento no dialog
function BookingDetails({
	booking,
	amenities,
	amenityCache,
	setAmenityCache,
	getStatusBadge,
	onCancel,
}: {
	booking: AmenityBooking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	getStatusBadge: (status: string) => React.ReactNode;
	onCancel: (bookingId: string) => void;
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

			<div>
				<Label className="text-muted-foreground">Horário de Início</Label>
				<p className="font-medium">{formatTime(booking.startDate)}</p>
			</div>

			<div>
				<Label className="text-muted-foreground">Data de Término</Label>
				<p className="font-medium">{formatDate(booking.endDate)}</p>
			</div>

			<div>
				<Label className="text-muted-foreground">Horário de Término</Label>
				<p className="font-medium">{formatTime(booking.endDate)}</p>
			</div>

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

			<div className="flex gap-2 pt-4">
				{booking.status !== "CANCELADO" && (
					<Button
						variant="destructive"
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

// Componente para renderizar uma linha de agendamento
function BookingRow({
	booking,
	amenities,
	amenityCache,
	setAmenityCache,
	onViewBooking,
	getStatusBadge,
}: {
	booking: AmenityBooking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	onViewBooking: (booking: AmenityBooking) => void;
	getStatusBadge: (status: string) => React.ReactNode;
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

	const formatTimeRange = (startTime?: string, endTime?: string): string => {
		if (!startTime || !endTime) return "-";
		return `${startTime} - ${endTime}`;
	};

	return (
		<TableRow
			className="cursor-pointer"
			onClick={() => onViewBooking(booking)}
		>
			<TableCell className="font-medium">
				{amenityName}
			</TableCell>
			<TableCell>
				{formatDate(booking.startDate)}
			</TableCell>
			<TableCell>
				{formatTime(booking.startDate)} - {formatTime(booking.endDate)}
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
			<TableCell>
				<Button
					size="sm"
					variant="outline"
					onClick={(e) => {
						e.stopPropagation();
						onViewBooking(booking);
					}}
				>
					Ver Detalhes
				</Button>
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
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedStartTime, setSelectedStartTime] = useState<string>("");
	const [selectedEndTime, setSelectedEndTime] = useState<string>("");
	const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [viewingBooking, setViewingBooking] = useState<AmenityBooking | null>(null);
	const [activeTab, setActiveTab] = useState("amenities");
	const [amenityCache, setAmenityCache] = useState<Map<string, Amenity>>(new Map());

	const bookingForm = useForm<BookingFormData>({
		resolver: zodResolver(bookingSchema),
		defaultValues: {
			amenityId: "",
			date: "",
			startTime: "",
			endTime: "",
			numberOfResidents: 1,
		},
	});

	const loadAmenities = useCallback(async () => {
		try {
			console.log("Carregando comodidades ativas para residente");
			// Usar a nova função específica para residentes que retorna apenas comodidades ativas (ATIVO + COMODIDADE)
			const amenitiesList = await amenitiesService.getActiveCommoditiesForResident();

			console.log("Comodidades ativas recebidas (total):", amenitiesList.length);
			console.log("Comodidades ativas recebidas (detalhes):", amenitiesList);

			// Filtrar apenas comodidades que permitem agendamento (DIARIO ou POR_HORAS)
			// A API já retorna apenas COMODIDADE e ATIVO, então só precisamos verificar o bookingType
			const bookableAmenities = amenitiesList.filter(
				(amenity) => {
					// Deve ter bookingType definido como DIARIO ou POR_HORAS
					const bookingType = amenity.bookingType?.toUpperCase();
					const hasBookingType = bookingType === "DIARIO" || bookingType === "POR_HORAS";
					
					console.log(`Amenity ${amenity.name}:`, {
						type: amenity.type,
						bookingType: amenity.bookingType,
						status: amenity.status,
						hasBookingType,
						passaFiltro: hasBookingType,
					});
					
					return hasBookingType;
				}
			);

			console.log("Comodidades filtradas (com bookingType):", bookableAmenities.length);
			console.log("Comodidades filtradas (detalhes):", bookableAmenities);
			setAmenities(bookableAmenities);
		} catch (error: any) {
			console.error("Erro ao carregar comodidades:", error);
			toast.error(error.message || "Erro ao carregar comodidades");
		}
	}, [user?.buildingId]);

	const loadBookings = useCallback(async () => {
		try {
			// Buscar agendamentos - a API retorna todos os status quando não especificamos
			// Filtrar apenas PENDENTE e CONFIRMADO no frontend
			const params: GetAmenityBookingsParams = {
				page: 1,
				limit: 100,
			};

			const response = await amenityBookingsService.getBookings(params);
			console.log("Resposta completa de bookings:", response);

			if (response.success && response.data) {
				// A API retorna { bookings: [], total: number, page: number, limit: number }
				const allBookings = response.data.bookings || [];
				
				// Filtrar apenas agendamentos com status PENDENTE e CONFIRMADO
				const filteredBookings = allBookings.filter(
					(booking) => booking.status === "PENDENTE" || booking.status === "CONFIRMADO"
				);

				// Ordenar por data (mais recentes primeiro)
				const sortedBookings = filteredBookings.sort((a, b) => {
					const dateA = new Date(a.startDate).getTime();
					const dateB = new Date(b.startDate).getTime();
					return dateB - dateA;
				});

				console.log("Bookings filtrados (PENDENTE + CONFIRMADO):", sortedBookings);
				setBookings(sortedBookings);
			} else {
				console.warn("Resposta sem sucesso ou sem data:", response);
				setBookings([]);
			}
		} catch (error: any) {
			console.error("Erro ao carregar agendamentos:", error);
			toast.error("Erro ao carregar agendamentos");
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
		// Verificar se a comodidade permite agendamento
		if (!amenity.bookingType) {
			toast.error("Esta comodidade não permite agendamento");
			return;
		}

		setSelectedAmenity(amenity);
		setIsBookingDialogOpen(true);
		bookingForm.reset({
			amenityId: amenity._id,
			date: "",
			startTime: "",
			endTime: "",
			numberOfResidents: 1,
		});
		setSelectedDate("");
		setSelectedStartTime("");
		setSelectedEndTime("");
	};

	const handleDateChange = (date: string) => {
		setSelectedDate(date);
		bookingForm.setValue("date", date);
	};

	const handleBookingSubmit = async (data: BookingFormData) => {
		try {
			// Converter data e horários para formato ISO 8601
			const startDate = new Date(`${data.date}T${data.startTime}:00`);
			const endDate = new Date(`${data.date}T${data.endTime}:00`);

			// Calcular valor total (se a amenidade tiver valor)
			const amenity = amenities.find(a => a._id === data.amenityId);
			let totalValue = 0;
			
			if (amenity?.value) {
				if (amenity.bookingType === "DIARIO") {
					totalValue = amenity.value;
				} else if (amenity.bookingType === "POR_HORAS") {
					// Calcular horas
					const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
					totalValue = amenity.value * hours;
				}
			}

			const bookingData: CreateAmenityBookingRequest = {
				amenityId: data.amenityId,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				totalValue: totalValue,
			};

			const response = await amenityBookingsService.createBooking(bookingData);

			if (response.success) {
				toast.success("Agendamento criado com sucesso! Aguardando confirmação.");
				setIsBookingDialogOpen(false);
				bookingForm.reset();
				setSelectedDate("");
				setSelectedStartTime("");
				setSelectedEndTime("");
				await loadBookings();
			} else {
				toast.error(response.message || "Erro ao criar agendamento");
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao criar agendamento");
			console.error("Erro ao criar agendamento:", error);
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
				toast.success("Agendamento cancelado com sucesso!");
				await loadBookings();
				setIsViewDialogOpen(false);
			} else {
				toast.error(response.message || "Erro ao cancelar agendamento");
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao cancelar agendamento");
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
				<h1 className="text-3xl font-bold">Agendamentos</h1>
				<p className="text-muted-foreground">
					Agende comodidades do condomínio
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList>
					<TabsTrigger value="amenities">Comodidades</TabsTrigger>
					<TabsTrigger value="bookings">Meus Agendamentos</TabsTrigger>
				</TabsList>

				<TabsContent value="amenities" className="space-y-6">
					{amenities.length === 0 ? (
						<Card>
							<CardContent className="flex items-center justify-center h-32">
								<p className="text-muted-foreground">
									Nenhuma comodidade disponível para agendamento
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{amenities.map((amenity) => {
								const canBook = amenity.bookingType && (amenity.bookingType === "DIARIO" || amenity.bookingType === "POR_HORAS");
								return (
									<Card
										key={amenity._id}
										className={`transition-shadow ${
											canBook
												? "cursor-pointer hover:shadow-lg"
												: "opacity-60 cursor-not-allowed"
										}`}
										onClick={() => canBook && handleSelectAmenity(amenity)}
									>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<MapPin className="w-5 h-5 text-primary" />
												{amenity.name}
												{!canBook && (
													<Badge variant="outline" className="ml-auto text-xs">
														Não agendável
													</Badge>
												)}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												{amenity.description && (
													<p className="text-sm text-muted-foreground">
														{amenity.description}
													</p>
												)}
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													{amenity.maxResidents && (
														<div className="flex items-center gap-1">
															<Users className="w-3 h-3" />
															<span>Máx: {amenity.maxResidents}</span>
														</div>
													)}
													{amenity.bookingType && (
														<Badge variant="outline" className="text-xs">
															{amenity.bookingType === "DIARIO"
																? "Diário"
																: "Por Horas"}
														</Badge>
													)}
													{amenity.bookingType === "POR_HORAS" &&
														amenity.maxHours && (
															<span>Máx: {amenity.maxHours}h</span>
														)}
												</div>
												{amenity.value && amenity.value > 0 && (
													<p className="text-sm font-medium">
														Valor: R$ {amenity.value.toLocaleString("pt-BR")}
													</p>
												)}
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
									Nenhum agendamento encontrado
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
									<TableHead>Comodidade</TableHead>
									<TableHead>Data</TableHead>
									<TableHead>Horário</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(bookings || []).map((booking) => (
										<BookingRow
											key={booking._id}
											booking={booking}
											amenities={amenities}
											amenityCache={amenityCache}
											setAmenityCache={setAmenityCache}
											onViewBooking={handleViewBooking}
											getStatusBadge={getStatusBadge}
										/>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Dialog de Criar Agendamento */}
			<Dialog
				open={isBookingDialogOpen}
				onOpenChange={(open) => {
					setIsBookingDialogOpen(open);
					if (!open) {
						bookingForm.reset();
						setSelectedAmenity(null);
						setSelectedDate("");
						setSelectedStartTime("");
						setSelectedEndTime("");
					}
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Agendar {selectedAmenity?.name || "Comodidade"}
						</DialogTitle>
						<DialogDescription>
							Preencha os dados para criar um novo agendamento
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={bookingForm.handleSubmit(handleBookingSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="date">Data</Label>
							<Input
								id="date"
								type="date"
								min={new Date().toISOString().split("T")[0]}
								{...bookingForm.register("date")}
								onChange={(e) => {
									bookingForm.setValue("date", e.target.value);
									handleDateChange(e.target.value);
								}}
							/>
							{bookingForm.formState.errors.date && (
								<p className="text-sm text-destructive">
									{bookingForm.formState.errors.date.message}
								</p>
							)}
						</div>


						{selectedAmenity?.bookingType === "POR_HORAS" && (
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startTime">Horário de Início</Label>
									<Input
										id="startTime"
										type="time"
										{...bookingForm.register("startTime")}
									/>
									{bookingForm.formState.errors.startTime && (
										<p className="text-sm text-destructive">
											{bookingForm.formState.errors.startTime.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="endTime">Horário de Término</Label>
									<Input
										id="endTime"
										type="time"
										{...bookingForm.register("endTime")}
									/>
									{bookingForm.formState.errors.endTime && (
										<p className="text-sm text-destructive">
											{bookingForm.formState.errors.endTime.message}
										</p>
									)}
								</div>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="numberOfResidents">
								Número de Residents
							</Label>
							<Input
								id="numberOfResidents"
								type="number"
								min="1"
								max={selectedAmenity?.maxResidents}
								{...bookingForm.register("numberOfResidents", {
									valueAsNumber: true,
								})}
							/>
							{selectedAmenity?.maxResidents && (
								<p className="text-xs text-muted-foreground">
									Máximo: {selectedAmenity.maxResidents} residents
								</p>
							)}
							{bookingForm.formState.errors.numberOfResidents && (
								<p className="text-sm text-destructive">
									{bookingForm.formState.errors.numberOfResidents.message}
								</p>
							)}
						</div>

						<div className="flex gap-4">
							<Button
								type="submit"
								className="flex-1"
								disabled={bookingForm.formState.isSubmitting}
							>
								{bookingForm.formState.isSubmitting
									? "Criando..."
									: "Criar Agendamento"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsBookingDialogOpen(false)}
							>
								Cancelar
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog de Visualizar Agendamento */}
			<Dialog
				open={isViewDialogOpen}
				onOpenChange={setIsViewDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Detalhes do Agendamento</DialogTitle>
					</DialogHeader>

					{viewingBooking && (
						<BookingDetails
							booking={viewingBooking}
							amenities={amenities}
							amenityCache={amenityCache}
							setAmenityCache={setAmenityCache}
							getStatusBadge={getStatusBadge}
							onCancel={handleCancelBooking}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}


