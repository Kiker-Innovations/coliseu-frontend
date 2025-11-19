import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  conciergeSchema,
  type ConciergeSchema,
} from "@/schemas/admin/concierge.schema";
import ConciergeSkeleton from "@/skeleton/admin/ConciergeSkeleton";
import { UserPlus, Edit, Trash2, RefreshCw, KeyRound, Copy, Shield, Eye } from "lucide-react";
import { registerConcierge, listConcierges, updateConcierge, deleteConcierge as apiDeleteConcierge, forgetPasswordConcierge, type Concierge } from "@/services/concierge.service";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/api";

export default function Concierge() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedForReset, setSelectedForReset] = useState<Concierge | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Concierge | null>(null);
  const [buildingId, setBuildingId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        // Buscar buildingId do admin logado
        const token = localStorage.getItem("coliseu_access_token") || sessionStorage.getItem("coliseu_access_token");
        
        if (!token) {
          toast.error("Token não encontrado. Faça login novamente.");
          setIsLoading(false);
          return;
        }

        try {
          // Tentar buscar da API primeiro
          const adminResponse = await adminService.getCurrentAdmin();
          if (adminResponse.success && adminResponse.data?.buildingId) {
            setBuildingId(adminResponse.data.buildingId);
          }
        } catch (error: any) {
          console.warn("Não foi possível buscar o perfil do admin:", error);
          // Tentar decodificar o token JWT como fallback
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              if (payload.buildingId) {
                setBuildingId(payload.buildingId);
              }
            }
          } catch (decodeError) {
            console.warn("Não foi possível decodificar o token:", decodeError);
          }
        }

        const items = await listConcierges();
        setConcierges(items);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar porteiros");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const form = useForm<ConciergeSchema>({
    resolver: zodResolver(conciergeSchema),
    defaultValues: { name: "", email: "", phone: "", shift: "MANHA", passwordHash: "", status: "ATIVO" },
  });

  const randomPassword = useMemo(() => {
    return () => {
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const digits = "0123456789"; // permitido, não obrigatório pelo schema, mas ajuda força
      const special = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?";
      const all = upper + lower + digits + special;

      const pick = (set: string) => set[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * set.length)];

      const requiredChars = [pick(upper), pick(lower), pick(special)];
      const targetLen = 12;
      const remainingLen = targetLen - requiredChars.length;
      const rest: string[] = [];
      for (let i = 0; i < remainingLen; i++) {
        rest.push(pick(all));
      }
      const combined = [...requiredChars, ...rest];
      // shuffle
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }
      const value = combined.join("");
      form.setValue("passwordHash", value, { shouldDirty: true });
    };
  }, [form]);

  const [concierges, setConcierges] = useState<Concierge[]>([]);

  const handleEdit = (c: Concierge) => {
    navigate(`/admin/concierge/edit/${c.id}`);
  };

  const handleDelete = (c: Concierge) => {
    setSelectedForDelete(c);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedForDelete) return;
    try {
      await apiDeleteConcierge(selectedForDelete.id);
      setConcierges((prev) => prev.filter((c) => c.id !== selectedForDelete.id));
      toast.success("Porteiro removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedForDelete(null);
    } catch {
      toast.error("Erro ao remover porteiro");
    }
  };

  const handleResetPassword = (c: Concierge) => {
    setSelectedForReset(c);
    setIsResetDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedForReset) return;
    try {
      await forgetPasswordConcierge(selectedForReset.email);
      toast.success("E-mail de redefinição de senha enviado com sucesso!");
      setIsResetDialogOpen(false);
      setSelectedForReset(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao solicitar redefinição de senha");
    }
  };

  const onSubmit = async (data: ConciergeSchema) => {
    try {
      // Verificar se buildingId está disponível, se não buscar novamente
      let currentBuildingId = buildingId;
      
      if (!currentBuildingId) {
        // Tentar buscar novamente se não estiver disponível
        const token = localStorage.getItem("coliseu_access_token") || sessionStorage.getItem("coliseu_access_token");
        
        if (!token) {
          toast.error("Token não encontrado. Faça login novamente.");
          return;
        }

        try {
          const adminResponse = await adminService.getCurrentAdmin();
          if (adminResponse.success && adminResponse.data?.buildingId) {
            currentBuildingId = adminResponse.data.buildingId;
            setBuildingId(currentBuildingId);
          } else {
            // Tentar decodificar o token JWT como fallback
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              if (payload.buildingId) {
                currentBuildingId = payload.buildingId;
                setBuildingId(currentBuildingId);
              }
            }
          }
        } catch (error: any) {
          toast.error("Erro ao obter buildingId. Faça login novamente.");
          return;
        }

        if (!currentBuildingId) {
          toast.error("buildingId não encontrado. Faça login novamente.");
          return;
        }
      }

      await new Promise((r) => setTimeout(r, 700));
      if (false) {
        // Edição não é feita nesta tela
      } else {
        await registerConcierge({
          buildingId: currentBuildingId,
          name: data.name,
          email: data.email,
          password: data.passwordHash,
          phone: data.phone,
          shift: data.shift,
          status: data.status,
        });
        // reload list after create to sync with backend ids
        const items = await listConcierges();
        setConcierges(items);
        toast.success("Porteiro cadastrado com sucesso!");
      }
      form.reset({ name: "", email: "", phone: "", shift: "MANHA", passwordHash: "", status: "ATIVO" });
      setActiveTab("list");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar porteiro");
    }
  };

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portaria</h1>
          <p className="text-muted-foreground">Gerencie os porteiros do condomínio</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Listar</TabsTrigger>
          <TabsTrigger value="create">Cadastrar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {concierges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">Nenhum porteiro cadastrado</p>
                <p className="text-sm text-muted-foreground mt-2">Cadastre um novo porteiro na aba "Cadastrar"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {concierges.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          {c.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{c.email}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">
                            {c.shift === "MANHA" && "Manhã"}
                            {c.shift === "TARDE" && "Tarde"}
                            {c.shift === "NOITE" && "Noite"}
                          </Badge>
                          {c.status && (
                            <Badge variant={c.status === "ATIVO" ? "default" : c.status === "DE_FERIAS" ? "secondary" : "destructive"}>
                              {c.status === "ATIVO" && "Ativo"}
                              {c.status === "INATIVO" && "Inativo"}
                              {c.status === "DE_FERIAS" && "De Férias"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/concierge/view/${c.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleResetPassword(c)}>
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(c)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Editar Porteiro" : "Cadastrar Porteiro"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Linha 1: Nome e E-mail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" placeholder="Nome completo" {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="email@exemplo.com" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Linha 2: Telefone e Turno */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="+5511999999999" {...form.register("phone")} />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Turno</Label>
                    <Select value={form.watch("shift")} onValueChange={(v) => form.setValue("shift", v as any, { shouldDirty: true })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANHA">Manhã</SelectItem>
                        <SelectItem value="TARDE">Tarde</SelectItem>
                        <SelectItem value="NOITE">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.shift && (
                      <p className="text-sm text-destructive">{form.formState.errors.shift.message}</p>
                    )}
                  </div>
                </div>

                {/* Linha 3: Status e Senha (apenas no create) */}
                {activeTab === "create" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as any, { shouldDirty: true })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                          <SelectItem value="DE_FERIAS">De Férias</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.status && (
                        <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordHash">Senha Inicial</Label>
                      <div className="flex gap-2">
                        <Input id="passwordHash" type="text" placeholder="Gerar ou digitar senha" {...form.register("passwordHash")} />
                        <Button type="button" variant="outline" onClick={randomPassword}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(form.getValues("passwordHash") || "");
                              toast.success("Senha copiada para a área de transferência");
                            } catch {}
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      {form.formState.errors.passwordHash && (
                        <p className="text-sm text-destructive">{form.formState.errors.passwordHash.message}</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Button type="submit" className="w-full">{editingId ? "Salvar Alterações" : "Cadastrar"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isResetDialogOpen} onOpenChange={() => setIsResetDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Enviaremos um e-mail para {selectedForReset?.email} com instruções de redefinição de senha (simulação).
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4">
            <Button className="flex-1" onClick={confirmResetPassword}>Enviar E-mail</Button>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o porteiro <strong>{selectedForDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


