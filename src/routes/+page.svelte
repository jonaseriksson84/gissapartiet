<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchMPs } from '$lib/riksdagen';
	import type { Party } from '$lib/riksdagen';
	import { sampleMP } from '$lib/sample';
	import { gameReducer, INITIAL_STATE, DWELL_MS } from '$lib/game-state';
	import { readStats, writeStats, readGuesses, writeGuesses, clear } from '$lib/storage';
	import { playerStats } from '$lib/player-stats';
	import { recentGuesses } from '$lib/recent-guesses';
	import AnswerButtons from '$lib/components/AnswerButtons.svelte';
	import ScoreCards from '$lib/components/ScoreCards.svelte';
	import RecentGuesses from '$lib/components/RecentGuesses.svelte';
	import Polaroid from '$lib/components/Polaroid.svelte';

	const PARTY_NAMES: Record<Party, string> = {
		S: 'Socialdemokraterna', M: 'Moderaterna', SD: 'Sverigedemokraterna',
		V: 'Vänsterpartiet', C: 'Centerpartiet', KD: 'Kristdemokraterna',
		MP: 'Miljöpartiet', L: 'Liberalerna', 'Partilös': 'Partilös'
	};

	let loadStatus = $state<'loading' | 'ready' | 'error'>('loading');
	let statusMessage = $state('Laddar ledamöter…');
	let mps = $state<Awaited<ReturnType<typeof fetchMPs>>>([]);
	let gs = $state(INITIAL_STATE);
	let sessionId = '';
	let dwellTimer: ReturnType<typeof setTimeout> | null = null;
	let prefersReducedMotion = $state(false);
	let nextPhotoUrl = $state('');

	const isCorrect = $derived(gs.guessedParty !== null && gs.guessedParty === gs.correctParty);
	const partyName = $derived(gs.correctParty ? PARTY_NAMES[gs.correctParty] : '');

	onMount(async () => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mq.matches;
		mq.addEventListener('change', (e) => { prefersReducedMotion = e.matches; });

		sessionId = sessionStorage.getItem('session_id') ?? (() => {
			const id = crypto.randomUUID();
			sessionStorage.setItem('session_id', id);
			return id;
		})();

		const saved = readStats(localStorage);
		gs = gameReducer(gs, { type: 'load-stats', stats: saved });
		playerStats.set(gs.stats);

		recentGuesses.set(readGuesses(localStorage));

		try {
			const loaded = await fetchMPs();
			mps = loaded;
			const { mp } = sampleMP(mps);
			gs = gameReducer(gs, { type: 'init', mp });
			statusMessage = `${mps.length} ledamöter inlästa`;
			loadStatus = 'ready';
		} catch {
			statusMessage = 'Kunde inte ladda ledamöter.';
			loadStatus = 'error';
		}
	});

	onDestroy(() => {
		if (dwellTimer) clearTimeout(dwellTimer);
	});

	function handleReset() {
		if (!confirm('Vill du återställa din spelhistorik? Poäng, streak och gissningar raderas.')) return;
		clear(localStorage);
		window.location.reload();
	}

	function handleGuess(guessedParty: Party) {
		if (gs.phase !== 'idle' || !gs.currentMP) return;

		const correctParty = gs.currentMP.party;
		gs = gameReducer(gs, { type: 'guess', guessedParty, correctParty });
		playerStats.set(gs.stats);
		writeStats(gs.stats, localStorage);

		recentGuesses.update((entries) => {
			const updated = [
				{
					mpId: gs.currentMP!.id,
					mpFirstName: gs.currentMP!.firstName,
					mpLastName: gs.currentMP!.lastName,
					photoUrl: gs.currentMP!.photoUrl,
					correctParty,
					guessedParty,
					at: Date.now()
				},
				...entries
			];
			writeGuesses(updated, localStorage);
			return updated;
		});

		fetch('/api/event', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				session_id: sessionId,
				mp_id: gs.currentMP!.id,
				guessed_party_id: guessedParty,
				correct_party_id: correctParty
			})
		}).catch(() => {});

		const { mp: nextMP } = sampleMP(mps);
		nextPhotoUrl = nextMP.photoUrl;
		dwellTimer = setTimeout(() => {
			gs = gameReducer(gs, { type: 'advance', mp: nextMP });
			nextPhotoUrl = '';
			dwellTimer = null;
		}, DWELL_MS);
	}
</script>

<svelte:head>
	<title>Gissa partiet</title>
	{#if gs.phase === 'revealing' && nextPhotoUrl}
		<link rel="preload" as="image" href={nextPhotoUrl} />
	{/if}
</svelte:head>

<main class="flex flex-col items-center px-4 py-4 gap-4">
	{#if loadStatus !== 'ready'}
		<p class="text-muted-foreground text-sm" class:text-destructive={loadStatus === 'error'}>
			{statusMessage}
		</p>
	{/if}

	<div class="w-full max-w-5xl flex flex-col md:flex-row md:items-center md:justify-center md:gap-8 gap-4">
		<div class="w-full max-w-sm mx-auto md:mx-0 md:flex-shrink-0">
			<Polaroid
				mp={gs.currentMP}
				phase={gs.phase}
				{isCorrect}
				{partyName}
				dwellMs={DWELL_MS}
				{prefersReducedMotion}
			/>
		</div>

		{#if loadStatus === 'ready'}
			<div class="w-full max-w-sm mx-auto md:mx-0 md:flex-1 md:max-w-md flex flex-col gap-4">
				<AnswerButtons
					onGuess={handleGuess}
					phase={gs.phase}
					guessedParty={gs.guessedParty}
					correctParty={gs.correctParty}
				/>
				<div class="flex flex-col items-center gap-2 w-full">
					<ScoreCards />
					<button
						type="button"
						onclick={handleReset}
						class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-dotted cursor-pointer transition-colors"
					>
						Återställ
					</button>
				</div>
			</div>
		{/if}
	</div>

	<RecentGuesses entries={$recentGuesses} />
</main>
