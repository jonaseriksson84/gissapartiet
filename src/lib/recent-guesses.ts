import { writable } from 'svelte/store';
import type { GuessEntry } from './storage';

export const recentGuesses = writable<GuessEntry[]>([]);
