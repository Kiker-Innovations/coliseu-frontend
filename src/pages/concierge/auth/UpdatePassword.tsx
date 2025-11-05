import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Shield, Mail, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { conciergeService, ApiClientError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              PORTARIA
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Redefinir senha
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="pl-10"
                  placeholder="seu@email.com"
                  readOnly
                  disabled
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificação</Label>
              <Input
                id="code"
                type="text"
                {...register("code")}
                className="text-center text-2xl font-mono tracking-widest"
                placeholder="123456"
                maxLength={6}
                autoComplete="off"
                autoFocus
                disabled={isSubmitting}
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Digite o código de 6 dígitos recebido por e-mail
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                {...register("newPassword")}
                placeholder="Digite sua nova senha"
                disabled={isSubmitting}
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="Confirme sua nova senha"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Alterando senha..." : "Alterar Senha"}
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
