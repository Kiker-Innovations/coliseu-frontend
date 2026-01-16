import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Megaphone, Calendar, Eye, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { noticesService, ApiClientError, type Notice, type NoticeDetail } from "@/services/api";
import NoticesSkeleton from "@/skeleton/resident/NoticesSkeleton";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
				status: "ATIVO", // Residente só vê avisos ativos
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
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground mb-2">Avisos</h1>
				<p className="text-muted-foreground">Acompanhe os avisos importantes do condomínio</p>
			</div>

			{notices.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Megaphone className="w-16 h-16 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">Nenhum aviso disponível</h3>
						<p className="text-muted-foreground text-center max-w-md">
							Quando o administrador publicar avisos, eles aparecerão aqui.
						</p>
					</CardContent>
				</Card>
			) : (
				<>
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
														Publicado em {new Date(notice.createdAt).toLocaleString("pt-BR")}
													</span>
												</div>
												<Badge variant="default" className="text-xs">
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
										</div>
									</div>
								</CardHeader>
							</Card>
						))}
					</div>

					{/* Paginação */}
					{totalPages > 1 && (
						<div className="flex justify-center mt-6">
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((prev) => Math.max(1, prev - 1))}
											disabled={page === 1}
											className="gap-1"
										>
											<ChevronLeft className="h-4 w-4" />
											Anterior
										</Button>
									</PaginationItem>
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((p) => {
											if (totalPages <= 7) return true;
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
															<span className="px-2">...</span>
														</PaginationItem>
													)}
													<PaginationItem>
														<Button
															variant={page === p ? "default" : "outline"}
															size="sm"
															onClick={() => setPage(p)}
															className="min-w-[2.5rem]"
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
							Mostrando {notices.length} de {total} aviso(s) - Página {page} de {totalPages}
						</div>
					)}
				</>
			)}

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
					<DialogHeader>
						{isLoadingDetail ? (
							<DialogTitle>Carregando detalhes do aviso</DialogTitle>
						) : selectedNoticeDetail ? (
							<>
								<DialogTitle className="flex items-center gap-2">
									<Megaphone className="w-5 h-5 text-primary" />
									{selectedNoticeDetail.title}
								</DialogTitle>
								<DialogDescription>Visualize todos os detalhes do aviso</DialogDescription>
							</>
						) : (
							<DialogTitle>Detalhes do Aviso</DialogTitle>
						)}
					</DialogHeader>
					{isLoadingDetail ? (
						<div className="flex items-center justify-center h-full">
							<p className="text-muted-foreground">Carregando detalhes do aviso...</p>
						</div>
					) : selectedNoticeDetail ? (
						<>
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
															selectedNoticeDetail.status === "ATIVO" ? "default" : "secondary"
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
		</div>
	);
};

export default Notices;
