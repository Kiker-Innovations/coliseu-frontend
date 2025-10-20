import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/schemas/concierge/reset-password.schema";
import coliseuIcon from "@/assets/coliseu-icon.png";

export default function ConciergeResetPassword() {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEmailSent(true);
      toast.success("E-mail de recuperação enviado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar e-mail");
    }
  };

  if (emailSent) {
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
              <CardTitle className="text-2xl font-bold">
                E-mail Enviado!
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Verifique sua caixa de entrada e siga as instruções para
                redefinir sua senha.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/concierge/login")}
              className="w-full"
              size="lg"
            >
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
            <p className="text-sm text-muted-foreground mt-2">
              Recuperação de senha
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
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
                {isSubmitting ? "Enviando..." : "Enviar Link de Recuperação"}
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
