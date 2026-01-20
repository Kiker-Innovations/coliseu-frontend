/**
 * usePageRefresh Hook
 * Registers a refresh function for the current page to be used with pull-to-refresh
 * Automatically unregisters when the component unmounts
 */

import { useEffect, useCallback, useRef } from "react";
import { useRefresh } from "@/contexts/RefreshContext";

interface UsePageRefreshOptions {
	/** The refresh function to execute when pull-to-refresh is triggered */
	onRefresh: () => Promise<void>;
	/** Whether the refresh should be enabled (default: true) */
	enabled?: boolean;
}

export function usePageRefresh({ onRefresh, enabled = true }: UsePageRefreshOptions) {
	const { registerRefresh, unregisterRefresh, isRefreshing } = useRefresh();
	const onRefreshRef = useRef(onRefresh);

	// Keep the ref updated with the latest onRefresh function
	useEffect(() => {
		onRefreshRef.current = onRefresh;
	}, [onRefresh]);

	// Stable refresh function that always calls the latest onRefresh
	const stableRefresh = useCallback(async () => {
		await onRefreshRef.current();
	}, []);

	useEffect(() => {
		if (enabled) {
			registerRefresh(stableRefresh);
		} else {
			unregisterRefresh();
		}

		return () => {
			unregisterRefresh();
		};
	}, [enabled, registerRefresh, unregisterRefresh, stableRefresh]);

	return { isRefreshing };
}

