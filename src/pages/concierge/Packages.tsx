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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
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
  Eye,
  Check,
  ChevronDown,
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
  packageService,
  type PackageStats,
  type CreatePackageRequest,
} from "@/services/api";
import { apartmentsService, type Apartment } from "@/services/api";

interface PackageData {
  id: string;
  recipientName: string;
  description: string;
  apartmentNumber: string;
  apartmentFloor?: number;
  apartmentBlock?: string;
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<PackageData | null>(null);
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
      const token =
        localStorage.getItem("coliseu_access_token") ||
        sessionStorage.getItem("coliseu_access_token") ||
        localStorage.getItem("concierge_token") ||
        sessionStorage.getItem("concierge_token");

      if (!token) {
        return;
      }

      // Tentar decodificar o token JWT primeiro (mais rápido e não depende da API)
      try {
        const tokenParts = token.split(".");
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
      }

      // Não usa mais a rota /concierges/me - todos os dados vêm do token
    };

    loadConciergeData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Get buildingId from token
        let buildingId = "";
        const token =
          localStorage.getItem("coliseu_access_token") ||
          sessionStorage.getItem("coliseu_access_token") ||
          localStorage.getItem("concierge_token") ||
          sessionStorage.getItem("concierge_token");

        if (token) {
          try {
            // Try to decode token to get buildingId
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              buildingId = payload.buildingId || payload.building_id || "";
            }
          } catch (e) {
          }
        }

        if (!buildingId) {
          toast.error(
            "BuildingId não encontrado no token. Faça login novamente."
          );
          setIsLoading(false);
          return;
        }

        const [
          pendingResponse,
          deliveredResponse,
          cancelledResponse,
          allApartments,
          packageStatsResponse,
        ] = await Promise.all([
          packageService.getPackages({ status: "PENDENTE" }),
          packageService.getPackages({ status: "ENTREGUE", days: 7 }),
          packageService.getPackages({ status: "CANCELADO", days: 7 }),
          apartmentsService.getApartmentsByBuildingId(buildingId),
          packageService.getPackageStats(),
        ]);

        const pending = pendingResponse.data || [];
        const delivered = deliveredResponse.data || [];
        const cancelled = cancelledResponse.data || [];
        const packageStats = packageStatsResponse.data || {
          totalPendings: 0,
          totalConfirmed: 0,
          totalPendingsWeek: 0,
        };

        // Map pending packages
        const pendingMapped: PackageData[] = pending.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
          arrivalDate: pkg.receiverDate,
          status: "pending" as const,
          courierName: pkg.courierName,
          registeredBy: pkg.receiverBy,
          registeredAt: pkg.receiverDate,
        }));

        // Map delivered packages
        const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
          arrivalDate: pkg.receiverDate || pkg.deliveryDate, // Use receiverDate if available, otherwise deliveryDate
          status: "delivered" as const,
          deliveredAt: pkg.deliveryDate,
          receivedBy: pkg.recipientName,
          courierName: pkg.courierName,
          registeredBy: pkg.deliveryBy,
          registeredAt: pkg.deliveryDate,
        }));

        // Map cancelled packages
        const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
          arrivalDate: pkg.receiverDate,
          status: "cancelled" as const,
          courierName: pkg.courierName,
          registeredBy: pkg.canceledBy,
          registeredAt: pkg.receiverDate,
          cancelReason: pkg.cancelReason,
          cancelledAt: pkg.cancelledAt,
          cancelledBy: pkg.canceledBy,
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
        pkg.apartmentNumber.toLowerCase().includes(searchLower)
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

  const totalPagesPending = Math.ceil(
    filteredPendingPackages.length / itemsPerPage
  );
  const totalPagesDelivered = Math.ceil(
    filteredDeliveredPackages.length / itemsPerPage
  );
  const totalPagesCancelled = Math.ceil(
    filteredCancelledPackages.length / itemsPerPage
  );

  const paginatedPendingPackages = getPaginatedPackages(
    filteredPendingPackages,
    currentPagePending
  );
  const paginatedDeliveredPackages = getPaginatedPackages(
    filteredDeliveredPackages,
    currentPageDelivered
  );
  const paginatedCancelledPackages = getPaginatedPackages(
    filteredCancelledPackages,
    currentPageCancelled
  );

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
      // Get token and extract conciergeId and buildingId
      const token =
        localStorage.getItem("coliseu_access_token") ||
        sessionStorage.getItem("coliseu_access_token") ||
        localStorage.getItem("concierge_token") ||
        sessionStorage.getItem("concierge_token");

      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      // Extract conciergeId and buildingId from token
      let currentConciergeId = "";
      let buildingId = "";
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentConciergeId = String(
            payload.id || payload.sub || payload.userId || ""
          );
          buildingId = payload.buildingId || payload.building_id || "";

          if (currentConciergeId) {
            setConciergeId(currentConciergeId);
            localStorage.setItem("concierge_id", currentConciergeId);
          }
          if (payload.name) {
            setConciergeName(payload.name);
            localStorage.setItem("concierge_name", payload.name);
          }
        }
      } catch (decodeError) {
        console.error("Erro ao decodificar token:", decodeError);
      }

      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      if (!buildingId) {
        toast.error(
          "BuildingId não encontrado no token. Faça login novamente."
        );
        return;
      }

      // Buscar o ID do apartamento pelo número e buildingId
      let apartmentId: string;
      try {
        const apartment =
          await apartmentsService.getApartmentByNumberAndBuilding(
            buildingId,
            data.apartment
          );
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
        toast.error(
          error.message ||
            "Erro ao buscar apartamento. Verifique se o número está correto."
        );
        return;
      }

      // Validar ID do concierge
      if (!currentConciergeId || currentConciergeId.trim() === "") {
        toast.error("ID do porteiro inválido. Faça login novamente.");
        return;
      }

      // Convert datetime-local to ISO string (sem milissegundos, formato Z)
      const dateObj = new Date(data.arrivalDate);
      if (Number.isNaN(dateObj.getTime())) {
        toast.error("Data de chegada inválida.");
        return;
      }

      // Formatar data no formato ISO sem milissegundos (ex: 2025-01-15T10:30:00Z)
      const receiverDate = dateObj.toISOString().replace(/\.\d{3}Z$/, "Z");

      // Preparar payload com validação
      // receiverConciergeId removed - backend extracts from token
      const payload: CreatePackageRequest = {
        ownerName: data.recipientName?.trim() || undefined,
        apartmentId: apartmentId.trim(),
        description: data.description?.trim() || undefined,
        courierName: data.courierName?.trim() || undefined,
        receiverDate: receiverDate,
      };

      // Validar campos obrigatórios
      if (!payload.apartmentId || !payload.receiverDate) {
        toast.error("Apartamento, data de chegada são obrigatórios.");
        return;
      }

      await packageService.createPackage(payload);

      toast.success("Encomenda cadastrada com sucesso!");
      setIsAddDialogOpen(false);
      packageForm.reset();

      // Reload packages
      const [
        pendingResponse,
        deliveredResponse,
        cancelledResponse,
        packageStatsResponse,
      ] = await Promise.all([
        packageService.getPackages({ status: "PENDENTE" }),
        packageService.getPackages({ status: "ENTREGUE", days: 7 }),
        packageService.getPackages({ status: "CANCELADO", days: 7 }),
        packageService.getPackageStats(),
      ]);

      const pending = pendingResponse.data || [];
      const delivered = deliveredResponse.data || [];
      const cancelled = cancelledResponse.data || [];
      const packageStats = packageStatsResponse.data || {
        totalPendings: 0,
        totalConfirmed: 0,
        totalPendingsWeek: 0,
      };

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.receiverBy,
        registeredAt: pkg.receiverDate,
      }));

      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate || pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        courierName: pkg.courierName,
        registeredBy: pkg.deliveryBy,
        registeredAt: pkg.deliveryDate,
      }));

      // Map cancelled packages
      const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate,
        status: "cancelled" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.canceledBy,
        registeredAt: pkg.receiverDate,
        cancelReason: pkg.cancelReason,
        cancelledAt: pkg.cancelledAt,
        cancelledBy: pkg.canceledBy,
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
      // Get token and extract conciergeId from token
      const token =
        localStorage.getItem("coliseu_access_token") ||
        sessionStorage.getItem("coliseu_access_token") ||
        localStorage.getItem("concierge_token") ||
        sessionStorage.getItem("concierge_token");

      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      // Extract conciergeId from token
      let currentConciergeId = "";
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentConciergeId = String(
            payload.id || payload.sub || payload.userId || ""
          );
          if (currentConciergeId) {
            setConciergeId(currentConciergeId);
            localStorage.setItem("concierge_id", currentConciergeId);
          }
          if (payload.name) {
            setConciergeName(payload.name);
            localStorage.setItem("concierge_name", payload.name);
          }
        }
      } catch (decodeError) {
        console.error("Erro ao decodificar token:", decodeError);
      }

      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      // deliveryConciergeId removed - backend extracts from token
      await packageService.confirmPackageDelivery(selectedPackage.id, {
        recipientName: data.receivedBy?.trim() || undefined,
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
      const [
        pendingResponse,
        deliveredResponse,
        cancelledResponse,
        packageStatsResponse,
      ] = await Promise.all([
        packageService.getPackages({ status: "PENDENTE" }),
        packageService.getPackages({ status: "ENTREGUE", days: 7 }),
        packageService.getPackages({ status: "CANCELADO", days: 7 }),
        packageService.getPackageStats(),
      ]);

      const pending = pendingResponse.data || [];
      const delivered = deliveredResponse.data || [];
      const cancelled = cancelledResponse.data || [];
      const packageStats = packageStatsResponse.data || {
        totalPendings: 0,
        totalConfirmed: 0,
        totalPendingsWeek: 0,
      };

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.receiverBy,
        registeredAt: pkg.receiverDate,
      }));

      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate || pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        courierName: pkg.courierName,
        registeredBy: pkg.deliveryBy,
        registeredAt: pkg.deliveryDate,
      }));

      // Map cancelled packages
      const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate,
        status: "cancelled" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.canceledBy,
        registeredAt: pkg.receiverDate,
        cancelReason: pkg.cancelReason,
        cancelledAt: pkg.cancelledAt,
        cancelledBy: pkg.canceledBy,
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
      // Get token and extract conciergeId from token
      let currentConciergeId = "";
      const token =
        localStorage.getItem("coliseu_access_token") ||
        sessionStorage.getItem("coliseu_access_token") ||
        localStorage.getItem("concierge_token") ||
        sessionStorage.getItem("concierge_token");

      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      // Extract conciergeId from token
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentConciergeId = String(
            payload.id || payload.sub || payload.userId || ""
          );
          if (currentConciergeId) {
            setConciergeId(currentConciergeId);
            localStorage.setItem("concierge_id", currentConciergeId);
          }
          if (payload.name) {
            setConciergeName(payload.name);
            localStorage.setItem("concierge_name", payload.name);
          }
        }
      } catch (decodeError) {
        console.error("Erro ao decodificar token:", decodeError);
      }

      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      // cancelledConciergeId removed - backend extracts from token
      const cancelResponse = await packageService.cancelPackage(
        selectedPackage.id,
        {
          cancelReason: data.cancelReason.trim(),
        }
      );
      if (!cancelResponse.success) {
        toast.error(cancelResponse.message || "Erro ao cancelar encomenda");
        return;
      }

      toast.success("Encomenda cancelada com sucesso!");

      setIsCancelDialogOpen(false);
      cancelForm.reset();
      setSelectedPackage(null);

      // Reload packages
      const [
        pendingResponse,
        deliveredResponse,
        cancelledResponse,
        packageStatsResponse,
      ] = await Promise.all([
        packageService.getPackages({ status: "PENDENTE" }),
        packageService.getPackages({ status: "ENTREGUE", days: 7 }),
        packageService.getPackages({ status: "CANCELADO", days: 7 }),
        packageService.getPackageStats(),
      ]);

      const pending = pendingResponse.data || [];
      const delivered = deliveredResponse.data || [];
      const cancelled = cancelledResponse.data || [];
      const packageStats = packageStatsResponse.data || {
        totalPendings: 0,
        totalConfirmed: 0,
        totalPendingsWeek: 0,
      };

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.receiverBy,
        registeredAt: pkg.receiverDate,
      }));

      // Map delivered packages
      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate || pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        courierName: pkg.courierName,
        registeredBy: pkg.deliveryBy,
        registeredAt: pkg.deliveryDate,
      }));

      // Map cancelled packages
      const cancelledMapped: PackageData[] = cancelled.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartmentNumber: pkg.apartmentNumber,
          apartmentFloor: pkg.apartmentFloor,
          apartmentBlock: pkg.apartmentBlock,
        arrivalDate: pkg.receiverDate,
        status: "cancelled" as const,
        courierName: pkg.courierName,
        registeredBy: pkg.canceledBy,
        registeredAt: pkg.receiverDate,
        cancelReason: pkg.cancelReason,
        cancelledAt: pkg.cancelledAt,
        cancelledBy: pkg.canceledBy,
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

  const handleViewPackage = (pkg: PackageData) => {
    setViewingPackage(pkg);
    setIsViewDialogOpen(true);
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
                <p className="text-sm text-muted-foreground">
                  Entregues nesta semana
                </p>
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
                    <Label
                      htmlFor="itemsPerPage"
                      className="text-sm text-muted-foreground"
                    >
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
                        <TableHead className="w-[120px]">Apartamento</TableHead>
                        <TableHead className="w-[200px]">Destinatário</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="w-[120px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPendingPackages.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm
                              ? "Nenhuma encomenda encontrada"
                              : "Nenhuma encomenda pendente"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPendingPackages.map((pkg) => (
                          <TableRow 
                            key={pkg.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => handleViewPackage(pkg)}
                          >
                            <TableCell className="w-[160px]">
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                                {pkg.apartmentBlock ? `Bloco ${pkg.apartmentBlock} - ` : ""}
                                Apt {pkg.apartmentNumber}
                                {pkg.apartmentFloor ? ` (${pkg.apartmentFloor}º)` : ""}
                              </span>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <div className="font-medium">
                                {pkg.recipientName || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.registeredBy || "-"}
                            </TableCell>
                            <TableCell className="w-[120px] text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleViewPackage(pkg)}
                                  title="Ver detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleOpenDeliveryDialog(pkg)}
                                  title="Marcar como entregue"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleOpenCancelDialog(pkg)}
                                  title="Cancelar encomenda"
                                >
                                  <XCircle className="w-4 h-4" />
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
                          onClick={() =>
                            setCurrentPagePending((prev) =>
                              Math.max(1, prev - 1)
                            )
                          }
                          disabled={currentPagePending === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                      </PaginationItem>
                      {Array.from(
                        { length: totalPagesPending },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          if (totalPagesPending <= 7) return true;
                          if (page === 1 || page === totalPagesPending)
                            return true;
                          if (Math.abs(page - currentPagePending) <= 1)
                            return true;
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
                                    currentPagePending === page
                                      ? "default"
                                      : "outline"
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
                    <Label
                      htmlFor="itemsPerPage"
                      className="text-sm text-muted-foreground"
                    >
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
                        <TableHead className="w-[120px]">Apartamento</TableHead>
                        <TableHead className="w-[200px]">Destinatário</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="w-[120px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDeliveredPackages.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm
                              ? "Nenhuma encomenda encontrada"
                              : "Nenhuma encomenda entregue ainda"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDeliveredPackages.map((pkg) => (
                          <TableRow 
                            key={pkg.id} 
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => handleViewPackage(pkg)}
                          >
                            <TableCell className="w-[160px]">
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                                {pkg.apartmentBlock ? `Bloco ${pkg.apartmentBlock} - ` : ""}
                                Apt {pkg.apartmentNumber}
                                {pkg.apartmentFloor ? ` (${pkg.apartmentFloor}º)` : ""}
                              </span>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <div className="font-medium">
                                {pkg.recipientName || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.registeredBy || "-"}
                            </TableCell>
                            <TableCell className="w-[120px] text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                          onClick={() =>
                            setCurrentPageDelivered((prev) =>
                              Math.max(1, prev - 1)
                            )
                          }
                          disabled={currentPageDelivered === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                      </PaginationItem>
                      {Array.from(
                        { length: totalPagesDelivered },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          if (totalPagesDelivered <= 7) return true;
                          if (page === 1 || page === totalPagesDelivered)
                            return true;
                          if (Math.abs(page - currentPageDelivered) <= 1)
                            return true;
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
                                    currentPageDelivered === page
                                      ? "default"
                                      : "outline"
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
                          disabled={
                            currentPageDelivered === totalPagesDelivered
                          }
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
                    Mostrando{" "}
                    {paginatedCancelledPackages.length > 0
                      ? (currentPageCancelled - 1) * itemsPerPage + 1
                      : 0}{" "}
                    a{" "}
                    {Math.min(
                      currentPageCancelled * itemsPerPage,
                      filteredCancelledPackages.length
                    )}{" "}
                    de {filteredCancelledPackages.length} encomenda(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="itemsPerPage"
                      className="text-sm text-muted-foreground"
                    >
                      Itens por página:
                    </Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPageCancelled(1);
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
                        <TableHead className="w-[120px]">Apartamento</TableHead>
                        <TableHead className="w-[200px]">Destinatário</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="w-[120px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCancelledPackages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Nenhuma encomenda cancelada encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedCancelledPackages.map((pkg) => (
                          <TableRow 
                            key={pkg.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => handleViewPackage(pkg)}
                          >
                            <TableCell className="w-[160px]">
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                                {pkg.apartmentBlock ? `Bloco ${pkg.apartmentBlock} - ` : ""}
                                Apt {pkg.apartmentNumber}
                                {pkg.apartmentFloor ? ` (${pkg.apartmentFloor}º)` : ""}
                              </span>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <div className="font-medium">
                                {pkg.recipientName || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pkg.registeredBy || "-"}
                            </TableCell>
                            <TableCell className="w-[120px] text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                          onClick={() =>
                            setCurrentPageCancelled((prev) =>
                              Math.max(1, prev - 1)
                            )
                          }
                          disabled={currentPageCancelled === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                      </PaginationItem>
                      {Array.from(
                        { length: totalPagesCancelled },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          if (totalPagesCancelled <= 7) return true;
                          if (page === 1 || page === totalPagesCancelled)
                            return true;
                          if (Math.abs(page - currentPageCancelled) <= 1)
                            return true;
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
                                    currentPageCancelled === page
                                      ? "default"
                                      : "outline"
                                  }
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
                          onClick={() =>
                            setCurrentPageCancelled((prev) =>
                              Math.min(totalPagesCancelled, prev + 1)
                            )
                          }
                          disabled={
                            currentPageCancelled === totalPagesCancelled
                          }
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {packageForm.watch("apartment")
                        ? (() => {
                            const selectedApt = apartments.find(
                              (apt) => apt.number === packageForm.watch("apartment")
                            );
                            return selectedApt
                              ? `${selectedApt.block ? `Bloco ${selectedApt.block} - ` : ""}Apartamento ${selectedApt.number}${selectedApt.floor ? ` (${selectedApt.floor}º andar)` : ""}`
                              : packageForm.watch("apartment");
                          })()
                        : "Selecione o apartamento"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar apartamento..." />
                      <CommandList>
                        <CommandEmpty>Nenhum apartamento encontrado.</CommandEmpty>
                        <CommandGroup>
                          {apartments
                            .sort((a, b) => {
                              if (a.block && b.block && a.block !== b.block) {
                                return a.block.localeCompare(b.block);
                              }
                              return a.number.localeCompare(b.number, undefined, {
                                numeric: true,
                                sensitivity: "base",
                              });
                            })
                            .map((apt) => {
                              const aptLabel = `${apt.block ? `Bloco ${apt.block} - ` : ""}Apartamento ${apt.number}${apt.floor ? ` (${apt.floor}º andar)` : ""}`;
                              return (
                                <CommandItem
                                  key={apt._id}
                                  value={`${apt.number} ${apt.block || ""} ${apt.floor || ""}`}
                                  onSelect={() => {
                                    packageForm.setValue("apartment", apt.number);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      packageForm.watch("apartment") === apt.number
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {aptLabel}
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <Label htmlFor="courierName">
                  Entregue por (Transportadora/Entregador)
                </Label>
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
                  <p className="font-medium">
                    {selectedPackage.apartmentBlock ? `Bloco ${selectedPackage.apartmentBlock} - ` : ""}
                    Apt {selectedPackage.apartmentNumber}
                    {selectedPackage.apartmentFloor ? ` (${selectedPackage.apartmentFloor}º)` : ""}
                  </p>
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
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
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
                  <p className="font-medium">
                    {selectedPackage.apartmentBlock ? `Bloco ${selectedPackage.apartmentBlock} - ` : ""}
                    Apt {selectedPackage.apartmentNumber}
                    {selectedPackage.apartmentFloor ? ` (${selectedPackage.apartmentFloor}º)` : ""}
                  </p>
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
                  {/* Apartamento */}
                  <div>
                    <Label className="text-muted-foreground">Apartamento</Label>
                    <p className="font-semibold text-lg">
                      {viewingPackage.apartmentBlock ? `Bloco ${viewingPackage.apartmentBlock} - ` : ""}
                      Apt {viewingPackage.apartmentNumber}
                      {viewingPackage.apartmentFloor ? ` (${viewingPackage.apartmentFloor}º andar)` : ""}
                    </p>
                  </div>

                  {/* Destinatário */}
                  {viewingPackage.recipientName && (
                    <div>
                      <Label className="text-muted-foreground">Destinatário</Label>
                      <p className="font-medium">{viewingPackage.recipientName}</p>
                    </div>
                  )}

                  {/* Descrição */}
                  {viewingPackage.description && (
                    <div>
                      <Label className="text-muted-foreground">Descrição</Label>
                      <p className="font-medium">{viewingPackage.description}</p>
                    </div>
                  )}

                  {/* Transportadora/Entregador */}
                  {viewingPackage.courierName && (
                    <div>
                      <Label className="text-muted-foreground">Transportadora</Label>
                      <p className="font-medium">{viewingPackage.courierName}</p>
                    </div>
                  )}

                  {/* Data de Recebimento */}
                  <div>
                    <Label className="text-muted-foreground">Data de Recebimento</Label>
                    <p className="font-medium">
                      {new Date(viewingPackage.arrivalDate).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Registrado por */}
                  {viewingPackage.registeredBy && (
                    <div>
                      <Label className="text-muted-foreground">Registrado por</Label>
                      <p className="font-medium">{viewingPackage.registeredBy}</p>
                    </div>
                  )}

                  {/* Se entregue - Data de Entrega */}
                  {viewingPackage.status === "delivered" && viewingPackage.deliveredAt && (
                    <div>
                      <Label className="text-muted-foreground">Data de Entrega</Label>
                      <p className="font-medium">
                        {new Date(viewingPackage.deliveredAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}

                  {/* Se entregue - Recebido por */}
                  {viewingPackage.status === "delivered" && viewingPackage.receivedBy && (
                    <div>
                      <Label className="text-muted-foreground">Entregue para</Label>
                      <p className="font-medium">{viewingPackage.receivedBy}</p>
                    </div>
                  )}

                  {/* Se cancelado - Data de Cancelamento */}
                  {viewingPackage.status === "cancelled" && viewingPackage.cancelledAt && (
                    <div>
                      <Label className="text-muted-foreground">Data de Cancelamento</Label>
                      <p className="font-medium">
                        {new Date(viewingPackage.cancelledAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}

                  {/* Se cancelado - Motivo */}
                  {viewingPackage.status === "cancelled" && viewingPackage.cancelReason && (
                    <div>
                      <Label className="text-muted-foreground">Motivo do Cancelamento</Label>
                      <p className="font-medium">{viewingPackage.cancelReason}</p>
                    </div>
                  )}

                  {/* Se cancelado - Cancelado por */}
                  {viewingPackage.status === "cancelled" && viewingPackage.cancelledBy && (
                    <div>
                      <Label className="text-muted-foreground">Cancelado por</Label>
                      <p className="font-medium">{viewingPackage.cancelledBy}</p>
                    </div>
                  )}

                  {/* Status - Sempre por último */}
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={
                          viewingPackage.status === "pending" 
                            ? "outline" 
                            : viewingPackage.status === "delivered"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          viewingPackage.status === "pending" 
                            ? "border-yellow-400 text-yellow-700 bg-yellow-50" 
                            : viewingPackage.status === "delivered"
                            ? "bg-green-600"
                            : ""
                        }
                      >
                        {viewingPackage.status === "pending" && "Pendente"}
                        {viewingPackage.status === "delivered" && "Entregue"}
                        {viewingPackage.status === "cancelled" && "Cancelada"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
                {viewingPackage.status === "pending" && (
                  <>
                    <Button
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        setSelectedPackage(viewingPackage);
                        setIsDeliveryDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Entregue
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        setSelectedPackage(viewingPackage);
                        setIsCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
                {viewingPackage.status !== "pending" && (
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
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
