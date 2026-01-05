import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import { Camera } from "lucide-react";
import { BR } from "country-flag-icons/react/3x2";
import { residentsService, ApiClientError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CameraCapture } from "@/components/ui/camera-capture";
import { toast } from "sonner";
import coliseuIcon from "@/assets/coliseu-icon.png";
import {
  registerSchema,
  type RegisterSchema,
} from "@/schemas/resident/auth/register.schema";
import RegisterSkeleton from "@/skeleton/resident/auth/RegisterSkeleton";
import {
  buildingsService,
  type Building,
} from "@/services/api/buildings.service";
import { apartmentsService, type Apartment } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, userType, isLoading: isAuthLoading } = useAuth();
  const [isPageReady, setIsPageReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoadingApartments, setIsLoadingApartments] = useState(false);

  // Redirect if already authenticated
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
    setValue,
    watch,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      buildingId: "",
      apartmentId: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const selectedBuildingId = watch("buildingId");
  const selectedApartmentId = watch("apartmentId");

  useEffect(() => {
    const fetchApartments = async () => {
      if (!selectedBuildingId) {
        setApartments([]);
        setValue("apartmentId", "");
        return;
      }

      try {
        setIsLoadingApartments(true);
        const apartmentsList =
          await apartmentsService.getApartmentsByBuildingId(selectedBuildingId);
        setApartments(apartmentsList);
        setValue("apartmentId", "");
      } catch (error) {
        toast.error("Erro ao carregar apartamentos");
        console.error("Failed to load apartments:", error);
        setApartments([]);
        setValue("apartmentId", "");
      } finally {
        setIsLoadingApartments(false);
      }
    };

    fetchApartments();
  }, [selectedBuildingId, setValue]);

  const handlePhotoCapture = (file: File) => {
    setCapturedPhoto(file);

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
      const phoneDigits = data.phone.replace(/\D/g, "");
      const formattedPhone = `+55${phoneDigits}`;

      const response = await residentsService.register({
        buildingId: data.buildingId,
        apartmentId: data.apartmentId,
        name: data.name,
        email: data.email,
        password: data.password,
        phone: formattedPhone,
      });

      if (data.photo?.[0] && response.data?.presignedUrl) {
        await residentsService.uploadPhoto(
          response.data.presignedUrl,
          data.photo[0]
        );
      }

      toast.success(response.message || "Conta criada com sucesso!");
      setTimeout(() => {
        window.location.href = "/login";
      }, 200);
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao criar conta");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao criar conta");
      }
    }
  };

  // Show loading while auth is checking or page is not ready
  if (isAuthLoading || !isPageReady) {
    return <RegisterSkeleton />;
  }

  // Don't render register page if already authenticated
  if (isAuthenticated && userType === "resident") {
    return <RegisterSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
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
              <Label htmlFor="apartment">Apartamento</Label>
              <Select
                value={selectedApartmentId}
                onValueChange={(value) => setValue("apartmentId", value)}
                disabled={
                  !selectedBuildingId || isLoadingApartments || isSubmitting
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue
                    placeholder={
                      !selectedBuildingId
                        ? "Selecione primeiro o prédio"
                        : isLoadingApartments
                        ? "Carregando apartamentos..."
                        : "Selecione o apartamento"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {apartments.map((apartment) => (
                    <SelectItem key={apartment._id} value={apartment._id}>
                      {apartment.number}
                      {apartment.block ? ` - ${apartment.block}` : ""}
                      {apartment.floor ? ` (${apartment.floor}º andar)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.apartmentId && (
                <p className="text-sm text-destructive">
                  {errors.apartmentId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                className="h-12"
                placeholder="Digite seu nome completo"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
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
