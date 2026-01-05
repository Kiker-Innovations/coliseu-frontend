import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  loginSchema,
  type LoginSchema,
} from "@/schemas/resident/auth/login.schema";
import LoginSkeleton from "@/skeleton/resident/auth/LoginSkeleton";
import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import {
  buildingsService,
  type Building,
} from "@/services/api/buildings.service";
import { ApiClientError } from "@/services/api/client";

export default function Login() {
  const navigate = useNavigate();
  const {
    loginResident,
    isAuthenticated,
    userType,
    isLoading: isAuthLoading,
  } = useAuth();
  const [isPageReady, setIsPageReady] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);

  // Redirect if already authenticated (wait for auth to finish loading first)
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && userType === "resident") {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, userType, navigate]);

  // Load buildings
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsList = await buildingsService.getBuildings();
        setBuildings(buildingsList);
      } catch (error) {
        toast.error("Erro ao carregar prédios");
        console.error("Failed to load buildings:", error);
      } finally {
        setIsLoadingBuildings(false);
        setIsPageReady(true);
      }
    };
    loadBuildings();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      buildingId: "",
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");
  const selectedBuildingId = watch("buildingId");

  const onSubmit = async (data: LoginSchema) => {
    try {
      await loginResident(
        {
          buildingId: data.buildingId,
          email: data.email,
          password: data.password,
        },
        data.rememberMe
      );
      toast.success("Login realizado com sucesso!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 200);
    } catch (error: any) {
      let errorMessage = "Erro ao fazer login";

      if (error instanceof ApiClientError) {
        errorMessage = error.response?.message || error.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Verificar se é o erro de aguardando aprovação, confirmação de email ou rejeitado
      const lowerMessage = errorMessage.toLowerCase();
      if (
        lowerMessage.includes("aguardando aprovação") ||
        lowerMessage.includes("aguardando aprovação do administrador") ||
        lowerMessage.includes("cadastro não confirmado") ||
        lowerMessage.includes("verifique seu email") ||
        lowerMessage.includes("cadastro rejeitado") ||
        lowerMessage.includes("atualize seus dados") ||
        errorMessage.includes("A_VALIDACAO") ||
        errorMessage.includes("A_CONFIRMACAO_EMAIL") ||
        errorMessage.includes("REJEITADO")
      ) {
        // Gerar token temporário para acesso seguro à tela de status
        const accessToken = crypto.randomUUID();
        // Armazenar token temporário (válido por 5 minutos)
        sessionStorage.setItem(`status_access_${data.email}`, accessToken);
        sessionStorage.setItem(
          `status_access_time_${data.email}`,
          Date.now().toString()
        );

        // Redirecionar para a tela de status apenas com o email (token fica no sessionStorage)
        navigate(`/status?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.error(errorMessage);
    }
  };

  // Show loading while auth is checking or page is not ready
  if (isAuthLoading || !isPageReady) {
    return <LoginSkeleton />;
  }

  // Don't render login page if already authenticated
  if (isAuthenticated && userType === "resident") {
    return <LoginSkeleton />;
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
            <Home className="w-6 h-6 text-primary-foreground" />
            <span className="text-primary-foreground font-bold text-xl">
              ACESSO DE MORADORES
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <img
              src={coliseuIcon}
              alt="Coliseu"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-primary">COLISEU</h1>
            <div className="flex items-center justify-center gap-2 mt-4 bg-primary/10 px-4 py-2 rounded-lg">
              <Home className="w-5 h-5 text-primary" />
              <span className="text-primary font-bold">
                ACESSO DE MORADORES
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="flex items-center justify-center gap-2 bg-primary/10 px-6 py-3 rounded-lg mb-6">
              <Home className="w-6 h-6 text-primary" />
              <span className="text-primary font-bold text-xl">
                ACESSO DE MORADORES
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="building">Prédio</Label>
              <Select
                value={selectedBuildingId}
                onValueChange={(value) => setValue("buildingId", value)}
                disabled={isLoadingBuildings || isSubmitting}
              >
                <SelectTrigger className="h-12">
                  <SelectValue
                    placeholder={
                      isLoadingBuildings
                        ? "Carregando prédios..."
                        : "Selecione o prédio"
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
              {errors.buildingId && (
                <p className="text-sm text-destructive">
                  {errors.buildingId.message}
                </p>
              )}
            </div>

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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/reset-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Esqueceu sua senha? Clique aqui
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="h-12"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setValue("rememberMe", checked as boolean)
                }
              />
              <Label htmlFor="remember" className="cursor-pointer">
                Lembrar-me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Sign in"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-accent hover:bg-accent/10 hover:text-black"
              onClick={() => navigate("/register")}
            >
              Criar conta
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
