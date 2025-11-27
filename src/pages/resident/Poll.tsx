import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PollSkeleton from "@/skeleton/resident/PollSkeleton";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock, Calendar, Clock, AlertCircle, PlayCircle, PauseCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { pollsService, ApiClientError, type ActivePoll, type FinishedCancelledPoll } from "@/services/api";

export default function Poll() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1; // 1-12
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  const [buildingId, setBuildingId] = useState<string>("");
  const [residentId, setResidentId] = useState<string>("");
  const [activePolls, setActivePolls] = useState<ActivePoll[]>([]);
  const [closedPolls, setClosedPolls] = useState<FinishedCancelledPoll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [tempSelections, setTempSelections] = useState<{
    [key: string]: number;
  }>({});
  const [isVoting, setIsVoting] = useState<{ [key: string]: boolean }>({});
  const [isChangingVote, setIsChangingVote] = useState<{ [key: string]: boolean }>({});
  const [confirmedVotes, setConfirmedVotes] = useState<{
    [key: string]: number;
  }>({}); // Armazena o optionId que foi confirmado para cada poll

  // Load buildingId and residentId on mount
  useEffect(() => {
    const loadResidentData = async () => {
      try {
        const token = localStorage.getItem("coliseu_access_token") || sessionStorage.getItem("coliseu_access_token");
        
        if (!token) {
          toast.error("Token não encontrado. Faça login novamente.");
          return;
        }

        // Extrair dados do token JWT (rota /residents/me não existe mais)
        // Tentar decodificar o token JWT para obter buildingId e residentId
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.buildingId) {
              setBuildingId(payload.buildingId);
            }
            // Também tentar obter residentId do token como fallback
            if (payload.id || payload.sub || payload.userId) {
              const idFromToken = payload.id || payload.sub || payload.userId;
              if (!residentId) {
                setResidentId(String(idFromToken));
                localStorage.setItem("resident_id", String(idFromToken));
              }
            }
          }
        } catch (decodeError) {
          console.warn("Não foi possível decodificar o token:", decodeError);
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados do resident:", error);
      }
    };
    loadResidentData();
  }, []);

  // Load polls data
  useEffect(() => {
    const loadData = async () => {
      if (!buildingId || buildingId.trim() === "") {
        console.warn("buildingId não disponível, aguardando...");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const year = selectedYear;
        const month = selectedMonth;
        
        console.log("Loading polls for:", { selectedMonth, selectedYear, year, month, buildingId });
        
        // Load active polls (only ATIVO)
        const activeParams: any = { buildingId: buildingId.trim() };
        if (month && !isNaN(month) && month > 0 && month <= 12) {
          activeParams.month = month;
        }
        if (year && !isNaN(year) && year > 0) {
          activeParams.year = year;
        }
        activeParams.status = ["ATIVO"];
        
        console.log("Active polls params:", activeParams);
        
        try {
          const activeResponse = await pollsService.getPolls(activeParams);
          console.log("Active polls response:", activeResponse);
          if (activeResponse.success && activeResponse.data) {
            const polls = Array.isArray(activeResponse.data) ? activeResponse.data : [];
            setActivePolls(polls);
            
            // Buscar os votos do usuário para cada poll usando a API
            const newVotedPolls = new Set<string>();
            const newConfirmedVotes: { [key: string]: number } = {};
            
            // Buscar votos de todas as polls em paralelo
            const votePromises = polls.map(async (poll) => {
              const pollId = poll.id || poll._id || "";
              if (!pollId) return null;
              
              try {
                const voteResponse = await pollsService.getMyVote(pollId);
                if (voteResponse.success && voteResponse.data) {
                  return {
                    pollId,
                    optionId: voteResponse.data.optionId,
                  };
                }
              } catch (error: any) {
                // Se o erro for 404, significa que o usuário não votou nessa poll ainda
                if (error instanceof ApiClientError && error.statusCode === 404) {
                  console.log(`Usuário ainda não votou na poll ${pollId}`);
                } else {
                  console.warn(`Erro ao buscar voto da poll ${pollId}:`, error);
                }
              }
              return null;
            });
            
            // Aguardar todas as requisições
            const voteResults = await Promise.all(votePromises);
            
            // Processar os resultados
            voteResults.forEach((result) => {
              if (result) {
                newVotedPolls.add(result.pollId);
                newConfirmedVotes[result.pollId] = result.optionId;
              }
            });
            
            // Atualizar localStorage com os votos obtidos da API
            localStorage.setItem("poll_votes", JSON.stringify(newConfirmedVotes));
            
            setVotedPolls(newVotedPolls);
            setConfirmedVotes(newConfirmedVotes);
            // Inicializar tempSelections com os votos confirmados para mostrar como selecionados ao recarregar
            setTempSelections(newConfirmedVotes);
          } else {
            setActivePolls([]);
          }
        } catch (activeError: any) {
          console.error("Erro ao carregar enquetes ativas:", activeError);
          if (activeError instanceof ApiClientError) {
            if (activeError.statusCode === 400 || activeError.statusCode === 404) {
              console.log("Nenhuma enquete ativa encontrada para o período selecionado");
              setActivePolls([]);
            } else if (activeError.statusCode === 500) {
              console.error("Erro interno do servidor ao carregar enquetes ativas");
              toast.error("Erro ao carregar enquetes. Tente novamente mais tarde.");
              setActivePolls([]);
            } else {
              toast.error("Erro ao carregar enquetes ativas");
              setActivePolls([]);
            }
          } else {
            setActivePolls([]);
          }
        }

        // Para o resident, não carregamos polls finalizadas/canceladas, apenas ATIVO
        setClosedPolls([]);
      } catch (error: any) {
        console.error("Erro geral ao carregar enquetes:", error);
        setActivePolls([]);
        setClosedPolls([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [buildingId, selectedMonth, selectedYear]);

  // Generate all 12 months
  const allMonths = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  // Generate available years (current year and previous 5 years)
  const availableYears = (() => {
    const years = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      years.push(now.getFullYear() - i);
    }
    return years;
  })();

  // Helper function to check if poll is active
  const isPollActive = (poll: ActivePoll | FinishedCancelledPoll) => {
    return poll.status.toUpperCase() === "ATIVO";
  };

  // Helper function to check if poll is within voting period
  const isPollInVotingPeriod = (poll: ActivePoll | FinishedCancelledPoll) => {
    try {
      const now = new Date();
      const startDate = new Date(poll.startDate);
      const endDate = new Date(poll.endDate);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }
      
      return now >= startDate && now <= endDate;
    } catch (error) {
      console.error("Erro ao verificar período de votação:", error);
      return false;
    }
  };

  // Helper function to get poll status details
  const getPollStatus = (poll: ActivePoll | FinishedCancelledPoll) => {
    try {
      const now = new Date();
      const startDate = new Date(poll.startDate);
      const endDate = new Date(poll.endDate);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          status: "encerrada",
          label: "Encerrada",
          color: "bg-gray-500",
          icon: Lock,
          message: "Data inválida",
        };
      }
      
      const isActive = isPollActive(poll);
      const isInPeriod = isPollInVotingPeriod(poll);

      if (!isActive) {
        return {
          status: "encerrada",
          label: "Encerrada",
          color: "bg-gray-500",
          icon: Lock,
          message: "Esta enquete foi encerrada",
        };
      }

      if (now < startDate) {
        const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          status: "aguardando",
          label: "Aguardando Início",
          color: "bg-blue-500",
          icon: PauseCircle,
          message: `A votação começará em ${daysUntilStart} dia${daysUntilStart > 1 ? 's' : ''}`,
          daysUntil: daysUntilStart,
        };
      }

      if (now > endDate) {
        return {
          status: "fora_periodo",
          label: "Fora do Período",
          color: "bg-orange-500",
          icon: AlertCircle,
          message: "Período de votação encerrado",
        };
      }

      // Poll is active and in voting period
      const hoursUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const daysUntilEnd = Math.ceil(hoursUntilEnd / 24);
      
      return {
        status: "ativa",
        label: "Votação Aberta",
        color: "bg-green-500",
        icon: PlayCircle,
        message: daysUntilEnd > 1 
          ? `Encerra em ${daysUntilEnd} dia${daysUntilEnd > 1 ? 's' : ''}`
          : hoursUntilEnd > 1
          ? `Encerra em ${hoursUntilEnd} hora${hoursUntilEnd > 1 ? 's' : ''}`
          : "Encerra em breve",
        hoursUntil: hoursUntilEnd,
      };
    } catch (error) {
      console.error("Erro ao obter status da enquete:", error);
      return {
        status: "encerrada",
        label: "Erro",
        color: "bg-gray-500",
        icon: Lock,
        message: "Erro ao processar enquete",
      };
    }
  };

  // Combine active and closed polls, then sort:
  // 1. First: polls with voting open (ativa and in voting period)
  // 2. Then: sort by end date (closest to ending first)
  const allPolls = [...activePolls, ...closedPolls].sort((a, b) => {
    try {
      const aStatus = getPollStatus(a);
      const bStatus = getPollStatus(b);
      const aIsVotingOpen = aStatus.status === "ativa" && isPollInVotingPeriod(a);
      const bIsVotingOpen = bStatus.status === "ativa" && isPollInVotingPeriod(b);
      
      // If one is voting open and the other isn't, voting open comes first
      if (aIsVotingOpen && !bIsVotingOpen) return -1;
      if (!aIsVotingOpen && bIsVotingOpen) return 1;
      
      // If both are voting open or both aren't, sort by end date (closest first)
      const aEndDate = a.endDate ? new Date(a.endDate).getTime() : 0;
      const bEndDate = b.endDate ? new Date(b.endDate).getTime() : 0;
      return aEndDate - bEndDate;
    } catch (error) {
      console.error("Erro ao ordenar polls:", error);
      return 0;
    }
  });

  const handleSelection = (pollId: string, optionValue: string) => {
    // Extrair o id numérico do valor (formato: "option-0", "option-1", etc)
    const optionId = parseInt(optionValue.replace("option-", ""), 10);
    if (!isNaN(optionId)) {
      // Se a opção já está selecionada, desmarcar (permitir desmarcar)
      if (tempSelections[pollId] === optionId) {
        const newSelections = { ...tempSelections };
        delete newSelections[pollId];
        setTempSelections(newSelections);
      } else {
        // Selecionar nova opção
        setTempSelections({ ...tempSelections, [pollId]: optionId });
      }
    }
  };

  const handleChangeVote = (pollId: string) => {
    // Ativar modo de trocar voto
    setIsChangingVote({ ...isChangingVote, [pollId]: true });
    // Limpar seleção temporária para permitir nova escolha
    const newSelections = { ...tempSelections };
    delete newSelections[pollId];
    setTempSelections(newSelections);
  };

  const handleCancelChangeVote = (pollId: string) => {
    // Cancelar modo de trocar voto e restaurar seleção anterior
    setIsChangingVote({ ...isChangingVote, [pollId]: false });
    // Restaurar a seleção que estava antes (se houver)
    // Por enquanto, apenas limpar a seleção temporária
    const newSelections = { ...tempSelections };
    delete newSelections[pollId];
    setTempSelections(newSelections);
  };

  const handleConfirmVote = async (poll: ActivePoll) => {
    const pollId = poll.id || poll._id;
    if (!pollId) {
      toast.error("ID da enquete não encontrado");
      return;
    }

    // Verificar se o residentId está disponível - extrair do token se necessário
    if (!residentId || residentId.trim() === "") {
      // Tentar extrair do token JWT
      const token = localStorage.getItem("coliseu_access_token") || sessionStorage.getItem("coliseu_access_token");
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.sub || payload.userId) {
              const idFromToken = payload.id || payload.sub || payload.userId;
              setResidentId(String(idFromToken));
              localStorage.setItem("resident_id", String(idFromToken));
            } else {
              toast.error("Não foi possível identificar o resident. Faça login novamente.");
              return;
            }
          } else {
            toast.error("Token inválido. Faça login novamente.");
            return;
          }
        } catch (error: any) {
          console.error("Erro ao decodificar token:", error);
          toast.error("Não foi possível identificar o resident. Faça login novamente.");
          return;
        }
      } else {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }
    }

    const selectedOptionId = tempSelections[pollId];
    
    // Se não há seleção, não precisamos validar a opção
    // Permitir salvar sem seleção para excluir o voto
    let optionId: number | null = null;
    if (selectedOptionId !== undefined && selectedOptionId !== null) {
      // Verificar se a opção selecionada existe e tem id
      // Usar comparação estrita para lidar com id = 0
      const selectedOption = poll.options.find(opt => opt.id !== undefined && opt.id === selectedOptionId);
      if (!selectedOption || (selectedOption.id === undefined && selectedOption.id !== 0)) {
        toast.error("Opção selecionada inválida");
        setIsVoting({ ...isVoting, [pollId]: false });
        return;
      }

      // Garantir que optionId seja um número
      optionId = typeof selectedOption.id === 'number' ? selectedOption.id : Number(selectedOption.id);
      if (isNaN(optionId)) {
        toast.error("ID da opção inválido");
        setIsVoting({ ...isVoting, [pollId]: false });
        return;
      }
    }

    try {
      setIsVoting({ ...isVoting, [pollId]: true });
      
      // Verificar token antes de votar
      const token = localStorage.getItem("coliseu_access_token") || sessionStorage.getItem("coliseu_access_token");
      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        setIsVoting({ ...isVoting, [pollId]: false });
        return;
      }
      
      console.log("Enviando voto:", { pollId, optionId });
      console.log("Token disponível:", !!token);
      console.log("Backend extrairá userId do token JWT");
      
      // O backend extrai o userId do token JWT, então não precisamos enviar residentId no body
      // Se optionId for null, não devemos enviar voto (isso não deve acontecer aqui, mas mantemos a validação)
      if (optionId === null) {
        toast.error("Por favor, selecione uma opção antes de confirmar!");
        setIsVoting({ ...isVoting, [pollId]: false });
        return;
      }
      
      const votePayload = {
        pollId: pollId,
        optionId: optionId,
      };
      
      console.log("Payload do voto:", votePayload);
      
      const response = await pollsService.votePoll(votePayload);

      if (response.success) {
        if (optionId !== null) {
          toast.success("Voto registrado com sucesso!");
          const newVotedPolls = new Set([...votedPolls, pollId]);
          setVotedPolls(newVotedPolls);
          // Salvar o voto confirmado
          const newConfirmedVotes = { ...confirmedVotes, [pollId]: optionId };
          setConfirmedVotes(newConfirmedVotes);
          // Atualizar tempSelections para mostrar como selecionado
          setTempSelections({ ...tempSelections, [pollId]: optionId });
          // Salvar no localStorage para persistir após recarregar a página
          const savedVotes = localStorage.getItem("poll_votes");
          const votes = savedVotes ? JSON.parse(savedVotes) : {};
          votes[pollId] = optionId;
          localStorage.setItem("poll_votes", JSON.stringify(votes));
          // Desativar modo de trocar voto após votar
          setIsChangingVote({ ...isChangingVote, [pollId]: false });
          // Manter a seleção em tempSelections para mostrar como selecionada (já foi atualizada acima)
        } else {
          toast.success("Voto removido com sucesso!");
          // Remover da lista de votados
          const newVotedPolls = new Set(votedPolls);
          newVotedPolls.delete(pollId);
          setVotedPolls(newVotedPolls);
          // Remover voto confirmado
          const newConfirmedVotes = { ...confirmedVotes };
          delete newConfirmedVotes[pollId];
          setConfirmedVotes(newConfirmedVotes);
          // Remover também de tempSelections
          const newSelections = { ...tempSelections };
          delete newSelections[pollId];
          setTempSelections(newSelections);
          // Remover do localStorage
          const savedVotes = localStorage.getItem("poll_votes");
          if (savedVotes) {
            const votes = JSON.parse(savedVotes);
            delete votes[pollId];
            localStorage.setItem("poll_votes", JSON.stringify(votes));
          }
          // Desativar modo de trocar voto após remover
          setIsChangingVote({ ...isChangingVote, [pollId]: false });
        }
        
        // Recarregar as polls para atualizar os votos
        const year = selectedYear;
        const month = selectedMonth;
        
        const activeParams: any = { buildingId };
        if (month && !isNaN(month) && month > 0 && month <= 12) {
          activeParams.month = month;
        }
        if (year && !isNaN(year) && year > 0) {
          activeParams.year = year;
        }
        activeParams.status = ["ATIVO"];
        
        try {
          const activeResponse = await pollsService.getPolls(activeParams);
          if (activeResponse.success) {
            const polls = activeResponse.data || [];
            setActivePolls(polls);
            
            // Buscar votos atualizados da API para todas as polls
            const newVotedPolls = new Set<string>();
            const newConfirmedVotes: { [key: string]: number } = {};
            
            // Buscar votos de todas as polls em paralelo
            const votePromises = polls.map(async (poll: ActivePoll) => {
              const pollId = poll.id || poll._id || "";
              if (!pollId) return null;
              
              try {
                const voteResponse = await pollsService.getMyVote(pollId);
                if (voteResponse.success && voteResponse.data) {
                  return {
                    pollId,
                    optionId: voteResponse.data.optionId,
                  };
                }
              } catch (error: any) {
                // Se o erro for 404, significa que o usuário não votou nessa poll ainda
                if (error instanceof ApiClientError && error.statusCode === 404) {
                  console.log(`Usuário ainda não votou na poll ${pollId}`);
                } else {
                  console.warn(`Erro ao buscar voto da poll ${pollId}:`, error);
                }
              }
              return null;
            });
            
            // Aguardar todas as requisições
            const voteResults = await Promise.all(votePromises);
            
            // Processar os resultados
            voteResults.forEach((result) => {
              if (result) {
                newVotedPolls.add(result.pollId);
                newConfirmedVotes[result.pollId] = result.optionId;
              }
            });
            
            // Atualizar localStorage com os votos obtidos da API
            localStorage.setItem("poll_votes", JSON.stringify(newConfirmedVotes));
            
            setVotedPolls(newVotedPolls);
            setConfirmedVotes(newConfirmedVotes);
            // Atualizar tempSelections também para manter a seleção visível
            setTempSelections(newConfirmedVotes);
          }
        } catch (reloadError) {
          console.error("Erro ao recarregar enquetes:", reloadError);
        }
      } else {
        toast.error(response.message || "Erro ao registrar voto");
      }
    } catch (error: any) {
      console.error("Erro ao votar:", error);
      if (error instanceof ApiClientError) {
        toast.error(error.message || "Erro ao registrar voto");
      } else {
        toast.error("Erro ao registrar voto. Tente novamente.");
      }
    } finally {
      setIsVoting({ ...isVoting, [pollId]: false });
    }
  };

  const hasVoted = (pollId: string) => {
    return votedPolls.has(pollId);
  };

  // Helper function to format time remaining
  const formatTimeRemaining = (poll: ActivePoll | FinishedCancelledPoll) => {
    try {
      const now = new Date();
      const startDate = new Date(poll.startDate);
      const endDate = new Date(poll.endDate);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "Data inválida";
      }
      
      if (now < startDate) {
        const diff = startDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          return `Inicia em ${days} dia${days > 1 ? 's' : ''}${hours > 0 ? ` e ${hours}h` : ''}`;
        }
        return `Inicia em ${hours}h`;
      }
      
      if (now > endDate) {
        return "Período encerrado";
      }
      
      const diff = endDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes}m restantes`;
      }
      return `${minutes} min restantes`;
    } catch (error) {
      console.error("Erro ao formatar tempo restante:", error);
      return "Tempo não disponível";
    }
  };

  if (isLoading) {
    return <PollSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enquetes</h1>
          <p className="text-muted-foreground mt-1">
            Vote nas enquetes do condomínio - 1 voto por apartamento
          </p>
        </div>
        <div className="flex gap-2">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => setSelectedMonth(Number(value))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {allMonths.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                {allPolls.length}
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
                {allPolls.filter((p) => {
                  const pollId = p.id || p._id;
                  return pollId ? hasVoted(pollId) : false;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <p className="text-xl font-bold text-muted-foreground">
                {activePolls.length > 0 ? "Ativas" : "Encerradas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Polls List */}
      <div className="space-y-6">
        {allPolls.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                Nenhuma enquete encontrada para o período selecionado
              </p>
            </CardContent>
          </Card>
        ) : (
          allPolls.map((poll) => {
            const pollId = poll.id || poll._id || "";
            const isActive = isPollActive(poll);
            const hasVotedInPoll = hasVoted(pollId);
            const pollStatus = getPollStatus(poll);
            const canVote = isActive && isPollInVotingPeriod(poll) && !hasVotedInPoll;
            const StatusIcon = pollStatus.icon;
            
            return (
              <Card
                key={pollId}
                className={`transition-all ${
                  hasVotedInPoll
                    ? "border-2 border-accent bg-accent/5"
                    : pollStatus.status === "ativa"
                    ? "border-2 border-green-500/30 bg-green-50/30"
                    : pollStatus.status === "aguardando"
                    ? "border-2 border-blue-500/30 bg-blue-50/30"
                    : pollStatus.status === "fora_periodo"
                    ? "border-2 border-orange-500/30 bg-orange-50/30 opacity-75"
                    : "opacity-75"
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <CardTitle className="text-xl flex-1">
                          {poll.description}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {hasVotedInPoll && (
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Você votou
                            </Badge>
                          )}
                          <Badge 
                            className={`${pollStatus.color} text-white flex items-center gap-1.5 px-3 py-1`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {pollStatus.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{poll.votes}</span>
                        <span>voto{poll.votes !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {/* Date Info - lado a lado */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg border">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Início</p>
                            <p className="font-medium text-sm truncate">
                              {new Date(poll.startDate).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg border">
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Término</p>
                            <p className="font-medium text-sm truncate">
                              {new Date(poll.endDate).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Se já votou e não está trocando voto, mostrar apenas barras de progresso */}
                  {hasVotedInPoll && !isChangingVote[pollId] && pollStatus.status === "ativa" && (
                    <>
                      <div className="space-y-3 mb-4">
                        {poll.options.map((option, idx) => {
                          const optionId = option.id !== undefined && option.id !== null ? option.id : idx;
                          // Verificar se esta opção foi a última votada (usando confirmedVotes)
                          const wasVoted = confirmedVotes[pollId] === optionId;
                          return (
                            <div key={`option-${optionId}`} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className={`font-medium ${wasVoted ? 'text-accent' : ''}`}>
                                  {option.description}
                                  {wasVoted && (
                                    <span className="ml-2 text-accent">(Seu voto)</span>
                                  )}
                                </span>
                                <span className="text-muted-foreground">
                                  {option.votes} votos ({option.percent}%)
                                </span>
                              </div>
                              <Progress value={option.percent} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleChangeVote(pollId)}
                          variant="outline"
                          className="flex-1"
                        >
                          Trocar Voto
                        </Button>
                        <Button
                          onClick={async () => {
                            // Anular voto usando DELETE
                            try {
                              setIsVoting({ ...isVoting, [pollId]: true });
                              const response = await pollsService.cancelVote(pollId);
                              if (response.success) {
                                toast.success("Voto anulado com sucesso!");
                                const newVotedPolls = new Set(votedPolls);
                                newVotedPolls.delete(pollId);
                                setVotedPolls(newVotedPolls);
                                // Remover voto confirmado
                                const newConfirmedVotes = { ...confirmedVotes };
                                delete newConfirmedVotes[pollId];
                                setConfirmedVotes(newConfirmedVotes);
                                // Remover também de tempSelections
                                const newSelections = { ...tempSelections };
                                delete newSelections[pollId];
                                setTempSelections(newSelections);
                                // Remover do localStorage
                                const savedVotes = localStorage.getItem("poll_votes");
                                if (savedVotes) {
                                  const votes = JSON.parse(savedVotes);
                                  delete votes[pollId];
                                  localStorage.setItem("poll_votes", JSON.stringify(votes));
                                }
                                // Recarregar polls
                                const activeParams: any = { buildingId, status: ["ATIVO"] };
                                if (selectedMonth && !isNaN(selectedMonth) && selectedMonth > 0 && selectedMonth <= 12) {
                                  activeParams.month = selectedMonth;
                                }
                                if (selectedYear && !isNaN(selectedYear) && selectedYear > 0) {
                                  activeParams.year = selectedYear;
                                }
                                const activeResponse = await pollsService.getPolls(activeParams);
                                if (activeResponse.success) {
                                  const polls = activeResponse.data || [];
                                  setActivePolls(polls);
                                  
                                  // Buscar votos atualizados da API para todas as polls
                                  const updatedVotedPolls = new Set<string>();
                                  const updatedConfirmedVotes: { [key: string]: number } = {};
                                  
                                  // Buscar votos de todas as polls em paralelo
                                  const votePromises = polls.map(async (poll: ActivePoll) => {
                                    const pId = poll.id || poll._id || "";
                                    if (!pId) return null;
                                    
                                    try {
                                      const voteResponse = await pollsService.getMyVote(pId);
                                      if (voteResponse.success && voteResponse.data) {
                                        return {
                                          pollId: pId,
                                          optionId: voteResponse.data.optionId,
                                        };
                                      }
                                    } catch (error: any) {
                                      // Se o erro for 404, significa que o usuário não votou nessa poll ainda
                                      if (error instanceof ApiClientError && error.statusCode === 404) {
                                        console.log(`Usuário não votou na poll ${pId}`);
                                      } else {
                                        console.warn(`Erro ao buscar voto da poll ${pId}:`, error);
                                      }
                                    }
                                    return null;
                                  });
                                  
                                  // Aguardar todas as requisições
                                  const voteResults = await Promise.all(votePromises);
                                  
                                  // Processar os resultados
                                  voteResults.forEach((result) => {
                                    if (result) {
                                      updatedVotedPolls.add(result.pollId);
                                      updatedConfirmedVotes[result.pollId] = result.optionId;
                                    }
                                  });
                                  
                                  // Atualizar localStorage com os votos obtidos da API
                                  localStorage.setItem("poll_votes", JSON.stringify(updatedConfirmedVotes));
                                  
                                  setVotedPolls(updatedVotedPolls);
                                  setConfirmedVotes(updatedConfirmedVotes);
                                  // Atualizar tempSelections também
                                  setTempSelections(updatedConfirmedVotes);
                                }
                              } else {
                                toast.error(response.message || "Erro ao anular voto");
                              }
                            } catch (error: any) {
                              console.error("Erro ao anular voto:", error);
                              if (error instanceof ApiClientError) {
                                toast.error(error.response.message || "Erro ao anular voto");
                              } else {
                                toast.error("Erro ao anular voto");
                              }
                            } finally {
                              setIsVoting({ ...isVoting, [pollId]: false });
                            }
                          }}
                          variant="outline"
                          disabled={isVoting[pollId]}
                          className="flex-1"
                        >
                          {isVoting[pollId] ? "Anulando..." : "Anular Voto"}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Se não votou ainda ou está trocando voto, mostrar RadioGroup - apenas se estiver no período de votação */}
                  {pollStatus.status === "ativa" && isPollInVotingPeriod(poll) && (!hasVotedInPoll || isChangingVote[pollId]) && (
                    <>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-3">
                          {isChangingVote[pollId] ? "Selecione uma nova opção:" : "Selecione uma opção:"}
                        </p>
                        <RadioGroup
                          value={
                            // Se está trocando voto, usar apenas tempSelections
                            // Se não está trocando voto e já votou, mostrar o voto confirmado
                            isChangingVote[pollId]
                              ? (tempSelections[pollId] !== undefined ? `option-${tempSelections[pollId]}` : "")
                              : (tempSelections[pollId] !== undefined 
                                  ? `option-${tempSelections[pollId]}` 
                                  : confirmedVotes[pollId] !== undefined
                                  ? `option-${confirmedVotes[pollId]}`
                                  : "")
                          }
                          onValueChange={(value) => handleSelection(pollId, value)}
                        >
                          <div className="space-y-3">
                            {poll.options.map((option, idx) => {
                              const optionId = option.id !== undefined && option.id !== null ? option.id : idx;
                              const optionValue = `option-${optionId}`;
                              // Verificar se está selecionado em tempSelections ou confirmedVotes (para mostrar quando já votou)
                              const isCurrentlySelected = tempSelections[pollId] === optionId || 
                                                         (!isChangingVote[pollId] && confirmedVotes[pollId] === optionId);
                              return (
                                <div
                                  key={optionValue}
                                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                    isCurrentlySelected 
                                      ? 'border-accent bg-accent/5' 
                                      : 'hover:bg-accent/5'
                                  }`}
                                >
                                  <RadioGroupItem
                                    value={optionValue}
                                    id={`${pollId}-${optionValue}`}
                                  />
                                  <Label
                                    htmlFor={`${pollId}-${optionValue}`}
                                    className="flex-1 cursor-pointer"
                                  >
                                    {option.description}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex gap-2">
                        {isChangingVote[pollId] && (
                          <Button
                            onClick={() => handleCancelChangeVote(pollId)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleConfirmVote(poll as ActivePoll)}
                          disabled={isVoting[pollId] || (tempSelections[pollId] === undefined && !isChangingVote[pollId])}
                          className={isChangingVote[pollId] ? "flex-1" : "w-full"}
                        >
                          {isVoting[pollId] 
                            ? "Processando..." 
                            : isChangingVote[pollId]
                            ? "Confirmar Voto"
                            : tempSelections[pollId] !== undefined && tempSelections[pollId] !== null
                            ? "Confirmar Voto"
                            : "Selecione uma opção"}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Mostrar mensagem quando fora do período ou encerrada */}
                  {(pollStatus.status === "aguardando" || pollStatus.status === "fora_periodo" || pollStatus.status === "encerrada") && (
                    <div className={`p-4 rounded-lg border-2 ${
                      pollStatus.status === "aguardando"
                        ? "bg-blue-50 border-blue-200"
                        : pollStatus.status === "fora_periodo"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`w-5 h-5 mt-0.5 ${
                          pollStatus.status === "aguardando"
                            ? "text-blue-600"
                            : pollStatus.status === "fora_periodo"
                            ? "text-orange-600"
                            : "text-gray-600"
                        }`} />
                        <div className="flex-1">
                          <p className={`font-semibold mb-1 ${
                            pollStatus.status === "aguardando"
                              ? "text-blue-900"
                              : pollStatus.status === "fora_periodo"
                              ? "text-orange-900"
                              : "text-gray-900"
                          }`}>
                            {pollStatus.status === "aguardando" 
                              ? "Votação ainda não iniciou"
                              : pollStatus.status === "fora_periodo"
                              ? "Período de votação encerrado"
                              : "Enquete encerrada"}
                          </p>
                          <p className={`text-sm ${
                            pollStatus.status === "aguardando"
                              ? "text-blue-700"
                              : pollStatus.status === "fora_periodo"
                              ? "text-orange-700"
                              : "text-gray-700"
                          }`}>
                            {pollStatus.status === "aguardando"
                              ? `A votação começará em ${new Date(poll.startDate).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : pollStatus.status === "fora_periodo"
                              ? "O período de votação já terminou. Você pode visualizar os resultados abaixo."
                              : "Esta enquete foi encerrada. Você pode visualizar os resultados abaixo."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mostrar apenas barras de progresso para polls encerradas ou fora do período */}
                  {(pollStatus.status === "encerrada" || pollStatus.status === "fora_periodo" || pollStatus.status === "aguardando") && poll.votes > 0 && (
                    <div className="space-y-3">
                      {poll.options.map((option, idx) => {
                        const optionId = option.id !== undefined && option.id !== null ? option.id : idx;
                        const isSelected = tempSelections[pollId] !== undefined && tempSelections[pollId] === optionId;
                        return (
                          <div key={`option-${optionId}`} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${isSelected && hasVotedInPoll ? 'text-accent' : ''}`}>
                                {option.description}
                                {isSelected && hasVotedInPoll && (
                                  <span className="ml-2 text-accent">(Seu voto)</span>
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {option.votes} votos ({option.percent}%)
                              </span>
                            </div>
                            <Progress value={option.percent} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}


                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
