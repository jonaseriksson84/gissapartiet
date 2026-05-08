import { describe, it, expect } from 'vitest';
import {
	readStats,
	writeStats,
	clearStats,
	clear,
	readGuesses,
	writeGuesses,
	DEFAULT_STATS,
	type StorageAdapter,
	type GuessEntry
} from './storage';

function fakeAdapter(): StorageAdapter & { store: Record<string, string> } {
	const store: Record<string, string> = {};
	return {
		store,
		getItem: (key) => store[key] ?? null,
		setItem: (key, value) => { store[key] = value; },
		clear: () => { for (const k in store) delete store[k]; }
	};
}

const SAMPLE_GUESS: GuessEntry = {
	mpId: 'abc123',
	mpFirstName: 'Anna',
	mpLastName: 'Svensson',
	photoUrl: 'https://example.com/photo.jpg',
	correctParty: 'S',
	guessedParty: 'M'
};

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

describe('readGuesses', () => {
	it('returns empty array when storage is empty', () => {
		const adapter = fakeAdapter();
		expect(readGuesses(adapter)).toEqual([]);
	});

	it('returns written guesses', () => {
		const adapter = fakeAdapter();
		writeGuesses([SAMPLE_GUESS], adapter);
		expect(readGuesses(adapter)).toEqual([SAMPLE_GUESS]);
	});

	it('returns empty array on invalid JSON', () => {
		const adapter = fakeAdapter();
		adapter.setItem('recent_guesses', 'not-json');
		expect(readGuesses(adapter)).toEqual([]);
	});

	it('returns empty array when value is not an array', () => {
		const adapter = fakeAdapter();
		adapter.setItem('recent_guesses', JSON.stringify({ foo: 'bar' }));
		expect(readGuesses(adapter)).toEqual([]);
	});
});

describe('writeGuesses', () => {
	it('persists multiple guesses that can be read back', () => {
		const adapter = fakeAdapter();
		const entries: GuessEntry[] = [
			SAMPLE_GUESS,
			{ ...SAMPLE_GUESS, mpId: 'xyz', correctParty: 'M', guessedParty: 'M' }
		];
		writeGuesses(entries, adapter);
		expect(readGuesses(adapter)).toEqual(entries);
	});
});

describe('clear', () => {
	it('removes all stored data (stats and guesses)', () => {
		const adapter = fakeAdapter();
		writeStats({ correct: 2, total: 3, streak: 1, best: 2 }, adapter);
		writeGuesses([SAMPLE_GUESS], adapter);
		clear(adapter);
		expect(readStats(adapter)).toEqual(DEFAULT_STATS);
		expect(readGuesses(adapter)).toEqual([]);
	});
});
