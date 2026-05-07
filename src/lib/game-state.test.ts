import { describe, it, expect } from 'vitest';
import { gameReducer, INITIAL_STATE, DEFAULT_STATS, type GameState, type GameAction } from './game-state';
import type { MP } from './riksdagen';

function mp(id: string): MP {
	return { id, firstName: 'A', lastName: 'B', party: 'S', photoUrl: '' };
}

const MP_A = mp('a');
const MP_B = mp('b');

const IDLE: GameState = { phase: 'idle', currentMP: MP_A, guessedParty: null, correctParty: null, stats: DEFAULT_STATS };
const REVEALING: GameState = { phase: 'revealing', currentMP: MP_A, guessedParty: 'M', correctParty: 'S', stats: DEFAULT_STATS };

function dispatch(state: GameState, action: GameAction) {
	return gameReducer(state, action);
}

describe('gameReducer – idle phase', () => {
	it('init sets currentMP and stays idle', () => {
		const next = dispatch(INITIAL_STATE, { type: 'init', mp: MP_A });
		expect(next.phase).toBe('idle');
		expect(next.currentMP).toBe(MP_A);
		expect(next.guessedParty).toBeNull();
		expect(next.correctParty).toBeNull();
	});

	it('guess transitions idle → revealing and records parties', () => {
		const next = dispatch(IDLE, { type: 'guess', guessedParty: 'M', correctParty: 'S' });
		expect(next.phase).toBe('revealing');
		expect(next.currentMP).toBe(MP_A);
		expect(next.guessedParty).toBe('M');
		expect(next.correctParty).toBe('S');
	});

	it('advance is a no-op when idle', () => {
		const next = dispatch(IDLE, { type: 'advance', mp: MP_B });
		expect(next).toEqual(IDLE);
	});

	it('reset from idle returns initial state', () => {
		const next = dispatch(IDLE, { type: 'reset' });
		expect(next).toEqual(INITIAL_STATE);
	});
});

describe('gameReducer – revealing phase', () => {
	it('init is a no-op when revealing', () => {
		const next = dispatch(REVEALING, { type: 'init', mp: MP_B });
		expect(next).toEqual(REVEALING);
	});

	it('guess is a no-op when revealing (buttons inert)', () => {
		const next = dispatch(REVEALING, { type: 'guess', guessedParty: 'V', correctParty: 'S' });
		expect(next).toEqual(REVEALING);
	});

	it('advance transitions revealing → idle with new MP', () => {
		const next = dispatch(REVEALING, { type: 'advance', mp: MP_B });
		expect(next.phase).toBe('idle');
		expect(next.currentMP).toBe(MP_B);
		expect(next.guessedParty).toBeNull();
		expect(next.correctParty).toBeNull();
	});

	it('reset from revealing returns initial state', () => {
		const next = dispatch(REVEALING, { type: 'reset' });
		expect(next).toEqual(INITIAL_STATE);
	});
});

describe('gameReducer – score / streak / best', () => {
	it('correct guess increments correct, total, and streak', () => {
		const next = dispatch(IDLE, { type: 'guess', guessedParty: 'S', correctParty: 'S' });
		expect(next.stats).toEqual({ correct: 1, total: 1, streak: 1, best: 1 });
	});

	it('wrong guess increments total only and resets streak', () => {
		const next = dispatch(IDLE, { type: 'guess', guessedParty: 'M', correctParty: 'S' });
		expect(next.stats).toEqual({ correct: 0, total: 1, streak: 0, best: 0 });
	});

	it('streak accumulates across correct guesses', () => {
		const s0 = { ...IDLE, stats: { correct: 2, total: 2, streak: 2, best: 2 } };
		const s1 = dispatch(s0, { type: 'guess', guessedParty: 'S', correctParty: 'S' });
		expect(s1.stats.streak).toBe(3);
		expect(s1.stats.best).toBe(3);
	});

	it('wrong guess resets streak but preserves best', () => {
		const s0 = { ...IDLE, stats: { correct: 5, total: 5, streak: 5, best: 5 } };
		const s1 = dispatch(s0, { type: 'guess', guessedParty: 'M', correctParty: 'S' });
		expect(s1.stats.streak).toBe(0);
		expect(s1.stats.best).toBe(5);
	});

	it('best does not update when new streak is lower', () => {
		const s0 = { ...IDLE, stats: { correct: 3, total: 3, streak: 3, best: 10 } };
		const s1 = dispatch(s0, { type: 'guess', guessedParty: 'S', correctParty: 'S' });
		expect(s1.stats.best).toBe(10);
	});

	it('load-stats restores persisted stats', () => {
		const saved = { correct: 7, total: 10, streak: 3, best: 6 };
		const next = dispatch(INITIAL_STATE, { type: 'load-stats', stats: saved });
		expect(next.stats).toEqual(saved);
	});

	it('reset clears stats back to defaults', () => {
		const s0 = { ...IDLE, stats: { correct: 5, total: 8, streak: 2, best: 5 } };
		const next = dispatch(s0, { type: 'reset' });
		expect(next.stats).toEqual(DEFAULT_STATS);
	});

	it('init preserves stats from current state', () => {
		const s0 = { ...IDLE, stats: { correct: 3, total: 5, streak: 1, best: 3 } };
		const next = dispatch(s0, { type: 'init', mp: MP_B });
		expect(next.stats).toEqual(s0.stats);
	});
});
