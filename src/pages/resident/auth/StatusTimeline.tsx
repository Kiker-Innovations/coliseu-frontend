import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { CameraCapture } from "@/components/ui/camera-capture";
import {
	CheckCircle2,
	Circle,
	Clock,
	User,
	Home,
	ArrowLeft,
	Mail,
	XCircle,
	Save,
	Camera,
	Eye,
	EyeOff,
} from "lucide-react";
import coliseuIcon from "@/assets/coliseu-icon.png";
import { toast } from "sonner";
import { apiClient } from "@/services/api/client";
import { buildingsService, type Building } from "@/services/api/buildings.service";
import { apartmentsService, type Apartment } from "@/services/api";
import InputMask from "react-input-mask";
import { BR } from "country-flag-icons/react/3x2";
import { residentsService, ApiClientError } from "@/services/api";

interface ResidentStatusData {
	name: string;
	email: string;
	apartmentNumber?: string;
	apartmentBlock?: string;
	status: string;
	rejectType?: string;
	rejectNote?: string;
	buildingId?: string;
	apartmentId?: string;
	document?: string;
}

const rejectTypeLabels: Record<string, string> = {
	DADOS_INCONSISTENTES: "Dados Inconsistentes",
	DOCUMENTO_INVALIDO: "Documento Inválido",
	INFORMACOES_INCOMPLETAS: "Informações Incompletas",
	NAO_PERTENCE_AO_CONDOMINIO: "Não Pertence ao Condomínio",
	OUTRO: "Outro",
};

const statusSteps = [
	{
		id: "email",
		title: "Confirmar e-mail",
		description: "Verifique sua caixa de entrada e confirme seu e-mail",
		status: "A_CONFIRMACAO_EMAIL",
	},
	{
		id: "validation",
		title: "Aguardando confirmação do administrador",
		description: "Seu cadastro está aguardando aprovação do administrador",
		status: "A_VALIDACAO",
	},
	{
		id: "active",
		title: "Conta ativa",
		description: "Sua conta foi ativada e você pode fazer login",
		status: "ATIVO",
	},
];

