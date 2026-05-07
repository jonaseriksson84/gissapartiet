import type { PageServerLoad } from './$types';
import { liveCounters, accuracyByParty } from '$lib/server/aggregations';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const [counters, accuracy] = await Promise.all([liveCounters(db), accuracyByParty(db)]);
	return { counters, accuracy };
};
