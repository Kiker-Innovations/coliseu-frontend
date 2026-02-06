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
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
	RefreshCw,
	Info,
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
	bookingsService,
	NetworkError,
	type Amenity,
	type Booking,
	type CreateBookingRequest,
	type GetBookingsParams,
} from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import BookingsSkeleton from "@/skeleton/resident/BookingsSkeleton";
import { NetworkErrorState } from "@/components/network/NetworkErrorState";

const bookingSchema = z
	.object({
		amenityId: z.string().uuid("Selecione uma comodidade"),
		date: z.string().min(1, "Data é obrigatória"),
		endDate: z.string().optional(),
		startTime: z.string().optional(),
		endTime: z.string().optional(),
		numberOfResidents: z
			.number()
			.int("Deve ser um número inteiro")
			.min(1, "Deve ser pelo menos 1")
			.optional(),
		observation: z.string().max(500, "Observação deve ter no máximo 500 caracteres").optional(),
		acceptedTerms: z.boolean().refine((val) => val === true, {
			message: "Você deve aceitar os termos de uso",
		}),
	})
	.refine(
		(data) => {
			// Validação será feita dinamicamente baseado no tipo de reserva
			return true;
		},
		{
			message: "Dados inválidos",
		},
	);

type BookingFormData = z.infer<typeof bookingSchema>;

