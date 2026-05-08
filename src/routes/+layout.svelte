<script lang="ts">
	import './layout.css';
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

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#FECC02" />
</svelte:head>

<div class="min-h-svh flex flex-col">
	<header class="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-3 shrink-0">
			<a href="/" class="font-semibold tracking-tight hover:text-foreground/80 transition-colors">Gissa partiet</a>
			<a href="/stats" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
		</div>

		<div class="order-last w-full grid grid-cols-[1fr_auto_1fr] items-center text-sm tabular-nums sm:order-none sm:w-auto sm:flex sm:gap-3">
			<div></div>

			<div class="flex items-center gap-3 justify-self-center sm:justify-self-auto sm:contents">
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

			<Button
				variant="ghost"
				size="sm"
				onclick={handleReset}
				class="text-muted-foreground text-xs px-2 justify-self-end sm:justify-self-auto"
			>
				Återställ
			</Button>
		</div>

		<div class="flex items-center gap-2 shrink-0">
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
