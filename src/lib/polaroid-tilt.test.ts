import { describe, it, expect } from 'vitest';
import { tiltForMpId, tapeAngleForMpId } from './polaroid-tilt';

const TILT_BOUND = 1.8;
const TAPE_BOUND = 6;

const SAMPLE_IDS = [
	'0584553842424',
	'0123456789012',
	'9876543210000',
	'a',
	'aa',
	'aaa',
	'AbCdEfGhIjKlM',
	'svensk-text-åäö',
	'1',
	'1000000000000000'
];

describe('tiltForMpId', () => {
	it('returns 0 for the empty string', () => {
		expect(tiltForMpId('')).toBe(0);
	});

	it('is deterministic — same id always returns the same value', () => {
		for (const id of SAMPLE_IDS) {
			const a = tiltForMpId(id);
			const b = tiltForMpId(id);
			const c = tiltForMpId(id);
			expect(a).toBe(b);
			expect(b).toBe(c);
		}
	});

	it('stays inside [-1.8, 1.8] for every sampled id', () => {
		for (const id of SAMPLE_IDS) {
			const v = tiltForMpId(id);
			expect(v).toBeGreaterThanOrEqual(-TILT_BOUND);
			expect(v).toBeLessThanOrEqual(TILT_BOUND);
		}
	});

	it('distributes around 0 — mean across many synthetic ids is near zero', () => {
		const N = 1000;
		let sum = 0;
		for (let i = 0; i < N; i++) sum += tiltForMpId(`mp-${i}`);
		const mean = sum / N;
		// Loose bound: with N=1000 ids in a [-1.8, 1.8] range, |mean| < 0.2 is comfortable.
		expect(Math.abs(mean)).toBeLessThan(0.2);
	});

	it('returns distinct values for distinct ids (no clustering at 0)', () => {
		const seen = new Set<number>();
		for (let i = 0; i < 100; i++) seen.add(tiltForMpId(`mp-${i}`));
		// 100 ids should produce at least 50 distinct tilt values.
		expect(seen.size).toBeGreaterThan(50);
	});
});

describe('tapeAngleForMpId', () => {
	it('returns 0 for the empty string', () => {
		expect(tapeAngleForMpId('')).toBe(0);
	});

	it('is deterministic — same id always returns the same value', () => {
		for (const id of SAMPLE_IDS) {
			const a = tapeAngleForMpId(id);
			const b = tapeAngleForMpId(id);
			expect(a).toBe(b);
		}
	});

	it('stays inside [-6, 6] for every sampled id', () => {
		for (const id of SAMPLE_IDS) {
			const v = tapeAngleForMpId(id);
			expect(v).toBeGreaterThanOrEqual(-TAPE_BOUND);
			expect(v).toBeLessThanOrEqual(TAPE_BOUND);
		}
	});

	it('is independent of the tilt — same id can yield different normalized values', () => {
		// Sanity check that we don't accidentally return the same angle for both,
		// which would mean the two functions share a single source of randomness.
		const distinct = SAMPLE_IDS.some((id) => {
			// Normalize both to [-1, 1] and compare.
			const t = tiltForMpId(id) / TILT_BOUND;
			const a = tapeAngleForMpId(id) / TAPE_BOUND;
			return Math.abs(t - a) > 0.05;
		});
		expect(distinct).toBe(true);
	});
});
