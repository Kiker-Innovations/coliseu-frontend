import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Image as ImageIcon,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyInput, unformatCurrency } from "@/lib/utils";
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
import {
  financialService,
  type FinancialSummary,
  type FinancialSnapshot,
  type RecurringExpense,
  type OneTimeExpense,
  type ProjectExpense,
  type FundEntry,
} from "@/services/api";

export default function Financial() {
  const [isLoading, setIsLoading] = useState(true);
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<FinancialSnapshot | null>(null);

  // Dialog states
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isOneTimeExpenseDialogOpen, setIsOneTimeExpenseDialogOpen] =
    useState(false);
  const [editingOneTimeExpenseId, setEditingOneTimeExpenseId] = useState<
    string | null
  >(null);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<File | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para confirmação do cadastro de caixa
  const [isConfirmFundDialogOpen, setIsConfirmFundDialogOpen] = useState(false);
  const [pendingFundEntry, setPendingFundEntry] =
    useState<FinancialRegisterSchema | null>(null);
  const [fundValueInput, setFundValueInput] = useState("");

  // Estados para inputs de valor com máscara
  const [recurringExpenseValueInput, setRecurringExpenseValueInput] =
    useState("");
  const [oneTimeExpenseValueInput, setOneTimeExpenseValueInput] = useState("");

  const financialForm = useForm<FinancialRegisterSchema>({
    resolver: zodResolver(financialRegisterSchema),
    defaultValues: {
      title: "",
      value: 0,
    },
  });

  const expenseForm = useForm<RecurringExpenseSchema>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      name: "",
      value: 0,
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

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // First check if month changed
      await financialService.checkMonth();

      // Then load summary
      const [summaryResponse, snapshotsResponse] = await Promise.all([
        financialService.getSummary(),
        financialService.getSnapshots(),
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setFinancialSummary(summaryResponse.data);
      }

      if (snapshotsResponse.success && snapshotsResponse.data) {
        setSnapshots(snapshotsResponse.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados financeiros");
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper functions
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  // Cálculos
  const totalRecurringExpenses = financialSummary?.totalRecurringExpenses || 0;
  const totalOneTimeExpenses = financialSummary?.totalOneTimeExpenses || 0;
  const totalProjectExpenses = financialSummary?.totalProjectExpenses || 0;
  const totalMonthlyExpenses = financialSummary?.totalExpenses || 0;
  const monthlyBalance = financialSummary?.monthlyBalance || 0;
  const isMonthlyBalancePositive = monthlyBalance >= 0;

  // Arrecadação necessária
  const totalApartments = 276; // TODO: Obter do building
  const currentMonthCollection = totalMonthlyExpenses;
  const perApartmentCurrent =
    totalApartments > 0 ? currentMonthCollection / totalApartments : 0;

  // Total comprometido (para projetos em andamento)
  const totalProjectsRemaining = (
    financialSummary?.projectExpenses || []
  ).reduce(
    (sum, p) => sum + (p.totalValue - p.paidInstallments * p.monthlyValue),
    0
  );

  // Abre o diálogo de confirmação antes de cadastrar
  const onFinancialSubmit = async (data: FinancialRegisterSchema) => {
    setPendingFundEntry(data);
    setIsConfirmFundDialogOpen(true);
  };

  // Confirma e cadastra a entrada de caixa
  const handleConfirmFundEntry = async () => {
    if (!pendingFundEntry) return;

    try {
      setIsSubmitting(true);

      const response = await financialService.addFundEntry({
        title: pendingFundEntry.title,
        value: pendingFundEntry.value,
      });

      if (response.success) {
        toast.success("Entrada de caixa cadastrada com sucesso!");
        financialForm.reset();
        setFundValueInput("");
        setPendingFundEntry(null);
        setIsConfirmFundDialogOpen(false);
        await loadData();
      } else {
        toast.error(response.message || "Erro ao cadastrar entrada");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar entrada de caixa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para input de valor com máscara
  const handleFundValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFundValueInput(formatted);
    financialForm.setValue("value", unformatCurrency(formatted));
  };

  // Handler para input de valor de despesa recorrente com máscara
  const handleRecurringExpenseValueChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatCurrencyInput(e.target.value);
    setRecurringExpenseValueInput(formatted);
    expenseForm.setValue("value", unformatCurrency(formatted));
  };

  // Handler para input de valor de despesa avulsa com máscara
  const handleOneTimeExpenseValueChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatCurrencyInput(e.target.value);
    setOneTimeExpenseValueInput(formatted);
    oneTimeExpenseForm.setValue("value", unformatCurrency(formatted));
  };

  const onExpenseSubmit = async (data: RecurringExpenseSchema) => {
    try {
      setIsSubmitting(true);

      if (editingExpenseId) {
        const response = await financialService.updateRecurringExpense(
          editingExpenseId,
          {
            name: data.name,
            value: data.value,
          }
        );

        if (response.success) {
          toast.success("Despesa recorrente atualizada com sucesso!");
        } else {
          toast.error(response.message || "Erro ao atualizar despesa");
        }
      } else {
        const response = await financialService.addRecurringExpense({
          name: data.name,
          value: data.value,
        });

        if (response.success) {
          toast.success("Despesa recorrente cadastrada com sucesso!");
        } else {
          toast.error(response.message || "Erro ao cadastrar despesa");
        }
      }

      expenseForm.reset();
      setRecurringExpenseValueInput("");
      setIsExpenseDialogOpen(false);
      setEditingExpenseId(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar despesa recorrente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = (expense: RecurringExpense) => {
    setEditingExpenseId(expense._id);
    expenseForm.reset({
      name: expense.name,
      value: expense.value,
    });
    setRecurringExpenseValueInput(
      formatCurrencyInput(expense.value.toString())
    );
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await financialService.removeRecurringExpense(expenseId);
      if (response.success) {
        toast.success("Despesa recorrente removida com sucesso!");
        await loadData();
      } else {
        toast.error(response.message || "Erro ao remover despesa");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover despesa recorrente");
    }
  };

  const handleCloseExpenseDialog = () => {
    setIsExpenseDialogOpen(false);
    setEditingExpenseId(null);
    expenseForm.reset();
    setRecurringExpenseValueInput("");
  };

  const handleReceiptImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedReceiptImage(file);
      toast.success("Imagem selecionada com sucesso!");
    }
  };

  const handleRemoveReceiptImage = () => {
    setSelectedReceiptImage(null);
  };

  const onOneTimeExpenseSubmit = async (data: OneTimeExpenseSchema) => {
    try {
      setIsSubmitting(true);

      // TODO: Implementar upload de imagem para S3 se necessário
      const expenseData = {
        name: data.name,
        description: data.description,
        value: data.value,
        receiptImageUrl: undefined, // TODO: URL do S3 após upload
      };

      if (editingOneTimeExpenseId) {
        const response = await financialService.updateOneTimeExpense(
          editingOneTimeExpenseId,
          expenseData
        );

        if (response.success) {
          toast.success("Despesa avulsa atualizada com sucesso!");
        } else {
          toast.error(response.message || "Erro ao atualizar despesa");
        }
      } else {
        const response = await financialService.addOneTimeExpense(expenseData);

        if (response.success) {
          toast.success("Despesa avulsa cadastrada com sucesso!");
        } else {
          toast.error(response.message || "Erro ao cadastrar despesa");
        }
      }

      oneTimeExpenseForm.reset();
      setSelectedReceiptImage(null);
      setOneTimeExpenseValueInput("");
      setIsOneTimeExpenseDialogOpen(false);
      setEditingOneTimeExpenseId(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar despesa avulsa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOneTimeExpense = (expense: OneTimeExpense) => {
    setEditingOneTimeExpenseId(expense._id);
    oneTimeExpenseForm.reset({
      name: expense.name,
      description: expense.description,
      value: expense.value,
    });
    setOneTimeExpenseValueInput(formatCurrencyInput(expense.value.toString()));
    setSelectedReceiptImage(null);
    setIsOneTimeExpenseDialogOpen(true);
  };

  const handleDeleteOneTimeExpense = async (expenseId: string) => {
    try {
      const response = await financialService.removeOneTimeExpense(expenseId);
      if (response.success) {
        toast.success("Despesa avulsa removida com sucesso!");
        await loadData();
      } else {
        toast.error(response.message || "Erro ao remover despesa");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover despesa avulsa");
    }
  };

  const handleCloseOneTimeExpenseDialog = () => {
    setIsOneTimeExpenseDialogOpen(false);
    setEditingOneTimeExpenseId(null);
    setSelectedReceiptImage(null);
    setOneTimeExpenseValueInput("");
    oneTimeExpenseForm.reset({
      name: "",
      description: "",
      value: 0,
    });
  };

  const handleViewSnapshot = async (month: string) => {
    try {
      const response = await financialService.getSnapshotByMonth(month);
      if (response.success && response.data) {
        setSelectedSnapshot(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar snapshot");
    }
  };

  if (isLoading) {
    return <FinancialSkeleton />;
  }

  const recurringExpenses = financialSummary?.recurringExpenses || [];
  const oneTimeExpenses = financialSummary?.oneTimeExpenses || [];
  const projectExpenses = financialSummary?.projectExpenses || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie as informações financeiras do condomínio
          </p>
        </div>
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {formatMonthLabel(
            financialSummary?.referenceMonth || getCurrentMonth()
          )}
        </span>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Consultar</TabsTrigger>
          <TabsTrigger value="register">Cadastrar Caixa</TabsTrigger>
          <TabsTrigger value="expenses">Despesas Recorrentes</TabsTrigger>
          <TabsTrigger value="one-time-expenses">Despesas Avulsas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-lg">Saldo Anterior</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Saldo do mês anterior
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                        R${" "}
                        {(
                          financialSummary?.previousBalance || 0
                        ).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Caixa atual (arrecadação do mês)
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-500">
                        R${" "}
                        {(
                          financialSummary?.condominiumFund || 0
                        ).toLocaleString("pt-BR")}
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
                Situação financeira do mês atual
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Despesas Recorrentes */}
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
                    {recurringExpenses.length} despesa(s)
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
                    {oneTimeExpenses.length} despesa(s)
                  </p>
                </CardContent>
              </Card>

              {/* Despesas de Projetos */}
              <Card className="border-blue-500/50 bg-blue-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Projetos (Mensal)
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    R$ {totalProjectExpenses.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {projectExpenses.length} projeto(s) em andamento
                  </p>
                </CardContent>
              </Card>

              {/* Total de Despesas */}
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Despesas
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    R$ {totalMonthlyExpenses.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Todas as despesas do mês
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Mensal */}
              <Card
                className={`${
                  isMonthlyBalancePositive
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-red-500/50 bg-red-500/5"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo do Mês
                  </CardTitle>
                  {isMonthlyBalancePositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      isMonthlyBalancePositive
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    }`}
                  >
                    R$ {monthlyBalance.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">Após despesas</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Despesas */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento das Despesas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Despesas Recorrentes */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  Despesas Recorrentes
                </h3>
                <div className="space-y-2">
                  {recurringExpenses.length > 0 ? (
                    <>
                      {recurringExpenses.map((expense) => (
                        <div
                          key={expense._id}
                          className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                        >
                          <span className="font-medium">{expense.name}</span>
                          <span className="text-lg font-bold">
                            R$ {expense.value.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 rounded-lg bg-orange-500/10 border-2 border-orange-500/50">
                        <span className="font-bold">Subtotal</span>
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-500">
                          R$ {totalRecurringExpenses.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma despesa recorrente cadastrada
                    </p>
                  )}
                </div>
              </div>

              {/* Despesas Avulsas */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-pink-500" />
                  Despesas Avulsas
                </h3>
                <div className="space-y-2">
                  {oneTimeExpenses.length > 0 ? (
                    <>
                      {oneTimeExpenses.map((expense) => (
                        <div
                          key={expense._id}
                          className="flex justify-between items-start p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {expense.name}
                              </span>
                              {expense.receiptImageUrl && (
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
                        <span className="font-bold">Subtotal</span>
                        <span className="text-xl font-bold text-pink-600 dark:text-pink-500">
                          R$ {totalOneTimeExpenses.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma despesa avulsa neste mês
                    </p>
                  )}
                </div>
              </div>

              {/* Projetos em Andamento */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Projetos em Andamento
                </h3>
                <div className="space-y-3">
                  {projectExpenses.length > 0 ? (
                    <>
                      {projectExpenses.map((project) => {
                        const progress =
                          (project.paidInstallments /
                            project.installmentsCount) *
                          100;
                        return (
                          <div key={project.projectId} className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="font-medium">
                                  {project.projectTitle}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  {project.companyName} | Parcela: R${" "}
                                  {project.monthlyValue.toLocaleString("pt-BR")}{" "}
                                  | Restante: R${" "}
                                  {(
                                    project.totalValue -
                                    project.paidInstallments *
                                      project.monthlyValue
                                  ).toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="flex-1" />
                              <span className="text-sm text-muted-foreground w-20 text-right">
                                {project.paidInstallments}/
                                {project.installmentsCount}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border-2 border-blue-500/50">
                        <span className="font-bold">Subtotal (Mensal)</span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
                          R$ {totalProjectExpenses.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum projeto em andamento
                    </p>
                  )}
                </div>
              </div>

              {/* Total Geral */}
              <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border-2 border-primary/50">
                <span className="font-bold text-xl">Total de Despesas</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {totalMonthlyExpenses.toLocaleString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Cadastro de Caixa */}
        <TabsContent value="register" className="space-y-6">
          {/* Card de resumo do caixa atual */}
          <Card className="border-2 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-6 h-6 text-primary" />
                Caixa do Mês Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Saldo Anterior
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    R${" "}
                    {(financialSummary?.previousBalance || 0).toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Arrecadação do Mês
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    R${" "}
                    {(financialSummary?.condominiumFund || 0).toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(financialSummary?.fundEntries || []).length} entrada(s)
                    cadastrada(s)
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Disponível
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                    R${" "}
                    {(
                      (financialSummary?.previousBalance || 0) +
                      (financialSummary?.condominiumFund || 0)
                    ).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de cadastro */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Entrada de Caixa</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registre um novo valor de arrecadação para o mês atual. Você
                pode cadastrar múltiplas entradas.
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={financialForm.handleSubmit(onFinancialSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fundTitle">Nome</Label>
                    <Input
                      id="fundTitle"
                      placeholder="Ex: Taxa de condomínio - Dezembro"
                      {...financialForm.register("title")}
                    />
                    {financialForm.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {financialForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fundValue">Valor (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <Input
                        id="fundValue"
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        className="pl-10"
                        value={fundValueInput}
                        onChange={handleFundValueChange}
                      />
                    </div>
                    {financialForm.formState.errors.value && (
                      <p className="text-sm text-destructive">
                        {financialForm.formState.errors.value.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Cadastrando..." : "Cadastrar Entrada"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      financialForm.reset();
                      setFundValueInput("");
                    }}
                    disabled={isSubmitting}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de entradas cadastradas */}
          <Card>
            <CardHeader>
              <CardTitle>Entradas Cadastradas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Histórico de todas as entradas de caixa deste mês
              </p>
            </CardHeader>
            <CardContent>
              {(financialSummary?.fundEntries || []).length > 0 ? (
                <div className="space-y-3">
                  {(financialSummary?.fundEntries || []).map((entry) => (
                    <div
                      key={entry._id}
                      className="flex justify-between items-center p-4 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        R$ {entry.value.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border-2 border-primary/50">
                    <span className="font-bold">Total Arrecadado</span>
                    <span className="text-xl font-bold text-primary">
                      R${" "}
                      {(financialSummary?.condominiumFund || 0).toLocaleString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <PiggyBank className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma entrada cadastrada neste mês
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre a primeira entrada de caixa acima
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diálogo de Confirmação */}
          <AlertDialog
            open={isConfirmFundDialogOpen}
            onOpenChange={setIsConfirmFundDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Cadastro</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a cadastrar a seguinte entrada de caixa:
                </AlertDialogDescription>
              </AlertDialogHeader>

              {pendingFundEntry && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Título:</span>
                    <span className="font-medium">
                      {pendingFundEntry.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold text-primary text-lg">
                      R${" "}
                      {pendingFundEntry.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-500">
                  ⚠️ Esta ação não pode ser desfeita. Verifique se os dados
                  estão corretos.
                </p>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isSubmitting}
                  onClick={() => setPendingFundEntry(null)}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmFundEntry}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Aba de Despesas Recorrentes */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Despesas Recorrentes do Mês
              </h2>
              <p className="text-sm text-muted-foreground">
                Despesas que acontecem todos os meses
              </p>
            </div>
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
                    <Label htmlFor="recurringExpenseValue">Valor (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <Input
                        id="recurringExpenseValue"
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={recurringExpenseValueInput}
                        onChange={handleRecurringExpenseValueChange}
                        className="pl-10"
                      />
                    </div>
                    {expenseForm.formState.errors.value && (
                      <p className="text-sm text-destructive">
                        {expenseForm.formState.errors.value.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
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
              <Card key={expense._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        {expense.name}
                      </CardTitle>
                      <p className="text-2xl font-bold text-primary mt-2">
                        R$ {expense.value.toLocaleString("pt-BR")}
                      </p>
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
                        onClick={() => handleDeleteExpense(expense._id)}
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
                <p className="text-muted-foreground">
                  Nenhuma despesa recorrente cadastrada
                </p>
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
                Despesas que aparecem apenas no mês atual
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
                    Despesa única que será contabilizada no mês atual
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <Input
                        id="oneTimeValue"
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={oneTimeExpenseValueInput}
                        onChange={handleOneTimeExpenseValueChange}
                        className="pl-10"
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
                              Trocar
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
                          <p className="font-medium">Clique para selecionar</p>
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
                      onChange={handleReceiptImageSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
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
              <Card key={expense._id}>
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
                      <p className="text-2xl font-bold text-primary">
                        R$ {expense.value.toLocaleString("pt-BR")}
                      </p>
                      {expense.receiptImageUrl && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Recibo/Nota Fiscal
                          </p>
                          <img
                            src={expense.receiptImageUrl}
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
                        onClick={() => handleDeleteOneTimeExpense(expense._id)}
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
                <p className="text-muted-foreground">
                  Nenhuma despesa avulsa neste mês
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba de Histórico */}
        <TabsContent value="history" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Histórico Financeiro</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Visualize os snapshots dos meses anteriores
            </p>
          </div>

          {snapshots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map((snapshot) => (
                <Card
                  key={snapshot._id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleViewSnapshot(snapshot.referenceMonth)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {formatMonthLabel(snapshot.referenceMonth)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Arrecadação:
                      </span>
                      <span className="font-medium">
                        R$ {snapshot.condominiumFund.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Despesas:
                      </span>
                      <span className="font-medium">
                        R${" "}
                        {(
                          snapshot.totalRecurringExpenses +
                          snapshot.totalOneTimeExpenses +
                          snapshot.totalProjectExpenses
                        ).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Saldo Final:
                      </span>
                      <span
                        className={`font-bold ${
                          snapshot.finalBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        R$ {snapshot.finalBalance.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <p className="text-muted-foreground">
                  Nenhum histórico disponível ainda
                </p>
              </CardContent>
            </Card>
          )}

          {/* Modal de detalhes do snapshot */}
          {selectedSnapshot && (
            <Dialog
              open={!!selectedSnapshot}
              onOpenChange={() => setSelectedSnapshot(null)}
            >
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Snapshot:{" "}
                    {formatMonthLabel(selectedSnapshot.referenceMonth)}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Arrecadação
                      </p>
                      <p className="text-xl font-bold">
                        R${" "}
                        {selectedSnapshot.condominiumFund.toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Saldo Anterior
                      </p>
                      <p className="text-xl font-bold">
                        R${" "}
                        {selectedSnapshot.previousBalance.toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Despesas Recorrentes</h4>
                    {selectedSnapshot.recurringExpenses.map((exp) => (
                      <div
                        key={exp._id}
                        className="flex justify-between p-2 bg-muted/50 rounded"
                      >
                        <span>{exp.name}</span>
                        <span>R$ {exp.value.toLocaleString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Despesas Avulsas</h4>
                    {selectedSnapshot.oneTimeExpenses.length > 0 ? (
                      selectedSnapshot.oneTimeExpenses.map((exp) => (
                        <div
                          key={exp._id}
                          className="flex justify-between p-2 bg-muted/50 rounded"
                        >
                          <span>{exp.name}</span>
                          <span>R$ {exp.value.toLocaleString("pt-BR")}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Nenhuma despesa avulsa
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Projetos</h4>
                    {selectedSnapshot.projectExpenses.length > 0 ? (
                      selectedSnapshot.projectExpenses.map((proj) => (
                        <div
                          key={proj.projectId}
                          className="p-2 bg-muted/50 rounded"
                        >
                          <div className="flex justify-between">
                            <span>{proj.projectTitle}</span>
                            <span>
                              R$ {proj.monthlyValue.toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {proj.companyName} | Parcela {proj.paidInstallments}
                            /{proj.installmentsCount}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Nenhum projeto
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      selectedSnapshot.finalBalance >= 0
                        ? "bg-green-500/10 border border-green-500/50"
                        : "bg-red-500/10 border border-red-500/50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">Saldo Final</span>
                      <span
                        className={`text-xl font-bold ${
                          selectedSnapshot.finalBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        R${" "}
                        {selectedSnapshot.finalBalance.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
