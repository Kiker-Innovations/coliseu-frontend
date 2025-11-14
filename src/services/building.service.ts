export type Building = {
  _id: string;
  name: string;
  cnpj: string;
  state: string;
  city: string;
  address: string;
  addressNumber: number;
  zipCode: string;
  complement?: string;
  phone: string;
  floorCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BuildingsResponse = {
  success: boolean;
  message: string;
  data: Building[];
};

export async function listBuildings(): Promise<Building[]> {
  try {
    const res = await fetch("http://localhost:3000/api/coliseu/v1/buildings");

    if (!res.ok) {
      let message = "Erro ao carregar condomínios";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const response = data as BuildingsResponse;
    
    const arr = Array.isArray(response.data)
      ? response.data
      : Array.isArray(data)
      ? data
      : [];

    return arr as Building[];
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

