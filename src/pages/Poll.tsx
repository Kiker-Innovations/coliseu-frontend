import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Poll() {
  const [selectedMonth, setSelectedMonth] = useState("2025-10");
  const [votes, setVotes] = useState<{ [key: number]: string }>({});
  const [tempSelections, setTempSelections] = useState<{
    [key: number]: string;
  }>({});

  // Mock data
  const polls = [
    {
      id: 1,
      month: "2025-10",
      question: "Qual horário preferem para manutenção da piscina?",
      options: [
        { id: "1a", text: "Manhã (8h-12h)" },
        { id: "1b", text: "Tarde (14h-18h)" },
        { id: "1c", text: "Fins de semana" },
      ],
      isActive: true,
      totalVotes: 45,
    },
    {
      id: 2,
      month: "2025-10",
      question: "Devemos permitir pets na área comum?",
      options: [
        { id: "2a", text: "Sim, sem restrições" },
        { id: "2b", text: "Sim, apenas em horários específicos" },
        { id: "2c", text: "Não" },
      ],
      isActive: true,
      totalVotes: 52,
    },
    {
      id: 3,
      month: "2025-10",
      question: "Qual dia da semana para limpeza das áreas comuns?",
      options: [
        { id: "3a", text: "Segunda-feira" },
        { id: "3b", text: "Quarta-feira" },
        { id: "3c", text: "Sexta-feira" },
      ],
      isActive: true,
      totalVotes: 38,
    },
    {
      id: 4,
      month: "2025-09",
      question: "Aprovam a troca da empresa de segurança?",
      options: [
        { id: "4a", text: "Sim" },
        { id: "4b", text: "Não" },
      ],
      isActive: false,
      totalVotes: 67,
    },
    {
      id: 5,
      month: "2025-09",
      question: "Horário de silêncio deve começar às:",
      options: [
        { id: "5a", text: "21h" },
        { id: "5b", text: "22h" },
        { id: "5c", text: "23h" },
      ],
      isActive: false,
      totalVotes: 71,
    },
  ];

  const availableMonths = [
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-09", label: "Setembro 2025" },
  ];

  const filteredPolls = polls.filter((poll) => poll.month === selectedMonth);

  const handleSelection = (pollId: number, optionId: string) => {
    setTempSelections({ ...tempSelections, [pollId]: optionId });
  };

  const handleConfirmVote = (pollId: number) => {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll?.isActive) {
      toast.error("Esta enquete já foi encerrada!");
      return;
    }

    if (votes[pollId]) {
      toast.error("Você já votou nesta enquete!");
      return;
    }

    if (!tempSelections[pollId]) {
      toast.error("Por favor, selecione uma opção antes de confirmar!");
      return;
    }

    setVotes({ ...votes, [pollId]: tempSelections[pollId] });
    toast.success("Voto registrado com sucesso!");
  };

  const hasVoted = (pollId: number) => !!votes[pollId];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enquetes</h1>
          <p className="text-muted-foreground mt-1">
            Vote nas enquetes do condomínio - 1 voto por apartamento
          </p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-border rounded-md bg-card"
        >
          {availableMonths.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      {/* Poll Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Enquetes do Mês
              </p>
              <p className="text-4xl font-bold text-primary">
                {filteredPolls.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Enquetes Respondidas
              </p>
              <p className="text-4xl font-bold text-accent">
                {filteredPolls.filter((p) => hasVoted(p.id)).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <p className="text-xl font-bold text-muted-foreground">
                {filteredPolls[0]?.isActive ? "Ativas" : "Encerradas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Polls List */}
      <div className="space-y-6">
        {filteredPolls.map((poll) => (
          <Card
            key={poll.id}
            className={
              hasVoted(poll.id)
                ? "border-2 border-accent"
                : !poll.isActive
                ? "opacity-75"
                : ""
            }
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl flex items-center gap-2">
                  {poll.question}
                  {hasVoted(poll.id) && (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  )}
                  {!poll.isActive && (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {poll.totalVotes} votos
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={
                  hasVoted(poll.id) ? votes[poll.id] : tempSelections[poll.id]
                }
                onValueChange={(value) => handleSelection(poll.id, value)}
                disabled={!poll.isActive || hasVoted(poll.id)}
              >
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={option.id}
                        disabled={!poll.isActive || hasVoted(poll.id)}
                      />
                      <Label
                        htmlFor={option.id}
                        className={`flex-1 cursor-pointer ${
                          !poll.isActive || hasVoted(poll.id)
                            ? "cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {poll.isActive && !hasVoted(poll.id) && (
                <Button
                  onClick={() => handleConfirmVote(poll.id)}
                  disabled={!tempSelections[poll.id]}
                  className="mt-4 w-full"
                >
                  Confirmar Voto
                </Button>
              )}

              {!poll.isActive && (
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  Esta enquete foi encerrada
                </div>
              )}

              {hasVoted(poll.id) && poll.isActive && (
                <div className="mt-4 p-3 bg-accent/10 rounded-lg flex items-center gap-2 text-sm text-accent">
                  <CheckCircle2 className="w-4 h-4" />
                  Você já votou nesta enquete
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
