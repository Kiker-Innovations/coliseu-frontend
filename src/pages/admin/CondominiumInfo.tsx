import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  MapPin,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  condominiumBasicInfoSchema,
  type CondominiumBasicInfoSchema,
  commonAreaSchema,
  type CommonAreaSchema,
} from "@/schemas/admin/condominiumInfo.schema";
import CondominiumInfoSkeleton from "@/skeleton/admin/CondominiumInfoSkeleton";

export default function CondominiumInfo() {
  const [isLoading, setIsLoading] = useState(true);
  const [isResidentsOpen, setIsResidentsOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const basicInfoForm = useForm<CondominiumBasicInfoSchema>({
    resolver: zodResolver(condominiumBasicInfoSchema),
    defaultValues: {
      totalApartments: 276,
    },
  });

  const areaForm = useForm<CommonAreaSchema>({
    resolver: zodResolver(commonAreaSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      description: "",
      value: 0,
      fineValue: 0,
    },
  });

  // Mock data
  const condominiumData = {
    totalApartments: 276,
    totalResidents: 842,
    lastUpdate: "15/10/2025",
  };

  const commonAreas = [
    {
      id: 1,
      name: "Piscina",
      quantity: 2,
      description: "Piscinas adulto e infantil",
      value: 0,
      fineValue: 150,
    },
    {
      id: 2,
      name: "Salão de Festas",
      quantity: 1,
      description: "Capacidade para 80 pessoas",
      value: 500,
      fineValue: 1000,
    },
    {
      id: 3,
      name: "Academia",
      quantity: 1,
      description: "Academia completa com aparelhos modernos",
      value: 0,
      fineValue: 200,
    },
    {
      id: 4,
      name: "Quadra Poliesportiva",
      quantity: 1,
      description: "Quadra coberta para diversos esportes",
      value: 100,
      fineValue: 300,
    },
    {
      id: 5,
      name: "Churrasqueira",
      quantity: 4,
      description: "Churrasqueiras individuais com pia",
      value: 80,
      fineValue: 250,
    },
  ];

  const residents = [
    {
      apartment: "101",
      name: "João Silva Santos",
      email: "joao.silva@email.com",
    },
    {
      apartment: "102",
      name: "Maria Oliveira Costa",
      email: "maria.oliveira@email.com",
    },
    {
      apartment: "103",
      name: "Pedro Henrique Souza",
      email: "pedro.souza@email.com",
    },
    {
      apartment: "201",
      name: "Ana Paula Ferreira",
      email: "ana.ferreira@email.com",
    },
    {
      apartment: "202",
      name: "Carlos Eduardo Lima",
      email: "carlos.lima@email.com",
    },
    {
      apartment: "203",
      name: "Juliana Martins Rocha",
      email: "juliana.rocha@email.com",
    },
    {
      apartment: "301",
      name: "Roberto Carlos Alves",
      email: "roberto.alves@email.com",
    },
    {
      apartment: "302",
      name: "Fernanda Costa Dias",
      email: "fernanda.dias@email.com",
    },
    {
      apartment: "303",
      name: "Ricardo Pereira Gomes",
      email: "ricardo.gomes@email.com",
    },
    {
      apartment: "401",
      name: "Patrícia Santos Lima",
      email: "patricia.lima@email.com",
    },
  ];

  const onBasicInfoSubmit = async (data: CondominiumBasicInfoSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Informações básicas atualizadas com sucesso!");
      basicInfoForm.reset(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar informações");
    }
  };

  const onAreaSubmit = async (data: CommonAreaSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingAreaId) {
        toast.success("Área comum atualizada com sucesso!");
      } else {
        toast.success("Área comum cadastrada com sucesso!");
      }

      areaForm.reset();
      setIsAreaDialogOpen(false);
      setEditingAreaId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar área comum");
    }
  };

  const handleEditArea = (area: any) => {
    setEditingAreaId(area.id);
    areaForm.reset({
      name: area.name,
      quantity: area.quantity,
      description: area.description || "",
      value: area.value || 0,
      fineValue: area.fineValue || 0,
    });
    setIsAreaDialogOpen(true);
  };

  const handleDeleteArea = async (areaId: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Área comum removida com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover área comum");
    }
  };

  const handleCloseAreaDialog = () => {
    setIsAreaDialogOpen(false);
    setEditingAreaId(null);
    areaForm.reset();
  };

  if (isLoading) {
    return <CondominiumInfoSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Informações do Condomínio</h1>
        <p className="text-muted-foreground">
          Gerencie as informações e áreas comuns do condomínio
        </p>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Visualizar</TabsTrigger>
          <TabsTrigger value="register">Cadastrar</TabsTrigger>
        </TabsList>

        {/* Aba de Visualização */}
        <TabsContent value="view" className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Apartamentos
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {condominiumData.totalApartments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unidades residenciais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Condôminos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {condominiumData.totalResidents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Moradores cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Áreas Comuns
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commonAreas.length}</div>
                <p className="text-xs text-muted-foreground">
                  Espaços disponíveis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Áreas Comuns */}
          <Card>
            <CardHeader>
              <CardTitle>Áreas Comuns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commonAreas.map((area) => (
                  <div
                    key={area.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{area.name}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {area.quantity}x
                        </span>
                      </div>
                      {area.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {area.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {area.value > 0 && (
                          <span>
                            Valor: R$ {area.value.toLocaleString("pt-BR")}
                          </span>
                        )}
                        {area.fineValue > 0 && (
                          <span>
                            Multa: R$ {area.fineValue.toLocaleString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Condôminos (Colapsável) */}
          <Collapsible open={isResidentsOpen} onOpenChange={setIsResidentsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle>Lista de Condôminos</CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        isResidentsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Apartamento</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {residents.map((resident) => (
                          <TableRow key={resident.apartment}>
                            <TableCell className="font-medium">
                              {resident.apartment}
                            </TableCell>
                            <TableCell>{resident.name}</TableCell>
                            <TableCell>{resident.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Exibindo {residents.length} de{" "}
                    {condominiumData.totalResidents} condôminos cadastrados
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        {/* Aba de Cadastro */}
        <TabsContent value="register" className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure as informações gerais do condomínio
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="totalApartments">
                    Quantidade de Apartamentos
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totalApartments"
                      type="number"
                      min="1"
                      {...basicInfoForm.register("totalApartments", {
                        valueAsNumber: true,
                      })}
                      className="pl-9"
                    />
                  </div>
                  {basicInfoForm.formState.errors.totalApartments && (
                    <p className="text-sm text-destructive">
                      {basicInfoForm.formState.errors.totalApartments.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={basicInfoForm.formState.isSubmitting}
                  >
                    {basicInfoForm.formState.isSubmitting
                      ? "Salvando..."
                      : "Salvar Informações"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => basicInfoForm.reset()}
                    disabled={basicInfoForm.formState.isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Áreas Comuns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Áreas Comuns</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gerencie as áreas comuns do condomínio
                  </p>
                </div>
                <Dialog
                  open={isAreaDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) handleCloseAreaDialog();
                    else setIsAreaDialogOpen(true);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Área Comum
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAreaId ? "Editar" : "Cadastrar"} Área Comum
                      </DialogTitle>
                      <DialogDescription>
                        Preencha as informações da área comum do condomínio
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={areaForm.handleSubmit(onAreaSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome da Área</Label>
                          <Input
                            id="name"
                            placeholder="Ex: Piscina"
                            {...areaForm.register("name")}
                          />
                          {areaForm.formState.errors.name && (
                            <p className="text-sm text-destructive">
                              {areaForm.formState.errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantidade</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            {...areaForm.register("quantity", {
                              valueAsNumber: true,
                            })}
                          />
                          {areaForm.formState.errors.quantity && (
                            <p className="text-sm text-destructive">
                              {areaForm.formState.errors.quantity.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">
                          Descrição (Opcional)
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Descreva a área comum..."
                          rows={3}
                          {...areaForm.register("description")}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="value">Valor de Uso (R$)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="value"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...areaForm.register("value", {
                                valueAsNumber: true,
                              })}
                              className="pl-9"
                            />
                          </div>
                          {areaForm.formState.errors.value && (
                            <p className="text-sm text-destructive">
                              {areaForm.formState.errors.value.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fineValue">Valor da Multa (R$)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="fineValue"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...areaForm.register("fineValue", {
                                valueAsNumber: true,
                              })}
                              className="pl-9"
                            />
                          </div>
                          {areaForm.formState.errors.fineValue && (
                            <p className="text-sm text-destructive">
                              {areaForm.formState.errors.fineValue.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={areaForm.formState.isSubmitting}
                        >
                          {areaForm.formState.isSubmitting
                            ? "Salvando..."
                            : editingAreaId
                            ? "Atualizar"
                            : "Cadastrar"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCloseAreaDialog}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commonAreas.map((area) => (
                  <Card key={area.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            {area.name}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-muted-foreground">
                              Quantidade: {area.quantity}
                            </span>
                            {area.value > 0 && (
                              <span className="text-sm text-muted-foreground">
                                Valor: R$ {area.value.toLocaleString("pt-BR")}
                              </span>
                            )}
                            {area.fineValue > 0 && (
                              <span className="text-sm text-muted-foreground">
                                Multa: R${" "}
                                {area.fineValue.toLocaleString("pt-BR")}
                              </span>
                            )}
                          </div>
                          {area.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {area.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditArea(area)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteArea(area.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
