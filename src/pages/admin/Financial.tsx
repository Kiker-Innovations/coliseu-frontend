import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank,
  Receipt,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  financialRegisterSchema,
  type FinancialRegisterSchema,
} from "@/schemas/admin/financial.schema";
import {
  recurringExpenseSchema,
  type RecurringExpenseSchema,
} from "@/schemas/admin/recurring-expense.schema";
import FinancialSkeleton from "@/skeleton/admin/FinancialSkeleton";

export default function Financial() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  const financialForm = useForm<FinancialRegisterSchema>({
    resolver: zodResolver(financialRegisterSchema),
    defaultValues: {
      condominiumFund: 0,
      referenceMonth: "",
    },
  });

  const expenseForm = useForm<RecurringExpenseSchema>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      name: "",
      value: 0,
      hasExpirationDate: false,
      expirationDate: "",
    },
  });

  const hasExpirationDate = expenseForm.watch("hasExpirationDate");

  // Mock data - em produção, buscar da API
  const financialData = {
    condominiumFund: 40000,
    referenceMonth: "2025-10",
    lastUpdate: "15/10/2025",
  };

  // Despesas recorrentes cadastradas
  const recurringExpenses = [
    {
      id: 1,
      name: "Manutenção Predial",
      value: 3200,
      hasExpirationDate: false,
      expirationDate: null,
    },
    {
      id: 2,
      name: "Limpeza",
      value: 2800,
      hasExpirationDate: false,
      expirationDate: null,
    },
    {
      id: 3,
      name: "Segurança",
      value: 4500,
      hasExpirationDate: false,
      expirationDate: null,
    },
    {
      id: 4,
      name: "Energia Elétrica",
      value: 1800,
      hasExpirationDate: true,
      expirationDate: "2025-12-31",
    },
    {
      id: 5,
      name: "Água",
      value: 1200,
      hasExpirationDate: true,
      expirationDate: "2025-12-31",
    },
  ];

  // Sugestões aprovadas com despesas
  const approvedSuggestions = [
    {
      id: 1,
      title: "Reforma da Piscina",
      monthlyExpense: 2500,
      totalRemaining: 15000,
      progress: 60,
    },
    {
      id: 2,
      title: "Troca de Elevadores",
      monthlyExpense: 4000,
      totalRemaining: 12000,
      progress: 30,
    },
    {
      id: 3,
      title: "Pintura da Fachada",
      monthlyExpense: 1600,
      totalRemaining: 8000,
      progress: 80,
    },
  ];

  // Cálculos
  const totalRecurringExpenses = recurringExpenses.reduce(
    (sum, exp) => sum + exp.value,
    0
  );

  const totalSuggestionsMonthlyExpense = approvedSuggestions.reduce(
    (sum, sug) => sum + sug.monthlyExpense,
    0
  );

  const totalSuggestionsRemaining = approvedSuggestions.reduce(
    (sum, sug) => sum + sug.totalRemaining,
    0
  );

  // Cálculos MENSAIS
  const totalMonthlyExpenses =
    totalRecurringExpenses + totalSuggestionsMonthlyExpense;
  const monthlyFund = financialData.condominiumFund - totalMonthlyExpenses;
  const isMonthlyFundPositive = monthlyFund >= 0;

  // Arrecadação necessária (mês atual e próximo)
  const totalApartments = 276;
  const currentMonthCollection = totalMonthlyExpenses;
  const nextMonthCollection = totalMonthlyExpenses;
  const perApartmentCurrent = currentMonthCollection / totalApartments;
  const perApartmentNext = nextMonthCollection / totalApartments;

  // Cálculos TOTAIS (desconsiderando mês)
  const totalCommitted =
    financialData.condominiumFund -
    totalRecurringExpenses -
    totalSuggestionsRemaining;
  const isTotalCommittedPositive = totalCommitted >= 0;

  const onFinancialSubmit = async (data: FinancialRegisterSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Informações financeiras cadastradas com sucesso!");
      financialForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar informações financeiras");
    }
  };

  const onExpenseSubmit = async (data: RecurringExpenseSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingExpenseId) {
        toast.success("Despesa recorrente atualizada com sucesso!");
      } else {
        toast.success("Despesa recorrente cadastrada com sucesso!");
      }

      expenseForm.reset();
      setIsExpenseDialogOpen(false);
      setEditingExpenseId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar despesa recorrente");
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpenseId(expense.id);
    expenseForm.reset({
      name: expense.name,
      value: expense.value,
      hasExpirationDate: expense.hasExpirationDate,
      expirationDate: expense.expirationDate || "",
    });
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Despesa recorrente removida com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover despesa recorrente");
    }
  };

  const handleCloseExpenseDialog = () => {
    setIsExpenseDialogOpen(false);
    setEditingExpenseId(null);
    expenseForm.reset();
  };

  if (isLoading) {
    return <FinancialSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie as informações financeiras do condomínio
        </p>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Consultar</TabsTrigger>
          <TabsTrigger value="register">Cadastrar Caixa</TabsTrigger>
          <TabsTrigger value="expenses">Despesas Recorrentes</TabsTrigger>
        </TabsList>

        {/* Aba de Consulta */}
        <TabsContent value="view" className="space-y-6">
          {/* Card em Destaque - Arrecadação Necessária */}
          <Card className="border-2 border-primary shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Receipt className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    Arrecadação Necessária
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Valores a arrecadar por mês para cobrir as despesas
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mês Atual */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-lg">Mês Atual</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total a arrecadar
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        R$ {currentMonthCollection.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Por apartamento ({totalApartments} unidades)
                      </p>
                      <p className="text-xl font-bold text-primary">
                        R${" "}
                        {perApartmentCurrent.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Próximo Mês */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-lg">Próximo Mês</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total a arrecadar
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                        R$ {nextMonthCollection.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Por apartamento ({totalApartments} unidades)
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-500">
                        R${" "}
                        {perApartmentNext.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise MENSAL */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Análise Mensal
              </h2>
              <p className="text-sm text-muted-foreground">
                Situação financeira considerando apenas o mês atual
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Despesas Recorrentes Mensais */}
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Despesas Recorrentes
                  </CardTitle>
                  <Receipt className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                    R$ {totalRecurringExpenses.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recurringExpenses.length} despesa(s) mensal(is)
                  </p>
                </CardContent>
              </Card>

              {/* Despesas de Sugestões (Mensal) */}
              <Card className="border-blue-500/50 bg-blue-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sugestões (Mensal)
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    R$ {totalSuggestionsMonthlyExpense.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Parcela mensal das obras
                  </p>
                </CardContent>
              </Card>

              {/* Total de Despesas Mensais */}
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Despesas do Mês
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    R$ {totalMonthlyExpenses.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recorrentes + Sugestões
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Mensal */}
              <Card
                className={`${
                  isMonthlyFundPositive
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-red-500/50 bg-red-500/5"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo do Mês
                  </CardTitle>
                  {isMonthlyFundPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      isMonthlyFundPositive
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    }`}
                  >
                    R$ {monthlyFund.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Caixa - Despesas Mensais
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Análise TOTAL */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                Análise Total (Todas as Despesas)
              </h2>
              <p className="text-sm text-muted-foreground">
                Situação financeira considerando todas as despesas futuras
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Caixa Total */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Caixa Total do Condomínio
                  </CardTitle>
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {financialData.condominiumFund.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {financialData.lastUpdate}
                  </p>
                </CardContent>
              </Card>

              {/* Total Restante das Sugestões */}
              <Card className="border-purple-500/50 bg-purple-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Restante (Sugestões)
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">
                    R$ {totalSuggestionsRemaining.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor total a ser pago
                  </p>
                </CardContent>
              </Card>

              {/* Total Comprometido */}
              <Card
                className={`${
                  isTotalCommittedPositive
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-red-500/50 bg-red-500/5"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Total Comprometido
                  </CardTitle>
                  {isTotalCommittedPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      isTotalCommittedPositive
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    }`}
                  >
                    R$ {totalCommitted.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Caixa - Todas as Despesas Futuras
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Todas as Despesas */}
          <Card>
            <CardHeader>
              <CardTitle>Todas as Despesas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Despesas Recorrentes */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  Despesas Recorrentes
                </h3>
                <div className="space-y-2">
                  {recurringExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{expense.name}</span>
                        {expense.hasExpirationDate &&
                          expense.expirationDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              Válido até:{" "}
                              {new Date(
                                expense.expirationDate
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                      </div>
                      <span className="text-lg font-bold">
                        R$ {expense.value.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-orange-500/10 border-2 border-orange-500/50">
                    <span className="font-bold">Subtotal Recorrentes</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-500">
                      R$ {totalRecurringExpenses.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Despesas das Sugestões Aprovadas */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Sugestões Aprovadas em Andamento
                </h3>
                <div className="space-y-3">
                  {approvedSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium">
                            {suggestion.title}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Mensal: R${" "}
                            {suggestion.monthlyExpense.toLocaleString("pt-BR")}{" "}
                            | Restante: R${" "}
                            {suggestion.totalRemaining.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={suggestion.progress}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {suggestion.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border-2 border-blue-500/50">
                    <span className="font-bold">
                      Subtotal Sugestões (Mensal)
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
                      R${" "}
                      {totalSuggestionsMonthlyExpense.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Geral */}
              <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border-2 border-primary/50">
                <span className="font-bold text-xl">
                  Total de Despesas Mensais
                </span>
                <span className="text-2xl font-bold text-primary">
                  R${" "}
                  {(
                    totalRecurringExpenses + totalSuggestionsMonthlyExpense
                  ).toLocaleString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Cadastro de Caixa */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Caixa do Condomínio</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registre o valor total do caixa do condomínio
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={financialForm.handleSubmit(onFinancialSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="condominiumFund">
                      Caixa do Condomínio (R$)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="condominiumFund"
                        type="number"
                        step="0.01"
                        placeholder="50000.00"
                        {...financialForm.register("condominiumFund", {
                          valueAsNumber: true,
                        })}
                        className="pl-9"
                      />
                    </div>
                    {financialForm.formState.errors.condominiumFund && (
                      <p className="text-sm text-destructive">
                        {financialForm.formState.errors.condominiumFund.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referenceMonth">Mês de Referência</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="referenceMonth"
                        type="month"
                        {...financialForm.register("referenceMonth")}
                        className="pl-9"
                      />
                    </div>
                    {financialForm.formState.errors.referenceMonth && (
                      <p className="text-sm text-destructive">
                        {financialForm.formState.errors.referenceMonth.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={financialForm.formState.isSubmitting}
                  >
                    {financialForm.formState.isSubmitting
                      ? "Cadastrando..."
                      : "Cadastrar Informações"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => financialForm.reset()}
                    disabled={financialForm.formState.isSubmitting}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Despesas Recorrentes */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex justify-end">
            <Dialog
              open={isExpenseDialogOpen}
              onOpenChange={(open) => {
                if (!open) handleCloseExpenseDialog();
                else setIsExpenseDialogOpen(true);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Despesa Recorrente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingExpenseId ? "Editar" : "Cadastrar"} Despesa
                    Recorrente
                  </DialogTitle>
                  <DialogDescription>
                    Defina uma despesa que se repete mensalmente
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={expenseForm.handleSubmit(onExpenseSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Despesa</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Manutenção Predial"
                      {...expenseForm.register("name")}
                    />
                    {expenseForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {expenseForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...expenseForm.register("value", {
                          valueAsNumber: true,
                        })}
                        className="pl-9"
                      />
                    </div>
                    {expenseForm.formState.errors.value && (
                      <p className="text-sm text-destructive">
                        {expenseForm.formState.errors.value.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasExpirationDate"
                        checked={hasExpirationDate}
                        onCheckedChange={(checked) =>
                          expenseForm.setValue(
                            "hasExpirationDate",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="hasExpirationDate"
                        className="cursor-pointer"
                      >
                        Definir prazo de validade
                      </Label>
                    </div>
                  </div>

                  {hasExpirationDate && (
                    <div className="space-y-2">
                      <Label htmlFor="expirationDate">Data de Validade</Label>
                      <Input
                        id="expirationDate"
                        type="date"
                        {...expenseForm.register("expirationDate")}
                      />
                      {expenseForm.formState.errors.expirationDate && (
                        <p className="text-sm text-destructive">
                          {expenseForm.formState.errors.expirationDate.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={expenseForm.formState.isSubmitting}
                    >
                      {expenseForm.formState.isSubmitting
                        ? "Salvando..."
                        : editingExpenseId
                        ? "Atualizar"
                        : "Cadastrar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseExpenseDialog}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recurringExpenses.map((expense) => (
              <Card key={expense.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        {expense.name}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-2xl font-bold text-primary">
                          R$ {expense.value.toLocaleString("pt-BR")}
                        </p>
                        {expense.hasExpirationDate &&
                          expense.expirationDate && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Válido até:{" "}
                              {new Date(
                                expense.expirationDate
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        {!expense.hasExpirationDate && (
                          <p className="text-sm text-muted-foreground">
                            Sem prazo de validade
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {recurringExpenses.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <p className="text-muted-foreground mb-4">
                  Nenhuma despesa recorrente cadastrada
                </p>
                <Button onClick={() => setIsExpenseDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeira Despesa
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
