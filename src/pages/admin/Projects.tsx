import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MaskedInput } from "@/components/ui/masked-input";
import {
  isValidCnpj,
  formatCurrencyInput,
  unformatCurrency,
  getMinDateTimeForInput,
  isDateTimeAtLeast5MinutesInFuture,
  dateTimeLocalToISO,
} from "@/lib/utils";
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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ProjectsSkeleton from "@/skeleton/admin/ProjectsSkeleton";
import {
  seasonService,
  isSeasonActive,
  isSeasonFinished,
  projectService,
  hasChosenOffer,
  type Season,
  type Project,
  type CreateOfferOption,
} from "@/services/api";

// Interface para opção de oferta no formulário
interface OfferFormOption {
  companyName: string;
  description: string;
  companyCnpj: string;
  totalValue: string;
  installmentsCount: string;
}

const defaultOfferOption: OfferFormOption = {
  companyName: "",
  description: "",
  companyCnpj: "",
  totalValue: "",
  installmentsCount: "",
};

export default function Projects() {
  const [isLoading, setIsLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Dialog states
  const [isNewSeasonDialogOpen, setIsNewSeasonDialogOpen] = useState(false);
  const [isFinishSeasonDialogOpen, setIsFinishSeasonDialogOpen] =
    useState(false);
  const [isOfferPollDialogOpen, setIsOfferPollDialogOpen] = useState(false);
  const [isStartProjectDialogOpen, setIsStartProjectDialogOpen] =
    useState(false);
  const [isDeleteOffersDialogOpen, setIsDeleteOffersDialogOpen] =
    useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  // Minimum datetime for inputs (5 minutes from now)
  const minDateTime = useMemo(() => getMinDateTimeForInput(), []);

  // Load seasons and projects data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load seasons and projects in parallel
      const [seasonsResponse, projectsResponse] = await Promise.all([
        seasonService.getSeasons(),
        projectService.getProjects(),
      ]);

      if (seasonsResponse.success && seasonsResponse.data) {
        setSeasons(seasonsResponse.data);

        // Find active season (endDate === null means active)
        const active = seasonsResponse.data.find((s) => isSeasonActive(s));
        setActiveSeason(active || null);
      }

      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados");
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar projetos");
      console.error("Erro ao carregar projetos:", error);
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
        await loadData();
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
        await loadData();
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

  // Get the next project that needs offer poll (first one without chosenOffer)
  const getNextProjectForOfferPoll = (): Project | null => {
    // Ordenar por rank e pegar o primeiro sem chosenOffer
    const projectsWithoutOffer = projects.filter((p) => !hasChosenOffer(p));
    const sortedProjects = [...projectsWithoutOffer].sort(
      (a, b) => (a.rank || 999) - (b.rank || 999)
    );
    return sortedProjects[0] || null;
  };

  const canCreateOfferPoll = (project: Project): boolean => {
    // Se já tem oferta escolhida, não pode criar enquete
    if (hasChosenOffer(project)) return false;

    // Se já tem datas de enquete definidas, não pode criar outra
    if (project.offerStartDate && project.offerEndDate) return false;

    const nextProject = getNextProjectForOfferPoll();
    return nextProject?._id === project._id;
  };

  const openOfferPollDialog = (project: Project) => {
    if (!canCreateOfferPoll(project)) {
      const nextProject = getNextProjectForOfferPoll();
      if (nextProject && nextProject._id !== project._id) {
        toast.error(
          `Você deve criar a enquete de ofertas para "${nextProject.title}" primeiro (${nextProject.rank}º lugar)`
        );
      }
      return;
    }

    setSelectedProject(project);
    setOfferOptions([{ ...defaultOfferOption }, { ...defaultOfferOption }]);
    setOfferPollStartDate("");
    setOfferPollEndDate("");
    setIsOfferPollDialogOpen(true);
  };

  const openStartProjectDialog = (project: Project) => {
    setSelectedProject(project);
    setIsStartProjectDialogOpen(true);
  };

  const openDeleteOffersDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOffersDialogOpen(true);
  };

  const handleStartProject = async () => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);

      // TODO: Implementar chamada de API para iniciar projeto
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `Projeto "${selectedProject.title}" iniciado com sucesso! O projeto foi adicionado ao financeiro.`
      );
      setIsStartProjectDialogOpen(false);
      setSelectedProject(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffers = async () => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);

      const response = await projectService.deleteProjectOffers(
        selectedProject._id
      );

      if (response.success) {
        toast.success(
          `Ofertas do projeto "${selectedProject.title}" foram removidas. Você pode criar uma nova enquete.`
        );
        setIsDeleteOffersDialogOpen(false);
        setSelectedProject(null);
        await loadProjects();
      } else {
        toast.error(response.message || "Erro ao remover ofertas");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover ofertas");
      console.error("Erro ao remover ofertas:", error);
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
    let formattedValue = value;

    // Aplicar máscara de moeda para o valor
    if (field === "totalValue") {
      formattedValue = formatCurrencyInput(value);
    }

    newOptions[index] = {
      ...newOptions[index],
      [field]: formattedValue,
    };
    setOfferOptions(newOptions);
  };

  const handleCreateOfferPoll = async () => {
    if (!selectedProject) return;

    // Validações
    const validOptions = offerOptions.filter(
      (opt) =>
        opt.companyName.trim() !== "" &&
        opt.description.trim() !== "" &&
        opt.companyCnpj.trim() !== "" &&
        opt.totalValue.trim() !== "" &&
        opt.installmentsCount.trim() !== ""
    );

    if (validOptions.length < 2) {
      toast.error("A enquete deve ter no mínimo 2 ofertas completas!");
      return;
    }

    if (!offerPollStartDate || !offerPollEndDate) {
      toast.error("Informe as datas e horários de início e fim da enquete!");
      return;
    }

    // Validar data de início (deve ser pelo menos 5 minutos no futuro)
    if (!isDateTimeAtLeast5MinutesInFuture(offerPollStartDate)) {
      toast.error(
        "A data e hora de início deve ser pelo menos 5 minutos no futuro!"
      );
      return;
    }

    // Validar data de fim (deve ser após a data de início)
    if (new Date(offerPollEndDate) <= new Date(offerPollStartDate)) {
      toast.error(
        "A data/hora final deve ser posterior à data/hora de início!"
      );
      return;
    }

    // Validar CNPJ (dígitos verificadores)
    for (const opt of validOptions) {
      if (!isValidCnpj(opt.companyCnpj)) {
        toast.error(`CNPJ inválido para a empresa "${opt.companyName}"`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Preparar dados para a API
      const offers: CreateOfferOption[] = validOptions.map((opt) => ({
        companyName: opt.companyName.trim(),
        description: opt.description.trim(),
        companyCnpj: opt.companyCnpj,
        totalValue: unformatCurrency(opt.totalValue),
        installmentsCount: Number(opt.installmentsCount),
      }));

      const response = await projectService.createOfferPoll({
        projectId: selectedProject._id,
        offerStartDate: dateTimeLocalToISO(offerPollStartDate),
        offerEndDate: dateTimeLocalToISO(offerPollEndDate),
        offers,
      });

      if (response.success) {
        toast.success(
          `Enquete de ofertas criada para "${selectedProject.title}"!`
        );
        setIsOfferPollDialogOpen(false);
        setSelectedProject(null);
        setOfferOptions([{ ...defaultOfferOption }, { ...defaultOfferOption }]);
        setOfferPollStartDate("");
        setOfferPollEndDate("");
        await loadProjects();
      } else {
        toast.error(response.message || "Erro ao criar enquete de ofertas");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar enquete de ofertas");
      console.error("Erro ao criar enquete de ofertas:", error);
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

  // Separate projects by status
  const projectsNeedingOfferPoll = projects
    .filter((p) => !hasChosenOffer(p) && !p.offerStartDate)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  const projectsWithPendingOfferPoll = projects
    .filter((p) => !hasChosenOffer(p) && p.offerStartDate && p.offerEndDate)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  const projectsWithOffer = projects
    .filter((p) => hasChosenOffer(p))
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

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

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="seasons">Gerenciar Temporadas</TabsTrigger>
        </TabsList>

        {/* Aba de Projetos */}
        <TabsContent value="projects" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-4xl font-bold text-orange-500">
                    {projectsNeedingOfferPoll.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Enquete em Andamento
                  </p>
                  <p className="text-4xl font-bold text-blue-500">
                    {projectsWithPendingOfferPoll.length}
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
                    {projectsWithOffer.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projetos com ofertas definidas - Aguardando aprovação para iniciar */}
          {projectsWithOffer.length > 0 && (
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
                {projectsWithOffer.map((project) => (
                  <Card
                    key={project._id}
                    className="border-2 border-green-500/50 bg-green-500/5"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-green-600" />
                            {project.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {project.description}
                          </p>
                        </div>
                        {project.rank && getRankBadge(project.rank)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{project.votes} votos</span>
                        </div>
                      </div>

                      {hasChosenOffer(project) &&
                        "companyName" in project.offer && (
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
                                  {project.offer.companyName}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Valor:
                                </span>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(project.offer.totalValue)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Parcelas:
                                </span>
                                <p className="font-medium">
                                  {project.offer.paidInstallments || 0} /{" "}
                                  {project.offer.installmentsCount}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Status:
                                </span>
                                <p className="font-medium text-orange-600">
                                  {project.offer.paymentStartDate
                                    ? "Em andamento"
                                    : "Aguardando aprovação"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      <Button
                        onClick={() => openStartProjectDialog(project)}
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

          {/* Projetos com enquete de ofertas em andamento */}
          {projectsWithPendingOfferPoll.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Enquetes de Ofertas em Andamento
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Estes projetos estão com enquete de ofertas ativa. Os moradores
                podem votar na melhor oferta.
              </p>

              <div className="space-y-4">
                {projectsWithPendingOfferPoll.map((project) => (
                  <Card
                    key={project._id}
                    className="border-2 border-blue-500/50 bg-blue-500/5"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                            {project.title}
                            <Badge
                              variant="outline"
                              className="ml-2 text-blue-600 border-blue-600"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Votação em andamento
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {project.description}
                          </p>
                        </div>
                        {project.rank && getRankBadge(project.rank)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{project.votes} votos no projeto</span>
                        </div>
                        {project.offerStartDate && project.offerEndDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(project.offerStartDate)} até{" "}
                              {formatDate(project.offerEndDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="destructive"
                        onClick={() => openDeleteOffersDialog(project)}
                        className="w-full md:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Refazer Enquete de Ofertas
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Projetos aguardando enquete de ofertas */}
          {projectsNeedingOfferPoll.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Aguardando Enquete de Ofertas
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre as ofertas em ordem sequencial, começando pelo projeto
                com mais votos.
              </p>

              <div className="space-y-4">
                {projectsNeedingOfferPoll.map((project) => {
                  const isNext = canCreateOfferPoll(project);
                  return (
                    <Card
                      key={project._id}
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
                              {project.title}
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
                              {project.description}
                            </p>
                          </div>
                          {project.rank && getRankBadge(project.rank)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{project.votes} votos</span>
                          </div>
                        </div>

                        {isNext ? (
                          <Button
                            onClick={() => openOfferPollDialog(project)}
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
                              {getNextProjectForOfferPoll()?.rank}º lugar
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
                  ver os projetos dos moradores.
                </p>
              </CardContent>
            </Card>
          )}

          {activeSeason && projects.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  Nenhum projeto disponível nesta temporada
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
            setSelectedProject(null);
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
              {selectedProject?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info do projeto */}
            {selectedProject && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{selectedProject.title}</h4>
                  {selectedProject.rank && getRankBadge(selectedProject.rank)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.description}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedProject.votes} votos
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`company-${index}`} className="text-xs">
                        Nome da Empresa
                      </Label>
                      <Input
                        id={`company-${index}`}
                        placeholder="Ex: Construtora ABC LTDA"
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
                      <Label htmlFor={`cnpj-${index}`} className="text-xs">
                        CNPJ
                      </Label>
                      <MaskedInput
                        id={`cnpj-${index}`}
                        mask="99.999.999/9999-99"
                        maskChar={null}
                        placeholder="00.000.000/0000-00"
                        value={option.companyCnpj}
                        onValueChange={(value) =>
                          handleOfferOptionChange(index, "companyCnpj", value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`description-${index}`} className="text-xs">
                      Descrição da Oferta
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      placeholder="Ex: Serviço completo de reforma com garantia de 2 anos"
                      value={option.description}
                      onChange={(e) =>
                        handleOfferOptionChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`value-${index}`} className="text-xs">
                        Valor Total (R$)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <Input
                          id={`value-${index}`}
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          className="pl-10"
                          value={option.totalValue}
                          onChange={(e) =>
                            handleOfferOptionChange(
                              index,
                              "totalValue",
                              e.target.value
                            )
                          }
                        />
                      </div>
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
                        min="1"
                        placeholder="Ex: 12"
                        value={option.installmentsCount}
                        onChange={(e) =>
                          handleOfferOptionChange(
                            index,
                            "installmentsCount",
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

            {/* Datas e Horários */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-start-date">Data e Hora de Início</Label>
                <Input
                  id="offer-start-date"
                  type="datetime-local"
                  min={minDateTime}
                  value={offerPollStartDate}
                  onChange={(e) => setOfferPollStartDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 5 minutos a partir de agora
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-end-date">Data e Hora Final</Label>
                <Input
                  id="offer-end-date"
                  type="datetime-local"
                  min={offerPollStartDate || minDateTime}
                  value={offerPollEndDate}
                  onChange={(e) => setOfferPollEndDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deve ser posterior à data/hora de início
                </p>
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
              Ao iniciar o projeto "{selectedProject?.title}", ele será
              adicionado ao módulo financeiro para acompanhamento de custos e
              andamento. Os pagamentos serão iniciados conforme a oferta
              escolhida.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedProject &&
            hasChosenOffer(selectedProject) &&
            "companyName" in selectedProject.offer && (
              <div className="p-4 bg-muted rounded-lg space-y-2 my-2">
                <h4 className="font-semibold text-sm">Resumo da Oferta:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Empresa:</span>
                    <p className="font-medium">
                      {selectedProject.offer.companyName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedProject.offer.totalValue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parcelas:</span>
                    <p className="font-medium">
                      {selectedProject.offer.installmentsCount}x de{" "}
                      {formatCurrency(
                        selectedProject.offer.totalValue /
                          selectedProject.offer.installmentsCount
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

      {/* AlertDialog para Deletar Ofertas */}
      <AlertDialog
        open={isDeleteOffersDialogOpen}
        onOpenChange={setIsDeleteOffersDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Refazer Enquete de Ofertas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao refazer a enquete, todas as ofertas cadastradas para o projeto
              "{selectedProject?.title}" serão removidas e você precisará criar
              uma nova enquete com novas ofertas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg my-2">
            <p className="text-sm text-destructive font-medium">
              Esta ação é irreversível!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Todos os votos já realizados nas ofertas serão perdidos.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOffers}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Removendo..." : "Remover Ofertas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
