import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apartmentNumber || apartmentNumber.length > 4) {
      toast.error(
        "Por favor, insira um número de apartamento válido (até 4 dígitos)"
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!phone || phone.length < 10) {
      toast.error("Por favor, insira um telefone válido");
      return;
    }

    if (!photo) {
      toast.error("Por favor, envie uma foto de verificação");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authService.signUp({
        email,
        password,
        apartmentNumber,
        phone,
        photo,
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
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
            className="w-60 h-60 mx-auto mb-8"
          />
          <h1 className="text-6xl font-bold text-primary-foreground mb-4">
            COLISEU
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Gestão de Condomínios
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
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
              Criar Conta
            </h2>
            <p className="text-muted-foreground mt-2">Cadastre-se no sistema</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="apartment">Número do Apartamento</Label>
              <Input
                id="apartment"
                type="number"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value.slice(0, 4))}
                maxLength={4}
                required
                className="h-12"
                placeholder="Ex: 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-12"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto de Verificação</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Envie uma foto sua segurando um papel com a data atual e o
                número do seu apartamento
              </p>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                required
                className="h-12 cursor-pointer"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Cadastrar"}
            </Button>

            <div className="text-center">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Fazer login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
