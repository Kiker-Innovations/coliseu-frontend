import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Save, ArrowLeft, Camera, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { adminService } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/ui/camera-capture";

// Schema de validação para dados do perfil
const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

// Schema de validação para mudança de senha
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .refine(
        (val) => /[A-Z]/.test(val),
        "Senha deve conter pelo menos uma letra maiúscula",
      )
      .refine(
        (val) => /[a-z]/.test(val),
        "Senha deve conter pelo menos uma letra minúscula",
      )
      .refine(
        (val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
        "Senha deve conter pelo menos um caractere especial",
      ),
    confirmPassword: z
      .string()
      .min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AdminProfile() {
  const navigate = useNavigate();
  const { user, validateSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    id?: string;
    name: string;
    email: string;
    phone?: string;
    photoUrl?: string | null;
    buildingId?: string;
  } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const phoneValue = watch("phone");

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Função para obter phone do token JWT
  const getPhoneFromToken = (): string => {
    const token =
      localStorage.getItem("coliseu_access_token") ||
      sessionStorage.getItem("coliseu_access_token");

    if (token) {
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const phone = payload.phone || payload.Phone || "";
          console.log("Telefone do token (Admin):", phone, "Payload completo:", payload);
          return phone;
        }
      } catch (e) {
        console.error("Erro ao decodificar token:", e);
      }
    }
    console.log("Token não encontrado ou inválido (Admin)");
    return "";
  };

  // Função para obter photoUrl do token JWT
  const getPhotoUrlFromToken = (): string | null => {
    const token =
      localStorage.getItem("coliseu_access_token") ||
      sessionStorage.getItem("coliseu_access_token");

    if (token) {
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const photoUrl = payload.photoUrl || payload.PhotoUrl || null;
          console.log("PhotoUrl do token (Admin):", photoUrl);
          return photoUrl;
        }
      } catch (e) {
        console.error("Erro ao decodificar token:", e);
      }
    }
    return null;
  };

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const phoneFromToken = getPhoneFromToken(); // Sempre pegar do token como fallback
        const photoUrlFromToken = getPhotoUrlFromToken(); // Pegar photoUrl do token
        console.log("Telefone obtido do token no início (Admin):", phoneFromToken);
        console.log("PhotoUrl obtido do token no início (Admin):", photoUrlFromToken);
        
        const response = await adminService.getProfile();
        if (response.success && response.data) {
          // Usar phone da API, se não houver, usar do token
          const phone = response.data.phone || phoneFromToken || "";
          // Usar photoUrl da API, se não houver, usar do token
          const photoUrl = response.data.photoUrl || photoUrlFromToken || null;
          console.log("Telefone da API (Admin):", response.data.phone, "Telefone final:", phone);
          console.log("PhotoUrl da API (Admin):", response.data.photoUrl, "PhotoUrl final:", photoUrl);
          
          const data = {
            id: (response.data as any).id || (response.data as any)._id,
            name: response.data.name,
            email: response.data.email,
            phone: phone,
            photoUrl: photoUrl,
            buildingId: response.data.buildingId,
          };
          setProfileData(data);
          const formattedPhone = formatPhoneForDisplay(data.phone);
          console.log("Telefone formatado para exibição (Admin):", formattedPhone);
          // Usar setValue para garantir que o valor seja definido
          setValue("name", data.name);
          setValue("email", data.email);
          setValue("phone", formattedPhone);
          reset({
            name: data.name,
            email: data.email,
            phone: formattedPhone,
          });
          if (data.photoUrl) {
            setPhotoPreview(data.photoUrl);
          }
        }
      } catch (error: any) {
        // Se não houver endpoint, usar dados do token
        const phoneFromToken = getPhoneFromToken();
        const photoUrlFromToken = getPhotoUrlFromToken();
        console.log("Erro ao carregar perfil, telefone do token (Admin):", phoneFromToken);
        console.log("Erro ao carregar perfil, photoUrl do token (Admin):", photoUrlFromToken);
        const fallbackData = {
          name: user?.name || "",
          email: user?.email || "",
          phone: phoneFromToken || "",
          photoUrl: photoUrlFromToken || null,
        };
        setProfileData(fallbackData);
        const formattedPhone = formatPhoneForDisplay(fallbackData.phone);
        console.log("Telefone formatado (fallback Admin):", formattedPhone);
        // Usar setValue para garantir que o valor seja definido
        setValue("name", fallbackData.name);
        setValue("email", fallbackData.email);
        setValue("phone", formattedPhone);
        reset({
          name: fallbackData.name,
          email: fallbackData.email,
          phone: formattedPhone,
        });
        if (fallbackData.photoUrl) {
          setPhotoPreview(fallbackData.photoUrl);
        }
        console.warn("Erro ao carregar perfil, usando dados do token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, reset]);

  const handlePhotoCapture = (file: File) => {
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setIsCameraOpen(false);
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(profileData?.photoUrl || null);
  };

  const formatPhoneForDisplay = (phone: string | undefined): string => {
    if (!phone || phone.trim() === "") {
      console.log("formatPhoneForDisplay (Admin): telefone vazio ou undefined");
      return "";
    }
    // Remove tudo exceto números
    const cleaned = phone.replace(/\D/g, "");
    console.log("formatPhoneForDisplay (Admin): telefone original:", phone, "limpo:", cleaned);
    
    // Se já tem o formato +5513996668888 ou similar, formata para exibição
    if (cleaned.startsWith("55") && cleaned.length >= 12) {
      const ddd = cleaned.slice(2, 4);
      const firstPart = cleaned.slice(4, 9);
      const secondPart = cleaned.slice(9, 13);
      const formatted = `+55 ${ddd} ${firstPart}-${secondPart}`;
      console.log("formatPhoneForDisplay (Admin): formatado com +55:", formatted);
      return formatted;
    }
    // Se não começa com 55 mas tem pelo menos 11 dígitos, assume que é um número brasileiro
    if (cleaned.length >= 11) {
      const ddd = cleaned.slice(0, 2);
      const firstPart = cleaned.slice(2, 7);
      const secondPart = cleaned.slice(7, 11);
      const formatted = `+55 ${ddd} ${firstPart}-${secondPart}`;
      console.log("formatPhoneForDisplay (Admin): formatado sem +55:", formatted);
      return formatted;
    }
    // Se tem menos de 11 dígitos mas não está vazio, tenta formatar mesmo assim
    if (cleaned.length > 0) {
      console.log("formatPhoneForDisplay (Admin): telefone com menos de 11 dígitos, retornando original:", phone);
      return phone;
    }
    console.log("formatPhoneForDisplay (Admin): não conseguiu formatar, retornando vazio");
    return phone; // Retorna como está se não conseguir formatar
  };

  // Função para formatar telefone para o formato esperado (+5513996668888)
  const formatPhoneForSave = (phone: string | undefined): string | undefined => {
    if (!phone) return undefined;
    // Remove tudo exceto números e +
    const cleaned = phone.replace(/\D/g, "");
    // Se não começa com 55, adiciona
    if (cleaned.length > 0 && !cleaned.startsWith("55")) {
      return `+55${cleaned}`;
    }
    // Se já começa com 55, adiciona o +
    if (cleaned.startsWith("55")) {
      return `+${cleaned}`;
    }
    return cleaned ? `+55${cleaned}` : undefined;
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);

      // Upload da foto se houver nova foto selecionada
      let uploadedPhotoUrl: string | undefined;
      if (selectedPhoto) {
        try {
          const presignedResponse = await adminService.getPhotoPresignedUrl({
            fileName: selectedPhoto.name,
            fileSize: selectedPhoto.size,
            contentType: selectedPhoto.type,
          });

          if (presignedResponse.success && presignedResponse.data) {
            await adminService.uploadPhoto(
              presignedResponse.data.presignedUrl,
              selectedPhoto
            );
            // Atualizar preview com a nova URL
            if (presignedResponse.data.photoUrl) {
              uploadedPhotoUrl = presignedResponse.data.photoUrl;
              setPhotoPreview(presignedResponse.data.photoUrl);
            }
          }
        } catch (photoError: any) {
          console.error("Erro ao fazer upload da foto:", photoError);
          if (photoError.statusCode === 404) {
            toast.error("Funcionalidade de upload de foto ainda não está disponível no backend.");
          } else {
            toast.error("Erro ao fazer upload da foto. O perfil será atualizado sem a foto.");
          }
        }
      }

      // Atualizar perfil
      try {
        const formattedPhone = formatPhoneForSave(data.phone);
        const updateResponse = await adminService.updateProfile({
          name: data.name,
          email: data.email,
          phone: formattedPhone,
          photoUrl: uploadedPhotoUrl,
          buildingId: profileData?.buildingId,
        });

        if (updateResponse.success && updateResponse.data) {
          const updatedPhone = updateResponse.data.phone || formattedPhone || "";
          setProfileData({
            id: updateResponse.data.id || profileData?.id,
            name: updateResponse.data.name,
            email: updateResponse.data.email,
            phone: updatedPhone,
            photoUrl: updateResponse.data.photoUrl || photoPreview || null,
            buildingId: profileData?.buildingId,
          });
          // Atualizar o formulário com o telefone formatado
          reset({
            name: updateResponse.data.name,
            email: updateResponse.data.email,
            phone: formatPhoneForDisplay(updatedPhone),
          });
          setSelectedPhoto(null);
          await validateSession(); // Atualizar contexto de autenticação
          toast.success("Perfil atualizado com sucesso!");
        }
      } catch (updateError: any) {
        if (updateError.statusCode === 404) {
          setIsUpdateAvailable(false);
          toast.error("Funcionalidade de atualização de perfil ainda não está disponível no backend.");
          console.warn("Endpoint PUT /v1/admins/{id} não encontrado. Aguardando implementação no backend.");
        } else {
          throw updateError;
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    try {
      setIsSavingPassword(true);
      const response = await adminService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      if (response.success) {
        toast.success("Senha alterada com sucesso!");
        resetPassword();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
      console.error("Erro ao alterar senha:", error);
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card de Informações do Perfil */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt={profileData?.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profileData?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  title="Tirar foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
                {selectedPhoto && (
                  <button
                    onClick={removePhoto}
                    className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    title="Remover foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Tirar Foto</DialogTitle>
                  </DialogHeader>
                  <CameraCapture
                    onCapture={handlePhotoCapture}
                    onCancel={() => setIsCameraOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <div className="text-center">
                <CardTitle className="text-xl">{profileData?.name || "Administrador"}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{profileData?.email || ""}</span>
              </div>
              {profileData?.phone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{formatPhoneForDisplay(profileData.phone)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Edição */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Editar Informações</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Digite seu nome completo"
                  className={errors.name ? "border-destructive" : ""}
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
                  placeholder="Digite seu email"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <MaskedInput
                  id="phone"
                  type="tel"
                  mask="+55 99 99999-9999"
                  maskChar={null}
                  value={phoneValue || ""}
                  onChange={(e) => setValue("phone", e.target.value)}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {!isUpdateAvailable && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                  <p className="font-medium">Atenção</p>
                  <p>A funcionalidade de atualização de perfil ainda não está disponível no backend. Você pode visualizar seus dados, mas não será possível salvar alterações no momento.</p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={isSaving || !isUpdateAvailable}>
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Card de Mudança de Senha */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>
              Altere sua senha de acesso ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...registerPassword("currentPassword")}
                    placeholder="Digite sua senha atual"
                    className={errorsPassword.currentPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errorsPassword.currentPassword && (
                  <p className="text-sm text-destructive">
                    {errorsPassword.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...registerPassword("newPassword")}
                    placeholder="Digite sua nova senha"
                    className={errorsPassword.newPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errorsPassword.newPassword && (
                  <p className="text-sm text-destructive">
                    {errorsPassword.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  A senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula e um caractere especial.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...registerPassword("confirmPassword")}
                    placeholder="Confirme sua nova senha"
                    className={errorsPassword.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errorsPassword.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errorsPassword.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetPassword()}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

