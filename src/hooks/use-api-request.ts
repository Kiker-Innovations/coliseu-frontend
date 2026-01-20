/**
 * useApiRequest Hook
 * Provides a standardized way to handle API requests with loading, error, and retry states
 */

import { useState, useCallback } from "react";
import { NetworkError } from "@/services/api/client";
import { toast } from "sonner";

interface UseApiRequestOptions {
	showErrorToast?: boolean;
}

interface UseApiRequestReturn<T> {
	data: T | null;
	isLoading: boolean;
	error: Error | null;
	isNetworkError: boolean;
	execute: () => Promise<T | null>;
	retry: () => Promise<T | null>;
	reset: () => void;
}

export function useApiRequest<T>(
	requestFn: () => Promise<T>,
	options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
	const { showErrorToast = true } = options;
	
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const execute = useCallback(async (): Promise<T | null> => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await requestFn();
			setData(result);
			return result;
		} catch (err) {
			const errorInstance = err instanceof Error ? err : new Error("Erro desconhecido");
			setError(errorInstance);
			
			// Only show toast for non-network errors
			if (showErrorToast && !(err instanceof NetworkError)) {
				toast.error(errorInstance.message);
			}
			
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [requestFn, showErrorToast]);

	const retry = useCallback(async (): Promise<T | null> => {
		return execute();
	}, [execute]);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setIsLoading(false);
	}, []);

	return {
		data,
		isLoading,
		error,
		isNetworkError: error instanceof NetworkError,
		execute,
		retry,
		reset,
	};
}

/**
 * Hook for multiple parallel API requests
 */
export function useApiRequests<T extends Record<string, () => Promise<unknown>>>(
	requestFns: T,
	options: UseApiRequestOptions = {}
): {
	data: { [K in keyof T]: Awaited<ReturnType<T[K]>> | null };
	isLoading: boolean;
	error: Error | null;
	isNetworkError: boolean;
	execute: () => Promise<void>;
	retry: () => Promise<void>;
} {
	const { showErrorToast = true } = options;
	
	const [data, setData] = useState<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }>(
		Object.keys(requestFns).reduce((acc, key) => ({ ...acc, [key]: null }), {} as { [K in keyof T]: null })
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const execute = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			
			const entries = Object.entries(requestFns);
			const results = await Promise.all(
				entries.map(async ([key, fn]) => {
					const result = await fn();
					return [key, result] as const;
				})
			);
			
			const newData = results.reduce(
				(acc, [key, value]) => ({ ...acc, [key]: value }),
				{} as { [K in keyof T]: Awaited<ReturnType<T[K]>> }
			);
			
			setData(newData);
		} catch (err) {
			const errorInstance = err instanceof Error ? err : new Error("Erro desconhecido");
			setError(errorInstance);
			
			if (showErrorToast && !(err instanceof NetworkError)) {
				toast.error(errorInstance.message);
			}
		} finally {
			setIsLoading(false);
		}
	}, [requestFns, showErrorToast]);

	const retry = useCallback(async () => {
		return execute();
	}, [execute]);

	return {
		data,
		isLoading,
		error,
		isNetworkError: error instanceof NetworkError,
		execute,
		retry,
	};
}

