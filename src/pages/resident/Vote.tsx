import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoteSkeleton from "@/skeleton/resident/VoteSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Vote as VoteIcon,
	CheckCircle2,
	Plus,
	Minus,
	RotateCcw,
	Users,
	Clock,
	Calendar,
	Trophy,
	Lightbulb,
	AlertTriangle,
	Hash,
	RefreshCw,
	Building2,
	DollarSign,
	FolderKanban,
} from "lucide-react";
import { toast } from "sonner";
import {
	seasonService,
	projectSuggestionsService,
	projectService,
	isSeasonActive,
	isVotingActive,
	isVotingEnded,
	hasActiveOfferPoll,
	isOfferPollEnded,
	hasChosenOffer,
	type Season,
	type ProjectSuggestion,
	type MyVote,
	type Project,
	type FullProjectOffer,
} from "@/services/api";

const MAX_VOTES = 3;

// Interface for project with its offers
interface ProjectWithOffers {
	project: Project;
	offers: FullProjectOffer[];
	myVotedOfferId: string | null;
}

export default function Vote() {
	const [isLoading, setIsLoading] = useState(true);
	const [activeSeason, setActiveSeason] = useState<Season | null>(null);
	const [projectSuggestions, setProjectSuggestions] = useState<ProjectSuggestion[]>([]);
	const [myVotes, setMyVotes] = useState<MyVote[]>([]);
	const [votesDistribution, setVotesDistribution] = useState<{
		[key: string]: number;
	}>({});
	const [pendingChanges, setPendingChanges] = useState<{
		[key: string]: number;
	}>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Offer voting state
	const [projectsWithOffers, setProjectsWithOffers] = useState<ProjectWithOffers[]>([]);
	const [pendingOfferVotes, setPendingOfferVotes] = useState<{
		[projectId: string]: string | null;
	}>({});
	const [isVotingOffer, setIsVotingOffer] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setIsLoading(true);

			// First get seasons to find the active one
			const seasonsResponse = await seasonService.getSeasons();
			let active: Season | null = null;

			if (seasonsResponse.success && seasonsResponse.data) {
				active = seasonsResponse.data.find((s) => isSeasonActive(s)) || null;
				setActiveSeason(active);
			}

			if (active) {
				// Load suggestions, votes, and projects for the active season
				const [suggestionsResponse, myVotesResponse, projectsResponse] = await Promise.all([
					seasonService.getProjectSuggestions(active._id),
					projectSuggestionsService.getMyVotes(active._id),
					projectService.getProjects(),
				]);

				if (suggestionsResponse.success && suggestionsResponse.data) {
					setProjectSuggestions(suggestionsResponse.data);
				}

				if (myVotesResponse.success && myVotesResponse.data) {
					setMyVotes(myVotesResponse.data);

					const distribution: { [key: string]: number } = {};
					for (const vote of myVotesResponse.data) {
						distribution[vote.projectSuggestionId] = vote.voteCount;
					}
					setVotesDistribution(distribution);
					setPendingChanges(distribution);
				}

				// Load projects with active offer polls
				if (projectsResponse.success && projectsResponse.data) {
					const projectsWithActiveOffers = projectsResponse.data.filter(
						(p) => (hasActiveOfferPoll(p) || isOfferPollEnded(p)) && !hasChosenOffer(p),
					);

					// Load offers for each project
					const projectsWithOffersData: ProjectWithOffers[] = [];
					for (const project of projectsWithActiveOffers) {
						try {
							const [offersResponse, myVoteResponse] = await Promise.all([
								projectService.getProjectOffers(project._id),
								projectService.getMyOfferVote(project._id),
							]);

							if (offersResponse.success && offersResponse.data) {
								projectsWithOffersData.push({
									project,
									offers: offersResponse.data,
									myVotedOfferId: myVoteResponse.data?.offerId || null,
								});
							}
						} catch (err) {
							console.error(`Erro ao carregar ofertas do projeto ${project._id}:`, err);
						}
					}

					setProjectsWithOffers(projectsWithOffersData);

					// Initialize pending votes
					const pendingVotes: { [projectId: string]: string | null } = {};
					for (const pw of projectsWithOffersData) {
						pendingVotes[pw.project._id] = pw.myVotedOfferId;
					}
					setPendingOfferVotes(pendingVotes);
				}
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao carregar dados");
			console.error("Erro ao carregar dados:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const activeSuggestions = useMemo(
		() => projectSuggestions.filter((s) => isVotingActive(s)).sort((a, b) => a.rank - b.rank),
		[projectSuggestions],
	);

	const endedSuggestions = useMemo(
		() => projectSuggestions.filter((s) => isVotingEnded(s)).sort((a, b) => b.votes - a.votes),
		[projectSuggestions],
	);

	const pendingVotesUsed = useMemo(() => {
		return Object.values(pendingChanges).reduce((sum, count) => sum + count, 0);
	}, [pendingChanges]);

	const pendingVotesRemaining = MAX_VOTES - pendingVotesUsed;

	const hasChanges = useMemo(() => {
		const keys = new Set([...Object.keys(votesDistribution), ...Object.keys(pendingChanges)]);
		for (const key of keys) {
			if ((votesDistribution[key] || 0) !== (pendingChanges[key] || 0)) {
				return true;
			}
		}
		return false;
	}, [votesDistribution, pendingChanges]);

	const handleAddVote = (suggestionId: string) => {
		if (pendingVotesRemaining === 0) {
			toast.error("Você já utilizou todos os seus 3 votos!");
			return;
		}

		setPendingChanges((prev) => ({
			...prev,
			[suggestionId]: (prev[suggestionId] || 0) + 1,
		}));
	};

	const handleRemoveVote = (suggestionId: string) => {
		const currentVotes = pendingChanges[suggestionId] || 0;
		if (currentVotes === 0) return;

		setPendingChanges((prev) => ({
			...prev,
			[suggestionId]: currentVotes - 1,
		}));
	};

	const handleResetVotes = () => {
		setPendingChanges({ ...votesDistribution });
		toast.info("Alterações descartadas!");
	};

	const handleConfirmVotes = async () => {
		try {
			setIsSubmitting(true);

			const currentKeys = new Set([
				...Object.keys(votesDistribution),
				...Object.keys(pendingChanges),
			]);

			for (const suggestionId of currentKeys) {
				const oldCount = votesDistribution[suggestionId] || 0;
				const newCount = pendingChanges[suggestionId] || 0;

				if (oldCount !== newCount) {
					if (newCount === 0 && oldCount > 0) {
						await projectSuggestionsService.removeVote(suggestionId);
					} else if (newCount > 0) {
						await projectSuggestionsService.vote(suggestionId, newCount);
					}
				}
			}

			toast.success("Votos confirmados com sucesso!");
			setVotesDistribution({ ...pendingChanges });
			await loadData();
		} catch (error: any) {
			toast.error(error.message || "Erro ao confirmar votos");
			console.error("Erro ao confirmar votos:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getVotesForSuggestion = (id: string) => pendingChanges[id] || 0;

	// Offer voting handlers
	const handleSelectOffer = (projectId: string, offerId: string) => {
		setPendingOfferVotes((prev) => ({
			...prev,
			[projectId]: offerId,
		}));
	};

	const handleConfirmOfferVote = async (projectId: string) => {
		const selectedOfferId = pendingOfferVotes[projectId];
		if (!selectedOfferId) {
			toast.error("Selecione uma oferta para votar!");
			return;
		}

		try {
			setIsVotingOffer(true);

			const response = await projectService.voteOffer(selectedOfferId);

			if (response.success) {
				toast.success("Voto registrado com sucesso!");

				// Update local state
				setProjectsWithOffers((prev) =>
					prev.map((pw) => {
						if (pw.project._id === projectId) {
							// Update votes on offers
							const updatedOffers = pw.offers.map((offer) => {
								if (offer._id === selectedOfferId) {
									return { ...offer, votes: offer.votes + 1 };
								}
								if (offer._id === pw.myVotedOfferId && pw.myVotedOfferId !== selectedOfferId) {
									return { ...offer, votes: Math.max(0, offer.votes - 1) };
								}
								return offer;
							});

							return {
								...pw,
								offers: updatedOffers,
								myVotedOfferId: selectedOfferId,
							};
						}
						return pw;
					}),
				);
			} else {
				toast.error(response.message || "Erro ao registrar voto");
			}
		} catch (error: any) {
			toast.error(error.message || "Erro ao registrar voto");
			console.error("Erro ao votar:", error);
		} finally {
			setIsVotingOffer(false);
		}
	};

	const hasOfferChanges = (projectId: string) => {
		const projectData = projectsWithOffers.find((pw) => pw.project._id === projectId);
		if (!projectData) return false;
		return pendingOfferVotes[projectId] !== projectData.myVotedOfferId;
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
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
				return (
					<Badge variant="outline">
						<Trophy className="w-3 h-3 mr-1" />
						{rank}º Lugar
					</Badge>
				);
		}
	};

	const getVotingTimeRemaining = (endDate: string) => {
		const end = new Date(endDate);
		const now = new Date();
		const diff = end.getTime() - now.getTime();

		if (diff <= 0) return "Encerrada";

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) return `${days}d ${hours}h restantes`;
		if (hours > 0) return `${hours}h ${minutes}min restantes`;
		return `${minutes}min restantes`;
	};

	// Computed values for offer voting
	const projectsWithActiveOfferPoll = projectsWithOffers.filter((pw) =>
		hasActiveOfferPoll(pw.project),
	);
	const projectsWithEndedOfferPoll = projectsWithOffers.filter(
		(pw) => isOfferPollEnded(pw.project) && !hasChosenOffer(pw.project),
	);

	if (isLoading) {
		return <VoteSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Votações</h1>
					<p className="text-muted-foreground mt-1">
						Vote nas sugestões e ofertas de projetos do condomínio
					</p>
				</div>
			</div>

			<Tabs defaultValue="suggestions" className="space-y-6">
				<TabsList>
					<TabsTrigger value="suggestions">
						Sugestões de Projeto
						{activeSuggestions.length > 0 && (
							<Badge variant="secondary" className="ml-2">
								{activeSuggestions.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="offers">
						Ofertas de Projeto
						{projectsWithActiveOfferPoll.length > 0 && (
							<Badge variant="secondary" className="ml-2">
								{projectsWithActiveOfferPoll.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				{/* Suggestions Tab */}
				<TabsContent value="suggestions" className="space-y-6">
					{/* Voting Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Votos Restantes</p>
									<p className="text-4xl font-bold text-primary">{pendingVotesRemaining}</p>
									<Progress value={(pendingVotesUsed / MAX_VOTES) * 100} className="mt-2" />
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Votos Distribuídos</p>
									<p className="text-4xl font-bold text-accent">
										{pendingVotesUsed}/{MAX_VOTES}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Sugestões Disponíveis</p>
									<p className="text-4xl font-bold text-muted-foreground">
										{activeSuggestions.length}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Action Buttons */}
					{activeSuggestions.length > 0 && (
						<div className="flex gap-4">
							<Button
								onClick={handleConfirmVotes}
								disabled={!hasChanges || isSubmitting}
								className="flex-1 gap-2"
								size="lg"
							>
								{isSubmitting ? (
									<>
										<RefreshCw className="w-5 h-5 animate-spin" />
										Confirmando...
									</>
								) : (
									<>
										<CheckCircle2 className="w-5 h-5" />
										Confirmar Votos
									</>
								)}
							</Button>
							<Button
								onClick={handleResetVotes}
								disabled={!hasChanges || isSubmitting}
								variant="outline"
								size="lg"
								className="gap-2"
							>
								<RotateCcw className="w-5 h-5" />
								Descartar Alterações
							</Button>
						</div>
					)}

					{/* Info about voting */}
					{activeSuggestions.length > 0 && (
						<Card className="bg-primary/5 border-primary/20">
							<CardContent className="pt-6">
								<div className="flex items-start gap-4">
									<VoteIcon className="w-6 h-6 text-primary mt-1" />
									<div>
										<h3 className="font-semibold mb-1">Como funciona a votação</h3>
										<p className="text-sm text-muted-foreground">
											Você tem <strong>{MAX_VOTES} votos</strong> para distribuir entre as
											sugestões. Você pode colocar todos os votos em uma única sugestão ou
											distribuí-los livremente.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Active Voting Suggestions */}
					{activeSuggestions.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<Clock className="w-5 h-5 text-blue-500" />
								Votação em Andamento
							</h2>

							<div className="space-y-4">
								{activeSuggestions.map((suggestion) => {
									const userVotes = getVotesForSuggestion(suggestion._id);
									const hasVotes = userVotes > 0;

									return (
										<Card
											key={suggestion._id}
											className={
												hasVotes
													? "border-2 border-accent bg-accent/5"
													: "hover:border-primary/50 transition-colors"
											}
										>
											<CardHeader>
												<div className="flex justify-between items-start gap-4">
													<div className="flex-1">
														<CardTitle className="text-xl flex items-center gap-2">
															<Lightbulb className="w-5 h-5 text-primary" />
															{suggestion.title}
															{hasVotes && <CheckCircle2 className="w-5 h-5 text-accent" />}
														</CardTitle>
														<p className="text-sm text-muted-foreground mt-2">
															{suggestion.description}
														</p>
													</div>
													<div className="text-right space-y-2">
														{getRankBadge(suggestion.rank)}
														{suggestion.votingEndDate && (
															<p className="text-xs text-muted-foreground">
																{getVotingTimeRemaining(suggestion.votingEndDate)}
															</p>
														)}
													</div>
												</div>
											</CardHeader>
											<CardContent>
												<div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4" />
														<span>{suggestion.votes} votos totais</span>
													</div>
													<div className="flex items-center gap-1">
														<Hash className="w-4 h-4" />
														<span>{suggestion.duplicateCount} duplicatas</span>
													</div>
													{suggestion.votingStartDate && suggestion.votingEndDate && (
														<div className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															<span>
																{formatDateTime(suggestion.votingStartDate)} -{" "}
																{formatDateTime(suggestion.votingEndDate)}
															</span>
														</div>
													)}
												</div>

												<div className="flex items-center gap-4">
													<div className="flex items-center gap-2 flex-1">
														<Button
															onClick={() => handleRemoveVote(suggestion._id)}
															disabled={userVotes === 0 || isSubmitting}
															variant="outline"
															size="icon"
														>
															<Minus className="w-4 h-4" />
														</Button>
														<div className="flex-1 text-center">
															<p className="text-2xl font-bold text-accent">{userVotes}</p>
															<p className="text-xs text-muted-foreground">
																{userVotes === 1 ? "seu voto" : "seus votos"}
															</p>
														</div>
														<Button
															onClick={() => handleAddVote(suggestion._id)}
															disabled={
																pendingVotesRemaining === 0 ||
																userVotes >= MAX_VOTES ||
																isSubmitting
															}
															variant="outline"
															size="icon"
														>
															<Plus className="w-4 h-4" />
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					)}

					{/* Ended Voting Results */}
					{endedSuggestions.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<CheckCircle2 className="w-5 h-5 text-green-500" />
								Votações Encerradas
							</h2>

							<div className="space-y-4">
								{endedSuggestions.map((suggestion, index) => {
									const myVote = myVotes.find((v) => v.projectSuggestionId === suggestion._id);

									return (
										<Card key={suggestion._id} className="opacity-80">
											<CardHeader>
												<div className="flex justify-between items-start gap-4">
													<div className="flex-1">
														<CardTitle className="text-lg flex items-center gap-2">
															<Lightbulb className="w-5 h-5 text-muted-foreground" />
															{suggestion.title}
														</CardTitle>
														<p className="text-sm text-muted-foreground mt-1">
															{suggestion.description}
														</p>
													</div>
													{getRankBadge(index + 1)}
												</div>
											</CardHeader>
											<CardContent>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4 text-sm text-muted-foreground">
														<div className="flex items-center gap-1">
															<Users className="w-4 h-4" />
															<span>{suggestion.votes} votos totais</span>
														</div>
														{myVote && (
															<Badge variant="secondary">
																Você votou: {myVote.voteCount}{" "}
																{myVote.voteCount === 1 ? "voto" : "votos"}
															</Badge>
														)}
													</div>
													<Badge variant="outline" className="text-muted-foreground">
														Encerrada
													</Badge>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					)}

					{/* Empty State - No active season */}
					{!activeSeason && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center h-48 text-center">
								<VoteIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground mb-2">Nenhuma temporada ativa no momento</p>
								<p className="text-sm text-muted-foreground">
									Aguarde o administrador iniciar uma nova temporada.
								</p>
							</CardContent>
						</Card>
					)}

					{/* Empty State - No suggestions */}
					{activeSeason && activeSuggestions.length === 0 && endedSuggestions.length === 0 && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center h-48 text-center">
								<VoteIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground mb-2">Nenhuma votação disponível no momento</p>
								<p className="text-sm text-muted-foreground">
									Aguarde o administrador iniciar o período de votação para as sugestões de projeto.
								</p>
							</CardContent>
						</Card>
					)}

					{/* No Active Voting */}
					{activeSeason && activeSuggestions.length === 0 && endedSuggestions.length > 0 && (
						<Card className="bg-orange-500/5 border-orange-500/20">
							<CardContent className="pt-6">
								<div className="flex items-start gap-4">
									<AlertTriangle className="w-6 h-6 text-orange-500 mt-1" />
									<div>
										<h3 className="font-semibold mb-1">Nenhuma votação ativa no momento</h3>
										<p className="text-sm text-muted-foreground">
											Todas as votações da temporada atual já foram encerradas. Aguarde o
											administrador iniciar uma nova rodada de votações.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Offers Tab */}
				<TabsContent value="offers" className="space-y-6">
					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Votações Ativas</p>
									<p className="text-4xl font-bold text-blue-500">
										{projectsWithActiveOfferPoll.length}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Votações Encerradas</p>
									<p className="text-4xl font-bold text-green-600">
										{projectsWithEndedOfferPoll.length}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Total de Projetos</p>
									<p className="text-4xl font-bold text-muted-foreground">
										{projectsWithOffers.length}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Info about offer voting */}
					{projectsWithActiveOfferPoll.length > 0 && (
						<Card className="bg-primary/5 border-primary/20">
							<CardContent className="pt-6">
								<div className="flex items-start gap-4">
									<DollarSign className="w-6 h-6 text-primary mt-1" />
									<div>
										<h3 className="font-semibold mb-1">Como funciona a votação de ofertas</h3>
										<p className="text-sm text-muted-foreground">
											Cada apartamento tem direito a <strong>1 voto por projeto</strong>. Selecione
											a oferta que você considera melhor e confirme seu voto. A oferta mais votada
											será a escolhida para o projeto.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Active Offer Polls */}
					{projectsWithActiveOfferPoll.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<Clock className="w-5 h-5 text-blue-500" />
								Votações de Ofertas em Andamento
							</h2>

							<div className="space-y-6">
								{projectsWithActiveOfferPoll.map((pw) => {
									const selectedOfferId = pendingOfferVotes[pw.project._id];
									const hasChanges = hasOfferChanges(pw.project._id);

									return (
										<Card
											key={pw.project._id}
											className="border-2 border-blue-500/50 bg-blue-500/5"
										>
											<CardHeader>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<CardTitle className="flex items-center gap-2">
															<FolderKanban className="w-5 h-5 text-blue-600" />
															{pw.project.title}
															<Badge
																variant="outline"
																className="ml-2 text-blue-600 border-blue-600"
															>
																<Clock className="w-3 h-3 mr-1" />
																Votação ativa
															</Badge>
														</CardTitle>
														<p className="text-sm text-muted-foreground mt-2">
															{pw.project.description}
														</p>
													</div>
													{pw.project.rank && getRankBadge(pw.project.rank)}
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													{pw.project.offerStartDate && pw.project.offerEndDate && (
														<div className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															<span>
																{formatDateTime(pw.project.offerStartDate)} -{" "}
																{formatDateTime(pw.project.offerEndDate)}
															</span>
														</div>
													)}
												</div>

												{/* Offers List */}
												<div className="space-y-3">
													<p className="text-sm font-medium">
														Selecione a oferta que você deseja votar:
													</p>
													{pw.offers.map((offer) => {
														const isSelected = selectedOfferId === offer._id;
														const isMyVote = pw.myVotedOfferId === offer._id;

														return (
															<button
																type="button"
																key={offer._id}
																onClick={() => handleSelectOffer(pw.project._id, offer._id)}
																className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-left w-full ${
																	isSelected
																		? "border-primary bg-primary/10"
																		: "border-muted hover:border-primary/50"
																}`}
															>
																<div className="flex items-start justify-between">
																	<div className="flex-1">
																		<div className="flex items-center gap-2">
																			<Building2 className="w-4 h-4 text-muted-foreground" />
																			<span className="font-semibold">{offer.companyName}</span>
																			{isMyVote && (
																				<Badge variant="secondary" className="text-xs">
																					<CheckCircle2 className="w-3 h-3 mr-1" />
																					Seu voto
																				</Badge>
																			)}
																		</div>
																		<p className="text-sm text-muted-foreground mt-1">
																			{offer.description}
																		</p>
																		<div className="flex items-center gap-4 mt-2 text-sm">
																			<span className="font-medium text-green-600">
																				{formatCurrency(offer.totalValue)}
																			</span>
																			<span className="text-muted-foreground">
																				{offer.installmentsCount}x de{" "}
																				{formatCurrency(offer.totalValue / offer.installmentsCount)}
																			</span>
																		</div>
																	</div>
																	<div className="text-right">
																		<div className="flex items-center gap-1 text-sm text-muted-foreground">
																			<Users className="w-4 h-4" />
																			<span>{offer.votes} votos</span>
																		</div>
																		{isSelected && (
																			<CheckCircle2 className="w-6 h-6 text-primary mt-2" />
																		)}
																	</div>
																</div>
															</button>
														);
													})}
												</div>

												{/* Confirm Button */}
												<Button
													onClick={() => handleConfirmOfferVote(pw.project._id)}
													disabled={!hasChanges || isVotingOffer}
													className="w-full"
												>
													{isVotingOffer ? (
														<>
															<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
															Votando...
														</>
													) : (
														<>
															<CheckCircle2 className="w-4 h-4 mr-2" />
															Confirmar Voto
														</>
													)}
												</Button>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					)}

					{/* Ended Offer Polls */}
					{projectsWithEndedOfferPoll.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<CheckCircle2 className="w-5 h-5 text-green-500" />
								Votações Encerradas
							</h2>

							<div className="space-y-6">
								{projectsWithEndedOfferPoll.map((pw) => {
									// Sort offers by votes to show ranking
									const sortedOffers = [...pw.offers].sort((a, b) => b.votes - a.votes);
									const totalVotes = sortedOffers.reduce((sum, o) => sum + o.votes, 0);

									return (
										<Card key={pw.project._id} className="opacity-80">
											<CardHeader>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<CardTitle className="flex items-center gap-2">
															<FolderKanban className="w-5 h-5 text-muted-foreground" />
															{pw.project.title}
															<Badge variant="outline" className="text-muted-foreground">
																Encerrada
															</Badge>
														</CardTitle>
														<p className="text-sm text-muted-foreground mt-1">
															{pw.project.description}
														</p>
													</div>
													{pw.project.rank && getRankBadge(pw.project.rank)}
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												<div className="space-y-3">
													{sortedOffers.map((offer, index) => {
														const percentage =
															totalVotes > 0 ? Math.round((offer.votes / totalVotes) * 100) : 0;
														const isMyVote = pw.myVotedOfferId === offer._id;
														const isWinner = index === 0;

														return (
															<div
																key={offer._id}
																className={`p-4 rounded-lg border ${
																	isWinner ? "border-green-500/50 bg-green-500/5" : "border-muted"
																}`}
															>
																<div className="flex items-start justify-between mb-2">
																	<div className="flex items-center gap-2">
																		<Building2 className="w-4 h-4 text-muted-foreground" />
																		<span className="font-semibold">{offer.companyName}</span>
																		{isWinner && (
																			<Badge className="bg-green-500">
																				<Trophy className="w-3 h-3 mr-1" />
																				Mais votada
																			</Badge>
																		)}
																		{isMyVote && (
																			<Badge variant="secondary" className="text-xs">
																				Seu voto
																			</Badge>
																		)}
																	</div>
																	<span className="text-sm text-muted-foreground">
																		{offer.votes} votos ({percentage}%)
																	</span>
																</div>
																<Progress value={percentage} className="h-2" />
																<div className="flex items-center gap-4 mt-2 text-sm">
																	<span className="font-medium text-green-600">
																		{formatCurrency(offer.totalValue)}
																	</span>
																	<span className="text-muted-foreground">
																		{offer.installmentsCount}x de{" "}
																		{formatCurrency(offer.totalValue / offer.installmentsCount)}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					)}

					{/* Empty State - No active season */}
					{!activeSeason && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center h-48 text-center">
								<DollarSign className="w-12 h-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground mb-2">Nenhuma temporada ativa no momento</p>
								<p className="text-sm text-muted-foreground">
									Aguarde o administrador iniciar uma nova temporada.
								</p>
							</CardContent>
						</Card>
					)}

					{/* Empty State - No offer polls */}
					{activeSeason && projectsWithOffers.length === 0 && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center h-48 text-center">
								<DollarSign className="w-12 h-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground mb-2">Nenhuma votação de ofertas disponível</p>
								<p className="text-sm text-muted-foreground">
									Aguarde o administrador criar enquetes de ofertas para os projetos.
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
