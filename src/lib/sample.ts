import type { MP, Party } from './riksdagen';

export interface SampleResult {
	mp: MP;
	correctParty: Party;
}

const REGULAR_PARTIES: Party[] = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'];

function buildStrata(mps: MP[]): Map<Party, MP[]> {
	const strata = new Map<Party, MP[]>(REGULAR_PARTIES.map((p) => [p, []]));
	let partilosIdx = 0;
	for (const mp of mps) {
		if (mp.party !== 'Partilös') {
			strata.get(mp.party)?.push(mp);
		} else {
			// Distribute vildar across the 8 party strata in round-robin order.
			// Their correctParty is still Partilös at scoring time (ADR-0002).
			const target = REGULAR_PARTIES[partilosIdx % REGULAR_PARTIES.length];
			strata.get(target)!.push(mp);
			partilosIdx++;
		}
	}
	return strata;
}

export function sampleMP(mps: MP[], rng: () => number = Math.random): SampleResult {
	const strata = buildStrata(mps);
	const parties = REGULAR_PARTIES.filter((p) => (strata.get(p)?.length ?? 0) > 0);

	const party = parties[Math.floor(rng() * parties.length)];
	const pool = strata.get(party)!;
	const mp = pool[Math.floor(rng() * pool.length)];

	return { mp, correctParty: mp.party };
}
