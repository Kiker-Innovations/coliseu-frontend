/**
 * Cache Service
 * Manages localStorage cache for API responses
 *
 * Easy to clear cache for testing:
 * - localStorage.removeItem('coliseu_cache_...')
 * - cacheService.clear() - clears all cache
 * - cacheService.clearByPrefix('/api/endpoint') - clears specific endpoint
 */

const CACHE_PREFIX = "coliseu_cache_";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

/**
 * Generate cache key from endpoint and params
 */
function generateCacheKey(endpoint: string, params?: Record<string, unknown>): string {
	const paramsString = params ? JSON.stringify(params) : "";
	return `${CACHE_PREFIX}${endpoint}_${paramsString}`;
}

/**
 * Check if cache entry is still valid
 */
function isValidCache<T>(entry: CacheEntry<T>): boolean {
	const now = Date.now();
	return now - entry.timestamp < entry.ttl;
}

export const cacheService = {
	/**
	 * Get cached data for endpoint
	 */
	get<T>(endpoint: string, params?: Record<string, unknown>): T | null {
		try {
			const key = generateCacheKey(endpoint, params);
			const cached = localStorage.getItem(key);

			if (!cached) {
				return null;
			}

			const entry: CacheEntry<T> = JSON.parse(cached);

			if (!isValidCache(entry)) {
				localStorage.removeItem(key);
				return null;
			}

			return entry.data;
		} catch {
			return null;
		}
	},

	/**
	 * Set cache data for endpoint
	 */
	set<T>(
		endpoint: string,
		data: T,
		params?: Record<string, unknown>,
		ttl: number = DEFAULT_TTL
	): void {
		try {
			const key = generateCacheKey(endpoint, params);
			const entry: CacheEntry<T> = {
				data,
				timestamp: Date.now(),
				ttl,
			};
			localStorage.setItem(key, JSON.stringify(entry));
		} catch (error) {
			// Storage might be full, silently fail
			console.warn("Failed to cache data:", error);
		}
	},

	/**
	 * Remove specific cache entry
	 */
	remove(endpoint: string, params?: Record<string, unknown>): void {
		const key = generateCacheKey(endpoint, params);
		localStorage.removeItem(key);
	},

	/**
	 * Clear all cache entries that match a prefix
	 * Useful for clearing all cache for a specific endpoint
	 *
	 * Example: cacheService.clearByPrefix('/v1/residents')
	 */
	clearByPrefix(prefix: string): void {
		const fullPrefix = `${CACHE_PREFIX}${prefix}`;
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(fullPrefix)) {
				keysToRemove.push(key);
			}
		}

		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	},

	/**
	 * Clear all cache entries
	 * Useful for testing or when user logs out
	 */
	clear(): void {
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(CACHE_PREFIX)) {
				keysToRemove.push(key);
			}
		}

		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	},

	/**
	 * Get all cache keys (for debugging)
	 */
	getAllKeys(): string[] {
		const keys: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(CACHE_PREFIX)) {
				keys.push(key.replace(CACHE_PREFIX, ""));
			}
		}

		return keys;
	},
};

// Expose to window for easy debugging/testing in browser console
if (typeof window !== "undefined") {
	(window as unknown as { coliseuCache: typeof cacheService }).coliseuCache = cacheService;
}

