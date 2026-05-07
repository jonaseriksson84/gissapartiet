import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { liveCounters, accuracyByParty } from './aggregations';

const SCHEMA = `
  CREATE TABLE events (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id       TEXT    NOT NULL,
    mp_id            TEXT    NOT NULL,
    guessed_party_id TEXT    NOT NULL,
    correct_party_id TEXT    NOT NULL,
    was_correct      INTEGER NOT NULL,
    created_at       TEXT    NOT NULL
  )
`;

function makeD1(db: Database.Database): D1Database {
	return {
		prepare(query: string) {
			let bound: unknown[] = [];
			const stmt = {
				bind(...values: unknown[]) {
					bound = values;
					return stmt;
				},
				async run() {
					db.prepare(query).run(...bound);
					return { success: true };
				},
				async all<T = Record<string, unknown>>() {
					const results = db.prepare(query).all(...bound) as T[];
					return { results };
				},
				async first<T = Record<string, unknown>>() {
					return (db.prepare(query).get(...bound) as T | undefined) ?? null;
				}
			};
			return stmt;
		},
		async exec(query: string) {
			db.exec(query);
			return { count: 0, duration: 0 };
		}
	};
}

type FixtureRow = {
	session_id: string;
	mp_id: string;
	guessed_party_id: string;
	correct_party_id: string;
	was_correct: number;
};

function seed(db: Database.Database, rows: FixtureRow[]) {
	const ins = db.prepare(
		`INSERT INTO events (session_id, mp_id, guessed_party_id, correct_party_id, was_correct, created_at)
     VALUES (?, ?, ?, ?, ?, '2026-01-01T00:00:00Z')`
	);
	const run = db.transaction((rows: FixtureRow[]) => {
		for (const r of rows) ins.run(r.session_id, r.mp_id, r.guessed_party_id, r.correct_party_id, r.was_correct);
	});
	run(rows);
}

// Fixture: 2 sessions, 8 events total
// session s1: 3 events (mp1-S correct, mp2-S wrong, mp3-M correct)
// session s2: 5 events (mp1-S correct, mp2-V wrong, mp4-V correct, mp5-M correct, mp6-KD correct)
const FIXTURE: FixtureRow[] = [
	{ session_id: 's1', mp_id: 'mp1', guessed_party_id: 'S',  correct_party_id: 'S',  was_correct: 1 },
	{ session_id: 's1', mp_id: 'mp2', guessed_party_id: 'M',  correct_party_id: 'S',  was_correct: 0 },
	{ session_id: 's1', mp_id: 'mp3', guessed_party_id: 'M',  correct_party_id: 'M',  was_correct: 1 },
	{ session_id: 's2', mp_id: 'mp1', guessed_party_id: 'S',  correct_party_id: 'S',  was_correct: 1 },
	{ session_id: 's2', mp_id: 'mp2', guessed_party_id: 'M',  correct_party_id: 'V',  was_correct: 0 },
	{ session_id: 's2', mp_id: 'mp4', guessed_party_id: 'V',  correct_party_id: 'V',  was_correct: 1 },
	{ session_id: 's2', mp_id: 'mp5', guessed_party_id: 'M',  correct_party_id: 'M',  was_correct: 1 },
	{ session_id: 's2', mp_id: 'mp6', guessed_party_id: 'KD', correct_party_id: 'KD', was_correct: 1 }
];

describe('liveCounters', () => {
	let d1: D1Database;

	beforeEach(() => {
		const sqlite = new Database(':memory:');
		sqlite.exec(SCHEMA);
		seed(sqlite, FIXTURE);
		d1 = makeD1(sqlite);
	});

	it('returns total vote count', async () => {
		const c = await liveCounters(d1);
		expect(c.votes).toBe(8);
	});

	it('returns unique session count', async () => {
		const c = await liveCounters(d1);
		expect(c.sessions).toBe(2);
	});

	it('returns average votes per session', async () => {
		const c = await liveCounters(d1);
		expect(c.avgPerSession).toBe(4); // 8 / 2
	});

	it('returns the longest session length', async () => {
		const c = await liveCounters(d1);
		expect(c.longestSession).toBe(5); // session s2 has 5 events
	});

	it('returns zeros when table is empty', async () => {
		const empty = new Database(':memory:');
		empty.exec(SCHEMA);
		const c = await liveCounters(makeD1(empty));
		expect(c).toEqual({ votes: 0, sessions: 0, avgPerSession: 0, longestSession: 0 });
	});
});

describe('accuracyByParty', () => {
	let d1: D1Database;

	beforeEach(() => {
		const sqlite = new Database(':memory:');
		sqlite.exec(SCHEMA);
		seed(sqlite, FIXTURE);
		d1 = makeD1(sqlite);
	});

	it('returns one row per party that has events', async () => {
		const rows = await accuracyByParty(d1);
		const parties = rows.map((r) => r.party).sort();
		expect(parties).toEqual(['KD', 'M', 'S', 'V']);
	});

	it('computes correct totals and accuracy for S', async () => {
		const rows = await accuracyByParty(d1);
		const s = rows.find((r) => r.party === 'S')!;
		// S: events 1, 2, 4 → total 3, correct 2
		expect(s.total).toBe(3);
		expect(s.correct).toBe(2);
		expect(s.accuracy).toBeCloseTo(66.7, 1);
	});

	it('computes 100% accuracy when all guesses correct', async () => {
		const rows = await accuracyByParty(d1);
		const m = rows.find((r) => r.party === 'M')!;
		expect(m.total).toBe(2);
		expect(m.correct).toBe(2);
		expect(m.accuracy).toBe(100);
	});

	it('computes 50% accuracy for V', async () => {
		const rows = await accuracyByParty(d1);
		const v = rows.find((r) => r.party === 'V')!;
		expect(v.total).toBe(2);
		expect(v.correct).toBe(1);
		expect(v.accuracy).toBe(50);
	});

	it('returns empty array when table is empty', async () => {
		const empty = new Database(':memory:');
		empty.exec(SCHEMA);
		const rows = await accuracyByParty(makeD1(empty));
		expect(rows).toEqual([]);
	});
});
