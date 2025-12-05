import { useState, useEffect, useMemo } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Search,
  User,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Camera,
  X,
  ChevronDown,
  Check,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  visitorSchema,
  visitorEditSchema,
  type VisitorSchema,
  type VisitorEditSchema,
} from "@/schemas/concierge/visitor.schema";
import VisitorsSkeleton from "@/skeleton/concierge/VisitorsSkeleton";
import {
  visitorService,
  type Visitor,
  type CreateVisitorRequest,
  type UpdateVisitorRequest,
  ApiClientError,
} from "@/services/api";
import { apartmentsService, type Apartment } from "@/services/api";
import { CameraCapture } from "@/components/ui/camera-capture";
import { cn } from "@/lib/utils";

export default function ConciergeVisitors() {
  const [isLoading, setIsLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isLoadingVisitorDetails, setIsLoadingVisitorDetails] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("busca");
  const [filterBy, setFilterBy] = useState<"name" | "document" | "apartment">(
    "name"
  );
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [isLoadingVisitorForEdit, setIsLoadingVisitorForEdit] = useState(false);
  const [initialEditData, setInitialEditData] = useState<any>(null);
  const [isUsingLatestVisitors, setIsUsingLatestVisitors] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Get buildingId from token
        let buildingId = "";
        const token =
          localStorage.getItem("concierge_token") ||
          sessionStorage.getItem("concierge_token") ||
          localStorage.getItem("coliseu_access_token") ||
          sessionStorage.getItem("coliseu_access_token");

        if (token) {
          try {
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              buildingId = payload.buildingId || payload.building_id || "";
            }
          } catch (e) {
            console.warn(
              "Não foi possível decodificar token para obter buildingId:",
              e
            );
          }
        }

        if (!buildingId) {
          toast.error(
            "BuildingId não encontrado no token. Faça login novamente."
          );
          setIsLoading(false);
          return;
        }

        // Se não há busca ativa, usar getLatestVisitors (sempre 10 últimos)
        if (!activeSearchTerm) {
          const [latestVisitorsResponse, allApartments] = await Promise.all([
            visitorService.getLatestVisitors(10),
            apartmentsService.getApartmentsByBuildingId(buildingId),
          ]);

          const visitorsData = latestVisitorsResponse.data || [];
          
          setVisitors(visitorsData);
          setTotalVisitors(visitorsData.length);
          setTotalPages(1);
          setIsUsingLatestVisitors(true);
          setApartments(allApartments);
        } else {
          // Se há busca, usar getVisitors com paginação
          const [visitorsResponse, allApartments] = await Promise.all([
            visitorService.getVisitors({
              page: currentPage,
              limit: itemsPerPage,
              search: activeSearchTerm,
              filterBy: filterBy,
            }),
            apartmentsService.getApartmentsByBuildingId(buildingId),
          ]);

          const visitorsData = visitorsResponse.data?.data || [];
          const total = visitorsResponse.data?.total || 0;
          const pages = visitorsResponse.data?.totalPages || 1;

          setVisitors(visitorsData);
          setTotalVisitors(total);
          setTotalPages(pages);
          setIsUsingLatestVisitors(false);
          setApartments(allApartments);
        }
      } catch (error: any) {
        console.error("Erro ao carregar visitantes:", error);
        // Em caso de erro, limpar dados e mostrar mensagem
        setVisitors([]);
        setTotalVisitors(0);
        setTotalPages(0);
        setIsUsingLatestVisitors(false);
        toast.error("Erro ao carregar visitantes. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
        };
        loadData();
      }, [currentPage, itemsPerPage, activeSearchTerm, filterBy]);

  const visitorForm = useForm<VisitorSchema>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: "",
      document: "",
      phone: "",
      email: "",
      vehicleType: "",
      vehiclePlate: "",
      apartment: "",
      types: [],
      photo: undefined,
      note: "",
    },
  });

  const editVisitorForm = useForm<VisitorEditSchema>({
    resolver: zodResolver(visitorEditSchema),
    defaultValues: {
      name: "",
      document: "",
      phone: "",
      email: "",
      vehicleType: "",
      vehiclePlate: "",
      apartment: "",
      types: [],
      note: "",
    },
  });

  const filterVisitors = (visitorsList: Visitor[]) => {
    // Se não há termo de busca, retornar lista completa
    if (!activeSearchTerm) return visitorsList;
    
    // Se o filtro é "document" ou "apartment", o backend já fez o filtro
    // Não aplicar filtro local, apenas retornar os dados do backend
    if (filterBy === "document" || filterBy === "apartment") {
      return visitorsList;
    }
    
    // Para "name", aplicar filtro local como fallback (caso o backend não tenha filtrado)
    if (filterBy === "name") {
      const searchLower = activeSearchTerm.toLowerCase();
      return visitorsList.filter((visitor) => {
        return visitor.name.toLowerCase().includes(searchLower);
      });
    }
    
    return visitorsList;
  };

  const filteredVisitors = filterVisitors(visitors);

  // Pagination logic - only apply when not using latest visitors
  const getPaginatedVisitors = (visitorsList: Visitor[]) => {
    if (isUsingLatestVisitors) {
      return visitorsList; // No pagination for latest visitors
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return visitorsList.slice(startIndex, endIndex);
  };

  const paginatedVisitors = getPaginatedVisitors(filteredVisitors);

  // Reset page when active search term or filter changes
  useEffect(() => {
    if (activeSearchTerm) {
      setCurrentPage(1);
    }
  }, [activeSearchTerm, filterBy]);

  // When filter changes and there's an active search, refetch with new filter (dynamic update)
  useEffect(() => {
    // Only refetch if there's an active search term
    if (!activeSearchTerm) return;

    const refetchData = async () => {
      try {
        // Get buildingId from token
        let buildingId = "";
        const token =
          localStorage.getItem("concierge_token") ||
          sessionStorage.getItem("concierge_token") ||
          localStorage.getItem("coliseu_access_token") ||
          sessionStorage.getItem("coliseu_access_token");

        if (token) {
          try {
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              buildingId = payload.buildingId || payload.building_id || "";
            }
          } catch (e) {
            console.warn(
              "Não foi possível decodificar token para obter buildingId:",
              e
            );
          }
        }

        if (!buildingId) return;

        const visitorsResponse = await visitorService.getVisitors({
          page: 1, // Reset to first page when filter changes
          limit: itemsPerPage,
          search: activeSearchTerm,
          filterBy: activeSearchTerm ? filterBy : undefined,
        });

        const visitorsData = visitorsResponse.data?.data || [];
        const total = visitorsResponse.data?.total || 0;
        const pages = visitorsResponse.data?.totalPages || 1;

        setVisitors(visitorsData);
        setTotalVisitors(total);
        setTotalPages(pages);
        setCurrentPage(1);
      } catch (error: any) {
        console.warn("Erro ao recarregar visitantes:", error);
        // Se a API falhar, apenas usar filtro local nos dados existentes
      }
    };

    refetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBy]);

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    if (searchTerm) {
      setCurrentPage(1);
    }
  };

  const handleAddVisitor = async (data: VisitorSchema) => {
    try {
      // Get token and extract buildingId
      const token =
        localStorage.getItem("concierge_token") ||
        sessionStorage.getItem("concierge_token") ||
        localStorage.getItem("coliseu_access_token") ||
        sessionStorage.getItem("coliseu_access_token");

      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      let buildingId = "";
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          buildingId = payload.buildingId || payload.building_id || "";
        }
      } catch (decodeError) {
        console.error("Erro ao decodificar token:", decodeError);
      }

      if (!buildingId) {
        toast.error(
          "BuildingId não encontrado no token. Faça login novamente."
        );
        return;
      }

      // Buscar o ID do apartamento pelo número e buildingId (se fornecido)
      let apartmentId: string | undefined;
      if (data.apartment && data.apartment.trim()) {
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
        } catch (error: any) {
          toast.error(
            error.message ||
              "Erro ao buscar apartamento. Verifique se o número está correto."
          );
          return;
        }
      }

      // Validar que foto foi fornecida
      if (!capturedPhoto) {
        toast.error("Foto é obrigatória");
        return;
      }

      // Converter tipos para maiúsculas conforme API
      const typesUpperCase = data.types.map((type) => {
        if (type === "prestador_servico") return "PRESTADOR";
        return "CONVIDADO";
      }) as ("CONVIDADO" | "PRESTADOR")[];

      const payload: CreateVisitorRequest = {
        name: data.name.trim(),
        document: data.document?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        vehicleType: data.vehicleType?.trim() 
          ? data.vehicleType.trim().toUpperCase() 
          : undefined,
        vehiclePlate: data.vehiclePlate?.trim() || undefined,
        apartmentId: apartmentId,
        types: typesUpperCase,
        note: data.note?.trim() || undefined,
      };

      try {
        // Criar visitante e receber presignedUrl
        const response = await visitorService.createVisitor(payload);
        
        if (response.data?.presignedUrl && capturedPhoto) {
          // Fazer upload da foto usando presignedUrl
          await visitorService.uploadPhoto(response.data.presignedUrl, capturedPhoto);
        }

        toast.success("Visitante cadastrado com sucesso!");
        visitorForm.reset();
        setCapturedPhoto(null);
        setPhotoPreview(null);
        setShowCamera(false);

        // Reload visitors - use latest if no search, otherwise use paginated
        if (!activeSearchTerm) {
          const latestResponse = await visitorService.getLatestVisitors(10);
          const visitorsData = latestResponse.data || [];
          setVisitors(visitorsData);
          setTotalVisitors(visitorsData.length);
          setTotalPages(1);
          setIsUsingLatestVisitors(true);
        } else {
          const visitorsResponse = await visitorService.getVisitors({
            page: currentPage,
            limit: itemsPerPage,
            search: activeSearchTerm,
            filterBy: filterBy,
          });
          const visitorsData = visitorsResponse.data?.data || [];
          const total = visitorsResponse.data?.total || 0;
          const pages = visitorsResponse.data?.totalPages || 1;
          setVisitors(visitorsData);
          setTotalVisitors(total);
          setTotalPages(pages);
          setIsUsingLatestVisitors(false);
        }
      } catch (error: any) {
        if (error instanceof ApiClientError) {
          toast.error(error.response.message || "Erro ao cadastrar visitante");
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Erro ao cadastrar visitante");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar visitante");
    }
  };

  const handleViewVisitor = async (visitor: Visitor) => {
    setIsViewDialogOpen(true);
    setIsLoadingVisitorDetails(true);
    setPhotoError(null);
    
    // Iniciar loading da imagem
    if (visitor.photoUrl) {
      setImageLoading(prev => ({ ...prev, [visitor._id]: true }));
    }
    
    try {
      // Buscar dados completos do visitante da API
      const response = await visitorService.getVisitorById(visitor._id);
      if (response.data) {
        setSelectedVisitor(response.data);
        // Iniciar loading da imagem se houver photoUrl
        if (response.data.photoUrl) {
          setImageLoading(prev => ({ ...prev, [response.data._id]: true }));
        }
      } else {
        // Se a API não retornar, usar os dados que já temos
        setSelectedVisitor(visitor);
      }
    } catch (error: any) {
      console.warn("Erro ao buscar detalhes do visitante:", error);
      // Em caso de erro, usar os dados que já temos
      setSelectedVisitor(visitor);
      toast.error("Erro ao carregar detalhes completos do visitante");
    } finally {
      setIsLoadingVisitorDetails(false);
    }
  };

  const handlePhotoCapture = (file: File) => {
    setCapturedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    visitorForm.setValue("photo", file);
    setShowCamera(false);
  };

  const handleRemovePhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreview(null);
    visitorForm.setValue("photo", undefined);
  };

  const handleTypeChange = (
    type: "convidado" | "prestador_servico",
    checked: boolean
  ) => {
    const currentTypes = visitorForm.watch("types") || [];
    if (checked) {
      visitorForm.setValue("types", [...currentTypes, type]);
    } else {
      visitorForm.setValue(
        "types",
        currentTypes.filter((t) => t !== type)
      );
    }
  };

  const handleEditVisitor = async (visitor: Visitor, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevenir que o clique abra o modal de visualização
    setIsEditDialogOpen(true);
    setIsLoadingVisitorForEdit(true);
    setEditingVisitor(null);
    
    try {
      // Buscar dados completos do visitante da API
      const response = await visitorService.getVisitorById(visitor._id);
      const visitorData = response.data || visitor;
      setEditingVisitor(visitorData);

      // Converter tipos de maiúsculas para minúsculas para o formulário
      const typesForForm = visitorData.types.map((type) => {
        if (type === "PRESTADOR" || type === "prestador_servico") return "prestador_servico";
        return "convidado";
      }) as ("convidado" | "prestador_servico")[];

      // Preencher formulário com dados do visitante
      const formData = {
        name: visitorData.name || "",
        document: visitorData.document || "",
        phone: visitorData.phone || "",
        email: visitorData.email || "",
        vehicleType: visitorData.vehicleType 
          ? (visitorData.vehicleType.toLowerCase() === "carro" ? "CARRO" : visitorData.vehicleType.toUpperCase())
          : "none",
        vehiclePlate: visitorData.vehiclePlate || "",
        apartment: visitorData.apartmentNumber || "",
        types: typesForForm,
        note: visitorData.note || "",
      };
      editVisitorForm.reset(formData);
      // Salvar dados iniciais para comparação
      setInitialEditData({
        ...formData,
        photoUrl: visitorData.photoUrl,
      });
    } catch (error: any) {
      console.warn("Erro ao buscar detalhes do visitante:", error);
      setEditingVisitor(visitor);
      
      // Preencher formulário mesmo em caso de erro
      const typesForForm = visitor.types.map((type) => {
        if (type === "PRESTADOR" || type === "prestador_servico") return "prestador_servico";
        return "convidado";
      }) as ("convidado" | "prestador_servico")[];

      const formData = {
        name: visitor.name || "",
        document: visitor.document || "",
        phone: visitor.phone || "",
        email: visitor.email || "",
        vehicleType: visitor.vehicleType 
          ? (visitor.vehicleType.toLowerCase() === "carro" ? "CARRO" : visitor.vehicleType.toUpperCase())
          : "none",
        vehiclePlate: visitor.vehiclePlate || "",
        apartment: visitor.apartmentNumber || "",
        types: typesForForm,
        note: visitor.note || "",
      };
      editVisitorForm.reset(formData);
      // Salvar dados iniciais para comparação
      setInitialEditData({
        ...formData,
        photoUrl: visitor.photoUrl,
      });
      
      toast.error("Erro ao carregar detalhes do visitante");
    } finally {
      setIsLoadingVisitorForEdit(false);
    }
  };

  const handleEditTypeChange = (
    type: "convidado" | "prestador_servico",
    checked: boolean
  ) => {
    const currentTypes = editVisitorForm.watch("types") || [];
    if (checked) {
      editVisitorForm.setValue("types", [...currentTypes, type]);
    } else {
      editVisitorForm.setValue(
        "types",
        currentTypes.filter((t) => t !== type)
      );
    }
  };

  // Observar mudanças nos campos do formulário de edição para detectar alterações
  const watchedEditFields = editVisitorForm.watch([
    "name",
    "document",
    "phone",
    "email",
    "vehicleType",
    "vehiclePlate",
    "apartment",
    "types",
    "note",
  ]);

  // Calcular se há mudanças (recalcula quando watchedEditFields mudam)
  const hasChanges = useMemo(() => {
    if (!editingVisitor || !initialEditData) return false;
    
    const currentData = editVisitorForm.getValues();
    
    // Normalizar valores para comparação (tratar strings vazias como undefined)
    const normalize = (value: any) => {
      if (value === "" || value === null || value === undefined) return "";
      if (typeof value === "string") return value.trim();
      return value;
    };
    
    // Normalizar vehicleType: "none" deve ser tratado como ""
    const normalizeVehicleType = (value: any) => {
      if (value === "none" || value === "" || value === null || value === undefined) return "";
      return String(value).trim();
    };
    
    const hasFormChanges = 
      normalize(currentData.name) !== normalize(initialEditData.name) ||
      normalize(currentData.document) !== normalize(initialEditData.document) ||
      normalize(currentData.phone) !== normalize(initialEditData.phone) ||
      normalize(currentData.email) !== normalize(initialEditData.email) ||
      normalizeVehicleType(currentData.vehicleType) !== normalizeVehicleType(initialEditData.vehicleType) ||
      normalize(currentData.vehiclePlate) !== normalize(initialEditData.vehiclePlate) ||
      normalize(currentData.apartment) !== normalize(initialEditData.apartment) ||
      JSON.stringify((currentData.types || []).sort()) !== JSON.stringify((initialEditData.types || []).sort()) ||
      normalize(currentData.note) !== normalize(initialEditData.note);
    
    return hasFormChanges;
  }, [watchedEditFields, initialEditData, editingVisitor, editVisitorForm]);

  const handleUpdateVisitor = async (data: VisitorEditSchema) => {
    if (!editingVisitor) return;

    try {
      // Get token and extract buildingId
      const token =
        localStorage.getItem("concierge_token") ||
        sessionStorage.getItem("concierge_token") ||
        localStorage.getItem("coliseu_access_token") ||
        sessionStorage.getItem("coliseu_access_token");

      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      let buildingId = "";
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          buildingId = payload.buildingId || payload.building_id || "";
        }
      } catch (decodeError) {
        console.error("Erro ao decodificar token:", decodeError);
      }

      if (!buildingId) {
        toast.error(
          "BuildingId não encontrado no token. Faça login novamente."
        );
        return;
      }

      // Buscar o ID do apartamento pelo número e buildingId (se fornecido)
      let apartmentId: string | undefined;
      if (data.apartment && data.apartment.trim()) {
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
        } catch (error: any) {
          toast.error(
            error.message ||
              "Erro ao buscar apartamento. Verifique se o número está correto."
          );
          return;
        }
      }

      // Converter tipos para maiúsculas conforme API
      const typesUpperCase = data.types.map((type) => {
        if (type === "prestador_servico") return "PRESTADOR";
        return "CONVIDADO";
      }) as ("CONVIDADO" | "PRESTADOR")[];

      const payload: UpdateVisitorRequest = {
        name: data.name.trim(),
        document: data.document?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        vehicleType: data.vehicleType?.trim() 
          ? data.vehicleType.trim().toUpperCase() 
          : undefined,
        vehiclePlate: data.vehiclePlate?.trim() || undefined,
        apartmentId: apartmentId,
        types: typesUpperCase,
        note: data.note?.trim() || undefined,
        active: editingVisitor.active !== false, // Manter status atual ou true por padrão
      };

      // Atualizar visitante
      await visitorService.updateVisitor(editingVisitor._id, payload);

      toast.success("Visitante atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingVisitor(null);
      setInitialEditData(null);
      editVisitorForm.reset();

      // Reload visitors - use latest if no search, otherwise use paginated
      if (!activeSearchTerm) {
        const latestResponse = await visitorService.getLatestVisitors(10);
        const visitorsData = latestResponse.data || [];
        setVisitors(visitorsData);
        setTotalVisitors(visitorsData.length);
        setTotalPages(1);
        setIsUsingLatestVisitors(true);
      } else {
        const visitorsResponse = await visitorService.getVisitors({
          page: currentPage,
          limit: itemsPerPage,
          search: activeSearchTerm,
          filterBy: filterBy,
        });
        const visitorsData = visitorsResponse.data?.data || [];
        const total = visitorsResponse.data?.total || 0;
        const pages = visitorsResponse.data?.totalPages || 1;
        setVisitors(visitorsData);
        setTotalVisitors(total);
        setTotalPages(pages);
        setIsUsingLatestVisitors(false);
      }
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        toast.error(error.response.message || "Erro ao atualizar visitante");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao atualizar visitante");
      }
    }
  };



  if (isLoading) {
    return <VisitorsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visitantes</h1>
          <p className="text-muted-foreground">
            Gerencie e pesquise visitantes do condomínio
          </p>
        </div>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="busca">Busca</TabsTrigger>
              <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
            </TabsList>

            {/* Busca Tab */}
            <TabsContent value="busca" className="mt-6">
              {/* Search Field */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      className="pl-9 h-12 text-base"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="default" className="h-12">
                        {filterBy === "name" && "Nome"}
                        {filterBy === "document" && "Documento"}
                        {filterBy === "apartment" && "Apartamento"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setFilterBy("name")}
                        className="flex items-center justify-between"
                      >
                        <span>Nome</span>
                        {filterBy === "name" && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterBy("document")}
                        className="flex items-center justify-between"
                      >
                        <span>Documento</span>
                        {filterBy === "document" && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterBy("apartment")}
                        className="flex items-center justify-between"
                      >
                        <span>Apartamento</span>
                        {filterBy === "apartment" && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={handleSearch}
                    size="default"
                    className="h-12"
                  >
                    Buscar
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {isUsingLatestVisitors ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Últimos visitantes cadastrados</span>
                      {" - "}
                      Mostrando {filteredVisitors.length} visitante(s)
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Mostrando{" "}
                        {paginatedVisitors.length > 0
                          ? (currentPage - 1) * itemsPerPage + 1
                          : 0}{" "}
                        a{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredVisitors.length
                        )}{" "}
                        de {filteredVisitors.length} visitante(s)
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
                            setCurrentPage(1);
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
                    </>
                  )}
                </div>

                {filteredVisitors.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <UserCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum visitante encontrado
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {paginatedVisitors.map((visitor) => (
                          <div
                            key={visitor._id}
                            className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                          >
                            <div
                              className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
                              onClick={() => handleViewVisitor(visitor)}
                            >
                              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                                <User className="w-7 h-7 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-1 truncate">
                                  {visitor.name}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {visitor.apartmentNumber && (
                                    <>
                                      <span>Apt: {visitor.apartmentNumber}</span>
                                      {(visitor.phone || visitor.vehiclePlate) && (
                                        <span className="text-muted-foreground/50">•</span>
                                      )}
                                    </>
                                  )}
                                  {visitor.phone && (
                                    <>
                                      <span>{visitor.phone}</span>
                                      {visitor.vehiclePlate && (
                                        <span className="text-muted-foreground/50">•</span>
                                      )}
                                    </>
                                  )}
                                  {visitor.vehiclePlate && (
                                    <span className="font-mono">{visitor.vehiclePlate}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex flex-wrap gap-1.5">
                              {[...visitor.types]
                                .sort((a, b) => {
                                  const aLabel = a === "convidado" || a === "CONVIDADO" ? "Convidado" : "Prestador";
                                  const bLabel = b === "convidado" || b === "CONVIDADO" ? "Convidado" : "Prestador";
                                  return aLabel.localeCompare(bLabel);
                                })
                                .map((type) => (
                                  <Badge
                                    key={type}
                                    variant={
                                      type === "convidado" || type === "CONVIDADO"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {type === "convidado" || type === "CONVIDADO"
                                      ? "Convidado"
                                      : "Prestador"}
                                  </Badge>
                                ))}
                            </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => handleEditVisitor(visitor, e)}
                                title="Editar visitante"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isUsingLatestVisitors && totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
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
                                    currentPage === page ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
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
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
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

            {/* Cadastro Tab */}
            <TabsContent value="cadastro" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cadastrar Novo Visitante</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      visitorForm.handleSubmit(
                        (data) => {
                          console.log("Form data:", data);
                          handleAddVisitor(data);
                        },
                        (errors) => {
                          console.error("Form validation errors:", errors);
                          toast.error("Por favor, corrija os erros no formulário");
                        }
                      )();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: João Silva Santos"
                        {...visitorForm.register("name")}
                      />
                      {visitorForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document">Documento (Opcional)</Label>
                      <Input
                        id="document"
                        placeholder="00000000000"
                        maxLength={11}
                        {...visitorForm.register("document")}
                      />
                      {visitorForm.formState.errors.document && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.document.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone (Opcional)</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 98765-4321"
                        {...visitorForm.register("phone")}
                      />
                      {visitorForm.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemplo@email.com"
                        {...visitorForm.register("email")}
                      />
                      {visitorForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Tipo de Veículo (Opcional)</Label>
                        <Select
                          value={visitorForm.watch("vehicleType") || "none"}
                          onValueChange={(value) =>
                            visitorForm.setValue("vehicleType", value === "none" ? "" : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de veículo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            <SelectItem value="CARRO">Carro</SelectItem>
                            <SelectItem value="MOTO">Moto</SelectItem>
                          </SelectContent>
                        </Select>
                        {visitorForm.formState.errors.vehicleType && (
                          <p className="text-sm text-destructive">
                            {visitorForm.formState.errors.vehicleType.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehiclePlate">Placa (Opcional)</Label>
                        <Input
                          id="vehiclePlate"
                          placeholder="ABC1234 ou ABC1D23"
                          {...visitorForm.register("vehiclePlate")}
                        />
                        {visitorForm.formState.errors.vehiclePlate && (
                          <p className="text-sm text-destructive">
                            {visitorForm.formState.errors.vehiclePlate.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apartment">Apartamento (Opcional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {visitorForm.watch("apartment")
                              ? (() => {
                                  const selectedApt = apartments.find(
                                    (apt) => apt.number === visitorForm.watch("apartment")
                                  );
                                  return selectedApt
                                    ? `${selectedApt.block ? `Bloco ${selectedApt.block} - ` : ""}Apartamento ${selectedApt.number}${selectedApt.floor ? ` (${selectedApt.floor}º andar)` : ""}`
                                    : visitorForm.watch("apartment");
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
                                          visitorForm.setValue("apartment", apt.number);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            visitorForm.watch("apartment") === apt.number
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
                      {visitorForm.formState.errors.apartment && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.apartment.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Visitante *</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="convidado"
                            checked={visitorForm
                              .watch("types")
                              ?.includes("convidado")}
                            onCheckedChange={(checked) =>
                              handleTypeChange("convidado", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="convidado"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Convidado
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="prestador_servico"
                            checked={visitorForm
                              .watch("types")
                              ?.includes("prestador_servico")}
                            onCheckedChange={(checked) =>
                              handleTypeChange(
                                "prestador_servico",
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="prestador_servico"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Prestador de Serviço
                          </Label>
                        </div>
                      </div>
                      {visitorForm.formState.errors.types && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.types.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo">Foto *</Label>
                      {showCamera ? (
                        <CameraCapture
                          onCapture={handlePhotoCapture}
                          onCancel={() => setShowCamera(false)}
                        />
                      ) : (
                        <div className="space-y-2">
                          {photoPreview ? (
                            <div className="relative">
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleRemovePhoto}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCamera(true)}
                                className="flex-1"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Tirar Foto
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note">Observações (Opcional)</Label>
                      <Textarea
                        id="note"
                        placeholder="Digite observações sobre o visitante..."
                        rows={4}
                        {...visitorForm.register("note")}
                      />
                      {visitorForm.formState.errors.note && (
                        <p className="text-sm text-destructive">
                          {visitorForm.formState.errors.note.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={visitorForm.formState.isSubmitting}
                      >
                        {visitorForm.formState.isSubmitting
                          ? "Cadastrando..."
                          : "Cadastrar Visitante"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          visitorForm.reset();
                          setCapturedPhoto(null);
                          setPhotoPreview(null);
                          setShowCamera(false);
                        }}
                        disabled={visitorForm.formState.isSubmitting}
                      >
                        Limpar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Visitor Dialog */}
      <Dialog 
        open={isViewDialogOpen} 
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            setSelectedVisitor(null);
            setPhotoError(null);
            // Limpar loading states
            setImageLoading({});
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Detalhes do Visitante
            </DialogTitle>
          </DialogHeader>

          {isLoadingVisitorDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
              </div>
            </div>
          ) : selectedVisitor ? (
            <>
              <div className="space-y-4 overflow-y-auto px-6 flex-1 min-h-0">
                <div className="flex justify-center">
                  {photoError || !selectedVisitor.photoUrl ? (
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                      <span className="text-4xl font-bold text-primary">
                        {selectedVisitor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-32 h-32">
                      {imageLoading[selectedVisitor._id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full border-4 border-primary/20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      )}
                      <img
                        src={selectedVisitor.photoUrl}
                        alt={`Foto de ${selectedVisitor.name}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                        style={{ display: imageLoading[selectedVisitor._id] ? 'none' : 'block' }}
                        onError={() => {
                          setPhotoError(selectedVisitor.photoUrl || null);
                          setImageLoading(prev => ({ ...prev, [selectedVisitor._id]: false }));
                          console.warn("Erro ao carregar foto:", selectedVisitor.photoUrl);
                        }}
                        onLoad={() => {
                          setPhotoError(null);
                          setImageLoading(prev => ({ ...prev, [selectedVisitor._id]: false }));
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-semibold text-lg">{selectedVisitor.name}</p>
                  </div>

                  {selectedVisitor.document && (
                    <div>
                      <Label className="text-muted-foreground">Documento</Label>
                      <p className="font-medium">{selectedVisitor.document}</p>
                    </div>
                  )}

                  {selectedVisitor.email && (
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedVisitor.email}</p>
                    </div>
                  )}

                  {selectedVisitor.phone && (
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{selectedVisitor.phone}</p>
                    </div>
                  )}

                  {selectedVisitor.apartmentNumber && (
                    <div>
                      <Label className="text-muted-foreground">Apartamento</Label>
                      <p className="font-medium">{selectedVisitor.apartmentNumber}</p>
                    </div>
                  )}

                    <div>
                      <Label className="text-muted-foreground">Tipos</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {[...selectedVisitor.types]
                          .sort((a, b) => {
                            const aLabel = a === "convidado" || a === "CONVIDADO" ? "Convidado" : "Prestador de Serviço";
                            const bLabel = b === "convidado" || b === "CONVIDADO" ? "Convidado" : "Prestador de Serviço";
                            return aLabel.localeCompare(bLabel);
                          })
                          .map((type) => (
                            <Badge
                              key={type}
                              variant={
                                type === "convidado" || type === "CONVIDADO" ? "default" : "secondary"
                              }
                            >
                              {type === "convidado" || type === "CONVIDADO"
                                ? "Convidado"
                                : "Prestador de Serviço"}
                            </Badge>
                          ))}
                      </div>
                    </div>

                  {selectedVisitor.vehicleType && (
                    <div>
                      <Label className="text-muted-foreground">Tipo de Veículo</Label>
                      <p className="font-medium">{selectedVisitor.vehicleType}</p>
                    </div>
                  )}

                  {selectedVisitor.vehiclePlate && (
                    <div>
                      <Label className="text-muted-foreground">Placa</Label>
                      <p className="font-medium">{selectedVisitor.vehiclePlate}</p>
                    </div>
                  )}

                  {selectedVisitor.note && (
                    <div>
                      <Label className="text-muted-foreground">Observações</Label>
                      <p className="font-medium whitespace-pre-wrap">{selectedVisitor.note}</p>
                    </div>
                  )}

                  {selectedVisitor.registeredAt && (
                    <div>
                      <Label className="text-muted-foreground">Data de Registro</Label>
                      <p className="font-medium">
                        {new Date(selectedVisitor.registeredAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}

                  {selectedVisitor.registeredBy && (
                    <div>
                      <Label className="text-muted-foreground">Registrado por</Label>
                      <p className="font-medium">{selectedVisitor.registeredBy}</p>
                    </div>
                  )}

                  {selectedVisitor.updatedBy && (
                    <div>
                      <Label className="text-muted-foreground">Editado por</Label>
                      <p className="font-medium">{selectedVisitor.updatedBy}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedVisitor(null);
                    setPhotoError(null);
                  }}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Visitor Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingVisitor(null);
            setInitialEditData(null);
            editVisitorForm.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Editar Visitante
            </DialogTitle>
          </DialogHeader>

          {isLoadingVisitorForEdit ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Carregando dados do visitante...</p>
              </div>
            </div>
          ) : editingVisitor ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editVisitorForm.handleSubmit(
                  (data) => {
                    console.log("Form data:", data);
                    handleUpdateVisitor(data);
                  },
                  (errors) => {
                    console.error("Form validation errors:", errors);
                    toast.error("Por favor, corrija os erros no formulário");
                  }
                )();
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-4 overflow-y-auto px-6 flex-1 min-h-0">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Ex: João Silva Santos"
                    {...editVisitorForm.register("name")}
                  />
                  {editVisitorForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {editVisitorForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-document">Documento (Opcional)</Label>
                    <Input
                      id="edit-document"
                      placeholder="CPF ou RG"
                      {...editVisitorForm.register("document")}
                    />
                    {editVisitorForm.formState.errors.document && (
                      <p className="text-sm text-destructive">
                        {editVisitorForm.formState.errors.document.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telefone (Opcional)</Label>
                    <Input
                      id="edit-phone"
                      placeholder="(00) 00000-0000"
                      {...editVisitorForm.register("phone")}
                    />
                    {editVisitorForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {editVisitorForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email (Opcional)</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="email@example.com"
                    {...editVisitorForm.register("email")}
                  />
                  {editVisitorForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {editVisitorForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-vehicleType">Tipo de Veículo (Opcional)</Label>
                    <Select
                      value={editVisitorForm.watch("vehicleType") || "none"}
                      onValueChange={(value) =>
                        editVisitorForm.setValue("vehicleType", value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="CARRO">Carro</SelectItem>
                        <SelectItem value="MOTO">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                    {editVisitorForm.formState.errors.vehicleType && (
                      <p className="text-sm text-destructive">
                        {editVisitorForm.formState.errors.vehicleType.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vehiclePlate">Placa (Opcional)</Label>
                    <Input
                      id="edit-vehiclePlate"
                      placeholder="ABC1234 ou ABC1D23"
                      {...editVisitorForm.register("vehiclePlate")}
                    />
                    {editVisitorForm.formState.errors.vehiclePlate && (
                      <p className="text-sm text-destructive">
                        {editVisitorForm.formState.errors.vehiclePlate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-apartment">Apartamento (Opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {editVisitorForm.watch("apartment")
                          ? (() => {
                              const selectedApt = apartments.find(
                                (apt) => apt.number === editVisitorForm.watch("apartment")
                              );
                              return selectedApt
                                ? `${selectedApt.block ? `Bloco ${selectedApt.block} - ` : ""}Apartamento ${selectedApt.number}${selectedApt.floor ? ` (${selectedApt.floor}º andar)` : ""}`
                                : editVisitorForm.watch("apartment");
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
                                      editVisitorForm.setValue("apartment", apt.number);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editVisitorForm.watch("apartment") === apt.number
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
                  {editVisitorForm.formState.errors.apartment && (
                    <p className="text-sm text-destructive">
                      {editVisitorForm.formState.errors.apartment.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tipos de Visitante *</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-convidado"
                        checked={editVisitorForm
                          .watch("types")
                          ?.includes("convidado")}
                        onCheckedChange={(checked) =>
                          handleEditTypeChange(
                            "convidado",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="edit-convidado"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Convidado
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-prestador_servico"
                        checked={editVisitorForm
                          .watch("types")
                          ?.includes("prestador_servico")}
                        onCheckedChange={(checked) =>
                          handleEditTypeChange(
                            "prestador_servico",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="edit-prestador_servico"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Prestador de Serviço
                      </Label>
                    </div>
                  </div>
                  {editVisitorForm.formState.errors.types && (
                    <p className="text-sm text-destructive">
                      {editVisitorForm.formState.errors.types.message}
                    </p>
                  )}
                </div>


                <div className="space-y-2">
                  <Label htmlFor="edit-note">Observações (Opcional)</Label>
                  <Textarea
                    id="edit-note"
                    placeholder="Digite observações sobre o visitante..."
                    rows={4}
                    {...editVisitorForm.register("note")}
                  />
                  {editVisitorForm.formState.errors.note && (
                    <p className="text-sm text-destructive">
                      {editVisitorForm.formState.errors.note.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 pb-6 px-6 border-t flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingVisitor(null);
                    setInitialEditData(null);
                    editVisitorForm.reset();
                  }}
                  disabled={editVisitorForm.formState.isSubmitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editVisitorForm.formState.isSubmitting || !hasChanges}
                  className="flex-1"
                >
                  {editVisitorForm.formState.isSubmitting
                    ? "Salvando..."
                    : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

