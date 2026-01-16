import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
	resetPasswordCodeSchema,
	type ResetPasswordCodeSchema,
} from "@/schemas/concierge/reset-password-code.schema";
import { resetPasswordConcierge } from "@/services/concierge.service";
import coliseuIcon from "@/assets/coliseu-icon.png";

export default function ConciergeResetPasswordToken() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [passwordSent, setPasswordSent] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const emailFromUrl = searchParams.get("email") || "";
	const codeFromUrl = searchParams.get("code") || "";

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
	} = useForm<ResetPasswordCodeSchema>({
		resolver: zodResolver(resetPasswordCodeSchema),
		defaultValues: {
			email: emailFromUrl,
			code: codeFromUrl,
			newPassword: "",
			confirmPassword: "",
		},
	});

	useEffect(() => {
		if (emailFromUrl) {
			setValue("email", emailFromUrl);
		}
		if (codeFromUrl) {
			setValue("code", codeFromUrl);
		}
	}, [emailFromUrl, codeFromUrl, setValue]);

	const onSubmit = async (data: ResetPasswordCodeSchema) => {
		try {
			await resetPasswordConcierge(data.email, data.code, data.newPassword);
			setPasswordSent(true);
			toast.success("Senha redefinida com sucesso!");
		} catch (error: any) {
			toast.error(error.message || "Erro ao redefinir senha");
		}
	};

	if (passwordSent) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
				<Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
					<CardHeader className="space-y-4 text-center pb-8">
						<div className="flex justify-center">
							<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
								<CheckCircle2 className="w-8 h-8 text-green-600" />
							</div>
						</div>
						<div>
							<CardTitle className="text-2xl font-bold">Senha Redefinida!</CardTitle>
							<p className="text-sm text-muted-foreground mt-2">
								Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.
							</p>
						</div>
					</CardHeader>
					<CardContent>
						<Button onClick={() => navigate("/concierge/login")} className="w-full" size="lg">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Voltar ao Login
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
			<Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
				<CardHeader className="space-y-4 text-center pb-8">
					<div className="flex justify-center">
						<img src={coliseuIcon} alt="Coliseu" className="w-16 h-16" />
					</div>
					<div>
						<CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
							<Shield className="w-8 h-8 text-primary" />
							PORTARIA
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-2">Redefinir senha</p>
					</div>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="email">E-mail</Label>
							<Input
								id="email"
								type="email"
								placeholder="porteiro@example.com"
								{...register("email")}
								disabled={isSubmitting || !!emailFromUrl}
							/>
							{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="code">Código</Label>
							<Input
								id="code"
								type="text"
								placeholder="123456"
								{...register("code")}
								disabled={isSubmitting || !!codeFromUrl}
							/>
							{errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">Nova Senha</Label>
							<div className="relative">
								<Input
									id="newPassword"
									type={showPassword ? "text" : "password"}
									placeholder="Digite sua nova senha"
									{...register("newPassword")}
									disabled={isSubmitting}
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</Button>
							</div>
							{errors.newPassword && (
								<p className="text-sm text-destructive">{errors.newPassword.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Digite novamente sua nova senha"
									{...register("confirmPassword")}
									disabled={isSubmitting}
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
							{errors.confirmPassword && (
								<p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
							)}
						</div>

						<div className="space-y-4">
							<Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
								{isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
							</Button>

							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => navigate("/concierge/login")}
								disabled={isSubmitting}
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Voltar ao Login
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
