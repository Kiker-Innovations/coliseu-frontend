import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  loginSchema,
  type LoginSchema,
} from "@/schemas/resident/auth/login.schema";
import LoginSkeleton from "@/skeleton/resident/auth/LoginSkeleton";
import { useState, useEffect } from "react";
import { Home } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);

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
    watch,
    setValue,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      apartment: "",
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginSchema) => {
    try {
      const { error } = await authService.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    }
  };

  if (!isPageReady) {
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
              <Label htmlFor="apartment">Número do Apartamento</Label>
              <Input
                id="apartment"
                type="text"
                placeholder="Ex: 101"
                {...register("apartment")}
                maxLength={4}
                className="h-12"
              />
              {errors.apartment && (
                <p className="text-sm text-destructive">
                  {errors.apartment.message}
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
