import type { PageServerLoad } from './$types';
import {
	liveCounters,
	accuracyByParty,
	confusionMatrix,
	misidentificationByParty
} from '$lib/server/aggregations';
import { fetchMPs } from '$lib/riksdagen';

export const load: PageServerLoad = async ({ platform, fetch }) => {
	const db = platform!.env.DB;
	const [counters, accuracy, matrix, misidentRaw, mps] = await Promise.all([
		liveCounters(db),
		accuracyByParty(db),
		confusionMatrix(db),
		misidentificationByParty(db),
		fetchMPs(fetch)
	]);

	const mpMap = new Map(mps.map((mp) => [mp.id, mp]));

	const misidentification = misidentRaw.map((entry) => {
		const mp = mpMap.get(entry.mpId);
		return {
			guessedParty: entry.guessedParty,
			mpId: entry.mpId,
			actualParty: entry.actualParty,
			count: entry.count,
			name: mp ? `${mp.firstName} ${mp.lastName}` : entry.mpId,
			photoUrl: mp?.photoUrl ?? null
		};
	});

	return { counters, accuracy, matrix, misidentification };
};
