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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Vote,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  votingScheduleSchema,
  type VotingScheduleSchema,
  votingTopicSchema,
  type VotingTopicSchema,
} from "@/schemas/admin/voting.schema";
import VotingSkeleton from "@/skeleton/admin/VotingSkeleton";

export default function Voting() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2025-10");
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const scheduleForm = useForm<VotingScheduleSchema>({
    resolver: zodResolver(votingScheduleSchema),
    defaultValues: {
      topicId: 0,
      startDate: "",
      startTime: "",
      durationHours: 12,
    },
  });

  const topicForm = useForm<VotingTopicSchema>({
    resolver: zodResolver(votingTopicSchema),
    defaultValues: {
      title: "",
      description: "",
      options: ["Sim", "Não"],
    },
  });

  // Mock data
  const activeVotings = [
    {
      id: 1,
      title: "Reforma da Piscina - Fase 2",
      description: "Aprovar orçamento de R$ 25.000 para segunda fase",
      startDate: "2025-10-18T08:00:00",
      endDate: "2025-10-20T20:00:00",
      totalVotes: 45,
      totalResidents: 80,
      options: [
        { label: "Sim", votes: 32, percentage: 71 },
        { label: "Não", votes: 13, percentage: 29 },
      ],
      status: "active",
    },
    {
      id: 2,
      title: "Horário de Funcionamento da Academia",
      description: "Estender horário até 23h",
      startDate: "2025-10-19T00:00:00",
      endDate: "2025-10-21T12:00:00",
      totalVotes: 28,
      totalResidents: 80,
      options: [
        { label: "Sim", votes: 18, percentage: 64 },
        { label: "Não", votes: 10, percentage: 36 },
      ],
      status: "active",
    },
  ];

  const pastVotings = [
    {
      id: 3,
      title: "Instalação de Câmeras de Segurança",
      startDate: "2025-10-01T00:00:00",
      endDate: "2025-10-05T23:59:59",
      totalVotes: 68,
      totalResidents: 80,
      result: "Aprovado",
      options: [
        { label: "Sim", votes: 55, percentage: 81 },
        { label: "Não", votes: 13, percentage: 19 },
      ],
      status: "completed",
    },
    {
      id: 4,
      title: "Troca de Elevadores",
      startDate: "2025-09-15T00:00:00",
      endDate: "2025-09-17T23:59:59",
      totalVotes: 72,
      totalResidents: 80,
      result: "Aprovado",
      options: [
        { label: "Sim", votes: 58, percentage: 81 },
        { label: "Não", votes: 14, percentage: 19 },
      ],
      status: "completed",
    },
    {
      id: 5,
      title: "Pintura da Fachada",
      startDate: "2025-09-01T00:00:00",
      endDate: "2025-09-03T23:59:59",
      totalVotes: 65,
      totalResidents: 80,
      result: "Aprovado",
      options: [
        { label: "Sim", votes: 52, percentage: 80 },
        { label: "Não", votes: 13, percentage: 20 },
      ],
      status: "completed",
    },
  ];

  const availableTopics = [
    {
      id: 1,
      title: "Instalação de Câmeras no Estacionamento",
      description: "Instalar 8 câmeras de segurança no estacionamento",
      createdAt: "2025-10-10",
    },
    {
      id: 2,
      title: "Contratação de Segurança 24h",
      description: "Contratar empresa de segurança para vigilância contínua",
      createdAt: "2025-10-12",
    },
    {
      id: 3,
      title: "Reforma do Playground",
      description: "Renovar equipamentos e piso do playground infantil",
      createdAt: "2025-10-14",
    },
  ];

  const onScheduleSubmit = async (data: VotingScheduleSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Votação agendada com sucesso!");
      scheduleForm.reset();
      setIsScheduleDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao agendar votação");
    }
  };

  const onTopicSubmit = async (data: VotingTopicSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Tópico criado com sucesso!");
      topicForm.reset();
      setIsTopicDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar tópico");
    }
  };

  const handleScheduleTopic = (topicId: number) => {
    setSelectedTopicId(topicId);
    scheduleForm.setValue("topicId", topicId);
    setIsScheduleDialogOpen(true);
  };

  const calculateTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Encerrada";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} dia${days > 1 ? "s" : ""} restante${days > 1 ? "s" : ""}`;
    }

    return `${hours}h ${minutes}m restantes`;
  };

  if (isLoading) {
    return <VotingSkeleton />;
  }

  const availableMonths = [
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-07", label: "Julho 2025" },
  ];

  // Filtrar votações por mês
  const filteredActiveVotings = activeVotings.filter((voting) =>
    voting.startDate.startsWith(selectedMonth)
  );

  const filteredPastVotings = pastVotings.filter((voting) =>
    voting.startDate.startsWith(selectedMonth)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Votações</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe as votações do condomínio
          </p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Visualizar</TabsTrigger>
          <TabsTrigger value="manage">Gerenciar</TabsTrigger>
        </TabsList>

        {/* Aba de Visualização */}
        <TabsContent value="view" className="space-y-6">
          {/* Votações Ativas */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Votações em Andamento</h2>
            {filteredActiveVotings.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    Nenhuma votação ativa no momento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredActiveVotings.map((voting) => (
                  <Card
                    key={voting.id}
                    className="border-2 border-primary/50 bg-primary/5"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Vote className="w-5 h-5" />
                            {voting.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {voting.description}
                          </p>
                        </div>
                        <Badge className="bg-green-500">Ativa</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(voting.startDate).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{calculateTimeRemaining(voting.endDate)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {voting.options.map((option, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {option.label}
                              </span>
                              <span className="text-muted-foreground">
                                {option.votes} votos ({option.percentage}%)
                              </span>
                            </div>
                            <Progress
                              value={option.percentage}
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Participação: {voting.totalVotes} de{" "}
                          {voting.totalResidents} moradores (
                          {Math.round(
                            (voting.totalVotes / voting.totalResidents) * 100
                          )}
                          %)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Votações Passadas */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Histórico de Votações</h2>

            <div className="grid grid-cols-1 gap-4">
              {filteredPastVotings.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">
                      Nenhuma votação encerrada neste mês
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPastVotings.map((voting) => (
                  <Card key={voting.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {voting.result === "Aprovado" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            {voting.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {new Date(voting.startDate).toLocaleDateString(
                              "pt-BR"
                            )}{" "}
                            até{" "}
                            {new Date(voting.endDate).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                        <Badge
                          variant={
                            voting.result === "Aprovado"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            voting.result === "Aprovado"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {voting.result}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {voting.options.map((option, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {option.label}
                              </span>
                              <span className="text-muted-foreground">
                                {option.votes} votos ({option.percentage}%)
                              </span>
                            </div>
                            <Progress
                              value={option.percentage}
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Participação: {voting.totalVotes} de{" "}
                          {voting.totalResidents} moradores (
                          {Math.round(
                            (voting.totalVotes / voting.totalResidents) * 100
                          )}
                          %)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Aba de Gerenciamento */}
        <TabsContent value="manage" className="space-y-6">
          <div className="flex justify-end">
            <Dialog
              open={isTopicDialogOpen}
              onOpenChange={setIsTopicDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tópico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Tópico de Votação</DialogTitle>
                  <DialogDescription>
                    Defina um novo tópico que poderá ser agendado para votação
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={topicForm.handleSubmit(onTopicSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Reforma da Piscina"
                      {...topicForm.register("title")}
                    />
                    {topicForm.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {topicForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva os detalhes da votação..."
                      rows={4}
                      {...topicForm.register("description")}
                    />
                    {topicForm.formState.errors.description && (
                      <p className="text-sm text-destructive">
                        {topicForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={topicForm.formState.isSubmitting}
                    >
                      {topicForm.formState.isSubmitting
                        ? "Criando..."
                        : "Criar Tópico"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTopicDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {availableTopics.map((topic) => (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{topic.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        {topic.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Criado em:{" "}
                        {new Date(topic.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          /* Implementar edição */
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          /* Implementar exclusão */
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleScheduleTopic(topic.id)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Votação
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dialog de Reserva */}
          <Dialog
            open={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Votação</DialogTitle>
                <DialogDescription>
                  Configure a data e horário da votação (mínimo 12 horas)
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...scheduleForm.register("startDate")}
                  />
                  {scheduleForm.formState.errors.startDate && (
                    <p className="text-sm text-destructive">
                      {scheduleForm.formState.errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...scheduleForm.register("startTime")}
                  />
                  {scheduleForm.formState.errors.startTime && (
                    <p className="text-sm text-destructive">
                      {scheduleForm.formState.errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duração (horas)</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    min="12"
                    step="1"
                    {...scheduleForm.register("durationHours", {
                      valueAsNumber: true,
                    })}
                  />
                  {scheduleForm.formState.errors.durationHours && (
                    <p className="text-sm text-destructive">
                      {scheduleForm.formState.errors.durationHours.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={scheduleForm.formState.isSubmitting}
                  >
                    {scheduleForm.formState.isSubmitting
                      ? "Agendando..."
                      : "Agendar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsScheduleDialogOpen(false);
                      scheduleForm.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
