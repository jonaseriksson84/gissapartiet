import { describe, it, expect } from 'vitest';
import { POST } from './+server';

function makeMockDB() {
	const rows: Record<string, unknown>[] = [];

	const db = {
		prepare: (sql: string) => ({
			bind: (...values: unknown[]) => ({
				run: async () => {
					const cols = ['session_id', 'mp_id', 'guessed_party_id', 'correct_party_id', 'was_correct', 'created_at'];
					const row: Record<string, unknown> = {};
					cols.forEach((col, i) => { row[col] = values[i]; });
					rows.push(row);
					return { success: true };
				}
			})
		}),
		getRows: () => rows
	} as const;

	return db;
}

function makePlatform(db: ReturnType<typeof makeMockDB>) {
	return { env: { DB: db as unknown as App.Platform['env']['DB'] } } as App.Platform;
}

function makeRequest(body: unknown) {
	return new Request('http://localhost/api/event', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

const validPayload = {
	session_id: 'test-session-uuid',
	mp_id: 'mp-001',
	guessed_party_id: 'S',
	correct_party_id: 'S'
};

describe('POST /api/event', () => {
	it('inserts a row on valid payload and returns ok', async () => {
		const db = makeMockDB();
		const response = await POST({
			request: makeRequest(validPayload),
			platform: makePlatform(db)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toEqual({ ok: true });

		const rows = db.getRows();
		expect(rows).toHaveLength(1);
		expect(rows[0].session_id).toBe('test-session-uuid');
		expect(rows[0].mp_id).toBe('mp-001');
		expect(rows[0].guessed_party_id).toBe('S');
		expect(rows[0].correct_party_id).toBe('S');
		expect(rows[0].was_correct).toBe(1);
	});

	it('sets was_correct to 0 when guess is wrong', async () => {
		const db = makeMockDB();
		await POST({
			request: makeRequest({ ...validPayload, guessed_party_id: 'M', correct_party_id: 'S' }),
			platform: makePlatform(db)
		} as Parameters<typeof POST>[0]);

		expect(db.getRows()[0].was_correct).toBe(0);
	});

	it('accepts Partilös as a valid party', async () => {
		const db = makeMockDB();
		const response = await POST({
			request: makeRequest({ ...validPayload, guessed_party_id: 'Partilös', correct_party_id: 'Partilös' }),
			platform: makePlatform(db)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(db.getRows()[0].guessed_party_id).toBe('Partilös');
	});

	it('returns 400 on missing field', async () => {
		const db = makeMockDB();
		const { mp_id: _, ...without_mp } = validPayload;
		const response = await POST({
			request: makeRequest(without_mp),
			platform: makePlatform(db)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(400);
		expect(db.getRows()).toHaveLength(0);
	});

	it('returns 400 on invalid party', async () => {
		const db = makeMockDB();
		const response = await POST({
			request: makeRequest({ ...validPayload, guessed_party_id: 'INVALID' }),
			platform: makePlatform(db)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(400);
	});
});
