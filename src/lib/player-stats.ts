import { writable } from 'svelte/store';
import { DEFAULT_STATS, type PlayerStats } from './storage';

export const playerStats = writable<PlayerStats>({ ...DEFAULT_STATS });
