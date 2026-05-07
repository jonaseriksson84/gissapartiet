import { describe, it, expect } from 'vitest';
import { sampleMP } from './sample';
import type { MP, Party } from './riksdagen';

function mp(id: string, party: Party): MP {
	return { id, firstName: 'A', lastName: 'B', party, photoUrl: '' };
}

function seqRng(values: number[]) {
	let i = 0;
	return () => values[i++ % values.length];
}

describe('sampleMP', () => {
	it('picks an MP from the chosen party stratum', () => {
		const mps = [mp('s1', 'S'), mp('s2', 'S'), mp('m1', 'M')];
		// First rng call picks party index 0 (S), second picks MP index 0 in that pool
		const result = sampleMP(mps, seqRng([0, 0]));
		expect(result.mp.party).toBe('S');
		expect(result.correctParty).toBe('S');
	});

	it('vilde edge case: correctParty is Partilös', () => {
		const mps = [mp('s1', 'S'), mp('v1', 'Partilös')];
		// rng: party index 0 (S, the only non-empty stratum after distributing vilde),
		// then MP index 1 in that pool (the vilde, since vilde distributed into S's pool)
		const result = sampleMP(mps, seqRng([0, 0.99]));
		expect(result.mp.id).toBe('v1');
		expect(result.correctParty).toBe('Partilös');
	});

	it('distributes vildar across party strata in round-robin', () => {
		// 8 vildar should land one-per-party stratum
		const partilos = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'].map((_, i) =>
			mp(`v${i}`, 'Partilös')
		);
		const regulars = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'].map((p) =>
			mp(`r-${p}`, p as Party)
		);
		const mps = [...regulars, ...partilos];

		// Each party pool should have 2 MPs (1 regular + 1 vilde).
		// Sample 100 times with uniform rng and count correctParty outcomes.
		let partilosCount = 0;
		const RUNS = 1000;
		for (let i = 0; i < RUNS; i++) {
			const { correctParty } = sampleMP(mps);
			if (correctParty === 'Partilös') partilosCount++;
		}
		// With 1 vilde per party pool of size 2, expect ~50% Partilös draws (1/2 within stratum)
		// Allow wide margin for randomness
		expect(partilosCount).toBeGreaterThan(RUNS * 0.3);
		expect(partilosCount).toBeLessThan(RUNS * 0.7);
	});

	it('uniform party distribution over many samples', () => {
		const mps = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'].flatMap((p) => [
			mp(`${p}1`, p as Party),
			mp(`${p}2`, p as Party)
		]);
		const counts: Record<string, number> = {};
		const RUNS = 8000;
		for (let i = 0; i < RUNS; i++) {
			const { correctParty } = sampleMP(mps);
			counts[correctParty] = (counts[correctParty] ?? 0) + 1;
		}
		// Each of 8 parties should appear ~12.5% of the time
		const expected = RUNS / 8;
		for (const party of ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L']) {
			expect(counts[party]).toBeGreaterThan(expected * 0.8);
			expect(counts[party]).toBeLessThan(expected * 1.2);
		}
	});

	it('returns the mp object from the pool', () => {
		const mps = [mp('only', 'M')];
		const result = sampleMP(mps, seqRng([0, 0]));
		expect(result.mp.id).toBe('only');
	});
});
