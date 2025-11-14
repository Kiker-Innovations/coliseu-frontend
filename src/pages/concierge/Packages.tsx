import { useState, useEffect } from "react";
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
  Package,
  PlusCircle,
  CheckCircle,
  Clock,
  Search,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  packageSchema,
  deliverySchema,
  type PackageSchema,
  type DeliverySchema,
} from "@/schemas/concierge/package.schema";
import PackagesSkeleton from "@/skeleton/concierge/PackagesSkeleton";
import {
  createPackage,
  getPendingPackages,
  getDeliveredPackages,
  confirmPackageDelivery,
  type PendingPackage,
  type DeliveredPackage,
} from "@/services/package.service";
import { getCurrentConcierge } from "@/services/concierge.service";
import { getApartmentByNumber } from "@/services/apartment.service";

interface PackageData {
  id: string;
  recipientName: string;
  description: string;
  apartment: string;
  arrivalDate: string;
  status: "pending" | "delivered";
  deliveredAt?: string;
  receivedBy?: string;
  registeredBy: string;
  registeredAt: string;
}

export default function ConciergePackages() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [apartments, setApartments] = useState<string[]>([]);
  const [conciergeId, setConciergeId] = useState<string>("");
  const [conciergeName, setConciergeName] = useState<string>("Porteiro");

  useEffect(() => {
    // Carregar dados do porteiro do localStorage
    const loadConciergeData = async () => {
      const storedConciergeId = localStorage.getItem("concierge_id") || "";
      const storedConciergeName = localStorage.getItem("concierge_name") || "Porteiro";
      
      setConciergeId(storedConciergeId);
      setConciergeName(storedConciergeName);

      // Se não tiver ID, tentar buscar do perfil usando o token
      if (!storedConciergeId) {
        const token = localStorage.getItem("concierge_token");
        if (token) {
          try {
            const concierge = await getCurrentConcierge();
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
            // Tentar decodificar o token JWT se possível (fallback)
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
        } else {
          console.warn("Token não encontrado no localStorage");
        }
      }
    };

    loadConciergeData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [pending, delivered] = await Promise.all([
          getPendingPackages(),
          getDeliveredPackages(),
        ]);

        // Map pending packages
        const pendingMapped: PackageData[] = pending.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartment: pkg.apartmentNumber,
          arrivalDate: pkg.receiverDate,
          status: "pending" as const,
          registeredBy: pkg.receiverConciergeName,
          registeredAt: pkg.receiverDate,
        }));

        // Map delivered packages
        const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartment: pkg.apartmentNumber,
          arrivalDate: pkg.deliveryDate, // Using deliveryDate as reference
          status: "delivered" as const,
          deliveredAt: pkg.deliveryDate,
          receivedBy: pkg.recipientName,
          registeredBy: pkg.deliveryConciergeName,
          registeredAt: pkg.deliveryDate,
        }));

        setPackages([...pendingMapped, ...deliveredMapped]);

        // Extract unique apartment numbers for the select
        const uniqueApartments = Array.from(
          new Set([
            ...pending.map((p) => p.apartmentNumber),
            ...delivered.map((p) => p.apartmentNumber),
          ])
        ).sort();
        setApartments(uniqueApartments);
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

  const handleAddPackage = async (data: PackageSchema) => {
    try {
      // Validar se temos o ID do porteiro - tentar buscar novamente se não tiver
      let currentConciergeId = conciergeId || localStorage.getItem("concierge_id") || "";
      
      // Se ainda não tiver ID, tentar buscar do perfil
      if (!currentConciergeId) {
        const token = localStorage.getItem("concierge_token");
        if (token) {
          try {
            const concierge = await getCurrentConcierge();
            if (concierge.id) {
              currentConciergeId = String(concierge.id);
              setConciergeId(currentConciergeId);
              localStorage.setItem("concierge_id", currentConciergeId);
            }
          } catch (error: any) {
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
              // Ignorar erro de decodificação
            }
          }
        }
      }
      
      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      // Buscar o ID do apartamento pelo número
      const buildingId = localStorage.getItem("concierge_building_id");
      if (!buildingId) {
        toast.error("ID do condomínio não encontrado. Faça login novamente.");
        return;
      }

      let apartmentId: string;
      try {
        const apartment = await getApartmentByNumber(buildingId, data.apartment);
        if (!apartment) {
          toast.error(`Apartamento ${data.apartment} não encontrado no condomínio.`);
          return;
        }
        apartmentId = apartment._id;
      } catch (error: any) {
        toast.error(error.message || "Erro ao buscar apartamento. Verifique se o número está correto.");
        return;
      }

      // Convert datetime-local to ISO string
      const receiverDate = new Date(data.arrivalDate).toISOString();

      await createPackage({
        ownerName: data.recipientName,
        apartmentId: apartmentId,
        description: data.description,
        receiverDate: receiverDate,
        receiverConciergeId: currentConciergeId,
      });

      toast.success("Encomenda cadastrada com sucesso!");
      setIsAddDialogOpen(false);
      packageForm.reset();

      // Reload packages
      const [pending, delivered] = await Promise.all([
        getPendingPackages(),
        getDeliveredPackages(),
      ]);

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        registeredBy: pkg.receiverConciergeName,
        registeredAt: pkg.receiverDate,
      }));

      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        registeredBy: pkg.deliveryConciergeName,
        registeredAt: pkg.deliveryDate,
      }));

      setPackages([...pendingMapped, ...deliveredMapped]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar encomenda");
    }
  };

  const handleMarkAsDelivered = async (data: DeliverySchema) => {
    if (!selectedPackage) return;

    try {
      // Validar se temos o ID do porteiro - tentar buscar novamente se não tiver
      let currentConciergeId = conciergeId || localStorage.getItem("concierge_id") || "";
      
      // Se ainda não tiver ID, tentar buscar do perfil
      if (!currentConciergeId) {
        const token = localStorage.getItem("concierge_token");
        if (token) {
          try {
            const concierge = await getCurrentConcierge();
            if (concierge.id) {
              currentConciergeId = String(concierge.id);
              setConciergeId(currentConciergeId);
              localStorage.setItem("concierge_id", currentConciergeId);
            }
          } catch (error: any) {
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
              // Ignorar erro de decodificação
            }
          }
        }
      }
      
      if (!currentConciergeId) {
        toast.error("ID do porteiro não encontrado. Faça login novamente.");
        return;
      }

      await confirmPackageDelivery(selectedPackage.id, {
        recipientName: data.receivedBy,
        deliveryConciergeId: currentConciergeId,
      });

      toast.success(
        `Encomenda marcada como entregue! Recebida por: ${data.receivedBy}`
      );
      setIsDeliveryDialogOpen(false);
      setSelectedPackage(null);
      deliveryForm.reset();

      // Reload packages
      const [pending, delivered] = await Promise.all([
        getPendingPackages(),
        getDeliveredPackages(),
      ]);

      const pendingMapped: PackageData[] = pending.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.receiverDate,
        status: "pending" as const,
        registeredBy: pkg.receiverConciergeName,
        registeredAt: pkg.receiverDate,
      }));

      const deliveredMapped: PackageData[] = delivered.map((pkg) => ({
        id: pkg._id,
        recipientName: pkg.ownerName,
        description: pkg.description,
        apartment: pkg.apartmentNumber,
        arrivalDate: pkg.deliveryDate,
        status: "delivered" as const,
        deliveredAt: pkg.deliveryDate,
        receivedBy: pkg.recipientName,
        registeredBy: pkg.deliveryConciergeName,
        registeredAt: pkg.deliveryDate,
      }));

      setPackages([...pendingMapped, ...deliveredMapped]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao marcar encomenda como entregue");
    }
  };

  const handleOpenDeliveryDialog = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setIsDeliveryDialogOpen(true);
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
                  {pendingPackages.length}
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
                  {
                    deliveredPackages.filter(
                      (pkg) =>
                        pkg.deliveredAt &&
                        new Date(pkg.deliveredAt).toDateString() ===
                          new Date().toDateString()
                    ).length
                  }
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
                <p className="text-sm text-muted-foreground">Total Entregues</p>
                <p className="text-3xl font-bold text-primary">
                  {deliveredPackages.length}
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
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pendentes ({filteredPendingPackages.length})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Entregues ({filteredDeliveredPackages.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Packages */}
            <TabsContent value="pending" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Apto</TableHead>
                      <TableHead>Chegada</TableHead>
                      <TableHead>Registrado por</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingPackages.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Nenhuma encomenda encontrada"
                            : "Nenhuma encomenda pendente"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPendingPackages.map((pkg) => (
                        <TableRow key={pkg.id}>
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
                          <TableCell>
                            <Badge variant="outline">{pkg.apartment}</Badge>
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
                            {pkg.registeredBy}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleOpenDeliveryDialog(pkg)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar Entregue
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Delivered Packages */}
            <TabsContent value="delivered" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Apto</TableHead>
                      <TableHead>Entregue em</TableHead>
                      <TableHead>Recebido por</TableHead>
                      <TableHead>Registrado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveredPackages.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Nenhuma encomenda encontrada"
                            : "Nenhuma encomenda entregue ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeliveredPackages.map((pkg) => (
                        <TableRow key={pkg.id} className="bg-green-50/30">
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
                          <TableCell>
                            <Badge variant="outline">{pkg.apartment}</Badge>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Package Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Cadastrar Nova Encomenda
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da encomenda que chegou
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={packageForm.handleSubmit(handleAddPackage)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="recipientName">Nome do Destinatário *</Label>
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
                    apartments.map((apt) => (
                      <SelectItem key={apt} value={apt}>
                        Apartamento {apt}
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
              <Label htmlFor="description">Descrição da Encomenda *</Label>
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

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
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
          </form>
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
                  <Label htmlFor="receivedBy">Quem recebeu? *</Label>
                  <Input
                    id="receivedBy"
                    placeholder="Nome de quem recebeu a encomenda"
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
    </div>
  );
}
