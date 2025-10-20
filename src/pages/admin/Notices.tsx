import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Calendar,
  Paperclip,
  Edit,
  Trash2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  noticeSchema,
  type NoticeSchema,
} from "@/schemas/admin/notices.schema";
import NoticesSkeleton from "@/skeleton/admin/NoticesSkeleton";

export default function Notices() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const form = useForm<NoticeSchema>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Mock data - avisos publicados
  const notices = [
    {
      id: 1,
      title: "Manutenção do Elevador 2",
      description:
        "Informamos que o elevador 2 passará por manutenção preventiva no dia 25/10. Durante o período das 8h às 17h, ele ficará indisponível. Pedimos a compreensão de todos.",
      publishedAt: "2025-10-18T10:00:00",
      hasAttachment: false,
    },
    {
      id: 2,
      title: "Limpeza da Caixa D'água",
      description:
        "A limpeza da caixa d'água está agendada para o dia 28/10. Haverá interrupção no fornecimento de água das 9h às 15h. Recomendamos que façam reserva de água para esse período.",
      publishedAt: "2025-10-17T14:30:00",
      hasAttachment: true,
      attachmentName: "cronograma-limpeza.pdf",
    },
    {
      id: 3,
      title: "Nova Portaria de Acesso",
      description:
        "A partir de 01/11, todos os visitantes deverão apresentar documento com foto na portaria. O cadastro prévio através do aplicativo facilitará o acesso. Confira o manual em anexo.",
      publishedAt: "2025-10-15T09:00:00",
      hasAttachment: true,
      attachmentName: "manual-portaria.pdf",
    },
    {
      id: 4,
      title: "Coleta de Lixo Reciclável",
      description:
        "Lembramos que a coleta de lixo reciclável acontece todas as terças e quintas-feiras. Pedimos que separem adequadamente os materiais recicláveis dos orgânicos.",
      publishedAt: "2025-10-12T08:00:00",
      hasAttachment: false,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    form.setValue("attachmentFile", undefined);
  };

  const onSubmit = async (data: NoticeSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingNoticeId) {
        toast.success("Aviso atualizado com sucesso!");
      } else {
        toast.success("Aviso publicado com sucesso para todos os condôminos!");
      }

      form.reset();
      setSelectedFile(null);
      setIsDialogOpen(false);
      setEditingNoticeId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar aviso");
    }
  };

  const handleEditNotice = (notice: any) => {
    setEditingNoticeId(notice.id);
    form.reset({
      title: notice.title,
      description: notice.description,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteNotice = async (noticeId: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Aviso removido com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover aviso");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNoticeId(null);
    setSelectedFile(null);
    form.reset();
  };

  if (isLoading) {
    return <NoticesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Avisos</h1>
        <p className="text-muted-foreground">
          Publique avisos importantes para todos os condôminos
        </p>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Visualizar Avisos</TabsTrigger>
          <TabsTrigger value="publish">Publicar Novo Aviso</TabsTrigger>
        </TabsList>

        {/* Aba de Visualização */}
        <TabsContent value="view" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {notices.map((notice) => (
              <Card key={notice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        {notice.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        {notice.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Publicado em{" "}
                            {new Date(notice.publishedAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                        {notice.hasAttachment && (
                          <Badge variant="secondary" className="text-xs">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {notice.attachmentName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditNotice(notice)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteNotice(notice.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba de Publicação */}
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>Publicar Novo Aviso</CardTitle>
              <p className="text-sm text-muted-foreground">
                Este aviso será enviado para todos os condôminos cadastrados
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Manutenção Programada"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os detalhes do aviso..."
                    rows={6}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Anexo (Opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachment"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("attachment")?.click()
                      }
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {selectedFile ? selectedFile.name : "Selecionar arquivo"}
                    </Button>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={form.formState.isSubmitting}
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    {form.formState.isSubmitting
                      ? "Publicando..."
                      : "Publicar Aviso"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={form.formState.isSubmitting}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Aviso</DialogTitle>
            <DialogDescription>
              Atualize as informações do aviso
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                placeholder="Ex: Manutenção Programada"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                placeholder="Descreva os detalhes do aviso..."
                rows={6}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-attachment">Anexo (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-attachment"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("edit-attachment")?.click()
                  }
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Selecionar arquivo"}
                </Button>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
