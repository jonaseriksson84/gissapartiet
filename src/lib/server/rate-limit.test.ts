import { describe, it, expect } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
	it('allows requests under the rate limit', () => {
		let now = 1000;
		const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000, clock: () => now });

		expect(limiter.isAllowed('token-a')).toBe(true);
		expect(limiter.isAllowed('token-a')).toBe(true);
		expect(limiter.isAllowed('token-a')).toBe(true);
	});

	it('denies the request that exceeds the rate limit', () => {
		let now = 1000;
		const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000, clock: () => now });

		limiter.isAllowed('token-a');
		limiter.isAllowed('token-a');
		limiter.isAllowed('token-a');
		expect(limiter.isAllowed('token-a')).toBe(false);
	});

	it('tracks tokens independently', () => {
		let now = 1000;
		const limiter = createRateLimiter({ maxRequests: 1, windowMs: 1000, clock: () => now });

		expect(limiter.isAllowed('token-a')).toBe(true);
		expect(limiter.isAllowed('token-b')).toBe(true);
		expect(limiter.isAllowed('token-a')).toBe(false);
		expect(limiter.isAllowed('token-b')).toBe(false);
	});

	it('allows requests again after the window expires', () => {
		let now = 1000;
		const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000, clock: () => now });

		limiter.isAllowed('token-a');
		limiter.isAllowed('token-a');
		expect(limiter.isAllowed('token-a')).toBe(false);

		now = 2001;
		expect(limiter.isAllowed('token-a')).toBe(true);
	});

	it('uses a sliding window — old timestamps expire individually', () => {
		let now = 1000;
		const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000, clock: () => now });

		limiter.isAllowed('token-a'); // t=1000
		now = 1500;
		limiter.isAllowed('token-a'); // t=1500
		expect(limiter.isAllowed('token-a')).toBe(false); // still 2 in window

		now = 2001; // t=1000 is now outside window (cutoff=1001), t=1500 still inside
		expect(limiter.isAllowed('token-a')).toBe(true); // only t=1500 counted → 1 in window
	});

	it('uses Date.now by default when no clock is injected', () => {
		const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
		expect(limiter.isAllowed('session-x')).toBe(true);
	});
});
