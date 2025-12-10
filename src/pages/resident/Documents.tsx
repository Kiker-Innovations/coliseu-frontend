import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DocumentsSkeleton from "@/skeleton/resident/DocumentsSkeleton";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, HardDrive, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  documentsService,
  ApiClientError,
  type Document,
} from "@/services/api";

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

const Documents = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.url, "_blank");
  };

  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Documentos</h1>
        <p className="text-muted-foreground">
          Acesse e baixe os documentos importantes do condomínio
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum documento disponível
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Quando o administrador publicar documentos, eles aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <Badge variant="outline" className="text-xs">
                    {getFileExtension(doc.fileName)}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{doc.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {doc.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span className="font-medium">Tamanho:</span>{" "}
                    {formatFileSize(doc.fileSize)}
                  </p>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">Publicado em:</span>{" "}
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleView(doc)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button
                    onClick={() => handleDownload(doc)}
                    variant="default"
                    className="flex-1"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
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
    </div>
  );
};

export default Documents;
