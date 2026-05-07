<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-svh flex flex-col">
	<header class="border-b border-border px-4 py-3 flex items-center justify-between">
		<a href="/" class="font-semibold tracking-tight hover:text-foreground/80 transition-colors">Gissa partiet</a>
		<div class="flex items-center gap-4">
			<a href="/stats" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
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
