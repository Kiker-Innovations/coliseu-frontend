import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/schemas/auth/reset-password.schema";

export default function ResetPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      const { error } = await authService.resetPasswordForEmail(data.email);

      if (error) throw error;

      toast.success(
        "Email de recuperação enviado! Verifique sua caixa de entrada."
      );
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="text-center">
          <img
            src={coliseuIcon}
            alt="Coliseu"
            className="w-48 h-48 mx-auto mb-8"
          />
          <h1 className="text-6xl font-bold text-primary-foreground mb-4">
            COLISEU
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Gestão de Condomínios
          </p>
        </div>
      </div>

      {/* Right side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <img
                src={coliseuIcon}
                alt="Coliseu"
                className="w-16 h-16 mx-auto mb-4"
              />
              <h1 className="text-4xl font-bold text-primary">COLISEU</h1>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Recuperar Senha
            </h2>
            <p className="text-muted-foreground mt-2">
              Digite seu email para receber instruções de recuperação
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="h-12"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Email de Recuperação"}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
