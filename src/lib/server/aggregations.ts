export interface LiveCounters {
	votes: number;
	sessions: number;
	avgPerSession: number;
	longestSession: number;
}

export interface PartyAccuracy {
	party: string;
	correct: number;
	total: number;
	accuracy: number;
}

export async function liveCounters(db: D1Database): Promise<LiveCounters> {
	const row = await db
		.prepare(
			`SELECT
        (SELECT COUNT(*) FROM events) AS votes,
        (SELECT COUNT(DISTINCT session_id) FROM events) AS sessions,
        COALESCE(
          (SELECT MAX(cnt) FROM (SELECT COUNT(*) AS cnt FROM events GROUP BY session_id)),
          0
        ) AS longestSession`
		)
		.first<{ votes: number; sessions: number; longestSession: number }>();

	const votes = row?.votes ?? 0;
	const sessions = row?.sessions ?? 0;
	const longestSession = row?.longestSession ?? 0;
	const avgPerSession = sessions > 0 ? Math.round((votes / sessions) * 10) / 10 : 0;

	return { votes, sessions, avgPerSession, longestSession };
}

export interface ConfusionMatrixCell {
	actual: string;
	guessed: string;
	count: number;
	pct: number;
}

export interface MisidentificationEntry {
	guessedParty: string;
	mpId: string;
	actualParty: string;
	count: number;
}

export async function accuracyByParty(db: D1Database): Promise<PartyAccuracy[]> {
	const { results } = await db
		.prepare(
			`SELECT
        correct_party_id AS party,
        SUM(was_correct) AS correct,
        COUNT(*) AS total
      FROM events
      GROUP BY correct_party_id
      ORDER BY correct_party_id`
		)
		.all<{ party: string; correct: number; total: number }>();

	return results.map((r) => ({
		party: r.party,
		correct: r.correct,
		total: r.total,
		accuracy: Math.round((r.correct / r.total) * 1000) / 10
	}));
}

export async function confusionMatrix(db: D1Database): Promise<ConfusionMatrixCell[]> {
	const { results } = await db
		.prepare(
			`SELECT correct_party_id, guessed_party_id, COUNT(*) AS cnt
       FROM events
       GROUP BY correct_party_id, guessed_party_id`
		)
		.all<{ correct_party_id: string; guessed_party_id: string; cnt: number }>();

	const totals = new Map<string, number>();
	for (const r of results) {
		totals.set(r.correct_party_id, (totals.get(r.correct_party_id) ?? 0) + r.cnt);
	}

	return results.map((r) => ({
		actual: r.correct_party_id,
		guessed: r.guessed_party_id,
		count: r.cnt,
		pct: Math.round((r.cnt / (totals.get(r.correct_party_id) ?? 1)) * 1000) / 10
	}));
}

export interface MpAccuracyEntry {
	party: string;
	mpId: string;
	correct: number;
	total: number;
	accuracy: number;
}

async function mpAccuracyRanked(
	db: D1Database,
	minN: number,
	order: 'DESC' | 'ASC'
): Promise<MpAccuracyEntry[]> {
	const sql =
		order === 'DESC'
			? `SELECT correct_party_id AS party, mp_id, SUM(was_correct) AS correct, COUNT(*) AS total
         FROM events
         GROUP BY correct_party_id, mp_id
         HAVING COUNT(*) >= ?
         ORDER BY correct_party_id, SUM(was_correct) * 1.0 / COUNT(*) DESC`
			: `SELECT correct_party_id AS party, mp_id, SUM(was_correct) AS correct, COUNT(*) AS total
         FROM events
         GROUP BY correct_party_id, mp_id
         HAVING COUNT(*) >= ?
         ORDER BY correct_party_id, SUM(was_correct) * 1.0 / COUNT(*) ASC`;

	const { results } = await db
		.prepare(sql)
		.bind(minN)
		.all<{ party: string; mp_id: string; correct: number; total: number }>();

	const seen = new Map<string, number>();
	return results
		.filter((r) => {
			const n = (seen.get(r.party) ?? 0) + 1;
			seen.set(r.party, n);
			return n <= 5;
		})
		.map((r) => ({
			party: r.party,
			mpId: r.mp_id,
			correct: r.correct,
			total: r.total,
			accuracy: Math.round((r.correct / r.total) * 1000) / 10
		}));
}

// minN was 15 (matched the UK reference) but with low traffic that produced
// empty lists for almost every party. Lowered to 1 so we show whatever data
// exists; the floor is still configurable for future tuning.
export function easiestPerParty(db: D1Database, minN = 1): Promise<MpAccuracyEntry[]> {
	return mpAccuracyRanked(db, minN, 'DESC');
}

export function hardestPerParty(db: D1Database, minN = 1): Promise<MpAccuracyEntry[]> {
	return mpAccuracyRanked(db, minN, 'ASC');
}

export async function misidentificationByParty(db: D1Database): Promise<MisidentificationEntry[]> {
	const { results } = await db
		.prepare(
			`SELECT guessed_party_id, mp_id, correct_party_id, COUNT(*) AS cnt
       FROM events
       WHERE was_correct = 0
       GROUP BY guessed_party_id, mp_id, correct_party_id
       ORDER BY guessed_party_id, cnt DESC`
		)
		.all<{ guessed_party_id: string; mp_id: string; correct_party_id: string; cnt: number }>();

	const seen = new Map<string, number>();
	return results
		.filter((r) => {
			const n = (seen.get(r.guessed_party_id) ?? 0) + 1;
			seen.set(r.guessed_party_id, n);
			return n <= 5;
		})
		.map((r) => ({
			guessedParty: r.guessed_party_id,
			mpId: r.mp_id,
			actualParty: r.correct_party_id,
			count: r.cnt
		}));
}
