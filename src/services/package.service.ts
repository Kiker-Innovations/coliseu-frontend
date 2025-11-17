export type CreatePackageRequest = {
  ownerName?: string;
  apartmentId: string;
  description?: string;
  courierName?: string;
  receiverDate: string;
  receiverConciergeId: string;
};

export type CreatePackageResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    ownerName: string;
    description: string;
  };
};

export type PendingPackage = {
  _id: string;
  ownerName: string;
  description: string;
  apartmentNumber: string;
  receiverDate: string;
  receiverConciergeName: string;
  courierName?: string;
};

export type DeliveredPackage = {
  _id: string;
  ownerName: string;
  description: string;
  apartmentNumber: string;
  receiverDate?: string;
  deliveryDate: string;
  recipientName: string;
  deliveryConciergeName: string;
  courierName?: string; // Nome da transportadora/entregador que entregou o produto na portaria
};

export type Package = {
  _id: string;
  apartmentId: string;
  receiverConciergeId: string;
  deliveryConciergeId?: string;
  ownerName: string;
  courierName?: string;
  recipientName?: string;
  description: string;
  receiverDate: string;
  deliveryDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  apartmentNumber?: string;
  receiverConciergeName?: string;
  deliveryConciergeName?: string;
};

export type ConfirmDeliveryRequest = {
  recipientName?: string;
  deliveryConciergeId: string;
};

export type CancelledPackage = {
  _id: string;
  ownerName: string;
  description: string;
  courierName?: string;
  apartmentNumber: string;
  receiverDate: string;
  cancelReason: string;
  cancelledConciergeId: string;
  cancelledAt: string;
  cancelledByName: string;
};

export type CancelPackageRequest = {
  cancelReason: string;
  cancelledConciergeId: string;
};

export async function createPackage(
  payload: CreatePackageRequest,
): Promise<CreatePackageResponse> {
  try {
    // Get concierge token
    const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      "http://localhost:3000/api/coliseu/v1/packages",
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      let message = "Erro ao cadastrar encomenda";
      let errorDetails: any = null;
      try {
        const data = await response.json();
        message = data?.message || message;
        errorDetails = data;
        
        // Se houver detalhes de validação, mostrar mais informações
        if (data.errors || data.validationErrors) {
          console.error("Erros de validação:", data.errors || data.validationErrors);
          message = `${message}. ${JSON.stringify(data.errors || data.validationErrors)}`;
        }
      } catch {}
      
      // Log error details for debugging
      console.error("Erro ao criar pacote:", {
        status: response.status,
        statusText: response.statusText,
        payload: JSON.stringify(payload, null, 2),
        errorDetails,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      throw new Error(message);
    }

    return response.json();
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function getPendingPackages(): Promise<PendingPackage[]> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/packages/pending",
    );

    if (!res.ok) {
      let message = "Erro ao carregar encomendas pendentes";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

    return arr as PendingPackage[];
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

/**
 * Busca todos os pacotes entregues
 * A API deve retornar o campo courierName para indicar quem entregou o produto na portaria
 */
export async function getDeliveredPackages(): Promise<DeliveredPackage[]> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/packages/delivered",
    );

    if (!res.ok) {
      let message = "Erro ao carregar encomendas entregues";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

    return arr as DeliveredPackage[];
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function getPackageById(id: string): Promise<Package> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/coliseu/v1/packages/${id}`,
    );

    if (!res.ok) {
      let message = "Erro ao carregar encomenda";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const item = data && ((data as any).data || data);
    if (!item) throw new Error("Encomenda não encontrada");

    return item as Package;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function confirmPackageDelivery(
  id: string,
  payload: ConfirmDeliveryRequest,
): Promise<Package> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/coliseu/v1/packages/${id}/confirm-delivery`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      let message = "Erro ao confirmar entrega";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const item = data && ((data as any).data || data);
    if (!item) throw new Error("Erro ao processar resposta");

    return item as Package;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export type PackageStats = {
  totalPendings: number;
  totalConfirmed: number;
  totalPendingsWeek: number;
};

export type PackageStatsResponse = {
  success: boolean;
  message: string;
  data: PackageStats;
};

export async function getPackageStats(): Promise<PackageStats> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/packages/stats",
    );

    if (!res.ok) {
      let message = "Erro ao carregar estatísticas";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const response: PackageStatsResponse = await res.json();
    return response.data || response as any;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function cancelPackage(
  id: string,
  payload: CancelPackageRequest,
): Promise<Package> {
  try {
    // Get concierge token
    const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(
      `http://localhost:3000/api/coliseu/v1/packages/${id}/cancel`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      let message = "Erro ao cancelar encomenda";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const item = data && ((data as any).data || data);
    if (!item) throw new Error("Erro ao processar resposta");

    return item as Package;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function getCancelledPackages(days?: number): Promise<CancelledPackage[]> {
  try {
    // Get concierge token
    const token = localStorage.getItem("concierge_token") || localStorage.getItem("coliseu_access_token");
    
    const headers: HeadersInit = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = days 
      ? `http://localhost:3000/api/coliseu/v1/packages/cancelled?days=${days}`
      : "http://localhost:3000/api/coliseu/v1/packages/cancelled";

    const res = await fetch(url, { headers });

    if (!res.ok) {
      let message = "Erro ao carregar encomendas canceladas";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

    return arr as CancelledPackage[];
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

