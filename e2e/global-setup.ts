import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const wrangler = path.join(root, 'node_modules', '.bin', 'wrangler');

function exec(args: string[]) {
	execFileSync(wrangler, args, { cwd: root, stdio: 'pipe' });
}

function buildSeedSql(): string {
	const parties = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'];
	const rows: string[] = ['DELETE FROM events;'];
	let sessionNum = 0;

	for (const party of parties) {
		const nextParty = parties[(parties.indexOf(party) + 1) % parties.length];

		for (let mpIdx = 1; mpIdx <= 2; mpIdx++) {
			const mpId = `test_${party}_${mpIdx}`;
			const correctCount = mpIdx === 1 ? 15 : 5;

			for (let i = 0; i < 20; i++) {
				const isCorrect = i < correctCount;
				const guessedParty = isCorrect ? party : nextParty;
				sessionNum++;
				rows.push(
					`INSERT INTO events (session_id, mp_id, guessed_party_id, correct_party_id, was_correct, created_at) ` +
						`VALUES ('sess${sessionNum}', '${mpId}', '${guessedParty}', '${party}', ${isCorrect ? 1 : 0}, '2026-01-01T00:00:00.000Z');`
				);
			}
		}
	}

	return rows.join('\n');
}

export default async function globalSetup() {
	exec(['d1', 'migrations', 'apply', 'gissapartiet', '--local']);

	const sql = buildSeedSql();
	const sqlFile = path.join(tmpdir(), 'gissapartiet-seed.sql');
	writeFileSync(sqlFile, sql, 'utf8');

	exec(['d1', 'execute', 'gissapartiet', '--local', '--file', sqlFile]);
}
