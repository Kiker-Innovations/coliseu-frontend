import { useState, useEffect, useCallback } from "react";
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
  FileText,
  Calendar,
  Download,
  Edit,
  Trash2,
  Upload,
  X,
  Eye,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import {
  documentSchema,
  documentUpdateSchema,
  type DocumentSchema,
  type DocumentUpdateSchema,
  ACCEPTED_FILE_TYPES,
} from "@/schemas/admin/documents.schema";
import {
  documentsService,
  ApiClientError,
  type Document,
} from "@/services/api";
import DocumentsSkeleton from "@/skeleton/admin/DocumentsSkeleton";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toUpperCase() || "ARQUIVO";
};

export default function AdminDocuments() {
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<DocumentSchema>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editForm = useForm<DocumentUpdateSchema>({
    resolver: zodResolver(documentUpdateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await documentsService.getAll();
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao carregar documentos");
      } else {
        toast.error("Erro ao carregar documentos");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

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

  const onSubmit = async (data: DocumentSchema) => {
    try {
      const file = data.file[0];

      const response = await documentsService.create({
        name: data.name,
        description: data.description,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      if (response.success && response.data) {
        await documentsService.uploadFile(response.data.presignedUrl, file);
        toast.success(
          "Documento publicado com sucesso! Os moradores serão notificados."
        );
        form.reset();
        setSelectedFile(null);
        loadDocuments();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao publicar documento");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao publicar documento");
      }
    }
  };

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    editForm.reset({
      name: doc.name,
      description: doc.description,
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: DocumentUpdateSchema) => {
    if (!selectedDocument) return;

    try {
      const response = await documentsService.update(
        selectedDocument._id,
        data
      );
      if (response.success) {
        toast.success("Documento atualizado com sucesso!");
        setIsEditDialogOpen(false);
        setSelectedDocument(null);
        loadDocuments();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao atualizar documento");
      } else {
        toast.error("Erro ao atualizar documento");
      }
    }
  };

  const handleDeleteDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    try {
      const response = await documentsService.delete(selectedDocument._id);
      if (response.success) {
        toast.success("Documento removido com sucesso!");
        setIsDeleteDialogOpen(false);
        setSelectedDocument(null);
        loadDocuments();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao remover documento");
      } else {
        toast.error("Erro ao remover documento");
      }
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.url, "_blank");
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedDocument(null);
    editForm.reset();
  };

  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentos</h1>
        <p className="text-muted-foreground">
          Publique e gerencie documentos importantes para os moradores
        </p>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Documentos Publicados</TabsTrigger>
          <TabsTrigger value="publish">Publicar Novo Documento</TabsTrigger>
        </TabsList>

        {/* Aba de Visualização */}
        <TabsContent value="view" className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum documento publicado
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Publique documentos importantes para que os moradores possam
                  acessá-los.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc) => (
                <Card key={doc._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          {doc.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {doc.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Publicado em{" "}
                              {new Date(doc.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            <HardDrive className="w-3 h-3 mr-1" />
                            {formatFileSize(doc.fileSize)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getFileExtension(doc.fileName)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDocument(doc)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc)}
                          title="Remover"
                          className="text-destructive hover:text-destructive"
                        >
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

        {/* Aba de Publicação */}
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>Publicar Novo Documento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Este documento será notificado por e-mail para todos os
                moradores ativos
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Documento</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Regimento Interno 2025"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o conteúdo do documento..."
                    rows={4}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo</Label>
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
                      Tamanho: {formatFileSize(selectedFile.size)}
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

                <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-3 rounded-md">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    📧 Notificação por E-mail
                  </p>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                    <li>Todos os moradores ativos serão notificados</li>
                    <li>Arquivos até 25MB serão enviados em anexo no e-mail</li>
                    <li>Arquivos maiores terão apenas o link para download</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={form.formState.isSubmitting}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {form.formState.isSubmitting
                      ? "Publicando..."
                      : "Publicar Documento"}
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

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogDescription>
              Atualize as informações do documento
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Documento</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Regimento Interno 2025"
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                placeholder="Descreva o conteúdo do documento..."
                rows={4}
                {...editForm.register("description")}
              />
              {editForm.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={editForm.formState.isSubmitting}
              >
                {editForm.formState.isSubmitting
                  ? "Salvando..."
                  : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditDialog}
                disabled={editForm.formState.isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex-1 overflow-hidden">
            <iframe
              src={selectedDocument?.url}
              className="w-full h-full border rounded"
              title={selectedDocument?.name}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o documento "
              {selectedDocument?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
