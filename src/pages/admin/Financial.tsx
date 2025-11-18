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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  financialRegisterSchema,
  type FinancialRegisterSchema,
} from "@/schemas/admin/financial.schema";
import {
  recurringExpenseSchema,
  type RecurringExpenseSchema,
} from "@/schemas/admin/recurringExpense.schema";
import {
  oneTimeExpenseSchema,
  type OneTimeExpenseSchema,
} from "@/schemas/admin/oneTimeExpense.schema";
import FinancialSkeleton from "@/skeleton/admin/FinancialSkeleton";

export default function Financial() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [isOneTimeExpenseDialogOpen, setIsOneTimeExpenseDialogOpen] =
    useState(false);
  const [editingOneTimeExpenseId, setEditingOneTimeExpenseId] = useState<
    number | null
  >(null);
  const [selectedMonth, setSelectedMonth] = useState("2025-10");
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<File | null>(
    null
  );

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

  const oneTimeExpenseForm = useForm<OneTimeExpenseSchema>({
    resolver: zodResolver(oneTimeExpenseSchema),
    defaultValues: {
      name: "",
      description: "",
      value: 0,
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

  // Despesas avulsas (específicas do mês)
  const allOneTimeExpenses = [
    {
      id: 1,
      name: "Reparo do Portão Principal",
      description:
        "Conserto do portão principal que estava com problema na trava eletrônica",
      value: 850,
      referenceMonth: "2025-10",
      receiptImage:
        "https://via.placeholder.com/400x300/4f46e5/ffffff?text=Recibo+Portão",
    },
    {
      id: 2,
      name: "Compra de Materiais de Limpeza",
      description:
        "Produtos de limpeza para uso geral no condomínio - detergentes, desinfetantes e sabão",
      value: 450,
      referenceMonth: "2025-10",
      receiptImage: "",
    },
    {
      id: 3,
      name: "Manutenção do Elevador 2",
      description:
        "Manutenção preventiva e troca de cabos do elevador do bloco 2",
      value: 1200,
      referenceMonth: "2025-09",
      receiptImage:
        "https://via.placeholder.com/400x300/10b981/ffffff?text=Recibo+Elevador",
    },
    {
      id: 4,
      name: "Pintura do Hall de Entrada",
      description:
        "Pintura completa do hall de entrada com tinta acrílica premium",
      value: 2300,
      referenceMonth: "2025-09",
      receiptImage: "",
    },
  ];

  // Filtrar despesas avulsas do mês selecionado
  const oneTimeExpenses = allOneTimeExpenses.filter(
    (expense) => expense.referenceMonth === selectedMonth
  );

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

  const totalOneTimeExpenses = oneTimeExpenses.reduce(
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
    totalRecurringExpenses +
    totalSuggestionsMonthlyExpense +
    totalOneTimeExpenses;
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

  const handleReceiptImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedReceiptImage(file);
      // Criar um FileList-like object para o react-hook-form
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      oneTimeExpenseForm.setValue("receiptImage", dataTransfer.files, {
        shouldValidate: true,
      });
      toast.success("Imagem selecionada com sucesso!");
    }
  };

  const handleRemoveReceiptImage = () => {
    setSelectedReceiptImage(null);
    oneTimeExpenseForm.setValue("receiptImage", undefined);
  };

  const onOneTimeExpenseSubmit = async (data: OneTimeExpenseSchema) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Implementar integração com API
      // 1. Criar despesa avulsa e receber URL pré-assinada
      // 2. Se houver imagem, fazer upload para a URL pré-assinada
      // Exemplo:
      // const response = await oneTimeExpensesService.create({
      //   name: data.name,
      //   description: data.description,
      //   value: data.value,
      //   referenceMonth: selectedMonth,
      // });
      //
      // if (data.receiptImage?.[0] && response.data?.presignedUrl) {
      //   await oneTimeExpensesService.uploadReceipt(
      //     response.data.presignedUrl,
      //     data.receiptImage[0]
      //   );
      // }

      if (editingOneTimeExpenseId) {
        toast.success("Despesa avulsa atualizada com sucesso!");
      } else {
        toast.success("Despesa avulsa cadastrada com sucesso!");
      }

      oneTimeExpenseForm.reset();
      setSelectedReceiptImage(null);
      setIsOneTimeExpenseDialogOpen(false);
      setEditingOneTimeExpenseId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar despesa avulsa");
    }
  };

  const handleEditOneTimeExpense = (expense: any) => {
    setEditingOneTimeExpenseId(expense.id);
    oneTimeExpenseForm.reset({
      name: expense.name,
      description: expense.description,
      value: expense.value,
    });
    // Se tiver imagem salva, pode ser carregada aqui no futuro
    setSelectedReceiptImage(null);
    setIsOneTimeExpenseDialogOpen(true);
  };

  const handleDeleteOneTimeExpense = async (expenseId: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Despesa avulsa removida com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover despesa avulsa");
    }
  };

  const handleCloseOneTimeExpenseDialog = () => {
    setIsOneTimeExpenseDialogOpen(false);
    setEditingOneTimeExpenseId(null);
    setSelectedReceiptImage(null);
    oneTimeExpenseForm.reset({
      name: "",
      description: "",
      value: 0,
    });
  };

  if (isLoading) {
    return <FinancialSkeleton />;
  }

  const availableMonths = [
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-07", label: "Julho 2025" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie as informações financeiras do condomínio
          </p>
        </div>
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

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Consultar</TabsTrigger>
          <TabsTrigger value="register">Cadastrar Caixa</TabsTrigger>
          <TabsTrigger value="expenses">Despesas Recorrentes</TabsTrigger>
          <TabsTrigger value="one-time-expenses">Despesas Avulsas</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

              {/* Despesas Avulsas */}
              <Card className="border-pink-500/50 bg-pink-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Despesas Avulsas
                  </CardTitle>
                  <Receipt className="h-4 w-4 text-pink-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-500">
                    R$ {totalOneTimeExpenses.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {oneTimeExpenses.length} despesa(s) do mês
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
                    Todas as despesas
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

              {/* Despesas Avulsas */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-pink-500" />
                  Despesas Avulsas do Mês
                </h3>
                <div className="space-y-2">
                  {oneTimeExpenses.length > 0 ? (
                    <>
                      {oneTimeExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex justify-between items-start p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {expense.name}
                              </span>
                              {expense.receiptImage && (
                                <ImageIcon className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {expense.description}
                            </p>
                          </div>
                          <span className="text-lg font-bold">
                            R$ {expense.value.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 rounded-lg bg-pink-500/10 border-2 border-pink-500/50">
                        <span className="font-bold">Subtotal Avulsas</span>
                        <span className="text-xl font-bold text-pink-600 dark:text-pink-500">
                          R$ {totalOneTimeExpenses.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma despesa avulsa neste mês
                      </p>
                    </div>
                  )}
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
                  R$ {totalMonthlyExpenses.toLocaleString("pt-BR")}
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

        {/* Aba de Despesas Avulsas */}
        <TabsContent value="one-time-expenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Despesas Avulsas do Mês</h2>
              <p className="text-sm text-muted-foreground">
                Despesas que aparecem apenas no mês selecionado
              </p>
            </div>
            <Dialog
              open={isOneTimeExpenseDialogOpen}
              onOpenChange={(open) => {
                if (!open) handleCloseOneTimeExpenseDialog();
                else setIsOneTimeExpenseDialogOpen(true);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Despesa Avulsa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingOneTimeExpenseId ? "Editar" : "Cadastrar"} Despesa
                    Avulsa
                  </DialogTitle>
                  <DialogDescription>
                    Despesa única que será contabilizada apenas no mês
                    selecionado
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={oneTimeExpenseForm.handleSubmit(
                    onOneTimeExpenseSubmit
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="oneTimeName">Nome da Despesa</Label>
                    <Input
                      id="oneTimeName"
                      placeholder="Ex: Reparo do Portão"
                      {...oneTimeExpenseForm.register("name")}
                    />
                    {oneTimeExpenseForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {oneTimeExpenseForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oneTimeDescription">Descrição</Label>
                    <Textarea
                      id="oneTimeDescription"
                      placeholder="Descreva os detalhes da despesa..."
                      rows={3}
                      {...oneTimeExpenseForm.register("description")}
                    />
                    {oneTimeExpenseForm.formState.errors.description && (
                      <p className="text-sm text-destructive">
                        {
                          oneTimeExpenseForm.formState.errors.description
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oneTimeValue">Valor (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="oneTimeValue"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...oneTimeExpenseForm.register("value", {
                          valueAsNumber: true,
                        })}
                        className="pl-9"
                      />
                    </div>
                    {oneTimeExpenseForm.formState.errors.value && (
                      <p className="text-sm text-destructive">
                        {oneTimeExpenseForm.formState.errors.value.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptImage">
                      Imagem do Recibo (Opcional)
                    </Label>

                    {selectedReceiptImage ? (
                      <div className="space-y-3">
                        <div className="relative border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={URL.createObjectURL(selectedReceiptImage)}
                            alt="Preview do recibo"
                            className="w-full h-64 object-contain"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                document.getElementById("receiptImage")?.click()
                              }
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Trocar Imagem
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={handleRemoveReceiptImage}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedReceiptImage.name} (
                          {(selectedReceiptImage.size / 1024).toFixed(2)} KB)
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          document.getElementById("receiptImage")?.click()
                        }
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 rounded-full bg-primary/10">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Clique para selecionar
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ou arraste a imagem aqui
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, JPEG ou WebP (máx. 5MB)
                          </p>
                        </div>
                      </button>
                    )}

                    <input
                      id="receiptImage"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      {...oneTimeExpenseForm.register("receiptImage")}
                      onChange={handleReceiptImageSelect}
                      className="hidden"
                    />

                    {oneTimeExpenseForm.formState.errors.receiptImage && (
                      <p className="text-sm text-destructive">
                        {
                          oneTimeExpenseForm.formState.errors.receiptImage
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={oneTimeExpenseForm.formState.isSubmitting}
                    >
                      {oneTimeExpenseForm.formState.isSubmitting
                        ? "Salvando..."
                        : editingOneTimeExpenseId
                        ? "Atualizar"
                        : "Cadastrar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseOneTimeExpenseDialog}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {oneTimeExpenses.map((expense) => (
              <Card key={expense.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        {expense.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-bold text-primary">
                          R$ {expense.value.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(
                            `${expense.referenceMonth}-01`
                          ).toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {expense.receiptImage && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Recibo/Nota Fiscal
                          </p>
                          <img
                            src={expense.receiptImage}
                            alt="Recibo"
                            className="max-w-xs h-auto rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditOneTimeExpense(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOneTimeExpense(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {oneTimeExpenses.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <p className="text-muted-foreground mb-4">
                  Nenhuma despesa avulsa cadastrada para este mês
                </p>
                <Button onClick={() => setIsOneTimeExpenseDialogOpen(true)}>
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
