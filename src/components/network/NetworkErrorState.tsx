/**
 * NetworkErrorState Component
 * Displays a user-friendly error state with retry button
 *
 * USE CASE: Pages that load data (GET) and fail when there's no cached data.
 *
 * DO NOT USE FOR:
 * - Forms (POST/PUT/PATCH/DELETE) - just show toast.error() and let user retry via form button
 * - Action buttons - just show toast.error() and let user retry via the same button
 *
 * For forms, the pattern is:
 * ```tsx
 * try {
 *   setIsSubmitting(true);
 *   await apiClient.post(...);
 *   toast.success("Sucesso!");
 * } catch (error) {
 *   toast.error(error.message); // NetworkError already has user-friendly message
 * } finally {
 *   setIsSubmitting(false); // Button becomes enabled again
 * }
 * ```
 */

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NetworkError } from "@/services/api/client";
import { NETWORK_MESSAGES } from "@/services/network/networkMessages";

interface NetworkErrorStateProps {
	error: Error | NetworkError | unknown;
	onRetry?: () => void;
	isRetrying?: boolean;
	className?: string;
}

/**
 * Get user-friendly message based on error type
 */
function getErrorMessage(error: Error | NetworkError | unknown): string {
	if (error instanceof NetworkError) {
		return error.getUserMessage();
	}

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

		// If it's an API error with a message, show it (validation errors, etc.)
		if (error.message && !message.includes("error")) {
			return error.message;
		}
	}

	return NETWORK_MESSAGES.TEMPORARY_FAILURE;
}

export function NetworkErrorState({
	error,
	onRetry,
	isRetrying = false,
	className = "",
}: NetworkErrorStateProps) {
	const message = getErrorMessage(error);
	const isOffline = error instanceof NetworkError && error.isOffline;

	return (
		<Card className={`border-destructive/50 ${className}`}>
			<CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
				<div className="rounded-full bg-destructive/10 p-4 mb-4">
					<WifiOff className="h-8 w-8 text-destructive" />
				</div>

				<p className="text-muted-foreground mb-6 max-w-md">{message}</p>

				{onRetry && (
					<Button
						variant="outline"
						onClick={onRetry}
						disabled={isRetrying || isOffline}
						className="gap-2"
					>
						<RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
						{isRetrying ? "Tentando novamente..." : "Tentar novamente"}
					</Button>
				)}

				{isOffline && (
					<p className="text-xs text-muted-foreground mt-4">
						A conexão será restaurada automaticamente quando você voltar online.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

