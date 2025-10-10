import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Vote as VoteIcon, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function Vote() {
  const [votesRemaining, setVotesRemaining] = useState(5);
  const [votedSuggestions, setVotedSuggestions] = useState<number[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<{ [key: number]: number }>({});

  // Mock data
  const monthlySuggestions = [
    {
      id: 1,
      title: "Reforma da Piscina",
      description: "Melhorar a área de lazer com nova iluminação e revestimento",
      author: "Apto 101",
      votes: 45,
    },
    {
      id: 2,
      title: "Nova Área de Churrasqueira",
      description: "Expandir área gourmet com mais espaço e equipamentos",
      author: "Apto 205",
      votes: 38,
    },
    {
      id: 3,
      title: "Academia ao Ar Livre",
      description: "Instalar equipamentos de ginástica na área externa",
      author: "Apto 302",
      votes: 32,
    },
    {
      id: 4,
      title: "Pintura da Fachada",
      description: "Renovar pintura externa do prédio",
      author: "Apto 108",
      votes: 28,
    },
    {
      id: 5,
      title: "Playground Infantil",
      description: "Criar área de lazer segura para crianças",
      author: "Apto 404",
      votes: 25,
    },
  ];

  const canVote = votesRemaining > 0 && votedSuggestions.length < 3;

  const handleVote = (suggestionId: number) => {
    if (!canVote) {
      toast.error("Você já utilizou todos os seus votos!");
      return;
    }

    if (votedSuggestions.includes(suggestionId)) {
      toast.error("Você já votou nesta sugestão!");
      return;
    }

    setVotedSuggestions([...votedSuggestions, suggestionId]);
    setVotesRemaining(votesRemaining - 1);
    toast.success("Voto registrado com sucesso!");
  };

  const hasVoted = (id: number) => votedSuggestions.includes(id);

  // Mock data for approved activities with offers
  const approvedActivities = [
    {
      id: 1,
      title: "Reforma da Piscina",
      offers: [
        { id: 1, company: "AquaReform Ltda", totalBudget: 50000, installments: 10, monthlyPayment: 5000 },
        { id: 2, company: "PiscinasPro", totalBudget: 45000, installments: 12, monthlyPayment: 3750 },
        { id: 3, company: "ReformaFácil", totalBudget: 48000, installments: 8, monthlyPayment: 6000 },
      ]
    },
    {
      id: 2,
      title: "Nova Área de Churrasqueira",
      offers: [
        { id: 4, company: "ChurrascoTotal", totalBudget: 35000, installments: 10, monthlyPayment: 3500 },
        { id: 5, company: "Gourmet Construções", totalBudget: 38000, installments: 12, monthlyPayment: 3167 },
      ]
    },
    {
      id: 3,
      title: "Academia ao Ar Livre",
      offers: [
        { id: 6, company: "FitOutdoor", totalBudget: 25000, installments: 6, monthlyPayment: 4167 },
        { id: 7, company: "GymNature", totalBudget: 28000, installments: 10, monthlyPayment: 2800 },
        { id: 8, company: "EcoFit", totalBudget: 23000, installments: 8, monthlyPayment: 2875 },
      ]
    },
  ];

  const handleOfferSelect = (activityId: number, offerId: number) => {
    setSelectedOffers(prev => ({ ...prev, [activityId]: offerId }));
    toast.success("Oferta selecionada!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Votação do Mês</h1>
          <p className="text-muted-foreground mt-1">
            Vote nas melhores sugestões para o condomínio
          </p>
        </div>
        <select className="px-4 py-2 border border-border rounded-md bg-card">
          <option>Outubro 2025</option>
          <option>Setembro 2025</option>
        </select>
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
                  <p className="text-sm text-muted-foreground mb-2">Votos Restantes</p>
                  <p className="text-4xl font-bold text-primary">{votesRemaining}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Sugestões Votadas</p>
                  <p className="text-4xl font-bold text-accent">{votedSuggestions.length}/3</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total de Sugestões</p>
                  <p className="text-4xl font-bold text-muted-foreground">
                    {monthlySuggestions.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {monthlySuggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                className={hasVoted(suggestion.id) ? "border-2 border-accent" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {suggestion.title}
                        {hasVoted(suggestion.id) && (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Por {suggestion.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{suggestion.votes}</p>
                      <p className="text-xs text-muted-foreground">votos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                  <Button
                    onClick={() => handleVote(suggestion.id)}
                    disabled={hasVoted(suggestion.id) || !canVote}
                    className="w-full gap-2"
                    variant={hasVoted(suggestion.id) ? "secondary" : "default"}
                  >
                    {hasVoted(suggestion.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Votado
                      </>
                    ) : (
                      <>
                        <VoteIcon className="w-4 h-4" />
                        Votar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                    onValueChange={(value) => handleOfferSelect(activity.id, parseInt(value))}
                  >
                    <div className="space-y-4">
                      {activity.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                        >
                          <RadioGroupItem value={offer.id.toString()} id={`offer-${offer.id}`} />
                          <Label
                            htmlFor={`offer-${offer.id}`}
                            className="flex-1 cursor-pointer space-y-2"
                          >
                            <div className="font-semibold">{offer.company}</div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="block font-medium text-foreground">
                                  R$ {offer.totalBudget.toLocaleString('pt-BR')}
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
                                  R$ {offer.monthlyPayment.toLocaleString('pt-BR')}/mês
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
