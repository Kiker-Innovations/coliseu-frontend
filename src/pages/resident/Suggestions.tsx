import { useState, useEffect, useCallback } from "react";
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
import { suggestionSchema, type SuggestionSchema } from "@/schemas/resident/suggestions.schema";
import {
	seasonService,
	residentSuggestionService,
	ApiClientError,
	type Season,
	type ResidentSuggestion,
} from "@/services/api";
import { usePageRefresh } from "@/hooks/use-page-refresh";

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
	const isReadOnly = (): boolean => {
		if (!selectedSeasonId || seasons.length === 0) return true;

		const selectedSeason = seasons.find((s) => s._id === selectedSeasonId);
		if (!selectedSeason) return true;

		return selectedSeason.endDate !== null;
	};

	// Get suggestions for display in the selected season
	const filteredSuggestions = suggestions.filter(
		(s) => s.actualSeasonId === selectedSeasonId || s.fromSeasonId === selectedSeasonId,
	);

	// Count suggestions originally created in the selected season
	const suggestionsCreatedInSeason = suggestions.filter((s) => {
		const originSeasonId = s.fromSeasonId ?? s.actualSeasonId;
		return originSeasonId === selectedSeasonId;
	}).length;

	const canCreateMore = suggestionsCreatedInSeason < 5 && !isReadOnly();

	// Load all data
	const loadData = useCallback(async () => {
			try {
			setIsLoading(true);
			
			const [seasonsResponse, suggestionsResponse] = await Promise.all([
				seasonService.getSeasons(),
				residentSuggestionService.getSuggestionsByApartment(),
			]);

			if (seasonsResponse.success && seasonsResponse.data) {
				const sortedSeasons = [...seasonsResponse.data].sort((a, b) => b.seasonNumber - a.seasonNumber);
					setSeasons(sortedSeasons);

				// Select the active season or the most recent one
				if (!selectedSeasonId) {
					const activeSeason = sortedSeasons.find((s) => s.endDate === null);
					if (activeSeason) {
						setSelectedSeasonId(activeSeason._id);
					} else if (sortedSeasons.length > 0) {
						setSelectedSeasonId(sortedSeasons[0]._id);
					}
				}
			}

			if (suggestionsResponse.success && suggestionsResponse.data) {
				setSuggestions(suggestionsResponse.data);
				}
			} catch (error) {
			console.error("Erro ao carregar dados:", error);
				if (error instanceof ApiClientError) {
				toast.error(error.response.message || "Erro ao carregar dados");
				} else {
				toast.error("Erro ao carregar dados");
				}
			} finally {
				setIsLoading(false);
			}
	}, [selectedSeasonId]);

	// Register refresh function for pull-to-refresh
	usePageRefresh({
		onRefresh: loadData,
		enabled: !isCreating && !editingId,
	});

	// Load data on mount
	useEffect(() => {
		loadData();
	}, []);

	const onSubmit = async (data: SuggestionSchema) => {
		if (isReadOnly()) {
			toast.error("Não é possível modificar sugestões de temporadas anteriores");
			return;
		}

		setIsSubmitting(true);
		try {
			if (editingId) {
				const response = await residentSuggestionService.updateSuggestion(editingId, {
					title: data.title,
					description: data.description,
				});

				if (response.success && response.data) {
					setSuggestions(suggestions.map((s) => (s._id === editingId ? response.data! : s)));
					toast.success("Sugestão atualizada com sucesso!");
					setEditingId(null);
				}
			} else {
				const response = await residentSuggestionService.createSuggestion({
					title: data.title,
					description: data.description,
				});

				if (response.success && response.data) {
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
			setIsCreating(false);
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
		<div className="space-y-4 sm:space-y-6">
			{/* Header - Mobile First */}
			<div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-start sm:gap-4">
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl sm:text-3xl font-bold truncate">Minhas Sugestões</h1>
					<p className="text-sm sm:text-base text-muted-foreground mt-1">
						{isReadOnly() ? (
							<span className="flex items-center gap-1">
								<Lock className="w-4 h-4 shrink-0" />
								<span className="truncate">Temporada encerrada</span>
							</span>
						) : (
							`${suggestionsCreatedInSeason}/5 sugestões nesta temporada`
						)}
					</p>
				</div>

				{/* Controls - Stack on mobile, row on desktop */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
					<Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
						<SelectTrigger className="w-full sm:w-[180px]">
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

					{canCreateMore && !isCreating && !editingId && (
						<Button 
							onClick={() => setIsCreating(true)} 
							className="gap-2 w-full sm:w-auto"
						>
							<Plus className="w-4 h-4" />
							<span>Nova Sugestão</span>
						</Button>
					)}
				</div>
			</div>

			{/* Create/Edit Form */}
			{(isCreating || editingId) && !isReadOnly() && (
				<Card className="border-2 border-primary">
					<CardHeader className="pb-3 sm:pb-4">
						<CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
							<Lightbulb className="w-5 h-5 shrink-0" />
							{editingId ? "Editar Sugestão" : "Nova Sugestão"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">Título</Label>
								<Input
									id="title"
									{...register("title")}
									placeholder="Ex: Reforma da Piscina"
									maxLength={100}
									disabled={isSubmitting}
									className="text-base"
								/>
								{errors.title && (
									<p className="text-sm text-destructive">{errors.title.message}</p>
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
									className="text-base resize-none"
								/>
								{errors.description && (
									<p className="text-sm text-destructive">{errors.description.message}</p>
								)}
								<p className="text-xs sm:text-sm text-muted-foreground text-right">
									{description?.length || 0}/1000
								</p>
							</div>
							<div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancel}
									disabled={isSubmitting}
									className="w-full sm:w-auto"
								>
									Cancelar
								</Button>
								<Button 
									type="submit" 
									className="w-full sm:flex-1" 
									disabled={isSubmitting}
								>
									{isSubmitting ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Suggestions List */}
			<div className="grid gap-3 sm:gap-4">
				{filteredSuggestions.length === 0 ? (
					<Card>
						<CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
							<Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
							<p className="text-sm sm:text-base">
								{isReadOnly()
									? "Nenhuma sugestão nesta temporada."
									: "Você ainda não criou nenhuma sugestão."}
							</p>
							{!isReadOnly() && (
								<p className="text-xs sm:text-sm mt-2">
									Toque em "Nova Sugestão" para começar!
								</p>
							)}
						</CardContent>
					</Card>
				) : (
					filteredSuggestions.map((suggestion) => (
						<Card 
							key={suggestion._id} 
							className="mobile-card overflow-hidden"
						>
							<CardHeader className="pb-2 sm:pb-3">
								<div className="flex justify-between items-start gap-2">
									<CardTitle className="text-base sm:text-xl leading-tight flex-1 min-w-0">
										{suggestion.title}
									</CardTitle>
									{isReadOnly() ? (
										<Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
									) : (
										<div className="flex gap-1 sm:gap-2 shrink-0">
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleEdit(suggestion._id)}
												disabled={editingId !== null || isCreating}
												className="h-8 w-8 sm:h-9 sm:w-9"
											>
												<Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleDelete(suggestion._id)}
												disabled={editingId !== null || isCreating}
												className="h-8 w-8 sm:h-9 sm:w-9"
											>
												<Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
											</Button>
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<p className="text-sm sm:text-base text-muted-foreground line-clamp-4 sm:line-clamp-none">
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
