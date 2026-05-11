<script lang="ts">
	import './layout.css';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { clear } from '$lib/storage';

	let { children } = $props();

	function handleReset() {
		if (!confirm('Vill du återställa din spelhistorik? Poäng, streak och gissningar raderas.')) return;
		clear(localStorage);
		window.location.reload();
	}

	const PARTY_COLORS = [
		'#ED1B34', /* S */
		'#1C3D80', /* M */
		'#006AA7', /* SD */
		'#DA001A', /* V */
		'#009933', /* C */
		'#234F8C', /* KD */
		'#83B22F', /* MP */
		'#006AB3', /* L */
		'#64748b'  /* Partilös */
	];

	const step = 360 / PARTY_COLORS.length;
	const logoDot = `conic-gradient(from 0deg, ${PARTY_COLORS.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`;
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#f7f3ee" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#2c2318" media="(prefers-color-scheme: dark)" />

	<meta
		name="description"
		content="Kan du gissa rätt parti utifrån bilden? En quiz med Sveriges riksdagsledamöter — skamlöst inspirerad av guesstheparty.co.uk."
	/>

	<meta property="og:type" content="website" />
	<meta property="og:locale" content="sv_SE" />
	<meta property="og:site_name" content="Gissa partiet" />
	<meta property="og:title" content="Gissa partiet" />
	<meta
		property="og:description"
		content="Kan du gissa rätt parti utifrån bilden? En quiz med Sveriges riksdagsledamöter."
	/>
	<meta property="og:url" content="https://gissapartiet.se" />
	<meta property="og:image" content="https://gissapartiet.se/android-chrome-512x512.png" />
	<meta property="og:image:width" content="512" />
	<meta property="og:image:height" content="512" />

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Gissa partiet" />
	<meta
		name="twitter:description"
		content="Kan du gissa rätt parti utifrån bilden? En quiz med Sveriges riksdagsledamöter."
	/>
	<meta name="twitter:image" content="https://gissapartiet.se/android-chrome-512x512.png" />
</svelte:head>

<div class="min-h-svh flex flex-col">
	<header class="px-4 py-2.5 flex items-center justify-between gap-3">
		<a href="/" class="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
			<span class="size-6 rounded-full shrink-0" style="background: {logoDot}"></span>
			<span class="font-serif font-semibold text-base leading-none">Gissa <em class="not-italic" style="color: var(--coral); font-style: italic;">partiet</em></span>
		</a>

		<div class="flex items-center gap-2 shrink-0">
			<a href="/stats" class="header-chip">Stats</a>
			<button type="button" onclick={handleReset} class="header-chip cursor-pointer">Återställ</button>
			<div class="header-chip">
				<DarkModeToggle />
			</div>
		</div>
	</header>

	<div class="h-px bg-border"></div>

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
