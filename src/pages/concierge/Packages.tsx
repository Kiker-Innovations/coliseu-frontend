import { useState, useEffect } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
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
  PlusCircle,
  CheckCircle,
  Clock,
  Search,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  packageSchema,
  deliverySchema,
  cancelSchema,
  type PackageSchema,
  type DeliverySchema,
  type CancelSchema,
} from "@/schemas/concierge/package.schema";
import PackagesSkeleton from "@/skeleton/concierge/PackagesSkeleton";
import {
  createPackage,
  getPendingPackages,
  getDeliveredPackages,
  getCancelledPackages,
  confirmPackageDelivery,
  cancelPackage,
  getPackageStats,
  type PendingPackage,
  type DeliveredPackage,
  type CancelledPackage,
  type PackageStats,
  type CreatePackageRequest,
} from "@/services/package.service";
import { getCurrentConcierge } from "@/services/concierge.service";
import { getApartmentByNumber, listAllApartments, type Apartment } from "@/services/apartment.service";

interface PackageData {
  id: string;
  recipientName: string;
  description: string;
  apartment: string;
  arrivalDate: string;
  status: "pending" | "delivered" | "cancelled";
  deliveredAt?: string;
  receivedBy?: string;
  courierName?: string;
  registeredBy: string;
  registeredAt: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export default function ConciergePackages() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [cancelledPackages, setCancelledPackages] = useState<PackageData[]>([]);
  const [currentPageCancelled, setCurrentPageCancelled] = useState(1);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [conciergeId, setConciergeId] = useState<string>("");
  const [conciergeName, setConciergeName] = useState<string>("Porteiro");
  const [stats, setStats] = useState<PackageStats>({
    totalPendings: 0,
    totalConfirmed: 0,
    totalPendingsWeek: 0,
  });
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageDelivered, setCurrentPageDelivered] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Sempre buscar dados atuais do porteiro da API usando o token
    const loadConciergeData = async () => {
      // Verificar se há token disponível
      const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
      
      if (!token) {
        console.warn("Token não encontrado no localStorage");
        return;
      }

      try {
        // Sempre buscar dados atuais da API
        const concierge = await getCurrentConcierge();
        console.log("Dados do porteiro carregados:", { id: concierge.id, name: concierge.name });
        if (concierge.id) {
          const idString = String(concierge.id);
          setConciergeId(idString);
          localStorage.setItem("concierge_id", idString);
        }
        if (concierge.name) {
          setConciergeName(concierge.name);
          localStorage.setItem("concierge_name", concierge.name);
        }
      } catch (error: any) {
        console.warn("Não foi possível buscar o perfil do porteiro:", error.message);
        // Tentar decodificar o token JWT como fallback
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.sub || payload.userId) {
              const idFromToken = payload.id || payload.sub || payload.userId;
              setConciergeId(String(idFromToken));
              localStorage.setItem("concierge_id", String(idFromToken));
            }
            if (payload.name) {
              setConciergeName(payload.name);
              localStorage.setItem("concierge_name", payload.name);
            }
          }
        } catch (decodeError) {
          console.warn("Não foi possível decodificar o token:", decodeError);
        }
      }
    };

    loadConciergeData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [pending, delivered, cancelled, allApartments, packageStats] = await Promise.all([
          getPendingPackages(),
          getDeliveredPackages(),
          getCancelledPackages(),
          listAllApartments(),
          getPackageStats(),
        ]);

        // Map pending packages
        const pendingMapped: PackageData[] = pending.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartment: pkg.apartmentNumber,
          arrivalDate: pkg.receiverDate,
          status: "pending" as const,
          courierName: pkg.courierName,
          registeredBy: pkg.receiverConciergeName,
          registeredAt: pkg.receiverDate,
        }));

        // Map delivered packages
        const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartment: pkg.apartmentNumber,
          arrivalDate: pkg.receiverDate || pkg.deliveryDate, // Use receiverDate if available, otherwise deliveryDate
          status: "delivered" as const,
          deliveredAt: pkg.deliveryDate,
          receivedBy: pkg.recipientName,
          courierName: pkg.courierName,
          registeredBy: pkg.deliveryConciergeName,
          registeredAt: pkg.deliveryDate,
        }));

        // Map cancelled packages
        const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartment: pkg.apartmentNumber,
          arrivalDate: pkg.receiverDate,
          status: "cancelled" as const,
          courierName: pkg.courierName,
          registeredBy: pkg.cancelledByName,
          registeredAt: pkg.receiverDate,
          cancelReason: pkg.cancelReason,
          cancelledAt: pkg.cancelledAt,
          cancelledBy: pkg.cancelledByName,
        }));

        setPackages([...pendingMapped, ...deliveredMapped]);
        setCancelledPackages(cancelledMapped);

        // Set all apartments from API
        setApartments(allApartments);

        // Set stats from API
        setStats(packageStats);
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar encomendas");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const packageForm = useForm<PackageSchema>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      recipientName: "",
      description: "",
      courierName: "",
      apartment: "",
      arrivalDate: new Date().toISOString().slice(0, 16),
    },
  });

  const deliveryForm = useForm<DeliverySchema>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      receivedBy: "",
    },
  });

  const cancelForm = useForm<CancelSchema>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      cancelReason: "",
    },
  });

  const pendingPackages = packages.filter((pkg) => pkg.status === "pending");
  const deliveredPackages = packages.filter(
    (pkg) => pkg.status === "delivered"
  );

  const filterPackages = (pkgs: PackageData[]) => {
    if (!searchTerm) return pkgs;
    const searchLower = searchTerm.toLowerCase();
    return pkgs.filter(
      (pkg) =>
        pkg.recipientName.toLowerCase().includes(searchLower) ||
        pkg.description.toLowerCase().includes(searchLower) ||
        pkg.apartment.toLowerCase().includes(searchLower)
    );
  };

  const filteredPendingPackages = filterPackages(pendingPackages);
  const filteredDeliveredPackages = filterPackages(deliveredPackages);
  const filteredCancelledPackages = filterPackages(cancelledPackages);

  // Pagination logic
  const getPaginatedPackages = (pkgs: PackageData[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pkgs.slice(startIndex, endIndex);
  };

  const totalPagesPending = Math.ceil(filteredPendingPackages.length / itemsPerPage);
  const totalPagesDelivered = Math.ceil(filteredDeliveredPackages.length / itemsPerPage);
  const totalPagesCancelled = Math.ceil(filteredCancelledPackages.length / itemsPerPage);

  const paginatedPendingPackages = getPaginatedPackages(filteredPendingPackages, currentPagePending);
  const paginatedDeliveredPackages = getPaginatedPackages(filteredDeliveredPackages, currentPageDelivered);
  const paginatedCancelledPackages = getPaginatedPackages(filteredCancelledPackages, currentPageCancelled);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPagePending(1);
    setCurrentPageDelivered(1);
    setCurrentPageCancelled(1);
  }, [searchTerm]);

  // Reset page when tab changes
  useEffect(() => {
    if (activeTab === "pending") {
      setCurrentPageDelivered(1);
      setCurrentPageCancelled(1);
    } else if (activeTab === "delivered") {
      setCurrentPagePending(1);
      setCurrentPageCancelled(1);
    } else if (activeTab === "cancelled") {
      setCurrentPagePending(1);
      setCurrentPageDelivered(1);
    }
  }, [activeTab]);

  const handleAddPackage = async (data: PackageSchema) => {
    try {
      // Sempre buscar dados atuais do porteiro da API antes de criar o pacote
      let currentConciergeId = "";
      const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
      
      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      try {
        // Sempre buscar dados atuais da API para garantir que está usando o porteiro correto
        const concierge = await getCurrentConcierge();
        console.log("Dados do porteiro ao criar pacote:", { id: concierge.id, name: concierge.name });
        if (concierge.id) {
          currentConciergeId = String(concierge.id);
          setConciergeId(currentConciergeId);
          localStorage.setItem("concierge_id", currentConciergeId);
        }
        if (concierge.name) {
          setConciergeName(concierge.name);
          localStorage.setItem("concierge_name", concierge.name);
        }
      } catch (error: any) {
        console.error("Erro ao buscar perfil do porteiro:", error);
        // Tentar decodificar o token JWT como fallback
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.sub || payload.userId) {
              currentConciergeId = String(payload.id || payload.sub || payload.userId);
              setConciergeId(currentConciergeId);
              localStorage.setItem("concierge_id", currentConciergeId);
            }
          }
        } catch (decodeError) {
          console.error("Erro ao decodificar token:", decodeError);
        }
      }
      
      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      // Buscar o ID do apartamento pelo número
      let apartmentId: string;
      try {
        const apartment = await getApartmentByNumber(data.apartment);
        if (!apartment) {
          toast.error(`Apartamento ${data.apartment} não encontrado.`);
          return;
        }
        apartmentId = apartment._id;
        
        // Validar se o ID é um UUID válido
        if (!apartmentId || apartmentId.trim() === "") {
          toast.error("ID do apartamento inválido.");
          return;
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao buscar apartamento. Verifique se o número está correto.");
        return;
      }

      // Validar ID do concierge
      if (!currentConciergeId || currentConciergeId.trim() === "") {
        toast.error("ID do porteiro inválido. Faça login novamente.");
        return;
      }

      // Convert datetime-local to ISO string (sem milissegundos, formato Z)
      const dateObj = new Date(data.arrivalDate);
      if (isNaN(dateObj.getTime())) {
        toast.error("Data de chegada inválida.");
        return;
      }
      
      // Formatar data no formato ISO sem milissegundos (ex: 2025-01-15T10:30:00Z)
      const receiverDate = dateObj.toISOString().replace(/\.\d{3}Z$/, 'Z');

      // Preparar payload com validação
      const payload: CreatePackageRequest = {
        ownerName: data.recipientName?.trim() || undefined,
        apartmentId: apartmentId.trim(),
        description: data.description?.trim() || undefined,
        courierName: data.courierName?.trim() || undefined,
        receiverDate: receiverDate,
        receiverConciergeId: currentConciergeId.trim(),
      };
      
      // Log para debug
      console.log("Payload antes de enviar:", JSON.stringify(payload, null, 2));
      console.log("Tipos dos campos:", {
        ownerName: typeof payload.ownerName,
        apartmentId: typeof payload.apartmentId,
        description: typeof payload.description,
        courierName: typeof payload.courierName,
        receiverDate: typeof payload.receiverDate,
        receiverConciergeId: typeof payload.receiverConciergeId,
      });

      // Validar campos obrigatórios
      if (!payload.apartmentId || !payload.receiverDate || !payload.receiverConciergeId) {
        toast.error("Apartamento, data de chegada são obrigatórios.");
        return;
      }

      console.log("Enviando payload:", payload);
      
      await createPackage(payload);

      toast.success("Encomenda cadastrada com sucesso!");
      setIsAddDialogOpen(false);
      packageForm.reset();

      // Reload packages
      const [pending, delivered, cancelled, packageStats] = await Promise.all([
        getPendingPackages(),
        getDeliveredPackages(),
        getCancelledPackages(),
        getPackageStats(),
      ]);

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.receiverConciergeName,
        registeredAt: pkg.receiverDate,
      }));

      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate || pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        courierName: pkg.courierName,
        registeredBy: pkg.deliveryConciergeName,
        registeredAt: pkg.deliveryDate,
      }));

      // Map cancelled packages
      const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "cancelled" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.cancelledByName,
        registeredAt: pkg.receiverDate,
        cancelReason: pkg.cancelReason,
        cancelledAt: pkg.cancelledAt,
        cancelledBy: pkg.cancelledByName,
      }));

      setPackages([...pendingMapped, ...deliveredMapped]);
      setCancelledPackages(cancelledMapped);
      setStats(packageStats);
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar encomenda");
    }
  };

  const handleMarkAsDelivered = async (data: DeliverySchema) => {
    if (!selectedPackage) return;

    try {
      // Sempre buscar dados atuais do porteiro da API antes de confirmar entrega
      let currentConciergeId = "";
      const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
      
      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      try {
        // Sempre buscar dados atuais da API para garantir que está usando o porteiro correto
        const concierge = await getCurrentConcierge();
        if (concierge.id) {
          currentConciergeId = String(concierge.id);
          setConciergeId(currentConciergeId);
          localStorage.setItem("concierge_id", currentConciergeId);
        }
        if (concierge.name) {
          setConciergeName(concierge.name);
          localStorage.setItem("concierge_name", concierge.name);
        }
      } catch (error: any) {
        console.error("Erro ao buscar perfil do porteiro:", error);
        // Tentar decodificar o token JWT como fallback
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.sub || payload.userId) {
              currentConciergeId = String(payload.id || payload.sub || payload.userId);
              setConciergeId(currentConciergeId);
              localStorage.setItem("concierge_id", currentConciergeId);
            }
          }
        } catch (decodeError) {
          console.error("Erro ao decodificar token:", decodeError);
        }
      }
      
      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      await confirmPackageDelivery(selectedPackage.id, {
        recipientName: data.receivedBy?.trim() || undefined,
        deliveryConciergeId: currentConciergeId,
      });

      toast.success(
        data.receivedBy?.trim()
          ? `Encomenda marcada como entregue! Recebida por: ${data.receivedBy}`
          : "Encomenda marcada como entregue!"
      );
      setIsDeliveryDialogOpen(false);
      setSelectedPackage(null);
      deliveryForm.reset();

      // Reload packages
      const [pending, delivered, cancelled, packageStats] = await Promise.all([
        getPendingPackages(),
        getDeliveredPackages(),
        getCancelledPackages(),
        getPackageStats(),
      ]);

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.receiverConciergeName,
        registeredAt: pkg.receiverDate,
      }));

      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate || pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        courierName: pkg.courierName,
        registeredBy: pkg.deliveryConciergeName,
        registeredAt: pkg.deliveryDate,
      }));

      // Map cancelled packages
      const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "cancelled" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.cancelledByName,
        registeredAt: pkg.receiverDate,
        cancelReason: pkg.cancelReason,
        cancelledAt: pkg.cancelledAt,
        cancelledBy: pkg.cancelledByName,
      }));

      setPackages([...pendingMapped, ...deliveredMapped]);
      setCancelledPackages(cancelledMapped);
      setStats(packageStats);
    } catch (error: any) {
      toast.error(error.message || "Erro ao marcar encomenda como entregue");
    }
  };

  const handleCancelPackage = async (data: CancelSchema) => {
    if (!selectedPackage) return;

    try {
      // Sempre buscar dados atuais do porteiro da API antes de cancelar
      let currentConciergeId = "";
      const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
      
      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      try {
        // Sempre buscar dados atuais da API para garantir que está usando o porteiro correto
        const concierge = await getCurrentConcierge();
        if (concierge.id) {
          currentConciergeId = String(concierge.id);
          setConciergeId(currentConciergeId);
          localStorage.setItem("concierge_id", currentConciergeId);
        }
        if (concierge.name) {
          setConciergeName(concierge.name);
          localStorage.setItem("concierge_name", concierge.name);
        }
      } catch (error: any) {
        console.error("Erro ao buscar perfil do porteiro:", error);
        // Tentar decodificar o token JWT como fallback
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.sub || payload.userId) {
              currentConciergeId = String(payload.id || payload.sub || payload.userId);
              setConciergeId(currentConciergeId);
              localStorage.setItem("concierge_id", currentConciergeId);
            }
          }
        } catch (decodeError) {
          console.error("Erro ao decodificar token:", decodeError);
        }
      }
      
      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      await cancelPackage(selectedPackage.id, {
        cancelReason: data.cancelReason.trim(),
        cancelledConciergeId: currentConciergeId,
      });

      toast.success("Encomenda cancelada com sucesso!");

      setIsCancelDialogOpen(false);
      cancelForm.reset();
      setSelectedPackage(null);

      // Reload packages
      const [pending, delivered, cancelled, packageStats] = await Promise.all([
        getPendingPackages(),
        getDeliveredPackages(),
        getCancelledPackages(),
        getPackageStats(),
      ]);

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.receiverConciergeName,
        registeredAt: pkg.receiverDate,
      }));

      // Map delivered packages
      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate || pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        courierName: pkg.courierName,
        registeredBy: pkg.deliveryConciergeName,
        registeredAt: pkg.deliveryDate,
      }));

      // Map cancelled packages
      const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "cancelled" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.cancelledByName,
        registeredAt: pkg.receiverDate,
        cancelReason: pkg.cancelReason,
        cancelledAt: pkg.cancelledAt,
        cancelledBy: pkg.cancelledByName,
      }));

      setPackages([...pendingMapped, ...deliveredMapped]);
      setCancelledPackages(cancelledMapped);
      setStats(packageStats);
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar encomenda");
    }
  };

  const handleOpenDeliveryDialog = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setIsDeliveryDialogOpen(true);
  };

  const handleOpenCancelDialog = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setIsCancelDialogOpen(true);
  };

  if (isLoading) {
    return <PackagesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Encomendas</h1>
          <p className="text-muted-foreground">
            Registre e controle as encomendas do condomínio
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nova Encomenda
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-destructive">
                  {stats.totalPendings}
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
                <p className="text-sm text-muted-foreground">Entregues Hoje</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalConfirmed}
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
                <p className="text-sm text-muted-foreground">Entregues nesta semana</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalPendingsWeek}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
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
                placeholder="Buscar por nome, apartamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pendentes ({filteredPendingPackages.length})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Entregues ({filteredDeliveredPackages.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="gap-2">
                <XCircle className="w-4 h-4" />
                Canceladas ({filteredCancelledPackages.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Packages */}
            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {paginatedPendingPackages.length > 0 ? (currentPagePending - 1) * itemsPerPage + 1 : 0} a{" "}
                    {Math.min(currentPagePending * itemsPerPage, filteredPendingPackages.length)} de{" "}
                    {filteredPendingPackages.length} encomenda(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Apt</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Rec. em</TableHead>
                        <TableHead>Rec. por</TableHead>
                        <TableHead>Reg. por</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPendingPackages.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm
                              ? "Nenhuma encomenda encontrada"
                              : "Nenhuma encomenda pendente"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPendingPackages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell>
                              <Badge variant="outline">{pkg.apartment}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {pkg.recipientName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate text-sm text-muted-foreground">
                                {pkg.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(pkg.arrivalDate).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.courierName || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.registeredBy}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleOpenDeliveryDialog(pkg)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar Entregue
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleOpenCancelDialog(pkg)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
                          onClick={() => setCurrentPagePending((prev) => Math.max(1, prev - 1))}
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
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <PaginationItem>
                                  <span className="px-3 py-1">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <Button
                                  variant={currentPagePending === page ? "default" : "outline"}
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
                          onClick={() => setCurrentPagePending((prev) => Math.min(totalPagesPending, prev + 1))}
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
              </div>
            </TabsContent>

            {/* Delivered Packages */}
            <TabsContent value="delivered" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {paginatedDeliveredPackages.length > 0 ? (currentPageDelivered - 1) * itemsPerPage + 1 : 0} a{" "}
                    {Math.min(currentPageDelivered * itemsPerPage, filteredDeliveredPackages.length)} de{" "}
                    {filteredDeliveredPackages.length} encomenda(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Apt</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Rec. em</TableHead>
                        <TableHead>Rec. por</TableHead>
                        <TableHead>Entr. em</TableHead>
                        <TableHead>Entr. para</TableHead>
                        <TableHead>Reg. por</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDeliveredPackages.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm
                              ? "Nenhuma encomenda encontrada"
                              : "Nenhuma encomenda entregue ainda"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDeliveredPackages.map((pkg) => (
                          <TableRow key={pkg.id} className="bg-green-50/30">
                            <TableCell>
                              <Badge variant="outline">{pkg.apartment}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {pkg.recipientName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate text-sm text-muted-foreground">
                                {pkg.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(pkg.arrivalDate).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.courierName || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {pkg.deliveredAt &&
                                new Date(pkg.deliveredAt).toLocaleString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {pkg.receivedBy}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.registeredBy}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
                          onClick={() => setCurrentPageDelivered((prev) => Math.max(1, prev - 1))}
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
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <PaginationItem>
                                  <span className="px-3 py-1">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <Button
                                  variant={currentPageDelivered === page ? "default" : "outline"}
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
                          onClick={() => setCurrentPageDelivered((prev) => Math.min(totalPagesDelivered, prev + 1))}
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
              </div>
            </TabsContent>

            {/* Cancelled Packages */}
            <TabsContent value="cancelled" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {paginatedCancelledPackages.length > 0 ? (currentPageCancelled - 1) * itemsPerPage + 1 : 0} a{" "}
                    {Math.min(currentPageCancelled * itemsPerPage, filteredCancelledPackages.length)} de{" "}
                    {filteredCancelledPackages.length} encomenda(s)
                  </p>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Apt</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Rec. em</TableHead>
                        <TableHead>Rec. por</TableHead>
                        <TableHead>Cancelado em</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Reg. por</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCancelledPackages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            Nenhuma encomenda cancelada encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedCancelledPackages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="font-medium">{pkg.apartment}</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {pkg.recipientName}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{pkg.description || "-"}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(pkg.arrivalDate).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.courierName || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {pkg.cancelledAt &&
                                new Date(pkg.cancelledAt).toLocaleString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="whitespace-normal text-left max-w-xs px-3 py-1.5 rounded-md bg-red-50 border border-red-100">
                                <p className="text-sm font-medium text-red-700">
                                  {pkg.cancelReason || "-"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.registeredBy}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {totalPagesCancelled > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageCancelled((prev) => Math.max(1, prev - 1))}
                          disabled={currentPageCancelled === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                      </PaginationItem>
                      {Array.from({ length: totalPagesCancelled }, (_, i) => i + 1)
                        .filter((page) => {
                          if (totalPagesCancelled <= 7) return true;
                          if (page === 1 || page === totalPagesCancelled) return true;
                          if (Math.abs(page - currentPageCancelled) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <PaginationItem>
                                  <span className="px-3 py-1">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <Button
                                  variant={currentPageCancelled === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPageCancelled(page)}
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
                          onClick={() => setCurrentPageCancelled((prev) => Math.min(totalPagesCancelled, prev + 1))}
                          disabled={currentPageCancelled === totalPagesCancelled}
                          className="gap-1"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Package Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Cadastrar Nova Encomenda
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da encomenda que chegou
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form
              onSubmit={packageForm.handleSubmit(handleAddPackage)}
              className="space-y-4"
              id="package-form"
            >
            <div className="space-y-2">
              <Label htmlFor="recipientName">Nome do Destinatário</Label>
              <Input
                id="recipientName"
                placeholder="Ex: João Silva Santos"
                {...packageForm.register("recipientName")}
              />
              {packageForm.formState.errors.recipientName && (
                <p className="text-sm text-destructive">
                  {packageForm.formState.errors.recipientName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Apartamento *</Label>
              <Select
                value={packageForm.watch("apartment")}
                onValueChange={(value) =>
                  packageForm.setValue("apartment", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o apartamento" />
                </SelectTrigger>
                <SelectContent>
                  {apartments.length > 0 ? (
                    apartments
                      .sort((a, b) => {
                        // Sort by block first, then by number
                        if (a.block && b.block && a.block !== b.block) {
                          return a.block.localeCompare(b.block);
                        }
                        return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
                      })
                      .map((apt) => (
                        <SelectItem key={apt._id} value={apt.number}>
                          {apt.block ? `Bloco ${apt.block} - ` : ""}Apartamento {apt.number}
                          {apt.floor ? ` (${apt.floor}º andar)` : ""}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="" disabled>
                      Nenhum apartamento disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {packageForm.formState.errors.apartment && (
                <p className="text-sm text-destructive">
                  {packageForm.formState.errors.apartment.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Encomenda</Label>
              <Textarea
                id="description"
                placeholder="Ex: Caixa grande - Amazon (eletrônicos)"
                rows={3}
                {...packageForm.register("description")}
              />
              {packageForm.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {packageForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="courierName">Entregue por (Transportadora/Entregador)</Label>
              <Input
                id="courierName"
                placeholder="Ex: Correios, Amazon, DHL, etc."
                {...packageForm.register("courierName")}
              />
              {packageForm.formState.errors.courierName && (
                <p className="text-sm text-destructive">
                  {packageForm.formState.errors.courierName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalDate">Data e Hora de Chegada *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="arrivalDate"
                  type="datetime-local"
                  className="pl-9"
                  {...packageForm.register("arrivalDate")}
                />
              </div>
              {packageForm.formState.errors.arrivalDate && (
                <p className="text-sm text-destructive">
                  {packageForm.formState.errors.arrivalDate.message}
                </p>
              )}
            </div>

              <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                <p className="font-medium mb-1">Registrado por:</p>
                <p className="text-muted-foreground">{conciergeName}</p>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 border-t bg-background flex gap-4">
            <Button
              type="submit"
              form="package-form"
              className="flex-1"
              disabled={packageForm.formState.isSubmitting}
            >
              {packageForm.formState.isSubmitting
                ? "Cadastrando..."
                : "Cadastrar Encomenda"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                packageForm.reset();
              }}
              disabled={packageForm.formState.isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Delivered Dialog */}
      <Dialog
        open={isDeliveryDialogOpen}
        onOpenChange={setIsDeliveryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Marcar Encomenda como Entregue
            </DialogTitle>
            <DialogDescription>
              Confirme a entrega da encomenda
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Destinatário</p>
                  <p className="font-medium">{selectedPackage.recipientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Apartamento</p>
                  <p className="font-medium">{selectedPackage.apartment}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{selectedPackage.description}</p>
                </div>
              </div>

              <form
                onSubmit={deliveryForm.handleSubmit(handleMarkAsDelivered)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="receivedBy">Quem recebeu?</Label>
                  <Input
                    id="receivedBy"
                    placeholder="Nome de quem recebeu a encomenda (opcional)"
                    {...deliveryForm.register("receivedBy")}
                  />
                  {deliveryForm.formState.errors.receivedBy && (
                    <p className="text-sm text-destructive">
                      {deliveryForm.formState.errors.receivedBy.message}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                  <p className="font-medium text-green-800 mb-1">
                    Entrega registrada por:
                  </p>
                  <p className="text-green-700">{conciergeName}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Data: {new Date().toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={deliveryForm.formState.isSubmitting}
                  >
                    {deliveryForm.formState.isSubmitting
                      ? "Confirmando..."
                      : "Confirmar Entrega"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDeliveryDialogOpen(false);
                      setSelectedPackage(null);
                      deliveryForm.reset();
                    }}
                    disabled={deliveryForm.formState.isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}
          </DialogContent>
        </Dialog>

      {/* Cancel Package Dialog */}
      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Cancelar Encomenda
            </DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento da encomenda
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Destinatário</p>
                  <p className="font-medium">{selectedPackage.recipientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Apartamento</p>
                  <p className="font-medium">{selectedPackage.apartment}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{selectedPackage.description}</p>
                </div>
              </div>

              <form
                onSubmit={cancelForm.handleSubmit(handleCancelPackage)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="cancelReason">Motivo do Cancelamento *</Label>
                  <Textarea
                    id="cancelReason"
                    placeholder="Ex: Encomenda retirada pelo destinatário antes do registro, encomenda extraviada, etc."
                    rows={4}
                    {...cancelForm.register("cancelReason")}
                  />
                  {cancelForm.formState.errors.cancelReason && (
                    <p className="text-sm text-destructive">
                      {cancelForm.formState.errors.cancelReason.message}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
                  <p className="font-medium text-red-800 mb-1">
                    Cancelamento registrado por:
                  </p>
                  <p className="text-red-700">{conciergeName}</p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={cancelForm.formState.isSubmitting}
                  >
                    {cancelForm.formState.isSubmitting
                      ? "Cancelando..."
                      : "Confirmar Cancelamento"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCancelDialogOpen(false);
                      cancelForm.reset();
                      setSelectedPackage(null);
                    }}
                    disabled={cancelForm.formState.isSubmitting}
                  >
                    Fechar
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    );
  }
