import type { MP, Party } from './riksdagen';

export const DWELL_MS = 1500;

export type Phase = 'idle' | 'revealing';

export interface GameState {
	phase: Phase;
	currentMP: MP | null;
	guessedParty: Party | null;
	correctParty: Party | null;
}

export type GameAction =
	| { type: 'init'; mp: MP }
	| { type: 'guess'; guessedParty: Party; correctParty: Party }
	| { type: 'advance'; mp: MP }
	| { type: 'reset' };

export const INITIAL_STATE: GameState = {
	phase: 'idle',
	currentMP: null,
	guessedParty: null,
	correctParty: null
};

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case 'init':
			if (state.phase !== 'idle') return state;
			return { ...INITIAL_STATE, currentMP: action.mp };

		case 'guess':
			if (state.phase !== 'idle') return state;
			return {
				...state,
				phase: 'revealing',
				guessedParty: action.guessedParty,
				correctParty: action.correctParty
			};

		case 'advance':
			if (state.phase !== 'revealing') return state;
			return { phase: 'idle', currentMP: action.mp, guessedParty: null, correctParty: null };

		case 'reset':
			return INITIAL_STATE;
	}
}
