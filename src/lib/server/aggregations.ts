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
