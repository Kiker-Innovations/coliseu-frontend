import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Shield, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { conciergeService, ApiClientError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
	updatePasswordSchema,
	type UpdatePasswordSchema,
} from "@/schemas/concierge/update-password.schema";

export default function ConciergeUpdatePassword() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [isPageReady, setIsPageReady] = useState(false);
	const emailFromUrl = searchParams.get("email") || "";
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(() => {
		const initialize = async () => {
			setIsPageReady(true);
		};
		initialize();
	}, []);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<UpdatePasswordSchema>({
		resolver: zodResolver(updatePasswordSchema),
		defaultValues: {
			email: emailFromUrl,
			code: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: UpdatePasswordSchema) => {
		try {
			const response = await conciergeService.resetPassword({
				email: data.email,
				code: data.code,
				newPassword: data.newPassword,
			});

			toast.success(response.message || "Senha alterada com sucesso!");

			// Redirect to login after 3 seconds
			setTimeout(() => {
				navigate("/concierge/login");
			}, 3000);
		} catch (error) {
			if (error instanceof ApiClientError) {
				toast.error(error.response.message || "Erro ao alterar senha");
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Erro ao alterar senha");
			}
		}
	};

	if (!isPageReady) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
				<div className="animate-pulse space-y-4">
					<div className="h-16 w-16 bg-muted rounded-full mx-auto" />
					<div className="h-4 w-48 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex">
			{/* Left side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
				<div className="text-center">
					<img src={coliseuIcon} alt="Coliseu" className="w-80 h-80 mx-auto" />
					<h1 className="text-6xl font-bold text-primary-foreground mb-4">COLISEU</h1>
					<p className="text-primary-foreground/80 text-lg mb-4">Gestão de Condomínios</p>
					<div className="flex items-center justify-center gap-2 bg-primary-foreground/20 px-6 py-3 rounded-lg backdrop-blur-sm">
						<Shield className="w-6 h-6 text-primary-foreground" />
						<span className="text-primary-foreground font-bold text-xl">PORTARIA</span>
					</div>
				</div>
			</div>

			{/* Right side - Update Password Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<div className="lg:hidden mb-6">
							<img src={coliseuIcon} alt="Coliseu" className="w-16 h-16 mx-auto mb-4" />
							<h1 className="text-4xl font-bold text-primary">COLISEU</h1>
							<div className="flex items-center justify-center gap-2 mt-4 bg-primary/10 px-4 py-2 rounded-lg">
								<Shield className="w-5 h-5 text-primary" />
								<span className="text-primary font-bold">PORTARIA</span>
							</div>
						</div>

						<div className="hidden lg:flex items-center justify-center gap-2 bg-primary/10 px-6 py-3 rounded-lg mb-6">
							<Shield className="w-6 h-6 text-primary" />
							<span className="text-primary font-bold text-xl">PORTARIA</span>
						</div>

						<div className="flex justify-center mb-6">
							<div className="bg-primary/10 p-4 rounded-full">
								<ShieldCheck className="w-12 h-12 text-primary" />
							</div>
						</div>

						<h2 className="text-2xl font-semibold text-foreground mb-2">Redefinir Senha</h2>
						<p className="text-muted-foreground">
							Digite o código recebido por email e sua nova senha
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									{...register("email")}
									className="h-12 pl-10"
									placeholder="porteiro@example.com"
									readOnly
									disabled
								/>
							</div>
							{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="code">Código de Verificação</Label>
							<Input
								id="code"
								type="text"
								{...register("code")}
								className="h-12 text-center text-2xl font-mono tracking-widest"
								placeholder="123456"
								maxLength={6}
								autoComplete="off"
								autoFocus
							/>
							{errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
							<p className="text-xs text-muted-foreground text-center">
								O código contém 6 dígitos numéricos
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">Nova Senha</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="newPassword"
									type={showNewPassword ? "text" : "password"}
									{...register("newPassword")}
									className="h-12 pl-10 pr-10"
									placeholder="Digite sua nova senha"
								/>
								<button
									type="button"
									onClick={() => setShowNewPassword(!showNewPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							{errors.newPassword && (
								<p className="text-sm text-destructive">{errors.newPassword.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									{...register("confirmPassword")}
									className="h-12 pl-10 pr-10"
									placeholder="Confirme sua nova senha"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							{errors.confirmPassword && (
								<p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full h-12 bg-primary hover:bg-primary/90"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Alterando senha..." : "Alterar Senha"}
						</Button>

						<div className="text-center">
							<Button
								type="button"
								variant="link"
								className="text-primary"
								onClick={() => navigate("/concierge/login")}
							>
								Voltar para o login da portaria
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
