import { describe, it, expect } from 'vitest';
import { gameReducer, INITIAL_STATE, type GameState, type GameAction } from './game-state';
import type { MP } from './riksdagen';

function mp(id: string): MP {
	return { id, firstName: 'A', lastName: 'B', party: 'S', photoUrl: '' };
}

const MP_A = mp('a');
const MP_B = mp('b');

const IDLE: GameState = { phase: 'idle', currentMP: MP_A, guessedParty: null, correctParty: null };
const REVEALING: GameState = { phase: 'revealing', currentMP: MP_A, guessedParty: 'M', correctParty: 'S' };

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
