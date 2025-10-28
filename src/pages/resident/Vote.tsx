import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VoteSkeleton from "@/skeleton/resident/VoteSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Vote as VoteIcon,
  CheckCircle2,
  Building2,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function Vote() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2025-10");
  const [votesRemaining, setVotesRemaining] = useState(3);
  const [votesDistribution, setVotesDistribution] = useState<{
    [key: number]: number;
  }>({});
  const [isVoteConfirmed, setIsVoteConfirmed] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState<{
    [key: number]: number;
  }>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Mock data
  const monthlySuggestions = [
    {
      id: 1,
      title: "Reforma da Piscina",
      description:
        "Melhorar a área de lazer com nova iluminação e revestimento",
      votes: 45,
    },
    {
      id: 2,
      title: "Nova Área de Churrasqueira",
      description: "Expandir área gourmet com mais espaço e equipamentos",
      votes: 38,
    },
    {
      id: 3,
      title: "Academia ao Ar Livre",
      description: "Instalar equipamentos de ginástica na área externa",
      votes: 32,
    },
    {
      id: 4,
      title: "Pintura da Fachada",
      description: "Renovar pintura externa do prédio",
      votes: 28,
    },
    {
      id: 5,
      title: "Playground Infantil",
      description: "Criar área de lazer segura para crianças",
      votes: 25,
    },
  ];

  const totalVotes = 3;
  const votesUsed = totalVotes - votesRemaining;

  const handleAddVote = (suggestionId: number) => {
    if (isVoteConfirmed) {
      toast.error(
        "Você já confirmou sua votação! Resete para votar novamente."
      );
      return;
    }

    if (votesRemaining === 0) {
      toast.error("Você já utilizou todos os seus votos!");
      return;
    }

    setVotesDistribution((prev) => ({
      ...prev,
      [suggestionId]: (prev[suggestionId] || 0) + 1,
    }));
    setVotesRemaining(votesRemaining - 1);
  };

  const handleRemoveVote = (suggestionId: number) => {
    if (isVoteConfirmed) {
      toast.error(
        "Você já confirmou sua votação! Resete para votar novamente."
      );
      return;
    }

    const currentVotes = votesDistribution[suggestionId] || 0;
    if (currentVotes === 0) return;

    setVotesDistribution((prev) => ({
      ...prev,
      [suggestionId]: currentVotes - 1,
    }));
    setVotesRemaining(votesRemaining + 1);
  };

  const handleConfirmVotes = () => {
    if (votesRemaining > 0) {
      toast.error(`Você ainda tem ${votesRemaining} voto(s) disponível(is)!`);
      return;
    }

    setIsVoteConfirmed(true);
    toast.success("Votação confirmada com sucesso!");
  };

  const handleResetVotes = () => {
    setVotesDistribution({});
    setVotesRemaining(3);
    setIsVoteConfirmed(false);
    toast.info("Votos resetados! Você pode votar novamente.");
  };

  const getVotesForSuggestion = (id: number) => votesDistribution[id] || 0;

  // Mock data for approved activities with offers
  const approvedActivities = [
    {
      id: 1,
      title: "Reforma da Piscina",
      offers: [
        {
          id: 1,
          company: "AquaReform Ltda",
          totalBudget: 50000,
          installments: 10,
          monthlyPayment: 5000,
        },
        {
          id: 2,
          company: "PiscinasPro",
          totalBudget: 45000,
          installments: 12,
          monthlyPayment: 3750,
        },
        {
          id: 3,
          company: "ReformaFácil",
          totalBudget: 48000,
          installments: 8,
          monthlyPayment: 6000,
        },
      ],
    },
    {
      id: 2,
      title: "Nova Área de Churrasqueira",
      offers: [
        {
          id: 4,
          company: "ChurrascoTotal",
          totalBudget: 35000,
          installments: 10,
          monthlyPayment: 3500,
        },
        {
          id: 5,
          company: "Gourmet Construções",
          totalBudget: 38000,
          installments: 12,
          monthlyPayment: 3167,
        },
      ],
    },
    {
      id: 3,
      title: "Academia ao Ar Livre",
      offers: [
        {
          id: 6,
          company: "FitOutdoor",
          totalBudget: 25000,
          installments: 6,
          monthlyPayment: 4167,
        },
        {
          id: 7,
          company: "GymNature",
          totalBudget: 28000,
          installments: 10,
          monthlyPayment: 2800,
        },
        {
          id: 8,
          company: "EcoFit",
          totalBudget: 23000,
          installments: 8,
          monthlyPayment: 2875,
        },
      ],
    },
  ];

  const handleOfferSelect = (activityId: number, offerId: number) => {
    setSelectedOffers((prev) => ({ ...prev, [activityId]: offerId }));
    toast.success("Oferta selecionada!");
  };

  const availableMonths = [
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-07", label: "Julho 2025" },
  ];

  if (isLoading) {
    return <VoteSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Votação do Mês</h1>
          <p className="text-muted-foreground mt-1">
            Vote nas melhores sugestões para o condomínio
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

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="suggestions">Votação de Sugestões</TabsTrigger>
          <TabsTrigger value="offers">Votação de Ofertas</TabsTrigger>
        </TabsList>

        {/* Suggestions Voting Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          {/* Voting Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Votos Restantes
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {votesRemaining}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Votos Utilizados
                  </p>
                  <p className="text-4xl font-bold text-accent">
                    {votesUsed}/{totalVotes}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <p
                    className={`text-2xl font-bold ${
                      isVoteConfirmed
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isVoteConfirmed ? "Confirmado" : "Pendente"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleConfirmVotes}
              disabled={votesRemaining > 0 || isVoteConfirmed}
              className="flex-1 gap-2"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isVoteConfirmed ? "Votação Confirmada" : "Confirmar Votação"}
            </Button>
            <Button
              onClick={handleResetVotes}
              disabled={votesUsed === 0 && !isVoteConfirmed}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Resetar Votos
            </Button>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {monthlySuggestions.map((suggestion) => {
              const userVotes = getVotesForSuggestion(suggestion.id);
              const hasVotes = userVotes > 0;

              return (
                <Card
                  key={suggestion.id}
                  className={hasVotes ? "border-2 border-accent" : ""}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {suggestion.title}
                          {hasVotes && (
                            <CheckCircle2 className="w-5 h-5 text-accent" />
                          )}
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {suggestion.votes}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          votos totais
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          onClick={() => handleRemoveVote(suggestion.id)}
                          disabled={userVotes === 0 || isVoteConfirmed}
                          variant="outline"
                          size="icon"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <p className="text-2xl font-bold text-accent">
                            {userVotes}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userVotes === 1 ? "seu voto" : "seus votos"}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddVote(suggestion.id)}
                          disabled={votesRemaining === 0 || isVoteConfirmed}
                          variant="outline"
                          size="icon"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Offers Voting Tab */}
        <TabsContent value="offers" className="space-y-6">
          <div className="space-y-6">
            {approvedActivities.map((activity) => (
              <Card key={activity.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {activity.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Selecione a empresa que prestará o serviço
                  </p>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedOffers[activity.id]?.toString()}
                    onValueChange={(value) =>
                      handleOfferSelect(activity.id, Number.parseInt(value))
                    }
                  >
                    <div className="space-y-4">
                      {activity.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                        >
                          <RadioGroupItem
                            value={offer.id.toString()}
                            id={`offer-${offer.id}`}
                          />
                          <Label
                            htmlFor={`offer-${offer.id}`}
                            className="flex-1 cursor-pointer space-y-2"
                          >
                            <div className="font-semibold">{offer.company}</div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="block font-medium text-foreground">
                                  R$ {offer.totalBudget.toLocaleString("pt-BR")}
                                </span>
                                <span className="text-xs">Valor Total</span>
                              </div>
                              <div>
                                <span className="block font-medium text-foreground">
                                  {offer.installments}x
                                </span>
                                <span className="text-xs">Parcelas</span>
                              </div>
                              <div>
                                <span className="block font-medium text-foreground">
                                  R${" "}
                                  {offer.monthlyPayment.toLocaleString("pt-BR")}
                                  /mês
                                </span>
                                <span className="text-xs">Valor Mensal</span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
