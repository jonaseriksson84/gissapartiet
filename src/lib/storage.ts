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

export const DEFAULT_STATS: PlayerStats = { correct: 0, total: 0, streak: 0, best: 0 };

const KEY = 'player_stats';

export function readStats(adapter: StorageAdapter): PlayerStats {
	const raw = adapter.getItem(KEY);
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
	adapter.setItem(KEY, JSON.stringify(stats));
}

export function clearStats(adapter: StorageAdapter): void {
	adapter.clear();
}
