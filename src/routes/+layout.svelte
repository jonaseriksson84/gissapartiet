<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render children()}

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
