import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, DollarSign, TrendingDown } from "lucide-react";
import DashboardSkeleton from "@/skeleton/admin/DashboardSkeleton";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento de dados
    const loadData = async () => {
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Mock data - will be replaced with real data later
  const topSuggestions = [
    { id: 1, title: "Reforma da Piscina", votes: 45 },
    { id: 2, title: "Nova Área de Churrasqueira", votes: 38 },
    { id: 3, title: "Academia ao Ar Livre", votes: 32 },
  ];

  const rankingSuggestions = [
    { id: 1, title: "Reforma da Piscina", votes: 45 },
    { id: 2, title: "Nova Área de Churrasqueira", votes: 38 },
    { id: 3, title: "Academia ao Ar Livre", votes: 32 },
    { id: 4, title: "Pintura da Fachada", votes: 28 },
    { id: 5, title: "Playground Infantil", votes: 25 },
    { id: 6, title: "Iluminação LED", votes: 22 },
    { id: 7, title: "Sistema de Segurança", votes: 19 },
    { id: 8, title: "Jardim Vertical", votes: 16 },
    { id: 9, title: "Salão de Festas", votes: 14 },
    { id: 10, title: "Garagem Coberta", votes: 12 },
  ];

  const financialData = {
    totalBudget: 50000,
    approvedSuggestions: [
      { name: "Reforma da Piscina", total: 15000, installments: 10, paid: 3 },
      { name: "Nova Churrasqueira", total: 8000, installments: 8, paid: 2 },
      { name: "Academia", total: 12000, installments: 12, paid: 1 },
    ],
  };

  const monthlyPayment = financialData.approvedSuggestions.reduce(
    (sum, s) => sum + s.total / s.installments,
    0
  );
  const totalCommitted = financialData.approvedSuggestions.reduce(
    (sum, s) => sum + s.total,
    0
  );
  const remainingBudget = financialData.totalBudget - monthlyPayment;
  const budgetBalance = financialData.totalBudget - totalCommitted;
  const isPositiveBalance = budgetBalance >= 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <select className="px-4 py-2 border border-border rounded-md bg-card">
          <option>Outubro 2025</option>
          <option>Setembro 2025</option>
        </select>
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
                R$ {financialData.totalBudget.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="p-6 bg-accent/10 rounded-lg border-2 border-accent">
              <p className="text-sm text-muted-foreground mb-2">
                Caixa Restante (após parcelas)
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
                Total Comprometido
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

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-semibold text-lg">Sugestões Aprovadas</h4>
            </div>
            {financialData.approvedSuggestions.map((suggestion) => {
              const monthlyValue = suggestion.total / suggestion.installments;
              const remainingInstallments =
                suggestion.installments - suggestion.paid;
              const progressPercentage =
                (suggestion.paid / suggestion.installments) * 100;

              return (
                <div
                  key={suggestion.name}
                  className="p-4 border-2 border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <p className="font-medium mb-3 text-lg">{suggestion.name}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-base">
                        R$ {suggestion.total.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parcela Mensal</p>
                      <p className="font-bold text-base">
                        R${" "}
                        {monthlyValue.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progresso</p>
                      <p className="font-bold text-base">
                        {suggestion.paid}/{suggestion.installments}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Parcelas Restantes
                      </p>
                      <p className="font-bold text-base text-destructive">
                        {remainingInstallments}
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

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">
                Pagamento Mensal Total
              </span>
              <span className="text-2xl font-bold text-primary">
                R${" "}
                {monthlyPayment.toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent" />
            Pódio do Mês - Top 3 Sugestões Mais Votadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
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
                  {suggestion.title}
                </h3>
                <p className="text-2xl font-bold">{suggestion.votes} votos</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ranking das 10 Principais Sugestões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {rankingSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="flex justify-between items-center p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground w-6">
                    {index + 1}º
                  </span>
                  <span className="font-medium">{suggestion.title}</span>
                </div>
                <span className="font-bold text-primary">
                  {suggestion.votes}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
