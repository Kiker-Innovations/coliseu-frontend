import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Regimento Interno 2025",
    description: "Documento completo com as regras e regulamentos do condomínio",
    fileUrl: "/placeholder.pdf",
    fileName: "regimento-interno-2025.pdf",
    fileSize: "2.5 MB",
    uploadDate: "15/01/2025",
  },
  {
    id: "2",
    title: "Ata da Assembleia - Janeiro 2025",
    description: "Ata da última assembleia geral ordinária",
    fileUrl: "/placeholder.pdf",
    fileName: "ata-assembleia-jan-2025.pdf",
    fileSize: "1.2 MB",
    uploadDate: "20/01/2025",
  },
  {
    id: "3",
    title: "Demonstrativo Financeiro - Dezembro 2024",
    description: "Balanço financeiro do mês de dezembro",
    fileUrl: "/placeholder.pdf",
    fileName: "financeiro-dez-2024.pdf",
    fileSize: "850 KB",
    uploadDate: "05/01/2025",
  },
];

const Documents = () => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  const handleDownload = (doc: Document) => {
    // Simulated download - in real implementation, would download the actual file
    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Documentos</h1>
        <p className="text-muted-foreground">
          Acesse e baixe os documentos importantes do condomínio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary mb-2" />
              </div>
              <CardTitle className="text-lg">{doc.title}</CardTitle>
              <CardDescription>{doc.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Arquivo:</span> {doc.fileName}
                </p>
                <p>
                  <span className="font-medium">Tamanho:</span> {doc.fileSize}
                </p>
                <p>
                  <span className="font-medium">Data:</span> {doc.uploadDate}
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={selectedDocument?.fileUrl}
              className="w-full h-full border rounded"
              title={selectedDocument?.title}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
