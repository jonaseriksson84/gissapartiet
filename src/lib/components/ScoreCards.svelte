<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from '$lib/components/ui/card';
	import { playerStats } from '$lib/player-stats';

	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mq.matches;
		mq.addEventListener('change', (e) => { prefersReducedMotion = e.matches; });
	});

	let correctPulse = $state(false);
	let streakPulse = $state(false);
	let bestPulse = $state(false);

	let prevStats = { correct: 0, total: 0, streak: 0, best: 0 };

	$effect(() => {
		const stats = $playerStats;
		if (stats.correct !== prevStats.correct || stats.total !== prevStats.total) {
			if (!prefersReducedMotion) {
				correctPulse = true;
				setTimeout(() => { correctPulse = false; }, 400);
			}
		}
		if (stats.streak !== prevStats.streak) {
			if (!prefersReducedMotion) {
				streakPulse = true;
				setTimeout(() => { streakPulse = false; }, 400);
			}
		}
		if (stats.best !== prevStats.best) {
			if (!prefersReducedMotion) {
				bestPulse = true;
				setTimeout(() => { bestPulse = false; }, 400);
			}
		}
		prevStats = { ...stats };
	});
</script>

<div class="flex gap-3 w-full max-w-xs">
	<Card class="score-lead flex-1 flex flex-col items-center py-3 px-2 text-center {correctPulse ? 'score-pulse' : ''}">
		<span class="font-mono font-semibold text-lg leading-tight tabular-nums">{$playerStats.correct}/{$playerStats.total}</span>
		<span class="text-[10px] uppercase tracking-wide mt-0.5 opacity-70">Rätt</span>
	</Card>

	<Card class="flex-1 flex flex-col items-center py-3 px-2 text-center {streakPulse ? 'score-pulse' : ''}">
		<span class="font-mono font-semibold text-lg leading-tight tabular-nums">{$playerStats.streak}</span>
		<span class="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">I rad</span>
	</Card>

	<Card class="flex-1 flex flex-col items-center py-3 px-2 text-center {bestPulse ? 'score-pulse' : ''}">
		<span class="font-mono font-semibold text-lg leading-tight tabular-nums">{$playerStats.best}</span>
		<span class="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Bäst</span>
	</Card>
</div>
