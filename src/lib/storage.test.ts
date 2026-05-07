import { describe, it, expect, beforeEach } from 'vitest';
import { readStats, writeStats, clearStats, DEFAULT_STATS, type StorageAdapter } from './storage';

function fakeAdapter(): StorageAdapter & { store: Record<string, string> } {
	const store: Record<string, string> = {};
	return {
		store,
		getItem: (key) => store[key] ?? null,
		setItem: (key, value) => { store[key] = value; },
		clear: () => { for (const k in store) delete store[k]; }
	};
}

describe('readStats', () => {
	it('returns defaults when storage is empty', () => {
		const adapter = fakeAdapter();
		expect(readStats(adapter)).toEqual(DEFAULT_STATS);
	});

	it('returns written stats', () => {
		const adapter = fakeAdapter();
		const stats = { correct: 3, total: 5, streak: 2, best: 4 };
		writeStats(stats, adapter);
		expect(readStats(adapter)).toEqual(stats);
	});

	it('returns defaults on schema mismatch — missing field', () => {
		const adapter = fakeAdapter();
		adapter.setItem('player_stats', JSON.stringify({ correct: 1, total: 2, streak: 1 }));
		expect(readStats(adapter)).toEqual(DEFAULT_STATS);
	});

	it('returns defaults on schema mismatch — wrong type', () => {
		const adapter = fakeAdapter();
		adapter.setItem('player_stats', JSON.stringify({ correct: '1', total: 2, streak: 1, best: 1 }));
		expect(readStats(adapter)).toEqual(DEFAULT_STATS);
	});

	it('returns defaults on invalid JSON', () => {
		const adapter = fakeAdapter();
		adapter.setItem('player_stats', 'not-json');
		expect(readStats(adapter)).toEqual(DEFAULT_STATS);
	});
});

describe('writeStats', () => {
	it('persists stats that can be read back', () => {
		const adapter = fakeAdapter();
		const stats = { correct: 7, total: 10, streak: 3, best: 5 };
		writeStats(stats, adapter);
		expect(readStats(adapter)).toEqual(stats);
	});
});

describe('clearStats', () => {
	it('removes stored stats so reads return defaults', () => {
		const adapter = fakeAdapter();
		writeStats({ correct: 2, total: 3, streak: 1, best: 2 }, adapter);
		clearStats(adapter);
		expect(readStats(adapter)).toEqual(DEFAULT_STATS);
	});
});
