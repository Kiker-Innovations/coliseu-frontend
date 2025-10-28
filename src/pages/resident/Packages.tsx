import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  CheckCircle,
  Clock,
  Search,
  User,
  Calendar,
  Inbox,
} from "lucide-react";
import PackagesSkeleton from "../../skeleton/resident/PackagesSkeleton";

interface PackageData {
  id: number;
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

export default function Packages() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Simulated logged-in resident info (would come from auth context)
  const residentApartment = "101";

  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Mock data - packages for the logged-in resident's apartment
  const [packages] = useState<PackageData[]>([
    {
      id: 1,
      recipientName: "João Silva Santos",
      description: "Caixa grande - Amazon (eletrônicos)",
      apartment: "101",
      arrivalDate: "2025-10-27T09:30:00",
      status: "pending",
      registeredBy: "Maria Santos",
      registeredAt: "2025-10-27T09:30:00",
    },
    {
      id: 2,
      recipientName: "Maria Silva",
      description: "Envelope - Correios (documentos)",
      apartment: "101",
      arrivalDate: "2025-10-27T14:15:00",
      status: "pending",
      registeredBy: "José Silva",
      registeredAt: "2025-10-27T14:15:00",
    },
    {
      id: 3,
      recipientName: "Pedro Silva Santos",
      description: "Caixa média - Mercado Livre (livros)",
      apartment: "101",
      arrivalDate: "2025-10-26T16:45:00",
      status: "delivered",
      deliveredAt: "2025-10-26T18:30:00",
      receivedBy: "João Silva Santos",
      registeredBy: "Maria Santos",
      registeredAt: "2025-10-26T16:45:00",
    },
    {
      id: 4,
      recipientName: "Maria Silva",
      description: "Caixa pequena - Shopee (roupas)",
      apartment: "101",
      arrivalDate: "2025-10-25T11:20:00",
      status: "delivered",
      deliveredAt: "2025-10-25T19:15:00",
      receivedBy: "Maria Silva",
      registeredBy: "José Silva",
      registeredAt: "2025-10-25T11:20:00",
    },
    {
      id: 5,
      recipientName: "João Silva Santos",
      description: "Pacote - DHL (importação)",
      apartment: "101",
      arrivalDate: "2025-10-24T08:00:00",
      status: "delivered",
      deliveredAt: "2025-10-24T20:00:00",
      receivedBy: "Pedro Silva Santos",
      registeredBy: "Maria Santos",
      registeredAt: "2025-10-24T08:00:00",
    },
  ]);

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
        pkg.receivedBy?.toLowerCase().includes(searchLower)
    );
  };

  const filteredPendingPackages = filterPackages(pendingPackages);
  const filteredDeliveredPackages = filterPackages(deliveredPackages);

  if (isLoading) {
    return <PackagesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Encomendas do Apartamento</h1>
        <p className="text-muted-foreground">
          Acompanhe as encomendas do apartamento {residentApartment} registradas
          pela portaria
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
                <p className="text-sm text-muted-foreground">
                  Entregues Este Mês
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {
                    deliveredPackages.filter((pkg) => {
                      const deliveryDate = pkg.deliveredAt
                        ? new Date(pkg.deliveredAt)
                        : null;
                      const now = new Date();
                      return (
                        deliveryDate &&
                        deliveryDate.getMonth() === now.getMonth() &&
                        deliveryDate.getFullYear() === now.getFullYear()
                      );
                    }).length
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
                <p className="text-sm text-muted-foreground">
                  Total de Encomendas
                </p>
                <p className="text-3xl font-bold text-primary">
                  {packages.length}
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data de Chegada</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingPackages.map((pkg) => (
                        <TableRow key={pkg.id} className="bg-yellow-50/30">
                          <TableCell>
                            <div className="font-medium">
                              {pkg.recipientName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium mb-1">
                              {pkg.description}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Registrada em{" "}
                              {new Date(pkg.registeredAt).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {new Date(pkg.arrivalDate).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <User className="w-3 h-3" />
                              {pkg.registeredBy}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-300"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Aguardando retirada
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Delivered Packages */}
            <TabsContent value="delivered" className="mt-6">
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data de Chegada</TableHead>
                        <TableHead>Data de Retirada</TableHead>
                        <TableHead>Retirado por</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveredPackages.map((pkg) => (
                        <TableRow key={pkg.id} className="bg-green-50/30">
                          <TableCell>
                            <div className="font-medium">
                              {pkg.recipientName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium mb-1">
                              {pkg.description}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              Registrado por {pkg.registeredBy}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(pkg.arrivalDate).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {pkg.deliveredAt &&
                                new Date(pkg.deliveredAt).toLocaleString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <User className="w-3 h-3" />
                              {pkg.receivedBy}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-300"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Retirada
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
