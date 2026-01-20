/**
 * useNetworkStatus Hook
 * Centralized network status detection using navigator.onLine
 */

import { useState, useEffect, useCallback } from "react";

export interface NetworkStatus {
	isOnline: boolean;
	isReconnecting: boolean;
}

export function useNetworkStatus(): NetworkStatus {
	const [isOnline, setIsOnline] = useState<boolean>(
		typeof navigator !== "undefined" ? navigator.onLine : true
	);
	const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

	const handleOnline = useCallback(() => {
		setIsReconnecting(true);
		setIsOnline(true);
		// Clear reconnecting state after a short delay
		setTimeout(() => {
			setIsReconnecting(false);
		}, 2000);
	}, []);

	const handleOffline = useCallback(() => {
		setIsOnline(false);
		setIsReconnecting(false);
	}, []);

	useEffect(() => {
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [handleOnline, handleOffline]);

	return {
		isOnline,
		isReconnecting,
	};
}

