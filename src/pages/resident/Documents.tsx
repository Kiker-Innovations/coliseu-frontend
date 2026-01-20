import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentsSkeleton from "@/skeleton/resident/DocumentsSkeleton";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, HardDrive, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { documentsService, ApiClientError, type Document } from "@/services/api";
import { usePageRefresh } from "@/hooks/use-page-refresh";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
	ResponsiveModalBody,
} from "@/components/ui/responsive-modal";

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
	const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
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

	// Register refresh function for pull-to-refresh
	usePageRefresh({ onRefresh: loadDocuments });

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
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
					Documentos
				</h1>
				<p className="text-sm sm:text-base text-muted-foreground">
					Acesse e baixe os documentos do condomínio
				</p>
			</div>

			{documents.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
						<FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
						<h3 className="text-base sm:text-lg font-semibold mb-2">
							Nenhum documento disponível
						</h3>
						<p className="text-sm sm:text-base text-muted-foreground text-center max-w-md px-4">
							Quando o administrador publicar documentos, eles aparecerão aqui.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{documents.map((doc) => (
						<Card 
							key={doc._id} 
							className="mobile-card hover:shadow-lg transition-shadow"
						>
							<CardHeader className="pb-2 sm:pb-3">
								<div className="flex items-start justify-between gap-2">
									<FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
									<Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
										{getFileExtension(doc.fileName)}
									</Badge>
								</div>
								<CardTitle className="text-base sm:text-lg line-clamp-1">
									{doc.name}
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm line-clamp-2">
									{doc.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 sm:space-y-4">
								<div className="text-xs sm:text-sm text-muted-foreground space-y-1">
									<p className="flex items-center gap-1">
										<HardDrive className="w-3 h-3 shrink-0" />
										<span className="font-medium">Tamanho:</span>{" "}
										<span className="truncate">{formatFileSize(doc.fileSize)}</span>
									</p>
									<p className="flex items-center gap-1">
										<Calendar className="w-3 h-3 shrink-0" />
										<span className="font-medium">Publicado:</span>{" "}
										{new Date(doc.createdAt).toLocaleDateString("pt-BR")}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										onClick={() => handleView(doc)}
										variant="outline"
										className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
									>
										<Eye className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
										Ver
									</Button>
									<Button
										onClick={() => handleDownload(doc)}
										variant="default"
										className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
									>
										<Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
										Baixar
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<ResponsiveModal open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
				<ResponsiveModalContent className="max-w-4xl h-[85vh] sm:h-[80vh]">
					<ResponsiveModalHeader>
						<ResponsiveModalTitle className="line-clamp-1">
							{selectedDocument?.name || "Visualizar Documento"}
						</ResponsiveModalTitle>
					</ResponsiveModalHeader>
					<ResponsiveModalBody className="flex-1 overflow-hidden p-0 sm:p-4">
						<iframe
							src={selectedDocument?.url}
							className="w-full h-full min-h-[60vh] border rounded"
							title={selectedDocument?.name}
						/>
					</ResponsiveModalBody>
				</ResponsiveModalContent>
			</ResponsiveModal>
		</div>
	);
};

export default Documents;
