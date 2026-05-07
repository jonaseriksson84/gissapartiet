import { describe, it, expect, vi } from 'vitest';
import { fetchMPs, groupByParty } from './riksdagen';

function makeRawPerson(overrides: Partial<{
	intressent_id: string;
	tilltalsnamn: string;
	efternamn: string;
	parti: string;
	bild_url_192: string;
	bild_url_max: string;
}> = {}) {
	const id = overrides.intressent_id ?? 'id-001';
	return {
		intressent_id: id,
		tilltalsnamn: 'Anna',
		efternamn: 'Svensson',
		parti: 'S',
		bild_url_192: `https://data.riksdagen.se/filarkiv/bilder/ledamot/${id}_192.jpg`,
		bild_url_max: `https://data.riksdagen.se/filarkiv/bilder/ledamot/${id}_max.jpg`,
		...overrides
	};
}

function makeResponse(persons: object | object[]) {
	return {
		personlista: {
			person: persons
		}
	};
}

function mockFetch(body: unknown, status = 200): typeof fetch {
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body)
	}) as unknown as typeof fetch;
}

describe('fetchMPs', () => {
	it('returns mapped MPs on happy path', async () => {
		const fetch = mockFetch(makeResponse([
			makeRawPerson({ intressent_id: 'abc', tilltalsnamn: 'Anna', efternamn: 'Berg', parti: 'S' }),
			makeRawPerson({ intressent_id: 'def', tilltalsnamn: 'Bo', efternamn: 'Ek', parti: 'M' })
		]));
		const mps = await fetchMPs(fetch);
		expect(mps).toHaveLength(2);
		expect(mps[0]).toEqual({
			id: 'abc',
			firstName: 'Anna',
			lastName: 'Berg',
			party: 'S',
			photoUrl: expect.stringContaining('abc_192.jpg')
		});
		expect(mps[1].party).toBe('M');
	});

	it('filters out MPs with no photo', async () => {
		const fetch = mockFetch(makeResponse([
			makeRawPerson({ bild_url_192: '' }),
			makeRawPerson({ intressent_id: 'with-photo', bild_url_192: 'https://example.com/photo.jpg' })
		]));
		const mps = await fetchMPs(fetch);
		expect(mps).toHaveLength(1);
		expect(mps[0].id).toBe('with-photo');
	});

	it('normalizes unknown party to Partilös', async () => {
		const fetch = mockFetch(makeResponse([
			makeRawPerson({ parti: '-' }),
			makeRawPerson({ intressent_id: 'x2', parti: 'XX' })
		]));
		const mps = await fetchMPs(fetch);
		expect(mps[0].party).toBe('Partilös');
		expect(mps[1].party).toBe('Partilös');
	});

	it('handles single person object (not array) in response', async () => {
		const fetch = mockFetch(makeResponse(makeRawPerson({ intressent_id: 'solo' })));
		const mps = await fetchMPs(fetch);
		expect(mps).toHaveLength(1);
		expect(mps[0].id).toBe('solo');
	});

	it('throws on non-ok HTTP response', async () => {
		const fetch = mockFetch({}, 500);
		await expect(fetchMPs(fetch)).rejects.toThrow('Riksdagen API error: 500');
	});

	it('propagates network errors', async () => {
		const failingFetch = vi.fn().mockRejectedValue(new Error('Network failure')) as unknown as typeof globalThis.fetch;
		await expect(fetchMPs(failingFetch)).rejects.toThrow('Network failure');
	});

	it('preserves all 8 known party codes unchanged', async () => {
		const parties = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'];
		const fetch = mockFetch(makeResponse(
			parties.map((p, i) => makeRawPerson({ intressent_id: `id-${i}`, parti: p }))
		));
		const mps = await fetchMPs(fetch);
		expect(mps.map((m) => m.party)).toEqual(parties);
	});
});

describe('groupByParty', () => {
	it('groups MPs by party', () => {
		const mps = [
			{ id: '1', firstName: 'A', lastName: 'B', party: 'S' as const, photoUrl: '' },
			{ id: '2', firstName: 'C', lastName: 'D', party: 'M' as const, photoUrl: '' },
			{ id: '3', firstName: 'E', lastName: 'F', party: 'S' as const, photoUrl: '' }
		];
		const groups = groupByParty(mps);
		expect(groups.get('S')).toHaveLength(2);
		expect(groups.get('M')).toHaveLength(1);
		expect(groups.get('V')).toBeUndefined();
	});

	it('returns empty map for empty input', () => {
		expect(groupByParty([])).toEqual(new Map());
	});
});
