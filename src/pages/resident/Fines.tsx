import { useState, useEffect, useCallback } from "react";
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
import { usePageRefresh } from "@/hooks/use-page-refresh";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
	ResponsiveModalDescription,
	ResponsiveModalBody,
	ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

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

	const mapFines = useCallback((finesData: Fine[]): FineDisplay[] => {
		return finesData.map((fine: Fine) => {
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
	}, []);

	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			const finesData = await infractionsService.getMyFines();
			setFines(mapFines(finesData));
			} catch (error: any) {
				console.error("Erro ao carregar multas:", error);
				toast.error(error.message || "Erro ao carregar multas. Tente novamente.");
			} finally {
				setIsLoading(false);
			}
	}, [mapFines]);

	// Register refresh function for pull-to-refresh
	usePageRefresh({
		onRefresh: loadData,
		enabled: !isContestDialogOpen && !isPaymentDialogOpen && !isAppealDialogOpen,
	});

	useEffect(() => {
		loadData();
	}, [loadData]);

	const form = useForm<ContestFineSchema>({
		resolver: zodResolver(contestFineSchema),
		defaultValues: {
			description: "",
		},
	});

	// Separar multas ativas do histórico
	const activeFines = fines.filter((f) => f.status === "pending" || f.status === "contested");
	const closedFines = fines.filter((f) => f.status === "paid" || f.status === "cancelled");

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge variant="destructive" className="flex items-center gap-1 text-[10px] sm:text-xs">
						<Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
						Pendente
					</Badge>
				);
			case "contested":
				return (
					<Badge variant="secondary" className="flex items-center gap-1 text-[10px] sm:text-xs">
						<FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
						Em Análise
					</Badge>
				);
			case "paid":
				return (
					<Badge className="flex items-center gap-1 bg-green-600 text-[10px] sm:text-xs">
						<CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
						Paga
					</Badge>
				);
			case "cancelled":
				return (
					<Badge className="flex items-center gap-1 bg-gray-600 text-[10px] sm:text-xs">
						<XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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

	const handleOpenContestDialog = (fine: FineDisplay) => {
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

	const generateFakeQRCode = (fine: FineDisplay): string => {
		return `00020126580014BR.GOV.BCB.PIX0136${fine.id}5204000053039865802BR5913COLISEU CONDO6009SAO PAULO62290525${fine.value.toFixed(2)}6304`;
	};

	const onSubmitContest = async (data: ContestFineSchema) => {
		if (!selectedFine) return;

		try {
			if (!selectedFile) {
				toast.error("Por favor, selecione um arquivo para anexar à contestação");
				return;
			}

			const response = await infractionsService.contestInfraction(
				selectedFine.id,
				data.description,
				selectedFile.name,
				selectedFile.size,
				selectedFile.type,
			);

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

			toast.success("Contestação enviada com sucesso!");

			const finesData = await infractionsService.getMyFines();
			setFines(mapFines(finesData));

			handleCloseContestDialog();
		} catch (error: any) {
			toast.error(error.message || "Erro ao enviar contestação");
		}
	};

	if (isLoading) {
		return <FinesSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold">Minhas Multas</h1>
				<p className="text-sm sm:text-base text-muted-foreground">
					Visualize e gerencie as multas do seu apartamento
				</p>
			</div>

			{/* Active Fines - Cards responsivos */}
			<div className="space-y-3 sm:space-y-4">
				{activeFines.length === 0 ? (
					<Card>
						<CardContent className="flex items-center justify-center h-24 sm:h-32">
							<p className="text-sm sm:text-base text-muted-foreground">
								Nenhuma multa ativa no momento
							</p>
						</CardContent>
					</Card>
				) : (
					activeFines.map((fine) => (
						<Card key={fine.id} className="mobile-card overflow-hidden">
							<CardHeader className="pb-2 sm:pb-3">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
											<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive shrink-0" />
											<CardTitle className="text-base sm:text-lg truncate">
												{fine.title}
											</CardTitle>
											{getStatusBadge(fine.status)}
										</div>
										<p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
											{fine.description}
										</p>
										<div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground">
											<span>
												Emitida:{" "}
												{new Date(fine.issueDate).toLocaleDateString("pt-BR")}
											</span>
											{fine.relatedArea && (
												<span className="truncate">Área: {fine.relatedArea}</span>
											)}
										</div>
									</div>
									<div className="text-left sm:text-right shrink-0">
										<p className="text-xl sm:text-2xl font-bold text-destructive">
											R$ {fine.value.toLocaleString("pt-BR")}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								{fine.rejectedAt && (
									<div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
										<div className="flex items-start gap-2">
											<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
											<div className="flex-1 min-w-0">
												<p className="text-xs sm:text-sm font-medium text-red-900 dark:text-red-100">
													Contestação rejeitada
												</p>
												<p className="text-[10px] sm:text-xs text-red-700 dark:text-red-300 mt-1">
													Rejeitada em{" "}
													{new Date(fine.rejectedAt).toLocaleDateString("pt-BR")}
												</p>
											</div>
										</div>
									</div>
								)}
								<div className="flex flex-col sm:flex-row gap-2">
									{fine.status === "pending" && (
										<>
											<Button
												onClick={() => handlePayFine(fine)}
												className="bg-green-600 hover:bg-green-700 flex-1 h-9 sm:h-10 text-xs sm:text-sm"
											>
												<DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
												Pagar Multa
											</Button>
											{fine.canContest && (
												<Button 
													variant="outline" 
													onClick={() => handleOpenContestDialog(fine)}
													className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
												>
													<FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
													Contestar
												</Button>
											)}
										</>
									)}
									{fine.status === "contested" && (
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
											<div className="flex items-center gap-2 text-xs sm:text-sm text-amber-600">
												<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
												<span className="truncate">
													Contestação em{" "}
												{fine.contestedAt && new Date(fine.contestedAt).toLocaleDateString("pt-BR")}
												</span>
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewAppeal(fine.id)}
												disabled={isLoadingAppeal}
												className="h-8 sm:h-9 text-xs sm:text-sm shrink-0"
											>
												<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
												Ver Contestação
											</Button>
										</div>
									)}
									{fine.status === "paid" && (
										<div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
											<CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
											Paga em {fine.paidAt && new Date(fine.paidAt).toLocaleDateString("pt-BR")}
										</div>
									)}
									{fine.status === "cancelled" && (
										<div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2.5 sm:p-3 rounded-lg w-full">
											<XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
											<div className="min-w-0">
												<p className="font-medium">Multa cancelada</p>
												{fine.cancelReason && (
													<p className="text-[10px] sm:text-xs mt-1 truncate">
														{fine.cancelReason}
													</p>
												)}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Historical Fines - Colapsável */}
			<Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
				<Card>
					<CollapsibleTrigger asChild>
						<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 sm:py-4">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
									Histórico ({closedFines.length})
								</CardTitle>
								{isHistoryOpen ? (
									<ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
								) : (
									<ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
								)}
							</div>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className="space-y-3 sm:space-y-4 pt-0">
							{closedFines.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhuma multa no histórico
								</p>
							) : (
								closedFines.map((fine) => (
									<Card key={fine.id} className="border-muted">
										<CardHeader className="pb-2">
											<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1 flex-wrap">
														<AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0" />
														<CardTitle className="text-sm sm:text-base truncate">
															{fine.title}
														</CardTitle>
														{getStatusBadge(fine.status)}
													</div>
													<p className="text-xs text-muted-foreground line-clamp-1">
														{fine.description}
													</p>
												</div>
												<div className="text-left sm:text-right shrink-0">
													<p className="text-lg sm:text-xl font-bold text-muted-foreground">
														R$ {fine.value.toLocaleString("pt-BR")}
													</p>
												</div>
											</div>
										</CardHeader>
										<CardContent className="pt-0">
											{fine.status === "paid" && (
												<div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
													<CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
													Paga em {fine.paidAt && new Date(fine.paidAt).toLocaleDateString("pt-BR")}
												</div>
											)}
											{fine.status === "cancelled" && (
												<div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg">
													<XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
													<div className="min-w-0">
														<p className="font-medium">
															Cancelada em{" "}
															{fine.cancelledAt && new Date(fine.cancelledAt).toLocaleDateString("pt-BR")}
														</p>
														{fine.cancelReason && (
															<p className="text-[10px] sm:text-xs mt-1 truncate">
																{fine.cancelReason}
															</p>
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

			{/* Contest Dialog - Responsivo */}
			<ResponsiveModal open={isContestDialogOpen} onOpenChange={handleCloseContestDialog}>
				<ResponsiveModalContent>
					<ResponsiveModalHeader>
						<ResponsiveModalTitle className="flex items-center gap-2 text-amber-600">
							<FileText className="w-5 h-5" />
							Contestar Multa
						</ResponsiveModalTitle>
						<ResponsiveModalDescription>
							Descreva os motivos da sua contestação.
						</ResponsiveModalDescription>
					</ResponsiveModalHeader>

					{selectedFine && (
						<ResponsiveModalBody>
						<div className="space-y-4">
							{/* Fine Info */}
								<div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
									<h3 className="font-semibold text-xs sm:text-sm text-destructive mb-1">
									Multa a ser contestada
								</h3>
									<p className="font-medium text-sm sm:text-base">{selectedFine.title}</p>
									<p className="text-xl sm:text-2xl font-bold text-destructive mt-2">
									R$ {selectedFine.value.toLocaleString("pt-BR")}
								</p>
							</div>

							<form onSubmit={form.handleSubmit(onSubmitContest)} className="space-y-4">
								<div className="space-y-2">
										<Label htmlFor="description" className="text-sm">
											Descrição da Contestação *
										</Label>
									<Textarea
										id="description"
											placeholder="Explique detalhadamente por que você está contestando..."
											rows={4}
										{...form.register("description")}
											className="text-base"
									/>
									{form.formState.errors.description && (
											<p className="text-xs sm:text-sm text-destructive">
											{form.formState.errors.description.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
										<Label htmlFor="attachment" className="text-sm">
											Anexos *
										</Label>
									<p className="text-xs text-muted-foreground">
											Adicione fotos ou documentos
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
												className="flex-1 h-10 text-sm"
										>
											<Upload className="w-4 h-4 mr-2" />
												<span className="truncate">
											{selectedFile ? selectedFile.name : "Selecionar arquivo"}
												</span>
										</Button>
										{selectedFile && (
												<Button 
													type="button" 
													variant="ghost" 
													size="icon" 
													onClick={handleRemoveFile}
													className="shrink-0"
												>
												<X className="w-4 h-4" />
											</Button>
										)}
									</div>
								</div>

									<ResponsiveModalFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-4 pt-4 border-t">
									<Button
										type="button"
										variant="outline"
										onClick={handleCloseContestDialog}
										disabled={form.formState.isSubmitting}
											className="w-full sm:w-auto"
									>
										Cancelar
									</Button>
										<Button 
											type="submit" 
											className="w-full sm:flex-1" 
											disabled={form.formState.isSubmitting}
										>
											{form.formState.isSubmitting ? "Enviando..." : "Enviar Contestação"}
										</Button>
									</ResponsiveModalFooter>
							</form>
						</div>
						</ResponsiveModalBody>
					)}
				</ResponsiveModalContent>
			</ResponsiveModal>

			{/* Payment Dialog - Responsivo */}
			<ResponsiveModal
				open={isPaymentDialogOpen}
				onOpenChange={(open) => {
					setIsPaymentDialogOpen(open);
					if (!open) setFineToPay(null);
				}}
			>
				<ResponsiveModalContent>
					<ResponsiveModalHeader>
						<ResponsiveModalTitle className="flex items-center gap-2">
							<QrCode className="w-5 h-5" />
							Pagamento via PIX
						</ResponsiveModalTitle>
						<ResponsiveModalDescription>
							Escaneie o QR code para pagar
						</ResponsiveModalDescription>
					</ResponsiveModalHeader>
					{fineToPay ? (
						<ResponsiveModalBody>
						<div className="space-y-4">
							{/* QR Code */}
							<div className="flex flex-col items-center gap-3">
									<div className="flex items-center justify-center p-4 bg-white rounded-lg border-2 border-dashed border-primary/20 w-full max-w-[240px] sm:max-w-[280px] mx-auto">
									<div className="flex flex-col items-center gap-2 w-full">
											<QrCode className="w-32 h-32 sm:w-40 sm:h-40 text-primary" />
											<p className="text-[10px] sm:text-xs text-muted-foreground text-center break-all px-2">
											{generateFakeQRCode(fineToPay)}
										</p>
										</div>
									</div>
							</div>

							{/* Informações do Pagamento */}
								<div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
								<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Valor</span>
										<span className="text-lg sm:text-xl font-bold text-primary">
										R${" "}
										{fineToPay.value.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
										})}
									</span>
								</div>
									<div className="flex justify-between items-center pt-2 border-t text-xs sm:text-sm">
										<span className="text-muted-foreground">Multa</span>
										<span className="font-medium text-right max-w-[60%] truncate">
										{fineToPay.title}
									</span>
								</div>
							</div>

							{/* Instruções */}
							<div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
									<p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
										Como pagar:
									</p>
									<ol className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
									<li>Abra o app do seu banco</li>
									<li>Escolha a opção PIX</li>
										<li>Escaneie o QR code</li>
									<li>Confirme o pagamento</li>
								</ol>
							</div>

							<Button variant="outline" onClick={handleClosePaymentDialog} className="w-full">
								Fechar
							</Button>
						</div>
						</ResponsiveModalBody>
					) : (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					)}
				</ResponsiveModalContent>
			</ResponsiveModal>

			{/* Appeal View Dialog - Responsivo */}
			<ResponsiveModal open={isAppealDialogOpen} onOpenChange={handleCloseAppealDialog}>
				<ResponsiveModalContent>
					<ResponsiveModalHeader>
						<ResponsiveModalTitle className="flex items-center gap-2 text-amber-600">
							<Eye className="w-5 h-5" />
							Contestação
						</ResponsiveModalTitle>
						<ResponsiveModalDescription>
							Detalhes da contestação enviada
						</ResponsiveModalDescription>
					</ResponsiveModalHeader>

					{appealData ? (
						<ResponsiveModalBody>
						<div className="space-y-4">
							{/* Data da Contestação */}
							<div className="p-3 bg-muted rounded-lg">
									<p className="text-xs sm:text-sm text-muted-foreground">
										Enviada em{" "}
									{new Date(appealData.createdAt).toLocaleString("pt-BR", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>

								{/* Texto */}
							<div className="space-y-2">
									<Label className="text-sm">Descrição</Label>
									<div className="p-3 sm:p-4 bg-muted rounded-lg border min-h-[100px] sm:min-h-[150px]">
										<p className="text-xs sm:text-sm whitespace-pre-wrap">
											{appealData.text}
										</p>
								</div>
							</div>

								{/* Arquivo */}
							<div className="space-y-2">
									<Label className="text-sm">Arquivo Anexado</Label>
									<div className="p-3 sm:p-4 bg-muted rounded-lg border">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
												<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
											<div className="flex-1 min-w-0">
													<p className="text-xs sm:text-sm font-medium truncate">
														{appealData.fileName}
													</p>
													<p className="text-[10px] sm:text-xs text-muted-foreground">
													{(appealData.fileSize / 1024).toFixed(2)} KB
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											asChild
												className="h-8 sm:h-9 text-xs sm:text-sm shrink-0"
										>
											<a href={appealData.url} target="_blank" rel="noopener noreferrer">
													<Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
													Abrir
											</a>
										</Button>
									</div>
								</div>
							</div>

							<Button variant="outline" onClick={handleCloseAppealDialog} className="w-full">
								Fechar
							</Button>
						</div>
						</ResponsiveModalBody>
					) : (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					)}
				</ResponsiveModalContent>
			</ResponsiveModal>
		</div>
	);
}
