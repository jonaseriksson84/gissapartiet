export type Party = 'S' | 'M' | 'SD' | 'V' | 'C' | 'KD' | 'MP' | 'L' | 'Partilös';

export const PARTIES: Party[] = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L', 'Partilös'];

export interface MP {
	id: string;
	firstName: string;
	lastName: string;
	party: Party;
	photoUrl: string;
}

interface RawPerson {
	intressent_id: string;
	tilltalsnamn: string;
	efternamn: string;
	parti: string;
	bild_url_192: string;
	bild_url_max: string;
}

interface PersonlistaResponse {
	personlista: {
		person: RawPerson | RawPerson[];
	};
}

const API_URL =
	'https://data.riksdagen.se/personlista/?rdlaktiv=tjst&utformat=json';

function normalizeParty(parti: string): Party {
	const known: Party[] = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'];
	return known.includes(parti as Party) ? (parti as Party) : 'Partilös';
}

export async function fetchMPs(fetchFn: typeof fetch = fetch): Promise<MP[]> {
	const response = await fetchFn(API_URL);
	if (!response.ok) {
		throw new Error(`Riksdagen API error: ${response.status}`);
	}
	const data: PersonlistaResponse = await response.json();
	const raw = data.personlista.person;
	const persons = Array.isArray(raw) ? raw : [raw];

	return persons
		.filter((p) => !!p.bild_url_192)
		.map((p) => ({
			id: p.intressent_id,
			firstName: p.tilltalsnamn,
			lastName: p.efternamn,
			party: normalizeParty(p.parti),
			photoUrl: p.bild_url_192
		}));
}

export function groupByParty(mps: MP[]): Map<Party, MP[]> {
	const groups = new Map<Party, MP[]>();
	for (const mp of mps) {
		const bucket = groups.get(mp.party) ?? [];
		bucket.push(mp);
		groups.set(mp.party, bucket);
	}
	return groups;
}
