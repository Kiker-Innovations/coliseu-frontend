import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, DollarSign, TrendingDown } from "lucide-react";
import DashboardSkeleton from "@/skeleton/admin/DashboardSkeleton";
import { toast } from "sonner";
import {
  financialService,
  type FinancialSummary,
  type ProjectExpense,
} from "@/services/api";

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);
  const [projectsProgress, setProjectsProgress] = useState<ProjectExpense[]>(
    []
  );

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
  const totalBudget =
    (financialSummary?.previousBalance || 0) +
    (financialSummary?.condominiumFund || 0);
  const monthlyPayment = financialSummary?.totalProjectExpenses || 0;
  const totalCommitted = projectsProgress.reduce(
    (sum, p) => sum + (p.totalValue - p.paidInstallments * p.monthlyValue),
    0
  );
  const remainingBudget = totalBudget - (financialSummary?.totalExpenses || 0);
  const budgetBalance = totalBudget - totalCommitted;
  const isPositiveBalance = budgetBalance >= 0;

  // Top projetos por progresso
  const topProjects = [...projectsProgress]
    .sort((a, b) => {
      const progressA = (a.paidInstallments / a.installmentsCount) * 100;
      const progressB = (b.paidInstallments / b.installmentsCount) * 100;
      return progressB - progressA;
    })
    .slice(0, 3);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      </div>

      {/* Financial Information - Main Focus */}
      <Card className="border-2 border-primary shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="w-8 h-8 text-primary" />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary">
              <p className="text-sm text-muted-foreground mb-2">
                Caixa Total do Condomínio
              </p>
              <p className="text-3xl font-bold text-primary">
                R$ {totalBudget.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Saldo anterior + Arrecadação do mês
              </p>
            </div>

            <div className="p-6 bg-accent/10 rounded-lg border-2 border-accent">
              <p className="text-sm text-muted-foreground mb-2">
                Caixa Restante (após despesas)
              </p>
              <p className="text-3xl font-bold text-accent">
                R${" "}
                {remainingBudget.toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div
              className={`p-6 rounded-lg border-2 ${
                isPositiveBalance
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-red-500/10 border-red-500/50"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-2">
                Total Comprometido (Projetos)
              </p>
              <p
                className={`text-3xl font-bold ${
                  isPositiveBalance
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                R$ {totalCommitted.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {projectsProgress.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-semibold text-lg">Projetos em Andamento</h4>
              </div>
              {projectsProgress.map((project) => {
                const progressPercentage =
                  (project.paidInstallments / project.installmentsCount) * 100;
                const remainingInstallments =
                  project.installmentsCount - project.paidInstallments;
                const remainingValue =
                  project.totalValue -
                  project.paidInstallments * project.monthlyValue;

                return (
                  <div
                    key={project.projectId}
                    className="p-4 border-2 border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <p className="font-medium mb-3 text-lg">
                      {project.projectTitle}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.companyName}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-bold text-base">
                          R$ {project.totalValue.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Parcela Mensal</p>
                        <p className="font-bold text-base">
                          R${" "}
                          {project.monthlyValue.toLocaleString("pt-BR", {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progresso</p>
                        <p className="font-bold text-base">
                          {project.paidInstallments}/{project.installmentsCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Restante</p>
                        <p className="font-bold text-base text-destructive">
                          R$ {remainingValue.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {projectsProgress.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum projeto em andamento no momento</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">
                Despesas Mensais Total
              </span>
              <span className="text-2xl font-bold text-primary">
                R${" "}
                {(financialSummary?.totalExpenses || 0).toLocaleString(
                  "pt-BR",
                  {
                    maximumFractionDigits: 0,
                  }
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Projects Progress */}
      {topProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent" />
              Top 3 Projetos - Maior Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topProjects.map((project, index) => {
                const progress =
                  (project.paidInstallments / project.installmentsCount) * 100;
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
                    <h3 className="font-semibold text-lg mb-2">
                      {project.projectTitle}
                    </h3>
                    <p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
                    <p className="text-sm mt-1">
                      {project.paidInstallments}/{project.installmentsCount}{" "}
                      parcelas
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Projects Progress */}
      {projectsProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progresso de Todos os Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectsProgress.map((project) => {
                const progress =
                  (project.paidInstallments / project.installmentsCount) * 100;
                return (
                  <div key={project.projectId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {project.projectTitle}
                      </span>
                      <span className="font-bold text-primary">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{project.companyName}</span>
                      <span>
                        {project.paidInstallments}/{project.installmentsCount}{" "}
                        parcelas
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
