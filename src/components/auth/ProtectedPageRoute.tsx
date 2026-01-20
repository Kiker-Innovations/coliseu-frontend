/**
 * Protected Page Route Component
 * Verifica se o usuário tem acesso à página baseado em accessiblePages do token
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth.service";
import { FullPageSpinner } from "@/components/ui/full-page-spinner";

interface ProtectedPageRouteProps {
	children: React.ReactNode;
}

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
 * Obtém as páginas acessíveis do token
 */
function getAccessiblePages(): Array<{ url: string }> | null {
	const token = authService.getToken();
	if (!token) {
		return null;
	}

	const decoded = decodeToken(token);
	if (!decoded || !decoded.accessiblePages) {
		return null;
	}

	return decoded.accessiblePages;
}

/**
 * Verifica se a URL atual está nas páginas acessíveis
 */
function hasAccessToPage(currentPath: string): boolean {
	const accessiblePages = getAccessiblePages();
	if (!accessiblePages || accessiblePages.length === 0) {
		// Se não houver páginas acessíveis, permitir acesso (fallback)
		return true;
	}

	// Normalizar a URL atual (remover barra inicial)
	const normalizedPath = currentPath.startsWith("/") ? currentPath.slice(1) : currentPath;

	// Verificar se alguma página acessível corresponde à URL atual
	return accessiblePages.some((page) => {
		// Normalizar a URL da página (remover barra inicial)
		const pageUrl = page.url.startsWith("/") ? page.url.slice(1) : page.url;

		// Comparação exata
		if (pageUrl === normalizedPath) {
			return true;
		}

		// Verificar se a URL atual contém a URL da página
		// Isso permite /admin/fines corresponder a /fines
		// ou /concierge/dashboard corresponder a /dashboard
		// ou /admin/fines/edit/:id corresponder a /fines
		if (normalizedPath.includes(pageUrl)) {
			// Garantir que é uma correspondência válida (não apenas uma substring)
			// Ex: /fines não deve corresponder a /fines-old
			const pathParts = normalizedPath.split("/");
			const pageParts = pageUrl.split("/");
			const lastPagePart = pageParts[pageParts.length - 1];

			// Verificar se a última parte da URL da página está na URL atual
			return pathParts.includes(lastPagePart);
		}

		return false;
	});
}

/**
 * Protected Page Route
 * Verifica se o usuário tem acesso à página baseado em accessiblePages
 */
export function ProtectedPageRoute({ children }: ProtectedPageRouteProps) {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	// Mostrar loading durante verificação
	if (isLoading) {
		return <FullPageSpinner />;
	}

	// Se não estiver autenticado, redirecionar para login
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Verificar se tem acesso à página
	if (!hasAccessToPage(location.pathname)) {
		// Redirecionar para dashboard baseado no tipo de usuário
		const userType = authService.getUserType();
		let redirectPath = "/dashboard";

		if (userType === "admin") {
			redirectPath = "/admin/dashboard";
		} else if (userType === "concierge") {
			redirectPath = "/concierge/dashboard";
		}

		return <Navigate to={redirectPath} replace />;
	}

	// Tem acesso, renderizar conteúdo
	return <>{children}</>;
}
