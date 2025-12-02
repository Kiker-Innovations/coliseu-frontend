import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderKanban,
  Trophy,
  Calendar,
  Play,
  Square,
  Plus,
  Clock,
  Users,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  Hash,
  X,
  Building2,
  DollarSign,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import ProjectsSkeleton from "@/skeleton/admin/ProjectsSkeleton";
import {
  seasonService,
  isSeasonActive,
  isSeasonFinished,
  type Season,
  type SuggestionWithOffer,
} from "@/services/api";

// Mock data para sugestões com ofertas
// Ordem correta: 1º já tem oferta escolhida, 2º precisa criar enquete, 3º aguardando o 2º
const mockSuggestions: SuggestionWithOffer[] = [
  {
    _id: "sug-001",
    title: "Reforma da Piscina",
    description: "Melhorar a área de lazer com nova piscina aquecida",
    votes: 45,
    rank: 1,
    residentName: "João Silva",
    chosenOffer: {
      companyName: "AquaPiscinas LTDA",
      paidInstallments: 0,
      totalInstallments: 18,
      value: 85000,
      paymentStartDate: null, // Aguardando aprovação para iniciar
      createdAt: "2025-11-20T14:30:00.000Z",
    },
  },
  {
    _id: "sug-002",
    title: "Instalação de Energia Solar",
    description: "Instalar painéis solares para reduzir custos de energia",
    votes: 38,
    rank: 2,
    residentName: "Maria Santos",
    chosenOffer: null, // Próximo a criar enquete de ofertas
  },
  {
    _id: "sug-003",
    title: "Reforma do Salão de Festas",
    description:
      "Modernizar o salão de festas com nova decoração e ar condicionado",
    votes: 32,
    rank: 3,
    residentName: "Carlos Oliveira",
    chosenOffer: null, // Aguardando o 2º lugar criar enquete primeiro
  },
];

// Interface para opção de oferta no formulário
interface OfferFormOption {
  companyName: string;
  totalInstallments: string;
  value: string;
}

const defaultOfferOption: OfferFormOption = {
  companyName: "",
  totalInstallments: "",
  value: "",
};

