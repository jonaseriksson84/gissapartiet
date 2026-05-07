import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_PARTIES = new Set(['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L', 'Partilös']);

interface EventPayload {
	session_id: string;
	mp_id: string;
	guessed_party_id: string;
	correct_party_id: string;
}

function isValidPayload(body: unknown): body is EventPayload {
	if (typeof body !== 'object' || body === null) return false;
	const b = body as Record<string, unknown>;
	return (
		typeof b.session_id === 'string' && b.session_id.length > 0 &&
		typeof b.mp_id === 'string' && b.mp_id.length > 0 &&
		typeof b.guessed_party_id === 'string' && VALID_PARTIES.has(b.guessed_party_id) &&
		typeof b.correct_party_id === 'string' && VALID_PARTIES.has(b.correct_party_id)
	);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const body: unknown = await request.json();

	if (!isValidPayload(body)) {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	const { session_id, mp_id, guessed_party_id, correct_party_id } = body;
	const was_correct = guessed_party_id === correct_party_id ? 1 : 0;
	const created_at = new Date().toISOString();

	await platform!.env.DB.prepare(
		`INSERT INTO events (session_id, mp_id, guessed_party_id, correct_party_id, was_correct, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	)
		.bind(session_id, mp_id, guessed_party_id, correct_party_id, was_correct, created_at)
		.run();

	return json({ ok: true });
};
