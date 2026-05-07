import type { MP, Party } from './riksdagen';
import { type PlayerStats, DEFAULT_STATS } from './storage';

export { type PlayerStats, DEFAULT_STATS } from './storage';

export const DWELL_MS = 1500;

export type Phase = 'idle' | 'revealing';

export interface GameState {
	phase: Phase;
	currentMP: MP | null;
	guessedParty: Party | null;
	correctParty: Party | null;
	stats: PlayerStats;
}

export type GameAction =
	| { type: 'init'; mp: MP }
	| { type: 'guess'; guessedParty: Party; correctParty: Party }
	| { type: 'advance'; mp: MP }
	| { type: 'reset' }
	| { type: 'load-stats'; stats: PlayerStats };

export const INITIAL_STATE: GameState = {
	phase: 'idle',
	currentMP: null,
	guessedParty: null,
	correctParty: null,
	stats: DEFAULT_STATS
};

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case 'init':
			if (state.phase !== 'idle') return state;
			return { ...INITIAL_STATE, currentMP: action.mp, stats: state.stats };

		case 'guess': {
			if (state.phase !== 'idle') return state;
			const isCorrect = action.guessedParty === action.correctParty;
			const newStreak = isCorrect ? state.stats.streak + 1 : 0;
			return {
				...state,
				phase: 'revealing',
				guessedParty: action.guessedParty,
				correctParty: action.correctParty,
				stats: {
					correct: state.stats.correct + (isCorrect ? 1 : 0),
					total: state.stats.total + 1,
					streak: newStreak,
					best: Math.max(state.stats.best, newStreak)
				}
			};
		}

		case 'advance':
			if (state.phase !== 'revealing') return state;
			return { ...state, phase: 'idle', currentMP: action.mp, guessedParty: null, correctParty: null };

		case 'reset':
			return INITIAL_STATE;

		case 'load-stats':
			return { ...state, stats: action.stats };
	}
}
