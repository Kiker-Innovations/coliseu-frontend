import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle2, Clock, User, ExternalLink } from "lucide-react";
import DashboardSkeleton from "@/skeleton/concierge/DashboardSkeleton";
import { toast } from "sonner";
import {
  packageService,
  type PendingPackage,
  type PackageStats,
} from "@/services/api";

interface PackageData {
  id: string;
  recipientName: string;
  description: string;
  apartment: string;
  arrivalDate: string;
}

export default function ConciergeDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPackages, setPendingPackages] = useState<PackageData[]>([]);
  const [stats, setStats] = useState<PackageStats>({
    totalPendings: 0,
    totalConfirmed: 0,
    totalPendingsWeek: 0,
  });
  const [apartmentWithMostPackages, setApartmentWithMostPackages] = useState<{
    apartment: string;
    packageCount: number;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [pendingResponse, packageStatsResponse] = await Promise.all([
          packageService.getPendingPackages(),
          packageService.getPackageStats(),
        ]);
        
        const pending = pendingResponse.data || [];
        const packageStats = packageStatsResponse.data || {
          totalPendings: 0,
          totalConfirmed: 0,
          totalPendingsWeek: 0,
        };

        // Map pending packages
        const pendingMapped: PackageData[] = pending.map((pkg) => ({
          id: pkg._id,
          recipientName: pkg.ownerName,
          description: pkg.description,
          apartment: pkg.apartmentNumber,
          arrivalDate: pkg.receiverDate,
        }));

        // Calculate apartment with most packages
        const apartmentCounts: { [key: string]: number } = {};
        pendingMapped.forEach((pkg) => {
          apartmentCounts[pkg.apartment] = (apartmentCounts[pkg.apartment] || 0) + 1;
        });

        const sortedApartments = Object.entries(apartmentCounts).sort(
          (a, b) => b[1] - a[1]
        );

        if (sortedApartments.length > 0) {
          const [apartment, count] = sortedApartments[0];
          setApartmentWithMostPackages({
            apartment,
            packageCount: count,
          });
        }

        setPendingPackages(pendingMapped);
        setStats(packageStats);
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar dados do dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard da Portaria</h1>
        <p className="text-muted-foreground">
          Visão geral das encomendas e atividades do dia
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Entregar</p>
                <p className="text-3xl font-bold text-destructive">
                  {stats.totalPendings}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregues Hoje</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalConfirmed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregues nesta semana</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalPendingsWeek}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Packages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Encomendas Pendentes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/concierge/packages")}
              className="gap-2"
            >
              Ver todas
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingPackages.length === 0 ? (
              <div className="p-4 border rounded-lg text-center text-muted-foreground">
                Nenhuma encomenda pendente encontrada
              </div>
            ) : (
              pendingPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{pkg.recipientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.description || "Sem descrição"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chegou em:{" "}
                        {new Date(pkg.arrivalDate).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">Apto {pkg.apartment}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Apartment with Most Packages */}
      {apartmentWithMostPackages && (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Apartamento com Mais Encomendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-2xl font-bold">
                    Apartamento {apartmentWithMostPackages.apartment}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {apartmentWithMostPackages.packageCount} encomenda(s) pendente(s)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