export default function StatusTimeline() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const email = searchParams.get("email");
	const [residentData, setResidentData] = useState<ResidentStatusData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [resendTimer, setResendTimer] = useState(0);
	const [isResending, setIsResending] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		phone: "",
		document: "",
		buildingId: "",
		apartmentId: "",
	});
	const [isSaving, setIsSaving] = useState(false);
	const [buildings, setBuildings] = useState<Building[]>([]);
	const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
	const [apartments, setApartments] = useState<Apartment[]>([]);
	const [isLoadingApartments, setIsLoadingApartments] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
	const [confirmationCode, setConfirmationCode] = useState("");
	const [isConfirmingCode, setIsConfirmingCode] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(() => {
		// Carregar dados quando o componente montar (já validado pelo ProtectedStatusRoute)
		if (!email) {
			return;
		}

		const fetchResidentData = async () => {
			try {
				setIsLoading(true);
				const response = await apiClient.get<ResidentStatusData>(
					`/v1/residents/status?email=${encodeURIComponent(email)}`,
				);

				if (response.success && response.data) {
					setResidentData(response.data);
					// Preencher formulário com dados atuais
					setFormData({
						name: response.data.name || "",
						email: response.data.email || "",
						password: "",
						confirmPassword: "",
						phone: "",
						document: response.data.document || "",
						buildingId: response.data.buildingId || "",
						apartmentId: response.data.apartmentId || "",
					});

					// Carregar prédios e apartamentos
					await loadBuildings();
					if (response.data.buildingId) {
						await loadApartments(response.data.buildingId);
					}
				} else {
					toast.error("Não foi possível carregar os dados");
				}
			} catch (error: any) {
				console.error("Erro ao buscar dados do resident:", error);
				const errorMessage =
					error?.response?.message || error?.message || "Erro ao carregar informações";
				toast.error(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResidentData();
	}, [email]);

	// Timer para reenvio de email
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => {
				setResendTimer(resendTimer - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	const handleResendEmail = async () => {
		if (!email || resendTimer > 0) return;

		try {
			setIsResending(true);
			const response = await apiClient.post<null>("/v1/residents/resend-confirmation-email", {
				email,
			});

			if (response.success) {
				toast.success("Email de confirmação reenviado com sucesso!");
				setResendTimer(60); // 60 segundos de cooldown
			} else {
				toast.error("Erro ao reenviar email");
			}
		} catch (error: any) {
			console.error("Erro ao reenviar email:", error);
			const errorMessage = error?.response?.message || error?.message || "Erro ao reenviar email";
			toast.error(errorMessage);
		} finally {
			setIsResending(false);
		}
	};

	const handleConfirmCode = async () => {
		if (!email || !confirmationCode) {
			toast.error("Por favor, preencha o código de confirmação");
			return;
		}

		if (confirmationCode.length !== 6) {
			toast.error("O código deve ter exatamente 6 caracteres");
			return;
		}

		try {
			setIsConfirmingCode(true);
			const response = await residentsService.confirmEmail({
				email,
				code: confirmationCode.toUpperCase(),
			});

			toast.success(response.message || "Email confirmado com sucesso!");

			// Recarregar dados do status
			const statusResponse = await apiClient.get<ResidentStatusData>(
				`/v1/residents/status?email=${encodeURIComponent(email)}`,
			);
			if (statusResponse.success && statusResponse.data) {
				setResidentData(statusResponse.data);
				setConfirmationCode("");
			}

			// Redirecionar para login após 3 segundos
			setTimeout(() => {
				navigate("/login");
			}, 3000);
		} catch (error) {
			if (error instanceof ApiClientError) {
				toast.error(error.response.message || "Erro ao confirmar email");
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Erro ao confirmar email");
			}
		} finally {
			setIsConfirmingCode(false);
		}
	};

	const loadBuildings = async () => {
		try {
			setIsLoadingBuildings(true);
			const buildingsList = await buildingsService.getBuildings();
			setBuildings(buildingsList);
		} catch (error) {
			console.error("Erro ao carregar prédios:", error);
			toast.error("Erro ao carregar prédios");
		} finally {
			setIsLoadingBuildings(false);
		}
	};

	const loadApartments = async (buildingId: string) => {
		if (!buildingId) {
			setApartments([]);
			return;
		}

		try {
			setIsLoadingApartments(true);
			const apartmentsList = await apartmentsService.getApartmentsByBuildingId(buildingId);
			setApartments(apartmentsList);
		} catch (error) {
			console.error("Erro ao carregar apartamentos:", error);
			toast.error("Erro ao carregar apartamentos");
			setApartments([]);
		} finally {
			setIsLoadingApartments(false);
		}
	};

	useEffect(() => {
		if (formData.buildingId) {
			loadApartments(formData.buildingId);
		} else {
			setApartments([]);
		}
	}, [formData.buildingId]);

	const handlePhotoCapture = (file: File) => {
		setCapturedPhoto(file);
		setShowCamera(false);
		toast.success("Foto capturada com sucesso!");
	};

	const handleOpenCamera = () => {
		setShowCamera(true);
	};

	const handleCancelCamera = () => {
		setShowCamera(false);
	};

	const validateCPF = (cpf: string): boolean => {
		const cleanCpf = cpf.replace(/\D/g, "");
		if (cleanCpf.length !== 11) return false;
		if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

		let sum = 0;
		for (let i = 0; i < 9; i++) {
			sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
		}
		let digit = 11 - (sum % 11);
		if (digit >= 10) digit = 0;
		if (digit !== parseInt(cleanCpf.charAt(9))) return false;

		sum = 0;
		for (let i = 0; i < 10; i++) {
			sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
		}
		digit = 11 - (sum % 11);
		if (digit >= 10) digit = 0;
		if (digit !== parseInt(cleanCpf.charAt(10))) return false;

		return true;
	};

	const handleUpdateRejectedResident = async () => {
		if (!email) return;

		// Validações
		if (!formData.name || formData.name.trim().length < 3) {
			toast.error("Nome deve ter no mínimo 3 caracteres");
			return;
		}

		// Validar nome: apenas letras e espaços
		if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.name.trim())) {
			toast.error("Nome deve conter apenas letras e espaços");
			return;
		}

		if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			toast.error("Email inválido");
			return;
		}

		if (!formData.document) {
			toast.error("CPF é obrigatório");
			return;
		}

		const documentDigits = formData.document.replace(/\D/g, "");
		if (documentDigits.length !== 11) {
			toast.error("CPF deve conter exatamente 11 dígitos");
			return;
		}

		if (!validateCPF(formData.document)) {
			toast.error("CPF inválido");
			return;
		}

		if (formData.password && formData.password.length < 6) {
			toast.error("Senha deve ter no mínimo 6 caracteres");
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			toast.error("As senhas não coincidem");
			return;
		}

		if (!formData.buildingId) {
			toast.error("Selecione um prédio");
			return;
		}

		if (!formData.apartmentId) {
			toast.error("Selecione um apartamento");
			return;
		}

		if (formData.phone) {
			const phoneDigits = formData.phone.replace(/\D/g, "");
			const formattedPhone = `+55${phoneDigits}`;
			if (!/^\+\d{11,15}$/.test(formattedPhone)) {
				toast.error("Telefone inválido");
				return;
			}
		}

		try {
			setIsSaving(true);
			const phoneDigits = formData.phone ? formData.phone.replace(/\D/g, "") : "";
			const formattedPhone = phoneDigits ? `+55${phoneDigits}` : undefined;

			// Remover formatação do CPF
			const documentDigits = formData.document.replace(/\D/g, "");

			// Converter nome para snake_case
			const nameSnakeCase = formData.name
				.trim()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase()
				.replace(/\s+/g, "_");

			const updateData: any = {
				name: nameSnakeCase,
				email: formData.email.trim(),
				document: documentDigits,
				buildingId: formData.buildingId,
				apartmentId: formData.apartmentId,
			};

			if (formattedPhone) {
				updateData.phone = formattedPhone;
			}

			if (formData.password) {
				updateData.password = formData.password;
			}

			const response = await apiClient.put<{
				email: string;
				phone: string;
				status: string;
				presignedUrl?: string;
			}>(`/v1/residents/update-rejected?email=${encodeURIComponent(email)}`, updateData);

			if (response.success) {
				// Fazer upload da foto se houver
				if (capturedPhoto && response.data?.presignedUrl) {
					await residentsService.uploadPhoto(response.data.presignedUrl, capturedPhoto);
				}

				toast.success("Dados atualizados com sucesso! Seu cadastro será revisado novamente.");
				// Recarregar dados
				const statusResponse = await apiClient.get<ResidentStatusData>(
					`/v1/residents/status?email=${encodeURIComponent(formData.email)}`,
				);
				if (statusResponse.success && statusResponse.data) {
					setResidentData(statusResponse.data);
				}
			} else {
				toast.error("Erro ao atualizar dados");
			}
		} catch (error: any) {
			console.error("Erro ao atualizar dados:", error);
			const errorMessage = error?.response?.message || error?.message || "Erro ao atualizar dados";
			toast.error(errorMessage);
		} finally {
			setIsSaving(false);
		}
	};

	const getCurrentStepIndex = () => {
		if (!residentData) return -1;

		// Se for REJEITADO, mostrar como step especial
		if (residentData.status === "REJEITADO") {
			return -1; // Não mostrar nos steps normais
		}

		const stepIndex = statusSteps.findIndex((step) => step.status === residentData.status);
		return stepIndex >= 0 ? stepIndex : -1;
	};

	const currentStepIndex = getCurrentStepIndex();
	const isRejected = residentData?.status === "REJEITADO";

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-2xl">
				<Card>
					<CardHeader className="text-center pb-8">
						<div className="flex justify-center mb-4">
							<img src={coliseuIcon} alt="Coliseu" className="w-16 h-16" />
						</div>
						<CardTitle className="text-2xl">Status do Cadastro</CardTitle>
						{residentData && (
							<div className="mt-6 space-y-2">
								<div className="flex items-center justify-center gap-2 text-lg">
									<User className="w-5 h-5 text-primary" />
									<span className="font-semibold">{residentData.name}</span>
								</div>
								{residentData.apartmentNumber && (
									<div className="flex items-center justify-center gap-2 text-muted-foreground">
										<Home className="w-4 h-4" />
										<span>
											{residentData.apartmentBlock && `Bloco ${residentData.apartmentBlock} - `}
											Apartamento {residentData.apartmentNumber}
										</span>
									</div>
								)}
							</div>
						)}
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							</div>
						) : isRejected ? (
							<div className="space-y-6">
								{/* Status Rejeitado */}
								<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
									<div className="flex items-start gap-3">
										<div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
											<XCircle className="w-6 h-6 text-destructive-foreground" />
										</div>
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-destructive mb-1">
												Cadastro Rejeitado
											</h3>
											<p className="text-sm text-muted-foreground mb-3">
												Seu cadastro foi rejeitado. Por favor, atualize seus dados abaixo.
											</p>
											{residentData.rejectType && (
												<div className="mb-2">
													<p className="text-sm font-medium">
														Motivo:{" "}
														{rejectTypeLabels[residentData.rejectType] || residentData.rejectType}
													</p>
												</div>
											)}
											{residentData.rejectNote && (
												<div className="mb-2">
													<p className="text-sm text-muted-foreground">
														Observação: {residentData.rejectNote}
													</p>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Formulário de Atualização */}
								<div className="space-y-4 p-4 border rounded-lg">
									<h4 className="font-semibold">Atualizar Dados</h4>
									<div className="space-y-4">
										<div>
											<Label htmlFor="building">Prédio *</Label>
											<Select
												value={formData.buildingId}
												onValueChange={(value) =>
													setFormData((prev) => ({ ...prev, buildingId: value, apartmentId: "" }))
												}
												disabled={isLoadingBuildings || isSaving}
											>
												<SelectTrigger className="h-12">
													<SelectValue
														placeholder={
															isLoadingBuildings ? "..." : "Selecione o prédio"
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{buildings.map((building) => (
														<SelectItem key={building._id} value={building._id}>
															{building.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label htmlFor="apartment">Apartamento *</Label>
											<Select
												value={formData.apartmentId}
												onValueChange={(value) =>
													setFormData((prev) => ({ ...prev, apartmentId: value }))
												}
												disabled={!formData.buildingId || isLoadingApartments || isSaving}
											>
												<SelectTrigger className="h-12">
													<SelectValue
														placeholder={
															!formData.buildingId
																? "Selecione primeiro o prédio"
																: isLoadingApartments
																	? "..."
																	: "Selecione o apartamento"
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{apartments.map((apartment) => (
														<SelectItem key={apartment._id} value={apartment._id}>
															{apartment.number}
															{apartment.block ? ` - ${apartment.block}` : ""}
															{apartment.floor ? ` (${apartment.floor}º andar)` : ""}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label htmlFor="name">Nome Completo *</Label>
											<Input
												id="name"
												value={formData.name}
												onChange={(e) => {
													const value = e.target.value;
													// Permitir apenas letras e espaços
													if (/^[a-zA-ZÀ-ÿ\s]*$/.test(value) || value === "") {
														setFormData((prev) => ({ ...prev, name: value }));
													}
												}}
												placeholder="Digite seu nome completo"
												minLength={3}
												className="h-12"
											/>
											<p className="text-xs text-muted-foreground mt-1">
												Apenas letras e espaços são permitidos
											</p>
										</div>

										<div>
											<Label htmlFor="email">Email *</Label>
											<Input
												id="email"
												type="email"
												value={formData.email}
												onChange={(e) =>
													setFormData((prev) => ({ ...prev, email: e.target.value }))
												}
												placeholder="seu@email.com"
												className="h-12"
											/>
										</div>

										<div>
											<Label htmlFor="password">Nova Senha</Label>
											<div className="relative">
												<Input
													id="password"
													type={showPassword ? "text" : "password"}
													value={formData.password}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, password: e.target.value }))
													}
													placeholder="Deixe em branco para manter a senha atual"
													className="h-12 pr-10"
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
												>
													{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
										</div>

										{formData.password && (
											<div>
												<Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
												<div className="relative">
													<Input
														id="confirmPassword"
														type={showConfirmPassword ? "text" : "password"}
														value={formData.confirmPassword}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
														}
														placeholder="Confirme sua nova senha"
														className="h-12 pr-10"
													/>
													<button
														type="button"
														onClick={() => setShowConfirmPassword(!showConfirmPassword)}
														className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
													>
														{showConfirmPassword ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</button>
												</div>
											</div>
										)}

										<div>
											<Label htmlFor="phone">Telefone</Label>
											<div className="relative">
												<div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
													<BR title="Brasil" className="w-6 h-4" />
													<span className="text-muted-foreground text-sm">+55</span>
												</div>
												<InputMask
													mask="(99) 99999-9999"
													value={formData.phone}
													onChange={(e: any) =>
														setFormData((prev) => ({ ...prev, phone: e.target.value }))
													}
													placeholder="(11) 99999-9999"
												>
													{(inputProps: any) => (
														<Input {...inputProps} type="tel" className="h-12 pl-24" />
													)}
												</InputMask>
											</div>
										</div>

										<div>
											<Label htmlFor="document">CPF *</Label>
											<InputMask
												mask="999.999.999-99"
												maskChar={null}
												value={formData.document}
												onChange={(e: any) =>
													setFormData((prev) => ({ ...prev, document: e.target.value }))
												}
												placeholder="000.000.000-00"
											>
												{(inputProps: any) => <Input {...inputProps} type="text" className="h-12" />}
											</InputMask>
										</div>

										<div>
											<Label htmlFor="photo">Foto de Verificação</Label>
											<div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-3 rounded-md mb-3">
												<p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
													📸 Requisitos da Foto:
												</p>
												<ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
													<li>Seu rosto deve estar visível e nítido</li>
													<li>Segure um papel contendo:</li>
													<ul className="ml-6 space-y-0.5">
														<li>
															→ Número do apartamento:{" "}
															<span className="font-semibold">ex: 101</span>
														</li>
														<li>
															→ Seu telefone completo:{" "}
															<span className="font-semibold">ex: (11) 98765-4321</span>
														</li>
													</ul>
													<li>
														A escrita deve estar{" "}
														<span className="font-semibold">legível e clara</span>
													</li>
												</ul>
											</div>

											{showCamera ? (
												<CameraCapture
													onCapture={handlePhotoCapture}
													onCancel={handleCancelCamera}
													className="w-full"
												/>
											) : (
												<div className="space-y-3">
													{capturedPhoto ? (
														<div className="relative border rounded-lg overflow-hidden bg-muted">
															<img
																src={URL.createObjectURL(capturedPhoto)}
																alt="Foto capturada"
																className="w-full h-64 object-contain"
															/>
															<div className="absolute top-2 right-2">
																<Button
																	type="button"
																	size="sm"
																	variant="secondary"
																	onClick={handleOpenCamera}
																>
																	<Camera className="mr-2 h-4 w-4" />
																	Tirar Nova Foto
																</Button>
															</div>
														</div>
													) : (
														<Button
															type="button"
															onClick={handleOpenCamera}
															className="w-full h-32 bg-muted hover:bg-muted/80 text-foreground border-2 border-dashed"
															variant="outline"
														>
															<div className="flex flex-col items-center gap-2">
																<Camera className="h-8 w-8" />
																<span className="font-medium">Abrir Câmera</span>
																<span className="text-xs text-muted-foreground">
																	Clique para tirar a foto de verificação
																</span>
															</div>
														</Button>
													)}
												</div>
											)}
										</div>

										<Button
											onClick={handleUpdateRejectedResident}
											disabled={
												isSaving ||
												!formData.name ||
												formData.name.trim().length < 3 ||
												!formData.email ||
												!formData.document ||
												formData.document.replace(/\D/g, "").length !== 11 ||
												!formData.buildingId ||
												!formData.apartmentId ||
												(formData.password && formData.password !== formData.confirmPassword)
											}
											className="w-full h-12"
										>
											<Save className="w-4 h-4 mr-2" />
											{isSaving ? "Salvando..." : "Salvar e Enviar para Revisão"}
										</Button>
									</div>
								</div>

								<div className="pt-6 border-t">
									<Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
										<ArrowLeft className="w-4 h-4 mr-2" />
										Voltar para o Login
									</Button>
								</div>
							</div>
						) : (
							<div className="space-y-6">
								{statusSteps.map((step, index) => {
									const isCompleted = index < currentStepIndex;
									const isCurrent = index === currentStepIndex;
									const isPending = index > currentStepIndex;

									return (
										<div key={step.id} className="relative pb-8">
											{/* Linha conectora */}
											{index < statusSteps.length - 1 && (
												<div
													className={`absolute left-6 top-12 w-0.5 h-20 ${
														isCompleted ? "bg-primary" : "bg-muted"
													}`}
												/>
											)}

											<div className="flex gap-4">
												{/* Ícone do status */}
												<div className="flex-shrink-0">
													{isCompleted ? (
														<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
															<CheckCircle2 className="w-6 h-6 text-primary-foreground" />
														</div>
													) : isCurrent ? (
														<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center ring-4 ring-primary/20">
															<Clock className="w-6 h-6 text-primary-foreground animate-pulse" />
														</div>
													) : (
														<div className="w-12 h-12 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center">
															<Circle className="w-6 h-6 text-muted-foreground" />
														</div>
													)}
												</div>

												{/* Conteúdo */}
												<div className="flex-1">
													<h3
														className={`text-lg font-semibold mb-1 ${
															isCurrent
																? "text-primary"
																: isCompleted
																	? "text-foreground"
																	: "text-muted-foreground"
														}`}
													>
														{step.title}
													</h3>
													<p className="text-sm text-muted-foreground">{step.description}</p>
													{isCurrent && (
														<div className="mt-2 space-y-2">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
																Status Atual
															</span>
															{step.status === "A_CONFIRMACAO_EMAIL" && (
																<div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-4">
																	<p className="text-sm text-muted-foreground">
																		Um email com o código de confirmação já foi enviado para{" "}
																		<strong>{email}</strong>. Verifique sua caixa de entrada e spam.
																	</p>
																	
																	<div className="space-y-2">
																		<Label htmlFor="confirmationCode">Código de Confirmação</Label>
																		<Input
																			id="confirmationCode"
																			type="text"
																			value={confirmationCode}
																			onChange={(e) => {
																				const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
																				if (value.length <= 6) {
																					setConfirmationCode(value);
																				}
																			}}
																			className="h-12 text-center text-2xl font-mono tracking-widest uppercase"
																			placeholder="ABC123"
																			maxLength={6}
																			autoComplete="off"
																			disabled={isConfirmingCode}
																		/>
																		<p className="text-xs text-muted-foreground text-center">
																			O código contém 6 caracteres entre letras e números
																		</p>
																	</div>

																	<Button
																		onClick={handleConfirmCode}
																		disabled={confirmationCode.length !== 6 || isConfirmingCode}
																		className="w-full h-12"
																	>
																		{isConfirmingCode ? "Confirmando..." : "Confirmar Email"}
																	</Button>

																	<Button
																		variant="outline"
																		size="sm"
																		onClick={handleResendEmail}
																		disabled={resendTimer > 0 || isResending}
																		className="w-full"
																	>
																		<Mail className="w-4 h-4 mr-2" />
																		{isResending
																			? "Enviando..."
																			: resendTimer > 0
																				? `Reenviar email (${resendTimer}s)`
																				: "Reenviar email"}
																	</Button>
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})}

								<div className="pt-6 border-t">
									<Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
										<ArrowLeft className="w-4 h-4 mr-2" />
										Voltar para o Login
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
