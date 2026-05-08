import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { liveCounters, accuracyByParty, confusionMatrix, misidentificationByParty } from './aggregations';

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

describe('confusionMatrix', () => {
	let d1: D1Database;

	beforeEach(() => {
		const sqlite = new Database(':memory:');
		sqlite.exec(SCHEMA);
		seed(sqlite, FIXTURE);
		d1 = makeD1(sqlite);
	});

	it('returns one cell per (actual, guessed) pair', async () => {
		const cells = await confusionMatrix(d1);
		const pairs = cells.map((c) => `${c.actual}:${c.guessed}`).sort();
		expect(pairs).toEqual(['KD:KD', 'M:M', 'S:M', 'S:S', 'V:M', 'V:V']);
	});

	it('computes correct percentage for S→S diagonal', async () => {
		const cells = await confusionMatrix(d1);
		const cell = cells.find((c) => c.actual === 'S' && c.guessed === 'S')!;
		expect(cell.count).toBe(2);
		expect(cell.pct).toBeCloseTo(66.7, 1);
	});

	it('computes correct percentage for S→M off-diagonal', async () => {
		const cells = await confusionMatrix(d1);
		const cell = cells.find((c) => c.actual === 'S' && c.guessed === 'M')!;
		expect(cell.count).toBe(1);
		expect(cell.pct).toBeCloseTo(33.3, 1);
	});

	it('returns 100% for M→M when all guesses correct', async () => {
		const cells = await confusionMatrix(d1);
		const cell = cells.find((c) => c.actual === 'M' && c.guessed === 'M')!;
		expect(cell.pct).toBe(100);
	});

	it('returns empty array when table is empty', async () => {
		const empty = new Database(':memory:');
		empty.exec(SCHEMA);
		const cells = await confusionMatrix(makeD1(empty));
		expect(cells).toEqual([]);
	});
});

describe('misidentificationByParty', () => {
	let d1: D1Database;

	beforeEach(() => {
		const sqlite = new Database(':memory:');
		sqlite.exec(SCHEMA);
		seed(sqlite, FIXTURE);
		d1 = makeD1(sqlite);
	});

	it('only includes entries where guessed ≠ actual (was_correct = 0)', async () => {
		const entries = await misidentificationByParty(d1);
		for (const e of entries) {
			expect(e.guessedParty).not.toBe(e.actualParty);
		}
	});

	it('returns both wrong-guess groups for party M from fixture', async () => {
		const entries = await misidentificationByParty(d1);
		const forM = entries.filter((e) => e.guessedParty === 'M');
		expect(forM.length).toBe(2);
		const actualParties = forM.map((e) => e.actualParty).sort();
		expect(actualParties).toEqual(['S', 'V']);
	});

	it('limits to top 5 per guessed party', async () => {
		const sqlite = new Database(':memory:');
		sqlite.exec(SCHEMA);
		const rows: FixtureRow[] = Array.from({ length: 6 }, (_, i) => ({
			session_id: 's1',
			mp_id: `mpX${i}`,
			guessed_party_id: 'M',
			correct_party_id: 'S',
			was_correct: 0
		}));
		seed(sqlite, rows);
		const entries = await misidentificationByParty(makeD1(sqlite));
		expect(entries.filter((e) => e.guessedParty === 'M').length).toBe(5);
	});

	it('returns empty array when no wrong guesses', async () => {
		const sqlite = new Database(':memory:');
		sqlite.exec(SCHEMA);
		seed(sqlite, [
			{ session_id: 's1', mp_id: 'mp1', guessed_party_id: 'S', correct_party_id: 'S', was_correct: 1 }
		]);
		const entries = await misidentificationByParty(makeD1(sqlite));
		expect(entries).toEqual([]);
	});
});
