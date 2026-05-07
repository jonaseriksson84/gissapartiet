export type Clock = () => number;

export interface RateLimiterOptions {
	maxRequests: number;
	windowMs: number;
	clock?: Clock;
}

export interface RateLimiter {
	isAllowed(token: string): boolean;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
	const { maxRequests, windowMs } = options;
	const clock: Clock = options.clock ?? Date.now;
	const store = new Map<string, number[]>();

	return {
		isAllowed(token: string): boolean {
			const now = clock();
			const cutoff = now - windowMs;
			const timestamps = (store.get(token) ?? []).filter((t) => t > cutoff);

			if (timestamps.length >= maxRequests) {
				store.set(token, timestamps);
				return false;
			}

			timestamps.push(now);
			store.set(token, timestamps);
			return true;
		}
	};
}
