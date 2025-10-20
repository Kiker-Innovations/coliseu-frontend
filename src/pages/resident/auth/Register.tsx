import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import { Camera } from "lucide-react";
import { BR } from "country-flag-icons/react/3x2";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CameraCapture } from "@/components/ui/camera-capture";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  registerSchema,
  type RegisterSchema,
} from "@/schemas/resident/auth/register.schema";
import RegisterSkeleton from "@/skeleton/resident/auth/RegisterSkeleton";

export default function Register() {
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);

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
    setValue,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      apartmentNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const handlePhotoCapture = (file: File) => {
    setCapturedPhoto(file);
    // Criar um FileList-like object para o react-hook-form
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    setValue("photo", dataTransfer.files, { shouldValidate: true });
    setShowCamera(false);
    toast.success("Foto capturada com sucesso!");
  };

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCancelCamera = () => {
    setShowCamera(false);
  };

  const onSubmit = async (data: RegisterSchema) => {
    try {
      // Remove a máscara e adiciona o código do país +55
      const phoneDigits = data.phone.replace(/\D/g, "");
      const formattedPhone = `+55${phoneDigits}`;

      console.log(data);

      const { error } = await authService.signUp({
        email: data.email,
        password: data.password,
        apartmentNumber: data.apartmentNumber,
        phone: formattedPhone,
        photo: data.photo[0],
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    }
  };

  if (!isPageReady) {
    return <RegisterSkeleton />;
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="apartment">Número do Apartamento</Label>
              <Input
                id="apartment"
                type="text"
                {...register("apartmentNumber")}
                maxLength={4}
                className="h-12"
                placeholder="Ex: 101"
              />
              {errors.apartmentNumber && (
                <p className="text-sm text-destructive">
                  {errors.apartmentNumber.message}
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
              <Label htmlFor="password">Senha</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="h-12"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                  <BR title="Brasil" className="w-6 h-4" />
                  <span className="text-muted-foreground text-sm">+55</span>
                </div>
                <InputMask
                  mask="(99) 99999-9999"
                  id="phone"
                  {...register("phone")}
                  placeholder="(11) 99999-9999"
                >
                  {(inputProps: any) => (
                    <Input {...inputProps} type="tel" className="h-12 pl-24" />
                  )}
                </InputMask>
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto de Verificação</Label>
              <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-3 rounded-md mb-3">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  📸 Requisitos da Foto:
                </p>
                <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                  <li>Seu rosto deve estar visível e nítido</li>
                  <li>Segure um papel contendo:</li>
                  <ul className="ml-6 space-y-0.5">
                    <li>
                      → Número do apartamento:{" "}
                      <span className="font-semibold">ex: 101</span>
                    </li>
                    <li>
                      → Seu telefone completo:{" "}
                      <span className="font-semibold">ex: (11) 98765-4321</span>
                    </li>
                  </ul>
                  <li>
                    A escrita deve estar{" "}
                    <span className="font-semibold">legível e clara</span>
                  </li>
                </ul>
              </div>

              {showCamera ? (
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  onCancel={handleCancelCamera}
                  className="w-full"
                />
              ) : (
                <div className="space-y-3">
                  {capturedPhoto ? (
                    <div className="relative border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(capturedPhoto)}
                        alt="Foto capturada"
                        className="w-full h-64 object-contain"
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleOpenCamera}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Tirar Nova Foto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleOpenCamera}
                      className="w-full h-32 bg-muted hover:bg-muted/80 text-foreground border-2 border-dashed"
                      variant="outline"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-8 w-8" />
                        <span className="font-medium">Abrir Câmera</span>
                        <span className="text-xs text-muted-foreground">
                          Clique para tirar a foto de verificação
                        </span>
                      </div>
                    </Button>
                  )}

                  {/* Hidden input for form validation */}
                  <input
                    type="file"
                    {...register("photo")}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              )}

              {errors.photo && (
                <p className="text-sm text-destructive">
                  {errors.photo.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Criando conta..." : "Cadastrar"}
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
