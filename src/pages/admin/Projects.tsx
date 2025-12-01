import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";
import ProjectsSkeleton from "@/skeleton/admin/ProjectsSkeleton";
import { seasonService, type Season, type TopSuggestion } from "@/services/api";

export default function Projects() {
  const [isLoading, setIsLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [topSuggestions, setTopSuggestions] = useState<TopSuggestion[]>([]);

  // Dialog states
  const [isNewSeasonDialogOpen, setIsNewSeasonDialogOpen] = useState(false);
  const [isFinishSeasonDialogOpen, setIsFinishSeasonDialogOpen] =
    useState(false);
  const [isStartProjectDialogOpen, setIsStartProjectDialogOpen] =
    useState(false);
  const [selectedProject, setSelectedProject] = useState<TopSuggestion | null>(
    null
  );
  const [reuseSuggestions, setReuseSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Find active season
        const active = response.data.find((s) => s.status === "ACTIVE");
        setActiveSeason(active || null);

        // Load top suggestions from active season if exists
        if (active?.topSuggestions) {
          setTopSuggestions(active.topSuggestions);
        } else {
          setTopSuggestions([]);
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

    try {
      setIsSubmitting(true);

      const response = await seasonService.finishSeason(activeSeason.id);

      if (response.success) {
        toast.success("Temporada encerrada com sucesso!");
        setIsFinishSeasonDialogOpen(false);
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

  const handleStartProject = async () => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);

      // TODO: Implementar chamada de API para iniciar projeto
      // Por enquanto simula a ação
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

  const openStartProjectDialog = (suggestion: TopSuggestion) => {
    setSelectedProject(suggestion);
    setIsStartProjectDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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
        return null;
    }
  };

  // Get previous finished season for reuse option
  const previousFinishedSeason = seasons
    .filter((s) => s.status === "FINISHED")
    .sort(
      (a, b) =>
        new Date(b.endDate || "").getTime() -
        new Date(a.endDate || "").getTime()
    )[0];

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

        {/* Aba de Sugestões Top 3 */}
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
                    {activeSeason ? "Sim" : "Não"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Projetos Disponíveis
                  </p>
                  <p className="text-4xl font-bold text-accent">
                    {topSuggestions.length}
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
                  <p className="text-4xl font-bold text-muted-foreground">
                    {topSuggestions.reduce((sum, s) => sum + s.votes, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 3 Suggestions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top 3 Sugestões dos Moradores
            </h2>

            {!activeSeason ? (
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
            ) : topSuggestions.length === 0 ? (
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
            ) : (
              <div className="space-y-4">
                {topSuggestions.map((suggestion) => (
                  <Card
                    key={suggestion.id}
                    className={
                      suggestion.rank === 1
                        ? "border-2 border-yellow-500/50 bg-yellow-500/5"
                        : ""
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-primary" />
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
            )}
          </div>
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
                      <Badge className="bg-green-500 mb-2">Ativa</Badge>
                      <p className="text-sm text-muted-foreground">
                        Iniciada em: {formatDate(activeSeason.startDate)}
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

            {seasons.filter((s) => s.status === "FINISHED").length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    Nenhuma temporada encerrada ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {seasons
                  .filter((s) => s.status === "FINISHED")
                  .sort(
                    (a, b) =>
                      new Date(b.endDate || "").getTime() -
                      new Date(a.endDate || "").getTime()
                  )
                  .map((season) => (
                    <Card key={season.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                              Temporada Encerrada
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              {formatDate(season.startDate)} até{" "}
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
                    As sugestões cadastradas pelos moradores na temporada
                    anterior serão mantidas.
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

      {/* AlertDialog para Encerrar Temporada */}
      <AlertDialog
        open={isFinishSeasonDialogOpen}
        onOpenChange={setIsFinishSeasonDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Temporada?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar esta temporada, não será possível reabri-la. Os
              moradores não poderão mais cadastrar ou votar em sugestões até que
              uma nova temporada seja iniciada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishSeason}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Encerrando..." : "Encerrar Temporada"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para Iniciar Projeto */}
      <AlertDialog
        open={isStartProjectDialogOpen}
        onOpenChange={setIsStartProjectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao iniciar o projeto "{selectedProject?.title}", ele se tornará
              uma "sugestão aprovada" e será adicionado ao módulo financeiro
              para acompanhamento de custos e andamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
