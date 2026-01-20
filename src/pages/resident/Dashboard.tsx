import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp } from "lucide-react";
import DashboardSkeleton from "@/skeleton/resident/DashboardSkeleton";
import { toast } from "sonner";
import { financialService, NetworkError, type FinancialSummary, type ProjectExpense } from "@/services/api";
import { NetworkErrorState } from "@/components/network/NetworkErrorState";
import { usePageRefresh } from "@/hooks/use-page-refresh";

export default function Dashboard() {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState<Error | null>(null);
	const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
	const [projectsProgress, setProjectsProgress] = useState<ProjectExpense[]>([]);

	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			setNetworkError(null);

			// First check if month changed
			await financialService.checkMonth();

			// Then load data
			const [summaryResponse, projectsResponse] = await Promise.all([
				financialService.getSummary(),
				financialService.getProjectsProgress(),
			]);

			if (summaryResponse.success && summaryResponse.data) {
				setFinancialSummary(summaryResponse.data);
			}

			if (projectsResponse.success && projectsResponse.data) {
				setProjectsProgress(projectsResponse.data);
			}
		} catch (error: unknown) {
			if (error instanceof NetworkError) {
				setNetworkError(error);
			} else if (error instanceof Error) {
				toast.error(error.message || "Erro ao carregar dados");
			}
			console.error("Erro ao carregar dados:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Register refresh function for pull-to-refresh
	usePageRefresh({ onRefresh: loadData });

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Cálculos
	const totalRecurringExpenses = financialSummary?.totalRecurringExpenses || 0;
	const totalOneTimeExpenses = financialSummary?.totalOneTimeExpenses || 0;
	const totalProjectExpenses = financialSummary?.totalProjectExpenses || 0;
	const totalMonthlyExpenses = financialSummary?.totalExpenses || 0;
	const monthlyBalance = financialSummary?.monthlyBalance || 0;
	const isPositiveMonthlyBalance = monthlyBalance >= 0;
	const condominiumFund =
		(financialSummary?.previousBalance || 0) + (financialSummary?.condominiumFund || 0);

	// Top 3 projetos por progresso
	const topProjects = [...projectsProgress]
		.sort((a, b) => {
			const progressA = (a.paidInstallments / a.installmentsCount) * 100;
			const progressB = (b.paidInstallments / b.installmentsCount) * 100;
			return progressB - progressA;
		})
		.slice(0, 3);

	// Top 10 projetos
	const rankingProjects = [...projectsProgress]
		.sort((a, b) => {
			const progressA = (a.paidInstallments / a.installmentsCount) * 100;
			const progressB = (b.paidInstallments / b.installmentsCount) * 100;
			return progressB - progressA;
		})
		.slice(0, 10);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (networkError) {
		return (
			<div className="space-y-4 sm:space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl sm:text-3xl font-bold">Painel Principal</h1>
				</div>
				<NetworkErrorState error={networkError} onRetry={loadData} />
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl sm:text-3xl font-bold">Painel Principal</h1>
			</div>

			{/* Top 3 Podium */}
			<Card>
				<CardHeader className="pb-3 sm:pb-4">
					<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
						<Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-accent shrink-0" />
						<span className="truncate">Pódio - Top 3 Projetos</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{topProjects.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
							{topProjects.map((project, index) => {
								const progress = (project.paidInstallments / project.installmentsCount) * 100;
								return (
									<div
										key={project.projectId}
										className={`p-4 sm:p-6 rounded-lg text-center transition-all mobile-card ${
											index === 0
												? "bg-accent text-accent-foreground sm:transform sm:scale-105"
												: index === 1
													? "bg-secondary text-secondary-foreground"
													: "bg-muted text-muted-foreground"
										}`}
									>
										<div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">
											{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
										</div>
										<h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2 line-clamp-2">
											{project.projectTitle}
										</h3>
										<p className="text-xl sm:text-2xl font-bold">{progress.toFixed(0)}%</p>
										<p className="text-xs sm:text-sm mt-1">
											{project.paidInstallments}/{project.installmentsCount} parcelas
										</p>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center min-h-24 sm:min-h-32 text-center py-4">
							<Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mb-3 sm:mb-4" />
							<p className="text-sm sm:text-base text-muted-foreground mb-1 sm:mb-2">
								Nenhum projeto no pódio
							</p>
							<p className="text-xs sm:text-sm text-muted-foreground">
								Projetos com maior progresso aparecerão aqui.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Rankings and Financial Info */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Projects Ranking */}
				<Card>
					<CardHeader className="pb-3 sm:pb-4">
						<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
							<TrendingUp className="w-5 h-5 shrink-0" />
							<span className="truncate">Ranking dos Projetos</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						{rankingProjects.length > 0 ? (
							<div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto mobile-scroll">
								{rankingProjects.map((project, index) => {
									const progress = (project.paidInstallments / project.installmentsCount) * 100;
									return (
										<div
											key={project.projectId}
											className="p-2.5 sm:p-3 rounded-md bg-muted/50 active:bg-muted transition-colors"
										>
											<div className="flex justify-between items-center mb-1.5 sm:mb-2 gap-2">
												<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
													<span className="font-bold text-muted-foreground w-5 sm:w-6 shrink-0 text-sm sm:text-base">
														{index + 1}º
													</span>
													<span className="font-medium text-sm sm:text-base truncate">
														{project.projectTitle}
													</span>
												</div>
												<span className="font-bold text-primary text-sm sm:text-base shrink-0">
													{progress.toFixed(0)}%
												</span>
											</div>
											<Progress value={progress} className="h-1.5 sm:h-2" />
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center min-h-24 sm:min-h-32 text-center py-4">
								<TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mb-3 sm:mb-4" />
								<p className="text-sm sm:text-base text-muted-foreground mb-1 sm:mb-2">
									Nenhum projeto no ranking
								</p>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Projetos aparecerão quando aprovados.
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Financial Information */}
				<Card>
					<CardHeader className="pb-3 sm:pb-4">
						<CardTitle className="text-base sm:text-lg">Informações Financeiras</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 sm:space-y-4">
						<div className="p-3 sm:p-4 bg-primary/10 rounded-lg">
							<p className="text-xs sm:text-sm text-muted-foreground">Caixa do Condomínio</p>
							<p className="text-xl sm:text-2xl font-bold text-primary">
								R$ {condominiumFund.toLocaleString("pt-BR")}
							</p>
						</div>

						{/* Despesas do Mês */}
						<div className="space-y-2">
							<h4 className="font-semibold text-xs sm:text-sm">Despesas do Mês</h4>

							<div className="grid grid-cols-2 gap-2">
								<div className="p-2.5 sm:p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
									<p className="text-[10px] sm:text-xs text-muted-foreground">Recorrentes</p>
									<p className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-500">
										R$ {totalRecurringExpenses.toLocaleString("pt-BR")}
									</p>
								</div>

								<div className="p-2.5 sm:p-3 bg-pink-500/5 border border-pink-500/20 rounded-lg">
									<p className="text-[10px] sm:text-xs text-muted-foreground">Avulsas</p>
									<p className="text-base sm:text-lg font-bold text-pink-600 dark:text-pink-500">
										R$ {totalOneTimeExpenses.toLocaleString("pt-BR")}
									</p>
								</div>
							</div>

							<div className="p-2.5 sm:p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
								<p className="text-[10px] sm:text-xs text-muted-foreground">
									Projetos Aprovados (Parcela Mensal)
								</p>
								<p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-500">
									R${" "}
									{totalProjectExpenses.toLocaleString("pt-BR", {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>

							<div className="p-3 sm:p-4 bg-amber-500/10 rounded-lg border-2 border-amber-500/50">
								<p className="text-xs sm:text-sm text-muted-foreground">Total de Despesas</p>
								<p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-500">
									R${" "}
									{totalMonthlyExpenses.toLocaleString("pt-BR", {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>
						</div>

						{/* Saldo do Mês */}
						<div
							className={`p-3 sm:p-4 rounded-lg border-2 ${
								isPositiveMonthlyBalance
									? "bg-green-500/10 border-green-500/50"
									: "bg-red-500/10 border-red-500/50"
							}`}
						>
							<p className="text-xs sm:text-sm text-muted-foreground">Saldo do Mês</p>
							<p
								className={`text-xl sm:text-2xl font-bold ${
									isPositiveMonthlyBalance
										? "text-green-600 dark:text-green-500"
										: "text-red-600 dark:text-red-500"
								}`}
							>
								R${" "}
								{monthlyBalance.toLocaleString("pt-BR", {
									maximumFractionDigits: 0,
								})}
							</p>
							<p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
								Caixa - Despesas Mensais
							</p>
						</div>

						{/* Projetos em Andamento */}
						{projectsProgress.length > 0 && (
							<div className="space-y-2">
								<h4 className="font-semibold text-xs sm:text-sm">Projetos em Andamento</h4>
								<div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto mobile-scroll">
									{projectsProgress.map((project) => {
										const remainingValue =
											project.totalValue - project.paidInstallments * project.monthlyValue;
										return (
											<div 
												key={project.projectId} 
												className="p-2.5 sm:p-3 bg-muted/50 rounded-md"
											>
												<p className="font-medium text-xs sm:text-sm mb-1 truncate">
													{project.projectTitle}
												</p>
												<div className="flex justify-between items-center text-[10px] sm:text-xs gap-2">
													<span className="text-muted-foreground shrink-0">
														Parcela: {project.paidInstallments}/{project.installmentsCount}
													</span>
													<div className="text-right min-w-0">
														<p className="font-bold text-blue-600 dark:text-blue-500">
															R${" "}
															{project.monthlyValue.toLocaleString("pt-BR", {
																maximumFractionDigits: 0,
															})}
															/mês
														</p>
														<p className="text-muted-foreground truncate">
															Restante: R$ {remainingValue.toLocaleString("pt-BR")}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
