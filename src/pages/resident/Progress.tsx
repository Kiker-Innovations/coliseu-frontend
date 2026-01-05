import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressSkeleton from "@/skeleton/resident/ProgressSkeleton";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  financialService,
  type FinancialSummary,
  type ProjectExpense,
} from "@/services/api";

export default function Progress() {
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

  const calculateProgress = (paid: number, total: number) => {
    return (paid / total) * 100;
  };

  const calculateRemaining = (
    totalValue: number,
    paidInstallments: number,
    monthlyValue: number
  ) => {
    return totalValue - monthlyValue * paidInstallments;
  };

  // Cálculos do orçamento
  const condominiumFund =
    (financialSummary?.previousBalance || 0) +
    (financialSummary?.condominiumFund || 0);

  if (isLoading) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Acompanhamento de Progresso</h1>
        <p className="text-muted-foreground mt-1">
          Visualize o andamento dos projetos aprovados
        </p>
      </div>

      {/* Progress Cards */}
      {projectsProgress.length > 0 ? (
        <div className="grid gap-6">
          {projectsProgress.map((project) => {
            const progress = calculateProgress(
              project.paidInstallments,
              project.installmentsCount
            );
            const remainingValue = calculateRemaining(
              project.totalValue,
              project.paidInstallments,
              project.monthlyValue
            );
            const budgetRemaining = condominiumFund - project.monthlyValue;

            return (
              <Card key={project.projectId} className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      {project.projectTitle}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {progress.toFixed(0)}%
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Company Info */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{project.companyName}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progresso</span>
                      <span>
                        {project.paidInstallments} de{" "}
                        {project.installmentsCount} parcelas pagas
                      </span>
                    </div>
                    <ProgressBar value={progress} className="h-3" />
                  </div>

                  {/* Financial Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Valor Total
                      </p>
                      <p className="text-2xl font-bold">
                        R$ {project.totalValue.toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Parcelas
                      </p>
                      <p className="text-2xl font-bold">
                        {project.paidInstallments}/{project.installmentsCount}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Pagamento Mensal
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        R${" "}
                        {project.monthlyValue.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>

                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm text-muted-foreground mb-1">
                        Valor Restante
                      </p>
                      <p className="text-2xl font-bold text-accent">
                        R${" "}
                        {remainingValue.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Budget Information */}
                  <div className="p-4 bg-card border-2 border-border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Caixa do Condomínio
                        </p>
                        <p className="text-xl font-bold">
                          R$ {condominiumFund.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Após esta parcela
                        </p>
                        <p
                          className={`text-xl font-bold ${
                            budgetRemaining >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          R$ {budgetRemaining.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhum projeto em andamento no momento
            </p>
            <p className="text-sm text-muted-foreground">
              Quando projetos forem aprovados, você poderá acompanhar o
              progresso aqui.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      {projectsProgress.length > 0 && (
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Projetos em Andamento
                </p>
                <p className="text-3xl font-bold text-primary">
                  {projectsProgress.length}
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Investido
                </p>
                <p className="text-3xl font-bold text-accent">
                  R${" "}
                  {projectsProgress
                    .reduce((sum, p) => sum + p.totalValue, 0)
                    .toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Progresso Médio
                </p>
                <p className="text-3xl font-bold text-primary">
                  {projectsProgress.length > 0
                    ? (
                        projectsProgress.reduce(
                          (sum, p) =>
                            sum +
                            calculateProgress(
                              p.paidInstallments,
                              p.installmentsCount
                            ),
                          0
                        ) / projectsProgress.length
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
