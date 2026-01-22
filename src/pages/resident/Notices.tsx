import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Megaphone, Calendar, Eye, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { noticesService, ApiClientError, type Notice, type NoticeDetail } from "@/services/api";
import NoticesSkeleton from "@/skeleton/resident/NoticesSkeleton";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
	ResponsiveModalDescription,
	ResponsiveModalBody,
} from "@/components/ui/responsive-modal";

const Notices = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [notices, setNotices] = useState<Notice[]>([]);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedNoticeDetail, setSelectedNoticeDetail] = useState<NoticeDetail | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	const loadNotices = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await noticesService.getAll({
				status: "ATIVO",
				page,
				limit,
			});
			if (response.success && response.data) {
				setNotices(response.data.data);
				setTotal(response.data.total);
				setTotalPages(response.data.totalPages);
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
	}, [page, limit]);

	useEffect(() => {
		loadNotices();
	}, [loadNotices]);

	const handleViewNotice = async (notice: Notice) => {
		try {
			setIsLoadingDetail(true);
			const response = await noticesService.getById(notice._id);
			if (response.success && response.data) {
				setSelectedNoticeDetail(response.data);
				setIsViewDialogOpen(true);
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

	if (isLoading) {
		return <NoticesSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Avisos</h1>
				<p className="text-sm sm:text-base text-muted-foreground">
					Acompanhe os avisos importantes do condomínio
				</p>
			</div>

			{notices.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
						<Megaphone className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
						<h3 className="text-base sm:text-lg font-semibold mb-2">
							Nenhum aviso disponível
						</h3>
						<p className="text-sm sm:text-base text-muted-foreground text-center max-w-md px-4">
							Quando o administrador publicar avisos, eles aparecerão aqui.
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					<div className="grid grid-cols-1 gap-3 sm:gap-4">
						{notices.map((notice) => (
							<Card key={notice._id} className="mobile-card">
								<CardHeader className="pb-2 sm:pb-3">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
										<div className="flex-1 min-w-0">
											<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
												<Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
												<span className="truncate">{notice.title}</span>
											</CardTitle>
											<div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
												<div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
													<Calendar className="w-3 h-3 shrink-0" />
													<span>
														{new Date(notice.createdAt).toLocaleDateString("pt-BR")}
													</span>
												</div>
												<Badge variant="default" className="text-[10px] sm:text-xs">
													{notice.status}
												</Badge>
											</div>
										</div>
										<div className="flex gap-2 shrink-0">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleViewNotice(notice)}
												title="Visualizar"
												className="h-8 w-8 sm:h-9 sm:w-9 p-0"
											>
												<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleDownloadNotice(notice)}
												title="Baixar"
												disabled={isLoadingDetail}
												className="h-8 w-8 sm:h-9 sm:w-9 p-0"
											>
												<Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
											</Button>
										</div>
									</div>
								</CardHeader>
							</Card>
						))}
					</div>

					{/* Paginação */}
					{totalPages > 1 && (
						<div className="flex justify-center mt-4 sm:mt-6">
							<Pagination>
								<PaginationContent className="gap-1 sm:gap-2">
									<PaginationItem>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((prev) => Math.max(1, prev - 1))}
											disabled={page === 1}
											className="gap-1 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
										>
											<ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">Anterior</span>
										</Button>
									</PaginationItem>
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((p) => {
											if (totalPages <= 5) return true;
											if (p === 1 || p === totalPages) return true;
											if (Math.abs(p - page) <= 1) return true;
											return false;
										})
										.map((p, index, array) => {
											const showEllipsisBefore = index > 0 && p - array[index - 1] > 1;
											return (
												<React.Fragment key={p}>
													{showEllipsisBefore && (
														<PaginationItem>
															<span className="px-1 sm:px-2 text-xs sm:text-sm">...</span>
														</PaginationItem>
													)}
													<PaginationItem>
														<Button
															variant={page === p ? "default" : "outline"}
															size="sm"
															onClick={() => setPage(p)}
															className="min-w-[2rem] sm:min-w-[2.5rem] h-8 sm:h-9 text-xs sm:text-sm"
														>
															{p}
														</Button>
													</PaginationItem>
												</React.Fragment>
											);
										})}
									<PaginationItem>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
											disabled={page === totalPages}
											className="gap-1 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
										>
											<span className="hidden sm:inline">Próxima</span>
											<ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
										</Button>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}

					{/* Informações de paginação */}
					{total > 0 && (
						<div className="text-xs sm:text-sm text-muted-foreground text-center mt-3 sm:mt-4">
							{notices.length} de {total} aviso(s) - Página {page}/{totalPages}
						</div>
					)}
				</>
			)}

			{/* Dialog de Visualização - Responsivo */}
			<ResponsiveModal
				open={isViewDialogOpen}
				onOpenChange={(open) => {
					setIsViewDialogOpen(open);
					if (!open) setSelectedNoticeDetail(null);
				}}
			>
				<ResponsiveModalContent className="max-w-5xl h-[90vh] sm:h-[85vh]">
					<ResponsiveModalHeader>
						{isLoadingDetail ? (
							<ResponsiveModalTitle>Carregando...</ResponsiveModalTitle>
						) : selectedNoticeDetail ? (
							<>
								<ResponsiveModalTitle className="flex items-center gap-2">
									<Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
									<span className="truncate">{selectedNoticeDetail.title}</span>
								</ResponsiveModalTitle>
								<ResponsiveModalDescription>
									Detalhes do aviso
								</ResponsiveModalDescription>
							</>
						) : (
							<ResponsiveModalTitle>Detalhes do Aviso</ResponsiveModalTitle>
						)}
					</ResponsiveModalHeader>
					{isLoadingDetail ? (
						<div className="flex items-center justify-center h-full">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					) : selectedNoticeDetail ? (
						<ResponsiveModalBody className="flex-1 overflow-y-auto space-y-4">
								{/* Informações do Aviso */}
								<Card>
								<CardHeader className="pb-2 sm:pb-3">
									<CardTitle className="text-base sm:text-lg">Informações</CardTitle>
									</CardHeader>
								<CardContent className="space-y-3 sm:space-y-4">
										<div>
										<Label className="text-xs sm:text-sm font-semibold">Título</Label>
										<p className="text-sm sm:text-base text-muted-foreground mt-1">
												{selectedNoticeDetail.title}
											</p>
										</div>

										<div>
										<Label className="text-xs sm:text-sm font-semibold">Conteúdo</Label>
											<div
											className="mt-1 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground text-sm sm:text-base"
												dangerouslySetInnerHTML={{ __html: selectedNoticeDetail.content }}
											/>
										</div>

									<div className="grid grid-cols-2 gap-3 sm:gap-4">
											<div>
											<Label className="text-xs sm:text-sm font-semibold">Status</Label>
												<div className="mt-1">
													<Badge
														variant={
															selectedNoticeDetail.status === "ATIVO" ? "default" : "secondary"
														}
													className="text-[10px] sm:text-xs"
													>
														{selectedNoticeDetail.status}
													</Badge>
												</div>
											</div>

											<div>
											<Label className="text-xs sm:text-sm font-semibold">Criado em</Label>
											<p className="text-xs sm:text-sm text-muted-foreground mt-1">
												{new Date(selectedNoticeDetail.createdAt).toLocaleDateString("pt-BR")}
												</p>
											</div>
										</div>

										<div>
										<Label className="text-xs sm:text-sm font-semibold">Arquivo</Label>
										<p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2">
											<FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
											<span className="truncate">{selectedNoticeDetail.fileName}</span>
											</p>
										</div>
									</CardContent>
								</Card>

								{/* Visualização do Arquivo */}
								<Card>
								<CardHeader className="pb-2 sm:pb-3">
									<div className="flex items-center justify-between gap-2">
										<CardTitle className="text-base sm:text-lg">Arquivo</CardTitle>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDownload(selectedNoticeDetail)}
											className="h-8 sm:h-9 text-xs sm:text-sm"
											>
											<Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
												Baixar
											</Button>
										</div>
									</CardHeader>
									<CardContent>
									<div 
										className="border rounded-lg overflow-hidden" 
										style={{ height: "min(400px, 50vh)" }}
									>
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
						</ResponsiveModalBody>
					) : (
						<div className="flex items-center justify-center h-full">
							<p className="text-muted-foreground">Nenhum aviso selecionado</p>
						</div>
					)}
				</ResponsiveModalContent>
			</ResponsiveModal>
		</div>
	);
};

export default Notices;
