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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { pollSchema, type PollSchema, type PollOptionSchema } from "@/schemas/admin/polls.schema";
import PollsSkeleton from "@/skeleton/admin/PollsSkeleton";
import { pollsService, adminService, type ActivePoll, type FinishedCancelledPoll } from "@/services/api";

const defaultOption: PollOptionSchema = {
  optionDescription: "",
  optionVotes: 0,
  optionPercente: 0,
};

export default function Polls() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState<PollOptionSchema[]>([{ ...defaultOption }, { ...defaultOption }]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [buildingId, setBuildingId] = useState<string>("");
  const [activePolls, setActivePolls] = useState<ActivePoll[]>([]);
  const [closedPolls, setClosedPolls] = useState<FinishedCancelledPoll[]>([]);

  // Load buildingId on mount
  useEffect(() => {
    const loadBuildingId = async () => {
      try {
        const token = localStorage.getItem("coliseu_access_token") || sessionStorage.getItem("coliseu_access_token");
        
        if (!token) {
          toast.error("Token não encontrado. Faça login novamente.");
          return;
        }

        try {
          const adminResponse = await adminService.getCurrentAdmin();
          if (adminResponse.success && adminResponse.data?.buildingId) {
            setBuildingId(adminResponse.data.buildingId);
          }
        } catch (error: any) {
          console.warn("Não foi possível buscar o perfil do admin:", error);
          // Tentar decodificar o token JWT como fallback
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              if (payload.buildingId) {
                setBuildingId(payload.buildingId);
              }
            }
          } catch (decodeError) {
            console.warn("Não foi possível decodificar o token:", decodeError);
          }
        }
      } catch (error: any) {
        console.error("Erro ao carregar buildingId:", error);
      }
    };
    loadBuildingId();
  }, []);

  // Load polls data
  useEffect(() => {
    const loadData = async () => {
      if (!buildingId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [month, year] = selectedMonth.split("-").map(Number);
        
        // Load active polls
        const activeResponse = await pollsService.getActivePolls({
          buildingId,
          month,
          year,
        });
        if (activeResponse.success && activeResponse.data) {
          setActivePolls(activeResponse.data);
        }

        // Load finished/cancelled polls
        const finishedResponse = await pollsService.getFinishedCancelledPolls({
          buildingId,
          month,
          year,
        });
        if (finishedResponse.success && finishedResponse.data) {
          setClosedPolls(finishedResponse.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar enquetes");
        console.error("Erro ao carregar enquetes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [buildingId, selectedMonth]);

  const form = useForm<PollSchema>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      question: "",
      options: [{ ...defaultOption }, { ...defaultOption }],
      startDate: "",
      endDate: "",
      status: "ATIVO",
    },
  });


  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, { ...defaultOption }]);
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
    newOptions[index] = {
      ...newOptions[index],
      optionDescription: value,
      optionVotes: 0,
      optionPercente: 0,
    };
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
      if (!buildingId) {
        toast.error("BuildingId não encontrado. Faça login novamente.");
        return;
      }

      const validOptions = pollOptions.filter((opt) => opt.optionDescription.trim() !== "");

      if (validOptions.length < 2) {
        toast.error("A enquete deve ter no mínimo 2 opções!");
        return;
      }

      // Convert datetime-local to ISO string format (YYYY-MM-DDTHH:mm:ssZ)
      // datetime-local returns format: YYYY-MM-DDTHH:mm (local time)
      // We need to convert to UTC and format as: YYYY-MM-DDTHH:mm:ssZ
      const formatDateTimeToISO = (datetimeLocal: string): string => {
        // Parse the datetime-local value (it's in local timezone)
        // Create a Date object which will interpret it as local time
        const localDate = new Date(datetimeLocal);
        
        // Convert to ISO string (which includes UTC conversion)
        // Format: "2025-01-15T10:00:00.000Z"
        // We need: "2025-01-15T10:00:00Z"
        const isoString = localDate.toISOString();
        
        // Remove milliseconds and keep the Z
        return isoString.replace(/\.\d{3}Z$/, 'Z');
      };

      const startDateISO = formatDateTimeToISO(data.startDate);
      const endDateISO = formatDateTimeToISO(data.endDate);

      // Prepare options array (just strings for the API)
      const optionsArray = validOptions.map((opt) => opt.optionDescription);

      // Create poll request
      const pollRequest = {
        buildingId,
        description: data.question,
        options: optionsArray,
        startDate: startDateISO,
        endDate: endDateISO,
      };

      const response = await pollsService.createPoll(pollRequest);

      if (response.success) {
        toast.success("Enquete agendada com sucesso!");
        form.reset({
          question: "",
          options: [{ ...defaultOption }, { ...defaultOption }],
          startDate: "",
          endDate: "",
          status: "ATIVO",
        });
        setPollOptions([{ ...defaultOption }, { ...defaultOption }]);
        setIsDialogOpen(false);
        
        // Reload polls data
        const [month, year] = selectedMonth.split("-").map(Number);
        const activeResponse = await pollsService.getActivePolls({
          buildingId,
          month,
          year,
        });
        if (activeResponse.success && activeResponse.data) {
          setActivePolls(activeResponse.data);
        }
      } else {
        toast.error(response.message || "Erro ao agendar enquete");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao agendar enquete");
      console.error("Erro ao criar enquete:", error);
    }
  };

  // Generate available months (current month and previous 5 months)
  const availableMonths = (() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return months;
  })();

  // Filter polls by month (already filtered by API, but keep for consistency)
  const filteredActivePolls = activePolls;
  const filteredClosedPolls = closedPolls;

  if (isLoading) {
    return <PollsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enquetes</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe as enquetes do condomínio
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
                    {filteredActivePolls.length}
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
                    {filteredActivePolls.reduce(
                      (sum, poll) => sum + poll.votes,
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
                    Média de Votos
                  </p>
                  <p className="text-4xl font-bold text-muted-foreground">
                    {filteredActivePolls.length > 0
                      ? Math.round(
                          filteredActivePolls.reduce(
                            (sum, poll) => sum + poll.votes,
                            0
                          ) / filteredActivePolls.length
                        )
                      : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {filteredActivePolls.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    Nenhuma enquete ativa neste mês
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredActivePolls.map((poll, index) => (
                <Card
                  key={`active-${index}`}
                  className="border-2 border-primary/50 bg-primary/5"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          {poll.description}
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
                          {poll.votes} votos
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((option, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{option.description}</span>
                            <span className="text-muted-foreground">
                              {option.votes} votos ({option.percent}%)
                            </span>
                          </div>
                          <Progress value={option.percent} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Aba de Histórico */}
        <TabsContent value="closed" className="space-y-4">
          {filteredClosedPolls.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  Nenhuma enquete encerrada neste mês
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClosedPolls.map((poll, index) => (
              <Card key={`closed-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        {poll.description}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(poll.startDate).toLocaleDateString("pt-BR")}{" "}
                        até {new Date(poll.endDate).toLocaleDateString("pt-BR")}
                      </p>
                      {poll.cancelReason && (
                        <p className="text-sm text-destructive mt-1">
                          Cancelada: {poll.cancelReason}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      <Lock className="w-3 h-3 mr-1" />
                      {poll.status === "CANCELADA" ? "Cancelada" : "Encerrada"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {poll.options.map((option, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{option.description}</span>
                          <span className="text-muted-foreground">
                            {option.votes} votos ({option.percent}%)
                          </span>
                        </div>
                        <Progress value={option.percent} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Participação: {poll.votes} votos
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
                        value={option.optionDescription}
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
                    <Label htmlFor="startDate">Data e Hora de Início</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      {...form.register("startDate")}
                    />
                    {form.formState.errors.startDate && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data e Hora Final</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      {...form.register("endDate")}
                    />
                    {form.formState.errors.endDate && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.endDate.message}
                      </p>
                    )}
                  </div>
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
                      form.reset({
                        question: "",
                        options: [{ ...defaultOption }, { ...defaultOption }],
                        startDate: "",
                        endDate: "",
                        status: "ATIVO",
                      });
                      setPollOptions([{ ...defaultOption }, { ...defaultOption }]);
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
