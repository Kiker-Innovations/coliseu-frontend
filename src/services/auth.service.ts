/**
 * Mock Auth Service
 * Este serviço simula um backend de autenticação.
 * Substitui a integração com Supabase por dados mockados.
 *
 * TODO: Conectar com backend real quando disponível
 */

interface User {
	id: string;
	email: string;
	apartmentNumber: string;
	phone: string;
	createdAt: string;
}

interface SignInCredentials {
	email: string;
	password: string;
}

interface SignUpData {
	email: string;
	password: string;
	apartmentNumber: string;
	phone: string;
	photo?: File;
}

interface AuthResponse {
	data?: {
		user: User | null;
	};
	error: Error | null;
}

class AuthService {
	private users: Map<string, { password: string; user: User }>;
	private currentUser: User | null = null;
	private readonly SESSION_KEY = "auth_session";

	constructor() {
		this.users = new Map();
		// Usuário de exemplo para testes
		this.users.set("test@example.com", {
			password: "test123",
			user: {
				id: "1",
				email: "test@example.com",
				apartmentNumber: "101",
				phone: "(11) 99999-9999",
				createdAt: new Date().toISOString(),
			},
		});

		// Restaurar sessão se existir
		this.loadSession();
	}

	private loadSession(): void {
		const sessionData = localStorage.getItem(this.SESSION_KEY);
		if (sessionData) {
			try {
				this.currentUser = JSON.parse(sessionData);
			} catch (error) {
				console.error("Erro ao carregar sessão:", error);
				localStorage.removeItem(this.SESSION_KEY);
			}
		}
	}

	private saveSession(user: User): void {
		localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
		this.currentUser = user;
	}

	private clearSession(): void {
		localStorage.removeItem(this.SESSION_KEY);
		this.currentUser = null;
	}

	/**
	 * Simula login com email e senha
	 */
	async signInWithPassword(
		credentials: SignInCredentials,
	): Promise<AuthResponse> {
		// Simula delay de rede
		await this.delay(500);

		const userRecord = this.users.get(credentials.email);

		if (!userRecord || userRecord.password !== credentials.password) {
			return {
				error: new Error("Email ou senha inválidos"),
			};
		}

		this.saveSession(userRecord.user);

		return {
			data: {
				user: userRecord.user,
			},
			error: null,
		};
	}

	/**
	 * Simula cadastro de novo usuário
	 */
	async signUp(data: SignUpData): Promise<AuthResponse> {
		// Simula delay de rede
		await this.delay(800);

		if (this.users.has(data.email)) {
			return {
				error: new Error("Este email já está cadastrado"),
			};
		}

		const newUser: User = {
			id: Date.now().toString(),
			email: data.email,
			apartmentNumber: data.apartmentNumber,
			phone: data.phone,
			createdAt: new Date().toISOString(),
		};

		this.users.set(data.email, {
			password: data.password,
			user: newUser,
		});

		return {
			data: {
				user: newUser,
			},
			error: null,
		};
	}

	/**
	 * Simula recuperação de senha
	 */
	async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
		// Simula delay de rede
		await this.delay(600);

		if (!this.users.has(email)) {
			return {
				error: new Error("Email não encontrado"),
			};
		}

		// Em um backend real, seria enviado um email
		console.log(`[MOCK] Email de recuperação seria enviado para: ${email}`);

		return {
			error: null,
		};
	}

	/**
	 * Retorna o usuário atualmente autenticado
	 */
	getCurrentUser(): User | null {
		return this.currentUser;
	}

	/**
	 * Realiza logout
	 */
	async signOut(): Promise<void> {
		await this.delay(300);
		this.clearSession();
	}

	/**
	 * Verifica se há um usuário autenticado
	 */
	isAuthenticated(): boolean {
		return this.currentUser !== null;
	}

	/**
	 * Simula delay de rede
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Exporta instância singleton
export const authService = new AuthService();
