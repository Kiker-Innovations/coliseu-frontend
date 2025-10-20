import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Clock,
  Calendar,
  Users,
  Plus,
  X,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { pollSchema, type PollSchema } from "@/schemas/admin/polls.schema";
import PollsSkeleton from "@/skeleton/admin/PollsSkeleton";

export default function Polls() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const form = useForm<PollSchema>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      question: "",
      options: ["", ""],
      startDate: "",
      startTime: "",
      durationHours: 24,
    },
  });

  // Mock data - enquetes ativas
  const activePolls = [
    {
      id: 1,
      question: "Qual horário preferem para manutenção da piscina?",
      options: [
        { text: "Manhã (8h-12h)", votes: 23, percentage: 51 },
        { text: "Tarde (14h-18h)", votes: 15, percentage: 33 },
        { text: "Fins de semana", votes: 7, percentage: 16 },
      ],
      totalVotes: 45,
      totalResidents: 80,
      startDate: "2025-10-18T00:00:00",
      endDate: "2025-10-22T23:59:59",
      isActive: true,
    },
    {
      id: 2,
      question: "Devemos permitir pets na área comum?",
      options: [
        { text: "Sim, sem restrições", votes: 18, percentage: 35 },
        {
          text: "Sim, apenas em horários específicos",
          votes: 28,
          percentage: 54,
        },
        { text: "Não", votes: 6, percentage: 11 },
      ],
      totalVotes: 52,
      totalResidents: 80,
      startDate: "2025-10-19T00:00:00",
      endDate: "2025-10-23T23:59:59",
      isActive: true,
    },
  ];

  // Mock data - enquetes encerradas
  const closedPolls = [
    {
      id: 3,
      question: "Aprovam a troca da empresa de segurança?",
      options: [
        { text: "Sim", votes: 54, percentage: 81 },
        { text: "Não", votes: 13, percentage: 19 },
      ],
      totalVotes: 67,
      totalResidents: 80,
      startDate: "2025-09-15T00:00:00",
      endDate: "2025-09-18T23:59:59",
      isActive: false,
      result: "Aprovado",
    },
    {
      id: 4,
      question: "Horário de silêncio deve começar às:",
      options: [
        { text: "21h", votes: 12, percentage: 17 },
        { text: "22h", votes: 48, percentage: 68 },
        { text: "23h", votes: 11, percentage: 15 },
      ],
      totalVotes: 71,
      totalResidents: 80,
      startDate: "2025-09-10T00:00:00",
      endDate: "2025-09-14T23:59:59",
      isActive: false,
      result: "22h",
    },
  ];

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
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

  const onSubmit = async (data: PollSchema) => {
    try {
      const validOptions = pollOptions.filter((opt) => opt.trim() !== "");

      if (validOptions.length < 2) {
        toast.error("A enquete deve ter no mínimo 2 opções!");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Enquete agendada com sucesso!");
      form.reset();
      setPollOptions(["", ""]);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao agendar enquete");
    }
  };

  if (isLoading) {
    return <PollsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enquetes</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe as enquetes do condomínio
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Enquetes Ativas</TabsTrigger>
          <TabsTrigger value="closed">Histórico</TabsTrigger>
          <TabsTrigger value="create">Criar Nova Enquete</TabsTrigger>
        </TabsList>

        {/* Aba de Enquetes Ativas */}
        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Enquetes Ativas
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {activePolls.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total de Votos
                  </p>
                  <p className="text-4xl font-bold text-accent">
                    {activePolls.reduce(
                      (sum, poll) => sum + poll.totalVotes,
                      0
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Participação Média
                  </p>
                  <p className="text-4xl font-bold text-muted-foreground">
                    {Math.round(
                      activePolls.reduce(
                        (sum, poll) =>
                          sum + (poll.totalVotes / poll.totalResidents) * 100,
                        0
                      ) / activePolls.length || 0
                    )}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {activePolls.map((poll) => (
              <Card
                key={poll.id}
                className="border-2 border-primary/50 bg-primary/5"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {poll.question}
                      </CardTitle>
                    </div>
                    <Badge className="bg-green-500">Ativa</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(poll.startDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{calculateTimeRemaining(poll.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {poll.totalVotes} votos ({poll.totalResidents}{" "}
                        condôminos)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-muted-foreground">
                            {option.votes} votos ({option.percentage}%)
                          </span>
                        </div>
                        <Progress value={option.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba de Histórico */}
        <TabsContent value="closed" className="space-y-4">
          {closedPolls.map((poll) => (
            <Card key={poll.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      {poll.question}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(poll.startDate).toLocaleDateString("pt-BR")} até{" "}
                      {new Date(poll.endDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Encerrada
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {poll.options.map((option, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{option.text}</span>
                        <span className="text-muted-foreground">
                          {option.votes} votos ({option.percentage}%)
                        </span>
                      </div>
                      <Progress value={option.percentage} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Participação: {poll.totalVotes} de {poll.totalResidents}{" "}
                    moradores (
                    {Math.round((poll.totalVotes / poll.totalResidents) * 100)}
                    %)
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Aba de Criação */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Enquete</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure uma nova enquete para votação dos condôminos
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="question">Pergunta da Enquete</Label>
                  <Input
                    id="question"
                    placeholder="Ex: Qual horário preferem para manutenção?"
                    {...form.register("question")}
                  />
                  {form.formState.errors.question && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.question.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Opções de Resposta</Label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Opção ${index + 1}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...form.register("startDate")}
                    />
                    {form.formState.errors.startDate && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...form.register("startTime")}
                    />
                    {form.formState.errors.startTime && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.startTime.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duração (horas)</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    min="12"
                    step="1"
                    {...form.register("durationHours", {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.durationHours && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.durationHours.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={form.formState.isSubmitting}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {form.formState.isSubmitting
                      ? "Agendando..."
                      : "Agendar Enquete"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setPollOptions(["", ""]);
                    }}
                    disabled={form.formState.isSubmitting}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
