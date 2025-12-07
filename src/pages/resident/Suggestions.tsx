import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SuggestionsSkeleton from "@/skeleton/resident/SuggestionsSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb, Edit, Trash2, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  suggestionSchema,
  type SuggestionSchema,
} from "@/schemas/resident/suggestions.schema";
import {
  seasonService,
  residentSuggestionService,
  ApiClientError,
  type Season,
  type ResidentSuggestion,
} from "@/services/api";

export default function Suggestions() {
  const [isLoading, setIsLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [suggestions, setSuggestions] = useState<ResidentSuggestion[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SuggestionSchema>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const description = watch("description");

  // Check if the selected season is read-only
  // A season is read-only if:
  // 1. It's not the current active season (endDate !== null means it's finished)
  // 2. Or it's a previous season
  const isReadOnly = (): boolean => {
    if (!selectedSeasonId || seasons.length === 0) return true;

    const selectedSeason = seasons.find((s) => s._id === selectedSeasonId);
    if (!selectedSeason) return true;

    // Season is read-only if it has been finished (endDate is not null)
    return selectedSeason.endDate !== null;
  };

  // Get suggestions for display in the selected season
  // Show suggestions that currently belong to OR were originally created in this season
  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.actualSeasonId === selectedSeasonId ||
      s.fromSeasonId === selectedSeasonId
  );

  // Count suggestions originally created in the selected season (for the 5-per-season limit)
  // Each season gives the resident 5 new "slots" for suggestions
  // Carried over suggestions don't count against the new season's limit
  const suggestionsCreatedInSeason = suggestions.filter((s) => {
    // If fromSeasonId is set, use it; otherwise fall back to actualSeasonId
    const originSeasonId = s.fromSeasonId ?? s.actualSeasonId;
    return originSeasonId === selectedSeasonId;
  }).length;

  const canCreateMore = suggestionsCreatedInSeason < 5 && !isReadOnly();

  // Load seasons on mount
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const response = await seasonService.getSeasons();
        if (response.success && response.data) {
          const sortedSeasons = [...response.data].sort(
            (a, b) => b.seasonNumber - a.seasonNumber
          );
          setSeasons(sortedSeasons);

          // Select the active season (endDate === null) or the most recent one
          const activeSeason = sortedSeasons.find((s) => s.endDate === null);
          if (activeSeason) {
            setSelectedSeasonId(activeSeason._id);
          } else if (sortedSeasons.length > 0) {
            setSelectedSeasonId(sortedSeasons[0]._id);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar temporadas:", error);
        if (error instanceof ApiClientError) {
          toast.error(error.response.message || "Erro ao carregar temporadas");
        } else {
          toast.error("Erro ao carregar temporadas");
        }
      }
    };

    loadSeasons();
  }, []);

  // Load suggestions when component mounts
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setIsLoading(true);
        const response =
          await residentSuggestionService.getSuggestionsByApartment();
        if (response.success && response.data) {
          setSuggestions(response.data);
        }
      } catch (error) {
        console.error("Erro ao carregar sugestões:", error);
        if (error instanceof ApiClientError) {
          toast.error(error.response.message || "Erro ao carregar sugestões");
        } else {
          toast.error("Erro ao carregar sugestões");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, []);

  const onSubmit = async (data: SuggestionSchema) => {
    if (isReadOnly()) {
      toast.error(
        "Não é possível modificar sugestões de temporadas anteriores"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const response = await residentSuggestionService.updateSuggestion(
          editingId,
          {
            title: data.title,
            description: data.description,
          }
        );

        if (response.success && response.data) {
          setSuggestions(
            suggestions.map((s) => (s._id === editingId ? response.data! : s))
          );
          toast.success("Sugestão atualizada com sucesso!");
          setEditingId(null);
        }
      } else {
        const response = await residentSuggestionService.createSuggestion({
          title: data.title,
          description: data.description,
        });

        if (response.success && response.data) {
          // Add actualSeasonId to the new suggestion so it appears in the filtered list
          const newSuggestion: ResidentSuggestion = {
            ...response.data,
            actualSeasonId: selectedSeasonId,
          };
          setSuggestions([...suggestions, newSuggestion]);
          toast.success("Sugestão criada com sucesso!");
          setIsCreating(false);
        }
      }
      reset();
    } catch (error) {
      console.error("Erro ao salvar sugestão:", error);
      if (error instanceof ApiClientError) {
        // Exibir erros detalhados de validação do Zod
        if (error.response.errors && error.response.errors.length > 0) {
          const errorMessages = error.response.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join("\n");
          toast.error(errorMessages);
        } else {
          toast.error(error.response.message || "Erro ao salvar sugestão");
        }
      } else {
        toast.error("Erro ao salvar sugestão");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (id: string) => {
    if (isReadOnly()) {
      toast.error("Não é possível editar sugestões de temporadas anteriores");
      return;
    }

    const suggestion = suggestions.find((s) => s._id === id);
    if (suggestion) {
      setValue("title", suggestion.title);
      setValue("description", suggestion.description);
      setEditingId(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly()) {
      toast.error("Não é possível excluir sugestões de temporadas anteriores");
      return;
    }

    try {
      const response = await residentSuggestionService.deleteSuggestion(id);
      if (response.success) {
        setSuggestions(suggestions.filter((s) => s._id !== id));
        toast.success("Sugestão excluída com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao excluir sugestão:", error);
      if (error instanceof ApiClientError) {
        if (error.response.errors && error.response.errors.length > 0) {
          const errorMessages = error.response.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join("\n");
          toast.error(errorMessages);
        } else {
          toast.error(error.response.message || "Erro ao excluir sugestão");
        }
      } else {
        toast.error("Erro ao excluir sugestão");
      }
    }
  };

  const handleCancel = () => {
    reset();
    setIsCreating(false);
    setEditingId(null);
  };

  const getSeasonLabel = (season: Season): string => {
    const statusLabel = season.endDate === null ? " (Ativa)" : "";
    return `Temporada ${season.seasonNumber}${statusLabel}`;
  };

  if (isLoading) {
    return <SuggestionsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Minhas Sugestões</h1>
          <p className="text-muted-foreground mt-1">
            {isReadOnly() ? (
              <span className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Temporada encerrada (para dar sugestões, deverá ser uma
                temporada ativa)
              </span>
            ) : (
              `Você pode criar até 5 sugestões nesta temporada (${suggestionsCreatedInSeason}/5)`
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {canCreateMore && !isCreating && !editingId && (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Sugestão
            </Button>
          )}
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione a temporada" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season._id} value={season._id}>
                  {getSeasonLabel(season)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && !isReadOnly() && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {editingId ? "Editar Sugestão" : "Nova Sugestão"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Ex: Reforma da Piscina"
                  maxLength={100}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Descreva sua sugestão em detalhes..."
                  rows={4}
                  maxLength={1000}
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground text-right">
                  {description?.length || 0}/1000
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar"
                    : "Criar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <div className="grid gap-4">
        {filteredSuggestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {isReadOnly()
                  ? "Nenhuma sugestão nesta temporada."
                  : "Você ainda não criou nenhuma sugestão."}
              </p>
              {!isReadOnly() && (
                <p className="text-sm mt-2">
                  Clique em "Nova Sugestão" para começar!
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <Card key={suggestion._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{suggestion.title}</CardTitle>
                  {!isReadOnly() && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(suggestion._id)}
                        disabled={editingId !== null || isCreating}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(suggestion._id)}
                        disabled={editingId !== null || isCreating}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                  {isReadOnly() && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {suggestion.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
