import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Shield, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { conciergeService, ApiClientError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  confirmCodeSchema,
  type ConfirmCodeSchema,
} from "@/schemas/concierge/confirm-code.schema";

export default function ConciergeConfirmCode() {
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
  } = useForm<ConfirmCodeSchema>({
    resolver: zodResolver(confirmCodeSchema),
    defaultValues: {
      email: emailFromUrl,
      code: "",
    },
  });

  const onSubmit = async (data: ConfirmCodeSchema) => {
    try {
      const response = await conciergeService.confirmEmail({
        email: data.email,
        code: data.code.toUpperCase(),
      });

      toast.success(response.message || "Email confirmado com sucesso!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/concierge/login");
      }, 3000);
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao confirmar email");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao confirmar email");
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
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              PORTARIA
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Confirme seu e-mail
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
              <Label htmlFor="code">Código de Confirmação</Label>
              <Input
                id="code"
                type="text"
                {...register("code")}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                placeholder="ABC123"
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
                Digite o código de 6 caracteres recebido por e-mail
              </p>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirmando..." : "Confirmar E-mail"}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => toast.info("Funcionalidade em breve")}
                disabled={isSubmitting}
              >
                Reenviar código
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
