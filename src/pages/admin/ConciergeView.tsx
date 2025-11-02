import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConciergeSkeleton from "@/skeleton/admin/ConciergeSkeleton";
import { getConcierge } from "@/services/concierge.service";
import { toast } from "sonner";

export default function ConciergeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await getConcierge(id);
        setData(res);
      } catch (e: any) {
        console.error("Erro ao carregar porteiro:", e);
        const errorMessage = e?.message || "Erro ao carregar porteiro. Tente novamente.";
        toast.error(errorMessage);
        // Se houver erro, volta para a lista após 2 segundos
        setTimeout(() => {
          navigate("/admin/concierge");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const statusBadge = useMemo(() => {
    const status: string = (data?.status || "").toUpperCase();
    const map: Record<string, string> = {
      INATIVO: "bg-red-500/10 text-red-600 border-red-500/30",
      VALIDADO: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      ATIVO: "bg-green-500/10 text-green-600 border-green-500/30",
      "DE FERIAS": "bg-amber-500/10 text-amber-600 border-amber-500/30",
      "DE_FERIAS": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    };
    const cls = map[status] || "bg-muted text-foreground border-transparent";
    const displayStatus = status === "DE_FERIAS" ? "DE FERIAS" : status;
    return (
      <Badge variant="secondary" className={`border ${cls}`}>
        {displayStatus || "—"}
      </Badge>
    );
  }, [data]);

  if (isLoading) return <ConciergeSkeleton />;

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Porteiro</h1>
            <p className="text-muted-foreground">Visualização dos dados do porteiro</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/concierge")}>Voltar</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Não foi possível carregar os dados do porteiro.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detalhes do Porteiro</h1>
          <p className="text-muted-foreground">Visualização dos dados do porteiro</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/concierge")}>Voltar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{data?.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{data?.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{data?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Turno</p>
              <p className="font-medium">{data?.shift || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{statusBadge}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="font-medium">{data?.createdAt ? new Date(data.createdAt).toLocaleString("pt-BR") : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atualizado em</p>
              <p className="font-medium">{data?.updatedAt ? new Date(data.updatedAt).toLocaleString("pt-BR") : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


