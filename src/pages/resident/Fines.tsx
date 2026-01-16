import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertTriangle,
	DollarSign,
	FileText,
	Upload,
	X,
	CheckCircle2,
	Clock,
	XCircle,
	ChevronDown,
	ChevronUp,
	QrCode,
	Eye,
	Download,
} from "lucide-react";
import { toast } from "sonner";
import { contestFineSchema, type ContestFineSchema } from "@/schemas/resident/fines.schema";
import FinesSkeleton from "@/skeleton/resident/FinesSkeleton";
import { infractionsService, type Fine } from "@/services/api/infractions.service";

interface FineDisplay {
	id: string;
	title: string;
	description: string;
	value: number;
	issueDate: string;
	dueDate?: string;
	status: "pending" | "contested" | "paid" | "cancelled";
	relatedArea?: string;
	canContest: boolean;
	contestedAt?: string;
	rejectedAt?: string;
	paidAt?: string;
	cancelledAt?: string;
	cancelReason?: string;
}

export default function Fines() {
	const [isLoading, setIsLoading] = useState(true);
	const [isContestDialogOpen, setIsContestDialogOpen] = useState(false);
	const [selectedFine, setSelectedFine] = useState<FineDisplay | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [fines, setFines] = useState<FineDisplay[]>([]);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [fineToPay, setFineToPay] = useState<FineDisplay | null>(null);
	const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
	const [appealData, setAppealData] = useState<{
		text: string;
		fileName: string;
		fileSize: number;
		url: string;
		createdAt: string;
	} | null>(null);
	const [isLoadingAppeal, setIsLoadingAppeal] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				const finesData = await infractionsService.getMyFines();

				// Mapear dados da API para o formato da UI
				const mappedFines: FineDisplay[] = finesData.map((fine: Fine) => {
					// Mapear status da API para status da UI
					let status: "pending" | "contested" | "paid" | "cancelled";
					switch (fine.status) {
						case "EM_REVISAO":
							status = "contested";
							break;
						case "PENDENTE":
							status = "pending";
							break;
						case "PAGO":
							status = "paid";
							break;
						case "CANCELADA":
							status = "cancelled";
							break;
						default:
							status = "pending";
					}

					// Verificar se a contestação foi rejeitada (status PENDENTE mas tem confirmedAt e contextedAt)
					const wasAppealRejected =
						fine.status === "PENDENTE" && fine.confirmedAt && fine.contextedAt;

					return {
						id: fine._id,
						title: fine.fineName || fine.description || "Multa sem descrição",
						description: fine.fineDescription || fine.description || "",
						value: fine.value,
						issueDate: fine.occurrenceDate || fine.createdAt,
						status,
						canContest: status === "pending" && !wasAppealRejected,
						contestedAt: status === "contested" ? fine.contextedAt : undefined,
						rejectedAt: wasAppealRejected ? fine.confirmedAt : undefined,
						paidAt: fine.paidAt,
						cancelledAt: fine.canceledAt,
						cancelReason: fine.canceledNote,
					};
				});

				setFines(mappedFines);
			} catch (error: any) {
				console.error("Erro ao carregar multas:", error);
				toast.error(error.message || "Erro ao carregar multas. Tente novamente.");
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

	const form = useForm<ContestFineSchema>({
		resolver: zodResolver(contestFineSchema),
		defaultValues: {
			description: "",
		},
	});

	// Separar multas ativas (EM_REVISAO e PENDENTE) do histórico (CANCELADA e PAGO)
	const activeFines = fines.filter((f) => f.status === "pending" || f.status === "contested");
	const closedFines = fines.filter((f) => f.status === "paid" || f.status === "cancelled");

	const pendingFines = fines.filter((f) => f.status === "pending");
	const totalPending = pendingFines.reduce((sum, f) => sum + f.value, 0);
	const contestedFines = fines.filter((f) => f.status === "contested").length;

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge variant="destructive" className="flex items-center gap-1">
						<Clock className="w-3 h-3" />
						Pendente
					</Badge>
				);
			case "contested":
				return (
					<Badge variant="secondary" className="flex items-center gap-1">
						<FileText className="w-3 h-3" />
						Em Análise
					</Badge>
				);
			case "paid":
				return (
					<Badge className="flex items-center gap-1 bg-green-600">
						<CheckCircle2 className="w-3 h-3" />
						Paga
					</Badge>
				);
			case "cancelled":
				return (
					<Badge className="flex items-center gap-1 bg-gray-600">
						<XCircle className="w-3 h-3" />
						Cancelada
					</Badge>
				);
			default:
				return null;
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(null);
		form.setValue("attachmentFile", undefined);
	};

	const handleOpenContestDialog = (fine: any) => {
		setSelectedFine(fine);
		setIsContestDialogOpen(true);
	};

	const handleCloseContestDialog = () => {
		setIsContestDialogOpen(false);
		setSelectedFine(null);
		setSelectedFile(null);
		form.reset();
	};

	const handlePayFine = (fine: FineDisplay) => {
		setFineToPay(fine);
		setIsPaymentDialogOpen(true);
	};

	const handleClosePaymentDialog = () => {
		setIsPaymentDialogOpen(false);
		setFineToPay(null);
	};

	const handleViewAppeal = async (fineId: string) => {
		try {
			setIsLoadingAppeal(true);
			const appeal = await infractionsService.getInfractionAppeal(fineId);
			setAppealData({
				text: appeal.text,
				fileName: appeal.fileName,
				fileSize: appeal.fileSize,
				url: appeal.url,
				createdAt: appeal.createdAt,
			});
			setIsAppealDialogOpen(true);
		} catch (error: any) {
			toast.error(error.message || "Erro ao carregar contestação");
		} finally {
			setIsLoadingAppeal(false);
		}
	};

	const handleCloseAppealDialog = () => {
		setIsAppealDialogOpen(false);
		setAppealData(null);
	};

	// Gerar QR code fake (similar ao das reservas)
	const generateFakeQRCode = (fine: FineDisplay): string => {
		// QR code fake no formato de chave PIX
		return `00020126580014BR.GOV.BCB.PIX0136${fine.id}5204000053039865802BR5913COLISEU CONDO6009SAO PAULO62290525${fine.value.toFixed(2)}6304`;
	};

	const onSubmitContest = async (data: ContestFineSchema) => {
		if (!selectedFine) return;

		try {
			if (!selectedFile) {
				toast.error("Por favor, selecione um arquivo para anexar à contestação");
				return;
			}

			// Chamar API para criar contestação e receber presigned URL
			const response = await infractionsService.contestInfraction(
				selectedFine.id,
				data.description,
				selectedFile.name,
				selectedFile.size,
				selectedFile.type,
			);

			// Fazer upload do arquivo para S3 usando presigned URL
			const uploadResponse = await fetch(response.presignedUrl, {
				method: "PUT",
				body: selectedFile,
				headers: {
					"Content-Type": selectedFile.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Falha ao fazer upload do arquivo");
			}

			toast.success("Contestação enviada com sucesso! Aguarde a análise da administração.");

			// Recarregar lista de multas
			const finesData = await infractionsService.getMyFines();
			const mappedFines: FineDisplay[] = finesData.map((fine: Fine) => {
				let status: "pending" | "contested" | "paid" | "cancelled";
				switch (fine.status) {
					case "EM_REVISAO":
						status = "contested";
						break;
					case "PENDENTE":
						status = "pending";
						break;
					case "PAGO":
						status = "paid";
						break;
					case "CANCELADA":
						status = "cancelled";
						break;
					default:
						status = "pending";
				}

				// Verificar se a contestação foi rejeitada (status PENDENTE mas tem confirmedAt e contextedAt)
				const wasAppealRejected =
					fine.status === "PENDENTE" && fine.confirmedAt && fine.contextedAt;

				return {
					id: fine._id,
					title: fine.fineName || fine.description || "Multa sem descrição",
					description: fine.fineDescription || fine.description || "",
					value: fine.value,
					issueDate: fine.occurrenceDate,
					status,
					canContest: status === "pending" && !wasAppealRejected,
					contestedAt: status === "contested" ? fine.contextedAt : undefined,
					rejectedAt: wasAppealRejected ? fine.confirmedAt : undefined,
					paidAt: fine.paidAt,
					cancelledAt: fine.canceledAt,
					cancelReason: fine.canceledNote,
				};
			});
			setFines(mappedFines);

			handleCloseContestDialog();
		} catch (error: any) {
			toast.error(error.message || "Erro ao enviar contestação");
		}
	};

	if (isLoading) {
		return <FinesSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Minhas Multas</h1>
				<p className="text-muted-foreground">Visualize e gerencie as multas do seu apartamento</p>
			</div>

			{/* Active Fines - Pendentes e Em Análise */}
			<div className="space-y-4">
				{activeFines.length === 0 ? (
					<Card>
						<CardContent className="flex items-center justify-center h-32">
							<p className="text-muted-foreground">Nenhuma multa ativa no momento</p>
						</CardContent>
					</Card>
				) : (
					activeFines.map((fine) => (
						<Card key={fine.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<AlertTriangle className="w-5 h-5 text-destructive" />
											<CardTitle>{fine.title}</CardTitle>
											{getStatusBadge(fine.status)}
										</div>
										<p className="text-sm text-muted-foreground">{fine.description}</p>
										<div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
											<span>
												Emitida em:{" "}
												{new Date(fine.issueDate).toLocaleDateString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
											{fine.relatedArea && <span>Área: {fine.relatedArea}</span>}
										</div>
									</div>
									<div className="text-right">
										<p className="text-2xl font-bold text-destructive">
											R$ {fine.value.toLocaleString("pt-BR")}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{fine.rejectedAt && (
									<div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
										<div className="flex items-start gap-2">
											<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
											<div className="flex-1">
												<p className="text-sm font-medium text-red-900 dark:text-red-100">
													Contestação rejeitada
												</p>
												<p className="text-xs text-red-700 dark:text-red-300 mt-1">
													Sua contestação foi rejeitada em{" "}
													{new Date(fine.rejectedAt).toLocaleDateString("pt-BR", {
														day: "2-digit",
														month: "2-digit",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
													. Esta multa não pode ser contestada novamente.
												</p>
											</div>
										</div>
									</div>
								)}
								<div className="flex gap-2">
									{fine.status === "pending" && (
										<>
											<Button
												onClick={() => handlePayFine(fine)}
												className="bg-green-600 hover:bg-green-700"
											>
												<DollarSign className="w-4 h-4 mr-2" />
												Pagar Multa
											</Button>
											{fine.canContest && (
												<Button variant="outline" onClick={() => handleOpenContestDialog(fine)}>
													<FileText className="w-4 h-4 mr-2" />
													Contestar
												</Button>
											)}
										</>
									)}
									{fine.status === "contested" && (
										<div className="flex items-center justify-between gap-4 w-full">
											<div className="flex items-center gap-2 text-sm text-amber-600">
												<Clock className="w-4 h-4" />
												Contestação enviada em{" "}
												{fine.contestedAt && new Date(fine.contestedAt).toLocaleDateString("pt-BR")}
												. Aguardando análise.
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewAppeal(fine.id)}
												disabled={isLoadingAppeal}
											>
												<Eye className="w-4 h-4 mr-2" />
												Ver Contestação
											</Button>
										</div>
									)}
									{fine.status === "paid" && (
										<div className="flex items-center gap-2 text-sm text-green-600">
											<CheckCircle2 className="w-4 h-4" />
											Paga em {fine.paidAt && new Date(fine.paidAt).toLocaleDateString("pt-BR")}
										</div>
									)}
									{fine.status === "cancelled" && (
										<div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
											<XCircle className="w-4 h-4 mt-0.5" />
											<div>
												<p className="font-medium">Multa cancelada</p>
												{fine.cancelReason && <p className="text-xs mt-1">{fine.cancelReason}</p>}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Historical Fines - Pagas e Canceladas (Colapsável) */}
			<Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
				<Card>
					<CollapsibleTrigger asChild>
						<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									Histórico de Multas ({closedFines.length})
								</CardTitle>
								{isHistoryOpen ? (
									<ChevronUp className="w-5 h-5" />
								) : (
									<ChevronDown className="w-5 h-5" />
								)}
							</div>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className="space-y-4 pt-0">
							{closedFines.length === 0 ? (
								<p className="text-muted-foreground text-center py-4">Nenhuma multa no histórico</p>
							) : (
								closedFines.map((fine) => (
									<Card key={fine.id} className="border-muted">
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<AlertTriangle className="w-5 h-5 text-muted-foreground" />
														<CardTitle className="text-lg">{fine.title}</CardTitle>
														{getStatusBadge(fine.status)}
													</div>
													<p className="text-sm text-muted-foreground">{fine.description}</p>
													<div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
														<span>
															Emitida em:{" "}
															{new Date(fine.issueDate).toLocaleDateString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															})}
														</span>
														{fine.relatedArea && <span>Área: {fine.relatedArea}</span>}
													</div>
												</div>
												<div className="text-right">
													<p className="text-xl font-bold text-muted-foreground">
														R$ {fine.value.toLocaleString("pt-BR")}
													</p>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											{fine.status === "paid" && (
												<div className="flex items-center gap-2 text-sm text-green-600">
													<CheckCircle2 className="w-4 h-4" />
													Paga em {fine.paidAt && new Date(fine.paidAt).toLocaleDateString("pt-BR")}
												</div>
											)}
											{fine.status === "cancelled" && (
												<div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
													<XCircle className="w-4 h-4 mt-0.5" />
													<div>
														<p className="font-medium">
															Cancelada em{" "}
															{fine.cancelledAt &&
																new Date(fine.cancelledAt).toLocaleDateString("pt-BR")}
														</p>
														{fine.cancelReason && (
															<p className="text-xs mt-1">{fine.cancelReason}</p>
														)}
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								))
							)}
						</CardContent>
					</CollapsibleContent>
				</Card>
			</Collapsible>

			{/* Contest Dialog */}
			<Dialog open={isContestDialogOpen} onOpenChange={handleCloseContestDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-amber-600">
							<FileText className="w-5 h-5" />
							Contestar Multa
						</DialogTitle>
						<DialogDescription>
							Descreva os motivos da sua contestação. A administração analisará seu pedido.
						</DialogDescription>
					</DialogHeader>

					{selectedFine && (
						<div className="space-y-4">
							{/* Fine Info */}
							<div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
								<h3 className="font-semibold text-sm text-destructive mb-1">
									Multa a ser contestada
								</h3>
								<p className="font-medium">{selectedFine.title}</p>
								<p className="text-2xl font-bold text-destructive mt-2">
									R$ {selectedFine.value.toLocaleString("pt-BR")}
								</p>
							</div>

							<form onSubmit={form.handleSubmit(onSubmitContest)} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="description">Descrição da Contestação *</Label>
									<Textarea
										id="description"
										placeholder="Explique detalhadamente por que você está contestando esta multa..."
										rows={6}
										{...form.register("description")}
									/>
									{form.formState.errors.description && (
										<p className="text-sm text-destructive">
											{form.formState.errors.description.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="attachment">Anexos (Opcional)</Label>
									<p className="text-xs text-muted-foreground">
										Adicione fotos, documentos ou outros comprovantes que apoiem sua contestação
									</p>
									<div className="flex items-center gap-2">
										<Input
											id="attachment"
											type="file"
											onChange={handleFileChange}
											className="hidden"
											accept="image/*,.pdf,.doc,.docx"
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() => document.getElementById("attachment")?.click()}
											className="flex-1"
										>
											<Upload className="w-4 h-4 mr-2" />
											{selectedFile ? selectedFile.name : "Selecionar arquivo"}
										</Button>
										{selectedFile && (
											<Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
												<X className="w-4 h-4" />
											</Button>
										)}
									</div>
								</div>

								<div className="flex gap-4 pt-4 border-t">
									<Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
										{form.formState.isSubmitting ? "Enviando..." : "Enviar Contestação"}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={handleCloseContestDialog}
										disabled={form.formState.isSubmitting}
									>
										Cancelar
									</Button>
								</div>
							</form>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de Pagamento com QR Code PIX */}
			<Dialog
				open={isPaymentDialogOpen}
				onOpenChange={(open) => {
					setIsPaymentDialogOpen(open);
					if (!open) {
						setFineToPay(null);
					}
				}}
			>
				<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<QrCode className="w-5 h-5" />
							Pagamento via PIX
						</DialogTitle>
						<DialogDescription>
							Escaneie o QR code com o aplicativo do seu banco para realizar o pagamento
						</DialogDescription>
					</DialogHeader>
					{fineToPay ? (
						<div className="space-y-4">
							{/* QR Code */}
							<div className="flex flex-col items-center gap-3">
								<div className="flex items-center justify-center p-4 bg-white rounded-lg border-2 border-dashed border-primary/20 w-full max-w-[280px] mx-auto">
									<div className="flex flex-col items-center gap-2 w-full">
										<QrCode className="w-40 h-40 text-primary flex-shrink-0" />
										<p className="text-xs text-muted-foreground text-center break-all px-2">
											{generateFakeQRCode(fineToPay)}
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
										R${" "}
										{fineToPay.value.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
								<div className="flex justify-between items-center pt-2 border-t">
									<span className="text-sm text-muted-foreground">Multa</span>
									<span className="text-sm font-medium text-right max-w-[60%] truncate">
										{fineToPay.title}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Data de emissão</span>
									<span className="text-sm font-medium">
										{new Date(fineToPay.issueDate).toLocaleDateString("pt-BR")}
									</span>
								</div>
								<div className="flex justify-between items-center pt-2 border-t">
									<span className="text-xs text-muted-foreground">QR Code válido até</span>
									<span className="text-xs font-medium text-destructive text-right">
										{new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString("pt-BR", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
							</div>

							{/* Instruções */}
							<div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
								<p className="text-sm font-medium text-blue-900 dark:text-blue-100">Como pagar:</p>
								<ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
									<li>Abra o app do seu banco</li>
									<li>Escolha a opção PIX</li>
									<li>Escaneie o QR code acima</li>
									<li>Confirme o pagamento</li>
								</ol>
							</div>

							{/* Botão de fechar */}
							<Button variant="outline" onClick={handleClosePaymentDialog} className="w-full">
								Fechar
							</Button>
						</div>
					) : (
						<div className="flex items-center justify-center py-8">
							<p className="text-sm text-muted-foreground">Carregando informações...</p>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de Visualização de Contestação */}
			<Dialog open={isAppealDialogOpen} onOpenChange={handleCloseAppealDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-amber-600">
							<Eye className="w-5 h-5" />
							Contestação
						</DialogTitle>
						<DialogDescription>Detalhes da contestação enviada</DialogDescription>
					</DialogHeader>

					{appealData ? (
						<div className="space-y-4">
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

							{/* Botão de fechar */}
							<Button variant="outline" onClick={handleCloseAppealDialog} className="w-full">
								Fechar
							</Button>
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
