import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apartment, setApartment] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apartment || apartment.length > 4) {
      toast.error(
        "Por favor, insira um número de apartamento válido (até 4 dígitos)"
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await authService.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
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
            className="w-80 h-80 mx-auto"
          />
          <h1 className="text-6xl font-bold text-primary-foreground mb-4">
            COLISEU
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Gestão de Condomínios
          </p>
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
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apartment">Número do Apartamento</Label>
              <Input
                id="apartment"
                type="number"
                placeholder="Ex: 101"
                value={apartment}
                onChange={(e) => setApartment(e.target.value.slice(0, 4))}
                maxLength={4}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Sign in"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-accent hover:bg-accent/10"
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
