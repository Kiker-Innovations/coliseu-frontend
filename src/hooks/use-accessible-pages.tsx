/**
 * Hook para obter páginas acessíveis do token
 */

import { useMemo } from "react";
import { authService } from "@/services/auth.service";
import * as LucideIcons from "lucide-react";

/**
 * Decodifica base64 para UTF-8 corretamente
 */
function base64UrlDecode(str: string): string {
	// Substituir caracteres URL-safe
	let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

	// Adicionar padding se necessário
	while (base64.length % 4) {
		base64 += "=";
	}

	// Decodificar base64
	const binaryString = atob(base64);

	// Converter para UTF-8
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	// Decodificar UTF-8
	return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Decodifica o token JWT e retorna o payload
 */
function decodeToken(token: string): any {
	try {
		const tokenParts = token.split(".");
		if (tokenParts.length !== 3) {
			return null;
		}
		const decodedPayload = base64UrlDecode(tokenParts[1]);
		const payload = JSON.parse(decodedPayload);
		return payload;
	} catch (error) {
		console.error("Erro ao decodificar token:", error);
		return null;
	}
}

/**
 * Mapeamento de nomes de ícones para componentes do Lucide
 */
const iconMap: Record<string, keyof typeof LucideIcons> = {
	LayoutDashboard: "LayoutDashboard",
	Lightbulb: "Lightbulb",
	Vote: "Vote",
	TrendingUp: "TrendingUp",
	MessageSquare: "MessageSquare",
	FileText: "FileText",
	AlertTriangle: "AlertTriangle",
	Package: "Package",
	Calendar: "Calendar",
	Megaphone: "Megaphone",
	DollarSign: "DollarSign",
	FolderKanban: "FolderKanban",
	BarChart3: "BarChart3",
	Building2: "Building2",
	DoorOpen: "DoorOpen",
	UserCheck: "UserCheck",
};

/**
 * Obtém o componente de ícone baseado no nome
 */
function getIconComponent(iconName: string): React.ComponentType<any> {
	// Tentar encontrar o ícone no mapa primeiro
	const mappedIcon = iconMap[iconName];
	if (mappedIcon && LucideIcons[mappedIcon]) {
		return LucideIcons[mappedIcon] as React.ComponentType<any>;
	}

	// Tentar converter para PascalCase e buscar diretamente
	const iconKey = iconName.charAt(0).toUpperCase() + iconName.slice(1);

	// @ts-ignore - LucideIcons é um objeto dinâmico
	if (LucideIcons[iconKey]) {
		return LucideIcons[iconKey] as React.ComponentType<any>;
	}

	// Fallback para LayoutDashboard
	return LucideIcons.LayoutDashboard as React.ComponentType<any>;
}

/**
 * Hook para obter páginas acessíveis do token
 */
export function useAccessiblePages() {
	const token = authService.getToken();

	const accessiblePages = useMemo(() => {
		if (!token) {
			return [];
		}

		const decoded = decodeToken(token);
		if (!decoded || !decoded.accessiblePages) {
			return [];
		}

		// Mapear as páginas e adicionar os componentes de ícone
		return decoded.accessiblePages
			.map((page: any) => ({
				...page,
				icon: getIconComponent(page.icon),
			}))
			.sort((a: any, b: any) => a.order - b.order);
	}, [token]);

	return accessiblePages;
}
