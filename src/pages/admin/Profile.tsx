import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Save, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { adminService } from "@/services/api";

// Schema de validação para dados do perfil
const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
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
    buildingId?: string;
  } | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

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

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getProfile();
        if (response.success && response.data) {
          const data = {
            id: (response.data as any).id || (response.data as any)._id,
            name: response.data.name,
            email: response.data.email,
            buildingId: response.data.buildingId,
          };
          setProfileData(data);
          setValue("name", data.name);
          setValue("email", data.email);
          reset({
            name: data.name,
            email: data.email,
          });
        }
      } catch (error: any) {
        // Se não houver endpoint, usar dados do token
        const fallbackData = {
          name: user?.name || "",
          email: user?.email || "",
        };
        setProfileData(fallbackData);
        setValue("name", fallbackData.name);
        setValue("email", fallbackData.email);
        reset({
          name: fallbackData.name,
          email: fallbackData.email,
        });
        console.warn("Erro ao carregar perfil, usando dados do token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, reset, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);

      // Atualizar perfil
      try {
        const updateResponse = await adminService.updateProfile({
          name: data.name,
          email: data.email,
          buildingId: profileData?.buildingId,
        });

        if (updateResponse.success && updateResponse.data) {
          setProfileData({
            id: updateResponse.data.id || profileData?.id,
            name: updateResponse.data.name,
            email: updateResponse.data.email,
            buildingId: profileData?.buildingId,
          });
          reset({
            name: updateResponse.data.name,
            email: updateResponse.data.email,
          });
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
                <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
                  {profileData?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || <User className="h-12 w-12" />}
                </div>
              </div>
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
