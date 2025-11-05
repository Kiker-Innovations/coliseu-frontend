import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Shield, Mail, ShieldCheck } from "lucide-react";
import { adminService, ApiClientError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  confirmCodeSchema,
  type ConfirmCodeSchema,
} from "@/schemas/admin/auth/confirm-code.schema";

export default function AdminConfirmCode() {
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
      const response = await adminService.confirmEmail({
        email: data.email,
        code: data.code.toUpperCase(),
      });

      toast.success(response.message || "Email confirmado com sucesso!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/admin/login");
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
          <h1 className="text-6xl font-bold text-primary-foreground mb-4">
            COLISEU
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-4">
            Gestão de Condomínios
          </p>
          <div className="flex items-center justify-center gap-2 bg-primary-foreground/20 px-6 py-3 rounded-lg backdrop-blur-sm">
            <Shield className="w-6 h-6 text-primary-foreground" />
            <span className="text-primary-foreground font-bold text-xl">
              ACESSO ADMINISTRATIVO
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Confirm Code Form */}
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
              <div className="flex items-center justify-center gap-2 mt-4 bg-primary/10 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold">
                  ACESSO ADMINISTRATIVO
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center gap-2 bg-primary/10 px-6 py-3 rounded-lg mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-primary font-bold text-xl">
                ACESSO ADMINISTRATIVO
              </span>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <ShieldCheck className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Confirme seu Email
            </h2>
            <p className="text-muted-foreground">
              Digite o código de 6 caracteres que enviamos para seu email
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="h-12 pl-10"
                  placeholder="admin@coliseu.com"
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
                className="h-12 text-center text-2xl font-mono tracking-widest uppercase"
                placeholder="ABC123"
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                O código contém 6 caracteres entre letras e números
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Email"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Não recebeu o código?
              </p>
              <Button
                type="button"
                variant="link"
                className="text-primary"
                onClick={() => toast.info("Funcionalidade em breve")}
              >
                Reenviar código
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
