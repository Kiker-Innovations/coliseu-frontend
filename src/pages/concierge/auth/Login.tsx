import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  loginSchema,
  type LoginSchema,
} from "@/schemas/concierge/login.schema";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  buildingsService,
  type Building,
} from "@/services/api/buildings.service";

export default function ConciergeLogin() {
  const navigate = useNavigate();
  const { loginConcierge, isAuthenticated, userType } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      // Redirect if already authenticated
      if (isAuthenticated && userType === "concierge") {
        navigate("/concierge/dashboard");
      }

      // Load buildings
      try {
        const buildingsList = await buildingsService.getBuildings();
        setBuildings(buildingsList);
      } catch (error) {
        toast.error("Erro ao carregar prédios");
        console.error("Failed to load buildings:", error);
      } finally {
        setIsLoadingBuildings(false);
      }
    };
    initialize();
  }, [isAuthenticated, userType, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
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
      await loginConcierge(
        {
          buildingId: data.buildingId,
          email: data.email,
          password: data.password,
        },
        data.rememberMe
      );
      toast.success("Login realizado com sucesso!");
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    }
  };

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
              Acesso exclusivo para funcionários da portaria
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="building">Prédio</Label>
              <Select
                value={selectedBuildingId}
                onValueChange={(value) => setValue("buildingId", value)}
                disabled={isLoadingBuildings || isSubmitting}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setValue("rememberMe", checked as boolean)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                  Lembrar-me
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                onClick={() => navigate("/concierge/reset-password")}
                disabled={isSubmitting}
              >
                Esqueceu a senha?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
