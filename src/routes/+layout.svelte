<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { playerStats } from '$lib/player-stats';
	import { clear } from '$lib/storage';

	let { children } = $props();

	function handleReset() {
		if (!confirm('Vill du återställa din spelhistorik? Poäng, streak och gissningar raderas.')) return;
		clear(localStorage);
		window.location.reload();
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-svh flex flex-col">
	<header class="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
		<div class="flex items-center gap-3 shrink-0">
			<a href="/" class="font-semibold tracking-tight hover:text-foreground/80 transition-colors">Gissa partiet</a>
			<a href="/stats" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
		</div>

		<div class="flex items-center gap-3 text-sm tabular-nums">
			<span class="flex flex-col items-center leading-tight">
				<span class="font-semibold">{$playerStats.correct}/{$playerStats.total}</span>
				<span class="text-[10px] text-muted-foreground uppercase tracking-wide">Rätt</span>
			</span>
			<span class="text-border">|</span>
			<span class="flex flex-col items-center leading-tight">
				<span class="font-semibold">{$playerStats.streak}</span>
				<span class="text-[10px] text-muted-foreground uppercase tracking-wide">Rad</span>
			</span>
			<span class="text-border">|</span>
			<span class="flex flex-col items-center leading-tight">
				<span class="font-semibold">{$playerStats.best}</span>
				<span class="text-[10px] text-muted-foreground uppercase tracking-wide">Bäst</span>
			</span>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<Button variant="ghost" size="sm" onclick={handleReset} class="text-muted-foreground text-xs px-2">
				Återställ
			</Button>
			<DarkModeToggle />
		</div>
	</header>

	<div class="flex-1">
		{@render children()}
	</div>

	<footer class="py-4 text-center text-xs text-muted-foreground space-y-1">
		<p>Foto: Sveriges riksdag · Källa: data.riksdagen.se</p>
		<p>
			Skamlöst inspirerad av <a
				href="https://guesstheparty.co.uk"
				class="underline underline-offset-2 hover:text-foreground transition-colors"
				target="_blank"
				rel="noopener noreferrer">guesstheparty.co.uk</a
			>
		</p>
	</footer>
</div>
