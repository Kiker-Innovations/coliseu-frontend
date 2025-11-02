export type RegisterConciergeRequest = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  shift: "MANHA" | "TARDE" | "NOITE";
  status?: "ATIVO" | "INATIVO" | "DE_FERIAS" | string;
};

export async function registerConcierge(payload: RegisterConciergeRequest) {
  try {
    const response = await fetch(
      "http://localhost:3000/api/coliseu/v1/concierges",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      let message = "Erro ao cadastrar porteiro";
      try {
        const data = await response.json();
        message = data?.message || message;
      } catch {}
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

export type Concierge = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  shift: "MANHA" | "TARDE" | "NOITE";
  status?: "INATIVO" | "VALIDADO" | "ATIVO" | "DE_FERIAS" | string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getConcierge(id: string | number): Promise<Concierge> {
  try {
    const res = await fetch(`http://localhost:3000/api/coliseu/v1/concierges/${id}`);
    
    if (!res.ok) {
      let message = "Erro ao carregar porteiro";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }
    
    const data = await res.json();
    const item = data && ((data as any).data || data);
    if (!item) throw new Error("Porteiro não encontrado");
    // Normalize id field from _id/id/uuid
    return {
      id: item._id ?? item.id ?? item.uuid,
      name: item.name,
      email: item.email,
      phone: item.phone,
      shift: item.shift,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    } as Concierge;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function listConcierges(): Promise<Concierge[]> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/concierges",
    );
    if (!res.ok) {
      let message = "Erro ao listar porteiros";
      try {
        const errorData = await res.json();
        message = errorData?.message || message;
      } catch {}
      throw new Error(message);
    }
    const data = await res.json();
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];
    // Normalize id field from _id/id/uuid
    return (arr as any[]).map((i) => ({
      id: i._id ?? i.id ?? i.uuid,
      name: i.name,
      email: i.email,
      phone: i.phone,
      shift: i.shift,
      status: i.status,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })) as Concierge[];
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export type UpdateConciergeRequest = {
  name: string;
  email: string;
  phone: string;
  shift: "MANHA" | "TARDE" | "NOITE";
  status?: "ATIVO" | "INATIVO" | "DE_FERIAS" | string;
};

export async function updateConcierge(
  id: string | number,
  payload: UpdateConciergeRequest,
): Promise<Concierge> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/coliseu/v1/concierges/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      let message = "Erro ao atualizar porteiro";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }
    const data = await res.json();
    const item = data && ((data as any).data || data);
    // Normalize id field from _id/id/uuid
    return {
      id: item._id ?? item.id ?? item.uuid,
      name: item.name,
      email: item.email,
      phone: item.phone,
      shift: item.shift,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    } as Concierge;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function deleteConcierge(id: string | number): Promise<void> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/coliseu/v1/concierges/${id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      let message = "Erro ao deletar porteiro";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function forgetPasswordConcierge(email: string): Promise<void> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/concierges/forget-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );
    if (!res.ok) {
      let message = "Erro ao solicitar redefinição de senha";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export async function resetPasswordConcierge(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/concierges/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      },
    );
    if (!res.ok) {
      let message = "Erro ao redefinir senha";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}

export type LoginConciergeRequest = {
  email: string;
  password: string;
};

export type LoginConciergeResponse = {
  token?: string;
  user?: any;
  message?: string;
};

export async function loginConcierge(
  payload: LoginConciergeRequest,
): Promise<LoginConciergeResponse> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/coliseu/v1/concierges/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      let message = "Erro ao fazer login";
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(message);
    }
    const data = await res.json();
    return (data && (data.data || data)) as LoginConciergeResponse;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Erro de conexão. Verifique se o servidor está rodando.");
    }
    throw error;
  }
}


