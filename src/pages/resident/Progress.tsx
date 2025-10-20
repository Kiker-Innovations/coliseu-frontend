import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressSkeleton from "@/skeleton/resident/ProgressSkeleton";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { TrendingUp, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

export default function Progress() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Mock data
  const approvedSuggestions = [
    {
      id: 1,
      title: "Reforma da Piscina",
      totalValue: 15000,
      installments: 10,
      paidInstallments: 3,
      monthlyBudget: 50000,
    },
    {
      id: 2,
      title: "Nova Área de Churrasqueira",
      totalValue: 8000,
      installments: 8,
      paidInstallments: 2,
      monthlyBudget: 50000,
    },
    {
      id: 3,
      title: "Academia ao Ar Livre",
      totalValue: 12000,
      installments: 12,
      paidInstallments: 1,
      monthlyBudget: 50000,
    },
  ];

  const calculateProgress = (paid: number, total: number) => {
    return (paid / total) * 100;
  };

  const calculateMonthlyPayment = (total: number, installments: number) => {
    return total / installments;
  };

  const calculateRemaining = (
    total: number,
    paid: number,
    installments: number
  ) => {
    const monthlyPayment = total / installments;
    return total - monthlyPayment * paid;
  };

  if (isLoading) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Acompanhamento de Progresso</h1>
        <p className="text-muted-foreground mt-1">
          Visualize o andamento das sugestões aprovadas
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid gap-6">
        {approvedSuggestions.map((suggestion) => {
          const progress = calculateProgress(
            suggestion.paidInstallments,
            suggestion.installments
          );
          const monthlyPayment = calculateMonthlyPayment(
            suggestion.totalValue,
            suggestion.installments
          );
          const remainingValue = calculateRemaining(
            suggestion.totalValue,
            suggestion.paidInstallments,
            suggestion.installments
          );
          const budgetRemaining = suggestion.monthlyBudget - monthlyPayment;

          return (
            <Card key={suggestion.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {suggestion.title}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {progress.toFixed(0)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progresso</span>
                    <span>
                      {suggestion.paidInstallments} de {suggestion.installments}{" "}
                      parcelas pagas
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
                      R$ {suggestion.totalValue.toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Parcelas
                    </p>
                    <p className="text-2xl font-bold">
                      {suggestion.paidInstallments}/{suggestion.installments}
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
                      {monthlyPayment.toLocaleString("pt-BR", {
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
                        Budget Mensal
                      </p>
                      <p className="text-xl font-bold">
                        R$ {suggestion.monthlyBudget.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Budget Restante
                      </p>
                      <p className="text-xl font-bold text-accent">
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

      {/* Summary Card */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Sugestões em Andamento
              </p>
              <p className="text-3xl font-bold text-primary">
                {approvedSuggestions.length}
              </p>
            </div>
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Total Investido
              </p>
              <p className="text-3xl font-bold text-accent">
                R${" "}
                {approvedSuggestions
                  .reduce((sum, s) => sum + s.totalValue, 0)
                  .toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Progresso Médio
              </p>
              <p className="text-3xl font-bold text-primary">
                {(
                  approvedSuggestions.reduce(
                    (sum, s) =>
                      sum +
                      calculateProgress(s.paidInstallments, s.installments),
                    0
                  ) / approvedSuggestions.length
                ).toFixed(0)}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
