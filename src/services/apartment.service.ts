export type Apartment = {
  _id: string;
  number: string;
  buildingId: string;
  floor?: number;
  block?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApartmentsResponse = {
  success: boolean;
  message: string;
  data: Apartment[];
};

/**
 * Lista todos os apartamentos de um condomínio
 */
export async function listApartments(buildingId: string): Promise<Apartment[]> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/coliseu/v1/buildings/${buildingId}/apartments`
    );

    if (!res.ok) {
      let message = "Erro ao carregar apartamentos";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await res.json();
    const response = data as ApartmentsResponse;
    
    const arr = Array.isArray(response.data)
      ? response.data
      : Array.isArray(data)
      ? data
      : [];

    return arr as Apartment[];
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

/**
 * Busca um apartamento pelo número e buildingId
 */
export async function getApartmentByNumber(
  buildingId: string,
  apartmentNumber: string
): Promise<Apartment | null> {
  try {
    const apartments = await listApartments(buildingId);
    const apartment = apartments.find(
      (apt) => apt.number === apartmentNumber
    );
    return apartment || null;
  } catch (error: any) {
    throw error;
  }
}

