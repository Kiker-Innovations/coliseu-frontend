import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp } from "lucide-react";
import DashboardSkeleton from "@/skeleton/resident/DashboardSkeleton";
import { toast } from "sonner";
import { financialService, type FinancialSummary, type ProjectExpense } from "@/services/api";

export default function Dashboard() {
	const [isLoading, setIsLoading] = useState(true);
	const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
	const [projectsProgress, setProjectsProgress] = useState<ProjectExpense[]>([]);

	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);

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
		} catch (error: any) {
			toast.error(error.message || "Erro ao carregar dados");
			console.error("Erro ao carregar dados:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

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

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Painel Principal</h1>
			</div>

			{/* Top 3 Podium */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trophy className="w-6 h-6 text-accent" />
						Pódio - Top 3 Projetos em Andamento
					</CardTitle>
				</CardHeader>
				<CardContent>
					{topProjects.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{topProjects.map((project, index) => {
								const progress = (project.paidInstallments / project.installmentsCount) * 100;
								return (
									<div
										key={project.projectId}
										className={`p-6 rounded-lg text-center transition-all ${
											index === 0
												? "bg-accent text-accent-foreground transform scale-105"
												: index === 1
													? "bg-secondary text-secondary-foreground"
													: "bg-muted text-muted-foreground"
										}`}
									>
										<div className="text-4xl font-bold mb-2">
											{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
										</div>
										<h3 className="font-semibold text-lg mb-2">{project.projectTitle}</h3>
										<p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
										<p className="text-sm mt-1">
											{project.paidInstallments}/{project.installmentsCount} parcelas
										</p>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center min-h-32 text-center">
							<Trophy className="w-12 h-12 text-muted-foreground/50 mb-4" />
							<p className="text-muted-foreground mb-2">Nenhum projeto no pódio no momento</p>
							<p className="text-sm text-muted-foreground">
								Os projetos com maior progresso aparecerão aqui.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Rankings and Financial Info */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Projects Ranking */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="w-5 h-5" />
							Ranking dos Projetos em Andamento
						</CardTitle>
					</CardHeader>
					<CardContent>
						{rankingProjects.length > 0 ? (
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{rankingProjects.map((project, index) => {
									const progress = (project.paidInstallments / project.installmentsCount) * 100;
									return (
										<div
											key={project.projectId}
											className="p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
										>
											<div className="flex justify-between items-center mb-2">
												<div className="flex items-center gap-3">
													<span className="font-bold text-muted-foreground w-6">{index + 1}º</span>
													<span className="font-medium">{project.projectTitle}</span>
												</div>
												<span className="font-bold text-primary">{progress.toFixed(0)}%</span>
											</div>
											<Progress value={progress} className="h-2" />
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center min-h-32 text-center">
								<TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground mb-2">Nenhum projeto no ranking no momento</p>
								<p className="text-sm text-muted-foreground">
									Projetos em andamento aparecerão no ranking assim que forem aprovados.
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Financial Information */}
				<Card>
					<CardHeader>
						<CardTitle>Informações Financeiras</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 bg-primary/10 rounded-lg">
							<p className="text-sm text-muted-foreground">Caixa do Condomínio</p>
							<p className="text-2xl font-bold text-primary">
								R$ {condominiumFund.toLocaleString("pt-BR")}
							</p>
						</div>

						{/* Despesas do Mês */}
						<div className="space-y-2">
							<h4 className="font-semibold text-sm">Despesas do Mês</h4>

							<div className="grid grid-cols-2 gap-2">
								<div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
									<p className="text-xs text-muted-foreground">Recorrentes</p>
									<p className="text-lg font-bold text-orange-600 dark:text-orange-500">
										R$ {totalRecurringExpenses.toLocaleString("pt-BR")}
									</p>
								</div>

								<div className="p-3 bg-pink-500/5 border border-pink-500/20 rounded-lg">
									<p className="text-xs text-muted-foreground">Avulsas</p>
									<p className="text-lg font-bold text-pink-600 dark:text-pink-500">
										R$ {totalOneTimeExpenses.toLocaleString("pt-BR")}
									</p>
								</div>
							</div>

							<div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
								<p className="text-xs text-muted-foreground">Projetos Aprovados (Parcela Mensal)</p>
								<p className="text-lg font-bold text-blue-600 dark:text-blue-500">
									R${" "}
									{totalProjectExpenses.toLocaleString("pt-BR", {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>

							<div className="p-4 bg-amber-500/10 rounded-lg border-2 border-amber-500/50">
								<p className="text-sm text-muted-foreground">Total de Despesas do Mês</p>
								<p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
									R${" "}
									{totalMonthlyExpenses.toLocaleString("pt-BR", {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>
						</div>

						{/* Saldo do Mês */}
						<div
							className={`p-4 rounded-lg border-2 ${
								isPositiveMonthlyBalance
									? "bg-green-500/10 border-green-500/50"
									: "bg-red-500/10 border-red-500/50"
							}`}
						>
							<p className="text-sm text-muted-foreground">Saldo do Mês</p>
							<p
								className={`text-2xl font-bold ${
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
							<p className="text-xs text-muted-foreground mt-1">Caixa - Despesas Mensais</p>
						</div>

						{/* Projetos em Andamento */}
						{projectsProgress.length > 0 ? (
							<div className="space-y-2">
								<h4 className="font-semibold text-sm">Projetos em Andamento</h4>
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{projectsProgress.map((project) => {
										const remainingValue =
											project.totalValue - project.paidInstallments * project.monthlyValue;
										return (
											<div key={project.projectId} className="p-3 bg-muted/50 rounded-md">
												<p className="font-medium text-sm mb-1">{project.projectTitle}</p>
												<div className="flex justify-between items-center text-xs">
													<span className="text-muted-foreground">
														Parcela: {project.paidInstallments}/{project.installmentsCount}
													</span>
													<div className="text-right">
														<p className="font-bold text-blue-600 dark:text-blue-500">
															R${" "}
															{project.monthlyValue.toLocaleString("pt-BR", {
																maximumFractionDigits: 0,
															})}
															/mês
														</p>
														<p className="text-muted-foreground text-[10px]">
															Total restante: R$ {remainingValue.toLocaleString("pt-BR")}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						) : (
							<></>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
