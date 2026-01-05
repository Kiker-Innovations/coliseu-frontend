import { useState, useEffect, useCallback } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Package,
  CheckCircle,
  Clock,
  Search,
  User,
  Calendar,
  Inbox,
  Truck,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import PackagesSkeleton from "../../skeleton/resident/PackagesSkeleton";
import { packageService } from "@/services/api";
import type { ResidentPackage, ResidentPackageStats } from "@/services/api";
import { toast } from "sonner";

export default function Packages() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [packages, setPackages] = useState<ResidentPackage[]>([]);
  const [stats, setStats] = useState<ResidentPackageStats>({
    totalAguardandoRetiradaMes: 0,
    totalEntregues: 0,
    totalAguardandoRetirada: 0,
  });

  // Modal state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<ResidentPackage | null>(null);

  // Pagination state
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageDelivered, setCurrentPageDelivered] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch packages and stats in parallel
      const [packagesResponse, statsResponse] = await Promise.all([
        packageService.getMyPackages(),
        packageService.getMyPackagesStats(),
      ]);

      if (packagesResponse.success && packagesResponse.data) {
        setPackages(packagesResponse.data);
      } else {
        toast.error(packagesResponse.message || "Erro ao carregar encomendas");
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar encomendas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter packages by status
  const pendingPackages = packages.filter((pkg) => pkg.status === "PENDENTE");
  const deliveredPackages = packages.filter((pkg) => pkg.status === "ENTREGUE");

  const filterPackages = (pkgs: ResidentPackage[]) => {
    if (!searchTerm) return pkgs;
    const searchLower = searchTerm.toLowerCase();
    return pkgs.filter(
      (pkg) =>
        pkg.ownerName?.toLowerCase().includes(searchLower) ||
        pkg.description?.toLowerCase().includes(searchLower) ||
        pkg.recipientName?.toLowerCase().includes(searchLower) ||
        pkg.courierName?.toLowerCase().includes(searchLower)
    );
  };

  const filteredPendingPackages = filterPackages(pendingPackages);
  const filteredDeliveredPackages = filterPackages(deliveredPackages);

  // Pagination logic
  const getPaginatedPackages = (pkgs: ResidentPackage[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pkgs.slice(startIndex, endIndex);
  };

  const totalPagesPending = Math.ceil(filteredPendingPackages.length / itemsPerPage);
  const totalPagesDelivered = Math.ceil(filteredDeliveredPackages.length / itemsPerPage);

  const paginatedPendingPackages = getPaginatedPackages(filteredPendingPackages, currentPagePending);
  const paginatedDeliveredPackages = getPaginatedPackages(filteredDeliveredPackages, currentPageDelivered);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPagePending(1);
    setCurrentPageDelivered(1);
  }, [searchTerm]);

  // Reset page when tab changes
  useEffect(() => {
    if (activeTab === "pending") {
      setCurrentPageDelivered(1);
    } else {
      setCurrentPagePending(1);
    }
  }, [activeTab]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewPackage = (pkg: ResidentPackage) => {
    setViewingPackage(pkg);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    return <PackagesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Encomendas do Apartamento</h1>
        <p className="text-muted-foreground">
          Acompanhe as encomendas registradas pela portaria
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Aguardando Retirada
                </p>
                <p className="text-3xl font-bold text-destructive">
                  {stats.totalAguardandoRetirada}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Entregues Este Mês
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalEntregues}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Aguardando (Este Mês)
                </p>
                <p className="text-3xl font-bold text-primary">
                  {stats.totalAguardandoRetiradaMes}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Lista de Encomendas</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por destinatário, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Aguardando ({filteredPendingPackages.length})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Retiradas ({filteredDeliveredPackages.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Packages */}
            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando{" "}
                    {paginatedPendingPackages.length > 0
                      ? (currentPagePending - 1) * itemsPerPage + 1
                      : 0}{" "}
                    a{" "}
                    {Math.min(
                      currentPagePending * itemsPerPage,
                      filteredPendingPackages.length
                    )}{" "}
                    de {filteredPendingPackages.length} encomenda(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Itens por página:
                    </Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPagePending(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredPendingPackages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Inbox className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm
                        ? "Nenhuma encomenda encontrada"
                        : "Nenhuma encomenda aguardando retirada"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {searchTerm
                        ? "Tente ajustar sua busca"
                        : "Suas novas encomendas aparecerão aqui quando chegarem"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proprietário</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Data de Chegada</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPendingPackages.map((pkg) => (
                            <TableRow 
                              key={pkg._id} 
                              className="bg-yellow-50/30 cursor-pointer hover:bg-yellow-50/50"
                              onClick={() => handleViewPackage(pkg)}
                            >
                              <TableCell>
                                <div className="font-medium">
                                  {pkg.ownerName || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium mb-1">
                                  {pkg.description || "Sem descrição"}
                                </div>
                                {pkg.courierName && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Truck className="w-3 h-3" />
                                    {pkg.courierName}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {formatShortDate(pkg.receiverDate)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewPackage(pkg)}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {totalPagesPending > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPagePending((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPagePending === 1}
                              className="gap-1"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </Button>
                          </PaginationItem>
                          {Array.from({ length: totalPagesPending }, (_, i) => i + 1)
                            .filter((page) => {
                              if (totalPagesPending <= 7) return true;
                              if (page === 1 || page === totalPagesPending) return true;
                              if (Math.abs(page - currentPagePending) <= 1) return true;
                              return false;
                            })
                            .map((page, index, array) => {
                              const showEllipsisBefore =
                                index > 0 && page - array[index - 1] > 1;
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsisBefore && (
                                    <PaginationItem>
                                      <span className="px-3 py-1">...</span>
                                    </PaginationItem>
                                  )}
                                  <PaginationItem>
                                    <Button
                                      variant={
                                        currentPagePending === page ? "default" : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setCurrentPagePending(page)}
                                      className="min-w-[2.5rem]"
                                    >
                                      {page}
                                    </Button>
                                  </PaginationItem>
                                </React.Fragment>
                              );
                            })}
                          <PaginationItem>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPagePending((prev) =>
                                  Math.min(totalPagesPending, prev + 1)
                                )
                              }
                              disabled={currentPagePending === totalPagesPending}
                              className="gap-1"
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Delivered Packages */}
            <TabsContent value="delivered" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando{" "}
                    {paginatedDeliveredPackages.length > 0
                      ? (currentPageDelivered - 1) * itemsPerPage + 1
                      : 0}{" "}
                    a{" "}
                    {Math.min(
                      currentPageDelivered * itemsPerPage,
                      filteredDeliveredPackages.length
                    )}{" "}
                    de {filteredDeliveredPackages.length} encomenda(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Itens por página:
                    </Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPageDelivered(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredDeliveredPackages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm
                        ? "Nenhuma encomenda encontrada"
                        : "Nenhuma encomenda retirada ainda"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {searchTerm
                        ? "Tente ajustar sua busca"
                        : "Seu histórico de encomendas retiradas aparecerá aqui"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proprietário</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Data de Retirada</TableHead>
                            <TableHead>Retirado por</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedDeliveredPackages.map((pkg) => (
                            <TableRow 
                              key={pkg._id} 
                              className="bg-green-50/30 cursor-pointer hover:bg-green-50/50"
                              onClick={() => handleViewPackage(pkg)}
                            >
                              <TableCell>
                                <div className="font-medium">
                                  {pkg.ownerName || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium mb-1">
                                  {pkg.description || "Sem descrição"}
                                </div>
                                {pkg.courierName && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Truck className="w-3 h-3" />
                                    {pkg.courierName}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-sm">
                                  {formatShortDate(pkg.deliveryDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <User className="w-3 h-3" />
                                  {pkg.recipientName || "-"}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewPackage(pkg)}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {totalPagesDelivered > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPageDelivered((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPageDelivered === 1}
                              className="gap-1"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </Button>
                          </PaginationItem>
                          {Array.from({ length: totalPagesDelivered }, (_, i) => i + 1)
                            .filter((page) => {
                              if (totalPagesDelivered <= 7) return true;
                              if (page === 1 || page === totalPagesDelivered) return true;
                              if (Math.abs(page - currentPageDelivered) <= 1) return true;
                              return false;
                            })
                            .map((page, index, array) => {
                              const showEllipsisBefore =
                                index > 0 && page - array[index - 1] > 1;
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsisBefore && (
                                    <PaginationItem>
                                      <span className="px-3 py-1">...</span>
                                    </PaginationItem>
                                  )}
                                  <PaginationItem>
                                    <Button
                                      variant={
                                        currentPageDelivered === page ? "default" : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setCurrentPageDelivered(page)}
                                      className="min-w-[2.5rem]"
                                    >
                                      {page}
                                    </Button>
                                  </PaginationItem>
                                </React.Fragment>
                              );
                            })}
                          <PaginationItem>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPageDelivered((prev) =>
                                  Math.min(totalPagesDelivered, prev + 1)
                                )
                              }
                              disabled={currentPageDelivered === totalPagesDelivered}
                              className="gap-1"
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Package Details Dialog */}
      <Dialog 
        open={isViewDialogOpen} 
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            setViewingPackage(null);
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Detalhes da Encomenda
            </DialogTitle>
          </DialogHeader>

          {viewingPackage && (
            <>
              <div className="space-y-4 overflow-y-auto px-6 flex-1 min-h-0">
                {/* Informações da encomenda */}
                <div className="space-y-3">
                  {/* Proprietário */}
                  {viewingPackage.ownerName && (
                    <div>
                      <Label className="text-muted-foreground">Proprietário</Label>
                      <p className="font-semibold text-lg">{viewingPackage.ownerName}</p>
                    </div>
                  )}

                  {/* Descrição */}
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="font-medium">{viewingPackage.description || "Sem descrição"}</p>
                  </div>

                  {/* Transportadora/Entregador */}
                  {viewingPackage.courierName && (
                    <div>
                      <Label className="text-muted-foreground">Transportadora</Label>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{viewingPackage.courierName}</p>
                      </div>
                    </div>
                  )}

                  {/* Data de Recebimento na Portaria */}
                  <div>
                    <Label className="text-muted-foreground">Data de Chegada na Portaria</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(viewingPackage.receiverDate)}</p>
                    </div>
                  </div>

                  {/* Registrado por */}
                  {viewingPackage.receiverBy && (
                    <div>
                      <Label className="text-muted-foreground">Recebido por (Portaria)</Label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{viewingPackage.receiverBy}</p>
                      </div>
                    </div>
                  )}

                  {/* Se entregue - Data de Entrega */}
                  {viewingPackage.status === "ENTREGUE" && viewingPackage.deliveryDate && (
                    <div>
                      <Label className="text-muted-foreground">Data de Retirada</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(viewingPackage.deliveryDate)}</p>
                      </div>
                    </div>
                  )}

                  {/* Se entregue - Recebido por */}
                  {viewingPackage.status === "ENTREGUE" && viewingPackage.recipientName && (
                    <div>
                      <Label className="text-muted-foreground">Retirado por</Label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{viewingPackage.recipientName}</p>
                      </div>
                    </div>
                  )}

                  {/* Se entregue - Entregue por (porteiro) */}
                  {viewingPackage.status === "ENTREGUE" && viewingPackage.deliveryBy && (
                    <div>
                      <Label className="text-muted-foreground">Entregue por (Portaria)</Label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{viewingPackage.deliveryBy}</p>
                      </div>
                    </div>
                  )}

                  {/* Status - Sempre por último */}
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline"
                        className={
                          viewingPackage.status === "PENDENTE" 
                            ? "border-yellow-400 text-yellow-700 bg-yellow-50" 
                            : "border-green-400 text-green-700 bg-green-50"
                        }
                      >
                        {viewingPackage.status === "PENDENTE" && (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Aguardando Retirada
                          </>
                        )}
                        {viewingPackage.status === "ENTREGUE" && (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Retirada
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setViewingPackage(null);
                  }}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