export default function Projects() {
  const [isLoading, setIsLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionWithOffer[]>([]);

  // Dialog states
  const [isNewSeasonDialogOpen, setIsNewSeasonDialogOpen] = useState(false);
  const [isFinishSeasonDialogOpen, setIsFinishSeasonDialogOpen] =
    useState(false);
  const [isOfferPollDialogOpen, setIsOfferPollDialogOpen] = useState(false);
  const [isStartProjectDialogOpen, setIsStartProjectDialogOpen] =
    useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<SuggestionWithOffer | null>(null);
  const [reuseSuggestions, setReuseSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishConfirmText, setFinishConfirmText] = useState("");

  // Offer poll form state
  const [offerOptions, setOfferOptions] = useState<OfferFormOption[]>([
    { ...defaultOfferOption },
    { ...defaultOfferOption },
  ]);
  const [offerPollStartDate, setOfferPollStartDate] = useState("");
  const [offerPollEndDate, setOfferPollEndDate] = useState("");

  // Load seasons data
  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      setIsLoading(true);
      const response = await seasonService.getSeasons();

      if (response.success && response.data) {
        setSeasons(response.data);

        // Find active season (endDate === null means active)
        const active = response.data.find((s) => isSeasonActive(s));
        setActiveSeason(active || null);

        // Load mock suggestions when there's an active season
        if (active) {
          setSuggestions(mockSuggestions);
        } else {
          setSuggestions([]);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar temporadas");
      console.error("Erro ao carregar temporadas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    try {
      setIsSubmitting(true);

      const response = await seasonService.createSeason({
        reusedSuggestions: reuseSuggestions,
      });

      if (response.success) {
        toast.success("Nova temporada iniciada com sucesso!");
        setIsNewSeasonDialogOpen(false);
        setReuseSuggestions(false);
        await loadSeasons();
      } else {
        toast.error(response.message || "Erro ao criar temporada");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar temporada");
      console.error("Erro ao criar temporada:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSeason = async () => {
    if (!activeSeason) return;

    if (finishConfirmText.toLowerCase() !== "encerrar") {
      toast.error('Digite "encerrar" para confirmar');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await seasonService.finishSeason(activeSeason._id);

      if (response.success) {
        toast.success("Temporada encerrada com sucesso!");
        setIsFinishSeasonDialogOpen(false);
        setFinishConfirmText("");
        await loadSeasons();
      } else {
        toast.error(response.message || "Erro ao encerrar temporada");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao encerrar temporada");
      console.error("Erro ao encerrar temporada:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the next suggestion that needs offer poll (first one without chosenOffer)
  const getNextSuggestionForOfferPoll = (): SuggestionWithOffer | null => {
    // Ordenar por rank e pegar a primeira sem chosenOffer
    const sortedSuggestions = [...suggestions].sort((a, b) => a.rank - b.rank);
    return sortedSuggestions.find((s) => s.chosenOffer === null) || null;
  };

  const canCreateOfferPoll = (suggestion: SuggestionWithOffer): boolean => {
    const nextSuggestion = getNextSuggestionForOfferPoll();
    return nextSuggestion?._id === suggestion._id;
  };

  const openOfferPollDialog = (suggestion: SuggestionWithOffer) => {
    if (!canCreateOfferPoll(suggestion)) {
      const nextSuggestion = getNextSuggestionForOfferPoll();
      if (nextSuggestion) {
        toast.error(
          `Você deve criar a enquete de ofertas para "${nextSuggestion.title}" primeiro (${nextSuggestion.rank}º lugar)`
        );
      }
      return;
    }

    setSelectedSuggestion(suggestion);
    setOfferOptions([{ ...defaultOfferOption }, { ...defaultOfferOption }]);
    setOfferPollStartDate("");
    setOfferPollEndDate("");
    setIsOfferPollDialogOpen(true);
  };

  const openStartProjectDialog = (suggestion: SuggestionWithOffer) => {
    setSelectedSuggestion(suggestion);
    setIsStartProjectDialogOpen(true);
  };

  const handleStartProject = async () => {
    if (!selectedSuggestion) return;

    try {
      setIsSubmitting(true);

      // TODO: Implementar chamada de API para iniciar projeto
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `Projeto "${selectedSuggestion.title}" iniciado com sucesso! O projeto foi adicionado ao financeiro.`
      );
      setIsStartProjectDialogOpen(false);
      setSelectedSuggestion(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOfferOption = () => {
    if (offerOptions.length < 5) {
      setOfferOptions([...offerOptions, { ...defaultOfferOption }]);
    }
  };

  const handleRemoveOfferOption = (index: number) => {
    if (offerOptions.length > 2) {
      setOfferOptions(offerOptions.filter((_, i) => i !== index));
    }
  };

  const handleOfferOptionChange = (
    index: number,
    field: keyof OfferFormOption,
    value: string
  ) => {
    const newOptions = [...offerOptions];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setOfferOptions(newOptions);
  };

  const handleCreateOfferPoll = async () => {
    if (!selectedSuggestion) return;

    // Validações
    const validOptions = offerOptions.filter(
      (opt) =>
        opt.companyName.trim() !== "" &&
        opt.totalInstallments.trim() !== "" &&
        opt.value.trim() !== ""
    );

    if (validOptions.length < 2) {
      toast.error("A enquete deve ter no mínimo 2 ofertas completas!");
      return;
    }

    if (!offerPollStartDate || !offerPollEndDate) {
      toast.error("Informe as datas de início e fim da enquete!");
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Implementar chamada de API para criar enquete de ofertas
      // Por enquanto simula a ação
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `Enquete de ofertas criada para "${selectedSuggestion.title}"!`
      );
      setIsOfferPollDialogOpen(false);
      setSelectedSuggestion(null);
      setOfferOptions([{ ...defaultOfferOption }, { ...defaultOfferOption }]);
      setOfferPollStartDate("");
      setOfferPollEndDate("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar enquete de ofertas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Trophy className="w-3 h-3 mr-1" />
            1º Lugar
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-gray-400 hover:bg-gray-500">
            <Trophy className="w-3 h-3 mr-1" />
            2º Lugar
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-amber-700 hover:bg-amber-800">
            <Trophy className="w-3 h-3 mr-1" />
            3º Lugar
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Trophy className="w-3 h-3 mr-1" />
            {rank}º Lugar
          </Badge>
        );
    }
  };

  // Get finished seasons sorted by endDate (most recent first)
  const finishedSeasons = seasons
    .filter((s) => isSeasonFinished(s))
    .sort(
      (a, b) =>
        new Date(b.endDate || "").getTime() -
        new Date(a.endDate || "").getTime()
    );

  // Get previous finished season for reuse option
  const previousFinishedSeason = finishedSeasons[0];

  // Separate suggestions by status
  const suggestionsNeedingOfferPoll = suggestions
    .filter((s) => s.chosenOffer === null)
    .sort((a, b) => a.rank - b.rank);

  const suggestionsWithOffer = suggestions
    .filter((s) => s.chosenOffer !== null)
    .sort((a, b) => a.rank - b.rank);

  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie os projetos e temporadas do condomínio
          </p>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suggestions">Sugestões Aprovadas</TabsTrigger>
          <TabsTrigger value="seasons">Gerenciar Temporadas</TabsTrigger>
        </TabsList>

        {/* Aba de Sugestões */}
        <TabsContent value="suggestions" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Temporada Ativa
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {activeSeason ? `Nº ${activeSeason.seasonNumber}` : "Não"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Aguardando Enquete
                  </p>
                  <p className="text-4xl font-bold text-accent">
                    {suggestionsNeedingOfferPoll.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Prontos para Iniciar
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    {suggestionsWithOffer.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sugestões com ofertas definidas - Aguardando aprovação para iniciar */}
          {suggestionsWithOffer.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Projetos Aguardando Aprovação
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Estes projetos já tiveram suas ofertas votadas e estão prontos
                para serem iniciados.
              </p>

              <div className="space-y-4">
                {suggestionsWithOffer.map((suggestion) => (
                  <Card
                    key={suggestion._id}
                    className="border-2 border-green-500/50 bg-green-500/5"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-green-600" />
                            {suggestion.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {suggestion.description}
                          </p>
                        </div>
                        {getRankBadge(suggestion.rank)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{suggestion.votes} votos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Por: {suggestion.residentName}</span>
                        </div>
                      </div>

                      {suggestion.chosenOffer && (
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Oferta Escolhida
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Empresa:
                              </span>
                              <p className="font-medium">
                                {suggestion.chosenOffer.companyName}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Valor:
                              </span>
                              <p className="font-medium text-green-600">
                                {formatCurrency(suggestion.chosenOffer.value)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Parcelas:
                              </span>
                              <p className="font-medium">
                                {suggestion.chosenOffer.paidInstallments} /{" "}
                                {suggestion.chosenOffer.totalInstallments}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Status:
                              </span>
                              <p className="font-medium text-orange-600">
                                Aguardando aprovação
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => openStartProjectDialog(suggestion)}
                        className="w-full md:w-auto"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Projeto
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões aguardando enquete de ofertas */}
          {suggestionsNeedingOfferPoll.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Aguardando Enquete de Ofertas
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre as ofertas em ordem sequencial, começando pela sugestão
                com mais votos.
              </p>

              <div className="space-y-4">
                {suggestionsNeedingOfferPoll.map((suggestion) => {
                  const isNext = canCreateOfferPoll(suggestion);
                  return (
                    <Card
                      key={suggestion._id}
                      className={
                        isNext
                          ? "border-2 border-orange-500/50 bg-orange-500/5"
                          : "opacity-60 border-dashed"
                      }
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 text-primary" />
                              {suggestion.title}
                              {isNext ? (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-orange-600 border-orange-600"
                                >
                                  Próximo
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-muted-foreground"
                                >
                                  <Lock className="w-3 h-3 mr-1" />
                                  Aguardando
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              {suggestion.description}
                            </p>
                          </div>
                          {getRankBadge(suggestion.rank)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{suggestion.votes} votos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Por: {suggestion.residentName}</span>
                          </div>
                        </div>

                        {isNext ? (
                          <Button
                            onClick={() => openOfferPollDialog(suggestion)}
                            className="w-full md:w-auto"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Criar Enquete de Ofertas
                          </Button>
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>
                              Aguardando a criação da enquete para o{" "}
                              {getNextSuggestionForOfferPoll()?.rank}º lugar
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {!activeSeason && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <FolderKanban className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  Nenhuma temporada ativa no momento
                </p>
                <p className="text-sm text-muted-foreground">
                  Inicie uma nova temporada na aba "Gerenciar Temporadas" para
                  ver as sugestões dos moradores.
                </p>
              </CardContent>
            </Card>
          )}

          {activeSeason && suggestions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  Nenhuma sugestão disponível nesta temporada
                </p>
                <p className="text-sm text-muted-foreground">
                  Aguarde os moradores cadastrarem suas sugestões.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba de Gerenciamento de Temporadas */}
        <TabsContent value="seasons" className="space-y-6">
          {/* Current Season Status */}
          <Card
            className={
              activeSeason ? "border-2 border-green-500/50 bg-green-500/5" : ""
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Temporada Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSeason ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500">Ativa</Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Hash className="w-3 h-3" />
                          Temporada {activeSeason.seasonNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Iniciada em: {formatDate(activeSeason.createdAt)}
                      </p>
                      {activeSeason.reusedSuggestions && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <RefreshCw className="w-3 h-3" />
                          Sugestões reutilizadas da temporada anterior
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setIsFinishSeasonDialogOpen(true)}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Encerrar Temporada
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma temporada ativa no momento
                  </p>
                  <Button onClick={() => setIsNewSeasonDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Nova Temporada
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Season History */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Histórico de Temporadas
            </h2>

            {finishedSeasons.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    Nenhuma temporada encerrada ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {finishedSeasons.map((season) => (
                  <Card key={season._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                            Temporada {season.seasonNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {formatDate(season.createdAt)} até{" "}
                            {season.endDate
                              ? formatDate(season.endDate)
                              : "N/A"}
                          </p>
                        </div>
                        <Badge variant="secondary">Encerrada</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {season.reusedSuggestions && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Sugestões reutilizadas da temporada anterior
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Temporada */}
      <Dialog
        open={isNewSeasonDialogOpen}
        onOpenChange={setIsNewSeasonDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Nova Temporada</DialogTitle>
            <DialogDescription>
              Uma nova temporada permite que os moradores cadastrem suas
              sugestões para melhorias no condomínio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {previousFinishedSeason && (
              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="reuse-suggestions">
                    Reutilizar sugestões da temporada anterior
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    As sugestões cadastradas pelos moradores na temporada{" "}
                    {previousFinishedSeason.seasonNumber} serão mantidas.
                  </p>
                </div>
                <Switch
                  id="reuse-suggestions"
                  checked={reuseSuggestions}
                  onCheckedChange={setReuseSuggestions}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewSeasonDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateSeason} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Iniciar Temporada
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Encerrar Temporada com Confirmação */}
      <Dialog
        open={isFinishSeasonDialogOpen}
        onOpenChange={(open) => {
          setIsFinishSeasonDialogOpen(open);
          if (!open) setFinishConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Encerrar Temporada {activeSeason?.seasonNumber}?
            </DialogTitle>
            <DialogDescription>
              Ao encerrar esta temporada, não será possível reabri-la. Os
              moradores não poderão mais cadastrar ou votar em sugestões até que
              uma nova temporada seja iniciada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">
                Esta ação é irreversível!
              </p>
              <p className="text-sm text-muted-foreground">
                Digite <strong>"encerrar"</strong> abaixo para confirmar:
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-finish">Confirmação</Label>
              <Input
                id="confirm-finish"
                placeholder='Digite "encerrar"'
                value={finishConfirmText}
                onChange={(e) => setFinishConfirmText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFinishSeasonDialogOpen(false);
                setFinishConfirmText("");
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinishSeason}
              disabled={
                isSubmitting || finishConfirmText.toLowerCase() !== "encerrar"
              }
            >
              {isSubmitting ? "Encerrando..." : "Encerrar Temporada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Criar Enquete de Ofertas */}
      <Dialog
        open={isOfferPollDialogOpen}
        onOpenChange={(open) => {
          setIsOfferPollDialogOpen(open);
          if (!open) {
            setSelectedSuggestion(null);
            setOfferOptions([
              { ...defaultOfferOption },
              { ...defaultOfferOption },
            ]);
            setOfferPollStartDate("");
            setOfferPollEndDate("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Enquete de Ofertas</DialogTitle>
            <DialogDescription>
              Cadastre as ofertas das empresas para o projeto "
              {selectedSuggestion?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info do projeto */}
            {selectedSuggestion && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{selectedSuggestion.title}</h4>
                  {getRankBadge(selectedSuggestion.rank)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedSuggestion.description}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedSuggestion.votes} votos
                </p>
              </div>
            )}

            {/* Ofertas */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Ofertas das Empresas
              </Label>
              <p className="text-sm text-muted-foreground">
                Cadastre pelo menos 2 ofertas de empresas diferentes
              </p>

              {offerOptions.map((option, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Oferta {index + 1}</Label>
                    {offerOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOfferOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`company-${index}`} className="text-xs">
                        Nome da Empresa
                      </Label>
                      <Input
                        id={`company-${index}`}
                        placeholder="Ex: Reformas LTDA"
                        value={option.companyName}
                        onChange={(e) =>
                          handleOfferOptionChange(
                            index,
                            "companyName",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`value-${index}`} className="text-xs">
                        Valor Total (R$)
                      </Label>
                      <Input
                        id={`value-${index}`}
                        type="number"
                        placeholder="Ex: 50000"
                        value={option.value}
                        onChange={(e) =>
                          handleOfferOptionChange(
                            index,
                            "value",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`installments-${index}`}
                        className="text-xs"
                      >
                        Nº de Parcelas
                      </Label>
                      <Input
                        id={`installments-${index}`}
                        type="number"
                        placeholder="Ex: 12"
                        value={option.totalInstallments}
                        onChange={(e) =>
                          handleOfferOptionChange(
                            index,
                            "totalInstallments",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {offerOptions.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOfferOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Oferta
                </Button>
              )}
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-start-date">Data de Início</Label>
                <Input
                  id="offer-start-date"
                  type="date"
                  value={offerPollStartDate}
                  onChange={(e) => setOfferPollStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-end-date">Data Final</Label>
                <Input
                  id="offer-end-date"
                  type="date"
                  value={offerPollEndDate}
                  onChange={(e) => setOfferPollEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOfferPollDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateOfferPoll} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Criar Enquete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para Iniciar Projeto */}
      <AlertDialog
        open={isStartProjectDialogOpen}
        onOpenChange={setIsStartProjectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao iniciar o projeto "{selectedSuggestion?.title}", ele será
              adicionado ao módulo financeiro para acompanhamento de custos e
              andamento. Os pagamentos serão iniciados conforme a oferta
              escolhida.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedSuggestion?.chosenOffer && (
            <div className="p-4 bg-muted rounded-lg space-y-2 my-2">
              <h4 className="font-semibold text-sm">Resumo da Oferta:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Empresa:</span>
                  <p className="font-medium">
                    {selectedSuggestion.chosenOffer.companyName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedSuggestion.chosenOffer.value)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Parcelas:</span>
                  <p className="font-medium">
                    {selectedSuggestion.chosenOffer.totalInstallments}x de{" "}
                    {formatCurrency(
                      selectedSuggestion.chosenOffer.value /
                        selectedSuggestion.chosenOffer.totalInstallments
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartProject}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Iniciando..." : "Iniciar Projeto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
