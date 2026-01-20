/**
 * Network Error Messages
 * Centralized user-friendly messages for network errors
 */

export const NETWORK_MESSAGES = {
	OFFLINE: "Você está sem conexão com a internet. Verifique sua rede para continuar.",
	TIMEOUT: "Sua conexão parece instável. Tente novamente.",
	RECONNECTING: "Sua conexão parece instável. Tente novamente.",
	TEMPORARY_FAILURE: "Não foi possível completar a operação. Tente novamente.",
	GENERIC_ERROR: "Ocorreu um erro inesperado. Tente novamente.",
} as const;

export type NetworkMessageKey = keyof typeof NETWORK_MESSAGES;

/**
 * Get user-friendly message for network errors
 */
export function getNetworkErrorMessage(error: Error | unknown): string {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes("offline") || message.includes("failed to fetch")) {
			return NETWORK_MESSAGES.OFFLINE;
		}

		if (message.includes("timeout") || message.includes("abort")) {
			return NETWORK_MESSAGES.TIMEOUT;
		}

		if (message.includes("network")) {
			return NETWORK_MESSAGES.TEMPORARY_FAILURE;
		}
	}

	return NETWORK_MESSAGES.GENERIC_ERROR;
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: Error | unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		return (
			message.includes("network") ||
			message.includes("failed to fetch") ||
			message.includes("timeout") ||
			message.includes("abort") ||
			message.includes("offline")
		);
	}
	return false;
}

