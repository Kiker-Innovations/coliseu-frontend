import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  DollarSign,
  FileText,
  Upload,
  X,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  contestFineSchema,
  type ContestFineSchema,
} from "@/schemas/resident/fines.schema";
import FinesSkeleton from "@/skeleton/resident/FinesSkeleton";

export default function Fines() {
  const [isLoading, setIsLoading] = useState(true);
  const [isContestDialogOpen, setIsContestDialogOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const form = useForm<ContestFineSchema>({
    resolver: zodResolver(contestFineSchema),
    defaultValues: {
      description: "",
    },
  });

  // Mock data - multas do apartamento do usuário
  const fines = [
    {
      id: 1,
      title: "Barulho excessivo após 22h",
      description:
        "Constatado barulho excessivo proveniente do apartamento após o horário de silêncio estabelecido pelo condomínio.",
      value: 200,
      issueDate: "2025-10-10T14:00:00",
      dueDate: "2025-10-25",
      status: "pending",
      relatedArea: "Regulamento Interno",
      canContest: true,
    },
    {
      id: 2,
      title: "Uso irregular da piscina",
      description:
        "Utilização da piscina fora do horário permitido, conforme regras do condomínio.",
      value: 150,
      issueDate: "2025-10-12T10:30:00",
      dueDate: "2025-10-27",
      status: "contested",
      relatedArea: "Piscina",
      canContest: false,
      contestedAt: "2025-10-15T14:30:00",
    },
    {
      id: 3,
      title: "Pet sem guia na área comum",
      description:
        "Animal de estimação circulando sem guia nas áreas comuns do condomínio.",
      value: 100,
      issueDate: "2025-09-28T16:00:00",
      dueDate: "2025-10-13",
      status: "paid",
      relatedArea: "Áreas Comuns",
      canContest: false,
      paidAt: "2025-10-10T09:15:00",
    },
    {
      id: 4,
      title: "Estacionamento irregular",
      description: "Veículo estacionado em vaga destinada a visitantes.",
      value: 250,
      issueDate: "2025-10-18T08:00:00",
      dueDate: "2025-11-02",
      status: "pending",
      relatedArea: "Estacionamento",
      canContest: true,
    },
  ];

  const pendingFines = fines.filter((f) => f.status === "pending");
  const totalPending = pendingFines.reduce((sum, f) => sum + f.value, 0);
  const contestedFines = fines.filter((f) => f.status === "contested").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case "contested":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Em Análise
          </Badge>
        );
      case "paid":
        return (
          <Badge className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Paga
          </Badge>
        );
      default:
        return null;
    }
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

  const handleOpenContestDialog = (fine: any) => {
    setSelectedFine(fine);
    setIsContestDialogOpen(true);
  };

  const handleCloseContestDialog = () => {
    setIsContestDialogOpen(false);
    setSelectedFine(null);
    setSelectedFile(null);
    form.reset();
  };

  const handlePayFine = async (fineId: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Pagamento processado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao processar pagamento");
    }
  };

  const onSubmitContest = async (data: ContestFineSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(
        "Contestação enviada com sucesso! Aguarde a análise da administração."
      );
      handleCloseContestDialog();
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar contestação");
    }
  };

  if (isLoading) {
    return <FinesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Multas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as multas do seu apartamento
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Multas Pendentes
              </p>
              <p className="text-4xl font-bold text-destructive">
                {pendingFines.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor Total</p>
              <p className="text-4xl font-bold text-destructive">
                R$ {totalPending.toLocaleString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Em Análise</p>
              <p className="text-4xl font-bold text-amber-600">
                {contestedFines}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fines List */}
      <div className="space-y-4">
        {fines.map((fine) => (
          <Card key={fine.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <CardTitle>{fine.title}</CardTitle>
                    {getStatusBadge(fine.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fine.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      Emitida em:{" "}
                      {new Date(fine.issueDate).toLocaleDateString("pt-BR")}
                    </span>
                    <span>
                      Vencimento:{" "}
                      {new Date(fine.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                    <span>Área: {fine.relatedArea}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">
                    R$ {fine.value.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {fine.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handlePayFine(fine.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pagar Multa
                    </Button>
                    {fine.canContest && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenContestDialog(fine)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Contestar
                      </Button>
                    )}
                  </>
                )}
                {fine.status === "contested" && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Clock className="w-4 h-4" />
                    Contestação enviada em{" "}
                    {fine.contestedAt &&
                      new Date(fine.contestedAt).toLocaleDateString("pt-BR")}
                    . Aguardando análise.
                  </div>
                )}
                {fine.status === "paid" && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Paga em{" "}
                    {fine.paidAt &&
                      new Date(fine.paidAt).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contest Dialog */}
      <Dialog
        open={isContestDialogOpen}
        onOpenChange={handleCloseContestDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <FileText className="w-5 h-5" />
              Contestar Multa
            </DialogTitle>
            <DialogDescription>
              Descreva os motivos da sua contestação. A administração analisará
              seu pedido.
            </DialogDescription>
          </DialogHeader>

          {selectedFine && (
            <div className="space-y-4">
              {/* Fine Info */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h3 className="font-semibold text-sm text-destructive mb-1">
                  Multa a ser contestada
                </h3>
                <p className="font-medium">{selectedFine.title}</p>
                <p className="text-2xl font-bold text-destructive mt-2">
                  R$ {selectedFine.value.toLocaleString("pt-BR")}
                </p>
              </div>

              <form
                onSubmit={form.handleSubmit(onSubmitContest)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descrição da Contestação *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Explique detalhadamente por que você está contestando esta multa..."
                    rows={6}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Anexos (Opcional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Adicione fotos, documentos ou outros comprovantes que apoiem
                    sua contestação
                  </p>
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
                      onClick={() =>
                        document.getElementById("attachment")?.click()
                      }
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

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Enviando..."
                      : "Enviar Contestação"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseContestDialog}
                    disabled={form.formState.isSubmitting}
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
