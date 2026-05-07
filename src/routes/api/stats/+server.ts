import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { liveCounters, accuracyByParty } from '$lib/server/aggregations';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform!.env.DB;
	const [counters, accuracy] = await Promise.all([liveCounters(db), accuracyByParty(db)]);
	return json({ counters, accuracy });
};
