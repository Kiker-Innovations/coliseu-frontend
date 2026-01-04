import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Megaphone,
  Calendar,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  noticeSchema,
  type NoticeSchema,
} from "@/schemas/admin/notices.schema";
import {
  noticesService,
  ApiClientError,
  type Notice,
  type NoticeDetail,
} from "@/services/api";
import NoticesSkeleton from "@/skeleton/admin/NoticesSkeleton";

export default function Notices() {
  const [isLoading, setIsLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ATIVO" | "INATIVO" | "ALL">("ATIVO");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [selectedNoticeDetail, setSelectedNoticeDetail] = useState<NoticeDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [deletedNote, setDeletedNote] = useState("");
  const [pendingNoticeData, setPendingNoticeData] = useState<NoticeSchema | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const form = useForm<NoticeSchema>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
      status: "ATIVO", // Sempre ATIVO ao criar
    },
  });

  const loadNotices = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      const response = await noticesService.getAll(params);
      if (response.success && response.data) {
        setNotices(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setPage(response.data.page);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao carregar avisos");
      } else {
        toast.error("Erro ao carregar avisos");
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("file", e.target.files as FileList, {
        shouldValidate: true,
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    form.setValue("file", undefined as any, { shouldValidate: true });
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const onSubmit = (data: NoticeSchema) => {
    // Abrir dialog de confirmação antes de publicar
    setPendingNoticeData(data);
    setIsPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    if (!pendingNoticeData) return;

    try {
      const file = pendingNoticeData.file?.[0];

      if (!file) {
        toast.error("Arquivo é obrigatório");
        setIsPublishDialogOpen(false);
        setPendingNoticeData(null);
        return;
      }

      const response = await noticesService.create({
        title: pendingNoticeData.title,
        content: pendingNoticeData.content,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: "ATIVO", // Sempre ATIVO ao criar
      });

      if (response.success && response.data) {
        await noticesService.uploadFile(response.data.presignedUrl, file);
        toast.success("Aviso publicado com sucesso! Os condôminos serão notificados por email.");
        form.reset();
        setSelectedFile(null);
        setIsPublishDialogOpen(false);
        setPendingNoticeData(null);
        loadNotices();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao publicar aviso");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao publicar aviso");
      }
    }
  };

  const handleViewNotice = async (notice: Notice) => {
    try {
      setIsLoadingDetail(true);
      setIsViewDialogOpen(true);
      const response = await noticesService.getById(notice._id);
      if (response.success && response.data) {
        setSelectedNoticeDetail(response.data);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao carregar detalhes do aviso");
      } else {
        toast.error("Erro ao carregar detalhes do aviso");
      }
      setIsViewDialogOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDeleteNotice = (notice: Notice) => {
    if (notice.status !== "ATIVO") {
      toast.error("Apenas avisos ativos podem ser deletados");
      return;
    }
    setSelectedNotice(notice);
    setDeletedNote("");
    setIsDeleteDialogOpen(true);
  };

  const handleDownload = (noticeDetail: NoticeDetail) => {
    window.open(noticeDetail.url, "_blank");
  };

  const handleDownloadNotice = async (notice: Notice) => {
    try {
      setIsLoadingDetail(true);
      const response = await noticesService.getById(notice._id);
      if (response.success && response.data) {
        window.open(response.data.url, "_blank");
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao baixar arquivo do aviso");
      } else {
        toast.error("Erro ao baixar arquivo do aviso");
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const confirmDelete = async () => {
    if (!selectedNotice) return;

    if (!deletedNote || deletedNote.trim().length === 0) {
      toast.error("Por favor, informe o motivo da deleção");
      return;
    }

    try {
      const response = await noticesService.delete(
        selectedNotice._id,
        deletedNote.trim()
      );
      if (response.success) {
        toast.success("Aviso deletado com sucesso!");
        setIsDeleteDialogOpen(false);
        setSelectedNotice(null);
        setDeletedNote("");
        loadNotices();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao deletar aviso");
      } else {
        toast.error("Erro ao deletar aviso");
      }
    }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Filtrar por status:</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "ATIVO" | "INATIVO" | "ALL");
                  setPage(1); // Resetar para primeira página ao mudar filtro
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="ALL">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {notices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum aviso publicado
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Publique avisos importantes para que os moradores possam
                  visualizá-los.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notices.map((notice) => (
                <Card key={notice._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Megaphone className="w-5 h-5 text-primary" />
                          {notice.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Publicado em{" "}
                              {new Date(notice.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <Badge
                            variant={
                              notice.status === "ATIVO" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {notice.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewNotice(notice)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadNotice(notice)}
                          title="Baixar"
                          disabled={isLoadingDetail}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {notice.status === "ATIVO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNotice(notice)}
                            title="Remover"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      if (totalPages <= 7) return true;
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (Math.abs(pageNum - page) <= 1) return true;
                      return false;
                    })
                    .map((pageNum, index, array) => {
                      const showEllipsisBefore =
                        index > 0 && pageNum - array[index - 1] > 1;
                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <span className="px-3 py-1">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <Button
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="min-w-[2.5rem]"
                            >
                              {pageNum}
                            </Button>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    })}
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="gap-1"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Informações de paginação */}
          {total > 0 && (
            <div className="text-sm text-muted-foreground text-center mt-4">
              Mostrando {notices.length} de {total} aviso(s) - Página {page} de{" "}
              {totalPages}
            </div>
          )}
        </TabsContent>

        {/* Aba de Publicação */}
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>Publicar Novo Aviso</CardTitle>
              <p className="text-sm text-muted-foreground">
                Este aviso será visível para todos os condôminos
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
                  <Label htmlFor="content">Conteúdo</Label>
                  <RichTextEditor
                    value={form.watch("content") || ""}
                    onChange={(value) => form.setValue("content", value)}
                    placeholder="Descreva os detalhes do aviso..."
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Anexo (Opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpeg,.jpg,.png"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("file")?.click()}
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
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, DOC, DOCX, PPT, PPTX, JPEG, PNG (máx.
                    300MB)
                  </p>
                  {form.formState.errors.file && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.file.message}
                    </p>
                  )}
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
                    onClick={() => {
                      form.reset();
                      setSelectedFile(null);
                    }}
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

      {/* Dialog de Confirmação de Publicação */}
      <AlertDialog
        open={isPublishDialogOpen}
        onOpenChange={(open) => {
          setIsPublishDialogOpen(open);
          if (!open) {
            setPendingNoticeData(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Publicação do Aviso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja publicar este aviso? Ele será enviado por email
              para todos os condôminos cadastrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingNoticeData && (
            <div className="space-y-2 py-4">
              <div>
                <Label className="text-sm font-semibold">Título:</Label>
                <p className="text-sm text-muted-foreground">{pendingNoticeData.title}</p>
              </div>
                  <div>
                    <Label className="text-sm font-semibold">Conteúdo:</Label>
                    <div
                      className="line-clamp-3 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary"
                      dangerouslySetInnerHTML={{ __html: pendingNoticeData.content }}
                    />
                  </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingNoticeData(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>
              Sim, Publicar Aviso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Visualização */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            setSelectedNoticeDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Carregando detalhes do aviso...</p>
            </div>
          ) : selectedNoticeDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  {selectedNoticeDetail.title}
                </DialogTitle>
                <DialogDescription>
                  Visualize todos os detalhes do aviso
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Informações do Aviso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Aviso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Título</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedNoticeDetail.title}
                      </p>
                    </div>
                    
                      <div>
                        <Label className="text-sm font-semibold">Conteúdo</Label>
                        <div
                          className="mt-1 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary"
                          dangerouslySetInnerHTML={{ __html: selectedNoticeDetail.content }}
                        />
                      </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Status</Label>
                        <div className="mt-1">
                          <Badge
                            variant={
                              selectedNoticeDetail.status === "ATIVO"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedNoticeDetail.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold">Data de Criação</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(selectedNoticeDetail.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold">Nome do Arquivo</Label>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {selectedNoticeDetail.fileName}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Visualização do Arquivo */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Visualização do Arquivo</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(selectedNoticeDetail)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
                      {selectedNoticeDetail.mimeType.startsWith("image/") ? (
                        <img
                          src={selectedNoticeDetail.url}
                          alt={selectedNoticeDetail.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <iframe
                          src={selectedNoticeDetail.url}
                          className="w-full h-full"
                          title={selectedNoticeDetail.title}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum aviso selecionado</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Aviso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o aviso "
              {selectedNotice?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-3 rounded-md my-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>⚠️ Atenção:</strong> A remoção deste aviso não deletará os emails
              já enviados aos condôminos. Os emails permanecerão nas caixas de entrada
              dos destinatários.
            </p>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletedNote">
                Motivo da deleção <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="deletedNote"
                placeholder="Informe o motivo da deleção do aviso..."
                rows={4}
                value={deletedNote}
                onChange={(e) => setDeletedNote(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 3 caracteres
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletedNote("");
                setSelectedNotice(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deletedNote || deletedNote.trim().length < 3}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
