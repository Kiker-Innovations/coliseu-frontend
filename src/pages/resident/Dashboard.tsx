import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, TrendingUp } from "lucide-react";
import DashboardSkeleton from "@/skeleton/resident/DashboardSkeleton";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2025-10");

  useEffect(() => {
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
    condominiumFund: 40000,
    recurringExpenses: [
      { name: "Manutenção Predial", value: 3200 },
      { name: "Limpeza", value: 2800 },
      { name: "Segurança", value: 4500 },
      { name: "Energia Elétrica", value: 1800 },
      { name: "Água", value: 1200 },
    ],
    oneTimeExpenses: [
      { name: "Reparo do Portão Principal", value: 850 },
      { name: "Compra de Materiais de Limpeza", value: 450 },
    ],
    approvedSuggestions: [
      { name: "Reforma da Piscina", total: 15000, installments: 10, paid: 3 },
      { name: "Nova Churrasqueira", total: 8000, installments: 8, paid: 2 },
      { name: "Academia", total: 12000, installments: 12, paid: 1 },
    ],
  };

  // Cálculos
  const totalRecurringExpenses = financialData.recurringExpenses.reduce(
    (sum, exp) => sum + exp.value,
    0
  );

  const totalOneTimeExpenses = financialData.oneTimeExpenses.reduce(
    (sum, exp) => sum + exp.value,
    0
  );

  const totalSuggestionsMonthly = financialData.approvedSuggestions.reduce(
    (sum, s) => sum + s.total / s.installments,
    0
  );

  const totalMonthlyExpenses =
    totalRecurringExpenses + totalOneTimeExpenses + totalSuggestionsMonthly;

  const totalSuggestionsRemaining = financialData.approvedSuggestions.reduce(
    (sum, s) => sum + s.total,
    0
  );

  const monthlyBalance = financialData.condominiumFund - totalMonthlyExpenses;
  const isPositiveMonthlyBalance = monthlyBalance >= 0;

  const availableMonths = [
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-07", label: "Julho 2025" },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Principal</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      {/* Rankings and Financial Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Caixa do Condomínio
              </p>
              <p className="text-2xl font-bold text-primary">
                R$ {financialData.condominiumFund.toLocaleString("pt-BR")}
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
                <p className="text-xs text-muted-foreground">
                  Sugestões Aprovadas (Parcela Mensal)
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-500">
                  R${" "}
                  {totalSuggestionsMonthly.toLocaleString("pt-BR", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div className="p-4 bg-amber-500/10 rounded-lg border-2 border-amber-500/50">
                <p className="text-sm text-muted-foreground">
                  Total de Despesas do Mês
                </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Caixa - Despesas Mensais
              </p>
            </div>

            {/* Sugestões em Andamento */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Sugestões em Andamento</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {financialData.approvedSuggestions.map((suggestion) => {
                  const monthlyValue =
                    suggestion.total / suggestion.installments;
                  return (
                    <div
                      key={suggestion.name}
                      className="p-3 bg-muted/50 rounded-md"
                    >
                      <p className="font-medium text-sm mb-1">
                        {suggestion.name}
                      </p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                          Parcela: {suggestion.paid}/{suggestion.installments}
                        </span>
                        <div className="text-right">
                          <p className="font-bold text-blue-600 dark:text-blue-500">
                            R${" "}
                            {monthlyValue.toLocaleString("pt-BR", {
                              maximumFractionDigits: 0,
                            })}
                            /mês
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            Total: R$ {suggestion.total.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
