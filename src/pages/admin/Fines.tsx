import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  AlertTriangle,
  Bell,
  DollarSign,
  Upload,
  X,
  Search,
  Eye,
  Check,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fineNotificationSchema,
  type FineNotificationSchema,
} from "@/schemas/admin/fines.schema";
import FinesSkeleton from "@/skeleton/admin/FinesSkeleton";

export default function Fines() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContestationDialogOpen, setIsContestationDialogOpen] =
    useState(false);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const [selectedContestation, setSelectedContestation] = useState<any>(null);
  const [actionType, setActionType] = useState<"fine" | "notification">("fine");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const form = useForm<FineNotificationSchema>({
    resolver: zodResolver(fineNotificationSchema),
    defaultValues: {
      type: "fine",
      title: "",
      description: "",
      relatedToCommonArea: false,
      commonAreaId: null,
      useDefaultFineValue: true,
      customFineValue: null,
    },
  });

  const relatedToCommonArea = form.watch("relatedToCommonArea");
  const useDefaultFineValue = form.watch("useDefaultFineValue");
  const selectedCommonAreaId = form.watch("commonAreaId");

  // Mock data - apartamentos com moradores
  const apartments = [
    {
      id: 1,
      number: "101",
      residents: [
        { name: "João Silva Santos", email: "joao.silva@email.com" },
        { name: "Maria Silva Santos", email: "maria.silva@email.com" },
      ],
      contestations: 0,
    },
    {
      id: 2,
      number: "102",
      residents: [
        { name: "Maria Oliveira Costa", email: "maria.oliveira@email.com" },
      ],
      contestations: 1,
    },
    {
      id: 3,
      number: "103",
      residents: [
        { name: "Pedro Henrique Souza", email: "pedro.souza@email.com" },
      ],
      contestations: 0,
    },
    {
      id: 4,
      number: "201",
      residents: [
        { name: "Ana Paula Ferreira", email: "ana.ferreira@email.com" },
        { name: "Carlos Ferreira", email: "carlos.f@email.com" },
      ],
      contestations: 0,
    },
    {
      id: 5,
      number: "202",
      residents: [
        { name: "Carlos Eduardo Lima", email: "carlos.lima@email.com" },
      ],
      contestations: 2,
    },
    {
      id: 6,
      number: "203",
      residents: [
        { name: "Juliana Martins Rocha", email: "juliana.rocha@email.com" },
      ],
      contestations: 0,
    },
    {
      id: 7,
      number: "301",
      residents: [
        { name: "Roberto Carlos Alves", email: "roberto.alves@email.com" },
      ],
      contestations: 0,
    },
    {
      id: 8,
      number: "302",
      residents: [
        { name: "Fernanda Costa Dias", email: "fernanda.dias@email.com" },
      ],
      contestations: 0,
    },
    {
      id: 9,
      number: "303",
      residents: [
        { name: "Ricardo Pereira Gomes", email: "ricardo.gomes@email.com" },
      ],
      contestations: 1,
    },
    {
      id: 10,
      number: "401",
      residents: [
        { name: "Patrícia Santos Lima", email: "patricia.lima@email.com" },
      ],
      contestations: 0,
    },
  ];

  // Mock data - áreas comuns
  const commonAreas = [
    { id: 1, name: "Piscina", fineValue: 150 },
    { id: 2, name: "Salão de Festas", fineValue: 1000 },
    { id: 3, name: "Academia", fineValue: 200 },
    { id: 4, name: "Quadra Poliesportiva", fineValue: 300 },
    { id: 5, name: "Churrasqueira", fineValue: 250 },
  ];

  const selectedCommonArea = commonAreas.find(
    (area) => area.id === selectedCommonAreaId
  );

  // Mock data - contestações
  const contestations = [
    {
      id: 1,
      apartmentNumber: "102",
      fineTitle: "Barulho excessivo após 22h",
      fineValue: 200,
      contestationDate: "2025-10-15T14:30:00",
      description:
        "Não houve barulho excessivo. Estávamos assistindo TV em volume normal.",
      attachments: ["foto-decibelimetro.jpg"],
      status: "pending",
    },
    {
      id: 2,
      apartmentNumber: "202",
      fineTitle: "Uso irregular da piscina",
      fineValue: 150,
      contestationDate: "2025-10-16T10:00:00",
      description:
        "A piscina estava dentro do horário permitido. Anexo comprovante de reserva.",
      attachments: ["comprovante-reserva.pdf"],
      status: "pending",
    },
    {
      id: 3,
      apartmentNumber: "202",
      fineTitle: "Pet sem guia na área comum",
      fineValue: 100,
      contestationDate: "2025-10-17T16:20:00",
      description: "O pet estava com guia. Anexo foto como prova.",
      attachments: ["foto-pet.jpg"],
      status: "pending",
    },
    {
      id: 4,
      apartmentNumber: "303",
      fineTitle: "Estacionamento irregular",
      fineValue: 250,
      contestationDate: "2025-10-18T09:15:00",
      description:
        "O carro estava na vaga correta, conforme placa registrada no condomínio.",
      attachments: [],
      status: "pending",
    },
  ];

  const filteredApartments = apartments.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesApartment = apt.number.toLowerCase().includes(searchLower);
    const matchesResident = apt.residents.some(
      (res) =>
        res.name.toLowerCase().includes(searchLower) ||
        res.email.toLowerCase().includes(searchLower)
    );
    return matchesApartment || matchesResident;
  });

  const handleOpenDialog = (apartment: any, type: "fine" | "notification") => {
    setSelectedApartment(apartment);
    setActionType(type);
    form.setValue("type", type);
    setIsDialogOpen(true);
  };

  const handleViewContestations = (apartment: any) => {
    const aptContestations = contestations.filter(
      (c) => c.apartmentNumber === apartment.number && c.status === "pending"
    );
    if (aptContestations.length > 0) {
      setSelectedContestation(aptContestations[0]);
      setIsContestationDialogOpen(true);
    }
  };

  const handleContestationDecision = async (
    contestationId: number,
    approved: boolean
  ) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(
        approved
          ? "Contestação aprovada! A multa foi cancelada."
          : "Contestação reprovada! A multa permanece."
      );
      setIsContestationDialogOpen(false);
      setSelectedContestation(null);
    } catch (error: any) {
      toast.error("Erro ao processar decisão");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedApartment(null);
    setSelectedFile(null);
    form.reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    form.setValue("attachmentFile", undefined);
  };

  const onSubmit = async (data: FineNotificationSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (data.type === "fine") {
        toast.success(
          `Multa aplicada com sucesso para o apartamento ${selectedApartment?.number}!`
        );
      } else {
        toast.success(
          `Notificação enviada com sucesso para o apartamento ${selectedApartment?.number}!`
        );
      }

      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar ação");
    }
  };

  if (isLoading) {
    return <FinesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Multas e Notificações</h1>
        <p className="text-muted-foreground">
          Gerencie multas e notificações dos condôminos
        </p>
      </div>

      {/* Tabela de Apartamentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Apartamentos</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por apartamento, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apartamento</TableHead>
                  <TableHead>Moradores</TableHead>
                  <TableHead>Contestações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApartments.map((apartment) => (
                  <TableRow key={apartment.id}>
                    <TableCell className="font-medium">
                      {apartment.number}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {apartment.residents.map((resident, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium">{resident.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {resident.email}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {apartment.contestations > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600"
                          onClick={() => handleViewContestations(apartment)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {apartment.contestations} pendente(s)
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Nenhuma
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDialog(apartment, "fine")}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Multar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleOpenDialog(apartment, "notification")
                          }
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Notificar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Multa/Notificação */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === "fine" ? (
                <span className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Aplicar Multa
                </span>
              ) : (
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
                  <Bell className="w-5 h-5" />
                  Enviar Notificação
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "fine"
                ? `Aplicar multa para o apartamento ${selectedApartment?.number}`
                : `Enviar notificação para o apartamento ${selectedApartment?.number}`}
              <div className="mt-2 p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">
                  Moradores que receberão a{" "}
                  {actionType === "fine" ? "multa" : "notificação"}:
                </p>
                {selectedApartment?.residents.map(
                  (resident: any, idx: number) => (
                    <div key={idx} className="text-xs mb-1">
                      <p className="font-medium">{resident.name}</p>
                      <p className="text-muted-foreground">{resident.email}</p>
                    </div>
                  )
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Barulho excessivo após 22h"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o ocorrido..."
                rows={4}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Anexo */}
            <div className="space-y-2">
              <Label htmlFor="attachment">Anexo (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("attachment")?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Selecionar arquivo"}
                </Button>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Relacionar à Área Comum */}
            {actionType === "fine" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="relatedToCommonArea"
                      checked={relatedToCommonArea}
                      onCheckedChange={(checked) =>
                        form.setValue("relatedToCommonArea", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="relatedToCommonArea"
                      className="cursor-pointer"
                    >
                      Relacionar a uma área comum do condomínio
                    </Label>
                  </div>
                </div>

                {relatedToCommonArea && (
                  <>
                    {/* Selecionar Área Comum */}
                    <div className="space-y-2">
                      <Label htmlFor="commonAreaId">Área Comum</Label>
                      <Select
                        value={selectedCommonAreaId?.toString() || ""}
                        onValueChange={(value) =>
                          form.setValue("commonAreaId", Number.parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a área comum" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonAreas.map((area) => (
                            <SelectItem
                              key={area.id}
                              value={area.id.toString()}
                            >
                              {area.name} - R${" "}
                              {area.fineValue.toLocaleString("pt-BR")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.commonAreaId && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.commonAreaId.message}
                        </p>
                      )}
                    </div>

                    {/* Valor da Multa */}
                    {selectedCommonAreaId && (
                      <div className="space-y-3">
                        <Label>Valor da Multa</Label>
                        <RadioGroup
                          value={useDefaultFineValue ? "default" : "custom"}
                          onValueChange={(value) =>
                            form.setValue(
                              "useDefaultFineValue",
                              value === "default"
                            )
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="default" id="default" />
                            <Label htmlFor="default" className="cursor-pointer">
                              Usar valor padrão (R${" "}
                              {selectedCommonArea?.fineValue.toLocaleString(
                                "pt-BR"
                              )}
                              )
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <Label htmlFor="custom" className="cursor-pointer">
                              Informar valor customizado
                            </Label>
                          </div>
                        </RadioGroup>

                        {!useDefaultFineValue && (
                          <div className="space-y-2">
                            <Label htmlFor="customFineValue">
                              Valor Customizado (R$)
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="customFineValue"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...form.register("customFineValue", {
                                  valueAsNumber: true,
                                })}
                                className="pl-9"
                              />
                            </div>
                            {form.formState.errors.customFineValue && (
                              <p className="text-sm text-destructive">
                                {form.formState.errors.customFineValue.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Valor da Multa sem Área Comum */}
                {!relatedToCommonArea && (
                  <div className="space-y-2">
                    <Label htmlFor="customFineValue">Valor da Multa (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customFineValue"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...form.register("customFineValue", {
                          valueAsNumber: true,
                        })}
                        className="pl-9"
                      />
                    </div>
                    {form.formState.errors.customFineValue && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.customFineValue.message}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
                variant={actionType === "fine" ? "destructive" : "default"}
              >
                {form.formState.isSubmitting
                  ? "Enviando..."
                  : actionType === "fine"
                  ? "Aplicar Multa"
                  : "Enviar Notificação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Contestações */}
      <Dialog
        open={isContestationDialogOpen}
        onOpenChange={setIsContestationDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-600" />
              Análise de Contestação
            </DialogTitle>
            <DialogDescription>
              Apartamento {selectedContestation?.apartmentNumber} - Analisando
              contestação de multa
            </DialogDescription>
          </DialogHeader>

          {selectedContestation && (
            <div className="space-y-4">
              {/* Informações da Multa */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h3 className="font-semibold text-sm text-destructive mb-2">
                  Multa Original
                </h3>
                <p className="font-medium">{selectedContestation.fineTitle}</p>
                <p className="text-2xl font-bold text-destructive mt-2">
                  R$ {selectedContestation.fineValue.toLocaleString("pt-BR")}
                </p>
              </div>

              {/* Contestação */}
              <div className="space-y-2">
                <Label>Descrição da Contestação</Label>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm">{selectedContestation.description}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviada em{" "}
                  {new Date(
                    selectedContestation.contestationDate
                  ).toLocaleString("pt-BR")}
                </p>
              </div>

              {/* Anexos */}
              {selectedContestation.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Anexos</Label>
                  <div className="space-y-2">
                    {selectedContestation.attachments.map(
                      (file: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border"
                        >
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{file}</span>
                          <Button size="sm" variant="ghost">
                            Visualizar
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    handleContestationDecision(selectedContestation.id, true)
                  }
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Contestação
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() =>
                    handleContestationDecision(selectedContestation.id, false)
                  }
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reprovar Contestação
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