// Componente para exibir detalhes da reserva no dialog
function BookingDetails({
	booking,
	amenities,
	amenityCache,
	setAmenityCache,
	getStatusBadge,
	onCancel,
}: {
	booking: Booking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	getStatusBadge: (status: string) => React.ReactNode;
	onCancel: (bookingId: string) => void;
}) {
	const [amenityName, setAmenityName] = useState<string>("...");
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
				<p className="font-medium">
					{formatDate(booking.startDate)}
					{booking.startDate && new Date(booking.startDate).getHours() !== 0 && (
						<span className="ml-2 text-sm text-muted-foreground">
							({formatTime(booking.startDate)})
						</span>
					)}
				</p>
			</div>

			<div>
				<Label className="text-muted-foreground">Data de Término</Label>
				<p className="font-medium">
					{formatDate(booking.endDate)}
					{booking.endDate && new Date(booking.endDate).getHours() !== 23 && (
						<span className="ml-2 text-sm text-muted-foreground">
							({formatTime(booking.endDate)})
						</span>
					)}
				</p>
			</div>
			{booking.numberOfDays && (
				<div>
					<Label className="text-muted-foreground">Duração</Label>
					<p className="font-medium">{booking.numberOfDays} dia(s)</p>
				</div>
			)}
			{booking.startDate && booking.endDate && !booking.numberOfDays && (
				<div>
					<Label className="text-muted-foreground">Horário</Label>
					<p className="font-medium">
						{formatTime(booking.startDate)} - {formatTime(booking.endDate)}
					</p>
				</div>
			)}

			{booking.totalValue > 0 && (
				<div>
					<Label className="text-muted-foreground">Valor Total</Label>
					<p className="font-medium">
						R${" "}
						{booking.totalValue.toLocaleString("pt-BR", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			)}

			<div>
				<Label className="text-muted-foreground">Status</Label>
				<div className="mt-1">{getStatusBadge(booking.status)}</div>
			</div>

			{booking.observation && (
				<div className="pt-4 border-t">
					<Label className="text-muted-foreground">Observação</Label>
					<p className="text-sm mt-1 whitespace-pre-wrap">{booking.observation}</p>
				</div>
			)}

			{amenityData && (
				<>
					{(amenityData.fineValue && amenityData.fineValue > 0) ||
					(amenityData.nonComplianceFine && amenityData.nonComplianceFine > 0) ? (
						<div className="pt-4 border-t">
							<Accordion type="multiple" defaultValue={[]} className="w-full">
								{amenityData.fineValue && amenityData.fineValue > 0 && (
									<AccordionItem value="fineValue">
										<AccordionTrigger className="text-sm">
											<div className="flex items-center gap-1">
												<Label className="text-muted-foreground">Multa por Atraso</Label>
												<Popover>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="inline-flex"
															onClick={(e) => e.stopPropagation()}
														>
															<Info className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
														</button>
													</PopoverTrigger>
													<PopoverContent className="w-80">
														<p className="text-sm">
															Este valor só será cobrado caso você não devolva o espaço no
															horário combinado. Se cumprir o horário, não haverá cobrança
															adicional.
														</p>
													</PopoverContent>
												</Popover>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<p className="text-sm font-medium text-destructive">
												R${" "}
												{amenityData.fineValue.toLocaleString("pt-BR", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</p>
										</AccordionContent>
									</AccordionItem>
								)}

								{amenityData.nonComplianceFine && amenityData.nonComplianceFine > 0 && (
									<AccordionItem value="nonComplianceFine">
										<AccordionTrigger className="text-sm">
											<div className="flex items-center gap-1">
												<Label className="text-muted-foreground">
													Multa por Descumprimento de Normas
												</Label>
												<Popover>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="inline-flex"
															onClick={(e) => e.stopPropagation()}
														>
															<Info className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
														</button>
													</PopoverTrigger>
													<PopoverContent className="w-80">
														<p className="text-sm">
															Este valor só será cobrado caso as normas de uso da comodidade
															sejam descumpridas. Seguindo as regras, não haverá cobrança
															adicional.
														</p>
													</PopoverContent>
												</Popover>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<p className="text-sm font-medium text-destructive">
												R${" "}
												{amenityData.nonComplianceFine.toLocaleString("pt-BR", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</p>
										</AccordionContent>
									</AccordionItem>
								)}
							</Accordion>
						</div>
					) : null}

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

			{booking.totalValue > 0 && booking.paymentUrl && booking.status === "PENDENTE" && (
				<div className="pt-4 border-t">
					<Button
						variant="default"
						type="button"
						onClick={() => window.open(booking.paymentUrl!, '_blank')}
						className="w-full"
					>
						<QrCode className="w-4 h-4 mr-2" />
						Pagar agora
					</Button>
				</div>
			)}

			<div className="flex gap-2 pt-4 border-t">
				{booking.status !== "CANCELADO" && booking.status !== "FINALIZADO" && (
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

// Componente para renderizar um card de reserva (mobile)
function BookingCard({
	booking,
	amenities,
	amenityCache,
	setAmenityCache,
	onViewBooking,
	getStatusBadge,
}: {
	booking: Booking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	onViewBooking: (booking: Booking) => void;
	getStatusBadge: (status: string) => React.ReactNode;
}) {
	const [amenityName, setAmenityName] = useState<string>("...");
	const [amenityData, setAmenityData] = useState<Amenity | null>(null);

	useEffect(() => {
		const loadAmenityName = async () => {
			if (!booking.amenityId || booking.amenityId === "undefined") {
				setAmenityName("Comodidade não encontrada");
				return;
			}

			let amenity = amenities.find((a) => a._id === booking.amenityId);

			if (!amenity) {
				amenity = amenityCache.get(booking.amenityId);
			}

			if (amenity) {
				setAmenityName(amenity.name);
				setAmenityData(amenity);
				return;
			}

			try {
				const fetchedAmenity = await amenitiesService.getAmenityById(booking.amenityId);
				if (fetchedAmenity) {
					setAmenityName(fetchedAmenity.name);
					setAmenityData(fetchedAmenity);
					setAmenityCache((prev) => new Map(prev).set(booking.amenityId, fetchedAmenity));
				} else {
					setAmenityName("Comodidade não encontrada");
					setAmenityData(null);
				}
			} catch (error) {
				console.error("Erro ao buscar comodidade:", error);
				setAmenityName("Comodidade não encontrada");
				setAmenityData(null);
			}
		};

		loadAmenityName();
	}, [booking.amenityId, amenities, amenityCache, setAmenityCache]);

	const formatDate = (dateString: string): string => {
		if (!dateString) return "-";

		try {
			if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
				const date = new Date(dateString + "T00:00:00");
				if (isNaN(date.getTime())) {
					return "-";
				}
				return date.toLocaleDateString("pt-BR");
			}

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

	return (
		<Card 
			className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 group overflow-hidden relative"
			onClick={() => onViewBooking(booking)}
		>
			{/* Gradiente sutil no topo */}
			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
			
			<CardHeader className="pb-4 pt-5">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-start gap-3 flex-1 min-w-0">
						<div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
							<MapPin className="w-5 h-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
								{amenityName}
							</CardTitle>
						</div>
					</div>
					<div className="flex-shrink-0">{getStatusBadge(booking.status)}</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 pt-0">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs font-medium flex items-center gap-1">
							<CalendarIcon className="w-3 h-3" />
							Data Início
						</Label>
						<p className="font-semibold text-sm break-words">
							{formatDate(booking.startDate)}
							{amenityData?.bookingType === "POR_HORAS" && booking.startDate && (
								<span className="ml-2 text-xs text-muted-foreground font-normal block sm:inline">
									({formatTime(booking.startDate)})
								</span>
							)}
						</p>
					</div>
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs font-medium flex items-center gap-1">
							<CalendarIcon className="w-3 h-3" />
							Data Fim
						</Label>
						<p className="font-semibold text-sm break-words">
							{booking.endDate ? (
								<>
									{formatDate(booking.endDate)}
									{amenityData?.bookingType === "POR_HORAS" && (
										<span className="ml-2 text-xs text-muted-foreground font-normal block sm:inline">
											({formatTime(booking.endDate)})
										</span>
									)}
								</>
							) : (
								<span className="text-muted-foreground">-</span>
							)}
						</p>
					</div>
				</div>
				
				{booking.totalValue > 0 && (
					<div className="pt-3 border-t">
						<Label className="text-muted-foreground text-xs font-medium">Valor Total</Label>
						<p className="text-xl font-bold text-primary mt-1">
							R${" "}
							{booking.totalValue.toLocaleString("pt-BR", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>
				)}
				
				<div className="flex flex-col sm:flex-row gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
					{booking.totalValue > 0 && booking.paymentUrl && booking.status === "PENDENTE" && (
						<Button
							size="sm"
							variant="default"
							type="button"
							className="w-full sm:flex-1 font-semibold shadow-sm hover:shadow-md transition-shadow"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								window.open(booking.paymentUrl!, '_blank');
							}}
						>
							<QrCode className="w-4 h-4 mr-1.5" />
							Pagar
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						type="button"
						className="w-full sm:flex-1 font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onViewBooking(booking);
						}}
					>
						<Info className="w-4 h-4 mr-1.5" />
						Detalhes
					</Button>
				</div>
			</CardContent>
		</Card>
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
}: {
	booking: Booking;
	amenities: Amenity[];
	amenityCache: Map<string, Amenity>;
	setAmenityCache: React.Dispatch<React.SetStateAction<Map<string, Amenity>>>;
	onViewBooking: (booking: Booking) => void;
	getStatusBadge: (status: string) => React.ReactNode;
}) {
	const [amenityName, setAmenityName] = useState<string>("...");
	const [amenityData, setAmenityData] = useState<Amenity | null>(null);

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
				console.error("Erro ao buscar comodidade:", error);
				setAmenityName("Comodidade não encontrada");
				setAmenityData(null);
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

	return (
		<TableRow
			className="cursor-pointer hover:bg-primary/5 transition-colors group"
			onClick={(e) => {
				// Não abrir modal se clicar em um botão
				if ((e.target as HTMLElement).closest("button")) {
					return;
				}
				onViewBooking(booking);
			}}
		>
			<TableCell className="font-semibold overflow-hidden">
				<div className="flex items-center gap-2 min-w-0">
					<div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
						<MapPin className="w-4 h-4 text-primary" />
					</div>
					<span className="group-hover:text-primary transition-colors truncate block min-w-0">{amenityName}</span>
				</div>
			</TableCell>
			<TableCell className="overflow-hidden">
				<div className="flex items-center gap-1.5 min-w-0">
					<CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					<div className="min-w-0 overflow-hidden">
						<div className="font-medium truncate">{formatDate(booking.startDate)}</div>
						{amenityData?.bookingType === "POR_HORAS" && booking.startDate && (
							<span className="text-xs text-muted-foreground block truncate">
								{formatTime(booking.startDate)}
							</span>
						)}
					</div>
				</div>
			</TableCell>
			<TableCell className="overflow-hidden">
				{booking.endDate ? (
					<div className="flex items-center gap-1.5 min-w-0">
						<CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div className="min-w-0 overflow-hidden">
							<div className="font-medium truncate">{formatDate(booking.endDate)}</div>
							{amenityData?.bookingType === "POR_HORAS" && (
								<span className="text-xs text-muted-foreground block truncate">
									{formatTime(booking.endDate)}
								</span>
							)}
						</div>
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				)}
			</TableCell>
			<TableCell className="overflow-hidden">
				{booking.totalValue > 0 ? (
					<span className="font-bold text-primary whitespace-nowrap">
						R$ {booking.totalValue.toLocaleString("pt-BR", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</span>
				) : (
					<span className="text-muted-foreground">-</span>
				)}
			</TableCell>
			<TableCell className="overflow-hidden">
				<div className="whitespace-nowrap">{getStatusBadge(booking.status)}</div>
			</TableCell>
			<TableCell onClick={(e) => e.stopPropagation()} className="overflow-visible">
				<div className="flex gap-1.5 items-center">
					{/* Botão Pagar - aparece quando tem paymentUrl e status PENDENTE */}
					{booking.totalValue > 0 && booking.paymentUrl && booking.status === "PENDENTE" && (
						<Button
							size="sm"
							variant="default"
							type="button"
							className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all text-xs px-2 h-7"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								window.open(booking.paymentUrl!, '_blank');
							}}
						>
							<QrCode className="w-3 h-3 mr-1" />
							Pagar
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						type="button"
						className="hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 h-7"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onViewBooking(booking);
						}}
					>
						<Info className="w-3 h-3 mr-1" />
						Detalhes
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}

export default function Bookings() {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState<Error | null>(null);
	const [amenities, setAmenities] = useState<Amenity[]>([]);
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
	const [activeTab, setActiveTab] = useState("amenities");
	const [amenityCache, setAmenityCache] = useState<Map<string, Amenity>>(new Map());
	const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
	const [isAmenityDetailsDialogOpen, setIsAmenityDetailsDialogOpen] = useState(false);
	const [amenityToView, setAmenityToView] = useState<Amenity | null>(null);
	const [bookingStep, setBookingStep] = useState(1); // 1: Data, 2: Confirmar, 3: Instruções
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [startTime, setStartTime] = useState<string>("");
	const [endTime, setEndTime] = useState<string>("");
	const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());
	const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
	const [hoursAvailability, setHoursAvailability] = useState<Map<number, boolean>>(new Map());
	const [dayAvailable, setDayAvailable] = useState<boolean | null>(null);
	const [isLoadingHoursAvailability, setIsLoadingHoursAvailability] = useState(false);
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	const bookingForm = useForm<BookingFormData>({
		resolver: zodResolver(bookingSchema),
		defaultValues: {
			amenityId: "",
			date: "",
			endDate: "",
			startTime: "",
			endTime: "",
			numberOfResidents: 1,
			observation: "",
			acceptedTerms: false,
		},
	});

	const loadAmenities = useCallback(async () => {
		try {
			// Retorna todas as comodidades ativas (COMODIDADE e AREA_COMUM)
			const amenitiesList = await amenitiesService.getActiveCommoditiesForResident();

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
	}, []);

	const loadBookings = useCallback(async () => {
		try {
			// Buscar TODAS as reservas do apartmentId do resident logado
			const params: GetBookingsParams = {
				page: 1,
				limit: 100,
			};

			const response = await bookingsService.getBookings(params);
			console.log("📦 Resposta da API bookings:", response);

			if (response.success && response.data) {
				// A API retorna { bookings: [], total: number, page: number, limit: number }
				// Retornar TODAS as reservas (sem filtrar por status)
				const allBookings = response.data.bookings || [];
				
				// Log para verificar se paymentUrl está nos dados
				console.log("📋 Bookings recebidos:", allBookings.map(b => ({
					_id: b._id,
					totalValue: b.totalValue,
					paymentUrl: b.paymentUrl,
					status: b.status,
				})));

				// Ordenar por data (mais recentes primeiro)
				const sortedBookings = allBookings.sort((a, b) => {
					const dateA = new Date(a.startDate).getTime();
					const dateB = new Date(b.startDate).getTime();
					return dateB - dateA;
				});

				setBookings(sortedBookings);
			} else {
				setBookings([]);
			}
		} catch (error: any) {
			console.error("Erro ao carregar reservas:", error);
			toast.error("Erro ao carregar reservas");
			setBookings([]);
		}
	}, []);

	// Removido loadAvailableSlots - não mais necessário com a nova API

	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			setNetworkError(null);
			await Promise.all([loadAmenities(), loadBookings()]);
		} catch (error) {
			if (error instanceof NetworkError) {
				setNetworkError(error);
			} else {
				toast.error("Erro ao carregar dados");
			}
		} finally {
			setIsLoading(false);
		}
	}, [loadAmenities, loadBookings]);

	const loadAvailability = useCallback(async (amenityId: string, amenityType?: string) => {
		if (!amenityId) return;

		setIsLoadingAvailability(true);
		try {
			// Para POR_HORAS, usar disponibilidade de horas por dia
			// Para DIARIO, usar disponibilidade de dias
			if (amenityType === "POR_HORAS") {
				// Buscar disponibilidade para os próximos 60 dias
				// Para POR_HORAS, verificar se cada dia tem pelo menos uma hora disponível
				const today = new Date();
				const startDate = format(today, "yyyy-MM-dd");
				const endDate = new Date(today);
				endDate.setDate(endDate.getDate() + 60);
				
				const availabilityMap = new Map<string, boolean>();
				
				// Buscar disponibilidade de horas para cada dia
				const promises: Promise<void>[] = [];
				const currentDate = new Date(today);
				
				for (let i = 0; i < 60; i++) {
					const dateStr = format(currentDate, "yyyy-MM-dd");
					
					promises.push(
						bookingsService.getHoursAvailability({
							amenityId,
							date: dateStr,
						}).then((response) => {
							if (response.success && response.data) {
								// Um dia está disponível se tem pelo menos uma hora disponível
								availabilityMap.set(dateStr, response.data.dayAvailable);
							}
						}).catch((error) => {
							console.error(`Erro ao carregar disponibilidade para ${dateStr}:`, error);
						})
					);
					
					currentDate.setDate(currentDate.getDate() + 1);
				}
				
				await Promise.all(promises);
				setAvailability(availabilityMap);
			} else {
				// Para DIARIO, usar disponibilidade de dias
				const today = new Date();
				const startDate = format(today, "yyyy-MM-dd");
				const endDate = new Date(today);
				endDate.setDate(endDate.getDate() + 60);
				const endDateStr = format(endDate, "yyyy-MM-dd");

				const response = await bookingsService.getAvailability({
					amenityId,
					startDate,
					endDate: endDateStr,
				});

				if (response.success && response.data) {
					const availabilityMap = new Map<string, boolean>();
					for (const day of response.data.days) {
						availabilityMap.set(day.date, day.available);
					}
					setAvailability(availabilityMap);
				}
			}
		} catch (error) {
			console.error("Erro ao carregar disponibilidade:", error);
			// Não mostrar erro ao usuário, apenas logar
		} finally {
			setIsLoadingAvailability(false);
		}
	}, []);

	const loadHoursAvailability = useCallback(async (amenityId: string, date: Date) => {
		if (!amenityId || !date) return;

		setIsLoadingHoursAvailability(true);
		try {
			const dateStr = format(date, "yyyy-MM-dd");
			const response = await bookingsService.getHoursAvailability({
				amenityId,
				date: dateStr,
			});

			if (response.success && response.data) {
				const hoursMap = new Map<number, boolean>();
				for (const hour of response.data.hours) {
					hoursMap.set(hour.hour, hour.available);
				}
				setHoursAvailability(hoursMap);
				setDayAvailable(response.data.dayAvailable);
			}
		} catch (error) {
			console.error("Erro ao carregar disponibilidade de horas:", error);
			// Não mostrar erro ao usuário, apenas logar
		} finally {
			setIsLoadingHoursAvailability(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

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
		setStartTime("");
		setEndTime("");
		setAvailability(new Map());
		setHoursAvailability(new Map());
		setDayAvailable(null);
		setIsCalendarOpen(false);
		bookingForm.reset({
			amenityId: amenity._id,
			date: "",
			endDate: "",
			startTime: "",
			endTime: "",
			numberOfResidents: 1,
			observation: "",
			acceptedTerms: false,
		});

		// Buscar disponibilidade para a amenity selecionada
		loadAvailability(amenity._id, amenity.bookingType);
	};

	const handleDateChange = (date: Date | undefined) => {
		setSelectedDate(date);
		setStartTime("");
		setEndTime("");
		setHoursAvailability(new Map());
		setDayAvailable(null);
		if (date) {
			const dateStr = format(date, "yyyy-MM-dd");
			bookingForm.setValue("date", dateStr);
			
			// Se for POR_HORAS, buscar disponibilidade de horas para o dia selecionado
			if (selectedAmenity?.bookingType === "POR_HORAS" && selectedAmenity?._id) {
				loadHoursAvailability(selectedAmenity._id, date);
			}
		}
	};

	const handleBookingSubmit = async (data: BookingFormData) => {
		try {
			if (!selectedDate) {
				toast.error("Selecione uma data");
				bookingForm.setError("date", { message: "Data é obrigatória" });
				return;
			}

			if (!selectedAmenity) {
				toast.error("Comodidade não selecionada");
				return;
			}

			const bookingType = selectedAmenity.bookingType;
			let bookingData: CreateBookingRequest;

			if (bookingType === "DIARIO") {
				// Para DIARIO: startDate e endDate são o mesmo dia
				const dateStr = format(selectedDate, "yyyy-MM-dd");
				const startDate = new Date(`${dateStr}T00:00:00`);
				const endDate = new Date(`${dateStr}T23:59:59`);

				bookingData = {
					amenityId: data.amenityId,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					observation: data.observation || undefined,
				};
			} else if (bookingType === "POR_HORAS") {
				// Para POR_HORAS: validar horas
				if (!startTime || !endTime) {
					toast.error("Hora de início e fim são obrigatórias");
					return;
				}

				// Validar que horas sejam inteiras (00 minutos)
				const startTimeMatch = startTime.match(/^(\d{2}):(\d{2})$/);
				const endTimeMatch = endTime.match(/^(\d{2}):(\d{2})$/);

				if (!startTimeMatch || !endTimeMatch) {
					toast.error("Formato de hora inválido");
					return;
				}

				if (startTimeMatch[2] !== "00" || endTimeMatch[2] !== "00") {
					toast.error("As horas devem ser inteiras (ex: 14:00, não 14:30)");
					return;
				}

				// Validar que hora fim seja maior que hora início
				const startHour = Number.parseInt(startTimeMatch[1]);
				const endHour = Number.parseInt(endTimeMatch[1]);

				if (endHour <= startHour) {
					toast.error("Hora de término deve ser maior que hora de início");
					return;
				}

				// Validar que não ultrapasse maxHours
				const hoursDiff = endHour - startHour;
				if (selectedAmenity.maxHours && hoursDiff > selectedAmenity.maxHours) {
					toast.error(
						`O limite máximo de horas para esta comodidade é ${selectedAmenity.maxHours} hora(s)`,
					);
					return;
				}

				// Validar que não seja no passado (se for hoje)
				const today = new Date();
				const isToday = format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
				if (isToday) {
					const currentHour = today.getHours();
					if (startHour < currentHour) {
						toast.error("Não é possível reservar para um horário que já passou");
						return;
					}
				}

				const dateStr = format(selectedDate, "yyyy-MM-dd");
				const startDate = new Date(`${dateStr}T${startTime}:00`);
				const endDate = new Date(`${dateStr}T${endTime}:00`);

				bookingData = {
					amenityId: data.amenityId,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					observation: data.observation || undefined,
				};
			} else {
				toast.error("Tipo de reserva não suportado");
				return;
			}

			const response = await bookingsService.createBooking(bookingData);

			if (response.success && response.data) {
				toast.success("Reserva criada com sucesso!");
				setCreatedBooking(response.data);
				setIsBookingDialogOpen(false);
				setBookingStep(1);
				setAcceptedTerms(false);
				setStartTime("");
				setEndTime("");
				bookingForm.reset();
				setSelectedDate(undefined);

				// Mudar para aba de reservas
				setActiveTab("bookings");
				await loadBookings();

				// Se tem valor e tem paymentUrl na resposta, abrir URL diretamente
				if (response.data.totalValue > 0 && response.data.paymentUrl) {
					setTimeout(() => {
						// Abrir URL diretamente em nova aba
						window.open(response.data.paymentUrl, '_blank');
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

	const handleViewBooking = (booking: Booking) => {
		setViewingBooking(booking);
		setIsViewDialogOpen(true);
	};

	const handleCancelBooking = async (bookingId: string) => {
		try {
			const response = await bookingsService.cancelBooking(bookingId);

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
			case "AGENDADO":
				return (
					<Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm">
						<CheckCircle className="w-3 h-3 mr-1" />
						Agendado
					</Badge>
				);
			case "PENDENTE":
				return (
					<Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold shadow-sm border border-amber-200">
						<AlertCircle className="w-3 h-3 mr-1" />
						Pendente
					</Badge>
				);
			case "CANCELADO":
				return (
					<Badge variant="outline" className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold border-gray-300">
						<XCircle className="w-3 h-3 mr-1" />
						Cancelado
					</Badge>
				);
			default:
				return <Badge className="font-semibold">{status}</Badge>;
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
				const date = new Date(`${dateString}T00:00:00`);
				if (Number.isNaN(date.getTime())) {
					return "-";
				}
				return date.toLocaleDateString("pt-BR");
			}

			// Tenta converter como Date ISO
			const date = new Date(dateString);
			if (Number.isNaN(date.getTime())) {
				return "-";
			}
			return date.toLocaleDateString("pt-BR");
		} catch (error) {
			console.error("Erro ao formatar data:", error);
			return "-";
		}
	};

	if (isLoading) {
		return <BookingsSkeleton />;
	}

	if (networkError) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Reservas</h1>
					<p className="text-muted-foreground">Reserve comodidades do condomínio</p>
				</div>
				<NetworkErrorState error={networkError} onRetry={loadData} />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Reservas</h1>
				<p className="text-muted-foreground">Reserve comodidades do condomínio</p>
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
								<p className="text-muted-foreground">Nenhuma comodidade disponível para reserva</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{amenities.map((amenity) => {
								// AREA_COMUM não permite reserva, apenas COMODIDADE com bookingType DIARIO ou POR_HORAS pode reservar
								const canBook =
									amenity.type === "COMODIDADE" &&
									(amenity.bookingType === "DIARIO" || amenity.bookingType === "POR_HORAS");
								return (
									<Card
										key={amenity._id}
										className={`transition-all h-full flex flex-col ${
											canBook ? "hover:shadow-lg hover:border-primary" : ""
										}`}
									>
										<CardHeader className="pb-3">
											<CardTitle className="flex items-center gap-2 text-base">
												<MapPin className="w-4 h-4 text-primary flex-shrink-0" />
												<span className="line-clamp-2">{amenity.name}</span>
											</CardTitle>
										</CardHeader>
										<CardContent className="flex-1 flex flex-col">
											<div className="flex-1 space-y-3">
												<div className="flex flex-wrap items-center gap-2">
													{amenity.type && (
														<Badge variant="secondary" className="text-xs">
															{amenity.type === "AREA_COMUM" ? "Área Comum" : "Comodidade"}
														</Badge>
													)}
													{amenity.bookingType && (
														<Badge variant="outline" className="text-xs">
															{amenity.bookingType === "POR_HORAS"
																? "Por Horas"
																: amenity.bookingType === "DIARIO"
																	? "Reserva Diária"
																	: amenity.bookingType}
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
															R${" "}
															{amenity.value.toLocaleString("pt-BR", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</p>
													</div>
												) : (
													<div className="pt-2 border-t">
														<p className="text-xs text-muted-foreground mb-1">Valor</p>
														<p className="text-sm text-muted-foreground">Gratuito</p>
													</div>
												)}

												{amenity.openingTime && amenity.closingTime && (
													<div className="pt-2 border-t">
														<p className="text-xs text-muted-foreground mb-1">Horário de Funcionamento</p>
														<p className="text-sm font-medium flex items-center gap-1">
															<Clock className="w-3 h-3" />
															{amenity.openingTime} - {amenity.closingTime}
														</p>
													</div>
												)}
											</div>

											{/* Botões de Ação - sempre no fundo do card */}
											<div
												className="flex gap-2 pt-3 border-t mt-4"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
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
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
						<div>
							<p className="text-sm text-muted-foreground mt-1">
								{bookings?.length || 0} {bookings?.length === 1 ? "reserva encontrada" : "reservas encontradas"}
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={async () => {
								setIsLoading(true);
								await loadBookings();
								setIsLoading(false);
								toast.success("Reservas atualizadas");
							}}
							disabled={isLoading}
							className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow"
						>
							<RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
							Atualizar
						</Button>
					</div>
					{!bookings || bookings.length === 0 ? (
						<Card className="border-dashed">
							<CardContent className="flex flex-col items-center justify-center h-48">
								<div className="p-4 rounded-full bg-muted mb-4">
									<CalendarIcon className="w-8 h-8 text-muted-foreground" />
								</div>
								<p className="text-lg font-semibold text-muted-foreground">Nenhuma reserva encontrada</p>
								<p className="text-sm text-muted-foreground mt-1">Suas reservas aparecerão aqui</p>
							</CardContent>
						</Card>
					) : (
						<>
							{/* Versão Desktop - Tabela */}
							<div className="hidden md:block rounded-lg border shadow-sm overflow-hidden">
								<Table className="w-full table-fixed">
									<TableHeader className="bg-muted/50">
										<TableRow className="hover:bg-transparent">
											<TableHead className="font-semibold w-[25%]">Comodidade</TableHead>
											<TableHead className="font-semibold w-[18%]">Data Início</TableHead>
											<TableHead className="font-semibold w-[18%]">Data Fim</TableHead>
											<TableHead className="font-semibold w-[12%]">Valor</TableHead>
											<TableHead className="font-semibold w-[12%]">Status</TableHead>
											<TableHead className="font-semibold w-[15%]">Ações</TableHead>
										</TableRow>
									</TableHeader>
										<TableBody>
											{(bookings || [])
												.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
												.map((booking, index) => (
													<BookingRow
														key={booking._id || `booking-${index}`}
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
							{/* Versão Mobile - Cards */}
							<div className="md:hidden space-y-4">
								{(bookings || [])
									.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
									.map((booking, index) => (
										<BookingCard
											key={booking._id || `booking-${index}`}
											booking={booking}
											amenities={amenities}
											amenityCache={amenityCache}
											setAmenityCache={setAmenityCache}
											onViewBooking={handleViewBooking}
											getStatusBadge={getStatusBadge}
										/>
									))}
							</div>
						</>
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
						setStartTime("");
						setEndTime("");
						setBookingStep(1);
						setAcceptedTerms(false);
						setIsCalendarOpen(false);
					}
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Agendar {selectedAmenity?.name || "Comodidade"}</DialogTitle>
						<DialogDescription>
							{bookingStep === 1 && "Escolha o dia da reserva"}
							{bookingStep === 2 &&
								(selectedAmenity?.bookingType === "POR_HORAS"
									? "Escolha o horário da reserva"
									: "Confirme os dados da reserva")}
							{bookingStep === 3 && "Leia as instruções de uso"}
						</DialogDescription>
					</DialogHeader>

					{/* Stepper */}
					<div className="flex items-center justify-between mb-6">
						{[1, 2, 3].map((step) => (
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
									{step < 3 && (
										<div
											className={`w-16 h-1 mx-2 ${bookingStep > step ? "bg-primary" : "bg-muted"}`}
										/>
									)}
								</div>
							</React.Fragment>
						))}
					</div>

					<form onSubmit={bookingForm.handleSubmit(handleBookingSubmit)} className="space-y-4">
						{/* Etapa 1: Escolher Dia */}
						{bookingStep === 1 && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Escolha o dia</Label>
									<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
											{isLoadingAvailability && (
												<div className="p-4 text-sm text-muted-foreground">
													Carregando disponibilidade...
												</div>
											)}
											<Calendar
												mode="single"
												selected={selectedDate}
												onSelect={(date) => {
													if (date) {
														const dateStr = format(date, "yyyy-MM-dd");
														const isAvailable = availability.get(dateStr);
														
														// Permitir seleção apenas se estiver disponível
														if (availability.has(dateStr) && isAvailable === false) {
															toast.error("Este dia não está disponível para reserva");
															return;
														}
														
														handleDateChange(date);
														// Fechar o calendário após selecionar a data
														setIsCalendarOpen(false);
													}
												}}
												disabled={(date) => {
													const today = new Date();
													today.setHours(0, 0, 0, 0);
													const dateToCheck = new Date(date);
													dateToCheck.setHours(0, 0, 0, 0);
													
													// Desabilitar datas passadas
													if (dateToCheck < today) {
														return true;
													}
													
													// Desabilitar datas não disponíveis (apenas se tivermos informação de disponibilidade)
													const dateStr = format(date, "yyyy-MM-dd");
													const isAvailable = availability.get(dateStr);
													if (availability.has(dateStr) && isAvailable === false) {
														return true;
													}
													
													return false;
												}}
												modifiers={{
													unavailable: (date) => {
														const dateStr = format(date, "yyyy-MM-dd");
														return availability.has(dateStr) && availability.get(dateStr) === false;
													},
													available: (date) => {
														const dateStr = format(date, "yyyy-MM-dd");
														return availability.has(dateStr) && availability.get(dateStr) === true;
													},
												}}
												modifiersClassNames={{
													unavailable: "bg-red-200 text-red-900 font-medium border-2 border-red-400",
													available: "bg-green-200 text-green-900 font-medium border-2 border-green-400",
												}}
												classNames={{
													day_disabled: "text-muted-foreground opacity-50 bg-red-200",
												}}
												initialFocus
											/>
											{availability.size > 0 && (
												<div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between gap-4">
													<div className="flex items-center gap-2">
														<div className="w-3 h-3 bg-green-200 border-2 border-green-400 rounded"></div>
														<span className="font-medium">Disponível</span>
													</div>
													<div className="flex items-center gap-2">
														<div className="w-3 h-3 bg-red-200 border-2 border-red-400 rounded"></div>
														<span className="font-medium">Indisponível</span>
													</div>
												</div>
											)}
										</PopoverContent>
									</Popover>
									<input type="hidden" {...bookingForm.register("date")} />
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

						{/* Etapa 2: Horário (POR_HORAS) ou Confirmar (DIARIO) */}
						{bookingStep === 2 && (
							<div className="space-y-4">
								{selectedAmenity?.bookingType === "POR_HORAS" ? (
									<>
										<div className="space-y-3 p-4 border rounded-md">
											<div>
												<Label className="text-muted-foreground">Comodidade</Label>
												<p className="font-medium">{selectedAmenity?.name}</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Data</Label>
												<p className="font-medium">
													{selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "-"}
												</p>
											</div>
											{selectedAmenity?.openingTime && selectedAmenity?.closingTime && (
												<div>
													<Label className="text-muted-foreground">Horário de Funcionamento</Label>
													<p className="font-medium flex items-center gap-1">
														<Clock className="w-4 h-4" />
														{selectedAmenity.openingTime} - {selectedAmenity.closingTime}
													</p>
												</div>
											)}
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="startTime">Hora de Início *</Label>
													<Select
														value={startTime}
														onValueChange={(value) => {
															setStartTime(value);
															bookingForm.setValue("startTime", value);
															// Resetar endTime se for menor que startTime ou se a hora inicial não estiver disponível
															const startHour = parseInt(value.split(":")[0]);
															const isStartAvailable = hoursAvailability.has(startHour) 
																? hoursAvailability.get(startHour) === true
																: true;
															
															if (!isStartAvailable) {
																toast.error("Esta hora não está disponível");
																return;
															}
															
															if (endTime) {
																const endHour = parseInt(endTime.split(":")[0]);
																if (value >= endTime || endHour <= startHour) {
																	setEndTime("");
																	bookingForm.setValue("endTime", "");
																} else {
																	// Validar que o intervalo ainda está válido
																	let allAvailable = true;
																	for (let h = startHour; h <= endHour; h++) {
																		const isAvailable = hoursAvailability.has(h) 
																			? hoursAvailability.get(h) === true
																			: true;
																		if (!isAvailable) {
																			allAvailable = false;
																			break;
																		}
																	}
																	if (!allAvailable) {
																		setEndTime("");
																		bookingForm.setValue("endTime", "");
																	}
																}
															}
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder="Selecione a hora" />
														</SelectTrigger>
														<SelectContent className="max-h-[200px]">
															{Array.from({ length: 24 }, (_, i) => {
																const hour = i.toString().padStart(2, "0");
																const timeValue = `${hour}:00`;
																const isToday = selectedDate
																	? format(selectedDate, "yyyy-MM-dd") ===
																	  format(new Date(), "yyyy-MM-dd")
																	: false;
																const currentHour = new Date().getHours();
																const isPast = isToday && i < currentHour;
																const isAvailable = hoursAvailability.has(i) 
																	? hoursAvailability.get(i) === true
																	: true; // Se não tiver informação, considera disponível
																const isUnavailable = hoursAvailability.has(i) 
																	&& hoursAvailability.get(i) === false;
																
																return (
																	<SelectItem
																		key={timeValue}
																		value={timeValue}
																		disabled={isPast || isUnavailable}
																		className={
																			isUnavailable 
																				? "bg-red-100 text-red-900 font-medium border border-red-400 opacity-50" 
																				: isAvailable
																					? "bg-green-50 text-green-900"
																					: isPast 
																						? "text-muted-foreground opacity-50" 
																						: ""
																		}
																	>
																		{timeValue}
																		{isUnavailable && " (Indisponível)"}
																	</SelectItem>
																);
															})}
														</SelectContent>
													</Select>
													{bookingForm.formState.errors.startTime && (
														<p className="text-sm text-destructive">
															{bookingForm.formState.errors.startTime.message}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="endTime">Hora de Término *</Label>
													<Select
														value={endTime}
														onValueChange={(value) => {
															setEndTime(value);
															bookingForm.setValue("endTime", value);
														}}
														disabled={!startTime}
													>
														<SelectTrigger>
															<SelectValue placeholder="Selecione a hora" />
														</SelectTrigger>
														<SelectContent className="max-h-[200px]">
															{Array.from({ length: 24 }, (_, i) => {
																const hour = i.toString().padStart(2, "0");
																const timeValue = `${hour}:00`;
																if (!startTime) return null;
																const startHour = parseInt(startTime.split(":")[0]);
																const endHour = i;
																const maxHours = selectedAmenity?.maxHours || 24;
																const hoursDiff = endHour - startHour;
																
																// Verificar se todas as horas do intervalo estão disponíveis
																let allHoursAvailable = true;
																for (let h = startHour; h <= endHour; h++) {
																	const isAvailable = hoursAvailability.has(h) 
																		? hoursAvailability.get(h) === true
																		: true; // Se não tiver informação, considera disponível
																	if (!isAvailable) {
																		allHoursAvailable = false;
																		break;
																	}
																}
																
																const isAvailable = hoursAvailability.has(i) 
																	? hoursAvailability.get(i) === true
																	: true;
																const isUnavailable = hoursAvailability.has(i) 
																	&& hoursAvailability.get(i) === false;
																
																const isValid =
																	endHour > startHour && 
																	hoursDiff <= maxHours && 
																	allHoursAvailable;
																
																return (
																	<SelectItem
																		key={timeValue}
																		value={timeValue}
																		disabled={!isValid || isUnavailable}
																		className={
																			!isValid || isUnavailable || !allHoursAvailable
																				? "bg-red-100 text-red-900 font-medium border border-red-400 opacity-50" 
																				: isAvailable
																					? "bg-green-50 text-green-900"
																					: "text-muted-foreground opacity-50"
																		}
																	>
																		{timeValue}
																		{hoursDiff > maxHours && ` (limite: ${maxHours}h)`}
																		{!allHoursAvailable && !isUnavailable && " (horário indisponível no meio)"}
																		{isUnavailable && " (Indisponível)"}
																	</SelectItem>
																);
															})}
														</SelectContent>
													</Select>
													{bookingForm.formState.errors.endTime && (
														<p className="text-sm text-destructive">
															{bookingForm.formState.errors.endTime.message}
														</p>
													)}
													{selectedAmenity?.maxHours && (
														<p className="text-xs text-muted-foreground">
															Limite máximo: {selectedAmenity.maxHours} hora(s)
														</p>
													)}
												</div>
											</div>
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
											<Button type="button" variant="outline" onClick={() => setBookingStep(1)}>
												Voltar
											</Button>
											<Button
												type="button"
												onClick={() => {
													if (!startTime || !endTime) {
														toast.error("Selecione a hora de início e fim");
														return;
													}

													// Validar que todas as horas do intervalo estão disponíveis
													const startHour = parseInt(startTime.split(":")[0]);
													const endHour = parseInt(endTime.split(":")[0]);
													
													for (let h = startHour; h <= endHour; h++) {
														const isAvailable = hoursAvailability.has(h) 
															? hoursAvailability.get(h) === true
															: true; // Se não tiver informação, considera disponível
														if (!isAvailable) {
															toast.error(`O horário ${h.toString().padStart(2, "0")}:00 está indisponível. Por favor, escolha um intervalo sem horários indisponíveis.`);
															return;
														}
													}

													if (selectedAmenity?.usageRules) {
														setBookingStep(3);
													} else {
														bookingForm.setValue("acceptedTerms", true);
														bookingForm.handleSubmit(handleBookingSubmit)();
													}
												}}
											>
												Próximo
											</Button>
										</div>
									</>
								) : (
									<>
										<div className="space-y-3 p-4 border rounded-md">
											<div>
												<Label className="text-muted-foreground">Comodidade</Label>
												<p className="font-medium">{selectedAmenity?.name}</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Data</Label>
												<p className="font-medium">
													{selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "-"}
												</p>
											</div>
											{selectedAmenity?.openingTime && selectedAmenity?.closingTime && (
												<div>
													<Label className="text-muted-foreground">Horário de Funcionamento</Label>
													<p className="font-medium flex items-center gap-1">
														<Clock className="w-4 h-4" />
														{selectedAmenity.openingTime} - {selectedAmenity.closingTime}
													</p>
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
											<Button type="button" variant="outline" onClick={() => setBookingStep(1)}>
												Voltar
											</Button>
											<Button
												type="button"
												onClick={() => {
													if (selectedAmenity?.usageRules) {
														setBookingStep(3);
													} else {
														bookingForm.setValue("acceptedTerms", true);
														bookingForm.handleSubmit(handleBookingSubmit)();
													}
												}}
											>
												Próximo
											</Button>
										</div>
									</>
								)}
							</div>
						)}

						{/* Etapa 3: Instruções de Uso */}
						{bookingStep === 3 && (
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
									<Label htmlFor="acceptedTerms" className="text-sm font-normal cursor-pointer">
										Li e concordo com as instruções de uso
									</Label>
								</div>
								{bookingForm.formState.errors.acceptedTerms && (
									<p className="text-sm text-destructive">
										{bookingForm.formState.errors.acceptedTerms.message}
									</p>
								)}
								<div className="flex justify-between">
									<Button type="button" variant="outline" onClick={() => setBookingStep(3)}>
										Voltar
									</Button>
									<Button
										type="submit"
										disabled={!acceptedTerms || bookingForm.formState.isSubmitting}
									>
										{bookingForm.formState.isSubmitting ? "Criando..." : "Confirmar Reserva"}
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
						/>
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
						<DialogDescription>Informações completas sobre a comodidade</DialogDescription>
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
												? "Por Horas"
												: "Não definido"}
									</p>
								</div>
								{amenityToView.maxResidents && (
									<div>
										<Label className="text-muted-foreground">Máximo de Residentes</Label>
										<p className="text-sm font-medium mt-1">{amenityToView.maxResidents}</p>
									</div>
								)}
								{amenityToView.openingTime && amenityToView.closingTime && (
									<div>
										<Label className="text-muted-foreground">Horário de Funcionamento</Label>
										<p className="text-sm font-medium mt-1 flex items-center gap-1">
											<Clock className="w-4 h-4" />
											{amenityToView.openingTime} - {amenityToView.closingTime}
										</p>
									</div>
								)}
							</div>

							{amenityToView.value && amenityToView.value > 0 && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Valor</Label>
									<p className="text-2xl font-bold text-primary mt-1">
										R${" "}
										{amenityToView.value.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</p>
								</div>
							)}

							{(amenityToView.fineValue && amenityToView.fineValue > 0) ||
							(amenityToView.nonComplianceFine && amenityToView.nonComplianceFine > 0) ? (
								<div className="pt-2 border-t">
									<Accordion type="multiple" defaultValue={[]} className="w-full">
										{amenityToView.fineValue && amenityToView.fineValue > 0 && (
											<AccordionItem value="fineValue">
												<AccordionTrigger className="text-sm">
													<div className="flex items-center gap-1">
														<Label className="text-muted-foreground">Multa por Atraso</Label>
														<Popover>
															<PopoverTrigger asChild>
																<button
																	type="button"
																	className="inline-flex"
																	onClick={(e) => e.stopPropagation()}
																>
																	<Info className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
																</button>
															</PopoverTrigger>
															<PopoverContent className="w-80">
																<p className="text-sm">
																	Este valor só será cobrado caso você não devolva o espaço no
																	horário combinado. Se cumprir o horário, não haverá cobrança
																	adicional.
																</p>
															</PopoverContent>
														</Popover>
													</div>
												</AccordionTrigger>
												<AccordionContent>
													<p className="text-lg font-medium text-destructive">
														R${" "}
														{amenityToView.fineValue.toLocaleString("pt-BR", {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</p>
												</AccordionContent>
											</AccordionItem>
										)}

										{amenityToView.nonComplianceFine && amenityToView.nonComplianceFine > 0 && (
											<AccordionItem value="nonComplianceFine">
												<AccordionTrigger className="text-sm">
													<div className="flex items-center gap-1">
														<Label className="text-muted-foreground">
															Multa por Descumprimento de Normas
														</Label>
														<Popover>
															<PopoverTrigger asChild>
																<button
																	type="button"
																	className="inline-flex"
																	onClick={(e) => e.stopPropagation()}
																>
																	<Info className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
																</button>
															</PopoverTrigger>
															<PopoverContent className="w-80">
																<p className="text-sm">
																	Este valor só será cobrado caso as normas de uso da comodidade
																	sejam descumpridas. Seguindo as regras, não haverá cobrança
																	adicional.
																</p>
															</PopoverContent>
														</Popover>
													</div>
												</AccordionTrigger>
												<AccordionContent>
													<p className="text-lg font-medium text-destructive">
														R${" "}
														{amenityToView.nonComplianceFine.toLocaleString("pt-BR", {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</p>
												</AccordionContent>
											</AccordionItem>
										)}
									</Accordion>
								</div>
							) : null}

							{amenityToView.usageRules && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Normas de Uso</Label>
									<div
										className="text-sm mt-1 prose prose-sm max-w-none"
										dangerouslySetInnerHTML={{ __html: amenityToView.usageRules }}
									/>
								</div>
							)}

							{amenityToView.items && amenityToView.items.length > 0 && (
								<div className="pt-2 border-t">
									<Label className="text-muted-foreground">Itens Disponíveis</Label>
									<div className="mt-2 space-y-2">
										{amenityToView.items.map((item, index) => (
											<div
												key={index}
												className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
											>
												<span className="text-sm font-medium">{item.name}</span>
												<Badge variant="secondary" className="text-xs">
													{item.quantity}x
												</Badge>
											</div>
										))}
									</div>
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
