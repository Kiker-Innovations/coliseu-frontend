import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle2, Clock, User } from "lucide-react";
import DashboardSkeleton from "@/skeleton/concierge/DashboardSkeleton";

export default function ConciergeDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Mock data
  const stats = {
    pendingPackages: 12,
    deliveredToday: 8,
    totalToday: 20,
  };

  const pendingPackages = [
    {
      id: 1,
      recipientName: "João Silva Santos",
      description: "Caixa grande - Amazon",
      apartment: "101",
      arrivalDate: "2025-10-20T09:30:00",
    },
    {
      id: 2,
      recipientName: "Maria Oliveira Costa",
      description: "Envelope - Correios",
      apartment: "102",
      arrivalDate: "2025-10-20T10:15:00",
    },
    {
      id: 3,
      recipientName: "Pedro Henrique Souza",
      description: "Caixa média - Mercado Livre",
      apartment: "103",
      arrivalDate: "2025-10-20T11:00:00",
    },
    {
      id: 4,
      recipientName: "Ana Paula Ferreira",
      description: "Caixa pequena - Shopee",
      apartment: "201",
      arrivalDate: "2025-10-19T16:45:00",
    },
    {
      id: 5,
      recipientName: "Carlos Eduardo Lima",
      description: "Envelope - Sedex",
      apartment: "202",
      arrivalDate: "2025-10-19T14:20:00",
    },
  ];

  const apartmentWithMostPackages = {
    apartment: "202",
    packageCount: 5,
    residents: [
      {
        name: "Carlos Eduardo Lima",
        email: "carlos.lima@email.com",
        phone: "(11) 98765-4321",
      },
    ],
  };

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
                  {stats.pendingPackages}
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
                  {stats.deliveredToday}
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
                <p className="text-sm text-muted-foreground">Total Hoje</p>
                <p className="text-3xl font-bold text-primary">
                  {stats.totalToday}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Packages List */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingPackages.map((pkg) => (
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
                      {pkg.description}
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Apartment with Most Packages */}
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
                  {apartmentWithMostPackages.packageCount} encomendas pendentes
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Moradores:</p>
              {apartmentWithMostPackages.residents.map((resident, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg bg-card space-y-2"
                >
                  <p className="font-medium text-lg">{resident.name}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>📧 {resident.email}</p>
                    <p>📱 {resident.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
