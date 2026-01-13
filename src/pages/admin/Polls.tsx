import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	getMinDateTimeForInput,
	isDateTimeAtLeast5MinutesInFuture,
	dateTimeLocalToISO,
} from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	BarChart3,
	Clock,
	Calendar,
	Users,
	Plus,
	X,
	CheckCircle2,
	Lock,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { pollSchema, type PollSchema, type PollOptionSchema } from "@/schemas/admin/polls.schema";
import PollsSkeleton from "@/skeleton/admin/PollsSkeleton";
import {
	pollsService,
	adminService,
	ApiClientError,
	type ActivePoll,
	type FinishedCancelledPoll,
} from "@/services/api";

const defaultOption: PollOptionSchema = {
	optionDescription: "",
	optionVotes: 0,
	optionPercente: 0,
};

export default function Polls() {
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [selectedPollToCancel, setSelectedPollToCancel] = useState<ActivePoll | null>(null);
	const [cancelReason, setCancelReason] = useState("");
	const [isCancelling, setIsCancelling] = useState(false);
	const [pollOptions, setPollOptions] = useState<PollOptionSchema[]>([
		{ ...defaultOption },
		{ ...defaultOption },
	]);
	const [buildingId, setBuildingId] = useState<string>("");
	const [activePolls, setActivePolls] = useState<ActivePoll[]>([]);
	const [closedPolls, setClosedPolls] = useState<FinishedCancelledPoll[]>([]);

	// Minimum datetime for inputs (5 minutes from now)
	const minDateTime = useMemo(() => getMinDateTimeForInput(), []);

	// Load buildingId on mount
	useEffect(() => {
		const loadBuildingId = async () => {
			try {
				const token =
					localStorage.getItem("coliseu_access_token") ||
					sessionStorage.getItem("coliseu_access_token");

				if (!token) {
					toast.error("Token não encontrado. Faça login novamente.");
					return;
				}

				try {
					const adminResponse = await adminService.getCurrentAdmin();
					if (adminResponse.success && adminResponse.data?.buildingId) {
						setBuildingId(adminResponse.data.buildingId);
					}
				} catch (error: any) {
					// Tentar decodificar o token JWT como fallback
					try {
						const tokenParts = token.split(".");
						if (tokenParts.length === 3) {
							const payload = JSON.parse(atob(tokenParts[1]));
							if (payload.buildingId) {
								setBuildingId(payload.buildingId);
							}
						}
					} catch (decodeError) {}
				}
			} catch (error: any) {
				console.error("Erro ao carregar buildingId:", error);
			}
		};
		loadBuildingId();
	}, []);

	// Load polls data
	useEffect(() => {
		const loadData = async () => {
			if (!buildingId || buildingId.trim() === "") {
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);

				// Load active polls (ATIVO and PROGRAMADO)
				const activeParams = {
					buildingId: buildingId.trim(),
					status: ["ATIVO", "PROGRAMADO"],
				};

				try {
					const activeResponse = await pollsService.getPolls(activeParams);

					if (activeResponse.success && activeResponse.data) {
						setActivePolls(Array.isArray(activeResponse.data) ? activeResponse.data : []);
					} else {
						setActivePolls([]);
					}
				} catch (activeError: any) {
					console.error("Erro ao carregar enquetes ativas:", activeError);
					if (activeError instanceof ApiClientError) {
						if (activeError.statusCode === 400 || activeError.statusCode === 404) {
							setActivePolls([]);
						} else if (activeError.statusCode === 500) {
							console.error("Erro interno do servidor ao carregar enquetes ativas");
							toast.error("Erro ao carregar enquetes. Tente novamente mais tarde.");
							setActivePolls([]);
						} else {
							toast.error("Erro ao carregar enquetes ativas");
							setActivePolls([]);
						}
					} else {
						setActivePolls([]);
					}
				}

				// Load finished/cancelled polls (FINALIZADO and CANCELADO)
				const finishedParams = {
					buildingId: buildingId.trim(),
					status: ["FINALIZADO", "CANCELADO"],
				};

				try {
					const finishedResponse = await pollsService.getPolls(finishedParams);

					if (finishedResponse.success && finishedResponse.data) {
						setClosedPolls(Array.isArray(finishedResponse.data) ? finishedResponse.data : []);
					} else {
						setClosedPolls([]);
					}
				} catch (finishedError: any) {
					console.error("Erro ao carregar enquetes finalizadas:", finishedError);
					if (finishedError instanceof ApiClientError) {
						if (finishedError.statusCode === 400 || finishedError.statusCode === 404) {
							setClosedPolls([]);
						} else if (finishedError.statusCode === 500) {
							console.error("Erro interno do servidor ao carregar enquetes finalizadas");
							setClosedPolls([]);
						} else {
							setClosedPolls([]);
						}
					} else {
						setClosedPolls([]);
					}
				}
			} catch (error: any) {
				console.error("Erro geral ao carregar enquetes:", error);
				setActivePolls([]);
				setClosedPolls([]);
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, [buildingId]);

	const form = useForm<PollSchema>({
		resolver: zodResolver(pollSchema),
		defaultValues: {
			question: "",
			options: [{ ...defaultOption }, { ...defaultOption }],
			startDate: "",
			endDate: "",
			status: "ATIVO",
		},
	});

	const handleAddOption = () => {
		if (pollOptions.length < 5) {
			const newOptions = [...pollOptions, { ...defaultOption }];
			setPollOptions(newOptions);
			// Sincronizar com o formulário
			form.setValue("options", newOptions);
		}
	};

	const handleRemoveOption = (index: number) => {
		if (pollOptions.length > 2) {
			const newOptions = pollOptions.filter((_, i) => i !== index);
			setPollOptions(newOptions);
			// Sincronizar com o formulário
			form.setValue("options", newOptions);
		}
	};

	const handleOptionChange = (index: number, value: string) => {
		const newOptions = [...pollOptions];
		newOptions[index] = {
			...newOptions[index],
			optionDescription: value,
			optionVotes: 0,
			optionPercente: 0,
		};
		setPollOptions(newOptions);
		// Sincronizar com o formulário
		form.setValue("options", newOptions);
	};

	const calculateTimeRemaining = (endDate: string) => {
		const end = new Date(endDate);
		const now = new Date();
		const diff = end.getTime() - now.getTime();

		if (diff <= 0) return "Encerrada";

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 24) {
			const days = Math.floor(hours / 24);
			return `${days} dia${days > 1 ? "s" : ""} restante${days > 1 ? "s" : ""}`;
		}

		return `${hours}h ${minutes}m restantes`;
	};

	const onSubmit = async (data: PollSchema) => {
		try {
			if (!buildingId) {
				toast.error("BuildingId não encontrado. Faça login novamente.");
				return;
			}

			// Validar opções - usar pollOptions do estado ou data.options do formulário
			const optionsToValidate = pollOptions.length > 0 ? pollOptions : data.options;
			const validOptions = optionsToValidate.filter(
				(opt) => opt.optionDescription && opt.optionDescription.trim() !== "",
			);

			if (validOptions.length < 2) {
				toast.error("A enquete deve ter no mínimo 2 opções preenchidas!");
				return;
			}

			// Validar data de início (deve ser pelo menos 5 minutos no futuro)
			if (!isDateTimeAtLeast5MinutesInFuture(data.startDate)) {
				toast.error("A data e hora de início deve ser pelo menos 5 minutos no futuro!");
				return;
			}

			// Validar data de fim (deve ser após a data de início)
			if (new Date(data.endDate) <= new Date(data.startDate)) {
				toast.error("A data/hora final deve ser posterior à data/hora de início!");
				return;
			}

			// Convert datetime-local to ISO format for the API
			const startDate = dateTimeLocalToISO(data.startDate);
			const endDate = dateTimeLocalToISO(data.endDate);

			// Prepare options array (just strings for the API)
			const optionsArray = validOptions.map((opt) => opt.optionDescription);

			// Create poll request
			const pollRequest = {
				buildingId,
				description: data.question,
				options: optionsArray,
				startDate: startDate,
				endDate: endDate,
			};

			const response = await pollsService.createPoll(pollRequest);

			if (response.success) {
				toast.success("Enquete agendada com sucesso!");
				form.reset({
					question: "",
					options: [{ ...defaultOption }, { ...defaultOption }],
					startDate: "",
					endDate: "",
					status: "ATIVO",
				});
				setPollOptions([{ ...defaultOption }, { ...defaultOption }]);
				setIsDialogOpen(false);

				// Reload polls data
				try {
					const activeParams = {
						buildingId,
						status: ["ATIVO", "PROGRAMADO"],
					};

					const activeResponse = await pollsService.getPolls(activeParams);
					if (activeResponse.success) {
						setActivePolls(activeResponse.data || []);
					} else {
						setActivePolls([]);
					}
				} catch (reloadError) {
					console.error("Erro ao recarregar enquetes:", reloadError);
					setActivePolls([]);
				}
			} else {
				toast.error(response.message || "Erro ao agendar enquete");
				console.error("API Error Response:", response);
			}
		} catch (error: any) {
			console.error("Erro completo ao criar enquete:", error);
			toast.error(error.message || "Erro ao agendar enquete");

			// Log mais detalhes do erro
			if (error.response) {
				console.error("Error response:", error.response);
			}
			if (error.request) {
				console.error("Error request:", error.request);
			}
		}
	};

	// Use polls directly without filtering
	const filteredActivePolls = activePolls;
	const filteredClosedPolls = closedPolls;

	// Função para obter o badge de status
	const getStatusBadge = (status: string) => {
		const statusUpper = status.toUpperCase();

		switch (statusUpper) {
			case "ATIVO":
				return { label: "Ativo", className: "bg-green-500 text-sm px-3 py-1" };
			case "PROGRAMADO":
				return {
					label: "Programada",
					className: "bg-blue-500 text-sm px-3 py-1",
				};
			case "CANCELADA":
			case "CANCELADO":
				return {
					label: "Cancelada",
					className: "bg-red-500 text-sm px-3 py-1",
				};
			case "FINALIZADA":
			case "FINALIZADO":
				return {
					label: "Finalizada",
					className: "bg-gray-500 text-sm px-3 py-1",
				};
			default:
				return { label: status, className: "bg-gray-500 text-sm px-3 py-1" };
		}
	};

	// Handle cancel poll
	const handleCancelPoll = (poll: ActivePoll) => {
		setSelectedPollToCancel(poll);
		setCancelReason("");
		setIsCancelDialogOpen(true);
	};

	const onCancelPoll = async () => {
		if (!selectedPollToCancel) return;

		const pollId = selectedPollToCancel.id || selectedPollToCancel._id;
		if (!pollId) {
			toast.error("ID da enquete não encontrado");
			return;
		}

		if (!cancelReason.trim()) {
			toast.error("Por favor, informe o motivo do cancelamento");
			return;
		}

		try {
			setIsCancelling(true);
			const response = await pollsService.cancelPoll(pollId, {
				cancelReason: cancelReason.trim(),
			});

			if (response.success) {
				toast.success("Enquete cancelada com sucesso!");
				setIsCancelDialogOpen(false);
				setSelectedPollToCancel(null);
				setCancelReason("");

				// Reload polls data
				try {
					const activeParams = {
						buildingId,
						status: ["ATIVO", "PROGRAMADO"],
					};

					const activeResponse = await pollsService.getPolls(activeParams);
					if (activeResponse.success) {
						setActivePolls(activeResponse.data || []);
					} else {
						setActivePolls([]);
					}

					const finishedParams = {
						buildingId,
						status: ["FINALIZADO", "CANCELADO"],
					};

					const finishedResponse = await pollsService.getPolls(finishedParams);
					if (finishedResponse.success) {
						setClosedPolls(finishedResponse.data || []);
					} else {
						setClosedPolls([]);
					}
				} catch (reloadError) {
					console.error("Erro ao recarregar enquetes:", reloadError);
				}
			} else {
				toast.error(response.message || "Erro ao cancelar enquete");
			}
		} catch (error: any) {
			console.error("Erro ao cancelar enquete:", error);
			toast.error(error.message || "Erro ao cancelar enquete");
		} finally {
			setIsCancelling(false);
		}
	};

	if (isLoading) {
		return <PollsSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Enquetes</h1>
					<p className="text-muted-foreground">Gerencie e acompanhe as enquetes do condomínio</p>
				</div>
			</div>

			<Tabs defaultValue="active" className="space-y-6">
				<TabsList>
					<TabsTrigger value="active">Enquetes Ativas</TabsTrigger>
					<TabsTrigger value="closed">Histórico</TabsTrigger>
					<TabsTrigger value="create">Criar Nova Enquete</TabsTrigger>
				</TabsList>

				{/* Aba de Enquetes Ativas */}
				<TabsContent value="active" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Total de Enquetes</p>
									<p className="text-4xl font-bold text-primary">{filteredActivePolls.length}</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Total de Votos</p>
									<p className="text-4xl font-bold text-accent">
										{filteredActivePolls.reduce((sum, poll) => sum + poll.votes, 0)}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Média de Votos</p>
									<p className="text-4xl font-bold text-muted-foreground">
										{filteredActivePolls.length > 0
											? Math.round(
													filteredActivePolls.reduce((sum, poll) => sum + poll.votes, 0) /
														filteredActivePolls.length,
												)
											: 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-4">
						{filteredActivePolls.length === 0 ? (
							<Card>
								<CardContent className="flex items-center justify-center h-32">
									<p className="text-muted-foreground">Nenhuma enquete ativa</p>
								</CardContent>
							</Card>
						) : (
							filteredActivePolls.map((poll, index) => (
								<Card key={`active-${index}`} className="border-2 border-primary/50 bg-primary/5">
									<CardHeader>
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="flex items-center gap-2">
													<BarChart3 className="w-5 h-5" />
													{poll.description}
												</CardTitle>
											</div>
											<Badge className={getStatusBadge(poll.status).className}>
												{getStatusBadge(poll.status).label}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
											<div className="flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												<span>
													Início:{" "}
													{new Date(poll.startDate).toLocaleString("pt-BR", {
														day: "2-digit",
														month: "2-digit",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Clock className="w-4 h-4" />
												<span>
													Fim:{" "}
													{new Date(poll.endDate).toLocaleString("pt-BR", {
														day: "2-digit",
														month: "2-digit",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Users className="w-4 h-4" />
												<span>{poll.votes} votos</span>
											</div>
										</div>
										<div className="text-sm text-muted-foreground">
											<span className="font-medium">{calculateTimeRemaining(poll.endDate)}</span>
										</div>

										<div className="space-y-3">
											{poll.options.map((option, idx) => (
												<div key={idx} className="space-y-1">
													<div className="flex justify-between text-sm">
														<span className="font-medium">{option.description}</span>
														<span className="text-muted-foreground">
															{option.votes} votos ({option.percent}%)
														</span>
													</div>
													<Progress value={option.percent} className="h-2" />
												</div>
											))}
										</div>

										{(poll.status.toUpperCase() === "ATIVO" ||
											poll.status.toUpperCase() === "PROGRAMADO") && (
											<div className="pt-2 border-t flex justify-center">
												<Button
													type="button"
													variant="destructive"
													size="sm"
													onClick={() => handleCancelPoll(poll)}
												>
													<XCircle className="w-4 h-4 mr-0" />
													Cancelar
												</Button>
											</div>
										)}
									</CardContent>
								</Card>
							))
						)}
					</div>
				</TabsContent>

				{/* Aba de Histórico */}
				<TabsContent value="closed" className="space-y-4">
					{filteredClosedPolls.length === 0 ? (
						<Card>
							<CardContent className="flex items-center justify-center h-32">
								<p className="text-muted-foreground">Nenhuma enquete encerrada</p>
							</CardContent>
						</Card>
					) : (
						filteredClosedPolls.map((poll, index) => (
							<Card key={`closed-${index}`}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="flex items-center gap-2">
												<CheckCircle2 className="w-5 h-5 text-primary" />
												{poll.description}
											</CardTitle>
											<p className="text-sm text-muted-foreground mt-2">
												{new Date(poll.startDate).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}{" "}
												até{" "}
												{new Date(poll.endDate).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
											{poll.cancelReason && (
												<p className="text-sm text-destructive mt-1">
													Cancelada: {poll.cancelReason}
												</p>
											)}
										</div>
										<Badge className={getStatusBadge(poll.status).className}>
											{getStatusBadge(poll.status).label}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-3">
										{poll.options.map((option, idx) => (
											<div key={idx} className="space-y-1">
												<div className="flex justify-between text-sm">
													<span className="font-medium">{option.description}</span>
													<span className="text-muted-foreground">
														{option.votes} votos ({option.percent}%)
													</span>
												</div>
												<Progress value={option.percent} className="h-2" />
											</div>
										))}
									</div>

									<div className="pt-2 border-t">
										<p className="text-sm text-muted-foreground">
											Participação: {poll.votes} votos
										</p>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</TabsContent>

				{/* Aba de Criação */}
				<TabsContent value="create">
					<Card>
						<CardHeader>
							<CardTitle>Criar Nova Enquete</CardTitle>
							<p className="text-sm text-muted-foreground">
								Configure uma nova enquete para votação dos condôminos
							</p>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={form.handleSubmit(onSubmit, (errors) => {
									console.error("Form validation errors:", errors);
									toast.error("Por favor, corrija os erros no formulário");
								})}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="question">Pergunta da Enquete</Label>
									<Input
										id="question"
										placeholder="Ex: Qual horário preferem para manutenção?"
										{...form.register("question")}
									/>
									{form.formState.errors.question && (
										<p className="text-sm text-destructive">
											{form.formState.errors.question.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label>Opções de Resposta</Label>
									{pollOptions.map((option, index) => (
										<div key={index} className="flex items-center gap-2">
											<Input
												placeholder={`Opção ${index + 1}`}
												value={option.optionDescription}
												onChange={(e) => handleOptionChange(index, e.target.value)}
											/>
											{pollOptions.length > 2 && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveOption(index)}
												>
													<X className="w-4 h-4" />
												</Button>
											)}
										</div>
									))}
									{pollOptions.length < 5 && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleAddOption}
											className="w-full"
										>
											<Plus className="w-4 h-4 mr-2" />
											Adicionar Opção
										</Button>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="startDate">Data e Hora de Início</Label>
										<Input
											id="startDate"
											type="datetime-local"
											min={minDateTime}
											{...form.register("startDate")}
										/>
										{form.formState.errors.startDate && (
											<p className="text-sm text-destructive">
												{form.formState.errors.startDate.message}
											</p>
										)}
										<p className="text-xs text-muted-foreground">
											Mínimo de 5 minutos a partir de agora
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="endDate">Data e Hora Final</Label>
										<Input
											id="endDate"
											type="datetime-local"
											min={form.watch("startDate") || minDateTime}
											{...form.register("endDate")}
										/>
										{form.formState.errors.endDate && (
											<p className="text-sm text-destructive">
												{form.formState.errors.endDate.message}
											</p>
										)}
										<p className="text-xs text-muted-foreground">
											Deve ser posterior à data/hora de início
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
										<BarChart3 className="w-4 h-4 mr-2" />
										{form.formState.isSubmitting ? "Agendando..." : "Agendar Enquete"}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											form.reset({
												question: "",
												options: [{ ...defaultOption }, { ...defaultOption }],
												startDate: "",
												endDate: "",
												status: "ATIVO",
											});
											setPollOptions([{ ...defaultOption }, { ...defaultOption }]);
										}}
										disabled={form.formState.isSubmitting}
									>
										Limpar
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialog de Cancelamento */}
			<Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancelar</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja cancelar esta enquete? Esta ação não pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{selectedPollToCancel && (
							<div className="p-3 bg-muted rounded-md">
								<p className="text-sm font-medium">{selectedPollToCancel.description}</p>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="cancelReason">Motivo do Cancelamento *</Label>
							<Textarea
								id="cancelReason"
								placeholder="Informe o motivo do cancelamento..."
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
								rows={4}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsCancelDialogOpen(false);
									setSelectedPollToCancel(null);
									setCancelReason("");
								}}
								disabled={isCancelling}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={onCancelPoll}
								disabled={isCancelling || !cancelReason.trim()}
							>
								{isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
