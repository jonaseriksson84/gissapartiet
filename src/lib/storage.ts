import type { Party } from './riksdagen';

export interface StorageAdapter {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	clear(): void;
}

export interface PlayerStats {
	correct: number;
	total: number;
	streak: number;
	best: number;
}

export interface GuessEntry {
	mpId: string;
	mpFirstName: string;
	mpLastName: string;
	photoUrl: string;
	correctParty: Party;
	guessedParty: Party;
	// ms timestamp; used as the {#each} key to avoid duplicate-key crashes
	// when the same MP/party combo appears more than once in a session.
	at: number;
}

export const DEFAULT_STATS: PlayerStats = { correct: 0, total: 0, streak: 0, best: 0 };

const STATS_KEY = 'player_stats';
const GUESSES_KEY = 'recent_guesses';

export function readStats(adapter: StorageAdapter): PlayerStats {
	const raw = adapter.getItem(STATS_KEY);
	if (!raw) return { ...DEFAULT_STATS };
	try {
		const parsed = JSON.parse(raw);
		if (
			typeof parsed.correct !== 'number' ||
			typeof parsed.total !== 'number' ||
			typeof parsed.streak !== 'number' ||
			typeof parsed.best !== 'number'
		) {
			return { ...DEFAULT_STATS };
		}
		return {
			correct: parsed.correct,
			total: parsed.total,
			streak: parsed.streak,
			best: parsed.best
		};
	} catch {
		return { ...DEFAULT_STATS };
	}
}

export function writeStats(stats: PlayerStats, adapter: StorageAdapter): void {
	adapter.setItem(STATS_KEY, JSON.stringify(stats));
}

export function readGuesses(adapter: StorageAdapter): GuessEntry[] {
	const raw = adapter.getItem(GUESSES_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		// Back-fill `at` for legacy entries written before the timestamp field
		// existed. We use a descending counter so older entries get smaller
		// timestamps (preserving newest-first order), spaced 1ms apart.
		const now = Date.now();
		return parsed.map((entry, i) =>
			typeof entry?.at === 'number' ? entry : { ...entry, at: now - i }
		);
	} catch {
		return [];
	}
}

export function writeGuesses(entries: GuessEntry[], adapter: StorageAdapter): void {
	adapter.setItem(GUESSES_KEY, JSON.stringify(entries));
}

export function clear(adapter: StorageAdapter): void {
	adapter.clear();
}

export function clearStats(adapter: StorageAdapter): void {
	adapter.clear();
}
